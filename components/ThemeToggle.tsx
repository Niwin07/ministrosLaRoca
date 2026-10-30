"use client";

import { useTransition } from "react";
import { Sun } from "lucide-react";
import { setTema } from "@/app/actions/tema";
import { IconoMarca } from "@/components/zarza/IconoMarca";

/**
 * Alterna modo claro / noche. El estado se persiste en la cookie `tema`
 * (Server Action existente) y se aplica al instante con la clase `dark`.
 * Diseño Zarza: luna ilustrada en claro, sol de trazo en noche.
 */
export function ThemeToggle({ tema }: { tema: "claro" | "oscuro"; sidebar?: boolean }) {
  const [pending, start] = useTransition();
  const isDark = tema === "oscuro";

  function toggle() {
    const next = isDark ? "claro" : "oscuro";
    document.documentElement.classList.toggle("dark", next === "oscuro");
    start(() => setTema(next));
  }

  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full text-[#4a2c22] transition-colors hover:bg-fuego-600/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40 dark:text-[#decfba]"
    >
      {isDark ? <Sun size={20} strokeWidth={2} aria-hidden /> : <IconoMarca nombre="luna" size={22} />}
    </button>
  );
}
