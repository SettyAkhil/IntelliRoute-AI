import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { NotificationList } from "@/components/notification-list";
import { useRequireRole } from "@/lib/use-require-role";
import { useStore } from "@/lib/ticket-store";

export const Route = createFileRoute("/employee/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Support Workspace" },
      { name: "description", content: "New ticket assignments, customer replies and escalations." },
      { property: "og:title", content: "Notifications — Support Workspace" },
      { property: "og:description", content: "New assignments, customer replies and escalations." },
    ],
  }),
  component: EmployeeNotifications,
});

function EmployeeNotifications() {
  const ready = useRequireRole("employee");
  const { notifications, markRead } = useStore();

  useEffect(() => {
    const t = setTimeout(() => markRead("employee"), 1200);
    return () => clearTimeout(t);
  }, [markRead]);

  if (!ready) return null;

  return (
    <AppShell role="employee" title="Notifications" subtitle="Tickets that need your attention">
      <NotificationList notifications={notifications.filter((n) => n.audience === "employee")} role="employee" />
    </AppShell>
  );
}