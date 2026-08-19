import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore, type Role } from "./ticket-store";

/** Client-side guard for the demo workspace. Returns true once the role matches. */
export function useRequireRole(role: Role) {
  const { session } = useStore();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setChecked(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (checked && session?.role !== role) {
      navigate({ to: "/" });
    }
  }, [checked, session, role, navigate]);

  return session?.role === role;
}