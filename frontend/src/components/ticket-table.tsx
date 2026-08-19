import { Link } from "@tanstack/react-router";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { formatDate, type Ticket } from "@/lib/ticket-store";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

export function TicketTable({
  tickets,
  variant,
  emptyLabel = "No tickets yet",
}: {
  tickets: Ticket[];
  variant: "customer" | "employee";
  emptyLabel?: string;
}) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Inbox className="size-5" />
        </span>
        <p className="text-sm font-medium text-foreground">{emptyLabel}</p>
        <p className="text-sm text-muted-foreground">Tickets will appear here once they are created.</p>
      </div>
    );
  }

  const to = variant === "customer" ? "/customer/tickets/$id" : "/employee/tickets/$id";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">{variant === "customer" ? "Assigned To" : "Customer"}</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium text-foreground">#{t.id}</td>
                <td className="max-w-[22rem] px-4 py-3">
                  <span className="block truncate text-foreground">{t.subject}</span>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {variant === "customer" ? t.assignee : t.customer}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.department}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={to} params={{ id: String(t.id) }}>
                      View Ticket
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-border md:hidden">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link to={to} params={{ id: String(t.id) }} className="block p-4 active:bg-secondary/50">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">#{t.id}</span>
                <StatusBadge status={t.status} />
              </div>
              <p className="mt-1 font-medium text-foreground">{t.subject}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <PriorityBadge priority={t.priority} />
                <span>{t.department}</span>
                <span>·</span>
                <span>{variant === "customer" ? t.assignee : t.customer}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}