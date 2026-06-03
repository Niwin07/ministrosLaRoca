// Traducción del sistema Nashville (números) a acordes reales según un tono.
// Los charts usan números 1–7 relativos a la tónica de un tono MAYOR
// (1 = tónica), con sufijos (m, sus, 7…) y bajo con barra (1/5).
// Ej: en tono G → 1=G, 4=C, 5=D, 6m=Em, 1/5=G/D.

const CROMATICA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Semitonos de cada grado de la escala mayor.
const GRADO_SEMITONOS: Record<string, number> = {
  "1": 0, "2": 2, "3": 4, "4": 5, "5": 7, "6": 9, "7": 11,
};

const BASE_NOTA: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Índice cromático (0–11) de un tono. Ignora un sufijo "m" (asume tono mayor). */
function indiceTono(tono: string): number | null {
  const m = tono.trim().match(/^([A-Ga-g])([#b]?)/);
  if (!m) return null;
  let idx = BASE_NOTA[m[1].toUpperCase()];
  if (idx === undefined) return null;
  if (m[2] === "#") idx = (idx + 1) % 12;
  if (m[2] === "b") idx = (idx + 11) % 12;
  return idx;
}

const TOKEN_RE = /^([b#]?)([1-7])([^\/\s]*)(?:\/([b#]?)([1-7])([^\/\s]*))?$/;

function traducirToken(token: string, rootIdx: number): string | null {
  const m = token.match(TOKEN_RE);
  if (!m) return null;

  const parte = (acc: string, grado: string, sufijo: string) => {
    let semi = GRADO_SEMITONOS[grado];
    if (acc === "#") semi += 1;
    if (acc === "b") semi -= 1;
    return CROMATICA[(rootIdx + semi + 12) % 12] + sufijo;
  };

  let out = parte(m[1], m[2], m[3]);
  if (m[5] !== undefined) {
    out += "/" + parte(m[4] ?? "", m[5], m[6] ?? "");
  }
  return out;
}

/**
 * Convierte un chart en notación Nashville a acordes reales para `tono`.
 * Preserva la estructura: líneas de sección ([Coro]), separadores |, espacios
 * y anotaciones (x3) quedan intactos. Si el tono no es válido, devuelve el original.
 */
export function nashvilleAAcordes(charts: string, tono: string): string {
  const rootIdx = indiceTono(tono);
  if (rootIdx === null) return charts;

  return charts
    .split("\n")
    .map((linea) => {
      if (linea.trim().startsWith("[")) return linea; // etiqueta de sección
      return linea.replace(/\S+/g, (tok) => traducirToken(tok, rootIdx) ?? tok);
    })
    .join("\n");
}
