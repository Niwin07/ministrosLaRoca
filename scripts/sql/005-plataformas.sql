-- ============================================================================
-- 005-plataformas.sql
-- Divide la app en dos plataformas: Remanentes (joven) y Plataforma General.
-- Turnos y listas quedan scoped por plataforma; el catálogo de canciones y los
-- roles de usuario son globales (sin cambios).
--
-- Idempotente: usa IF NOT EXISTS / IF EXISTS para tolerar re-ejecuciones
-- parciales. Probado contra MySQL 8.0 (Aiven).
-- ============================================================================
SET NAMES utf8mb4;

-- ── 1. Tabla maestra de plataformas ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plataformas (
  id_plataforma INT          NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100) NOT NULL,
  slug          VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id_plataforma),
  UNIQUE KEY uq_plataformas_slug (slug)
);

INSERT IGNORE INTO plataformas (id_plataforma, nombre, slug) VALUES
  (1, 'Remanentes',         'joven'),
  (2, 'Plataforma General', 'general');

-- ── 2. Join tabla usuarios ↔ plataformas ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuario_plataforma (
  id_usuario    INT     NOT NULL,
  id_plataforma INT     NOT NULL,
  es_principal  TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (id_usuario, id_plataforma),
  CONSTRAINT fk_up_usuario    FOREIGN KEY (id_usuario)    REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_up_plataforma FOREIGN KEY (id_plataforma) REFERENCES plataformas(id_plataforma)
);

-- ── 3. Columna id_plataforma en playlists ────────────────────────────────────
-- Datos históricos se asignan a Plataforma General (id = 2).
ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS id_plataforma INT NOT NULL DEFAULT 2;

ALTER TABLE playlists
  ADD CONSTRAINT IF NOT EXISTS fk_playlists_plataforma
    FOREIGN KEY (id_plataforma) REFERENCES plataformas(id_plataforma);

-- ── 4. Columna id_plataforma en cronograma ───────────────────────────────────
-- La columna virtual activo_unico debe rehacerse para garantizar un solo ACTIVO
-- POR PLATAFORMA (antes era uno solo global). Orden: drop índice → drop columna
-- virtual → agregar id_plataforma → recrear columna virtual con la nueva
-- expresión → recrear índice único.
ALTER TABLE cronograma DROP INDEX  IF EXISTS uq_un_solo_activo;
ALTER TABLE cronograma DROP COLUMN IF EXISTS activo_unico;

ALTER TABLE cronograma
  ADD COLUMN IF NOT EXISTS id_plataforma INT NOT NULL DEFAULT 2;

ALTER TABLE cronograma
  ADD CONSTRAINT IF NOT EXISTS fk_cronograma_plataforma
    FOREIGN KEY (id_plataforma) REFERENCES plataformas(id_plataforma);

-- Nueva expresión: NULL cuando no activo (múltiples NULLs ≠ duplicados en UNIQUE).
-- id_plataforma cuando activo → un solo ACTIVO por plataforma.
ALTER TABLE cronograma
  ADD COLUMN IF NOT EXISTS activo_unico INT
    GENERATED ALWAYS AS (
      CASE WHEN `estado_turno` = 'ACTIVO' THEN `id_plataforma` ELSE NULL END
    ) VIRTUAL;

ALTER TABLE cronograma
  ADD UNIQUE INDEX IF NOT EXISTS uq_un_solo_activo (activo_unico);
