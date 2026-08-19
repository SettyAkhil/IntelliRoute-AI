# IntelliRoute AI

An intelligent customer support ticket management platform that uses machine learning to classify, prioritize, and automatically route support tickets to the most suitable support employee.

The system provides separate experiences for Customers and Employees, including dashboards, ticket management, notifications, status tracking, and workload-aware assignment.

## Overview

Traditional support systems often require manual ticket classification and assignment. This project automates that workflow.

When a customer submits a ticket, the system analyzes the request and determines:

* Ticket Type
* Priority
* Department
* Assigned Employee

## Core Workflow

```text
Customer submits ticket
        ↓
AI analyzes ticket
        ↓
Predict Type
        ↓
Predict Priority
        ↓
Predict Department
        ↓
Select appropriate employee
        ↓
Assign ticket
        ↓
Employee receives notification
        ↓
Employee works on ticket
        ↓
Status → In Progress
        ↓
Employee resolves ticket
        ↓
Status → Resolved
        ↓
Customer receives resolution update
```

The customer-facing application does not expose internal machine-learning implementation details.

## Key Features

### Customer

* Customer authentication
* Customer dashboard
* Submit support tickets
* View submitted tickets
* View ticket details
* View AI classification results
* Track ticket status
* View assigned employee
* Receive notifications
* Receive resolution updates
* Responsive interface

### Employee

* Employee authentication
* Employee dashboard
* View assigned tickets
* Workload statistics
* View ticket details
* Update ticket status
* Add responses to customers
* Resolve tickets
* Receive assignment notifications
* Track resolution progress
* Responsive interface

## Intelligent Ticket Routing

The routing workflow determines:

| Attribute   | Purpose                                 |
| ----------- | --------------------------------------- |
| Ticket Type | Categorizes the support request         |
| Priority    | Determines urgency                      |
| Department  | Determines the appropriate support area |
| Employee    | Selects an appropriate support agent    |

Employee assignment considers workload so tickets can be distributed more effectively.

## Ticket Lifecycle

```text
Submitted
    ↓
Assigned
    ↓
In Progress
    ↓
Resolved
```

### Submitted

The customer has created the ticket.

### Assigned

The ticket has been routed to an employee.

### In Progress

The employee is actively working on the issue.

### Resolved

The employee has completed the request and the customer receives a resolution update.

## Customer Experience

### Customer Dashboard

The dashboard provides:

* Total Tickets
* Open Tickets
* In Progress
* Resolved
* Recent Tickets

Recent tickets display:

* Ticket ID
* Subject
* Priority
* Department
* Assigned Employee
* Status
* Created Date

### Submit Ticket

Customers provide:

* Subject
* Description

After submission, the application displays:

* Ticket ID
* Type
* Priority
* Department
* Assigned Employee
* Status

### Ticket Details

Customers can view:

* Ticket information
* Description
* AI classification
* Assignment information
* Status timeline
* Employee updates
* Final resolution

### Customer Notifications

Customers receive notifications for:

* Ticket submitted
* Ticket assigned
* Ticket updated
* Ticket resolved

Unread notifications are displayed through the notification indicator.

## Employee Experience

### Employee Dashboard

Employees receive:

* New Tickets
* Assigned Tickets
* In Progress
* Resolved

The dashboard also provides a table of tickets assigned to the logged-in employee.

### Employee Ticket Management

Employees can view:

* Ticket ID
* Customer
* Subject
* Description
* Type
* Priority
* Department
* Assigned Employee
* Created Date
* Current Status

Employees can move tickets through:

```text
Assigned → In Progress → Resolved
```

### Customer Responses

Employees can respond directly to customers through the ticket interface.

### Employee Notifications

Employees receive notifications for:

* New ticket assigned
* Customer reply
* Priority changes
* Tickets requiring attention

## Machine Learning / Intelligent Routing

The intelligent part of the system is the ticket analysis and routing pipeline.

```text
Ticket Subject + Description
            ↓
      Text Processing
            ↓
    Classification Models
            ↓
 ┌──────────┼───────────┐
 ↓          ↓           ↓
Type     Priority   Department
 └──────────┼───────────┘
            ↓
     Employee Selection
            ↓
       Ticket Assignment
```

The customer-facing application presents the classification and routing result in a business-friendly format rather than exposing model internals.

## Workload-Aware Assignment

The assignment logic considers available support employees and their current workload.

### Example

```text
Employee A → 5 open tickets
Employee B → 2 open tickets
Employee C → 0 open tickets

New ticket
    ↓
Assignment logic
    ↓
Employee C selected
```

This helps avoid unnecessarily concentrating tickets on a single employee.

## Notification System

### Customer Notifications

* Ticket Submitted
* Ticket Assigned
* Ticket Updated
* Ticket Resolved

### Employee Notifications

* New Ticket Assigned
* Customer Replied
* Priority Changed
* Ticket Requires Attention

Notifications include unread states and can link back to the relevant ticket.

## User Roles

### Customer

Customers can:

* Submit tickets
* View their tickets
* Track ticket progress
* View ticket details
* Receive notifications
* See final resolutions

### Employee

Employees can:

* View assigned tickets
* Open ticket details
* Update ticket status
* Respond to customers
* Resolve tickets
* Receive assignment notifications

## UI / UX

The interface follows a modern SaaS design approach.

### Design Principles

* Clean and professional
* Minimal visual clutter
* Enterprise support-workspace feel
* Consistent spacing
* Clear typography
* Rounded cards
* Subtle borders
* Subtle shadows
* Responsive layouts
* Accessible contrast
* Clear visual hierarchy
* Empty states
* Loading states
* Error states
* Success states

### Status and Priority Colors

| Status / Priority | Meaning         |
| ----------------- | --------------- |
| High              | Red             |
| Medium            | Orange / Yellow |
| Low               | Green           |
| Assigned          | Blue            |
| In Progress       | Orange          |
| Resolved          | Green           |

The application uses a professional blue/indigo visual identity with neutral backgrounds.

## Responsive Design

### Desktop

* Persistent sidebar
* Dashboard cards
* Full ticket tables
* Detailed ticket panels

### Tablet

* Responsive layouts
* Collapsible navigation
* Adaptable dashboard cards

### Mobile

* Mobile navigation
* Stacked cards
* Full-width forms
* Mobile-friendly ticket details
* Responsive ticket content

## Reusable Components

The application uses reusable components including:

* AppShell
* DashboardCard
* TicketTable
* NotificationList
* TicketForm
* TicketTimeline
* PriorityBadge
* StatusBadge
* ProfileMenu
* Toast / success messages
* Dialogs and modals

## Technology Stack

### Frontend

* React
* TypeScript
* TanStack Start
* TanStack Router
* TanStack React Query
* Tailwind CSS
* Vite
* Lucide React

### UI / Forms

* Radix UI
* React Hook Form
* Zod
* Sonner
* Class Variance Authority
* Tailwind Merge

### Utilities

* Date-fns
* Recharts
* Embla Carousel
* Cmdk

### Development

* Node.js
* npm
* Vite
* TypeScript
* ESLint
* Prettier

### Machine Learning

The project uses an ML-based ticket analysis and routing workflow to classify ticket information and support automatic assignment.

## Project Structure

```text
intelliroute-ai/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── app-shell.tsx
│   │   ├── dashboard-card.tsx
│   │   ├── notification-list.tsx
│   │   ├── ticket-table.tsx
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── ticket-store.ts
│   │   ├── use-require-role.ts
│   │   └── utils.ts
│   │
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── customer/
│   │   └── employee/
│   │
│   └── styles.css
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Installation

### Prerequisites

* Node.js
* npm
* Git

### Clone

```bash
git clone <your-repository-url>
cd intelliroute-ai
```

### Install Dependencies

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at the local URL displayed by Vite, typically:

```text
http://localhost:8080
```

## Production Build

Build the production application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Code Quality

Run ESLint:

```bash
npm run lint
```

Format the project:

```bash
npm run format
```

## Application Flow

### Customer Flow

```text
Login
  ↓
Customer Dashboard
  ↓
Submit Ticket
  ↓
AI Classification
  ↓
Automatic Assignment
  ↓
Ticket Tracking
  ↓
Employee Updates
  ↓
Resolution
```

### Employee Flow

```text
Login
  ↓
Employee Dashboard
  ↓
New Assignment
  ↓
Open Ticket
  ↓
Review Customer Issue
  ↓
In Progress
  ↓
Respond to Customer
  ↓
Resolve Ticket
  ↓
Customer Notification
```

## Example

### Customer submits

**Subject:**

```text
Unable to access company email
```

**Description:**

```text
I cannot log in to my company email account and password reset
is not resolving the problem.
```

### Example routing result

**Type:**

```text
Problem
```

**Priority:**

```text
High
```

**Department:**

```text
IT Support
```

**Assigned Employee:**

```text
Priya
```

**Status:**

```text
Assigned
```

The customer sees the result through the normal ticket interface without needing to understand the underlying ML implementation.

## Project Goals

* Automate ticket classification.
* Automate ticket prioritization.
* Identify the appropriate support department.
* Improve employee assignment.
* Consider employee workload during routing.
* Reduce manual ticket triage.
* Provide clear ticket visibility to customers.
* Provide employees with an efficient support workspace.
* Keep customers informed through notifications.
* Provide a complete ticket lifecycle from submission to resolution.

## Future Improvements

* Real-time server-side events
* Email notifications
* Advanced employee availability detection
* SLA tracking
* Escalation rules
* Ticket search and filtering
* Advanced analytics
* ML model monitoring
* Model retraining pipeline
* Feedback-based model improvement
* Admin dashboard
* Audit logs
* Role and permission management
* Production authentication
* Cloud deployment
* Automated testing
* API documentation

## Security Considerations

For production deployment, the system should include:

* Secure authentication
* Password hashing
* Session management
* Role-based authorization
* Input validation
* API authorization
* Rate limiting
* Secure environment variables
* Database access controls
* Audit logging
* HTTPS

## Project Status

**Status: Active development**

The core customer and employee workflows are implemented, including ticket submission, routing, assignment, ticket management, notifications, dashboards, and resolution tracking.

## Author

**Akhil Setty**

**IntelliRoute AI**
*Machine Learning / Full-Stack Project*

## License

This project is intended for educational, portfolio, and demonstration purposes unless a separate license is provided with the repository.
