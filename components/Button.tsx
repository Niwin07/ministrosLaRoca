"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";
type Shape = "pill" | "block";

// Variantes de color alineadas al lenguaje visual de la app (violet de acento,
// tokens semánticos hi/mid/lo y bordes line/mark). El primario es deliberadamente
// llamativo: degradado + glow de color + borde interior de luz + elevación al
// hover, para que sea un CTA que "pide" ser tocado. Cada una define reposo ·
// hover · active para que el estado nunca quede ambiguo.
const VARIANT: Record<Variant, string> = {
  // "Llama": gradiente bermellón → vino del sistema Zarza (botón principal).
  primary:
    "bg-llama text-white ring-1 ring-inset ring-white/10 shadow-llama " +
    "hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_14px_24px_-8px_rgba(180,71,42,0.55)] " +
    "active:translate-y-0 active:brightness-95",
  secondary:
    "border border-mark bg-card text-[#4a2c22] shadow-sm hover:border-fuego-300 hover:text-hi dark:text-hi",
  ghost:
    "text-mid hover:bg-input hover:text-hi",
  danger:
    "bg-gradient-to-b from-red-500 to-red-600 text-white ring-1 ring-inset ring-white/15 " +
    "shadow-lg shadow-red-600/30 hover:from-red-400 hover:to-red-500 " +
    "hover:shadow-xl hover:shadow-red-600/45 hover:-translate-y-0.5 " +
    "active:translate-y-0 active:shadow-md active:from-red-600 active:to-red-700",
  success:
    "bg-gradient-to-b from-green-500 to-green-600 text-white ring-1 ring-inset ring-white/15 " +
    "shadow-lg shadow-green-600/30 hover:from-green-400 hover:to-green-500 " +
    "hover:shadow-xl hover:shadow-green-600/45 hover:-translate-y-0.5 " +
    "active:translate-y-0 active:shadow-md active:from-green-600 active:to-green-700",
};

// Todos los tamaños cumplen el mínimo táctil cómodo (≥44px en md/lg; sm queda
// en 38px para acciones densas inline pero con buen padding).
const SIZE: Record<Size, string> = {
  sm: "min-h-[38px] gap-1.5 px-3.5 py-2 text-xs",
  md: "min-h-[44px] gap-2 px-5 py-2.5 text-sm",
  lg: "min-h-[48px] gap-2 px-6 py-3 text-sm",
};

const ICON_SIZE: Record<Size, number> = { sm: 14, md: 15, lg: 16 };

export interface ButtonProps extends ComponentProps<"button"> {
  variant?:   Variant;
  size?:      Size;
  shape?:     Shape;
  /** Fuerza el estado de carga (spinner + deshabilitado) manualmente. */
  loading?:   boolean;
  fullWidth?: boolean;
  /** Ícono a la izquierda; se reemplaza por el spinner mientras carga. */
  icon?:      ReactNode;
  /** Si es submit, se sincroniza solo con el pending del form (default). */
  syncForm?:  boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  shape = "pill",
  loading = false,
  fullWidth = false,
  icon,
  syncForm = true,
  className = "",
  children,
  disabled,
  type,
  ...rest
}: ButtonProps) {
  // useFormStatus refleja el `pending` del <form> padre. Lo aplicamos solo a
  // botones submit que opten por sincronizarse (default) → un Server Action
  // muestra spinner sin estado manual. Fuera de un form, pending es siempre
  // false, así que es inofensivo usarlo en cualquier botón.
  const { pending } = useFormStatus();
  const busy = loading || (syncForm && type === "submit" && pending);

  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={[
        "relative inline-flex select-none items-center justify-center font-semibold",
        "transition-all duration-200 active:scale-[0.97]",
        "motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        "disabled:pointer-events-none disabled:opacity-50",
        shape === "pill" ? "rounded-full" : "rounded-xl",
        fullWidth ? "w-full" : "",
        SIZE[size],
        VARIANT[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {busy ? (
        <Loader2 size={ICON_SIZE[size]} className="animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
