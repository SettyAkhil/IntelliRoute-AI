import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock3,
  Inbox,
  Plus,
  Ticket as TicketIcon,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { TicketTable } from "@/components/ticket-table";
import { Button } from "@/components/ui/button";
import { useRequireRole } from "@/lib/use-require-role";
import { useStore } from "@/lib/ticket-store";

export const Route = createFileRoute("/customer/")({
  head: () => ({
    meta: [
      {
        title: "Customer Dashboard — IntelliRoute AI",
      },
      {
        name: "description",
        content:
          "Track your support tickets, status and resolution progress.",
      },
      {
        property: "og:title",
        content: "Customer Dashboard — IntelliRoute AI",
      },
      {
        property: "og:description",
        content:
          "Track your support tickets, status and resolution progress.",
      },
    ],
  }),

  component: CustomerDashboard,
});

function CustomerDashboard() {
  const ready = useRequireRole("customer");

  const { tickets, session } = useStore();

  /*
   * ------------------------------------------------------------
   * IMPORTANT:
   * All hooks are above the conditional return.
   *
   * This prevents:
   * "Rendered more hooks than during the previous render."
   * ------------------------------------------------------------
   */

  if (!ready) {
    return null;
  }

  /*
   * ------------------------------------------------------------
   * CUSTOMER TICKETS
   * ------------------------------------------------------------
   */

  const mine = tickets.filter((ticket) => {
    if (!session) {
      return false;
    }

    return (
      ticket.customerEmail === session.email ||
      ticket.customer === session.name
    );
  });

  /*
   * ------------------------------------------------------------
   * TICKET COUNTS
   * ------------------------------------------------------------
   */

  const totalTickets = mine.length;

  const openTickets = mine.filter(
    (ticket) =>
      ticket.status === "Submitted" ||
      ticket.status === "Assigned",
  ).length;

  const inProgressTickets = mine.filter(
    (ticket) => ticket.status === "In Progress",
  ).length;

  const resolvedTickets = mine.filter(
    (ticket) => ticket.status === "Resolved",
  ).length;

  /*
   * ------------------------------------------------------------
   * RECENT TICKETS
   *
   * No useMemo here.
   * This prevents the React hook-order problem.
   * ------------------------------------------------------------
   */

  const recentTickets = [...mine]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  /*
   * ------------------------------------------------------------
   * USER NAME
   * ------------------------------------------------------------
   */

  const firstName =
    session?.name?.split(" ")[0] ?? "there";

  return (
    <AppShell
      role="customer"
      title={`Welcome back, ${firstName}`}
      subtitle="Here's what's happening with your support requests"
      actions={
        <Button
          asChild
          size="sm"
          className="h-9 rounded-lg px-4 shadow-sm"
        >
          <Link to="/customer/submit">
            <Plus className="size-4" />

            <span className="hidden sm:inline">
              Submit Ticket
            </span>

            <span className="sm:hidden">
              New
            </span>
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-6xl space-y-5">

        {/* ======================================================
            WELCOME BANNER
        ====================================================== */}

        <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary-soft via-background to-info-soft/40 px-5 py-5 shadow-sm sm:px-6">

          {/* Decorative background */}

          <div className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full border-[35px] border-primary/5" />

          <div className="pointer-events-none absolute -bottom-28 right-28 size-48 rounded-full border-[30px] border-primary/5" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* LEFT */}

            <div className="min-w-0">

              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                Support workspace
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Welcome back, {firstName}
              </h2>

              <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm">
                Your support requests, ticket progress and
                resolutions are all in one place.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                <span className="rounded-full border border-primary/10 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  AI-powered routing
                </span>

                <span className="rounded-full border border-primary/10 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  Fast assignment
                </span>

                <span className="rounded-full border border-primary/10 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  Live ticket tracking
                </span>

              </div>

            </div>

            {/* RIGHT */}

            <div className="shrink-0">

              <Button
                asChild
                className="h-9 rounded-lg px-4 shadow-sm"
              >
                <Link to="/customer/submit">
                  Submit a Ticket
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                We'll route it to the right specialist.
              </p>

            </div>

          </div>
        </section>

        {/* ======================================================
            KPI CARDS
        ====================================================== */}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <DashboardCard
            label="Total Tickets"
            value={totalTickets}
            icon={TicketIcon}
            tone="primary"
            hint="All support requests"
          />

          <DashboardCard
            label="Open Tickets"
            value={openTickets}
            icon={Inbox}
            tone="info"
            hint="Need attention"
          />

          <DashboardCard
            label="In Progress"
            value={inProgressTickets}
            icon={Clock3}
            tone="warning"
            hint="Currently being resolved"
          />

          <DashboardCard
            label="Resolved"
            value={resolvedTickets}
            icon={TicketIcon}
            tone="success"
            hint="Successfully closed"
          />

        </section>

        {/* ======================================================
            RECENT TICKETS
        ====================================================== */}

        <section className="min-w-0">

          <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">

              <div>

                <h2 className="text-sm font-semibold text-foreground">
                  Recent Tickets
                </h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your latest support requests
                </p>

              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs"
              >
                <Link to="/customer/tickets">
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>

            </div>

            {/* TICKET TABLE */}

            <div className="overflow-hidden">

              <TicketTable
                tickets={recentTickets}
                variant="customer"
                emptyLabel="No tickets submitted yet"
              />

            </div>

          </div>

        </section>

      </div>
    </AppShell>
  );
}