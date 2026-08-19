import {
  createFileRoute,
  Link,
  useParams,
} from "@tanstack/react-router";

import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import {
  PriorityBadge,
  StatusBadge,
} from "@/components/badges";
import { TicketTimeline } from "@/components/ticket-timeline";
import { Button } from "@/components/ui/button";
import { useRequireRole } from "@/lib/use-require-role";
import {
  formatDate,
  useStore,
  type Ticket,
} from "@/lib/ticket-store";

const API_URL = "https://intelliroute-ai-production.up.railway.app";
const POLL_INTERVAL = 3000;

export const Route = createFileRoute(
  "/customer/tickets/$id",
)({
  head: () => ({
    meta: [
      {
        title: "Ticket Details â€” IntelliRoute AI",
      },
      {
        name: "description",
        content:
          "Follow your ticket's classification, assignment and resolution.",
      },
    ],
  }),

  component: CustomerTicketDetail,
});

function CustomerTicketDetail() {
  const ready = useRequireRole("customer");

  const { id } = useParams({
    from: "/customer/tickets/$id",
  });

  const { tickets } = useStore();

  /*
   * Find the ticket using either:
   * - MongoDB ObjectId
   * - Frontend ticket ID
   */
  const localTicket = tickets.find(
    (ticket) =>
      ticket.mongoId === id ||
      String(ticket.id) === id,
  );

  /*
   * Get the real MongoDB ID.
   */
  const mongoId =
    localTicket?.mongoId ??
    (/^[a-fA-F0-9]{24}$/.test(id) ? id : "");

  const [remoteTicket, setRemoteTicket] =
    useState<Ticket | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Convert backend ticket into frontend Ticket format.
   */
  const normalizeTicket = (data: any): Ticket => {
    const backendMongoId = String(
      data._id ?? mongoId ?? "",
    );

    const numericId =
      typeof data.id === "number"
        ? data.id
        : localTicket?.id ?? 0;

    return {
      id: numericId,
      mongoId: backendMongoId,

      subject: data.subject ?? "",
      description: data.description ?? "",

      customer: data.customer ?? "",
      customerEmail: data.customer_email ?? "",

      type: data.type,
      priority: data.priority,

      department: data.department,

      assignee:
        data.assigned_employee ?? "",

      status: data.status,

      createdAt:
        data.created_at ??
        new Date().toISOString(),

      resolvedAt:
        data.resolved_at ?? undefined,

      messages: Array.isArray(data.messages)
        ? data.messages.map(
            (message: any, index: number) => ({
              id: String(
                message.id ??
                  message._id ??
                  `${message.at ?? ""}-${index}`,
              ),

              author:
                message.author ?? "Support",

              role:
                message.role === "customer"
                  ? "customer"
                  : "employee",

              body:
                message.body ?? "",

              at:
                message.at ??
                new Date().toISOString(),
            }),
          )
        : [],
    };
  };

  /*
   * Fetch the ticket using the real MongoDB ID.
   */
  const fetchLatestTicket = async (
    showLoader = false,
  ) => {
    if (!mongoId) {
      setError(
        "Unable to determine the ticket ID.",
      );
      return;
    }

    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `${API_URL}/api/tickets/${encodeURIComponent(
          mongoId,
        )}`,
        {
          cache: "no-store",
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ?? "Ticket not found.",
        );
      }

      setRemoteTicket(
        normalizeTicket(data),
      );

      setError(null);
    } catch (err) {
      console.error(
        "Failed to load ticket:",
        err,
      );

      if (!localTicket) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load ticket.",
        );
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  /*
   * Initial ticket load + polling.
   */
  useEffect(() => {
    if (!ready || !mongoId) {
      return;
    }

    fetchLatestTicket(
      !localTicket && !remoteTicket,
    );

    const intervalId =
      window.setInterval(() => {
        fetchLatestTicket(false);
      }, POLL_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [id, mongoId, ready]);

  if (!ready) {
    return null;
  }

  /*
   * Prefer the latest backend ticket.
   */
  const ticket =
    remoteTicket ?? localTicket;

  /*
   * Loading state.
   */
  if (loading && !ticket) {
    return (
      <AppShell
        role="customer"
        title="Loading Ticket"
      >
        <div className="flex min-h-60 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading ticket...
          </div>
        </div>
      </AppShell>
    );
  }

  /*
   * Ticket not found.
   */
  if (!ticket) {
    return (
      <AppShell
        role="customer"
        title="Ticket not found"
      >
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {error ??
              "We couldn't find that ticket."}
          </p>

          <Button
            asChild
            className="mt-4"
          >
            <Link to="/customer/tickets">
              Back to My Tickets
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const lastResponse =
    ticket.messages.length > 0
      ? ticket.messages[
          ticket.messages.length - 1
        ]
      : undefined;

  return (
    <AppShell
      role="customer"
      title={`Ticket #${ticket.id}`}
      subtitle={ticket.subject}
    >
      {/* Back button */}

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
      >
        <Link to="/customer/tickets">
          <ArrowLeft className="size-4" />
          Back to My Tickets
        </Link>
      </Button>

      {/* Resolved message */}

      {ticket.status === "Resolved" && (
        <div className="mb-6 rounded-xl border border-success/25 bg-success-soft p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" />

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                Your issue has been successfully
                resolved.
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Resolved by{" "}
                {ticket.assignee ||
                  "Support"}
                {ticket.resolvedAt
                  ? ` Â· ${formatDate(
                      ticket.resolvedAt,
                    )}`
                  : ""}
              </p>

              {lastResponse && (
                <p className="mt-3 rounded-lg bg-card p-3 text-sm text-foreground">
                  {lastResponse.body}
                </p>
              )}

              <p className="mt-3 text-sm font-medium text-foreground">
                Thank you for reaching out!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left */}

        <div className="space-y-6 lg:col-span-2">
          {/* Ticket information */}

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={ticket.status}
              />

              <PriorityBadge
                priority={ticket.priority}
              />

              <span className="text-xs text-muted-foreground">
                Created{" "}
                {formatDate(
                  ticket.createdAt,
                )}
              </span>
            </div>

            <h2 className="mt-3 text-lg font-semibold text-foreground">
              {ticket.subject}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {ticket.description}
            </p>
          </section>

          {/* Timeline */}

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h3 className="mb-5 text-sm font-semibold text-foreground">
              Status timeline
            </h3>

            <TicketTimeline
              status={ticket.status}
            />
          </section>

          {/* Conversation */}

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare className="size-4 text-muted-foreground" />
              Updates from your support agent
            </h3>

            {ticket.messages.length ===
            0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No updates yet â€” you'll be
                notified as soon as{" "}
                {ticket.assignee ||
                  "your support agent"}{" "}
                responds.
              </p>
            ) : (
              <ul className="space-y-3">
                {ticket.messages.map(
                  (message) => (
                    <li
                      key={message.id}
                      className="rounded-lg border border-border bg-secondary/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {message.author}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {formatDate(
                            message.at,
                          )}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {message.body}
                      </p>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        </div>

        {/* Right */}

        <div className="space-y-6">
          {/* Classification */}

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 text-primary" />
              Automatic classification
            </h3>

            <dl className="mt-4 space-y-3 text-sm">
              <Field
                label="Type"
                value={ticket.type}
              />

              <Field
                label="Priority"
                value={
                  <PriorityBadge
                    priority={
                      ticket.priority
                    }
                  />
                }
              />

              <Field
                label="Department"
                value={
                  ticket.department
                }
              />
            </dl>
          </section>

          {/* Assignment */}

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              Assignment
            </h3>

            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                {ticket.assignee
                  ? ticket.assignee
                      .split(" ")
                      .map(
                        (part) =>
                          part[0],
                      )
                      .join("")
                  : "NA"}
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {ticket.assignee ||
                    "Not assigned"}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {ticket.department}
                </p>
              </div>
            </div>
          </section>

          {/* Ticket ID */}

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              Ticket ID
            </h3>

            <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
              {ticket.mongoId}
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">
        {label}
      </dt>

      <dd className="font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}