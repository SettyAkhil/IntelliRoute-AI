import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bot,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Ticket as TicketIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { useStore, type Role } from "@/lib/ticket-store";

type NavItem = {
  label: string;
  to: string;
  icon: typeof Bell;
};

/*
 * ============================================================
 * CUSTOMER NAVIGATION
 * ============================================================
 */

const customerNav: NavItem[] = [
  {
    label: "Dashboard",
    to: "/customer",
    icon: LayoutDashboard,
  },
  {
    label: "Submit Ticket",
    to: "/customer/submit",
    icon: PlusCircle,
  },
  {
    label: "My Tickets",
    to: "/customer/tickets",
    icon: TicketIcon,
  },
  {
    label: "Notifications",
    to: "/customer/notifications",
    icon: Bell,
  },
];

/*
 * ============================================================
 * EMPLOYEE NAVIGATION
 * ============================================================
 */

const employeeNav: NavItem[] = [
  {
    label: "Dashboard",
    to: "/employee",
    icon: LayoutDashboard,
  },
  {
    label: "My Tickets",
    to: "/employee/tickets",
    icon: TicketIcon,
  },
  {
    label: "Notifications",
    to: "/employee/notifications",
    icon: Bell,
  },
];

/*
 * ============================================================
 * BRAND
 * ============================================================
 */

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Bot className="size-5" />
      </span>

      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-foreground">
          IntelliRoute AI
        </p>

        <p className="truncate text-xs text-muted-foreground">
          Intelligent ML Support Workspace
        </p>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * NAVIGATION LINKS
 * ============================================================
 */

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.to === "/customer" || item.to === "/employee"
            ? pathname === item.to
            : pathname.startsWith(item.to);

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />

            <span className="truncate">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/*
 * ============================================================
 * APP SHELL
 * ============================================================
 */

export function AppShell({
  role,
  title,
  subtitle,
  actions,
  children,
}: {
  role: Role;
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
}) {
  const {
    session,
    logout,
    notifications,
  } = useStore();

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  /*
   * Select navigation based on role
   */

  const items =
    role === "customer"
      ? customerNav
      : employeeNav;

  /*
   * Unread notification count
   */

  const unread = notifications.filter(
    (notification) =>
      notification.audience === role &&
      !notification.read,
  ).length;

  /*
   * User initials
   */

  const initials = (session?.name ?? "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  /*
   * Logout
   */

  const signOut = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">

      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-5 lg:flex">

        <Brand />

        <div className="mt-7 flex-1">

          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {role === "customer"
              ? "Customer"
              : "Employee"}
          </p>

          <NavLinks items={items} />

        </div>

        {/* Logout */}

        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="size-4" />

          Logout
        </button>

      </aside>

      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div className="flex min-w-0 flex-1 flex-col">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">

            {/* LEFT SIDE */}

            <div className="flex min-w-0 items-center gap-3">

              {/* Mobile menu */}

              <Sheet
                open={open}
                onOpenChange={setOpen}
              >
                <SheetTrigger asChild>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                  >
                    <Menu className="size-5" />

                    <span className="sr-only">
                      Open menu
                    </span>
                  </Button>

                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-72 p-5"
                >
                  <SheetTitle className="sr-only">
                    Navigation
                  </SheetTitle>

                  <Brand />

                  <div className="mt-6">
                    <NavLinks
                      items={items}
                      onNavigate={() =>
                        setOpen(false)
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={signOut}
                    className="mt-6 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <LogOut className="size-4" />

                    Logout
                  </button>

                </SheetContent>
              </Sheet>

              {/* Page title */}

              <div className="min-w-0">

                <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
                  {title}
                </h1>

                {subtitle ? (
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    {subtitle}
                  </p>
                ) : null}

              </div>

            </div>

            {/* RIGHT SIDE */}

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">

              {/* Page actions */}

              {actions}

              {/* Notification button */}

              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative"
              >
                <Link
                  to={
                    role === "customer"
                      ? "/customer/notifications"
                      : "/employee/notifications"
                  }
                >
                  <Bell className="size-5" />

                  {unread > 0 ? (
                    <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-danger-foreground">
                      {unread}
                    </span>
                  ) : null}

                  <span className="sr-only">
                    Notifications
                  </span>
                </Link>
              </Button>

              {/* =================================================
                  USER MENU
                  No Profile option anymore
              ================================================= */}

              <DropdownMenu>

                <DropdownMenuTrigger asChild>

                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 transition-colors hover:bg-secondary"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {initials}
                    </span>

                    <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
                      {session?.name}
                    </span>
                  </button>

                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56"
                >

                  {/* User information */}

                  <DropdownMenuLabel>

                    <p className="text-sm font-medium">
                      {session?.name}
                    </p>

                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {session?.email}
                    </p>

                    {role === "employee" &&
                    session?.department ? (
                      <p className="mt-1 truncate text-xs font-normal text-muted-foreground">
                        {session.department}
                      </p>
                    ) : null}

                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* Logout only */}

                  <DropdownMenuItem
                    onClick={signOut}
                  >
                    <LogOut className="mr-2 size-4" />

                    Logout
                  </DropdownMenuItem>

                </DropdownMenuContent>

              </DropdownMenu>

            </div>

          </div>

        </header>

        {/* ======================================================
            PAGE CONTENT
        ====================================================== */}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
          {children}
        </main>

        {/* ======================================================
            MOBILE BOTTOM NAVIGATION
        ====================================================== */}

        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-flow-col border-t border-border bg-card/95 backdrop-blur lg:hidden">

          {items.map((item) => (

            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground"
              activeProps={{
                className: "text-primary",
              }}
              activeOptions={{
                exact:
                  item.to === "/customer" ||
                  item.to === "/employee",
              }}
            >

              <item.icon className="size-5" />

              {item.label}

            </Link>

          ))}

        </nav>

      </div>

    </div>
  );
}