from flask import Flask, request, jsonify
from flask_cors import CORS

from database import (
    customers_collection,
    employees_collection,
    tickets_collection
)

import joblib
import os
from scipy.sparse import hstack
from datetime import datetime, timezone
from bson import ObjectId


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "https://intelliroute-ai-production.up.railway.app"
    ],
    supports_credentials=True
)


# ============================================================
# UTC TIME HELPERS
# ============================================================

def utc_now_iso():
    """
    Return the current UTC time as an ISO 8601 string.

    Example:
    2026-08-13T10:22:35.123456Z
    """

    return (
        datetime.now(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def utc_now_datetime():
    """
    Return the current UTC datetime object.
    Useful for MongoDB date fields.
    """

    return datetime.now(timezone.utc)


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


# ============================================================
# LOAD SAVED MODELS
# ============================================================

type_vectorizer = joblib.load(
    os.path.join(
        MODEL_DIR,
        "type_vectorizer.pkl"
    )
)

type_model = joblib.load(
    os.path.join(
        MODEL_DIR,
        "type_model.pkl"
    )
)


priority_word_vectorizer = joblib.load(
    os.path.join(
        MODEL_DIR,
        "priority_word_vectorizer.pkl"
    )
)

priority_char_vectorizer = joblib.load(
    os.path.join(
        MODEL_DIR,
        "priority_char_vectorizer.pkl"
    )
)

priority_model = joblib.load(
    os.path.join(
        MODEL_DIR,
        "priority_model.pkl"
    )
)


department_word_vectorizer = joblib.load(
    os.path.join(
        MODEL_DIR,
        "department_word_vectorizer.pkl"
    )
)

department_char_vectorizer = joblib.load(
    os.path.join(
        MODEL_DIR,
        "department_char_vectorizer.pkl"
    )
)

department_model = joblib.load(
    os.path.join(
        MODEL_DIR,
        "department_model.pkl"
    )
)


print("All ML models loaded successfully.")


# ============================================================
# DEPARTMENT BUSINESS RULES
# ============================================================

def apply_department_rules(
    subject,
    description,
    predicted_department
):

    text = (
        str(subject) + " " +
        str(description)
    ).lower()


    it_keywords = [
        "company email",
        "email account",
        "email access",
        "cannot access email",
        "unable to access email",
        "password",
        "login",
        "log in",
        "sign in",
        "account access",
        "account login",
        "wifi",
        "wi-fi",
        "network connection",
        "printer",
        "computer",
        "laptop",
        "desktop",
        "server",
        "software installation"
    ]


    billing_keywords = [
        "payment",
        "paid",
        "billing",
        "invoice",
        "charged",
        "charge",
        "refund",
        "money deducted",
        "deducted from",
        "transaction",
        "billing statement",
        "payment failed",
        "payment issue"
    ]


    product_keywords = [
        "product is not working",
        "product not working",
        "product malfunction",
        "product stopped working",
        "product issue",
        "product problem",
        "device is not working",
        "device not working"
    ]


    if any(
        keyword in text
        for keyword in billing_keywords
    ):
        return "Billing and Payments"


    if any(
        keyword in text
        for keyword in product_keywords
    ):
        return "Product Support"


    if any(
        keyword in text
        for keyword in it_keywords
    ):
        return "IT Support"


    return predicted_department


# ============================================================
# EMPLOYEE ASSIGNMENT
# ============================================================

def get_active_employees(department):
    """
    Return active employees for a department.

    Workload is the primary routing criterion.
    activated_at is the tie-breaker when workloads are equal.
    """

    employees = list(
        employees_collection.find(
            {
                "department": department,
                "active": True
            }
        )
    )

    def sort_key(employee):
        workload = int(
            employee.get(
                "active_tickets",
                0
            ) or 0
        )

        activated_at = employee.get(
            "activated_at"
        )

        # Employees without activated_at are placed after
        # employees that have a known availability time.
        if activated_at is None:
            activation_timestamp = float("inf")
        elif hasattr(
            activated_at,
            "timestamp"
        ):
            activation_timestamp = activated_at.timestamp()
        else:
            activation_timestamp = float("inf")

        return (
            workload,
            activation_timestamp,
            str(employee.get("_id", ""))
        )

    employees.sort(
        key=sort_key
    )

    return employees


def assign_employee(department):
    """
    Select the active employee with the lowest workload.

    If multiple active employees have the same workload,
    the employee who became active first is preferred.
    """

    employees = get_active_employees(
        department
    )


    if not employees:
        return None, None


    employee = employees[0]

    current_workload = int(
        employee.get(
            "active_tickets",
            0
        ) or 0
    )


    return (
        employee["name"],
        current_workload
    )


# ============================================================
# PENDING TICKET ASSIGNMENT
# ============================================================

def assign_pending_tickets(department):
    """
    Assign all pending tickets for a department whenever
    active employees are available.

    Rules:
    1. Only active employees can receive tickets.
    2. Lowest workload is preferred.
    3. If workloads are equal, earlier activated employee wins.
    4. Older pending tickets are assigned first.
    """

    pending_tickets = list(
        tickets_collection.find(
            {
                "department": department,
                "status": "Pending Assignment",
                "assigned_employee": None
            }
        ).sort(
            "created_at",
            1
        )
    )


    if not pending_tickets:
        return []


    assigned_tickets = []


    for ticket in pending_tickets:

        employee, current_workload = (
            assign_employee(
                department
            )
        )


        if not employee:
            break


        new_workload = (
            current_workload + 1
        )


        # ----------------------------------------------------
        # Update employee workload
        # ----------------------------------------------------

        workload_update = (
            employees_collection.update_one(
                {
                    "name": employee,
                    "department": department,
                    "active": True
                },
                {
                    "$inc": {
                        "active_tickets": 1
                    }
                }
            )
        )


        if workload_update.modified_count == 0:
            # The employee may have become inactive between
            # selection and update. Try the next pending ticket
            # on the next pass/request.
            continue


        # ----------------------------------------------------
        # Assign ticket
        # ----------------------------------------------------

        tickets_collection.update_one(
            {
                "_id": ticket["_id"],
                "assigned_employee": None,
                "status": "Pending Assignment"
            },
            {
                "$set": {
                    "assigned_employee": employee,
                    "employee_workload": new_workload,
                    "status": "Assigned",
                    "assigned_at": utc_now_datetime()
                }
            }
        )


        assigned_tickets.append({
            "ticket_id": str(
                ticket["_id"]
            ),
            "subject": ticket.get(
                "subject",
                ""
            ),
            "department": department,
            "assigned_employee": employee,
            "employee_workload": new_workload
        })


    return assigned_tickets


# ============================================================
# TICKET PREDICTION
# ============================================================

def predict_ticket(
    subject,
    description
):

    text = (
        str(subject).strip() + " " +
        str(description).strip()
    )


    # --------------------------------------------------------
    # TYPE
    # --------------------------------------------------------

    type_features = type_vectorizer.transform(
        [text]
    )

    predicted_type = type_model.predict(
        type_features
    )[0]


    # --------------------------------------------------------
    # PRIORITY
    # --------------------------------------------------------

    priority_word = (
        priority_word_vectorizer.transform(
            [text]
        )
    )

    priority_char = (
        priority_char_vectorizer.transform(
            [text]
        )
    )

    priority_features = hstack([
        priority_word,
        priority_char
    ])

    predicted_priority = (
        priority_model.predict(
            priority_features
        )[0]
    )


    # --------------------------------------------------------
    # DEPARTMENT
    # --------------------------------------------------------

    department_word = (
        department_word_vectorizer.transform(
            [text]
        )
    )

    department_char = (
        department_char_vectorizer.transform(
            [text]
        )
    )

    department_features = hstack([
        department_word * 2.5,
        department_char
    ])

    ml_department = department_model.predict(
        department_features
    )[0]


    final_department = apply_department_rules(
        subject,
        description,
        ml_department
    )


    return (
        predicted_type,
        predicted_priority,
        final_department
    )


# ============================================================
# CREATE TICKET / AI ROUTING
# ============================================================

@app.route(
    "/api/predict",
    methods=["POST"]
)
def predict():

    data = request.get_json() or {}


    subject = data.get(
        "subject",
        ""
    ).strip()

    description = data.get(
        "description",
        ""
    ).strip()

    customer = data.get(
        "customer",
        ""
    ).strip()

    customer_email = data.get(
        "customer_email",
        ""
    ).strip().lower()


    if (
        not subject
        or not description
        or not customer
        or not customer_email
    ):
        return jsonify({
            "error":
                "Subject, description, customer and customer email are required."
        }), 400


    # --------------------------------------------------------
    # AI PREDICTION
    # --------------------------------------------------------

    ticket_type, priority, department = (
        predict_ticket(
            subject,
            description
        )
    )


    # --------------------------------------------------------
    # EMPLOYEE ASSIGNMENT
    # --------------------------------------------------------

    employee, workload = assign_employee(
        department
    )


    if employee:

        assigned_workload = (
            workload + 1
        )


        # ----------------------------------------------------
        # UPDATE EMPLOYEE WORKLOAD
        # ----------------------------------------------------

        workload_update = (
            employees_collection.update_one(
                {
                    "name": employee,
                    "department": department,
                    "active": True
                },
                {
                    "$inc": {
                        "active_tickets": 1
                    }
                }
            )
        )


        if workload_update.modified_count == 0:

            # Employee became unavailable between selection
            # and update. Create the ticket as pending.
            employee = None
            workload = None

        else:

            workload = assigned_workload


    # --------------------------------------------------------
    # DETERMINE INITIAL STATUS
    # --------------------------------------------------------

    if employee:

        status = "Assigned"

    else:

        status = "Pending Assignment"


    # --------------------------------------------------------
    # CREATE TICKET
    # --------------------------------------------------------

    created_at = utc_now_datetime()


    ticket = {
        "subject": subject,
        "description": description,
        "customer": customer,
        "customer_email": customer_email,
        "type": ticket_type,
        "priority": priority,
        "department": department,
        "assigned_employee": employee,
        "employee_workload": workload,
        "status": status,
        "created_at": created_at,
        "messages": []
    }


    result = tickets_collection.insert_one(
        ticket
    )


    return jsonify({
        "id":
            str(result.inserted_id),

        "_id":
            str(result.inserted_id),

        "subject":
            subject,

        "description":
            description,

        "customer":
            customer,

        "customer_email":
            customer_email,

        "type":
            ticket_type,

        "priority":
            priority,

        "department":
            department,

        "assigned_employee":
            employee,

        "employee_workload":
            workload,

        "status":
            status,

        "created_at":
            utc_now_iso(),

        "message":
            (
                "Ticket assigned successfully."
                if employee
                else
                "No active employee is available. Ticket is pending assignment."
            )

    }), 201


# ============================================================
# EMPLOYEE REGISTRATION
# ============================================================

@app.route(
    "/api/employee/register",
    methods=["POST"]
)
def employee_register():

    data = request.get_json() or {}


    name = data.get(
        "name",
        ""
    ).strip()

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    department = data.get(
        "department",
        ""
    ).strip()


    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not name:
        return jsonify({
            "error":
                "Name is required."
        }), 400


    if not email or "@" not in email:
        return jsonify({
            "error":
                "A valid email is required."
        }), 400


    if len(password) < 4:
        return jsonify({
            "error":
                "Password must contain at least 4 characters."
        }), 400


    if not department:
        return jsonify({
            "error":
                "Department is required."
        }), 400


    # --------------------------------------------------------
    # CHECK EXISTING EMPLOYEE
    # --------------------------------------------------------

    existing_employee = (
        employees_collection.find_one(
            {
                "email":
                    email
            }
        )
    )


    if existing_employee:

        return jsonify({
            "error":
                "An employee account with this email already exists."
        }), 409


    # --------------------------------------------------------
    # CREATE EMPLOYEE
    # --------------------------------------------------------

    created_at = utc_now_datetime()

    employee = {
        "name":
            name,

        "email":
            email,

        "password":
            password,

        "department":
            department,

        "role":
            "employee",

        "active":
            True,

        "active_tickets":
            0,

        "activated_at":
            created_at,

        "created_at":
            created_at
    }


    result = (
        employees_collection.insert_one(
            employee
        )
    )


    return jsonify({
        "message":
            "Employee account created successfully.",

        "id":
            str(result.inserted_id),

        "name":
            name,

        "email":
            email,

        "department":
            department,

        "role":
            "employee"

    }), 201


# ============================================================
# EMPLOYEE LOGIN / COME ONLINE
# ============================================================

@app.route(
    "/api/employee/login",
    methods=["POST"]
)
def employee_login():

    data = request.get_json() or {}


    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )


    if not email or not password:

        return jsonify({
            "error":
                "Email and password are required."
        }), 400


    # --------------------------------------------------------
    # Find account by credentials.
    #
    # active is NOT used as a login restriction here.
    # active represents availability/online status.
    # --------------------------------------------------------

    employee = (
        employees_collection.find_one(
            {
                "email":
                    email,

                "password":
                    password
            }
        )
    )


    if not employee:

        return jsonify({
            "error":
                "Invalid employee email or password."
        }), 401


    # --------------------------------------------------------
    # Mark employee as active / online
    # --------------------------------------------------------

    activated_at = utc_now_datetime()


    employees_collection.update_one(
        {
            "_id":
                employee["_id"]
        },
        {
            "$set": {
                "active":
                    True,

                "activated_at":
                    activated_at
            },

            "$setOnInsert": {
                "active_tickets":
                    0
            }
        }
    )


    # --------------------------------------------------------
    # Assign pending tickets for this department.
    #
    # The assignment function considers ALL active employees
    # in the department and chooses the lowest workload.
    # Therefore simply coming online does not automatically
    # mean this employee gets the ticket.
    # --------------------------------------------------------

    assigned_pending_tickets = (
        assign_pending_tickets(
            employee["department"]
        )
    )


    return jsonify({
        "id":
            str(employee["_id"]),

        "name":
            employee["name"],

        "email":
            employee["email"],

        "department":
            employee["department"],

        "role":
            "employee",

        "active":
            True,

        "assigned_pending_tickets":
            assigned_pending_tickets,

        "message":
            (
                "Employee is now online."
                if not assigned_pending_tickets
                else
                "Employee is now online and pending tickets were checked."
            )

    }), 200


# ============================================================
# EMPLOYEE LOGOUT / GO OFFLINE
# ============================================================

@app.route(
    "/api/employee/logout",
    methods=["POST"]
)
def employee_logout():

    data = request.get_json() or {}


    email = data.get(
        "email",
        ""
    ).strip().lower()


    if not email:

        return jsonify({
            "error":
                "Employee email is required."
        }), 400


    employee = (
        employees_collection.find_one(
            {
                "email":
                    email
            }
        )
    )


    if not employee:

        return jsonify({
            "error":
                "Employee not found."
        }), 404


    employees_collection.update_one(
        {
            "_id":
                employee["_id"]
        },
        {
            "$set": {
                "active":
                    False
            }
        }
    )


    return jsonify({
        "message":
            "Employee is now offline.",

        "name":
            employee["name"],

        "email":
            employee["email"],

        "department":
            employee["department"],

        "active":
            False

    }), 200


# ============================================================
# EMPLOYEE AVAILABILITY
# ============================================================

@app.route(
    "/api/employee/availability",
    methods=["PUT"]
)
def employee_availability():

    data = request.get_json() or {}


    email = data.get(
        "email",
        ""
    ).strip().lower()

    active = data.get(
        "active"
    )


    if not email:

        return jsonify({
            "error":
                "Employee email is required."
        }), 400


    if not isinstance(
        active,
        bool
    ):

        return jsonify({
            "error":
                "Active must be true or false."
        }), 400


    employee = (
        employees_collection.find_one(
            {
                "email":
                    email
            }
        )
    )


    if not employee:

        return jsonify({
            "error":
                "Employee not found."
        }), 404


    update_fields = {
        "active":
            active
    }


    if active:

        update_fields[
            "activated_at"
        ] = utc_now_datetime()


    employees_collection.update_one(
        {
            "_id":
                employee["_id"]
        },
        {
            "$set":
                update_fields
        }
    )


    assigned_pending_tickets = []


    if active:

        assigned_pending_tickets = (
            assign_pending_tickets(
                employee["department"]
            )
        )


    return jsonify({
        "message":
            (
                "Employee is now online."
                if active
                else
                "Employee is now offline."
            ),

        "name":
            employee["name"],

        "email":
            employee["email"],

        "department":
            employee["department"],

        "active":
            active,

        "assigned_pending_tickets":
            assigned_pending_tickets

    }), 200


# ============================================================
# EMPLOYEE TICKETS
# ============================================================

@app.route(
    "/api/employee/tickets/<employee_name>",
    methods=["GET"]
)
def get_employee_tickets(
    employee_name
):

    try:

        tickets = list(
            tickets_collection.find(
                {
                    "assigned_employee":
                        employee_name
                }
            ).sort(
                "created_at",
                -1
            )
        )


        for ticket in tickets:

            ticket["_id"] = str(
                ticket["_id"]
            )


        return jsonify(
            tickets
        ), 200


    except Exception as e:

        return jsonify({
            "error":
                str(e)
        }), 500


# ============================================================
# CUSTOMER TICKETS
# ============================================================

@app.route(
    "/api/customer/tickets/<customer_email>",
    methods=["GET"]
)
def get_customer_tickets(
    customer_email
):

    try:

        tickets = list(
            tickets_collection.find(
                {
                    "customer_email":
                        customer_email.lower()
                }
            ).sort(
                "created_at",
                -1
            )
        )


        for ticket in tickets:

            ticket["_id"] = str(
                ticket["_id"]
            )


        return jsonify(
            tickets
        ), 200


    except Exception as e:

        return jsonify({
            "error":
                str(e)
        }), 500


# ============================================================
# CUSTOMER REGISTRATION
# ============================================================

@app.route(
    "/api/customer/register",
    methods=["POST"]
)
def customer_register():

    data = request.get_json() or {}


    name = data.get(
        "name",
        ""
    ).strip()

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )


    if not name:
        return jsonify({
            "error":
                "Name is required."
        }), 400


    if not email or "@" not in email:
        return jsonify({
            "error":
                "A valid email is required."
        }), 400


    if len(password) < 4:
        return jsonify({
            "error":
                "Password must contain at least 4 characters."
        }), 400


    existing_customer = (
        customers_collection.find_one(
            {
                "email":
                    email
            }
        )
    )


    if existing_customer:

        return jsonify({
            "error":
                "A customer account with this email already exists."
        }), 409


    customer = {
        "name":
            name,

        "email":
            email,

        "password":
            password,

        "role":
            "customer",

        "active":
            True,

        "created_at":
            utc_now_datetime()
    }


    result = (
        customers_collection.insert_one(
            customer
        )
    )


    return jsonify({
        "message":
            "Customer account created successfully.",

        "id":
            str(result.inserted_id),

        "name":
            name,

        "email":
            email,

        "role":
            "customer"

    }), 201


# ============================================================
# CUSTOMER LOGIN
# ============================================================

@app.route(
    "/api/customer/login",
    methods=["POST"]
)
def customer_login():

    data = request.get_json() or {}


    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )


    if not email or not password:

        return jsonify({
            "error":
                "Email and password are required."
        }), 400


    customer = (
        customers_collection.find_one(
            {
                "email":
                    email,

                "password":
                    password,

                "active":
                    True
            }
        )
    )


    if not customer:

        return jsonify({
            "error":
                "Invalid customer email or password."
        }), 401


    return jsonify({
        "id":
            str(customer["_id"]),

        "name":
            customer["name"],

        "email":
            customer["email"],

        "role":
            "customer"

    }), 200


# ============================================================
# UPDATE TICKET STATUS
# ============================================================

@app.route(
    "/api/tickets/<ticket_id>/status",
    methods=["PUT"]
)
def update_ticket_status(
    ticket_id
):

    data = request.get_json() or {}


    new_status = data.get(
        "status",
        ""
    ).strip()


    allowed_statuses = [
        "Pending Assignment",
        "Assigned",
        "In Progress",
        "Resolved"
    ]


    if new_status not in allowed_statuses:

        return jsonify({
            "error":
                "Invalid status."
        }), 400


    try:

        # ----------------------------------------------------
        # FIND EXISTING TICKET
        # ----------------------------------------------------

        ticket = (
            tickets_collection.find_one(
                {
                    "_id":
                        ObjectId(ticket_id)
                }
            )
        )


        if not ticket:

            return jsonify({
                "error":
                    "Ticket not found."
            }), 404


        old_status = ticket.get(
            "status",
            "Assigned"
        )


        assigned_employee = ticket.get(
            "assigned_employee"
        )


        # ----------------------------------------------------
        # PREVENT MANUAL ASSIGNMENT STATUS ON UNASSIGNED TICKET
        # ----------------------------------------------------

        if (
            new_status in [
                "Assigned",
                "In Progress"
            ]
            and not assigned_employee
        ):

            return jsonify({
                "error":
                    "This ticket has no assigned employee yet."
            }), 400


        # ----------------------------------------------------
        # UPDATE TICKET STATUS
        # ----------------------------------------------------

        update_fields = {
            "status":
                new_status
        }


        # ----------------------------------------------------
        # RESOLVED TIMESTAMP
        # ----------------------------------------------------

        if new_status == "Resolved":

            update_fields[
                "resolved_at"
            ] = utc_now_iso()

        else:

            update_fields[
                "resolved_at"
            ] = None


        tickets_collection.update_one(
            {
                "_id":
                    ObjectId(ticket_id)
            },
            {
                "$set":
                    update_fields
            }
        )


        # ----------------------------------------------------
        # UPDATE EMPLOYEE WORKLOAD
        # ----------------------------------------------------

        if assigned_employee:

            # ------------------------------------------------
            # ACTIVE → RESOLVED
            # ------------------------------------------------

            if (
                old_status != "Resolved"
                and new_status == "Resolved"
            ):

                employees_collection.update_one(
                    {
                        "name":
                            assigned_employee,

                        "active_tickets": {
                            "$gt": 0
                        }
                    },
                    {
                        "$inc": {
                            "active_tickets":
                                -1
                        }
                    }
                )


            # ------------------------------------------------
            # RESOLVED → ACTIVE
            # ------------------------------------------------

            elif (
                old_status == "Resolved"
                and new_status != "Resolved"
            ):

                employees_collection.update_one(
                    {
                        "name":
                            assigned_employee
                    },
                    {
                        "$inc": {
                            "active_tickets":
                                1
                        }
                    }
                )


        # ----------------------------------------------------
        # GET UPDATED TICKET
        # ----------------------------------------------------

        updated_ticket = (
            tickets_collection.find_one(
                {
                    "_id":
                        ObjectId(ticket_id)
                }
            )
        )


        if updated_ticket:

            updated_ticket["_id"] = str(
                updated_ticket["_id"]
            )


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({
            "message":
                "Ticket status updated successfully.",

            "ticket_id":
                ticket_id,

            "status":
                new_status,

            "assigned_employee":
                assigned_employee,

            "ticket":
                updated_ticket

        }), 200


    except Exception as e:

        return jsonify({
            "error":
                str(e)
        }), 500


# ============================================================
# GET SINGLE TICKET
# ============================================================

@app.route(
    "/api/tickets/<ticket_id>",
    methods=["GET"]
)
def get_ticket(
    ticket_id
):

    try:

        ticket = (
            tickets_collection.find_one(
                {
                    "_id":
                        ObjectId(ticket_id)
                }
            )
        )


        if not ticket:

            return jsonify({
                "error":
                    "Ticket not found."
            }), 404


        ticket["_id"] = str(
            ticket["_id"]
        )


        return jsonify(
            ticket
        ), 200


    except Exception as e:

        return jsonify({
            "error":
                str(e)
        }), 500


# ============================================================
# ADD TICKET MESSAGE
# ============================================================

@app.route(
    "/api/tickets/<ticket_id>/messages",
    methods=["POST"]
)
def add_ticket_message(
    ticket_id
):

    data = request.get_json() or {}


    body = data.get(
        "body",
        ""
    ).strip()

    author = data.get(
        "author",
        ""
    ).strip()

    role = data.get(
        "role",
        "employee"
    ).strip()


    if not body:

        return jsonify({
            "error":
                "Message body is required."
        }), 400


    if not author:

        return jsonify({
            "error":
                "Author is required."
        }), 400


    try:

        ticket = (
            tickets_collection.find_one(
                {
                    "_id":
                        ObjectId(ticket_id)
                }
            )
        )


        if not ticket:

            return jsonify({
                "error":
                    "Ticket not found."
            }), 404


        # ----------------------------------------------------
        # CREATE MESSAGE
        # ----------------------------------------------------

        message = {
            "id":
                str(ObjectId()),

            "author":
                author,

            "role":
                role,

            "body":
                body,

            "at":
                utc_now_iso()
        }


        tickets_collection.update_one(
            {
                "_id":
                    ObjectId(ticket_id)
            },
            {
                "$push": {
                    "messages":
                        message
                }
            }
        )


        return jsonify({
            "message":
                "Response added successfully.",

            "ticket_id":
                ticket_id,

            "response":
                message

        }), 201


    except Exception as e:

        return jsonify({
            "error":
                str(e)
        }), 500


# ============================================================
# ADD TICKET RESPONSE
# ============================================================

@app.route(
    "/api/tickets/<ticket_id>/response",
    methods=["POST"]
)
def add_ticket_response(
    ticket_id
):

    data = request.get_json() or {}


    body = data.get(
        "body",
        ""
    ).strip()

    author = data.get(
        "author",
        "Support"
    )

    role = data.get(
        "role",
        "employee"
    )


    if not body:

        return jsonify({
            "error":
                "Response cannot be empty."
        }), 400


    try:

        # ----------------------------------------------------
        # CREATE RESPONSE
        # ----------------------------------------------------

        message = {
            "id":
                str(ObjectId()),

            "author":
                author,

            "role":
                role,

            "body":
                body,

            "at":
                utc_now_iso()
        }


        result = (
            tickets_collection.update_one(
                {
                    "_id":
                        ObjectId(ticket_id)
                },
                {
                    "$push": {
                        "messages":
                            message
                    }
                }
            )
        )


        if result.matched_count == 0:

            return jsonify({
                "error":
                    "Ticket not found."
            }), 404


        return jsonify({
            "message":
                "Response added successfully.",

            "ticket_id":
                ticket_id,

            "response":
                message

        }), 200


    except Exception as e:

        return jsonify({
            "error":
                str(e)
        }), 500


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({
        "message":
            "AI Ticket Routing API is running."
    })


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )