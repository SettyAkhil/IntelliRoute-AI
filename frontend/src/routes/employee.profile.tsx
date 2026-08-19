import { createFileRoute } from "@tanstack/react-router";
import { Mail, Save, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRequireRole } from "@/lib/use-require-role";
import { useStore } from "@/lib/ticket-store";

export const Route = createFileRoute("/employee/profile")({
  head: () => ({
    meta: [
      {
        title: "Profile — IntelliRoute AI",
      },
      {
        name: "description",
        content:
          "Manage your support agent profile and account information.",
      },
      {
        property: "og:title",
        content: "Profile — IntelliRoute AI",
      },
      {
        property: "og:description",
        content:
          "Manage your support agent profile and account information.",
      },
    ],
  }),

  component: EmployeeProfile,
});

function EmployeeProfile() {
  const ready = useRequireRole("employee");

  const { session, login } = useStore();

  const [name, setName] = useState(session?.name ?? "");
  const [saved, setSaved] = useState(false);

  if (!ready) {
    return null;
  }

  /*
   * ------------------------------------------------------------
   * INITIALS
   * ------------------------------------------------------------
   */

  const initials = (name || "U")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  /*
   * ------------------------------------------------------------
   * SAVE PROFILE
   * ------------------------------------------------------------
   */

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    /*
     * Employee sessions require a department.
     * Make sure the existing session has one before
     * passing it to login().
     */

    if (!session?.email || !session?.department) {
      return;
    }

    /*
     * Use the existing login() method to update the
     * current employee session.
     *
     * This also updates sessionStorage and the React store.
     */

    login({
      role: "employee",
      name: trimmedName,
      email: session.email,
      department: session.department,
    });

    setName(trimmedName);
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <AppShell
      role="employee"
      title="Profile"
      subtitle="Manage your account information"
    >
      {/* ======================================================
          PAGE BACKGROUND
      ====================================================== */}

      <div className="relative -mx-4 min-h-[calc(100vh-140px)] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 px-4 py-7 sm:-mx-6 sm:px-6 lg:py-9">

        {/* Background decorations */}

        <div className="pointer-events-none absolute -left-40 -top-32 size-[420px] rounded-full bg-blue-200/35 blur-3xl" />

        <div className="pointer-events-none absolute -right-40 bottom-0 size-[420px] rounded-full bg-sky-200/40 blur-3xl" />

        <div className="pointer-events-none absolute left-1/2 top-1/3 size-[300px] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <div className="relative z-10 mx-auto max-w-3xl">

          {/* ==================================================
              PROFILE CARD
          ================================================== */}

          <section className="overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-sm">

            {/* ==================================================
                PROFILE HEADER
            ================================================== */}

            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-6 py-7 sm:px-8">

              <div className="flex items-center gap-4">

                {/* Avatar */}

                <div className="grid size-16 shrink-0 place-items-center rounded-full border border-blue-200 bg-white text-xl font-bold text-blue-600 shadow-sm">
                  {initials}
                </div>

                {/* Employee information */}

                <div className="min-w-0">

                  <h2 className="truncate text-xl font-bold text-slate-950">
                    {name || "Employee"}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">

                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-4 text-blue-500" />

                      <span className="truncate">
                        {session?.email}
                      </span>
                    </span>

                    <span className="hidden text-slate-300 sm:inline">
                      •
                    </span>

                    <span className="font-medium text-slate-600">
                      {session?.department}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                ACCOUNT INFORMATION
            ================================================== */}

            <div className="bg-white p-6 sm:p-8">

              <div className="mb-7">

                <div className="flex items-center gap-3">

                  <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <User className="size-5" />
                  </div>

                  <div>

                    <h3 className="text-base font-bold text-slate-900">
                      Account Information
                    </h3>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Manage your personal profile information
                    </p>

                  </div>

                </div>

              </div>

              {/* ==================================================
                  FORM
              ================================================== */}

              <div className="grid gap-5 sm:grid-cols-2">

                {/* FULL NAME */}

                <div className="space-y-2">

                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Full name
                  </Label>

                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSaved(false);
                    }}
                    className="h-11 border-blue-200 bg-blue-50/30 text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:bg-white focus:ring-blue-500"
                  />

                </div>

                {/* DEPARTMENT */}

                <div className="space-y-2">

                  <Label
                    htmlFor="department"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Department
                  </Label>

                  <Input
                    id="department"
                    value={session?.department ?? ""}
                    readOnly
                    className="h-11 cursor-not-allowed border-blue-200 bg-slate-50 text-slate-600 shadow-sm"
                  />

                  <p className="text-[11px] text-slate-400">
                    Department is managed by your administrator.
                  </p>

                </div>

              </div>

              {/* ==================================================
                  SAVE AREA
              ================================================== */}

              <div className="mt-7 flex items-center justify-between border-t border-blue-100 pt-6">

                {/* SUCCESS MESSAGE */}

                <div className="min-h-5">

                  {saved ? (
                    <p className="text-sm font-medium text-emerald-600">
                      ✓ Changes saved successfully
                    </p>
                  ) : null}

                </div>

                {/* SAVE BUTTON */}

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!name.trim() || !session?.department}
                  className="h-10 gap-2 rounded-lg bg-blue-600 px-5 shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="size-4" />
                  Save Changes
                </Button>

              </div>

            </div>
          </section>

          {/* ==================================================
              ACCOUNT INFORMATION NOTE
          ================================================== */}

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3">

            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
              <ShieldCheck className="size-4" />
            </div>

            <div>

              <p className="text-sm font-semibold text-slate-800">
                Account information
              </p>

              <p className="mt-0.5 text-xs leading-5 text-slate-600">
                Your profile information is used to identify you
                when receiving and managing support tickets.
              </p>

            </div>

          </div>

        </div>
      </div>
    </AppShell>
  );
}