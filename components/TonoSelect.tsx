"use client";

import { useState } from "react";
import { Music2, X } from "lucide-react";

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
    <>
      {/* Hidden input — lo que lee el formulario */}
      <input type="hidden" name={name} value={selected} />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-mark bg-input px-3 py-3 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
      >
        <Music2 size={13} className="shrink-0 text-lo" />
        <span className={`flex-1 text-left ${selected ? "text-hi" : "text-gone"}`}>
          {selected || placeholder}
        </span>
        {selected && (
          <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-600 dark:text-violet-400">
            {selected}
          </span>
        )}
      </button>

      {/* Bottom sheet — fixed, cubre toda la pantalla */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="mx-auto flex w-full max-w-md flex-col rounded-t-3xl border-t border-line bg-base shadow-2xl"
            style={{ maxHeight: "85dvh" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header fijo */}
            <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-5">
              <p className="text-sm font-semibold text-hi">Elegí el tono</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-input text-lo hover:text-hi"
              >
                <X size={13} />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="overflow-y-auto px-5 pb-10">
              {/* Sin tono */}
              <button
                type="button"
                onClick={() => elegir("")}
                className={`mb-4 w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  !selected
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                    : "border-line bg-card text-lo hover:bg-input"
                }`}
              >
                Sin tono
              </button>

              {/* Grupos de notas */}
              {GRUPOS.map(({ label, notas }) => (
                <div key={label} className="mb-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gone">
                    {label}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {notas.map((nota) => (
                      <button key={nota} type="button" onClick={() => elegir(nota)} className={pillCls(nota)}>
                        {nota}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
