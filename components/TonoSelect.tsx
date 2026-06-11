"use client";

import { useState } from "react";

const MAYORES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const MENORES = ["Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"] as const;
const GRUPOS  = [{ label: "Mayores", notas: MAYORES }, { label: "Menores", notas: MENORES }];

interface Props {
  name:          string;
  defaultValue?: string | null;
}

export function TonoSelect({ name, defaultValue }: Props) {
  const [selected, setSelected] = useState(defaultValue ?? "");

  const pillCls = (nota: string) =>
    `flex items-center justify-center rounded-xl border py-3 text-sm font-semibold transition-colors active:scale-95 ${
      selected === nota
        ? "border-violet-500/50 bg-violet-500/15 text-violet-600 dark:text-violet-400"
        : "border-line bg-card text-hi hover:border-violet-500/30 hover:bg-violet-500/5"
    }`;

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <input type="hidden" name={name} value={selected} />

      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gone">Tono (opcional)</p>

      <button
        type="button"
        onClick={() => setSelected("")}
        className={`mb-4 w-full rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
          !selected
            ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400"
            : "border-line bg-input text-lo hover:bg-card"
        }`}
      >
        Sin tono
      </button>

      {GRUPOS.map(({ label, notas }) => (
        <div key={label} className="mb-3 last:mb-0">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gone">{label}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {notas.map((nota) => (
              <button key={nota} type="button" onClick={() => setSelected(nota)} className={pillCls(nota)}>
                {nota}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
