import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "info" | "neutral" | "violet" | "danger";

// Colores "funcionales" del sistema Zarza (SistemaVisual · se mantienen):
// success = Preparación, warning = En ensayo, info = Definitiva,
// violet = acento suave (bermellón), danger = Error.
const TONE: Record<BadgeTone, string> = {
  success: "border-[#e0cbb0] bg-[#f3e7d6] text-[#6e4c40] dark:border-[#5e472a] dark:bg-[#211815] dark:text-[#d6c2a8]",
  warning: "border-[#f8c98a] bg-[#ffeccc] text-[#9a3c0a] dark:border-[#3c2e1b] dark:bg-[#251d11] dark:text-[#f8894f]",
  info:    "border-[#f5b9a0] bg-[#fde4d8] text-[#94402a] dark:border-[#5c382a] dark:bg-[#1e1513] dark:text-[#d9846d]",
  neutral: "border-mark bg-input text-mid",
  violet:  "border-fuego-600/20 bg-fuego-600/[0.12] text-[#94402a] dark:border-[rgba(226,104,60,0.32)] dark:bg-[rgba(226,104,60,0.16)] dark:text-[#df8067]",
  danger:  "border-[#f5b5a0] bg-[#fde7e7] text-[#b91c1c] dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
};

export interface BadgeProps {
  tone?:      BadgeTone;
  children:   ReactNode;
  className?: string;
}

/**
 * Pill de estado con color semántico. Reemplaza las implementaciones
 * independientes de "badge de color" que existían en playlists/page.tsx,
 * playlists/[id]/page.tsx (ESTADO_BADGE) y admin/usuarios (ROL_STYLE).
 */
export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        TONE[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
