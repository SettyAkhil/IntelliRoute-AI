import { cn } from "@/lib/utils";
import type { Priority, Status } from "@/lib/ticket-store";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

const priorityStyles: Record<Priority, string> = {
  High: "bg-danger-soft text-danger border-danger/20",
  Medium: "bg-warning-soft text-warning-foreground border-warning/30",
  Low: "bg-success-soft text-success border-success/20",
};

const statusStyles: Record<Status, string> = {
  Submitted: "bg-secondary text-secondary-foreground border-border",
  Assigned: "bg-info-soft text-info border-info/20",
  "In Progress": "bg-warning-soft text-warning-foreground border-warning/30",
  Resolved: "bg-success-soft text-success border-success/20",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn(base, priorityStyles[priority], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return <span className={cn(base, statusStyles[status], className)}>{status}</span>;
}