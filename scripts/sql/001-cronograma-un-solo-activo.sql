-- ============================================================================
-- 001 - Cronograma: garantizar un solo turno ACTIVO
-- ============================================================================
-- Esta migración se corre UNA SOLA VEZ a mano contra la base MySQL.
-- Garantiza, a nivel de base de datos, que la tabla `cronograma` nunca pueda
-- tener más de un turno en estado 'ACTIVO' a la vez (el "director de la
-- semana"), incluso ante concurrencia o ediciones manuales.
--
-- Ejemplo de aplicación:
--   mysql -u root -p ministros < scripts/sql/001-cronograma-un-solo-activo.sql
-- ============================================================================

-- ─── Paso 1: dedupe defensivo ───────────────────────────────────────────────
-- Si por datos viejos ya hubiera más de un turno ACTIVO, dejamos activo solo
-- el de mayor id_turno y pasamos el resto a COMPLETADO. Si no lo hiciéramos, el
-- ALTER del paso 2 fallaría al crear el índice único (habría dos filas con 1).
--
-- El doble anidamiento de subconsulta (SELECT ... FROM (SELECT ...) AS t) es
-- necesario para esquivar el error 1093 de MySQL: no se puede referenciar
-- directamente en el subselect la misma tabla que se está actualizando.
UPDATE cronograma
SET estado_turno = 'COMPLETADO'
WHERE estado_turno = 'ACTIVO'
  AND id_turno < (
    SELECT m FROM (
      SELECT MAX(id_turno) AS m
      FROM cronograma
      WHERE estado_turno = 'ACTIVO'
    ) AS t
  );

-- ─── Paso 2: columna virtual + índice único ─────────────────────────────────
-- `activo_unico` vale 1 solo cuando el turno está ACTIVO y NULL en cualquier
-- otro caso. Como MySQL admite múltiples NULL dentro de un índice UNIQUE, el
-- índice `uq_un_solo_activo` solo puede contener un único 1, forzando "como
-- máximo un ACTIVO" de forma permanente.
ALTER TABLE cronograma
  ADD COLUMN activo_unico TINYINT
    GENERATED ALWAYS AS (CASE WHEN estado_turno = 'ACTIVO' THEN 1 ELSE NULL END) VIRTUAL,
  ADD UNIQUE INDEX uq_un_solo_activo (activo_unico);
