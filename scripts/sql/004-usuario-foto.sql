-- ============================================================================
-- 004 - Foto de perfil de usuario
-- ============================================================================
-- Agrega la columna `foto` para guardar la imagen de perfil como data URL
-- (base64). Se usa MEDIUMTEXT (hasta 16 MB) con margen de sobra; el cliente
-- igual la redimensiona/comprime a un avatar chico antes de enviarla.
-- Idempotente: el runner saltea el ALTER si la columna ya existe.
-- ============================================================================

ALTER TABLE usuarios ADD COLUMN foto MEDIUMTEXT NULL;
