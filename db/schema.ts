import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  datetime,
  timestamp,
  text,
  tinyint,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ─── Plataformas ─────────────────────────────────────────────────────────────

export const plataformas = mysqlTable("plataformas", {
  id_plataforma: int("id_plataforma").autoincrement().primaryKey(),
  nombre:        varchar("nombre", { length: 100 }).notNull(),
  slug:          varchar("slug",   { length: 50  }).notNull().unique(),
});

// ─── Usuarios ────────────────────────────────────────────────────────────────

export const usuarios = mysqlTable("usuarios", {
  id_usuario:     int("id_usuario").autoincrement().primaryKey(),
  nombre:         varchar("nombre", { length: 100 }).notNull(),
  email:          varchar("email", { length: 255 }).notNull().unique(),
  password_hash:  varchar("password_hash", { length: 255 }).notNull(),
  rol:            mysqlEnum("rol", ["ADMINISTRADOR", "LIDER", "MINISTRO"]).notNull(),
  // Foto de perfil como data URL (base64). Se guarda redimensionada/comprimida
  // desde el cliente, así no hace falta storage externo (apto serverless).
  foto:           text("foto"),
});

// ─── Usuario ↔ Plataforma (join) ─────────────────────────────────────────────

export const usuario_plataforma = mysqlTable(
  "usuario_plataforma",
  {
    id_usuario:    int("id_usuario").notNull().references(() => usuarios.id_usuario),
    id_plataforma: int("id_plataforma").notNull().references(() => plataformas.id_plataforma),
    es_principal:  tinyint("es_principal").notNull().default(1),
  },
  (table) => ({
    pk: uniqueIndex("pk_usuario_plataforma").on(table.id_usuario, table.id_plataforma),
  }),
);

// ─── Cronograma (Cola de rotación) ───────────────────────────────────────────

// Garantía a nivel de base de datos de "como máximo un turno ACTIVO":
// la columna virtual `activo_unico` vale 1 cuando el turno está ACTIVO y NULL
// en cualquier otro caso. Como MySQL permite múltiples NULL dentro de un índice
// UNIQUE, el índice `uq_un_solo_activo` solo puede contener un único valor 1,
// forzando que jamás coexistan dos turnos en estado 'ACTIVO' (ni por concurrencia
// ni por ediciones manuales).
export const cronograma = mysqlTable(
  "cronograma",
  {
    id_turno:      int("id_turno").autoincrement().primaryKey(),
    id_usuario:    int("id_usuario").notNull().references(() => usuarios.id_usuario),
    id_plataforma: int("id_plataforma").notNull().references(() => plataformas.id_plataforma),
    estado_turno:  mysqlEnum("estado_turno", ["EN_ESPERA", "ACTIVO", "COMPLETADO"]).notNull().default("EN_ESPERA"),
    orden:         int("orden").notNull().default(0),
    // Virtual: id_plataforma cuando ACTIVO, NULL otherwise.
    // El UNIQUE sobre esta columna garantiza un solo ACTIVO por plataforma.
    activo_unico:  int("activo_unico").generatedAlwaysAs(
      sql`(case when \`estado_turno\` = 'ACTIVO' then \`id_plataforma\` else null end)`,
      { mode: "virtual" },
    ),
  },
  (table) => ({
    // Índice único sobre la columna virtual = a lo sumo un ACTIVO en toda la tabla.
    uq_un_solo_activo: uniqueIndex("uq_un_solo_activo").on(table.activo_unico),
  }),
);

// ─── Canciones ───────────────────────────────────────────────────────────────

export const canciones = mysqlTable("canciones", {
  id_cancion:              int("id_cancion").autoincrement().primaryKey(),
  nombre:                  varchar("nombre", { length: 255 }).notNull(),
  artista:                 varchar("artista", { length: 255 }).notNull(),
  bpm:                     int("bpm"),
  metrica:                 varchar("metrica", { length: 10 }),
  estado_aprobacion:       mysqlEnum("estado_aprobacion", ["APROBADA", "PENDIENTE", "RECHAZADA"]).notNull().default("PENDIENTE"),
  motivo_rechazo:          text("motivo_rechazo"),
  letra:                   text("letra"),
  charts:                  text("charts"),
  // URL de referencia (YouTube/Spotify) para ensayar con la versión correcta.
  link_referencia:         varchar("link_referencia", { length: 500 }),
  id_usuario_sugeridor:    int("id_usuario_sugeridor").references(() => usuarios.id_usuario, { onDelete: "set null" }),
});

// ─── Playlists ───────────────────────────────────────────────────────────────

export const playlists = mysqlTable("playlists", {
  id_playlist:        int("id_playlist").autoincrement().primaryKey(),
  id_usuario:         int("id_usuario").notNull().references(() => usuarios.id_usuario),
  id_plataforma:      int("id_plataforma").notNull().references(() => plataformas.id_plataforma),
  nombre:             varchar("nombre", { length: 255 }).notNull(),
  tipo:               mysqlEnum("tipo", ["PRESET", "EVENTO"]).notNull(),
  estado:             mysqlEnum("estado", ["PREPARACION", "ENSAYO", "DEFINITIVA", "MAZO"]),
  fecha_programada:   datetime("fecha_programada"),
  actualizadoEn:      timestamp("actualizado_en").defaultNow().onUpdateNow(),
});

// ─── Notificaciones personales ───────────────────────────────────────────────

export const notificaciones = mysqlTable("notificaciones", {
  id_notificacion: int("id_notificacion").autoincrement().primaryKey(),
  id_usuario:      int("id_usuario").notNull().references(() => usuarios.id_usuario, { onDelete: "cascade" }),
  tipo:            mysqlEnum("tipo", ["TURNO_ASIGNADO", "TURNO_PROXIMO", "LISTA_PUBLICADA", "LISTA_RETIRADA", "CANCION_AGREGADA", "CANCION_QUITADA", "TONO_CAMBIADO", "COMENTARIO", "CANCION_APROBADA", "CANCION_RECHAZADA", "MENCION"]).notNull(),
  titulo:          varchar("titulo", { length: 255 }).notNull(),
  cuerpo:          text("cuerpo").notNull(),
  leida:           tinyint("leida").notNull().default(0),
  creadaEn:        timestamp("creada_en").defaultNow(),
});

// ─── Suscripciones Web Push ───────────────────────────────────────────────────

export const push_suscripciones = mysqlTable("push_suscripciones", {
  id_suscripcion: int("id_suscripcion").autoincrement().primaryKey(),
  id_usuario:     int("id_usuario").notNull().references(() => usuarios.id_usuario, { onDelete: "cascade" }),
  endpoint:       text("endpoint").notNull(),
  p256dh:         text("p256dh").notNull(),
  auth_key:       varchar("auth_key", { length: 255 }).notNull(),
  creadaEn:       timestamp("creada_en").defaultNow(),
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
    // Timestamps para el indicador "qué cambió desde tu última visita".
    // Se setean SIEMPRE explícitamente desde las actions (nunca ON UPDATE
    // automático: reordenarLista actualiza todas las filas y las marcaría
    // como modificadas). NULL = fila anterior a la feature, sin badge.
    agregadoEn:          timestamp("agregado_en"),
    notaActualizadaEn:   timestamp("nota_actualizada_en"),
  },
  (table) => ({
    uq_playlist_orden: uniqueIndex("uq_playlist_orden").on(table.id_playlist, table.orden),
    idx_playlist:      index("idx_playlist").on(table.id_playlist),
  }),
);

// ─── Comentarios por canción dentro de una lista ─────────────────────────────
// Acuerdos del ensayo ("la arrancamos a capela", "bajarla medio tono") que hoy
// se pierden en WhatsApp. CASCADE hacia lista_canciones cubre tanto quitar la
// canción como borrar la playlist (que borra sus lista_canciones).

export const lista_comentarios = mysqlTable(
  "lista_comentarios",
  {
    id_comentario:    int("id_comentario").autoincrement().primaryKey(),
    id_lista_cancion: int("id_lista_cancion").notNull().references(() => lista_canciones.id_lista_cancion, { onDelete: "cascade" }),
    id_usuario:       int("id_usuario").notNull().references(() => usuarios.id_usuario, { onDelete: "cascade" }),
    texto:            varchar("texto", { length: 500 }).notNull(),
    creadoEn:         timestamp("creado_en").defaultNow(),
  },
  (table) => ({
    idx_lista_cancion: index("idx_comentario_lista_cancion").on(table.id_lista_cancion),
  }),
);

// ─── Última visita de cada usuario a cada lista ──────────────────────────────
// Permite calcular los badges "Nuevo"/"Tono cambiado" comparando los
// timestamps de lista_canciones contra la visita anterior del usuario.

export const playlist_visitas = mysqlTable(
  "playlist_visitas",
  {
    id_usuario:    int("id_usuario").notNull().references(() => usuarios.id_usuario, { onDelete: "cascade" }),
    id_playlist:   int("id_playlist").notNull().references(() => playlists.id_playlist, { onDelete: "cascade" }),
    ultima_visita: timestamp("ultima_visita").defaultNow().notNull(),
  },
  (table) => ({
    pk: uniqueIndex("pk_playlist_visitas").on(table.id_usuario, table.id_playlist),
  }),
);
