// ============================================================================
// Seed de canciones en español (repertorio La Roca) contra la BD de .env.local.
// La data vive en ./canciones-esp-data.ts (compartida con el generador de SQL).
// Charts en Nashville: BEST-EFFORT — se cargan como PENDIENTE para verificar en
// /admin/canciones (Moderación) antes de aprobar.
//
// Uso:  npm run db:seed-canciones-esp
// ============================================================================

import { db } from "../db/index";
import { canciones } from "../db/schema";
import { DATA } from "./canciones-esp-data";

async function seed() {
  console.log(`\nSeed: ${DATA.length} canciones (español) — estado PENDIENTE\n`);

  for (const cancion of DATA) {
    await db.insert(canciones).values(cancion);
    console.log(`  ✓ ${cancion.nombre}`);
  }

  console.log(`\n${DATA.length} canciones insertadas. Revisá los charts en /admin/canciones (Moderación).\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
