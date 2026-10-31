"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Plus, Search } from "lucide-react";

interface Cancion {
  id_cancion: number;
  nombre: string;
  artista: string;
}

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * "Agregar canción" del detalle de servicio (diseño Zarza): buscador sobre el
 * repertorio aprobado y botón "Agregar" por resultado. El tono se elige
 * después desde la fila de la canción.
 */
export function AgregarCancion({
  catalogo,
  enLista,
  siguienteOrden,
  onAgregar,
}: {
  catalogo: Cancion[];
  enLista: number[];
  siguienteOrden: number;
  onAgregar: (fd: FormData) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [agregadas, setAgregadas] = useState<number[]>([]);
  const [pending, start] = useTransition();
  const yaEsta = new Set([...enLista, ...agregadas]);

  const resultados = useMemo(() => {
    const t = normalizar(q.trim());
    const base = t
      ? catalogo.filter((c) => normalizar(`${c.nombre} ${c.artista}`).includes(t))
      : catalogo.filter((c) => !enLista.includes(c.id_cancion));
    return base.slice(0, t ? 20 : 6);
  }, [q, catalogo, enLista]);

  function agregar(c: Cancion) {
    const fd = new FormData();
    fd.set("id_cancion", String(c.id_cancion));
    fd.set("orden", String(siguienteOrden + agregadas.length));
    fd.set("nota", "");
    setAgregadas((a) => [...a, c.id_cancion]);
    start(async () => { await onAgregar(fd); });
  }

  return (
    <section aria-labelledby="agregar-cancion" className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-card p-5 shadow-card dark:shadow-none">
      <div>
        <h2 id="agregar-cancion" className="font-display text-[17px] font-bold tracking-[-0.02em] text-hi">Agregar canción</h2>
        <p className="mt-0.5 text-[13px] text-lo">Buscá por nombre o artista.</p>
      </div>
      <label className="relative flex">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lo" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar en el repertorio"
          placeholder="Buscar en el repertorio…"
          className="min-h-[54px] w-full rounded-full border border-mark bg-input py-3.5 pl-[46px] pr-4 text-base text-hi placeholder:text-gone outline-none focus:border-fuego-500 focus:ring-2 focus:ring-fuego-500/30"
        />
      </label>
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-lo">{q.trim() ? "Resultados" : "Sugeridas"}</p>
        {resultados.length === 0 ? (
          <p className="py-2 text-[13px] text-lo">No hay canciones que coincidan.</p>
        ) : (
          <div key={q.trim()} className="escalonar grid gap-2 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {resultados.map((c) => {
              const agregada = yaEsta.has(c.id_cancion);
              return (
                <div key={c.id_cancion} className="tarjeta-viva flex min-w-0 items-center gap-3 rounded-[14px] border border-[#f1e5d4] bg-[#fbf3e8] py-2.5 pl-3.5 pr-2.5 dark:border-line dark:bg-input">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-hi">{c.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-lo">{c.artista}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => agregar(c)}
                    disabled={agregada || pending}
                    aria-label={agregada ? `${c.nombre} ya está en el servicio` : `Agregar ${c.nombre}`}
                    className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
                      agregada
                        ? "border-transparent bg-fuego-600/10 text-fuego-600 dark:text-[#df8067]"
                        : "border-fuego-600 bg-transparent text-fuego-600 hover:bg-fuego-600 hover:text-white dark:text-[#df8067]"
                    }`}
                  >
                    {agregada ? <Check size={14} aria-hidden /> : <Plus size={14} aria-hidden />}
                    {agregada ? "Agregada" : "Agregar"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
