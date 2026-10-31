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
  date,
  primaryKey,
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
    // Las consultas de "notificar a todos los miembros de esta plataforma"
    // (playlists.ts, listas.ts) filtran SOLO por id_plataforma — el índice
    // compuesto de arriba no sirve de mucho ahí porque id_usuario es la
    // primera columna. scripts/sql/008-indices-performance.sql.
    idx_plataforma: index("idx_up_plataforma").on(table.id_plataforma),
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
    // La consulta más común de la app: cola de una plataforma en un estado,
    // ordenada por posición. scripts/sql/008-indices-performance.sql.
    idx_plataforma_estado: index("idx_cronograma_plataforma_estado").on(
      table.id_plataforma, table.estado_turno, table.orden,
    ),
  }),
);

// ─── Canciones ───────────────────────────────────────────────────────────────

export const canciones = mysqlTable(
  "canciones",
  {
    id_cancion:              int("id_cancion").autoincrement().primaryKey(),
    nombre:                  varchar("nombre", { length: 255 }).notNull(),
    artista:                 varchar("artista", { length: 255 }).notNull(),
    bpm:                     int("bpm"),
    metrica:                 varchar("metrica", { length: 10 }),
    estado_aprobacion:       mysqlEnum("estado_aprobacion", ["APROBADA", "PENDIENTE", "RECHAZADA"]).notNull().default("PENDIENTE"),
    motivo_rechazo:          text("motivo_rechazo"),
    letra:                   text("letra"),
    charts:                  text("charts"),
    id_usuario_sugeridor:    int("id_usuario_sugeridor").references(() => usuarios.id_usuario, { onDelete: "set null" }),
  },
  (table) => ({
    // Casi toda consulta del catálogo filtra por este enum de 3 valores.
    // scripts/sql/008-indices-performance.sql.
    idx_estado: index("idx_canciones_estado").on(table.estado_aprobacion),
  }),
);

// ─── Playlists ───────────────────────────────────────────────────────────────

export const playlists = mysqlTable(
  "playlists",
  {
    id_playlist:        int("id_playlist").autoincrement().primaryKey(),
    id_usuario:         int("id_usuario").notNull().references(() => usuarios.id_usuario),
    id_plataforma:      int("id_plataforma").notNull().references(() => plataformas.id_plataforma),
    nombre:             varchar("nombre", { length: 255 }).notNull(),
    tipo:               mysqlEnum("tipo", ["PRESET", "EVENTO"]).notNull(),
    estado:             mysqlEnum("estado", ["PREPARACION", "ENSAYO", "DEFINITIVA", "MAZO"]),
    fecha_programada:   datetime("fecha_programada"),
    actualizadoEn:      timestamp("actualizado_en").defaultNow().onUpdateNow(),
  },
  (table) => ({
    // Cubren las formas más comunes de consulta: "listas de esta plataforma
    // en tal estado" e "mis listas de tal tipo/estado". scripts/sql/008-indices-performance.sql.
    idx_plataforma_tipo_estado: index("idx_playlists_plataforma_tipo_estado").on(
      table.id_plataforma, table.tipo, table.estado,
    ),
    idx_usuario_tipo_estado: index("idx_playlists_usuario_tipo_estado").on(
      table.id_usuario, table.tipo, table.estado,
    ),
  }),
);

// ─── Notificaciones personales ───────────────────────────────────────────────

export const notificaciones = mysqlTable(
  "notificaciones",
  {
    id_notificacion: int("id_notificacion").autoincrement().primaryKey(),
    id_usuario:      int("id_usuario").notNull().references(() => usuarios.id_usuario, { onDelete: "cascade" }),
    tipo:            mysqlEnum("tipo", ["TURNO_ASIGNADO", "TURNO_PROXIMO", "LISTA_PUBLICADA", "LISTA_RETIRADA", "CANCION_AGREGADA", "CANCION_APROBADA", "CANCION_RECHAZADA", "MENCION"]).notNull(),
    titulo:          varchar("titulo", { length: 255 }).notNull(),
    cuerpo:          text("cuerpo").notNull(),
    leida:           tinyint("leida").notNull().default(0),
    creadaEn:        timestamp("creada_en").defaultNow(),
  },
  (table) => ({
    // Ya existe en la BD real desde scripts/sql/006-notificaciones.sql — se
    // declara acá para que schema.ts (fuente de verdad de Drizzle) no quede
    // desincronizado de lo que hay aplicado.
    idx_usuario_leida: index("idx_notif_usuario_leida").on(table.id_usuario, table.leida),
  }),
);

// ─── Suscripciones Web Push ───────────────────────────────────────────────────

export const push_suscripciones = mysqlTable(
  "push_suscripciones",
  {
    id_suscripcion: int("id_suscripcion").autoincrement().primaryKey(),
    id_usuario:     int("id_usuario").notNull().references(() => usuarios.id_usuario, { onDelete: "cascade" }),
    endpoint:       text("endpoint").notNull(),
    p256dh:         text("p256dh").notNull(),
    auth_key:       varchar("auth_key", { length: 255 }).notNull(),
    creadaEn:       timestamp("creada_en").defaultNow(),
  },
  (table) => ({
    // Ídem — ya existe en la BD real desde scripts/sql/006-notificaciones.sql.
    idx_usuario: index("idx_push_usuario").on(table.id_usuario),
  }),
);

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
    // eliminarCancion (uso-check) y admin/estadisticas hacen JOIN/WHERE por
    // id_cancion sin este índice. scripts/sql/008-indices-performance.sql.
    idx_cancion:       index("idx_lista_canciones_cancion").on(table.id_cancion),
  }),
);

// ═══ Módulos del rediseño "Zarza" (scripts/sql/009-modulos-zarza.sql) ═══════

// ─── Calentamiento de voces ──────────────────────────────────────────────────

export const calentamiento_ejercicios = mysqlTable("calentamiento_ejercicios", {
  id_ejercicio: int("id_ejercicio").autoincrement().primaryKey(),
  nombre:       varchar("nombre", { length: 150 }).notNull(),
  descripcion:  text("descripcion"),
  orden:        int("orden").notNull().default(0),
});

export const calentamiento_videos = mysqlTable("calentamiento_videos", {
  id_video:   int("id_video").autoincrement().primaryKey(),
  youtube_id: varchar("youtube_id", { length: 20 }).notNull(),
  titulo:     varchar("titulo", { length: 255 }).notNull(),
  orden:      int("orden").notNull().default(0),
});

// ─── Protocolo de sonido ─────────────────────────────────────────────────────

export const protocolo_pasos = mysqlTable("protocolo_pasos", {
  id_paso:    int("id_paso").autoincrement().primaryKey(),
  titulo:     varchar("titulo", { length: 200 }).notNull(),
  detalle:    text("detalle"),
  youtube_id: varchar("youtube_id", { length: 20 }),
  orden:      int("orden").notNull().default(0),
});

// ─── Quiero mejorar ──────────────────────────────────────────────────────────

export const mejorar_categorias = mysqlTable("mejorar_categorias", {
  id_categoria: int("id_categoria").autoincrement().primaryKey(),
  nombre:       varchar("nombre", { length: 100 }).notNull(),
  icono:        varchar("icono", { length: 30 }).notNull().default("mejorar"),
  color:        varchar("color", { length: 20 }).notNull().default("llama"),
  orden:        int("orden").notNull().default(0),
});

export const mejorar_videos = mysqlTable("mejorar_videos", {
  id_video:     int("id_video").autoincrement().primaryKey(),
  id_categoria: int("id_categoria").notNull().references(() => mejorar_categorias.id_categoria, { onDelete: "cascade" }),
  youtube_id:   varchar("youtube_id", { length: 20 }).notNull(),
  titulo:       varchar("titulo", { length: 255 }).notNull(),
  canal:        varchar("canal", { length: 150 }),
  orden:        int("orden").notNull().default(0),
});

// ─── Turnos de sonido ────────────────────────────────────────────────────────

export const sonidistas = mysqlTable(
  "sonidistas",
  {
    id_usuario:    int("id_usuario").notNull().references(() => usuarios.id_usuario, { onDelete: "cascade" }),
    id_plataforma: int("id_plataforma").notNull().references(() => plataformas.id_plataforma, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id_usuario, table.id_plataforma] }),
  }),
);

export const turnos_sonido = mysqlTable(
  "turnos_sonido",
  {
    id_turno_sonido: int("id_turno_sonido").autoincrement().primaryKey(),
    id_plataforma:   int("id_plataforma").notNull().references(() => plataformas.id_plataforma, { onDelete: "cascade" }),
    // Lunes de la semana del servicio (YYYY-MM-DD).
    semana:          date("semana", { mode: "string" }).notNull(),
    id_principal:    int("id_principal").references(() => usuarios.id_usuario, { onDelete: "set null" }),
    id_auxiliar:     int("id_auxiliar").references(() => usuarios.id_usuario, { onDelete: "set null" }),
  },
  (table) => ({
    uq_semana: uniqueIndex("uq_turno_sonido_semana").on(table.id_plataforma, table.semana),
  }),
);

export const ajustes_plataforma = mysqlTable("ajustes_plataforma", {
  id_plataforma:        int("id_plataforma").primaryKey().references(() => plataformas.id_plataforma, { onDelete: "cascade" }),
  semanas_planificadas: int("semanas_planificadas").notNull().default(6),
});
