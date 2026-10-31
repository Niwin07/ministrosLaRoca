"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Mic2, Trash2 } from "lucide-react";

// ════════════════════════════════════════════════════════════════
//  Confirmaciones del sistema Zarza (reemplazan al confirm() del
//  navegador). En el celular sube como hoja desde abajo; en
//  computadora aparece centrada. Escape o tocar afuera cancela.
// ════════════════════════════════════════════════════════════════

export type TonoConfirmacion = "peligro" | "llama";

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje?: ReactNode;
  /** Texto del botón principal (por defecto "Eliminar" / "Confirmar"). */
  confirmar?: string;
  cancelar?: string;
  /** "peligro" para borrar/quitar; "llama" para acciones normales. */
  tono?: TonoConfirmacion;
  icono?: "borrar" | "aviso" | "microfono";
}

type Pedido = OpcionesConfirmacion & { resolver: (ok: boolean) => void };

const Contexto = createContext<((o: OpcionesConfirmacion) => Promise<boolean>) | null>(null);

/** Devuelve `confirmar(opciones)` → Promise<boolean>. */
export function useConfirmar() {
  const fn = useContext(Contexto);
  // Sin proveedor (no debería pasar): cae al confirm del navegador.
  return fn ?? ((o: OpcionesConfirmacion) => Promise.resolve(window.confirm(o.titulo)));
}

const ICONOS = {
  borrar: Trash2,
  aviso: AlertTriangle,
  microfono: Mic2,
};

export function ProveedorConfirmacion({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const reducir = useReducedMotion();
  const botonCancelar = useRef<HTMLButtonElement>(null);
  const foco = useRef<HTMLElement | null>(null);

  const confirmar = useCallback((o: OpcionesConfirmacion) => {
    return new Promise<boolean>((resolver) => {
      foco.current = document.activeElement as HTMLElement | null;
      setPedido({ ...o, resolver });
    });
  }, []);

  const cerrar = useCallback((ok: boolean) => {
    setPedido((p) => {
      p?.resolver(ok);
      return null;
    });
    // Devuelve el foco a lo que abrió la confirmación.
    setTimeout(() => foco.current?.focus?.(), 0);
  }, []);

  useEffect(() => {
    if (!pedido) return;
    botonCancelar.current?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(false); };
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
    };
  }, [pedido, cerrar]);

  const tono = pedido?.tono ?? "peligro";
  const Icono = ICONOS[pedido?.icono ?? (tono === "peligro" ? "borrar" : "aviso")];
  const resorte = reducir ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };

  return (
    <Contexto.Provider value={confirmar}>
      {children}
      <AnimatePresence>
        {pedido && (
          <motion.div
            key="confirmacion"
            className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducir ? 0 : 0.2 }}
          >
            {/* Velo cálido */}
            <button
              type="button"
              aria-label="Cancelar"
              tabIndex={-1}
              onClick={() => cerrar(false)}
              className="absolute inset-0 cursor-default bg-[rgba(43,14,8,0.42)] dark:bg-[rgba(8,2,1,0.62)]"
              data-sin-presion
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirmacion-titulo"
              aria-describedby={pedido.mensaje ? "confirmacion-mensaje" : undefined}
              initial={reducir ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducir ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
              transition={resorte}
              className="relative w-full max-w-[420px] rounded-t-[28px] border border-line bg-card px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-6 shadow-[0_-10px_40px_-12px_rgba(94,31,24,0.45)] sm:rounded-[26px] sm:pb-6 sm:shadow-[0_24px_60px_-20px_rgba(94,31,24,0.55)] dark:shadow-black/70"
            >
              {/* Asa de la hoja (sólo celular) */}
              <span aria-hidden className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-mark sm:hidden" />

              <div className="flex flex-col items-center gap-3 text-center">
                <motion.span
                  initial={reducir ? false : { scale: 0.4, rotate: -12, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={reducir ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 18, delay: 0.06 }}
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${
                    tono === "peligro"
                      ? "bg-[#fde4d8] text-[#a8320f] dark:bg-[#2a1511] dark:text-[#f47753]"
                      : "bg-fuego-600/10 text-fuego-600 dark:text-[#df8067]"
                  }`}
                >
                  <Icono size={24} strokeWidth={2} aria-hidden />
                </motion.span>
                <h2 id="confirmacion-titulo" className="font-display text-xl font-bold leading-tight tracking-[-0.02em] text-hi">
                  {pedido.titulo}
                </h2>
                {pedido.mensaje && (
                  <p id="confirmacion-mensaje" className="max-w-[320px] text-sm leading-relaxed text-mid">
                    {pedido.mensaje}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row">
                <button
                  ref={botonCancelar}
                  type="button"
                  onClick={() => cerrar(false)}
                  className="min-h-[48px] flex-1 rounded-full border border-mark bg-card px-5 text-sm font-semibold text-[#4a2c22] transition-colors hover:border-fuego-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40 dark:text-hi"
                >
                  {pedido.cancelar ?? "Cancelar"}
                </button>
                <button
                  type="button"
                  onClick={() => cerrar(true)}
                  className={`btn-brillo min-h-[48px] flex-1 rounded-full px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                    tono === "peligro"
                      ? "bg-[linear-gradient(135deg,#d0503a_0%,#a8320f_55%,#6e1a0c_100%)] shadow-[0_10px_20px_-8px_rgba(168,50,15,0.55)] focus-visible:ring-red-500/50"
                      : "bg-llama shadow-llama focus-visible:ring-fuego-500/50"
                  }`}
                >
                  {pedido.confirmar ?? (tono === "peligro" ? "Eliminar" : "Confirmar")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Contexto.Provider>
  );
}

/**
 * Botón de envío que pide confirmación antes de mandar su formulario
 * (sirve con Server Actions: `<form action={…}><BotonConfirmado …/></form>`).
 */
export function BotonConfirmado({
  confirmacion,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmacion: OpcionesConfirmacion }) {
  const confirmar = useConfirmar();
  async function alTocar(e: MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    const boton = e.currentTarget;
    if (await confirmar(confirmacion)) boton.form?.requestSubmit(boton);
  }
  return <button type="submit" {...props} onClick={alTocar} />;
}
