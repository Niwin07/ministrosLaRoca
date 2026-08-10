"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type Size = "sm" | "md";
type Variant = "ghost" | "solid";

const SIZE: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

const VARIANT: Record<Variant, string> = {
  ghost: "text-lo hover:bg-input hover:text-hi",
  solid: "bg-input text-mid hover:bg-mark hover:text-hi",
};

export interface IconButtonProps extends ComponentProps<"button"> {
  icon:     ReactNode;
  /** Nombre accesible — obligatorio: este botón nunca tiene texto visible. */
  label:    string;
  size?:    Size;
  variant?: Variant;
  loading?: boolean;
}

/**
 * Botón circular ícono-only con focus-visible/hover/disabled consistentes.
 * Pensado para los patrones de "botón de paginación"/"trigger" que estaban
 * reimplementados a mano (con foco inconsistente) en varios componentes.
 */
export function IconButton({
  icon,
  label,
  size = "md",
  variant = "ghost",
  loading = false,
  className = "",
  disabled,
  type = "button",
  ...rest
}: IconButtonProps) {
  const { pending } = useFormStatus();
  const busy = loading || (type === "submit" && pending);

  return (
    <button
      type={type}
      aria-label={label}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        "disabled:pointer-events-none disabled:opacity-40",
        SIZE[size],
        VARIANT[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : icon}
    </button>
  );
}
