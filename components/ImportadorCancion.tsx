"use client";

import { useState } from "react";
import { Upload, Sparkles, Loader2, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { interpretarCancion, type CancionImportada, type ModoImport } from "@/lib/importar-cancion";

const TIPOS = ".txt,.text,.cho,.crd,.pro,.chordpro,.md,.pdf,text/plain,application/pdf";

const MODOS: { id: ModoImport; label: string }[] = [
  { id: "auto",   label: "Separar (todo junto)" },
  { id: "letra",  label: "Solo letra" },
  { id: "charts", label: "Solo acordes" },
];

async function extraerTextoPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const lineas: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // Agrupar fragmentos por su coordenada vertical (cada grupo = una línea).
    const porLinea = new Map<number, { x: number; w: number; s: string }[]>();
    for (const it of content.items as unknown as { str?: string; width?: number; transform?: number[] }[]) {
      if (typeof it.str !== "string" || !it.str || !it.transform) continue;
      const y = Math.round(it.transform[5]);
      let arr = porLinea.get(y);
      if (!arr) { arr = []; porLinea.set(y, arr); }
      arr.push({ x: it.transform[4], w: it.width ?? 0, s: it.str });
    }

    const ys = Array.from(porLinea.keys()).sort((a, b) => b - a); // arriba → abajo
    for (const y of ys) {
      const items = porLinea.get(y)!.sort((a, b) => a.x - b.x);
      let linea = "";
      let prevEnd: number | null = null;
      for (const it of items) {
        if (prevEnd !== null) {
          const gap = it.x - prevEnd;
          const charW = it.s.length && it.w ? it.w / it.s.length : 6;
          // Reconstruir los espacios reales según la separación horizontal,
          // así los acordes no se pegan ni pierden su posición.
          if (gap > charW * 0.6) {
            linea += " ".repeat(Math.min(40, Math.round(gap / charW)));
          }
        }
        linea += it.s;
        prevEnd = it.x + it.w;
      }
      lineas.push(linea.replace(/\s+$/, ""));
    }
    lineas.push("");
  }

  return lineas.join("\n");
}

export function ImportadorCancion({ onImport }: { onImport: (r: CancionImportada) => void }) {
  const [texto, setTexto]       = useState("");
  const [modo, setModo]         = useState<ModoImport>("auto");
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [aviso, setAviso]       = useState<string | null>(null);

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setAviso(null);

    // Sugerir el modo según el nombre del archivo (LETRAS / ACORDES).
    const n = file.name.toLowerCase();
    if (/letra|lyric/.test(n)) setModo("letra");
    else if (/acorde|chord|chart/.test(n)) setModo("charts");

    try {
      const esPdf = file.type === "application/pdf" || n.endsWith(".pdf");
      let contenido: string;
      if (esPdf) {
        setCargando(true);
        contenido = await extraerTextoPdf(file);
      } else {
        contenido = await file.text();
      }
      if (!contenido.trim()) {
        setError("El archivo no tiene texto legible. Si es un PDF escaneado o una imagen, copiá y pegá el texto.");
        return;
      }
      setTexto(contenido);
      setAviso(`Cargué "${file.name}". Revisá el modo y tocá Interpretar.`);
    } catch {
      setError("No pude leer el archivo. Si es un PDF escaneado o imagen, copiá y pegá el texto a mano.");
    } finally {
      setCargando(false);
    }
  }

  function handleInterpretar() {
    setError(null);
    setAviso(null);
    const r = interpretarCancion(texto, modo);
    if (!r.letra && !r.charts) {
      setError("No pude interpretar el texto. Revisá que tenga contenido.");
      return;
    }
    onImport(r);
    const partes = [r.letra ? "letra" : null, r.charts ? "acordes" : null].filter(Boolean).join(" y ");
    setAviso(`Listo: cargué ${partes} abajo. Revisalo y editá lo que haga falta.`);
    setTexto("");
  }

  return (
    <details className="group overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-500/[0.04]">
      <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-violet-500" />
          <div>
            <p className="text-sm font-semibold text-hi">Importar canción</p>
            <p className="text-[11px] text-lo">Pegá el tema o subí archivos (de letra y/o de acordes) y los separo.</p>
          </div>
        </div>
        <ChevronDown size={15} className="shrink-0 text-lo transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="space-y-3 border-t border-violet-500/20 px-4 py-4">
        {/* Qué estás importando */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-lo">¿Qué estás cargando?</span>
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-mark bg-input p-0.5 text-[11px] font-medium">
            {MODOS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModo(m.id)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  modo === m.id ? "bg-violet-600 text-white" : "text-mid hover:text-hi"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gone">
            Subiste el PDF de <b>LETRAS</b> → “Solo letra”. El de <b>ACORDES</b> → “Solo acordes”. Un solo archivo con todo → “Separar”.
          </p>
        </div>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          placeholder={"Pegá acá la canción (o subí un archivo). Reconoce:\n• Acordes arriba de la letra (Elevation, etc.)\n• ChordPro: [G]Sublime [C]gracia\n• Números Nashville\nLimpia solo: © , CCLI, autores, traductores."}
          className="w-full resize-y rounded-xl border border-mark bg-input px-3 py-2.5 font-mono text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        />

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-mark bg-input px-3.5 py-2 text-xs font-medium text-mid transition-colors hover:border-line hover:text-hi">
            {cargando ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {cargando ? "Leyendo…" : "Subir archivo"}
            <input type="file" accept={TIPOS} onChange={handleArchivo} disabled={cargando} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleInterpretar}
            disabled={!texto.trim() || cargando}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles size={13} />
            Interpretar y cargar
          </button>

          <span className="text-[10px] text-gone">.txt · .cho · .crd · .pro · .pdf (de texto)</span>
        </div>

        {error && (
          <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        {aviso && !error && (
          <p className="flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-xs text-green-700 dark:text-green-400">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            {aviso}
          </p>
        )}
      </div>
    </details>
  );
}
