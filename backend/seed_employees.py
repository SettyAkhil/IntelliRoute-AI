from database import employees_collection


employees = [
    {
        "name": "Priya Nair",
        "email": "priya@company.com",
        "department": "IT Support",
        "active": True,
        "active_tickets": 0
    },
    {
        "name": "Rahul Kumar",
        "email": "rahul@company.com",
        "department": "IT Support",
        "active": True,
        "active_tickets": 0
    },
    {
        "name": "Anil Sharma",
        "email": "anil@company.com",
        "department": "Billing and Payments",
        "active": True,
        "active_tickets": 0
    },
    {
        "name": "Sneha Reddy",
        "email": "sneha@company.com",
        "department": "Billing and Payments",
        "active": True,
        "active_tickets": 0
    },
    {
        "name": "Vikram Singh",
        "email": "vikram@company.com",
        "department": "Product Support",
        "active": True,
        "active_tickets": 0
    },
    {
        "name": "Meera Patel",
        "email": "meera@company.com",
        "department": "Returns and Exchanges",
        "active": True,
        "active_tickets": 0
    }
]


# Prevent duplicate employees
for employee in employees:

    existing_employee = employees_collection.find_one({
        "email": employee["email"]
    })

    if not existing_employee:
        employees_collection.insert_one(employee)
        print(f"Added employee: {employee['name']}")
    else:
        print(f"Already exists: {employee['name']}")


print("\nEmployee data initialized successfully.")