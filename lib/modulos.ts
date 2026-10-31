// Helpers compartidos por los módulos nuevos del rediseño "Zarza".

/** Quién puede editar el contenido compartido (calentamiento, protocolo, videos, turnos de sonido). */
export function puedeEditarContenido(rol?: string | null): boolean {
  return rol === "ADMINISTRADOR" || rol === "LIDER";
}

/** true si el error de MySQL es "la tabla no existe" (migración 009 sin correr). */
export function esTablaFaltante(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "ER_NO_SUCH_TABLE" || err?.cause?.code === "ER_NO_SUCH_TABLE";
}

/** La consulta usa una columna que todavía no existe (falta una migración). */
export function esColumnaFaltante(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "ER_BAD_FIELD_ERROR" || err?.cause?.code === "ER_BAD_FIELD_ERROR";
}

/**
 * Ejecuta una consulta de un módulo nuevo. Si las tablas todavía no existen
 * (falta correr `npm run db:migrate`), devuelve `fallback` y marca
 * `faltaMigracion` en vez de romper la página.
 */
export async function consultaModulo<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<{ datos: T; faltaMigracion: boolean }> {
  try {
    return { datos: await fn(), faltaMigracion: false };
  } catch (e) {
    if (esTablaFaltante(e)) return { datos: fallback, faltaMigracion: true };
    throw e;
  }
}

// ─── Semanas (turnos de sonido) ──────────────────────────────────────────────

/** Lunes (YYYY-MM-DD) de la semana de `fecha`, en hora de Argentina. */
export function lunesDe(fecha: Date): string {
  // Normaliza a la fecha calendario de Argentina (UTC-3, sin horario de verano).
  const local = new Date(fecha.getTime() - 3 * 60 * 60 * 1000);
  const dia = local.getUTCDay(); // 0 = domingo
  const delta = dia === 0 ? -6 : 1 - dia;
  local.setUTCDate(local.getUTCDate() + delta);
  return local.toISOString().slice(0, 10);
}

export function sumarSemanas(lunes: string, n: number): string {
  const d = new Date(`${lunes}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7 * n);
  return d.toISOString().slice(0, 10);
}

export function etiquetaSemana(i: number): string {
  if (i === 0) return "Esta semana";
  if (i === 1) return "Próxima semana";
  return `En ${i} semanas`;
}

/** Paleta de colores de las categorías de "Quiero mejorar" (fondo de tarjeta). */
export const COLORES_CATEGORIA: Record<string, { fondo: string; borde: string }> = {
  llama:   { fondo: "#fde7df", borde: "#b85a44" },
  ambar:   { fondo: "#fdf3e2", borde: "#d9883e" },
  vino:    { fondo: "#f8e9e1", borde: "#94402a" },
  brasa:   { fondo: "#fde9e1", borde: "#cc6a3e" },
  oro:     { fondo: "#fbf0cf", borde: "#c99a48" },
  tierra:  { fondo: "#fbede6", borde: "#a86c4f" },
  arcilla: { fondo: "#f6d2c0", borde: "#b8795a" },
};

export const ICONOS_CATEGORIA = [
  "voz", "guitarra", "bajo", "bateria", "teclado", "consola", "comunicacion", "mejorar",
] as const;
