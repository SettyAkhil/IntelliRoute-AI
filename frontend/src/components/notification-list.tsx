import { Link } from "@tanstack/react-router";
import { MessageCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  relativeTime,
  type AppNotification,
  type Role,
} from "@/lib/ticket-store";

function mongoIdToNumber(
  mongoId: string,
): number | undefined {
  if (!mongoId) {
    return undefined;
  }

  const lastSix = mongoId.slice(-6);
  const parsed = parseInt(lastSix, 16);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

export function NotificationList({
  notifications,
  role,
}: {
  notifications: AppNotification[];
  role: Role;
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-6 py-14 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-blue-100 text-blue-600">
          <Bell className="size-5" />
        </span>

        <p className="text-sm font-medium text-slate-900">
          You're all caught up
        </p>

        <p className="text-sm text-slate-600">
          New updates will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-xl border border-blue-200 bg-blue-100/60 shadow-sm">
      {notifications.map((n, index) => {
        /*
         * CUSTOMER:
         * The customer ticket-detail route expects
         * the MongoDB ObjectId.
         *
         * EMPLOYEE:
         * The employee ticket-detail route expects
         * the numeric frontend ticket ID.
         */
        const routeTicketId =
          role === "customer"
            ? n.mongoId
            : typeof n.ticketId === "number"
              ? n.ticketId
              : n.mongoId
                ? mongoIdToNumber(n.mongoId)
                : undefined;

        const body = (
          <div
            className={cn(
              "flex gap-4 px-5 py-5 transition-all duration-200",
              "border-b border-blue-200",
              "bg-blue-50/80",
              "hover:bg-blue-100",
              index === notifications.length - 1 &&
                "border-b-0",
              !n.read &&
                "bg-blue-100/90 hover:bg-blue-150",
            )}
          >
            {/* Message icon */}
            <span
              className={cn(
                "mt-0.5 grid size-10 shrink-0 place-items-center rounded-full border",
                n.read
                  ? "border-blue-200 bg-blue-100 text-blue-600"
                  : "border-blue-300 bg-blue-600 text-white shadow-sm",
              )}
            >
              <MessageCircle className="size-5" />
            </span>

            {/* Notification content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-semibold text-slate-900">
                  {n.title}
                </p>

                <span className="shrink-0 text-xs font-medium text-slate-500">
                  {relativeTime(n.at)}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-800">
                {n.body}
              </p>

              {n.meta ? (
                <p className="mt-1.5 text-xs font-medium text-slate-500">
                  {n.meta}
                </p>
              ) : null}
            </div>

            {/* Unread indicator */}
            {!n.read ? (
              <span className="mt-2 size-2.5 shrink-0 rounded-full bg-blue-600 shadow-sm" />
            ) : null}
          </div>
        );

        if (routeTicketId !== undefined) {
          return (
            <li key={n.id}>
              <Link
                to={
                  role === "customer"
                    ? "/customer/tickets/$id"
                    : "/employee/tickets/$id"
                }
                params={{
                  id: String(routeTicketId),
                }}
                className="block"
              >
                {body}
              </Link>
            </li>
          );
        }

        return (
          <li key={n.id}>
            {body}
          </li>
        );
      })}
    </ul>
  );
}