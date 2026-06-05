"use client";

import { useTransition } from "react";
import { Sun, Moon } from "lucide-react";
import { setTema } from "@/app/actions/tema";

export function ThemeToggle({ tema }: { tema: "claro" | "oscuro" }) {
  const [pending, start] = useTransition();
  const isDark = tema === "oscuro";

  function toggle() {
    const next = isDark ? "claro" : "oscuro";
    // Apply the class change immediately on the client for a flash-free transition.
    document.documentElement.classList.toggle("dark", next === "oscuro");
    // Persist the preference via server action so it survives navigation and reload.
    start(() => setTema(next));
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex h-11 w-11 items-center justify-center rounded-full text-gone transition-colors hover:text-hi disabled:opacity-40"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
