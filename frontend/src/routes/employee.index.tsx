import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  Ticket as TicketIcon,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { TicketTable } from "@/components/ticket-table";
import { Button } from "@/components/ui/button";
import { useRequireRole } from "@/lib/use-require-role";
import { useStore } from "@/lib/ticket-store";

export const Route = createFileRoute("/employee/")({
  head: () => ({
    meta: [
      {
        title: "Employee Dashboard — IntelliRoute AI",
      },
      {
        name: "description",
        content:
          "View assigned support tickets, workload and resolution progress.",
      },
      {
        property: "og:title",
        content: "Employee Dashboard — IntelliRoute AI",
      },
      {
        property: "og:description",
        content:
          "View assigned support tickets, workload and resolution progress.",
      },
    ],
  }),

  component: EmployeeDashboard,
});

function EmployeeDashboard() {
  const ready = useRequireRole("employee");
  const { tickets, session } = useStore();

  if (!ready) return null;

  /*
   * ------------------------------------------------------------
   * PERMANENT EMPLOYEE IDENTITY
   *
   * The profile name can change.
   * The identityName stays the same and is used for
   * matching existing ML-routed tickets.
   * ------------------------------------------------------------
   */

  const employeeIdentity =
    session?.identityName ??
    session?.name ??
    "";

  /*
   * ------------------------------------------------------------
   * EMPLOYEE TICKETS
   * ------------------------------------------------------------
   */

  const mine = tickets.filter(
    (ticket) =>
      ticket.assignee
        .trim()
        .toLowerCase() ===
      employeeIdentity
        .trim()
        .toLowerCase(),
  );

  /*
   * ------------------------------------------------------------
   * COUNTS
   * ------------------------------------------------------------
   */

  const newTickets = mine.filter(
    (ticket) =>
      ticket.status === "Assigned",
  ).length;

  const assignedTickets =
    mine.length;

  const inProgressTickets =
    mine.filter(
      (ticket) =>
        ticket.status ===
        "In Progress",
    ).length;

  const resolvedTickets =
    mine.filter(
      (ticket) =>
        ticket.status ===
        "Resolved",
    ).length;

  /*
   * ------------------------------------------------------------
   * RECENT TICKETS
   * ------------------------------------------------------------
   */

  const recentTickets = [...mine]
    .sort(
      (a, b) =>
        new Date(
          b.createdAt,
        ).getTime() -
        new Date(
          a.createdAt,
        ).getTime(),
    )
    .slice(0, 6);

  /*
   * ------------------------------------------------------------
   * DISPLAY NAME
   * ------------------------------------------------------------
   */

  const firstName =
    session?.name
      ?.split(" ")[0] ??
    "there";

  return (
    <AppShell
      role="employee"
      title={`Welcome back, ${firstName}`}
      subtitle={`${session?.department ?? "Support"} · Support agent`}
    >
      <div className="mx-auto max-w-6xl space-y-5">

        {/* ======================================================
            WELCOME SECTION
        ====================================================== */}

        <section className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-5 py-5 shadow-sm sm:px-6">

          {/* Decorative circles */}

          <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full border-[38px] border-blue-100/70" />

          <div className="pointer-events-none absolute -bottom-32 right-36 size-52 rounded-full border-[30px] border-sky-100/70" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            {/* LEFT */}

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
                  Support workspace
                </span>

              </div>

              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                Welcome back, {firstName}
              </h2>

              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                Manage your assigned tickets,
                respond to customers, and keep
                support requests moving toward
                resolution.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                <span className="rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[10px] font-medium text-slate-600">
                  IntelliRoute AI
                </span>

                <span className="rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[10px] font-medium text-slate-600">
                  Workload-aware assignment
                </span>

                <span className="rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[10px] font-medium text-slate-600">
                  Live ticket updates
                </span>

              </div>

            </div>

            {/* RIGHT */}

            <div className="relative shrink-0">

              <Button
                asChild
                className="h-9 rounded-lg bg-blue-600 px-4 shadow-sm hover:bg-blue-700"
              >
                <Link to="/employee/tickets">
                  View My Tickets
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <p className="mt-1.5 text-center text-[10px] text-slate-500">
                Manage your assigned support requests.
              </p>

            </div>

          </div>
        </section>

        {/* ======================================================
            KPI CARDS
        ====================================================== */}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <DashboardCard
            label="New Tickets"
            value={newTickets}
            icon={Inbox}
            tone="info"
            hint="Awaiting first response"
          />

          <DashboardCard
            label="Assigned Tickets"
            value={assignedTickets}
            icon={TicketIcon}
            tone="primary"
            hint="Tickets assigned to you"
          />

          <DashboardCard
            label="In Progress"
            value={inProgressTickets}
            icon={Clock}
            tone="warning"
            hint="Currently being resolved"
          />

          <DashboardCard
            label="Resolved"
            value={resolvedTickets}
            icon={CheckCircle2}
            tone="success"
            hint="Successfully closed"
          />

        </section>

        {/* ======================================================
            ASSIGNED TICKETS
        ====================================================== */}

        <section className="min-w-0">

          <div className="min-w-0 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

            {/* TABLE HEADER */}

            <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50/70 to-white px-4 py-3 sm:px-5">

              <div>

                <h2 className="text-sm font-semibold text-slate-900">
                  My Assigned Tickets
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Tickets currently assigned to you
                </p>

              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-blue-200 bg-white px-3 text-xs text-blue-700 hover:bg-blue-50 hover:text-blue-700"
              >
                <Link to="/employee/tickets">
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>

            </div>

            {/* TABLE */}

            <div className="overflow-hidden">

              <TicketTable
                tickets={recentTickets}
                variant="employee"
                emptyLabel="No tickets assigned to you right now"
              />

            </div>

          </div>

        </section>

      </div>
    </AppShell>
  );
}