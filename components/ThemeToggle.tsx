"use client";

import { useTransition } from "react";
import { Sun, Moon } from "lucide-react";
import { setTema } from "@/app/actions/tema";

export function ThemeToggle({ tema, sidebar }: { tema: "claro" | "oscuro"; sidebar?: boolean }) {
  const [pending, start] = useTransition();
  const isDark = tema === "oscuro";

  function toggle() {
    const next = isDark ? "claro" : "oscuro";
    document.documentElement.classList.toggle("dark", next === "oscuro");
    start(() => setTema(next));
  }

  if (sidebar) {
    return (
      <button
        onClick={toggle}
        disabled={pending}
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-lo transition-colors hover:bg-input hover:text-mid disabled:opacity-40"
      >
        {isDark
          ? <Sun  size={17} strokeWidth={1.8} className="shrink-0" />
          : <Moon size={17} strokeWidth={1.8} className="shrink-0" />
        }
        <span>{isDark ? "Modo oscuro" : "Modo claro"}</span>
      </button>
    );
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
