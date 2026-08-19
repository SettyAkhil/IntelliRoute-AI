import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "customer" | "employee";

export type Priority = "High" | "Medium" | "Low";

export type Status =
  | "Submitted"
  | "Assigned"
  | "In Progress"
  | "Resolved";

export type TicketType =
  | "Problem"
  | "Request"
  | "Incident"
  | "Question";

export type Department =
  | "IT Support"
  | "Billing"
  | "Technical"
  | "Accounts"
  | "Human Resources"
  | "Billing and Payments"
  | "Product Support"
  | "Technical Support";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: Department;
  workload: number;
}

export interface TicketMessage {
  id: string;
  author: string;
  role: Role;
  body: string;
  at: string;
}

export interface Ticket {
  id: number;
  mongoId: string;
  subject: string;
  description: string;
  customer: string;
  customerEmail: string;
  type: TicketType;
  priority: Priority;
  department: Department;
  assignee: string;
  status: Status;
  createdAt: string;
  resolvedAt?: string | undefined;
  messages: TicketMessage[];
}

export interface AppNotification {
  id: string;

  audience: Role;

  recipientEmail?: string;
  recipientName?: string;

  title: string;
  body: string;
  meta?: string;
  at: string;
  read: boolean;

  ticketId?: number;

  mongoId?: string;
}

export interface SessionUser {
  role: Role;
  name: string;
  email: string;
  department?: Department;

  /**
   * Permanent employee identity used for
   * ticket assignment and routing.
   *
   * The employee can change `name` without
   * changing this value.
   */
  identityName?: string;

  /**
   * Permanent customer identity used for
   * loading existing customer tickets.
   */
  identityEmail?: string;
}

const EMPLOYEES: Employee[] = [
  {
    id: "e1",
    name: "Priya Nair",
    email: "priya@helm.support",
    department: "IT Support",
    workload: 1,
  },
  {
    id: "e2",
    name: "Marcus Cole",
    email: "marcus@helm.support",
    department: "Billing",
    workload: 1,
  },
  {
    id: "e3",
    name: "Ana Ruiz",
    email: "ana@helm.support",
    department: "Technical",
    workload: 3,
  },
  {
    id: "e4",
    name: "Devon Park",
    email: "devon@helm.support",
    department: "Accounts",
    workload: 1,
  },
];

const SEED_NOTIFICATIONS: AppNotification[] = [];

interface BackendTicket {
  _id: string;

  subject: string;
  description: string;

  customer?: string;
  customer_email?: string;

  type: string;
  priority: string;
  department: string;

  assigned_employee?: string | null;
  employee_workload?: number | null;

  status: string;
  created_at: string;

  resolved_at?: string | null;

  messages?: Array<{
    _id?: string;
    id?: string;
    author?: string;
    role?: string;
    body?: string;
    at?: string;
  }>;
}

interface StoreValue {
  session: SessionUser | null;

  tickets: Ticket[];

  notifications: AppNotification[];

  employees: Employee[];

  login: (user: SessionUser) => void;

  logout: () => void;

  createTicket: (
    subject: string,
    description: string,
  ) => Ticket;

  refreshTickets: () => Promise<void>;

  updateStatus: (
    id: number,
    status: Status,
  ) => Promise<void>;

  addResponse: (
    id: number,
    body: string,
  ) => void;

  markRead: (
    audience: Role,
  ) => void;
}

const StoreContext =
  createContext<StoreValue | null>(null);

/*
|--------------------------------------------------------------------------
| Storage keys
|--------------------------------------------------------------------------
*/

const NOTIFICATIONS_KEY =
  "airoute-notifications-v3";

const SESSION_KEY =
  "airoute-session-v2";

const API_URL =
  "http://127.0.0.1:5000";

/*
|--------------------------------------------------------------------------
| Automatic ticket refresh interval
|--------------------------------------------------------------------------
|
| Dashboard / My Tickets / employee views:
| refresh every 2 seconds.
|
*/

const TICKET_REFRESH_INTERVAL = 2000;

/*
|--------------------------------------------------------------------------
| Convert MongoDB ID → Frontend numeric ID
|--------------------------------------------------------------------------
*/

function mongoIdToNumber(
  mongoId: string,
): number {
  if (!mongoId) {
    return Date.now();
  }

  const lastSix =
    mongoId.slice(-6);

  const parsed =
    parseInt(lastSix, 16);

  if (Number.isNaN(parsed)) {
    return Date.now();
  }

  return parsed;
}

/*
|--------------------------------------------------------------------------
| Convert MongoDB ticket → Frontend ticket
|--------------------------------------------------------------------------
*/

function convertBackendTicket(
  ticket: BackendTicket,
): Ticket {
  const messages: TicketMessage[] =
    Array.isArray(ticket.messages)
      ? ticket.messages.map(
          (message, index) => ({
            id:
              message.id ??
              message._id ??
              `${ticket._id}-message-${index}`,

            author:
              message.author ??
              "Support",

            role:
              message.role ===
              "customer"
                ? "customer"
                : "employee",

            body:
              message.body ?? "",

            at:
              message.at ??
              ticket.created_at,
          }),
        )
      : [];

  const priority =
    ticket.priority
      ?.charAt(0)
      .toUpperCase() +
    ticket.priority
      ?.slice(1)
      .toLowerCase();

  return {
    id:
      mongoIdToNumber(
        ticket._id,
      ),

    mongoId:
      ticket._id,

    subject:
      ticket.subject ?? "",

    description:
      ticket.description ?? "",

    customer:
      ticket.customer ??
      "Unknown Customer",

    customerEmail:
      ticket.customer_email ??
      "",

    type:
      ticket.type as TicketType,

    priority:
      priority as Priority,

    department:
      ticket.department as Department,

    assignee:
      ticket.assigned_employee ??
      "",

    status:
      ticket.status as Status,

    createdAt:
      ticket.created_at,

    resolvedAt:
      ticket.resolved_at ??
      undefined,

    messages,
  };
}

/*
|--------------------------------------------------------------------------
| Normalize notification
|--------------------------------------------------------------------------
*/

function normalizeNotification(
  notification: AppNotification,
): AppNotification {
  const rawTicketId =
    notification.ticketId as
      | number
      | string
      | undefined;

  let normalizedTicketId:
    | number
    | undefined;

  if (
    typeof rawTicketId ===
      "number" &&
    Number.isFinite(
      rawTicketId,
    )
  ) {
    normalizedTicketId =
      rawTicketId;
  } else if (
    typeof rawTicketId ===
    "string"
  ) {
    const trimmed =
      rawTicketId.trim();

    if (trimmed) {
      const numericId =
        Number(trimmed);

      if (
        Number.isFinite(
          numericId,
        )
      ) {
        normalizedTicketId =
          numericId;
      } else if (
        /^[a-fA-F0-9]{24}$/.test(
          trimmed,
        )
      ) {
        normalizedTicketId =
          mongoIdToNumber(
            trimmed,
          );
      }
    }
  }

  if (
    normalizedTicketId ===
      undefined &&
    notification.mongoId
  ) {
    normalizedTicketId =
      mongoIdToNumber(
        notification.mongoId,
      );
  }

  return {
    ...notification,

    ...(normalizedTicketId !==
    undefined
      ? {
          ticketId:
            normalizedTicketId,
        }
      : {}),
  };
}

/*
|--------------------------------------------------------------------------
| Read notifications
|--------------------------------------------------------------------------
*/

function readStoredNotifications(): AppNotification[] {
  try {
    const raw =
      localStorage.getItem(
        NOTIFICATIONS_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    const normalized =
      parsed.map(
        (notification) =>
          normalizeNotification(
            notification,
          ),
      );

    saveStoredNotifications(
      normalized,
    );

    return normalized;
  } catch (error) {
    console.error(
      "Failed to read notifications:",
      error,
    );

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| Save notifications
|--------------------------------------------------------------------------
*/

function saveStoredNotifications(
  notifications: AppNotification[],
) {
  try {
    localStorage.setItem(
      NOTIFICATIONS_KEY,
      JSON.stringify(
        notifications,
      ),
    );
  } catch (error) {
    console.error(
      "Failed to save notifications:",
      error,
    );
  }
}

/*
|--------------------------------------------------------------------------
| Add notification
|--------------------------------------------------------------------------
*/

function addStoredNotification(
  notification: AppNotification,
): AppNotification[] {
  const current =
    readStoredNotifications();

  const normalizedNotification =
    normalizeNotification(
      notification,
    );

  const alreadyExists =
    current.some(
      (item) =>
        item.id ===
        normalizedNotification.id,
    );

  if (alreadyExists) {
    return current;
  }

  const updated = [
    normalizedNotification,
    ...current,
  ];

  saveStoredNotifications(
    updated,
  );

  return updated;
}

/*
|--------------------------------------------------------------------------
| Store Provider
|--------------------------------------------------------------------------
*/

export function StoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<SessionUser | null>(
      null,
    );

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [
    allNotifications,
    setAllNotifications,
  ] = useState<
    AppNotification[]
  >(SEED_NOTIFICATIONS);

  const [hydrated, setHydrated] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load session + notifications
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const savedSession =
        sessionStorage.getItem(
          SESSION_KEY,
        );

      if (savedSession) {
        setSession(
          JSON.parse(
            savedSession,
          ),
        );
      }

      const storedNotifications =
        readStoredNotifications();

      if (
        storedNotifications.length >
        0
      ) {
        setAllNotifications(
          storedNotifications,
        );
      }
    } catch (error) {
      console.error(
        "Failed to load local state:",
        error,
      );
    }

    setHydrated(true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Save session
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      if (session) {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify(
            session,
          ),
        );
      } else {
        sessionStorage.removeItem(
          SESSION_KEY,
        );
      }
    } catch (error) {
      console.error(
        "Failed to save session:",
        error,
      );
    }
  }, [
    session,
    hydrated,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Cross-tab notification synchronization
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleStorageChange = (
      event: StorageEvent,
    ) => {
      if (
        event.key !==
        NOTIFICATIONS_KEY
      ) {
        return;
      }

      try {
        if (
          !event.newValue
        ) {
          setAllNotifications(
            [],
          );

          return;
        }

        const updated =
          JSON.parse(
            event.newValue,
          );

        if (
          Array.isArray(updated)
        ) {
          const normalized =
            updated.map(
              (notification) =>
                normalizeNotification(
                  notification,
                ),
            );

          setAllNotifications(
            normalized,
          );
        }
      } catch (error) {
        console.error(
          "Failed to synchronize notifications:",
          error,
        );
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange,
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Notification matching
  |--------------------------------------------------------------------------
  */

  const notificationBelongsToSession =
    useCallback(
      (
        notification: AppNotification,
        currentSession:
          SessionUser | null,
      ) => {
        if (!currentSession) {
          return false;
        }

        if (
          notification.audience !==
          currentSession.role
        ) {
          return false;
        }

        if (
          currentSession.role ===
          "customer"
        ) {
          if (
            notification.recipientEmail
          ) {
            return (
              notification.recipientEmail
                .toLowerCase()
                .trim() ===
              currentSession.email
                .toLowerCase()
                .trim()
            );
          }

          return false;
        }

        if (
          currentSession.role ===
          "employee"
        ) {
          if (
            notification.recipientName
          ) {
            return (
              notification.recipientName
                .toLowerCase()
                .trim() ===
              currentSession.name
                .toLowerCase()
                .trim()
            );
          }

          return false;
        }

        return false;
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | Push notification
  |--------------------------------------------------------------------------
  */

  const pushNotification =
    useCallback(
      (
        n: Omit<
          AppNotification,
          "id" | "at" | "read"
        > & {
          id?: string;
        },
      ) => {
        const notification: AppNotification =
          {
            ...n,

            id:
              n.id ??
              `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,

            at:
              new Date().toISOString(),

            read: false,
          };

        const updated =
          addStoredNotification(
            notification,
          );

        setAllNotifications(
          updated,
        );
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | REFRESH TICKETS
  |--------------------------------------------------------------------------
  |
  | This is the important new function.
  |
  | It can be called:
  |
  | 1. Automatically every 2 seconds
  | 2. Immediately after submitting a ticket
  | 3. Immediately after another operation
  |--------------------------------------------------------------------------
  */

  const refreshTickets =
    useCallback(
      async () => {
        if (!session) {
          setTickets([]);
          return;
        }

        try {
          let endpoint = "";

          if (
            session.role ===
            "employee"
          ) {
            endpoint =
              `${API_URL}/api/employee/tickets/${encodeURIComponent(
                session.name,
              )}`;
          } else {
            endpoint =
              `${API_URL}/api/customer/tickets/${encodeURIComponent(
                session.email,
              )}`;
          }

          const response =
            await fetch(endpoint, {
              cache: "no-store",
            });

          if (!response.ok) {
            const errorData =
              await response
                .json()
                .catch(
                  () => null,
                );

            throw new Error(
              errorData?.error ??
                `Failed to load tickets. Status: ${response.status}`,
            );
          }

          const data:
            BackendTicket[] =
            await response.json();

          if (
            !Array.isArray(data)
          ) {
            throw new Error(
              "Backend returned invalid ticket data.",
            );
          }

          const convertedTickets =
            data.map(
              convertBackendTicket,
            );

          /*
           * Update React state immediately.
           */
          setTickets(
            convertedTickets,
          );

          /*
           * Employee assignment notifications.
           */
          if (
            session.role ===
            "employee"
          ) {
            const assignedTickets =
              convertedTickets.filter(
                (ticket) =>
                  ticket.assignee
                    .toLowerCase()
                    .trim() ===
                    session.name
                      .toLowerCase()
                      .trim() &&
                  ticket.status ===
                    "Assigned",
              );

            if (
              assignedTickets.length >
              0
            ) {
              let latestNotifications =
                readStoredNotifications();

              assignedTickets.forEach(
                (ticket) => {
                  const notificationId =
                    `assignment-${ticket.mongoId}-${session.name}`;

                  const alreadyExists =
                    latestNotifications.some(
                      (
                        notification,
                      ) =>
                        notification.id ===
                        notificationId,
                    );

                  if (
                    alreadyExists
                  ) {
                    return;
                  }

                  const notification: AppNotification =
                    {
                      id:
                        notificationId,

                      audience:
                        "employee",

                      recipientName:
                        session.name,

                      title:
                        "New Ticket Assigned",

                      body:
                        ticket.subject,

                      meta:
                        `Priority: ${ticket.priority} · ${ticket.department}`,

                      at:
                        ticket.createdAt,

                      read: false,

                      ticketId:
                        ticket.id,

                      mongoId:
                        ticket.mongoId,
                    };

                  latestNotifications =
                    addStoredNotification(
                      notification,
                    );
                },
              );

              setAllNotifications(
                latestNotifications,
              );
            }
          }
        } catch (error) {
          /*
           * Do not clear the existing tickets
           * when one polling request fails.
           *
           * This prevents the UI from suddenly
           * becoming empty because Flask was
           * temporarily unavailable.
           */
          console.error(
            "Error refreshing tickets:",
            error,
          );
        }
      },
      [session],
    );

  /*
  |--------------------------------------------------------------------------
  | Automatic ticket synchronization
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!session) {
      setTickets([]);
      return;
    }

    /*
     * Load immediately.
     */
    void refreshTickets();

    /*
     * Then continuously check MongoDB.
     */
    const intervalId =
      window.setInterval(
        () => {
          void refreshTickets();
        },
        TICKET_REFRESH_INTERVAL,
      );

    return () => {
      window.clearInterval(
        intervalId,
      );
    };
  }, [
    session,
    refreshTickets,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  const login =
    useCallback(
      (user: SessionUser) => {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify(user),
        );

        setSession(user);
        setTickets([]);
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const logout =
    useCallback(() => {
      sessionStorage.removeItem(
        SESSION_KEY,
      );

      setSession(null);
      setTickets([]);
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Customer ticket creation
  |--------------------------------------------------------------------------
  */

  const createTicket =
    useCallback(
      (
        subject: string,
        description: string,
      ): Ticket => {
        const ticket: Ticket =
          {
            id: Date.now(),

            mongoId: "",

            subject,

            description,

            customer:
              session?.name ??
              "Customer",

            customerEmail:
              session?.email ??
              "",

            type:
              "Incident",

            priority:
              "Low",

            department:
              "IT Support",

            assignee: "",

            status:
              "Assigned",

            createdAt:
              new Date().toISOString(),

            messages: [],
          };

        if (
          session?.role ===
          "customer"
        ) {
          pushNotification({
            audience:
              "customer",

            recipientEmail:
              session.email,

            title:
              "Ticket submitted",

            body:
              subject,

            meta:
              "Ticket submitted successfully",

            ticketId:
              ticket.id,
          });
        }

        return ticket;
      },
      [
        session,
        pushNotification,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | Update ticket status
  |--------------------------------------------------------------------------
  */

  const updateStatus =
    useCallback(
      async (
        id: number,
        status: Status,
      ) => {
        const ticket =
          tickets.find(
            (t) => t.id === id,
          );

        if (!ticket) {
          console.error(
            "Ticket not found:",
            id,
          );

          return;
        }

        if (!ticket.mongoId) {
          console.error(
            "MongoDB ticket ID is missing:",
            ticket,
          );

          return;
        }

        try {
          const response =
            await fetch(
              `${API_URL}/api/tickets/${encodeURIComponent(
                ticket.mongoId,
              )}/status`,
              {
                method:
                  "PUT",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    status,
                  }),
              },
            );

          const data =
            await response
              .json()
              .catch(
                () => ({}),
              );

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ??
                "Failed to update ticket status.",
            );
          }

          /*
           * Update UI immediately.
           */
          setTickets(
            (prev) =>
              prev.map(
                (t) =>
                  t.id === id
                    ? {
                        ...t,

                        status,

                        resolvedAt:
                          status ===
                          "Resolved"
                            ? new Date().toISOString()
                            : undefined,
                      }
                    : t,
              ),
          );

          /*
           * Also synchronize with MongoDB
           * immediately.
           */
          await refreshTickets();

          /*
           * Notify customer.
           */
          if (
            ticket.customerEmail
          ) {
            pushNotification({
              audience:
                "customer",

              recipientEmail:
                ticket.customerEmail,

              title:
                status ===
                "Resolved"
                  ? "Ticket resolved"
                  : "Ticket updated",

              body:
                ticket.subject,

              meta:
                `Status: ${status}`,

              ticketId:
                ticket.id,

              mongoId:
                ticket.mongoId,
            });
          }

          console.log(
            "Ticket status updated:",
            data,
          );
        } catch (error) {
          console.error(
            "Error updating ticket status:",
            error,
          );
        }
      },
      [
        tickets,
        refreshTickets,
        pushNotification,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | Add response
  |--------------------------------------------------------------------------
  */

  const addResponse =
    useCallback(
      async (
        id: number,
        body: string,
      ) => {
        const ticket =
          tickets.find(
            (t) => t.id === id,
          );

        if (!ticket) {
          console.error(
            "Ticket not found:",
            id,
          );

          return;
        }

        if (!ticket.mongoId) {
          console.error(
            "MongoDB ticket ID is missing:",
            ticket,
          );

          return;
        }

        const cleanBody =
          body.trim();

        if (!cleanBody) {
          return;
        }

        const author =
          session?.name ??
          "Support";

        const role: Role =
          session?.role ??
          "employee";

        try {
          const response =
            await fetch(
              `${API_URL}/api/tickets/${encodeURIComponent(
                ticket.mongoId,
              )}/messages`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    body:
                      cleanBody,

                    author,

                    role,
                  }),
              },
            );

          const data =
            await response
              .json()
              .catch(
                () => ({}),
              );

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ??
                "Failed to send response.",
            );
          }

          /*
           * Optimistically show the response
           * immediately.
           */
          const savedMessage =
            data.response;

          const optimisticMessage: TicketMessage =
            {
              id:
                savedMessage?.id ??
                savedMessage?._id ??
                `${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2)}`,

              author:
                savedMessage?.author ??
                author,

              role:
                savedMessage?.role ??
                role,

              body:
                savedMessage?.body ??
                cleanBody,

              at:
                savedMessage?.at ??
                new Date().toISOString(),
            };

          setTickets(
            (prev) =>
              prev.map(
                (t) =>
                  t.id === id
                    ? {
                        ...t,

                        messages:
                          [
                            ...t.messages,
                            optimisticMessage,
                          ],
                      }
                    : t,
              ),
          );

          /*
           * Then immediately reload from MongoDB.
           *
           * This guarantees that the frontend
           * contains exactly what the backend saved.
           */
          await refreshTickets();

          /*
           * Employee → Customer
           */
          if (
            role ===
              "employee" &&
            ticket.customerEmail
          ) {
            pushNotification({
              audience:
                "customer",

              recipientEmail:
                ticket.customerEmail,

              title:
                "Ticket updated",

              body:
                cleanBody,

              meta:
                `Ticket #${ticket.id}`,

              ticketId:
                ticket.id,

              mongoId:
                ticket.mongoId,
            });
          }

          /*
           * Customer → Employee
           */
          if (
            role ===
              "customer" &&
            ticket.assignee
          ) {
            pushNotification({
              audience:
                "employee",

              recipientName:
                ticket.assignee,

              title:
                "Customer replied",

              body:
                cleanBody,

              meta:
                `Ticket #${ticket.id}`,

              ticketId:
                ticket.id,

              mongoId:
                ticket.mongoId,
            });
          }

          console.log(
            "Response saved successfully:",
            data,
          );
        } catch (error) {
          console.error(
            "Error sending response:",
            error,
          );
        }
      },
      [
        tickets,
        session,
        refreshTickets,
        pushNotification,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | Mark notifications as read
  |--------------------------------------------------------------------------
  */

  const markRead =
    useCallback(
      (audience: Role) => {
        const current =
          readStoredNotifications();

        const updated =
          current.map(
            (notification) => {
              if (
                notification.audience !==
                audience
              ) {
                return notification;
              }

              if (
                !notificationBelongsToSession(
                  notification,
                  session,
                )
              ) {
                return notification;
              }

              return {
                ...notification,
                read: true,
              };
            },
          );

        saveStoredNotifications(
          updated,
        );

        setAllNotifications(
          updated,
        );
      },
      [
        session,
        notificationBelongsToSession,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | Visible notifications
  |--------------------------------------------------------------------------
  */

  const visibleNotifications =
    useMemo(() => {
      if (!session) {
        return [];
      }

      return allNotifications.filter(
        (notification) =>
          notificationBelongsToSession(
            notification,
            session,
          ),
      );
    }, [
      allNotifications,
      session,
      notificationBelongsToSession,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Store value
  |--------------------------------------------------------------------------
  */

  const value =
    useMemo(
      () => ({
        session,

        tickets,

        notifications:
          visibleNotifications,

        employees:
          EMPLOYEES,

        login,

        logout,

        createTicket,

        refreshTickets,

        updateStatus,

        addResponse,

        markRead,
      }),
      [
        session,
        tickets,
        visibleNotifications,
        login,
        logout,
        createTicket,
        refreshTickets,
        updateStatus,
        addResponse,
        markRead,
      ],
    );

  return (
    <StoreContext.Provider
      value={value}
    >
      {children}
    </StoreContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| useStore
|--------------------------------------------------------------------------
*/

export function useStore() {
  const context =
    useContext(
      StoreContext,
    );

  if (!context) {
    throw new Error(
      "useStore must be used within StoreProvider",
    );
  }

  return context;
}

/*
|--------------------------------------------------------------------------
| Date formatting
|--------------------------------------------------------------------------
*/

export function formatDate(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleString(
    "en-IN",
    {
      timeZone:
        "Asia/Kolkata",

      month:
        "short",

      day:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",

      hour12:
        true,
    },
  );
}

/*
|--------------------------------------------------------------------------
| Relative time
|--------------------------------------------------------------------------
*/

export function relativeTime(
  value: string,
) {
  const timestamp =
    new Date(
      value,
    ).getTime();

  const now =
    Date.now();

  const diff =
    Math.max(
      0,
      now - timestamp,
    );

  const mins =
    Math.floor(
      diff / 60000,
    );

  if (mins < 1) {
    return "Just now";
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hrs =
    Math.floor(
      mins / 60,
    );

  if (hrs < 24) {
    return `${hrs}h ago`;
  }

  return `${Math.floor(
    hrs / 24,
  )}d ago`;
}