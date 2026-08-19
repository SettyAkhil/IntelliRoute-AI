import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TicketTable } from "@/components/ticket-table";
import { useRequireRole } from "@/lib/use-require-role";
import { useStore, type Status } from "@/lib/ticket-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/tickets/")({
  head: () => ({
    meta: [
      { title: "My Tickets — Support Workspace" },
      { name: "description", content: "Every ticket routed to you, filterable by status and priority." },
      { property: "og:title", content: "My Tickets — Support Workspace" },
      { property: "og:description", content: "Every ticket routed to you, filterable by status." },
    ],
  }),
  component: EmployeeTickets,
});

const filters: (Status | "All")[] = ["All", "Assigned", "In Progress", "Resolved"];

function EmployeeTickets() {
  const ready = useRequireRole("employee");
  const { tickets, session } = useStore();
  const [filter, setFilter] = useState<Status | "All">("All");
  if (!ready) return null;

  const mine = tickets.filter((t) => t.assignee === session?.name);
  const list = filter === "All" ? mine : mine.filter((t) => t.status === filter);

  return (
    <AppShell role="employee" title="My Assigned Tickets" subtitle="Tickets routed to you by workload">
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <TicketTable tickets={list} variant="employee" emptyLabel="No tickets in this view" />
    </AppShell>
  );
}