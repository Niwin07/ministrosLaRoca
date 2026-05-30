import bcrypt from "bcryptjs";
import { db } from "../db/index";
import { usuarios } from "../db/schema";

async function seed() {
  console.log("Iniciando seed de usuarios...");

  const hash = await bcrypt.hash("123456", 10);

  await db.delete(usuarios);
  console.log("Tabla de usuarios limpiada.");

  await db.insert(usuarios).values([
    {
      nombre:        "Admin Iglesia",
      email:         "admin@iglesia.com",
      password_hash: hash,
      rol:           "ADMINISTRADOR",
    },
    {
      nombre:        "Lider Alabanza",
      email:         "lider@iglesia.com",
      password_hash: hash,
      rol:           "LIDER",
    },
    {
      nombre:        "Juan Ministro",
      email:         "ministro@iglesia.com",
      password_hash: hash,
      rol:           "MINISTRO",
    },
  ]);

  console.log("3 usuarios insertados:");
  console.log("  admin@iglesia.com    -> ADMINISTRADOR  / 123456");
  console.log("  lider@iglesia.com    -> LIDER          / 123456");
  console.log("  ministro@iglesia.com -> MINISTRO       / 123456");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
