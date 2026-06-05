// ============================================================================
// Genera scripts/canciones-esp.sql a partir de la misma DATA del seed, con el
// escaping correcto, para correr DIRECTO contra Aiven (producción) cuando
// .env.local apunta a otra base (local).
//
// Uso:  npx tsx scripts/generate-insert-esp.ts
// ============================================================================

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DATA } from "./canciones-esp-data";

// MySQL: comillas simples se escapan duplicándolas. Saltos de línea quedan
// literales (los acepta dentro de un string). Sin backslashes en la data.
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const filas = DATA.map(
  (c) =>
    `  (${q(c.nombre)}, ${q(c.artista)}, ${q(c.metrica)}, ${q(c.estado_aprobacion)}, ${q(c.letra)}, ${q(c.charts)})`,
).join(",\n");

const sql = `-- 7 canciones (español) — repertorio La Roca. Estado PENDIENTE (van a Moderación).
-- Correr una sola vez contra Aiven. Re-correr duplica.
SET NAMES utf8mb4;

INSERT INTO canciones (nombre, artista, metrica, estado_aprobacion, letra, charts) VALUES
${filas};
`;

const out = resolve(process.cwd(), "scripts/canciones-esp.sql");
writeFileSync(out, sql, "utf8");
console.log(`SQL generado en ${out} (${DATA.length} canciones).`);
