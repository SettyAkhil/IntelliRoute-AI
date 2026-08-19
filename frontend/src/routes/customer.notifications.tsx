import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bell, CheckCircle2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { NotificationList } from "@/components/notification-list";
import { useRequireRole } from "@/lib/use-require-role";
import { useStore } from "@/lib/ticket-store";

export const Route = createFileRoute("/customer/notifications")({
  head: () => ({
    meta: [
      {
        title: "Notifications — IntelliRoute AI",
      },
      {
        name: "description",
        content:
          "Updates on submissions, assignments and resolutions for your tickets.",
      },
      {
        property: "og:title",
        content: "Notifications — IntelliRoute AI",
      },
      {
        property: "og:description",
        content: "Updates on your support tickets.",
      },
    ],
  }),

  component: CustomerNotifications,
});

function CustomerNotifications() {
  const ready = useRequireRole("customer");
  const { notifications, markRead } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      markRead("customer");
    }, 1200);

    return () => clearTimeout(timer);
  }, [markRead]);

  if (!ready) return null;

  const customerNotifications = notifications.filter(
    (notification) => notification.audience === "customer",
  );

  const unreadCount = customerNotifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <AppShell
      role="customer"
      title="Notifications"
      subtitle="Stay updated on your support requests"
    >
      {/* ======================================================
          PAGE BACKGROUND
      ====================================================== */}

      <div className="relative -mx-4 min-h-[calc(100vh-140px)] overflow-hidden bg-gradient-to-br from-blue-100 via-sky-100 to-blue-200 px-4 py-7 sm:-mx-6 sm:px-6 lg:py-9">

        {/* Background glow */}

        <div className="pointer-events-none absolute -left-40 -top-32 size-[400px] rounded-full bg-blue-300/20 blur-3xl" />

        <div className="pointer-events-none absolute -right-40 bottom-0 size-[400px] rounded-full bg-sky-300/20 blur-3xl" />

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="relative z-10 mx-auto max-w-4xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-5 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <Bell className="size-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Recent updates
                </h2>

                <p className="text-sm text-slate-500">
                  Activity from your support tickets
                </p>
              </div>

            </div>

            {/* UNREAD / ALL CAUGHT UP */}

            {unreadCount > 0 ? (
              <span className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm">
                {unreadCount} unread
              </span>
            ) : (
              <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 sm:flex">
                <CheckCircle2 className="size-4 text-emerald-500" />
                All caught up
              </span>
            )}

          </div>

          {/* ==================================================
              NOTIFICATION LIST
          ================================================== */}

          {customerNotifications.length > 0 ? (
            <div className="space-y-3">
              <NotificationList
                notifications={customerNotifications}
                role="customer"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto grid size-12 place-items-center rounded-full bg-blue-50 text-blue-600">
                <Bell className="size-5" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-900">
                No notifications yet
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Updates about your support tickets, assignments,
                responses and resolutions will appear here.
              </p>

            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}