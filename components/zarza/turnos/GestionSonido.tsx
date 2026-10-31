"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cls, Inicial } from "@/components/zarza/ui";
import { useConfirmar } from "@/components/zarza/Confirmacion";
import { SALIDA_ITEM } from "@/components/zarza/ListaAnimada";
import { agregarSonidista, quitarSonidista, asignarSonido, guardarSemanasPlanificadas } from "@/app/actions/sonido";
import type { ResultadoAccion } from "@/app/actions/contenido";

interface Persona { id: number; nombre: string }
interface Semana { semana: string; principal: Persona | null; auxiliar: Persona | null }

function useAccion() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const correr = (accion: (fd: FormData) => Promise<ResultadoAccion>, campos: Record<string, string | number>) => {
    const fd = new FormData();
    Object.entries(campos).forEach(([k, v]) => fd.set(k, String(v)));
    setError(null);
    start(async () => {
      const r = await accion(fd);
      if (!r.ok) setError(r.error);
    });
  };
  return { error, pending, correr };
}

const etiqueta = (i: number) => (i === 0 ? "Próxima semana" : `En ${i + 1} semanas`);

/** Stepper "Semanas planificadas" (cuántos turnos por adelantado ve el equipo). */
export function SemanasPlanificadas({ id_plataforma, semanas }: { id_plataforma: number; semanas: number }) {
  const { error, pending, correr } = useAccion();
  const cambiar = (n: number) => correr(guardarSemanasPlanificadas, { id_plataforma, semanas: Math.min(12, Math.max(1, n)) });
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-hi">Semanas planificadas</p>
        <p className="text-xs text-lo">Cuántos turnos por adelantado se cargan y ve el equipo.</p>
        {error && <p role="alert" className="mt-1 text-xs text-red-700 dark:text-red-400">{error}</p>}
      </div>
      <div className="flex items-center gap-1 rounded-full border border-line bg-input p-1">
        <button type="button" onClick={() => cambiar(semanas - 1)} disabled={pending || semanas <= 1} aria-label="Una semana menos" className="flex h-9 w-9 items-center justify-center rounded-full text-hi hover:bg-card disabled:opacity-40"><Minus size={16} aria-hidden /></button>
        <span aria-live="polite" className="w-8 text-center text-base font-bold tabular-nums text-hi"><span key={semanas} className="inline-block animate-rebote">{semanas}</span></span>
        <button type="button" onClick={() => cambiar(semanas + 1)} disabled={pending || semanas >= 12} aria-label="Una semana más" className="flex h-9 w-9 items-center justify-center rounded-full text-hi hover:bg-card disabled:opacity-40"><Plus size={16} aria-hidden /></button>
      </div>
    </div>
  );
}

function SelectPersona({
  label, valor, opciones, sugeridoId, onChange, disabled, tono,
}: {
  label: string;
  valor: Persona | null;
  opciones: Persona[];
  sugeridoId?: number;
  onChange: (id: string) => void;
  disabled?: boolean;
  tono: "vino" | "arcilla";
}) {
  return (
    <label className={`relative flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden rounded-[14px] border px-3 py-2 ${tono === "vino" ? "border-[#efc7b3] dark:border-[#573827]" : "border-mark"}`}>
      {/* Destello al elegir a alguien */}
      {valor && <span key={valor.id} aria-hidden className="animate-destello pointer-events-none absolute inset-0 bg-fuego-500/20" />}
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7a2a26] dark:text-[#d69271]">{label}</span>
      <select
        value={valor?.id ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={label}
        className="w-full truncate bg-transparent text-sm font-semibold text-hi outline-none [&>option]:bg-card"
      >
        <option value="">Sin asignar</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>{o.nombre}{o.id === sugeridoId ? " · sigue en la rotación" : ""}</option>
        ))}
      </select>
    </label>
  );
}

/** "Turnos de sonido": sonidistas habilitados + principal/auxiliar por semana. */
export function GestionSonido({
  id_plataforma,
  plataformaNombre,
  semanas,
  sonidistas,
  usuarios,
}: {
  id_plataforma: number;
  plataformaNombre: string;
  semanas: Semana[];
  sonidistas: Persona[];
  usuarios: Persona[];
}) {
  const { error, pending, correr } = useAccion();
  const [nuevo, setNuevo] = useState("");
  const confirmar = useConfirmar();
  const reducir = useReducedMotion();
  const ahora = semanas[0];
  const proximas = semanas.slice(1);
  // Auxiliares: cualquiera de los sonidistas habilitados (y quien ya esté asignado).
  const opciones = sonidistas;
  const disponibles = usuarios.filter((u) => !sonidistas.some((s) => s.id === u.id));

  const asignar = (semana: string, rol: "principal" | "auxiliar", id: string) =>
    correr(asignarSonido, { id_plataforma, semana, rol, id_usuario: id });

  // Sugerencia: rotación simple sobre la lista de sonidistas.
  const sugerido = (i: number, desfase: number) => (opciones.length ? opciones[(i + desfase) % opciones.length].id : undefined);

  return (
    <section aria-labelledby="g-sonido" className="flex flex-col gap-4 rounded-[22px] border border-line bg-card p-5 shadow-card dark:shadow-none">
      <div>
        <h2 id="g-sonido" className="font-display text-lg font-bold tracking-[-0.02em] text-hi">Turnos de sonido</h2>
        <p className="mt-0.5 text-[13px] text-lo">Sonidista principal y auxiliar de cada servicio de {plataformaNombre}.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-700 dark:text-red-400">{error}</p>}

      {/* En servicio ahora */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-mid">En servicio ahora</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(["principal", "auxiliar"] as const).map((rol) => {
            const p = ahora?.[rol] ?? null;
            return (
              <div key={rol} className={`flex items-center gap-2.5 rounded-2xl border p-3 ${rol === "principal" ? "border-[rgba(122,42,38,0.3)] bg-[#fbede6] dark:bg-[#1e1513]" : "border-line bg-[#fcf5eb] dark:bg-input"}`}>
                <span key={p?.id ?? "nadie"} className="flex animate-pop"><Inicial nombre={p?.nombre ?? (rol === "principal" ? "S" : "A")} size={36} tono={rol === "principal" ? "vino" : "arcilla"} /></span>
                <SelectPersona
                  label={rol === "principal" ? "Principal" : "Auxiliar"}
                  valor={p}
                  opciones={opciones.some((o) => o.id === p?.id) || !p ? opciones : [...opciones, p]}
                  onChange={(id) => ahora && asignar(ahora.semana, rol, id)}
                  disabled={pending || !opciones.length}
                  tono={rol === "principal" ? "vino" : "arcilla"}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Sonidistas habilitados */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-mid">Sonidistas de {plataformaNombre}</p>
        {sonidistas.length === 0 ? (
          <p className="text-[13px] text-lo">Todavía no hay sonidistas. Agregá a las personas que pueden operar el sonido.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            <AnimatePresence initial={false} mode="popLayout">
            {sonidistas.map((s) => (
              <motion.li key={s.id} layout={!reducir} {...(reducir ? {} : SALIDA_ITEM)} transition={{ type: "spring", stiffness: 420, damping: 36 }} className="flex items-center gap-1.5 rounded-full border border-line bg-[#fcf5eb] py-1 pl-1 pr-1.5 dark:bg-input">
                <Inicial nombre={s.nombre} size={26} tono="vino" />
                <span className="text-[13px] font-semibold text-hi">{s.nombre}</span>
                <button type="button" onClick={async () => {
                  const ok = await confirmar({
                    titulo: "¿Quitar de sonidistas?",
                    mensaje: <><strong className="font-semibold text-hi">{s.nombre}</strong> deja de figurar como sonidista de {plataformaNombre}.</>,
                    confirmar: "Quitar",
                  });
                  if (ok) correr(quitarSonidista, { id_plataforma, id_usuario: s.id });
                }} disabled={pending} aria-label={`Quitar a ${s.nombre} de sonidistas`} className="flex h-7 w-7 items-center justify-center rounded-full text-gone hover:text-red-600">
                  <X size={14} aria-hidden />
                </button>
              </motion.li>
            ))}
            </AnimatePresence>
          </ul>
        )}
        <div className="flex gap-2">
          <select value={nuevo} onChange={(e) => setNuevo(e.target.value)} aria-label="Elegir persona" className={`${cls.campo} flex-1 [&>option]:bg-card`}>
            <option value="">Elegir persona…</option>
            {disponibles.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!nuevo || pending}
            onClick={() => { correr(agregarSonidista, { id_plataforma, id_usuario: nuevo }); setNuevo(""); }}
            className={cls.btnLlama}
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Próximas semanas */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-mid">Próximas semanas</p>
        <p className="-mt-1 text-xs text-lo">Elegí sonidista y auxiliar de cada semana.</p>
        <ol className="flex flex-col gap-2">
          {proximas.map((s, i) => (
            <li key={s.semana} className="flex flex-col gap-2 rounded-2xl border border-line bg-[#fcf5eb] p-3 dark:bg-input">
              <span className="text-xs font-semibold text-lo">{etiqueta(i)}</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SelectPersona label="Sonidista" valor={s.principal} opciones={opciones} sugeridoId={sugerido(i + 1, 0)} onChange={(id) => asignar(s.semana, "principal", id)} disabled={pending || !opciones.length} tono="vino" />
                <SelectPersona label="Auxiliar" valor={s.auxiliar} opciones={opciones} sugeridoId={sugerido(i + 2, 0)} onChange={(id) => asignar(s.semana, "auxiliar", id)} disabled={pending || !opciones.length} tono="arcilla" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
