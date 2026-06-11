"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, ChevronDown } from "lucide-react";

const MAYORES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const MENORES = ["Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"] as const;
const GRUPOS  = [{ label: "Mayores", notas: MAYORES }, { label: "Menores", notas: MENORES }];

interface Props {
  name:          string;
  defaultValue?: string | null;
  placeholder?:  string;
}

export function TonoSelect({ name, defaultValue, placeholder = "Tono (opcional)…" }: Props) {
  const [selected, setSelected] = useState(defaultValue ?? "");
  const [open, setOpen]         = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function elegir(nota: string) {
    setSelected(nota);
    setOpen(false);
  }

  const pillCls = (nota: string) =>
    `flex items-center justify-center rounded-xl border py-3 text-sm font-semibold transition-colors active:scale-95 ${
      selected === nota
        ? "border-violet-500/50 bg-violet-500/15 text-violet-600 dark:text-violet-400"
        : "border-line bg-card text-hi hover:border-violet-500/30 hover:bg-violet-500/5"
    }`;

  return (
    <div ref={ref}>
      <input type="hidden" name={name} value={selected} />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-mark bg-input px-3 py-3 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
      >
        <Music2 size={13} className="shrink-0 text-lo" />
        <span className={`flex-1 text-left ${selected ? "text-hi" : "text-gone"}`}>
          {selected || placeholder}
        </span>
        {selected ? (
          <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-600 dark:text-violet-400">
            {selected}
          </span>
        ) : (
          <ChevronDown size={13} className={`shrink-0 text-lo transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {/* Panel inline — sin fixed, el scroll lo maneja la página */}
      {open && (
        <div className="mt-2 rounded-2xl border border-line bg-card p-4 shadow-xl dark:shadow-black/40">
          <button
            type="button"
            onClick={() => elegir("")}
            className={`mb-3 w-full rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              !selected
                ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                : "border-line bg-input text-lo hover:bg-card"
            }`}
          >
            Sin tono
          </button>

          {GRUPOS.map(({ label, notas }) => (
            <div key={label} className="mb-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gone">{label}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {notas.map((nota) => (
                  <button key={nota} type="button" onClick={() => elegir(nota)} className={pillCls(nota)}>
                    {nota}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
