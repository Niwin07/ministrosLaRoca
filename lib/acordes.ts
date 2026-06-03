// Detección compartida de acordes (real y Nashville) y de líneas de chart.
// La usan el importador (lib/importar-cancion) y el visor (ChartViewer).

export const ACORDE_RE =
  /^[A-G][#b]?(?:maj7|maj9|maj|min7|min|m7|m9|m6|m|sus2|sus4|sus|dim7|dim|aug|add9|add11|add\d|6|7|9|11|13|2|4|5|°|\+)*(?:\/[A-G][#b]?)?$/;

export const NASHVILLE_RE =
  /^[b#]?[1-7](?:maj7|maj|min|m|sus2|sus4|sus|dim|aug|add\d|6|7|9|11|13|2|4|5|°|\+)*(?:\/[b#]?[1-7][^\s]*)?$/;

const NEUTRO_RE = /^(?:\|+|\/+|\(.*\)|x\d+|\d+x|:|\.|-)$/i;

export function esChord(tok: string): boolean {
  return ACORDE_RE.test(tok) || NASHVILLE_RE.test(tok);
}

export function esLineaAcordes(linea: string): boolean {
  const tokens = linea.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  let acordes = 0;
  let relevantes = 0;
  for (const tk of tokens) {
    if (tk === "|" || NEUTRO_RE.test(tk)) continue;
    relevantes++;
    if (esChord(tk)) acordes++;
  }
  if (relevantes === 0) return true; // solo barras/slashes → compases
  return acordes / relevantes >= 0.7;
}

export function esSeccion(linea: string): boolean {
  return /^\[[^\]]+\]/.test(linea.trim());
}

/** ¿El chart usa notación Nashville (grados 1–7) en vez de acordes reales? */
export function pareceNashville(charts: string): boolean {
  return charts
    .split(/\s+/)
    .some((t) => NASHVILLE_RE.test(t) && /^[b#]?[1-7]/.test(t) && !ACORDE_RE.test(t));
}
