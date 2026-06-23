"use client";

import { useRef } from "react";
import { Eye, HelpCircle } from "lucide-react";
import { ChartViewer } from "@/components/ChartViewer";
import { LyricViewer } from "@/components/LyricViewer";

const SECCIONES = ["Intro", "Verso", "Pre-coro", "Coro", "Puente", "Final"];

interface Props {
  name: string;
  tipo: "letra" | "charts";
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function EditorContenido({ name, tipo, label, value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function insertar(texto: string) {
    const ta = ref.current;
    if (!ta) {
      onChange((value && !value.endsWith("\n") ? value + "\n" : value) + texto);
      return;
    }
    const { selectionStart: start, selectionEnd: end } = ta;
    const antes = value.slice(0, start);
    const despues = value.slice(end);
    const prefijo = antes && !antes.endsWith("\n") ? "\n" : "";
    const insertado = prefijo + texto;
    onChange(antes + insertado + despues);

    requestAnimationFrame(() => {
      const pos = (antes + insertado).length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Barra de secciones */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-lo">{label}</span>
        {SECCIONES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => insertar(`[${s}]\n`)}
            className="rounded-md border border-mark bg-input px-2 py-1 text-[11px] text-mid transition-colors hover:border-line hover:text-hi md:px-4 md:py-2 md:text-xs"
          >
            + {s}
          </button>
        ))}
        {tipo === "charts" && (
          <button
            type="button"
            onClick={() => insertar("|  ")}
            title="Separador de compás"
            className="rounded-md border border-mark bg-input px-2.5 py-1 font-mono text-[11px] text-mid transition-colors hover:border-line hover:text-hi md:px-3 md:py-2 md:text-xs"
          >
            |
          </button>
        )}
      </div>

      <textarea
        ref={ref}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder={placeholder}
        className={`w-full resize-y rounded-xl border border-mark bg-input px-3 py-2.5 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 ${
          tipo === "charts" ? "font-mono" : ""
        }`}
      />

      {/* Mini-guía */}
      <details className="group">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[11px] text-lo transition-colors hover:text-mid [&::-webkit-details-marker]:hidden">
          <HelpCircle size={12} /> ¿Cómo cargar?
        </summary>
        <div className="mt-1.5 rounded-lg border border-line bg-card px-3 py-2 text-[11px] leading-relaxed text-lo">
          {tipo === "letra" ? (
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Marcá cada sección con los botones de arriba: <code className="text-mid">[Coro]</code>.</li>
              <li>Una línea por verso. Dejá una línea en blanco entre secciones.</li>
            </ul>
          ) : (
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Sistema Nashville: números <code className="text-mid">1</code>–<code className="text-mid">7</code> (1 = tónica del tono).</li>
              <li><code className="text-mid">m</code> para menor (<code className="text-mid">6m</code>); también <code className="text-mid">sus</code>, <code className="text-mid">7</code>, y <code className="text-mid">/</code> para el bajo (<code className="text-mid">1/5</code>).</li>
              <li>Separá compases con <code className="text-mid">|</code> y marcá secciones con <code className="text-mid">[Coro]</code>.</li>
            </ul>
          )}
        </div>
      </details>

      {/* Vista previa en vivo */}
      {value.trim() && (
        <div className="rounded-xl border border-line bg-card px-3 py-3">
          <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gone">
            <Eye size={11} /> Vista previa
          </p>
          {tipo === "charts" ? <ChartViewer charts={value} /> : <LyricViewer letra={value} />}
        </div>
      )}
    </div>
  );
}
