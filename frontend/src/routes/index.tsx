import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Gauge,
  Loader2,
  Route as RouteIcon,
  ShieldCheck,
  Tags,
  UserRound,
  BrainCircuit,
  UsersRound,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, type Department } from "@/lib/ticket-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "IntelliRoute AI â€” Smart Support Ticket Assignment",
      },
      {
        name: "description",
        content:
          "Submit your issue and let AI automatically classify, prioritize and route your ticket to the right support team.",
      },
      {
        property: "og:title",
        content:
          "IntelliRoute AI â€” Smart Support Ticket Assignment",
      },
      {
        property: "og:description",
        content:
          "AI classifies, prioritizes and routes every support ticket to the right team.",
      },
    ],
  }),

  component: Landing,
});

/*
 * Local development:
 * https://intelliroute-ai-production.up.railway.app
 *
 * Production:
 * Set VITE_API_URL in your frontend deployment environment.
 */
const API_URL =
  import.meta.env["VITE_API_URL"] || "https://intelliroute-ai-production.up.railway.app";

const DEPARTMENTS: Department[] = [
  "IT Support",
  "Billing",
  "Technical",
  "Accounts",
  "Human Resources",
  "Billing and Payments",
  "Product Support",
];

function Landing() {
  const { login } = useStore();
  const navigate = useNavigate();

  const [tab, setTab] =
    useState<"customer" | "employee">("customer");

  const [mode, setMode] =
    useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [department, setDepartment] =
    useState<Department>("IT Support");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  // ============================================================
  // RESET AUTH FORM
  // ============================================================

  const resetForm = () => {
    setName("");
    setDepartment("IT Support");
    setEmail("");
    setPassword("");
    setError(null);
  };

  // ============================================================
  // SWITCH CUSTOMER / EMPLOYEE
  // ============================================================

  const switchTab = (
    newTab: "customer" | "employee",
  ) => {
    setTab(newTab);
    setMode("login");
    resetForm();
  };

  // ============================================================
  // CUSTOMER LOGIN
  // ============================================================

  const loginCustomer = async () => {
    const response = await fetch(
      `${API_URL}/api/customer/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Invalid email or password.",
      );
    }

    login({
      role: "customer",
      name: data.name,
      email: data.email,
    });

    navigate({
      to: "/customer",
    });
  };

  // ============================================================
  // EMPLOYEE LOGIN
  // ============================================================

  const loginEmployee = async () => {
    const response = await fetch(
      `${API_URL}/api/employee/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Invalid employee email or password.",
      );
    }

    login({
      role: "employee",
      name: data.name,
      email: data.email,
      department:
        data.department as Department,
    });

    navigate({
      to: "/employee",
    });
  };

  // ============================================================
  // SIGN IN
  // ============================================================

  const signIn = async (
    e?: FormEvent,
  ) => {
    e?.preventDefault();

    if (
      !email.trim().includes("@") ||
      password.length < 4
    ) {
      setError(
        "Enter a valid email and a password of at least 4 characters.",
      );
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (tab === "customer") {
        await loginCustomer();
      } else {
        await loginEmployee();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to login. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CUSTOMER REGISTRATION
  // ============================================================

  const registerCustomer = async (
    e?: FormEvent,
  ) => {
    e?.preventDefault();

    if (!name.trim()) {
      setError(
        "Please enter your full name.",
      );
      return;
    }

    if (!email.trim().includes("@")) {
      setError(
        "Please enter a valid email.",
      );
      return;
    }

    if (password.length < 4) {
      setError(
        "Password must contain at least 4 characters.",
      );
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/customer/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email
              .trim()
              .toLowerCase(),
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create customer account.",
        );
      }

      login({
        role: "customer",
        name: data.name,
        email: data.email,
      });

      navigate({
        to: "/customer",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create customer account.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // EMPLOYEE REGISTRATION
  // ============================================================

  const registerEmployee = async (
    e?: FormEvent,
  ) => {
    e?.preventDefault();

    if (!name.trim()) {
      setError(
        "Please enter your full name.",
      );
      return;
    }

    if (!email.trim().includes("@")) {
      setError(
        "Please enter a valid work email.",
      );
      return;
    }

    if (password.length < 4) {
      setError(
        "Password must contain at least 4 characters.",
      );
      return;
    }

    if (!department) {
      setError(
        "Please select your department.",
      );
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/employee/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email
              .trim()
              .toLowerCase(),
            password,
            department,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create employee account.",
        );
      }

      login({
        role: "employee",
        name: data.name,
        email: data.email,
        department:
          data.department as Department,
      });

      navigate({
        to: "/employee",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create employee account.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OPEN CUSTOMER LOGIN
  // ============================================================

  const openCustomerLogin = () => {
    setTab("customer");
    setMode("login");
    resetForm();

    setTimeout(() => {
      document
        .getElementById("login")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  };

  // ============================================================
  // OPEN EMPLOYEE LOGIN
  // ============================================================

  const openEmployeeLogin = () => {
    setTab("employee");
    setMode("login");
    resetForm();

    setTimeout(() => {
      document
        .getElementById("login")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  };

  // ============================================================
  // FORM SUBMIT
  // ============================================================

  const handleSubmit = (
    e: FormEvent,
  ) => {
    if (mode === "register") {
      if (tab === "customer") {
        return registerCustomer(e);
      }

      return registerEmployee(e);
    }

    return signIn(e);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-30 border-b border-blue-200/60 bg-blue-100/90 shadow-sm backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">

          {/* BRAND */}

          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="flex items-center gap-3"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Bot className="size-5" />
            </span>

            <div className="text-left leading-tight">
              <p className="text-sm font-bold tracking-tight text-slate-900">
                IntelliRoute AI
              </p>

              <p className="text-[11px] text-slate-500">
                Intelligent support workspace
              </p>
            </div>
          </button>

          {/* NAVIGATION */}

          <nav className="flex items-center gap-1 sm:gap-2">

            <a
              href="#features"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900 sm:block"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-slate-900 sm:block"
            >
              How it works
            </a>

            <Button
              size="sm"
              className="ml-1 rounded-xl px-5 shadow-md shadow-primary/20 sm:ml-2"
              onClick={openCustomerLogin}
            >
              Sign in
            </Button>

          </nav>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main>

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="relative isolate overflow-hidden border-b border-blue-200/60 bg-gradient-to-br from-[#bfdbfe] via-[#dbeafe] to-[#eff6ff]">

          {/* BACKGROUND CIRCLE 1 */}

          <div className="pointer-events-none absolute -left-64 top-16 -z-10 size-[650px] rounded-full border-[120px] border-blue-500/15" />

          {/* BACKGROUND CIRCLE 2 */}

          <div className="pointer-events-none absolute -right-64 -top-64 -z-10 size-[750px] rounded-full border-[130px] border-blue-500/15" />

          {/* BACKGROUND CIRCLE 3 */}

          <div className="pointer-events-none absolute right-[-200px] bottom-[-380px] -z-10 size-[750px] rounded-full border-[130px] border-blue-400/15" />

          {/* LIGHTING */}

          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_35%,rgba(37,99,235,0.24),transparent_38%),radial-gradient(circle_at_80%_45%,rgba(59,130,246,0.18),transparent_42%)]" />

          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16">

            {/* =================================================
                HERO LEFT
            ================================================= */}

            <div className="max-w-3xl">

              {/* BADGE */}

              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/60 bg-white/60 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-md">

                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-2 animate-ping rounded-full bg-blue-600 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-blue-600" />
                </span>

                AI-powered support automation

              </div>

              {/* HEADING */}

              <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[4.25rem]">

                Route every support ticket to the{" "}

                <span className="text-blue-600">
                  right person.
                </span>

              </h1>

              {/* DESCRIPTION */}

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">

                AI automatically understands the issue,
                predicts its priority, selects the right
                department, and assigns the ticket to the
                best available support agent.

              </p>

              {/* CTA */}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-blue-600 px-7 text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                  onClick={openCustomerLogin}
                >
                  Submit a Ticket
                  <RouteIcon className="ml-2 size-4" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-blue-200 bg-white/75 px-7 text-slate-800 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white"
                  onClick={openEmployeeLogin}
                >
                  Employee Workspace
                  <BriefcaseBusiness className="ml-2 size-4" />
                </Button>

              </div>

              {/* STATS */}

              <div className="mt-10 max-w-xl rounded-2xl border border-blue-200/60 bg-white/40 p-5 backdrop-blur-sm">

                <div className="grid grid-cols-3">

                  <div className="border-r border-blue-300/50 pr-4">
                    <p className="text-2xl font-extrabold tracking-tight text-slate-950">
                      &lt; 5s
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Routing time
                    </p>
                  </div>

                  <div className="border-r border-blue-300/50 px-4">
                    <p className="text-2xl font-extrabold tracking-tight text-slate-950">
                      AI
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Smart routing
                    </p>
                  </div>

                  <div className="pl-4">
                    <p className="text-2xl font-extrabold tracking-tight text-slate-950">
                      24/7
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Automated triage
                    </p>
                  </div>

                </div>
              </div>

            </div>

            {/* =================================================
                AUTH CARD
            ================================================= */}

            <div
              id="login"
              className="relative w-full max-w-xl justify-self-center"
            >

              {/* CARD GLOW */}

              <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-blue-500/20 blur-3xl" />

              <div className="rounded-3xl border border-blue-200/80 bg-[#eef6ff]/95 p-6 shadow-[0_25px_80px_-25px_rgba(37,99,235,0.45)] backdrop-blur-xl sm:p-8">

                {/* CARD HEADER */}

                <div className="mb-6 flex items-start justify-between gap-4">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                      Secure access
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                      {tab === "employee"
                        ? mode === "login"
                          ? "Employee sign in"
                          : "Create employee account"
                        : mode === "login"
                          ? "Customer sign in"
                          : "Create customer account"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {tab === "employee"
                        ? mode === "login"
                          ? "Access your assigned support tickets and workspace."
                          : "Create your employee support workspace."
                        : mode === "login"
                          ? "Submit and track your support requests."
                          : "Create an account to submit support tickets."}
                    </p>

                  </div>

                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-blue-200 bg-blue-100/70 text-blue-600 shadow-sm">

                    {tab === "employee" ? (
                      <BriefcaseBusiness className="size-6" />
                    ) : (
                      <UserRound className="size-6" />
                    )}

                  </div>

                </div>

                {/* CUSTOMER / EMPLOYEE */}

                <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-blue-100/80 bg-blue-100/60 p-1.5">

                  <button
                    type="button"
                    onClick={() =>
                      switchTab("customer")
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
                      tab === "customer"
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-blue-100"
                        : "text-slate-500 hover:bg-white/60 hover:text-slate-900",
                    )}
                  >
                    <UserRound className="size-4" />
                    Customer
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      switchTab("employee")
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
                      tab === "employee"
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-blue-100"
                        : "text-slate-500 hover:bg-white/60 hover:text-slate-900",
                    )}
                  >
                    <BriefcaseBusiness className="size-4" />
                    Employee
                  </button>

                </div>

                {/* LOGIN / REGISTER */}

                <div className="mt-5 grid grid-cols-2 border-b border-blue-100">

                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className={cn(
                      "border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
                      mode === "login"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-900",
                    )}
                  >
                    Sign in
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    className={cn(
                      "border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
                      mode === "register"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-900",
                    )}
                  >
                    Create account
                  </button>

                </div>

                {/* FORM */}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="mt-6 space-y-4"
                >

                  {/* NAME */}

                  {mode === "register" && (
                    <div className="space-y-2">

                      <Label htmlFor="name">
                        Full name
                      </Label>

                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) =>
                          setName(e.target.value)
                        }
                        placeholder="Enter your full name"
                        className="h-12 rounded-xl border-blue-100 bg-blue-50/50 px-4 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                      />

                    </div>
                  )}

                  {/* DEPARTMENT */}

                  {tab === "employee" &&
                    mode === "register" && (
                      <div className="space-y-2">

                        <Label htmlFor="department">
                          Department
                        </Label>

                        <select
                          id="department"
                          value={department}
                          onChange={(e) =>
                            setDepartment(
                              e.target
                                .value as Department,
                            )
                          }
                          className="flex h-12 w-full rounded-xl border border-blue-100 bg-blue-50/50 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                        >
                          {DEPARTMENTS.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                              >
                                {item}
                              </option>
                            ),
                          )}
                        </select>

                      </div>
                    )}

                  {/* EMAIL */}

                  <div className="space-y-2">

                    <Label htmlFor="email">
                      {tab === "customer"
                        ? "Email address"
                        : "Work email"}
                    </Label>

                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@company.com"
                      className="h-12 rounded-xl border-blue-100 bg-blue-50/50 px-4 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                    />

                  </div>

                  {/* PASSWORD */}

                  <div className="space-y-2">

                    <Label htmlFor="password">
                      Password
                    </Label>

                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value,
                        )
                      }
                      placeholder="Enter your password"
                      className="h-12 rounded-xl border-blue-100 bg-blue-50/50 px-4 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                    />

                  </div>

                  {/* ERROR */}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* SUBMIT */}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                    disabled={loading}
                  >

                    {loading && (
                      <Loader2 className="size-4 animate-spin" />
                    )}

                    {mode === "register"
                      ? tab === "customer"
                        ? "Create customer account"
                        : "Create employee account"
                      : "Sign in"}

                  </Button>

                </form>

                {/* SECURITY */}

                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-slate-500">

                  <ShieldCheck className="size-4 text-blue-600" />

                  <span>
                    Your account information is handled securely.
                  </span>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ======================================================
            FEATURES
        ====================================================== */}

        <section
          id="features"
          className="relative isolate overflow-hidden border-b border-blue-200/60 bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#dbeafe]"
        >
          {/* Decorative background shapes */}

          <div className="pointer-events-none absolute -left-56 top-10 -z-10 size-[620px] rounded-full border-[100px] border-blue-500/10" />

          <div className="pointer-events-none absolute -right-56 -top-48 -z-10 size-[680px] rounded-full border-[110px] border-blue-500/10" />

          <div className="pointer-events-none absolute -right-40 bottom-[-300px] -z-10 size-[620px] rounded-full border-[100px] border-blue-400/10" />

          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(59,130,246,0.10),transparent_38%)]" />

          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">

            {/* SECTION HEADER */}

            <div className="mx-auto max-w-3xl text-center">

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Intelligent automation
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Smart routing from start to finish.
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
                The system analyzes every support request and uses
                ticket information and employee workload to make
                intelligent routing decisions.
              </p>

            </div>

            {/* FEATURE CARDS */}

            <div className="mt-12 grid gap-5 md:grid-cols-3">

              {[
                {
                  icon: BrainCircuit,
                  title: "AI Classification",
                  text:
                    "Understand the customer's issue and determine the appropriate ticket category.",
                },
                {
                  icon: Gauge,
                  title: "Priority Prediction",
                  text:
                    "Identify the urgency of a ticket so important issues can receive faster attention.",
                },
                {
                  icon: RouteIcon,
                  title: "Department Routing",
                  text:
                    "Route each request toward the support department that best matches the issue.",
                },
                {
                  icon: UsersRound,
                  title: "Workload Balancing",
                  text:
                    "Consider active ticket workload when selecting an available employee.",
                },
                {
                  icon: Zap,
                  title: "Fast Assignment",
                  text:
                    "Automatically assign tickets without requiring a manager to manually distribute them.",
                },
                {
                  icon: CheckCircle2,
                  title: "Resolution Tracking",
                  text:
                    "Customers and employees can follow ticket progress until the issue is resolved.",
                },
              ].map((feature) => (

                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-blue-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-blue-900/10"
                >

                  {/* Card glow */}

                  <div className="pointer-events-none absolute -right-16 -top-16 size-32 rounded-full bg-blue-500/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Icon */}

                  <div className="relative grid size-12 place-items-center rounded-xl border border-blue-200 bg-blue-100 text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/20">

                    <feature.icon className="size-5" />

                  </div>

                  {/* Content */}

                  <h3 className="relative mt-5 text-base font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="relative mt-2 text-sm leading-6 text-slate-600">
                    {feature.text}
                  </p>

                  {/* Bottom accent */}

                  <div className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-blue-500/0 transition-all duration-300 group-hover:bg-blue-500/50" />

                </div>

              ))}

            </div>

          </div>
        </section>

        {/* ======================================================
            HOW IT WORKS
        ====================================================== */}

        <section
          id="how-it-works"
          className="relative isolate overflow-hidden border-t border-blue-200/60 bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#dbeafe]"
        >
          {/* Decorative background shapes */}

          <div className="pointer-events-none absolute -left-64 -bottom-64 -z-10 size-[650px] rounded-full border-[110px] border-blue-500/10" />

          <div className="pointer-events-none absolute -right-56 top-[-260px] -z-10 size-[620px] rounded-full border-[100px] border-blue-500/10" />

          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_45%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_80%_50%,rgba(59,130,246,0.10),transparent_38%)]" />

          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">

            <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">

              {/* =================================================
                  LEFT CONTENT
              ================================================= */}

              <div className="max-w-xl">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  How it works
                </p>

                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  From ticket submission to resolution.
                </h2>

                <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
                  Customers submit their issue once. The intelligent
                  routing workflow analyzes the request, determines
                  its priority and department, and assigns it to the
                  best available support employee.
                </p>

                {/* Workflow summary */}

                <div className="mt-8 rounded-2xl border border-blue-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-md">

                  <div className="flex items-center gap-3">

                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                      <BrainCircuit className="size-5" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Intelligent ticket routing
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Automated decisions from submission to resolution.
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">

                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-center">
                      <p className="text-lg font-extrabold text-blue-600">
                        AI
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Classification
                      </p>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-center">
                      <p className="text-lg font-extrabold text-blue-600">
                        Smart
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Assignment
                      </p>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-center">
                      <p className="text-lg font-extrabold text-blue-600">
                        Live
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Tracking
                      </p>
                    </div>

                  </div>

                </div>

                <Button
                  className="mt-7 rounded-xl bg-blue-600 px-6 text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                  onClick={openCustomerLogin}
                >
                  Submit your first ticket
                  <RouteIcon className="ml-2 size-4" />
                </Button>

              </div>

              {/* =================================================
                  RIGHT WORKFLOW
              ================================================= */}

              <div className="relative">

                {/* Vertical connector */}

                <div className="pointer-events-none absolute left-6 top-7 bottom-7 hidden w-px bg-gradient-to-b from-blue-300 via-blue-500 to-blue-200 sm:block" />

                <ol className="space-y-4">

                  {[
                    {
                      icon: Tags,
                      title: "Customer submits a ticket",
                      text:
                        "The customer describes the issue and submits the support request.",
                    },
                    {
                      icon: BrainCircuit,
                      title: "AI analyzes the ticket",
                      text:
                        "The system determines the ticket classification and predicts its priority.",
                    },
                    {
                      icon: RouteIcon,
                      title: "Department is selected",
                      text:
                        "The ticket is routed to the support department that best matches the issue.",
                    },
                    {
                      icon: UsersRound,
                      title: "Best available employee is assigned",
                      text:
                        "Active employees and their current ticket workload are considered during assignment.",
                    },
                    {
                      icon: CheckCircle2,
                      title: "Ticket is resolved",
                      text:
                        "The employee works on the issue while the customer tracks its status until resolution.",
                    },
                  ].map((step, index) => (

                    <li
                      key={step.title}
                      className="group relative flex items-start gap-4 rounded-2xl border border-blue-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-blue-900/10"
                    >

                      {/* Number */}

                      <div className="relative z-10 grid size-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-700">

                        <step.icon className="size-5" />

                      </div>

                      {/* Content */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                            Step {index + 1}
                          </span>

                        </div>

                        <h3 className="mt-1 text-sm font-bold text-slate-900 sm:text-base">
                          {step.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {step.text}
                        </p>

                      </div>

                    </li>

                  ))}

                </ol>

              </div>

            </div>

          </div>
        </section>

        {/* ======================================================
            FINAL CTA
        ====================================================== */}

        <section className="relative isolate overflow-hidden border-t border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">

          {/* Decorative background shapes */}

          <div className="pointer-events-none absolute -left-48 -top-48 -z-10 size-[600px] rounded-full border-[100px] border-white/10" />

          <div className="pointer-events-none absolute -right-56 -bottom-64 -z-10 size-[650px] rounded-full border-[110px] border-white/10" />

          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_35%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.10),transparent_40%)]" />

          <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-24">

            {/* Icon */}

            <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-md">
              <Bot className="size-8" />
            </div>

            {/* Label */}

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              Intelligent support automation
            </p>

            {/* Heading */}

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Make support routing smarter.
            </h2>

            {/* Description */}

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              Submit a ticket and let the intelligent routing system
              handle classification, prioritization, department
              selection and employee assignment.
            </p>

            {/* CTA */}

            <Button
              size="lg"
              variant="secondary"
              className="mt-8 h-12 rounded-xl bg-white px-8 font-semibold text-blue-700 shadow-xl shadow-blue-950/20 transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-2xl"
              onClick={openCustomerLogin}
            >
              Get started
              <RouteIcon className="ml-2 size-4" />
            </Button>

            {/* Small supporting text */}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-blue-100">
              <CheckCircle2 className="size-4" />
              <span>
                AI-powered classification, routing and workload balancing
              </span>
            </div>

          </div>
        </section>

      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-blue-200/70 bg-gradient-to-r from-[#dbeafe] via-[#eff6ff] to-[#dbeafe]">

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            {/* BRAND */}

            <div className="flex items-center gap-3">

              <span className="grid size-9 place-items-center rounded-xl border border-blue-200 bg-white text-blue-600 shadow-sm">
                <Bot className="size-5" />
              </span>

              <div className="leading-tight">

                <p className="text-sm font-bold text-slate-800">
                  IntelliRoute AI
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Intelligent support workspace
                </p>

              </div>

            </div>

            {/* FOOTER LINKS */}

            <div className="flex items-center gap-5 text-xs font-medium text-slate-500">

              <a
                href="#features"
                className="transition-colors hover:text-blue-600"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="transition-colors hover:text-blue-600"
              >
                How it works
              </a>

              <button
                type="button"
                onClick={openCustomerLogin}
                className="transition-colors hover:text-blue-600"
              >
                Get started
              </button>

            </div>

          </div>

          {/* DIVIDER */}

          <div className="my-6 h-px bg-blue-200/70" />

          {/* COPYRIGHT */}

          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

            <p>
              Â© {new Date().getFullYear()} IntelliRoute AI.
            </p>

            <p>
              Intelligent support automation.
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}