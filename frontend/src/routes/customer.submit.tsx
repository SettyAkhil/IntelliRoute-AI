import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  CircleCheck,
  Loader2,
  Route as RouteIcon,
  Sparkles,
  TicketCheck,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { useRequireRole } from "@/lib/use-require-role";
import { useStore, type Ticket } from "@/lib/ticket-store";

export const Route = createFileRoute("/customer/submit")({
  head: () => ({
    meta: [
      {
        title: "Submit a Support Ticket â€” IntelliRoute AI",
      },
      {
        name: "description",
        content:
          "Describe your issue and we'll route it to the right support specialist automatically.",
      },
      {
        property: "og:title",
        content: "Submit a Support Ticket â€” IntelliRoute AI",
      },
      {
        property: "og:description",
        content:
          "Describe your issue and we'll route it to the right team.",
      },
    ],
  }),

  component: SubmitTicket,
});

function SubmitTicket() {
  const ready = useRequireRole("customer");
  const { session } = useStore();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Ticket | null>(null);

  if (!ready) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      subject.trim().length < 4 ||
      description.trim().length < 10
    ) {
      setError(
        "Please add a clear subject and describe your issue in at least a sentence.",
      );
      return;
    }

    if (!session?.name || !session?.email) {
      setError(
        "Customer information is missing. Please log in again.",
      );
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        "https://intelliroute-ai-production.up.railway.app/api/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: subject.trim(),
            description: description.trim(),
            customer: session.name,
            customer_email: session.email,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to submit ticket.",
        );
      }

      setCreated({
        id: data.id,
        mongoId: data._id ?? data.id,
        subject: data.subject,
        description: data.description,
        customer: data.customer,
        customerEmail: data.customer_email,
        type: data.type,
        priority: data.priority,
        department: data.department,
        assignee: data.assigned_employee ?? "",
        status: data.status,
        createdAt:
          data.created_at ?? new Date().toISOString(),
        messages: [],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit ticket. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     SUCCESS STATE
  ============================================================ */

  if (created) {
    return (
      <AppShell
        role="customer"
        title="Ticket Submitted"
        subtitle="We've routed your request"
      >
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/80 shadow-[0_18px_50px_-25px_rgba(37,99,235,0.35)]">

            {/* SUCCESS HEADER */}

            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/60 px-6 py-8 text-center sm:px-10">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <CheckCircle2 className="size-8" />
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Successfully submitted
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Your ticket is on its way
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Our AI routing system has analyzed your
                request and assigned it to the appropriate
                support specialist.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <TicketCheck className="size-4 text-blue-600" />
                Ticket #{created.id}
              </div>
            </div>

            {/* TICKET DETAILS */}

            <div className="p-6 sm:p-8">
              <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 sm:grid-cols-2">

                <Row
                  label="Type"
                  value={created.type}
                />

                <Row
                  label="Priority"
                  value={
                    <PriorityBadge
                      priority={created.priority}
                    />
                  }
                />

                <Row
                  label="Department"
                  value={created.department}
                />

                <Row
                  label="Assigned To"
                  value={
                    created.assignee ||
                    "Being assigned"
                  }
                />

                <Row
                  label="Status"
                  value={
                    <StatusBadge
                      status={created.status}
                    />
                  }
                />

                <Row
                  label="Ticket ID"
                  value={`#${created.id}`}
                />

              </div>

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600" />

                  <p className="text-sm leading-6 text-blue-900">
                    You can follow your ticket's progress
                    from <strong>My Tickets</strong>. You'll
                    also receive notifications when the
                    support team updates your request.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">

                <Button
                  asChild
                  className="h-11 rounded-xl bg-blue-600 px-6 shadow-md shadow-blue-600/20 hover:bg-blue-700"
                >
                  <Link
                    to="/customer/tickets/$id"
                    params={{
                      id: created.mongoId,
                    }}
                  >
                    View Ticket
                    <RouteIcon className="ml-2 size-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200 px-6"
                  onClick={() => {
                    setCreated(null);
                    setSubject("");
                    setDescription("");
                    setError(null);
                  }}
                >
                  Submit another ticket
                </Button>

              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ============================================================
     SUBMIT FORM
  ============================================================ */

  return (
    <AppShell
      role="customer"
      title="Submit a Support Ticket"
      subtitle="Tell us what's going on"
    >
      {/* ========================================================
          VISIBLE BLUE PAGE BACKGROUND
      ======================================================== */}

      <div className="relative -mx-4 min-h-[calc(100vh-140px)] overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/70 px-4 py-8 sm:-mx-6 sm:px-6 lg:py-10">

        {/* BACKGROUND GLOW */}

        <div className="pointer-events-none absolute -left-32 -top-24 size-[360px] rounded-full bg-blue-300/25 blur-3xl" />

        <div className="pointer-events-none absolute -right-32 bottom-0 size-[320px] rounded-full bg-sky-300/25 blur-3xl" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/20 blur-3xl" />

        {/* ========================================================
            CONTENT
        ======================================================== */}

        <div className="relative z-10 mx-auto max-w-5xl">

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

            {/* ====================================================
                FORM CARD
            ==================================================== */}

            <form
              onSubmit={submit}
              className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_50px_-25px_rgba(37,99,235,0.35)]"
            >

              {/* AI HEADER */}

              <div className="border-b border-blue-200 bg-gradient-to-r from-blue-100 via-blue-50 to-sky-50 px-6 py-5 sm:px-7">
                <div className="flex items-start gap-3">

                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                    <Sparkles className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      AI-powered ticket routing
                    </p>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Your issue will be analyzed automatically
                      and routed to the support specialist best
                      suited to handle it.
                    </p>
                  </div>

                </div>
              </div>

              {/* FORM BODY */}

              <div className="bg-blue-50/40 p-6 sm:p-7">

                <div className="space-y-5">

                  {/* SUBJECT */}

                  <div className="space-y-2">

                    <Label
                      htmlFor="subject"
                      className="text-sm font-semibold text-slate-900"
                    >
                      Subject
                    </Label>

                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) =>
                        setSubject(e.target.value)
                      }
                      placeholder="e.g. Unable to access company email"
                      className="h-12 rounded-xl border-blue-100 bg-white px-4 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                    />

                    <p className="text-xs text-slate-400">
                      Give your issue a short, clear title.
                    </p>

                  </div>

                  {/* DESCRIPTION */}

                  <div className="space-y-2">

                    <Label
                      htmlFor="description"
                      className="text-sm font-semibold text-slate-900"
                    >
                      Description
                    </Label>

                    <Textarea
                      id="description"
                      rows={7}
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      placeholder="Describe what happened, what you tried, and any error message you received..."
                      className="resize-none rounded-xl border-blue-100 bg-white px-4 py-3 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                    />

                    <p className="text-xs text-slate-400">
                      More details help the AI routing system
                      understand your issue accurately.
                    </p>

                  </div>

                  {/* ERROR */}

                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm leading-5 text-red-700">
                        {error}
                      </p>
                    </div>
                  ) : null}

                  {/* SUBMIT BUTTON */}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Analyzing & routing ticketâ€¦
                      </>
                    ) : (
                      <>
                        Submit Ticket
                        <RouteIcon className="ml-2 size-4" />
                      </>
                    )}
                  </Button>

                </div>
              </div>

            </form>

            {/* ====================================================
                SMART ROUTING CARD
            ==================================================== */}

            <aside className="h-fit rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-5 shadow-[0_18px_45px_-30px_rgba(37,99,235,0.35)] sm:p-6">

              <div className="flex items-center gap-2">

                <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <RouteIcon className="size-4" />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                    Smart routing
                  </p>

                  <h3 className="mt-0.5 text-base font-bold text-slate-950">
                    What happens next?
                  </h3>

                </div>

              </div>

              <div className="mt-6 space-y-5">

                <ProcessStep
                  number="01"
                  title="AI analyzes your issue"
                  text="The system understands the subject and description."
                />

                <ProcessStep
                  number="02"
                  title="Priority is predicted"
                  text="The urgency of your request is automatically determined."
                />

                <ProcessStep
                  number="03"
                  title="Department is selected"
                  text="Your ticket is routed to the appropriate support team."
                />

                <ProcessStep
                  number="04"
                  title="Best agent is assigned"
                  text="Active employee workload is considered before assignment."
                />

              </div>

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex items-center gap-2">

                  <CircleCheck className="size-4 text-emerald-600" />

                  <p className="text-xs font-semibold text-slate-700">
                    Automated from start to finish
                  </p>

                </div>

                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  No manual routing is required. The system
                  handles the initial support decision automatically.
                </p>

              </div>

            </aside>

          </div>

        </div>

      </div>
    </AppShell>
  );
}

/* ================================================================
   PROCESS STEP
================================================================ */

function ProcessStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">

      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-100 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
        {number}
      </span>

      <div className="min-w-0">

        <h4 className="text-sm font-semibold text-slate-900">
          {title}
        </h4>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {text}
        </p>

      </div>

    </div>
  );
}

/* ================================================================
   SUCCESS DETAIL ROW
================================================================ */

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-white px-4 py-4">

      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>

      <dd className="mt-1.5 text-sm font-semibold text-slate-900">
        {value}
      </dd>

    </div>
  );
}