import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, Info } from "lucide-react";
import { IconoMarca, type IconoMarcaNombre } from "@/components/zarza/IconoMarca";

// ════════════════════════════════════════════════════════════════
//  Kit visual "Zarza" — piezas compartidas por todas las pantallas.
//  Las clases usan los tokens (bg-card, border-line, text-mid…) para
//  que el modo noche funcione sin duplicar estilos.
// ════════════════════════════════════════════════════════════════

export const cls = {
  pagina:      "flex flex-col gap-5 px-4 pb-8 pt-6 md:px-0 md:pt-2",
  btnLlama:
    "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-llama px-4 text-sm font-semibold text-white shadow-llama transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
  btnSec:
    "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-mark bg-card px-4 text-sm font-semibold text-[#4a2c22] transition-colors hover:border-fuego-300 active:scale-[0.98] disabled:opacity-50 dark:text-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40",
  btnIcono:
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mid transition-colors hover:bg-fuego-600/10 hover:text-hi disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40",
  btnTexto:
    "min-h-[36px] px-2 text-[13px] font-medium text-mid underline underline-offset-[3px] hover:text-hi",
  campo:
    "min-h-[46px] w-full rounded-full border border-mark bg-input px-4 py-3 text-sm text-hi placeholder:text-gone outline-none transition-colors focus:border-fuego-500 focus:ring-2 focus:ring-fuego-500/30",
  campoArea:
    "w-full resize-none rounded-2xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder:text-gone outline-none transition-colors focus:border-fuego-500 focus:ring-2 focus:ring-fuego-500/30",
  etiqueta:    "flex flex-col gap-1.5 text-[13px] font-medium text-mid",
  tarjeta:     "rounded-[22px] border border-line bg-card shadow-card dark:shadow-none",
  tarjetaSuave:"rounded-[18px] border border-line bg-[#fcf5eb] dark:bg-card",
  eyebrow:     "text-[11px] font-semibold uppercase tracking-[0.12em] text-fuego-600 dark:text-[#df8067]",
  seccion:     "text-xs font-semibold uppercase tracking-[0.1em] text-hi",
  chipTono:
    "inline-flex shrink-0 items-center rounded-full border border-fuego-600/30 bg-fuego-600/10 px-2 py-0.5 text-[11px] font-bold text-fuego-600 dark:text-[#df8067]",
  panelForm:
    "flex max-w-[560px] flex-col gap-3 rounded-[18px] border border-line bg-card p-[18px] shadow-[0_12px_32px_-12px_rgba(120,45,15,0.3)] dark:shadow-none",
};

/** Encabezado de pantalla: volver · ícono · título · subtítulo · acciones. */
export function Encabezado({
  volver,
  icono,
  titulo,
  sub,
  acciones,
}: {
  volver?: { href: string; label: string };
  icono?: IconoMarcaNombre;
  titulo: ReactNode;
  sub?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[18px]">
      {volver && (
        <Link
          href={volver.href}
          className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-hi transition-opacity hover:opacity-75"
        >
          <ChevronLeft size={16} strokeWidth={2.2} aria-hidden />
          {volver.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icono && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <IconoMarca nombre={icono} size={44} />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-[26px] font-bold leading-[1.1] tracking-[-0.02em] text-hi">{titulo}</h1>
            {sub && <p className="mt-0.5 text-[13px] leading-snug text-lo">{sub}</p>}
          </div>
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
    </div>
  );
}

/** Aviso para admins cuando las tablas del módulo aún no existen en la base. */
export function AvisoMigracion({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-[14px] border border-[#f8c98a] bg-[#ffeccc] px-3.5 py-3 text-[13px] leading-relaxed text-[#9a3c0a] dark:border-[#3c2e1b] dark:bg-[#251d11] dark:text-[#f8894f]">
      <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        <strong className="font-bold">Falta preparar la base de datos.</strong> Este módulo es nuevo: corré{" "}
        <code className="rounded bg-black/5 px-1 font-mono text-[12px]">npm run db:migrate</code> para crear sus tablas.
      </span>
    </div>
  );
}

/** Banner "Estás editando" de los módulos editables. */
export function BannerEdicion({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-[14px] border border-[#f5cbb3] bg-[#fdede2] px-3.5 py-3 text-[13px] leading-relaxed text-[#8a2a0e] dark:border-[#573827] dark:bg-[#1b1311] dark:text-[#e5cec7]">
      <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        <strong className="font-bold">Estás editando.</strong> {children}
      </span>
    </div>
  );
}

/** Estado vacío cálido. */
export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-[22px] border border-dashed border-mark bg-card/60 px-6 py-10 text-center">
      <p className="text-[15px] font-semibold text-hi">{titulo}</p>
      {children && <div className="max-w-sm text-[13px] leading-relaxed text-lo">{children}</div>}
    </div>
  );
}

/** Avatar de iniciales con el gradiente "Llama" (sin foto). */
export function Inicial({ nombre, size = 40, tono = "llama" }: { nombre: string; size?: number; tono?: "llama" | "vino" | "arcilla" }) {
  const fondo =
    tono === "vino" ? "bg-[#7a2a26]" : tono === "arcilla" ? "bg-[#c27c5a]" : "bg-llama";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${fondo}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {(nombre.trim().charAt(0) || "?").toUpperCase()}
    </span>
  );
}
