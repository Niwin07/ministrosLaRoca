// Interpreta un bloque de texto (pegado o de un archivo) y lo lleva al formato
// de la app (secciones [..], líneas sueltas). Reconoce los charts de alabanza
// típicos (Elevation, etc.): acordes reales o Nashville, ChordPro inline, y
// limpia la cabecera/pie de los PDF (© , CCLI, autores, traductores, URL).
// Es best-effort: el líder corrige con el preview.

import { esChord, esLineaAcordes } from "@/lib/acordes";

export interface CancionImportada {
  letra:  string;
  charts: string;
}

// "auto" separa letra y acordes; "letra"/"charts" mandan todo a un solo campo
// (para cuando se sube un archivo dedicado de LETRAS o de ACORDES).
export type ModoImport = "auto" | "letra" | "charts";

// Sufijo de repetición de una sección: (2x), (x3), (2 veces)…
const REPEAT_RE = /\s*\((?:x\s*\d+|\d+\s*x|\d+\s*veces?)\)\s*$/i;

const KEYWORDS = [
  "intro", "outro", "ending", "final", "verso", "verse", "estrofa",
  "precoro", "prechorus", "coro", "chorus", "puente", "bridge",
  "interludio", "interlude", "instrumental", "solo", "tag", "vamp",
  "refran", "coda", "gancho", "hook",
].map((k) => k.replace(/[\s-]/g, ""));

function esPalabraSeccion(s: string): boolean {
  const limpio = s.toLowerCase().replace(/[\s-]/g, "").replace(/\d+$/, "");
  return KEYWORDS.includes(limpio);
}

/** Líneas de metadata/legales que no son ni letra ni acordes. */
function esRuido(linea: string): boolean {
  const t = linea.trim();
  if (!t) return false;
  if (/©|todos los derechos|all rights reserved/i.test(t)) return true;
  if (/\bccli\b/i.test(t)) return true;
  if (/^(?:translators?|traductor(?:es|a)?)\b/i.test(t)) return true;
  if (/\b[a-z0-9-]+\.(?:com|org|net)\b/i.test(t)) return true;
  return false;
}

/** Si la línea es una etiqueta de sección, la devuelve normalizada como [Texto]. */
function normalizarSeccion(linea: string): string | null {
  const t0 = linea.trim();
  if (!t0) return null;

  // Separar sufijo de repetición: "CORO 1 (2x)" → base "CORO 1" + " (2x)".
  const rep = t0.match(REPEAT_RE);
  const repTxt = rep ? " " + rep[0].trim() : "";
  const t = rep ? t0.slice(0, rep.index).trim() : t0;

  // [Algo] — un único par de corchetes, sin otros dentro y que no sea acorde.
  if (t.startsWith("[") && t.endsWith("]")) {
    const inner = t.slice(1, -1).trim();
    if (!inner.includes("[") && !inner.includes("]") && !esChord(inner)) {
      return `[${inner}]${repTxt}`;
    }
  }

  // ChordPro: {soc}, {start_of_chorus}, {c:Texto}…
  const dir = t.match(/^\{([^}]*)\}$/);
  if (dir) {
    const d = dir[1].toLowerCase();
    if (d.startsWith("soc") || d.includes("start_of_chorus")) return "[Coro]";
    if (d.startsWith("sov") || d.includes("start_of_verse"))  return "[Verso]";
    if (d.startsWith("sob") || d.includes("start_of_bridge")) return "[Puente]";
    const c = dir[1].match(/^(?:c|comment|ci)\s*:\s*(.+)$/i);
    if (c) return `[${c[1].trim()}]`;
    return null;
  }

  // "Coro:", "Verse 1", "Pre-Coro" — línea corta cuyo núcleo es palabra de sección.
  const sin = t.replace(/\s*:\s*$/, "");
  if (sin.length <= 24 && /^[A-Za-zÁÉÍÓÚáéíóúñ0-9\s-]+$/.test(sin)) {
    const nucleo = sin.replace(/\s*\d+\s*$/, "").trim();
    if (esPalabraSeccion(nucleo)) return `[${sin.trim()}]${repTxt}`;
  }
  return null;
}

/** Quita ruido (legales) y la cabecera previa a la primera sección. */
function limpiar(lineasRaw: string[]): string[] {
  const arr = lineasRaw.filter((l) => !esRuido(l));
  const idx = arr.findIndex((l) => normalizarSeccion(l) !== null);
  const cuerpo = idx > 0 ? arr.slice(idx) : arr;
  while (cuerpo.length && !cuerpo[0].trim()) cuerpo.shift();
  while (cuerpo.length && !cuerpo[cuerpo.length - 1].trim()) cuerpo.pop();
  return cuerpo;
}

/** ChordPro inline: [G]Sublime [C]gracia. */
function tieneChordProInline(linea: string): boolean {
  if (!/\[([A-G][#b]?[^\]]*)\]/.test(linea)) return false;
  return linea.replace(/\[[^\]]*\]/g, "").trim().length > 0;
}

function separarChordPro(linea: string): { letra: string; charts: string } {
  const acordes: string[] = [];
  const letra = linea
    .replace(/\[([^\]]*)\]/g, (_, c: string) => {
      if (c.trim()) acordes.push(c.trim());
      return "";
    })
    .replace(/\s{2,}/g, " ")
    .trim();
  return { letra, charts: acordes.join("  ") };
}

const colapsar = (arr: string[]) => arr.join("\n").replace(/\n{3,}/g, "\n\n").trim();

export function interpretarCancion(texto: string, modo: ModoImport = "auto"): CancionImportada {
  const lineas = limpiar(texto.replace(/\r\n?/g, "\n").split("\n"));

  // Archivo dedicado: todo va a un campo, solo normalizando secciones.
  if (modo !== "auto") {
    const contenido = colapsar(lineas.map((l) => normalizarSeccion(l) ?? l.replace(/\s+$/, "")));
    return modo === "letra"
      ? { letra: contenido, charts: "" }
      : { letra: "", charts: contenido };
  }

  // Auto: separar acordes de letra.
  const letraOut:  string[] = [];
  const chartsOut: string[] = [];
  let huboLetra = false;
  let huboAcordes = false;

  for (const raw of lineas) {
    const linea = raw.replace(/\s+$/, "");

    if (!linea.trim()) {
      letraOut.push("");
      chartsOut.push("");
      continue;
    }

    const sec = normalizarSeccion(linea);
    if (sec) {
      letraOut.push(sec);
      chartsOut.push(sec);
      continue;
    }

    if (/^\{[^}]*\}$/.test(linea.trim())) continue; // {eoc}, {eov}…

    if (tieneChordProInline(linea)) {
      const { letra, charts } = separarChordPro(linea);
      if (letra)  { letraOut.push(letra);   huboLetra = true; }
      if (charts) { chartsOut.push(charts); huboAcordes = true; }
      continue;
    }

    if (esLineaAcordes(linea)) {
      chartsOut.push(linea.trim());
      huboAcordes = true;
      continue;
    }

    letraOut.push(linea.trim());
    huboLetra = true;
  }

  return {
    letra:  huboLetra   ? colapsar(letraOut)  : "",
    charts: huboAcordes ? colapsar(chartsOut) : "",
  };
}
