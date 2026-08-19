import { createFileRoute } from "@tanstack/react-router";
import { Mail, Save, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRequireRole } from "@/lib/use-require-role";
import { useStore } from "@/lib/ticket-store";

export const Route = createFileRoute("/customer/profile")({
  head: () => ({
    meta: [
      {
        title: "Profile — IntelliRoute AI",
      },
      {
        name: "description",
        content:
          "Manage your customer account details and contact information.",
      },
      {
        property: "og:title",
        content: "Profile — IntelliRoute AI",
      },
      {
        property: "og:description",
        content: "Manage your customer account details.",
      },
    ],
  }),

  component: CustomerProfile,
});

function CustomerProfile() {
  const ready = useRequireRole("customer");
  const { session, login } = useStore();

  const [name, setName] = useState(session?.name ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!ready || !session) {
    return null;
  }

  const initials = (name || session.name || "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    setSaved(false);
    setError("");

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    login({
      ...session,
      name: trimmedName,
      email: trimmedEmail,
    });

    setName(trimmedName);
    setEmail(trimmedEmail);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <AppShell
      role="customer"
      title="Profile"
      subtitle="Manage your account information"
    >
      {/* =====================================================
          PAGE BACKGROUND
      ====================================================== */}

      <div className="relative -mx-4 min-h-[calc(100vh-140px)] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8 sm:-mx-6 sm:px-6 lg:py-12">

        {/* Background decorations */}

        <div className="pointer-events-none absolute -left-40 -top-40 size-[500px] rounded-full bg-blue-200/40 blur-[120px]" />

        <div className="pointer-events-none absolute -right-40 top-1/3 size-[500px] rounded-full bg-indigo-200/35 blur-[120px]" />

        <div className="pointer-events-none absolute bottom-[-200px] left-1/3 size-[500px] rounded-full bg-sky-200/35 blur-[120px]" />

        {/* =================================================
            MAIN CONTENT
        ================================================== */}

        <div className="relative z-10 mx-auto max-w-3xl">

          {/* =================================================
              PROFILE CARD
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl shadow-blue-900/10">

            {/* =================================================
                PROFILE HEADER
            ================================================= */}

            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 px-6 py-8 sm:px-9 sm:py-9">

              <div className="flex items-center gap-5">

                {/* Avatar */}

                <div className="grid size-16 shrink-0 place-items-center rounded-full border border-blue-200 bg-white text-xl font-bold text-blue-600 shadow-sm sm:size-20 sm:text-2xl">
                  {initials}
                </div>

                {/* User information */}

                <div className="min-w-0">

                  <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                    {name || "Customer"}
                  </h2>

                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                    <Mail className="size-4 shrink-0 text-blue-500" />

                    <span className="truncate">
                      {email}
                    </span>

                  </div>

                </div>

              </div>
            </div>

            {/* =================================================
                ACCOUNT INFORMATION
            ================================================== */}

            <form
              onSubmit={handleSave}
              className="bg-white p-6 sm:p-9"
            >

              {/* Section heading */}

              <div className="mb-7 flex items-center gap-3">

                <div className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
                  <User className="size-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Account Information
                  </h3>

                  <p className="text-sm text-slate-500">
                    Update your personal information
                  </p>
                </div>

              </div>

              {/* =================================================
                  FORM FIELDS
              ================================================== */}

              <div className="grid gap-5 sm:grid-cols-2">

                {/* Full name */}

                <div className="space-y-2">

                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Full name
                  </Label>

                  <div className="relative">

                    <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSaved(false);
                        setError("");
                      }}
                      className="h-11 border-slate-300 bg-slate-50 pl-10 text-slate-900 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />

                  </div>

                </div>

                {/* Email */}

                <div className="space-y-2">

                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Email
                  </Label>

                  <div className="relative">

                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setSaved(false);
                        setError("");
                      }}
                      className="h-11 border-slate-300 bg-slate-50 pl-10 text-slate-900 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-blue-500"
                      placeholder="Enter your email"
                    />

                  </div>

                </div>

              </div>

              {/* =================================================
                  ERROR MESSAGE
              ================================================== */}

              {error ? (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              ) : null}

              {/* =================================================
                  SUCCESS MESSAGE
              ================================================== */}

              {saved ? (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  Profile changes saved successfully.
                </div>
              ) : null}

              {/* Divider */}

              <div className="my-7 border-t border-slate-200" />

              {/* =================================================
                  SAVE BUTTON
              ================================================== */}

              <div className="flex justify-end">

                <Button
                  type="submit"
                  className="h-11 gap-2 bg-blue-600 px-6 font-semibold shadow-md shadow-blue-600/20 hover:bg-blue-700"
                >
                  <Save className="size-4" />
                  Save Changes
                </Button>

              </div>

            </form>
          </section>

          {/* =================================================
              ACCOUNT INFORMATION NOTE
          ================================================== */}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-white/90 px-5 py-4 shadow-sm">

            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600">
              <ShieldCheck className="size-4" />
            </div>

            <div>

              <p className="text-sm font-semibold text-slate-900">
                Account information
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your account details are used to identify you when
                submitting and tracking support tickets.
              </p>

            </div>

          </div>

        </div>
      </div>
    </AppShell>
  );
}