-- Tabla de notificaciones personales por usuario
CREATE TABLE IF NOT EXISTS notificaciones (
  id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario      INT NOT NULL,
  tipo            ENUM('TURNO_ASIGNADO','LISTA_PUBLICADA','CANCION_APROBADA','CANCION_RECHAZADA','MENCION') NOT NULL,
  titulo          VARCHAR(255) NOT NULL,
  cuerpo          TEXT NOT NULL,
  leida           TINYINT(1) NOT NULL DEFAULT 0,
  creada_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_notif_usuario_leida (id_usuario, leida)
);

-- Tabla de suscripciones Web Push (una por dispositivo)
CREATE TABLE IF NOT EXISTS push_suscripciones (
  id_suscripcion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NOT NULL,
  endpoint       TEXT NOT NULL,
  p256dh         TEXT NOT NULL,
  auth_key       VARCHAR(255) NOT NULL,
  creada_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_push_usuario (id_usuario)
);

-- Registrar quién sugirió cada canción para notificarle cuando se modera
ALTER TABLE canciones
  ADD COLUMN id_usuario_sugeridor INT NULL,
  ADD CONSTRAINT fk_cancion_sugeridor FOREIGN KEY (id_usuario_sugeridor) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
