-- ============================================================================
-- 008-indices-performance.sql
-- Índices para los predicados más consultados que todavía no tenían soporte
-- (auditoría de backend: canciones.estado_aprobacion, playlists por
-- usuario/plataforma/estado, cronograma por plataforma/estado, lista_canciones
-- por canción, usuario_plataforma por plataforma). Puramente aditivo — no
-- borra ni modifica datos ni columnas existentes.
--
-- Idempotente vía el runner de scripts/migrate.ts: un ADD INDEX repetido
-- tira ER_DUP_KEYNAME, que el runner ya sabe saltear.
-- ============================================================================
SET NAMES utf8mb4;

ALTER TABLE canciones
  ADD INDEX idx_canciones_estado (estado_aprobacion);

ALTER TABLE playlists
  ADD INDEX idx_playlists_plataforma_tipo_estado (id_plataforma, tipo, estado),
  ADD INDEX idx_playlists_usuario_tipo_estado (id_usuario, tipo, estado);

ALTER TABLE cronograma
  ADD INDEX idx_cronograma_plataforma_estado (id_plataforma, estado_turno, orden);

ALTER TABLE lista_canciones
  ADD INDEX idx_lista_canciones_cancion (id_cancion);

ALTER TABLE usuario_plataforma
  ADD INDEX idx_up_plataforma (id_plataforma);
