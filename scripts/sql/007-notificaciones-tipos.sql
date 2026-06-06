-- Amplía el enum de tipos de notificación con los nuevos disparadores.
ALTER TABLE notificaciones
  MODIFY COLUMN tipo ENUM(
    'TURNO_ASIGNADO',
    'TURNO_PROXIMO',
    'LISTA_PUBLICADA',
    'LISTA_RETIRADA',
    'CANCION_AGREGADA',
    'CANCION_APROBADA',
    'CANCION_RECHAZADA',
    'MENCION'
  ) NOT NULL;
