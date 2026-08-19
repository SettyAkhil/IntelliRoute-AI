import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { TicketTable } from "@/components/ticket-table";
import { useRequireRole } from "@/lib/use-require-role";
import { useStore, type Status, type Ticket } from "@/lib/ticket-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customer/tickets/")({
  head: () => ({
    meta: [
      {
        title: "My Tickets â€” IntelliRoute AI",
      },
      {
        name: "description",
        content:
          "Browse every support ticket you have submitted and its live status.",
      },
      {
        property: "og:title",
        content: "My Tickets â€” IntelliRoute AI",
      },
      {
        property: "og:description",
        content:
          "Browse every support ticket you have submitted.",
      },
    ],
  }),

  component: MyTickets,
});

const filters: (Status | "All")[] = [
  "All",
  "Assigned",
  "In Progress",
  "Resolved",
];

function MyTickets() {
  const ready = useRequireRole("customer");
  const { session } = useStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<Status | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.email) return;

    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://intelliroute-ai-production.up.railway.app/api/customer/tickets/${encodeURIComponent(
            session.email,
          )}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load tickets.",
          );
        }

        const formattedTickets: Ticket[] = data.map(
          (ticket: any) => ({
            id: ticket._id,
            subject: ticket.subject,
            description: ticket.description,
            customer: ticket.customer,
            customerEmail: ticket.customer_email,
            type: ticket.type,
            priority: ticket.priority,
            department: ticket.department,
            assignee: ticket.assigned_employee,
            status: ticket.status,
            createdAt: ticket.created_at,
            messages: [],
          }),
        );

        setTickets(formattedTickets);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your tickets.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [session?.email]);

  if (!ready) return null;

  const list =
    filter === "All"
      ? tickets
      : tickets.filter(
          (ticket) => ticket.status === filter,
        );

  return (
    <AppShell
      role="customer"
      title="My Tickets"
      subtitle="Track your support requests and their progress"
    >
      <div className="space-y-5">

        {/* ======================================================
            FILTERS
        ====================================================== */}

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Filter
          </span>

          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary-soft hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ======================================================
            TICKET LIST
        ====================================================== */}

        {loading ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              Loading your tickets...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-4 text-sm text-danger">
            {error}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

            {/* Table heading */}

            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Ticket History
                </h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {list.length}{" "}
                  {list.length === 1
                    ? "ticket"
                    : "tickets"}{" "}
                  shown
                </p>
              </div>

              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                Live status
              </span>
            </div>

            {/* Ticket table */}

            <div className="overflow-x-auto">
              <TicketTable
                tickets={list}
                variant="customer"
                emptyLabel="No tickets in this view"
              />
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}