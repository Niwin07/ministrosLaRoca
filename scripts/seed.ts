import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { usuarios } from "../db/schema";

// Antes este script hacía `db.delete(usuarios)` sin condición — borraba TODA
// la tabla de usuarios antes de insertar los 3 de demo. DEPLOY.md indica
// correrlo también en producción, así que un re-run borraba usuarios reales.
// Ahora es idempotente: inserta cada usuario solo si su email todavía no
// existe, y nunca borra nada.

const DEMO_USERS = [
  { nombre: "Admin Iglesia",   email: "admin@iglesia.com",    rol: "ADMINISTRADOR" as const },
  { nombre: "Lider Alabanza",  email: "lider@iglesia.com",    rol: "LIDER"         as const },
  { nombre: "Juan Ministro",   email: "ministro@iglesia.com", rol: "MINISTRO"      as const },
];

async function seed() {
  console.log("Iniciando seed de usuarios (idempotente)...");

  const hash = await bcrypt.hash("123456", 10);

  for (const u of DEMO_USERS) {
    const existente = await db
      .select({ id_usuario: usuarios.id_usuario })
      .from(usuarios)
      .where(eq(usuarios.email, u.email))
      .limit(1);

    if (existente.length > 0) {
      console.log(`  ${u.email} -> ya existía, salteado`);
      continue;
    }

    await db.insert(usuarios).values({ ...u, password_hash: hash });
    console.log(`  ${u.email} -> ${u.rol} / 123456 (creado)`);
  }

  console.log("Listo.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
