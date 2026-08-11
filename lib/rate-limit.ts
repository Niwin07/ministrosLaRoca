// Rate limiter en memoria — best-effort, NO distribuido. Esta app corre como
// funciones serverless de una sola región en Vercel con tráfico bajo (una
// iglesia); un store compartido (Redis, etc.) sería overengineering para el
// problema real, que es frenar loops de fuerza bruta/abuso obvios, no
// garantizar un límite exacto entre instancias. Si el tráfico/escala crecen
// mucho, esto debería migrar a un store compartido.

interface Bucket {
  count:   number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Barrido periódico para no acumular entradas viejas indefinidamente en memoria.
const LIMPIEZA_INTERVALO_MS = 10 * 60 * 1000;
let ultimaLimpieza = Date.now();

function limpiarSiCorresponde(ahora: number): void {
  if (ahora - ultimaLimpieza < LIMPIEZA_INTERVALO_MS) return;
  ultimaLimpieza = ahora;
  for (const [key, b] of buckets) {
    if (b.resetAt <= ahora) buckets.delete(key);
  }
}

/**
 * Ventana fija: permite hasta `max` llamados cada `windowMs` para `key`.
 * Devuelve true si este intento está permitido (y lo cuenta contra el
 * límite); false si `key` ya superó el máximo en la ventana actual.
 */
export function permitir(key: string, max: number, windowMs: number): boolean {
  const ahora = Date.now();
  limpiarSiCorresponde(ahora);

  const actual = buckets.get(key);
  if (!actual || actual.resetAt <= ahora) {
    buckets.set(key, { count: 1, resetAt: ahora + windowMs });
    return true;
  }

  if (actual.count >= max) return false;

  actual.count += 1;
  return true;
}
