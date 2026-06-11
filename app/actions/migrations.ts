"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import mysql from "mysql2/promise";

const SQL_008 = `
ALTER TABLE canciones ADD COLUMN link_referencia VARCHAR(500) NULL;

ALTER TABLE lista_canciones
  ADD COLUMN agregado_en         TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN nota_actualizada_en TIMESTAMP NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS lista_comentarios (
  id_comentario    INT AUTO_INCREMENT PRIMARY KEY,
  id_lista_cancion INT NOT NULL,
  id_usuario       INT NOT NULL,
  texto            VARCHAR(500) NOT NULL,
  creado_en        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comentario_lista_cancion FOREIGN KEY (id_lista_cancion)
    REFERENCES lista_canciones(id_lista_cancion) ON DELETE CASCADE,
  CONSTRAINT fk_comentario_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_comentario_lista_cancion (id_lista_cancion)
);

CREATE TABLE IF NOT EXISTS playlist_visitas (
  id_usuario    INT NOT NULL,
  id_playlist   INT NOT NULL,
  ultima_visita TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_playlist),
  CONSTRAINT fk_visita_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_visita_playlist FOREIGN KEY (id_playlist)
    REFERENCES playlists(id_playlist) ON DELETE CASCADE
);
`;

const SQL_009 = `
ALTER TABLE notificaciones
  MODIFY COLUMN tipo ENUM(
    'TURNO_ASIGNADO',
    'TURNO_PROXIMO',
    'LISTA_PUBLICADA',
    'LISTA_RETIRADA',
    'CANCION_AGREGADA',
    'CANCION_QUITADA',
    'TONO_CAMBIADO',
    'COMENTARIO',
    'CANCION_APROBADA',
    'CANCION_RECHAZADA',
    'MENCION'
  ) NOT NULL;
`;

export async function correrMigraciones() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMINISTRADOR") {
    throw new Error("No autorizado");
  }

  const ssl =
    process.env.DB_SSL === "true" || process.env.DB_SSL === "require"
      ? { rejectUnauthorized: false }
      : undefined;

  const conn = await mysql.createConnection({
    host:               process.env.DB_HOST     ?? "localhost",
    port:               Number(process.env.DB_PORT ?? 3306),
    user:               process.env.DB_USER     ?? "root",
    password:           process.env.DB_PASSWORD || undefined,
    database:           process.env.DB_NAME     ?? "ministros",
    ssl,
    multipleStatements: true,
  });

  const lines: string[] = [];
  try {
    for (const [name, sql] of [["008", SQL_008], ["009", SQL_009]] as const) {
      try {
        await conn.query(sql);
        lines.push(`OK: ${name}`);
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "ER_DUP_FIELDNAME" || code === "ER_DUP_KEYNAME") {
          lines.push(`YA APLICADA: ${name}`);
        } else {
          throw err;
        }
      }
    }
  } finally {
    await conn.end();
  }

  redirect(`/admin/run-migration?resultado=${encodeURIComponent(lines.join("\n"))}`);
}
