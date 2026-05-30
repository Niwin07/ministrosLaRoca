import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  datetime,
  timestamp,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// ─── Usuarios ────────────────────────────────────────────────────────────────

export const usuarios = mysqlTable("usuarios", {
  id_usuario:     int("id_usuario").autoincrement().primaryKey(),
  nombre:         varchar("nombre", { length: 100 }).notNull(),
  email:          varchar("email", { length: 255 }).notNull().unique(),
  password_hash:  varchar("password_hash", { length: 255 }).notNull(),
  rol:            mysqlEnum("rol", ["ADMINISTRADOR", "LIDER", "MINISTRO"]).notNull(),
});

// ─── Cronograma (Cola de rotación) ───────────────────────────────────────────

export const cronograma = mysqlTable("cronograma", {
  id_turno:     int("id_turno").autoincrement().primaryKey(),
  id_usuario:   int("id_usuario").notNull().references(() => usuarios.id_usuario),
  estado_turno: mysqlEnum("estado_turno", ["EN_ESPERA", "ACTIVO", "COMPLETADO"]).notNull().default("EN_ESPERA"),
});

// ─── Canciones ───────────────────────────────────────────────────────────────

export const canciones = mysqlTable("canciones", {
  id_cancion:         int("id_cancion").autoincrement().primaryKey(),
  nombre:             varchar("nombre", { length: 255 }).notNull(),
  artista:            varchar("artista", { length: 255 }).notNull(),
  bpm:                int("bpm"),
  metrica:            varchar("metrica", { length: 10 }),
  estado_aprobacion:  mysqlEnum("estado_aprobacion", ["APROBADA", "PENDIENTE", "RECHAZADA"]).notNull().default("PENDIENTE"),
  motivo_rechazo:     text("motivo_rechazo"),
  letra:              text("letra"),
  charts:             text("charts"),
});

// ─── Playlists ───────────────────────────────────────────────────────────────

export const playlists = mysqlTable("playlists", {
  id_playlist:        int("id_playlist").autoincrement().primaryKey(),
  id_usuario:         int("id_usuario").notNull().references(() => usuarios.id_usuario),
  nombre:             varchar("nombre", { length: 255 }).notNull(),
  tipo:               mysqlEnum("tipo", ["PRESET", "EVENTO"]).notNull(),
  estado:             mysqlEnum("estado", ["PREPARACION", "ENSAYO", "DEFINITIVA", "MAZO"]),
  fecha_programada:   datetime("fecha_programada"),
  actualizadoEn:      timestamp("actualizado_en").defaultNow().onUpdateNow(),
});

// ─── Lista Canciones (Detalle / Pivot) ───────────────────────────────────────
// PK autoincremental para permitir que un mismo tema aparezca más de una vez
// en la misma lista (ej: al inicio y al final del evento).
// UNIQUE(id_playlist, orden) garantiza que dos canciones no ocupen el mismo
// puesto dentro de la misma playlist.

export const lista_canciones = mysqlTable(
  "lista_canciones",
  {
    id_lista_cancion: int("id_lista_cancion").autoincrement().primaryKey(),
    id_playlist:      int("id_playlist").notNull().references(() => playlists.id_playlist),
    id_cancion:       int("id_cancion").notNull().references(() => canciones.id_cancion),
    orden:            int("orden").notNull(),
    nota:             varchar("nota", { length: 10 }),
  },
  (table) => ({
    uq_playlist_orden: uniqueIndex("uq_playlist_orden").on(table.id_playlist, table.orden),
    idx_playlist:      index("idx_playlist").on(table.id_playlist),
  }),
);
