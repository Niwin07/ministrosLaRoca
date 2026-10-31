"use client";

import { useEffect, useState } from "react";
import { Archive, ArrowLeft, ArrowRight, Check, HelpCircle, X } from "lucide-react";
import { cls } from "@/components/zarza/ui";

const ETAPAS = ["PREPARACION", "ENSAYO", "DEFINITIVA"] as const;
const NOMBRE: Record<string, string> = { PREPARACION: "Preparación", ENSAYO: "Ensayo", DEFINITIVA: "Definitiva" };
const AYUDA: Record<string, string> = {
  PREPARACION: "Estás armando la lista: sólo la ves vos. Cuando tengas las canciones, pasala a Ensayo para que el equipo la vea y la practique.",
  ENSAYO: "El equipo ya ve la lista y puede practicarla. Podés seguir cambiando canciones y tonos. Cuando esté confirmada, marcala como Definitiva.",
  DEFINITIVA: "Lista final del servicio: las canciones quedan bloqueadas. Si necesitás corregir algo, volvé a Ensayo. Después del servicio, archivala.",
};

/**
 * Stepper de etapas del servicio (Preparación → Ensayo → Definitiva) con
 * ayuda plegable y botones Volver / Pasar a / Archivar. Cada botón envía el
 * nuevo estado al Server Action existente (avanzarEstadoPlaylist).
 */
export function EtapasServicio({
  estado,
  puedePublicar,
  motivoBloqueo,
  onCambiar,
}: {
  estado: string;
  puedePublicar: boolean;
  motivoBloqueo: string;
  onCambiar: (fd: FormData) => Promise<void>;
}) {
  const [ayuda, setAyuda] = useState(true);
  useEffect(() => {
    try { if (localStorage.getItem("roca-ayuda-etapas") === "oculta") setAyuda(false); } catch {}
  }, []);
  function cambiarAyuda(v: boolean) {
    setAyuda(v);
    try { localStorage.setItem("roca-ayuda-etapas", v ? "visible" : "oculta"); } catch {}
  }

  const idx = ETAPAS.indexOf(estado as (typeof ETAPAS)[number]);
  const anterior = idx > 0 ? ETAPAS[idx - 1] : null;
  const siguiente = idx >= 0 && idx < ETAPAS.length - 1 ? ETAPAS[idx + 1] : null;
  // Pasar a Ensayo o Definitiva publica la lista: sólo el director de turno.
  const siguienteBloqueado = !!siguiente && !puedePublicar;
  const anteriorBloqueado = anterior === "ENSAYO" && !puedePublicar;

  const Boton = ({ nuevo, children, primario, disabled, title }: { nuevo: string; children: React.ReactNode; primario?: boolean; disabled?: boolean; title?: string }) => (
    <form action={onCambiar}>
      <input type="hidden" name="nuevoEstado" value={nuevo} />
      <button type="submit" disabled={disabled} title={title} className={`${primario ? cls.btnLlama : cls.btnSec} min-h-[40px] shadow-none`}>
        {children}
      </button>
    </form>
  );

  return (
    <>
      <div className="flex min-w-0 max-w-[460px] flex-[1_1_300px] items-center gap-1">
        <ol aria-label="Etapas del servicio" className="grid min-w-0 flex-1 grid-cols-3">
          {ETAPAS.map((e, i) => {
            const hecho = i < idx;
            const actual = i === idx;
            return (
              <li key={e} aria-current={actual ? "step" : undefined} className="flex min-w-0 flex-col items-center gap-1 text-center">
                <div className="flex w-full items-center">
                  <Linea vacia={i === 0} llena={i <= idx} demora={i * 0.22} />
                  <span
                    key={`${e}-${estado}`}
                    style={{ animationDelay: `${i * 0.22}s` }}
                    className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors duration-300 ${
                      hecho ? "animate-pop border-fuego-600 bg-fuego-600 text-white" : actual ? "animate-pop border-fuego-600 bg-card text-fuego-600 shadow-[0_0_0_4px_rgba(180,71,42,0.14)]" : "border-line bg-card text-gone"
                    }`}
                  >
                    {hecho ? <Check size={13} strokeWidth={3} aria-hidden /> : i + 1}
                  </span>
                  <Linea vacia={i === ETAPAS.length - 1} llena={i < idx} demora={i * 0.22 + 0.11} />
                </div>
                <span className={`text-xs ${actual ? "font-semibold text-hi" : "font-medium text-lo"}`}>{NOMBRE[e]}</span>
              </li>
            );
          })}
        </ol>
        {!ayuda && (
          <button type="button" onClick={() => cambiarAyuda(true)} aria-label="¿Qué significa cada etapa?" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#b9998a] hover:text-hi">
            <HelpCircle size={18} aria-hidden />
          </button>
        )}
      </div>

      <div className="order-last flex w-full flex-col gap-2.5 border-t border-[#f1e5d4] pt-3 dark:border-line">
        {ayuda && AYUDA[estado] && (
          <div className="animate-desplegar relative rounded-xl border border-fuego-600/25 bg-[#fbf1e4] py-2.5 pl-3.5 pr-10 dark:bg-fuego-600/10">
            <p className="text-[13px] leading-relaxed text-[#4a2c22] dark:text-mid">{AYUDA[estado]}</p>
            <button type="button" onClick={() => cambiarAyuda(false)} aria-label="Ocultar ayuda" className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-lo hover:text-hi">
              <X size={15} aria-hidden />
            </button>
          </div>
        )}
        {(siguienteBloqueado || anteriorBloqueado) && (
          <p className="text-xs text-[#9a3c0a] dark:text-[#f8894f]">{motivoBloqueo}</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {anterior ? (
            <Boton nuevo={anterior} disabled={anteriorBloqueado} title={anteriorBloqueado ? motivoBloqueo : undefined}>
              <ArrowLeft size={15} aria-hidden /> Volver a {NOMBRE[anterior]}
            </Boton>
          ) : <span />}
          {siguiente ? (
            <Boton nuevo={siguiente} primario disabled={siguienteBloqueado} title={siguienteBloqueado ? motivoBloqueo : undefined}>
              Pasar a {NOMBRE[siguiente]} <ArrowRight size={15} aria-hidden />
            </Boton>
          ) : estado === "DEFINITIVA" ? (
            <Boton nuevo="MAZO">
              <Archive size={15} aria-hidden /> Archivar
            </Boton>
          ) : null}
        </div>
      </div>
    </>
  );
}

/** Tramo entre etapas: se llena de izquierda a derecha al avanzar. */
function Linea({ vacia, llena, demora }: { vacia: boolean; llena: boolean; demora: number }) {
  if (vacia) return <span className="h-0.5 flex-1" />;
  return (
    <span className="relative h-0.5 flex-1 overflow-hidden bg-[#eadbc6] dark:bg-line">
      {llena && (
        <span
          className="animate-crecer-x absolute inset-0 bg-fuego-600"
          style={{ animationDelay: `${demora}s`, animationDuration: "0.5s" }}
        />
      )}
    </span>
  );
}
