-- ============================================================================
-- 008 - Mejoras de listas: links de referencia, comentarios, visitas y
--       timestamps de cambios
-- ============================================================================
-- 1. canciones.link_referencia: URL de YouTube/Spotify para ensayar en casa.
-- 2. lista_canciones.agregado_en / nota_actualizada_en: timestamps para el
--    indicador de "qué cambió desde tu última visita". Se setean SIEMPRE de
--    forma explícita desde la app (nunca ON UPDATE automático, porque
--    reordenarLista hace UPDATE de todas las filas y las marcaría como
--    modificadas). Las filas existentes quedan NULL = sin badge retroactivo.
-- 3. lista_comentarios: comentarios por canción dentro de una lista
--    ("la arrancamos a capela", "bajarla medio tono"). ON DELETE CASCADE
--    hacia lista_canciones cubre tanto quitar una canción como borrar la
--    playlist entera (que borra sus lista_canciones a mano).
-- 4. playlist_visitas: última visita de cada usuario a cada lista, para
--    calcular los badges "Nuevo"/"Tono cambiado".
-- Idempotente: el runner saltea el archivo si las columnas ya existen, y los
-- CREATE TABLE usan IF NOT EXISTS.
-- ============================================================================

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
