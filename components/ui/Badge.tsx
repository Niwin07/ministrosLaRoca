import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "info" | "neutral" | "violet" | "danger";

const TONE: Record<BadgeTone, string> = {
  success: "border-green-300 bg-green-200 text-green-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400",
  warning: "border-amber-200 bg-amber-100 text-amber-800 dark:border-yellow-400/20 dark:bg-yellow-400/10 dark:text-yellow-400",
  info:    "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-400",
  neutral: "border-mark bg-input text-mid",
  violet:  "border-violet-500/20 bg-violet-500/15 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400",
  danger:  "border-red-300 bg-red-100 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
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
