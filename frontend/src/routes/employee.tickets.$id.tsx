import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { TicketTimeline } from "@/components/ticket-timeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRequireRole } from "@/lib/use-require-role";
import { formatDate, useStore, type Status } from "@/lib/ticket-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/tickets/$id")({
  head: () => ({
    meta: [
      { title: "Ticket Details — Support Workspace" },
      { name: "description", content: "Review the ticket, update its status and respond to the customer." },
      { property: "og:title", content: "Ticket Details — Support Workspace" },
      { property: "og:description", content: "Review, update and respond to a customer ticket." },
    ],
  }),
  component: EmployeeTicketDetail,
});

const statuses: Status[] = ["Assigned", "In Progress", "Resolved"];

function EmployeeTicketDetail() {
  const ready = useRequireRole("employee");
  const { id } = useParams({ from: "/employee/tickets/$id" });
  const { tickets, updateStatus, addResponse } = useStore();
  const [response, setResponse] = useState("");
  const [confirmResolve, setConfirmResolve] = useState(false);
  const ticket = tickets.find((t) => String(t.id) === id);
  if (!ready) return null;

  if (!ticket) {
    return (
      <AppShell role="employee" title="Ticket not found">
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">We couldn't find that ticket.</p>
          <Button asChild className="mt-4">
            <Link to="/employee/tickets">Back to My Tickets</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const setStatus = (s: Status) => {
    if (s === "Resolved") {
      setConfirmResolve(true);
      return;
    }
    updateStatus(ticket.id, s);
    toast.success(`Ticket #${ticket.id} moved to ${s}`);
  };

  const send = () => {
    if (response.trim().length < 3) return;
    addResponse(ticket.id, response.trim());
    setResponse("");
    toast.success("Response sent to the customer");
  };

  return (
    <AppShell role="employee" title={`Ticket #${ticket.id}`} subtitle={ticket.subject}>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/employee/tickets">
          <ArrowLeft className="size-4" /> Back to My Tickets
        </Link>
      </Button>

      {ticket.status === "Resolved" ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/25 bg-success-soft p-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-semibold text-foreground">This ticket is resolved</p>
            <p className="text-sm text-muted-foreground">
              Closed by {ticket.assignee}
              {ticket.resolvedAt ? ` · ${formatDate(ticket.resolvedAt)}` : ""}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs text-muted-foreground">Created {formatDate(ticket.createdAt)}</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-foreground">{ticket.subject}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ticket.description}</p>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h3 className="mb-5 text-sm font-semibold text-foreground">Progress</h3>
            <TicketTimeline status={ticket.status} />
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h3 className="text-sm font-semibold text-foreground">Conversation</h3>
            {ticket.messages.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No responses yet. Send the first update to the customer.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {ticket.messages.map((m) => (
                  <li key={m.id} className="rounded-lg border border-border bg-secondary/50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{m.author}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(m.at)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Add Response</h4>
              <Textarea
                rows={4}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write response to customer..."
              />
              <Button onClick={send} disabled={response.trim().length < 3}>
                <Send className="size-4" /> Send Response
              </Button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Status controls</h3>
            <div className="mt-4 flex flex-col gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                    ticket.status === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Ticket details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Field label="Customer" value={ticket.customer} />
              <Field label="Type" value={ticket.type} />
              <Field label="Priority" value={<PriorityBadge priority={ticket.priority} />} />
              <Field label="Department" value={ticket.department} />
              <Field label="Assigned" value={ticket.assignee} />
              <Field label="Created" value={formatDate(ticket.createdAt)} />
            </dl>
          </section>
        </div>
      </div>

      <AlertDialog open={confirmResolve} onOpenChange={setConfirmResolve}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              The customer will be notified that ticket #{ticket.id} has been resolved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                updateStatus(ticket.id, "Resolved");
                toast.success(`Ticket #${ticket.id} marked as resolved`);
              }}
            >
              Mark as Resolved
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}