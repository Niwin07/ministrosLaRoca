// ============================================================================
// Copias de las migraciones de scripts/sql/ que se pueden aplicar desde la app
// (botón "Preparar base de datos" de los módulos nuevos), sin consola.
// Es aditiva e idempotente: sólo CREATE TABLE IF NOT EXISTS y la carga
// inicial de categorías cuando la tabla está vacía.
// Si cambiás el .sql, actualizá esta copia.
// ============================================================================

export const SQL_MODULOS_ZARZA = `
-- ============================================================================
-- 009 · Módulos nuevos del rediseño "Zarza"
--   · Calentamiento de voces (ejercicios + videos)
--   · Protocolo de sonido (pasos)
--   · Quiero mejorar (categorías + videos)
--   · Turnos de sonido (sonidistas por plataforma + principal/auxiliar por semana)
--   · Ajustes por plataforma (semanas planificadas)
-- Sólo crea tablas nuevas: no modifica ninguna tabla existente.
-- Idempotente: se puede correr más de una vez (npm run db:migrate).
-- ============================================================================

CREATE TABLE IF NOT EXISTS calentamiento_ejercicios (
  id_ejercicio INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  descripcion  TEXT NULL,
  orden        INT NOT NULL DEFAULT 0,
  creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_calent_ej_orden (orden)
);

CREATE TABLE IF NOT EXISTS calentamiento_videos (
  id_video   INT AUTO_INCREMENT PRIMARY KEY,
  youtube_id VARCHAR(20)  NOT NULL,
  titulo     VARCHAR(255) NOT NULL,
  orden      INT NOT NULL DEFAULT 0,
  creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_calent_vid_orden (orden)
);

CREATE TABLE IF NOT EXISTS protocolo_pasos (
  id_paso    INT AUTO_INCREMENT PRIMARY KEY,
  titulo     VARCHAR(200) NOT NULL,
  detalle    TEXT NULL,
  youtube_id VARCHAR(20) NULL,
  orden      INT NOT NULL DEFAULT 0,
  creado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_protocolo_orden (orden)
);

CREATE TABLE IF NOT EXISTS mejorar_categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  icono        VARCHAR(30)  NOT NULL DEFAULT 'mejorar',
  color        VARCHAR(20)  NOT NULL DEFAULT 'llama',
  orden        INT NOT NULL DEFAULT 0,
  creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mejorar_videos (
  id_video     INT AUTO_INCREMENT PRIMARY KEY,
  id_categoria INT NOT NULL,
  youtube_id   VARCHAR(20)  NOT NULL,
  titulo       VARCHAR(255) NOT NULL,
  canal        VARCHAR(150) NULL,
  orden        INT NOT NULL DEFAULT 0,
  creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mejorar_video_cat FOREIGN KEY (id_categoria)
    REFERENCES mejorar_categorias(id_categoria) ON DELETE CASCADE,
  INDEX idx_mejorar_video_cat (id_categoria, orden)
);

-- Personas habilitadas como sonidistas en cada plataforma.
CREATE TABLE IF NOT EXISTS sonidistas (
  id_usuario    INT NOT NULL,
  id_plataforma INT NOT NULL,
  PRIMARY KEY (id_usuario, id_plataforma),
  CONSTRAINT fk_sonidista_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_sonidista_plataforma FOREIGN KEY (id_plataforma)
    REFERENCES plataformas(id_plataforma) ON DELETE CASCADE
);

-- Sonidista principal y auxiliar por semana (semana = lunes de esa semana).
CREATE TABLE IF NOT EXISTS turnos_sonido (
  id_turno_sonido INT AUTO_INCREMENT PRIMARY KEY,
  id_plataforma   INT  NOT NULL,
  semana          DATE NOT NULL,
  id_principal    INT  NULL,
  id_auxiliar     INT  NULL,
  UNIQUE KEY uq_turno_sonido_semana (id_plataforma, semana),
  CONSTRAINT fk_ts_plataforma FOREIGN KEY (id_plataforma)
    REFERENCES plataformas(id_plataforma) ON DELETE CASCADE,
  CONSTRAINT fk_ts_principal FOREIGN KEY (id_principal)
    REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  CONSTRAINT fk_ts_auxiliar FOREIGN KEY (id_auxiliar)
    REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ajustes_plataforma (
  id_plataforma        INT PRIMARY KEY,
  semanas_planificadas INT NOT NULL DEFAULT 6,
  CONSTRAINT fk_ajustes_plataforma FOREIGN KEY (id_plataforma)
    REFERENCES plataformas(id_plataforma) ON DELETE CASCADE
);

-- Categorías iniciales de "Quiero mejorar" (sólo si la tabla está vacía).
INSERT INTO mejorar_categorias (nombre, icono, color, orden)
SELECT * FROM (
  SELECT 'Voces' AS nombre, 'voz' AS icono, 'llama' AS color, 1 AS orden UNION ALL
  SELECT 'Guitarra', 'guitarra', 'ambar', 2 UNION ALL
  SELECT 'Bajo', 'bajo', 'vino', 3 UNION ALL
  SELECT 'Batería', 'bateria', 'brasa', 4 UNION ALL
  SELECT 'Teclado', 'teclado', 'oro', 5 UNION ALL
  SELECT 'Sonido', 'consola', 'tierra', 6 UNION ALL
  SELECT 'Comunicación de equipo', 'comunicacion', 'arcilla', 7
) AS iniciales
WHERE NOT EXISTS (SELECT 1 FROM mejorar_categorias);
`;

// Copia de scripts/sql/010-canciones-estilo-tono.sql (estilo y tono por canción).
export const SQL_CANCIONES_ESTILO = `
-- ============================================================================
-- 010 · Estilo y tono de cada canción del repertorio (diseño "Repertorio").
-- Aditiva: agrega dos columnas opcionales y un índice para filtrar por estilo.
-- Si ya se aplicó, MySQL responde ER_DUP_FIELDNAME y el migrador la saltea.
-- ============================================================================

ALTER TABLE canciones
  ADD COLUMN estilo VARCHAR(40) NULL,
  ADD COLUMN tono   VARCHAR(4)  NULL,
  ADD INDEX idx_canciones_estilo (estilo);
`;
