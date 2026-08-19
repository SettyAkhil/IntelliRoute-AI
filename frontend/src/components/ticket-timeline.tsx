import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/ticket-store";

const steps: Status[] = ["Submitted", "Assigned", "In Progress", "Resolved"];

export function TicketTimeline({ status }: { status: Status }) {
  const current = Math.max(0, steps.indexOf(status));
  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex flex-1 gap-3 sm:flex-col sm:gap-2">
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold",
                  done && "border-success bg-success text-success-foreground",
                  active && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              {i < steps.length - 1 ? (
                <span
                  className={cn(
                    "my-1 w-0.5 flex-1 sm:mx-2 sm:my-0 sm:h-0.5 sm:w-auto",
                    i < current ? "bg-success" : "bg-border",
                  )}
                />
              ) : null}
            </div>
            <div className="pb-6 sm:pb-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </p>
              {active ? <p className="text-xs text-primary">Current stage</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}