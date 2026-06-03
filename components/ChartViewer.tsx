import type { ReactElement } from "react";
import { esLineaAcordes, esSeccion } from "@/lib/acordes";

interface ChartViewerProps {
  charts: string;
}

type Segmento = { ac: string; tx: string };
type Bloque =
  | { k: "sec"; texto: string }
  | { k: "ac"; texto: string }            // fila solo de acordes (compases / Nashville)
  | { k: "ly"; texto: string }            // letra suelta
  | { k: "par"; segs: Segmento[] };       // acordes sobre la letra (inline)

function tokensConColumna(linea: string): { col: number; v: string }[] {
  const out: { col: number; v: string }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(linea)) !== null) out.push({ col: m.index, v: m[0] });
  return out;
}

/** Combina una línea de acordes con la de letra: cada acorde va sobre su palabra. */
function emparejar(chordLine: string, lyricLine: string): Segmento[] {
  const acordes  = tokensConColumna(chordLine);
  const palabras = tokensConColumna(lyricLine);

  if (palabras.length === 0) {
    return acordes.map((a) => ({ ac: a.v, tx: "" }));
  }

  const porPalabra = new Map<number, string[]>();
  const antes: string[] = [];

  for (const a of acordes) {
    if (a.col < palabras[0].col - 1) {
      antes.push(a.v);
      continue;
    }
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < palabras.length; i++) {
      const d = Math.abs(palabras[i].col - a.col);
      if (d < bestD) { bestD = d; best = i; }
    }
    const lst = porPalabra.get(best) ?? [];
    lst.push(a.v);
    porPalabra.set(best, lst);
  }

  const segs: Segmento[] = [];
  if (antes.length) segs.push({ ac: antes.join(" "), tx: "" });
  palabras.forEach((p, i) => segs.push({ ac: (porPalabra.get(i) ?? []).join(" "), tx: p.v }));
  return segs;
}

function parsear(charts: string): Bloque[] {
  const lineas = charts.replace(/\r\n?/g, "\n").split("\n");
  const out: Bloque[] = [];

  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    if (!l.trim()) { out.push({ k: "ly", texto: "" }); continue; }
    if (esSeccion(l)) { out.push({ k: "sec", texto: l.trim() }); continue; }

    if (esLineaAcordes(l)) {
      const next = lineas[i + 1];
      // Acordes seguidos de una línea de letra → render inline emparejado.
      if (next && next.trim() && !esSeccion(next) && !esLineaAcordes(next)) {
        out.push({ k: "par", segs: emparejar(l, next) });
        i++;
        continue;
      }
      out.push({ k: "ac", texto: l.trim() }); // compases / Nashville sin letra
      continue;
    }

    out.push({ k: "ly", texto: l.trim() });
  }
  return out;
}

export function ChartViewer({ charts }: ChartViewerProps): ReactElement {
  const bloques = parsear(charts);

  return (
    <div className="space-y-1 text-sm">
      {bloques.map((b, i) => {
        if (b.k === "sec") {
          return (
            <div key={i} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-blue-500">
              {b.texto}
            </div>
          );
        }
        if (b.k === "ly") {
          return b.texto
            ? <div key={i} className="leading-7 text-hi">{b.texto}</div>
            : <div key={i} className="h-2" />;
        }
        if (b.k === "ac") {
          return (
            <div key={i} className="overflow-x-auto whitespace-pre font-mono font-semibold text-violet-600 dark:text-violet-400">
              {b.texto}
            </div>
          );
        }
        // par: acordes inline sobre la letra, fluye y se acomoda al ancho
        return (
          <div key={i} className="flex flex-wrap items-end gap-x-1.5 pt-1.5 leading-tight">
            {b.segs.map((s, j) => (
              <span key={j} className="inline-flex flex-col">
                <span className="h-4 font-mono text-xs font-bold leading-none text-violet-600 dark:text-violet-400">
                  {s.ac || " "}
                </span>
                <span className="text-hi">{s.tx || " "}</span>
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
