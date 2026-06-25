"use client";

import { useState } from "react";
import { Upload, Sparkles, Loader2, ChevronDown, AlertCircle, CheckCircle2, FileText, Music } from "lucide-react";
import type { CancionImportada } from "@/lib/importar-cancion";

const TIPOS = ".txt,.text,.cho,.crd,.pro,.chordpro,.md,.pdf,text/plain,application/pdf";

async function extraerTextoPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const lineas: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    const porLinea = new Map<number, { x: number; w: number; s: string }[]>();
    for (const it of content.items as unknown as { str?: string; width?: number; transform?: number[] }[]) {
      if (typeof it.str !== "string" || !it.str || !it.transform) continue;
      const y = Math.round(it.transform[5]);
      let arr = porLinea.get(y);
      if (!arr) { arr = []; porLinea.set(y, arr); }
      arr.push({ x: it.transform[4], w: it.width ?? 0, s: it.str });
    }

    const ys = Array.from(porLinea.keys()).sort((a, b) => b - a);
    for (const y of ys) {
      const items = porLinea.get(y)!.sort((a, b) => a.x - b.x);
      let linea = "";
      let prevEnd: number | null = null;
      for (const it of items) {
        if (prevEnd !== null) {
          const gap = it.x - prevEnd;
          const charW = it.s.length && it.w ? it.w / it.s.length : 6;
          if (gap > charW * 0.6) linea += " ".repeat(Math.min(40, Math.round(gap / charW)));
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

function AreaArchivo({
  label,
  icon,
  texto,
  onTexto,
  placeholder,
  cargando,
}: {
  label: string;
  icon: React.ReactNode;
  texto: string;
  onTexto: (t: string) => void;
  placeholder: string;
  cargando: boolean;
}) {
  const [leyendo, setLeyendo] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLeyendo(true);
    try {
      const esPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const contenido = esPdf ? await extraerTextoPdf(file) : await file.text();
      if (contenido.trim()) onTexto(contenido);
    } catch {
      // ignorar errores de lectura — el usuario verá el textarea vacío
    } finally {
      setLeyendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-lo">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-lo">{label}</span>
      </div>
      <textarea
        value={texto}
        onChange={(e) => onTexto(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-mark bg-input px-3 py-2 font-mono text-xs text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
      />
      <label className="self-start inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-mark bg-input px-3 py-1.5 text-xs font-medium text-mid transition-colors hover:border-line hover:text-hi">
        {leyendo ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
        {leyendo ? "Leyendo…" : "Subir archivo"}
        <input type="file" accept={TIPOS} onChange={handleFile} disabled={cargando || leyendo} className="hidden" />
      </label>
    </div>
  );
}

export function ImportadorCancion({
  onImport,
  nombre: nombreProp = "",
  artista: artistaProp = "",
}: {
  onImport: (r: CancionImportada) => void;
  nombre?: string;
  artista?: string;
}) {
  const [textoLetra, setTextoLetra]   = useState("");
  const [textoCharts, setTextoCharts] = useState("");
  const [cargando, setCargando]       = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [aviso, setAviso]             = useState<string | null>(null);
  const [nombreAI, setNombreAI]       = useState(nombreProp);
  const [artistaAI, setArtistaAI]     = useState(artistaProp);

  async function handleInterpretar() {
    if (!nombreAI.trim() || !artistaAI.trim()) {
      setError("Completá el nombre y artista para que la IA pueda interpretar correctamente.");
      return;
    }
    setError(null);
    setAviso(null);
    setCargando(true);
    try {
      const res = await fetch("/api/ai/interpretar-cancion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:      nombreAI.trim(),
          artista:     artistaAI.trim(),
          textoLetra,
          textoCharts,
        }),
      });
      const data = await res.json() as { letra?: string; charts?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Error al procesar con IA.");
        return;
      }
      const letraFinal  = data.letra?.trim()  || textoLetra.trim();
      const chartsFinal = data.charts?.trim() || textoCharts.trim();
      onImport({ letra: letraFinal, charts: chartsFinal });
      if (letraFinal)  setTextoLetra("");
      if (chartsFinal) setTextoCharts("");
      const useFallback = (!data.letra?.trim() && !!textoLetra.trim())
                       || (!data.charts?.trim() && !!textoCharts.trim());
      const partes = [letraFinal ? "letra" : null, chartsFinal ? "acordes" : null]
        .filter(Boolean).join(" y ");
      setAviso(
        !partes
          ? "La IA no encontró datos. Escribí directamente en los campos de abajo."
          : useFallback
          ? `Cargué ${partes} sin formatear (la IA no reconoció la canción). Revisá los marcadores de sección.`
          : `Listo: cargué ${partes} abajo. Revisalo y editá lo que haga falta.`
      );
    } catch {
      setError("No pude conectar con la IA. Revisá tu conexión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <details className="group overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-500/[0.04]">
      <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-violet-500" />
          <div>
            <p className="text-sm font-semibold text-hi">Importar con IA</p>
            <p className="text-[11px] text-lo">Subí uno o dos archivos y la IA genera letra y acordes limpios.</p>
          </div>
        </div>
        <ChevronDown size={15} className="shrink-0 text-lo transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="space-y-4 border-t border-violet-500/20 px-4 py-4">

        {/* Nombre + Artista */}
        <div className="flex gap-2">
          <input
            value={nombreAI}
            onChange={(e) => setNombreAI(e.target.value)}
            placeholder="Nombre de la canción *"
            className="min-w-0 flex-1 rounded-xl border border-mark bg-input px-3 py-2 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
          />
          <input
            value={artistaAI}
            onChange={(e) => setArtistaAI(e.target.value)}
            placeholder="Artista *"
            className="w-32 shrink-0 rounded-xl border border-mark bg-input px-3 py-2 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
          />
        </div>

        {/* Área letra */}
        <AreaArchivo
          label="Letra"
          icon={<FileText size={11} />}
          texto={textoLetra}
          onTexto={setTextoLetra}
          placeholder="Pegá la letra o subí el PDF. Si la canción es conocida, la IA la buscará en fuentes externas."
          cargando={cargando}
        />

        {/* Divisor */}
        <div className="border-t border-violet-500/15" />

        {/* Área acordes */}
        <AreaArchivo
          label="Acordes / Charts"
          icon={<Music size={11} />}
          texto={textoCharts}
          onTexto={setTextoCharts}
          placeholder="Pegá los acordes o subí el PDF. Si no tenés acordes, podés dejar este campo vacío."
          cargando={cargando}
        />

        {/* Botones de acción */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleInterpretar}
            disabled={!nombreAI.trim() || !artistaAI.trim() || cargando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {cargando ? "Interpretando…" : "Interpretar con IA"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!textoLetra.trim() && !textoCharts.trim()) return;
              onImport({ letra: textoLetra.trim(), charts: textoCharts.trim() });
              setAviso("Texto copiado a los campos de abajo. Editá y agregá secciones [Coro], [Verso], etc.");
              setTextoLetra("");
              setTextoCharts("");
            }}
            disabled={(!textoLetra.trim() && !textoCharts.trim()) || cargando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 px-4 py-2 text-xs font-medium text-violet-600 transition-colors hover:border-violet-500/60 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Usar directamente (sin IA)
          </button>
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
