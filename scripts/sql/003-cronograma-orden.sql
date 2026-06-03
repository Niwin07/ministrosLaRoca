-- ============================================================================
-- 003 - Orden de la cola de turnos
-- ============================================================================
-- Agrega la columna `orden` para poder reordenar la cola arrastrando.
-- Inicializa los turnos existentes según su id (el orden de carga actual).
-- Idempotente: el runner saltea el ALTER si la columna ya existe, y el UPDATE
-- solo toca filas con orden 0 (sin inicializar).
-- ============================================================================

ALTER TABLE cronograma ADD COLUMN orden INT NOT NULL DEFAULT 0;

UPDATE cronograma SET orden = id_turno WHERE orden = 0;
