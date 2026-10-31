// Estilos y tonos del repertorio (diseño "Repertorio" del sistema Zarza).

export const ESTILOS = [
  "Worship",
  "Adoración",
  "Júbilo",
  "Intimidad / Espontáneas",
  "Himnos",
  "Gratitud",
] as const;

export const TONOS_CANCION = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

export function esEstilo(v: unknown): v is (typeof ESTILOS)[number] {
  return typeof v === "string" && (ESTILOS as readonly string[]).includes(v);
}

export function esTonoCancion(v: unknown): v is (typeof TONOS_CANCION)[number] {
  return typeof v === "string" && (TONOS_CANCION as readonly string[]).includes(v);
}

/** Lee la lista de estilos del parámetro `estilo` de la URL (separados por coma). */
export function estilosDeParam(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(esEstilo);
}
