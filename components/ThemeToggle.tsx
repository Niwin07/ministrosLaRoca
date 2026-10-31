"use client";

import { useTransition, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Sun } from "lucide-react";
import { setTema } from "@/app/actions/tema";
import { IconoMarca } from "@/components/zarza/IconoMarca";

type ConTransicion = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

/**
 * Alterna modo claro / noche. El estado se persiste en la cookie `tema`
 * (Server Action existente) y se aplica al instante con la clase `dark`.
 * El cambio se revela en un círculo que crece desde el botón (View
 * Transitions); donde no hay soporte o se pidió reducir movimiento, cambia
 * directo. Diseño Zarza: luna ilustrada en claro, sol de trazo en noche.
 */
export function ThemeToggle({ tema }: { tema: "claro" | "oscuro"; sidebar?: boolean }) {
  const [pending, start] = useTransition();
  const isDark = tema === "oscuro";

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    const next = isDark ? "claro" : "oscuro";
    const html = document.documentElement;
    const aplicar = () => { html.classList.toggle("dark", next === "oscuro"); };
    const doc = document as ConTransicion;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!doc.startViewTransition || reducir) {
      aplicar();
    } else {
      const r = e.currentTarget.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const vt = doc.startViewTransition(() => flushSync(aplicar));
      vt.ready
        .then(() => {
          html.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
            { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
          );
        })
        .catch(() => {});
    }
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
      className="group flex h-11 w-11 items-center justify-center rounded-full text-[#4a2c22] transition-colors hover:bg-fuego-600/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40 dark:text-[#decfba]"
    >
      <span key={isDark ? "sol" : "luna"} className="flex animate-girar-entra transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[20deg]">
        {isDark ? <Sun size={20} strokeWidth={2} aria-hidden /> : <IconoMarca nombre="luna" size={22} />}
      </span>
    </button>
  );
}
