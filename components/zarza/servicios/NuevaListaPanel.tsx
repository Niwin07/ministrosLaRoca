"use client";

import { useState } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { cls } from "@/components/zarza/ui";
import { nombrePlataforma, ordenarPlataformas } from "@/lib/plataforma";

type Destino = "servicio" | "plantilla";
type Camino = "cero" | "plantilla" | "anterior";

interface Props {
  abiertoInicial?: boolean;
  plantillas: { id_playlist: number; nombre: string }[];
  anteriores: { id_playlist: number; nombre: string; meta: string }[];
  plataformas: { id: number; nombre: string }[];
  plataformaDefault: number;
  crearServicio:   (fd: FormData) => Promise<void>;
  crearPlantilla:  (fd: FormData) => Promise<void>;
  usarPlantilla:   (fd: FormData) => Promise<void>;
  repetirServicio: (fd: FormData) => Promise<void>;
}

function Opcion({ on, onClick, titulo, sub }: { on: boolean; onClick: () => void; titulo: string; sub: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`flex min-h-[64px] flex-col items-start gap-0.5 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
        on ? "border-fuego-600 bg-[#fbf1e4] dark:bg-fuego-600/10" : "border-line bg-[#fcf5eb] hover:border-mark dark:bg-input"
      }`}
    >
      <span className={`text-[15px] font-semibold ${on ? "text-fuego-600 dark:text-[#df8067]" : "text-hi"}`}>{titulo}</span>
      <span className="text-[13px] text-lo">{sub}</span>
    </button>
  );
}

/** Botón "Armar lista nueva" + panel de dos pasos del diseño "Mis servicios". */
export function NuevaListaPanel(p: Props) {
  const [abierto, setAbierto] = useState(!!p.abiertoInicial);
  const [destino, setDestino] = useState<Destino>("servicio");
  const [camino, setCamino] = useState<Camino>("cero");

  const selectorPlataforma = p.plataformas.length >= 2 && (
    <div role="radiogroup" aria-label="Plataforma" className="flex flex-wrap gap-2">
      {ordenarPlataformas(p.plataformas).map((pla) => (
        <label key={pla.id} className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-line bg-[#fcf5eb] px-4 text-[13px] font-semibold text-mid has-[:checked]:border-fuego-600 has-[:checked]:text-fuego-600 dark:bg-input">
          <input type="radio" name="id_plataforma" value={pla.id} defaultChecked={pla.id === p.plataformaDefault} className="accent-[#b4472a]" />
          {nombrePlataforma(pla.nombre)}
        </label>
      ))}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="panel-nueva"
        className={`${cls.btnLlama} min-h-[48px] px-6 text-[15px] max-sm:w-full`}
      >
        <Plus size={18} strokeWidth={2.4} aria-hidden /> Armar lista nueva
      </button>

      {abierto && (
        <section
          id="panel-nueva"
          aria-labelledby="nueva-lista"
          className="order-last col-span-full flex w-full flex-col gap-[18px] rounded-[22px] border border-fuego-600 bg-card p-5 shadow-[0_1px_2px_rgba(43,22,17,0.06),0_12px_30px_-12px_rgba(120,45,15,0.28)] dark:shadow-none sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="nueva-lista" className="font-display text-xl font-bold leading-tight tracking-[-0.02em] text-hi">Lista nueva</h2>
              <p className="mt-1 text-[13px] text-lo">Elegí para qué es y cómo querés empezar.</p>
            </div>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className={cls.btnIcono}>
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-[13px] font-semibold text-[#4a2c22] dark:text-hi"><span className="text-fuego-600">1</span>&nbsp;&nbsp;¿Para qué es?</p>
            <div role="radiogroup" aria-label="Destino" className="grid gap-2.5 sm:grid-cols-2">
              <Opcion on={destino === "servicio"} onClick={() => setDestino("servicio")} titulo="Para un servicio" sub="Una lista que vas a dirigir" />
              <Opcion on={destino === "plantilla"} onClick={() => { setDestino("plantilla"); setCamino("cero"); }} titulo="Sin fecha" sub="Se guarda como plantilla" />
            </div>
          </div>

          {destino === "servicio" && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[13px] font-semibold text-[#4a2c22] dark:text-hi"><span className="text-fuego-600">2</span>&nbsp;&nbsp;¿Cómo querés empezar?</p>
              <div role="radiogroup" aria-label="Cómo empezar" className="grid gap-2.5 sm:grid-cols-3">
                <Opcion on={camino === "cero"} onClick={() => setCamino("cero")} titulo="De cero" sub="Elegís canción por canción" />
                <Opcion on={camino === "plantilla"} onClick={() => setCamino("plantilla")} titulo="Desde una plantilla" sub="Partís de un set guardado" />
                <Opcion on={camino === "anterior"} onClick={() => setCamino("anterior")} titulo="Repetir un servicio" sub="Copiás uno que ya se hizo" />
              </div>
            </div>
          )}

          {(destino === "plantilla" || camino === "cero") && (
            <form action={destino === "plantilla" ? p.crearPlantilla : p.crearServicio} className="flex flex-col gap-3">
              {selectorPlataforma}
              <label className={cls.etiqueta}>
                {destino === "plantilla" ? "Nombre de la plantilla" : "Nombre del servicio"}
                <input name="nombre" required maxLength={255} placeholder={destino === "plantilla" ? "Ej: Set de adoración" : "Ej: Servicio del domingo"} className={cls.campo} />
              </label>
              <div className="flex justify-end">
                <button type="submit" className={`${cls.btnLlama} min-h-[48px] px-6 max-sm:w-full`}>
                  {destino === "plantilla" ? "Crear plantilla" : "Empezar a armar"} <ArrowRight size={16} aria-hidden />
                </button>
              </div>
            </form>
          )}

          {destino === "servicio" && camino === "plantilla" && (
            p.plantillas.length === 0 ? (
              <p className="text-[13px] text-lo">No tenés plantillas guardadas todavía.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                {p.plantillas.map((pl) => (
                  <form key={pl.id_playlist} action={p.usarPlantilla} className="flex items-center gap-2.5 rounded-[14px] border border-line bg-card px-3.5 py-3">
                    <input type="hidden" name="id_preset" value={pl.id_playlist} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-hi">{pl.nombre}</span>
                    <button type="submit" className={`${cls.btnLlama} min-h-[40px] shadow-none`}>Usar</button>
                  </form>
                ))}
              </div>
            )
          )}

          {destino === "servicio" && camino === "anterior" && (
            p.anteriores.length === 0 ? (
              <p className="text-[13px] text-lo">Todavía no hay servicios anteriores para repetir.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                {p.anteriores.slice(0, 12).map((a) => (
                  <form key={a.id_playlist} action={p.repetirServicio} className="flex items-center gap-2.5 rounded-[14px] border border-line bg-card px-3.5 py-3">
                    <input type="hidden" name="id_playlist" value={a.id_playlist} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-hi">{a.nombre}</span>
                      <span className="block truncate text-[13px] text-lo">{a.meta}</span>
                    </span>
                    <button type="submit" className={`${cls.btnLlama} min-h-[40px] shadow-none`}>Repetir</button>
                  </form>
                ))}
              </div>
            )
          )}
        </section>
      )}
    </>
  );
}
