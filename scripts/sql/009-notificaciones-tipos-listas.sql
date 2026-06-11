-- ============================================================================
-- 009 - Nuevos tipos de notificación para cambios en listas publicadas
-- ============================================================================
-- CANCION_QUITADA: se quitó una canción de una lista en ensayo/definitiva.
-- TONO_CAMBIADO:   se cambió el tono de una canción en una lista publicada.
-- COMENTARIO:      alguien comentó una canción de tu lista.
-- Idempotente: MODIFY con la lista completa no falla si ya está aplicada.
-- ============================================================================

ALTER TABLE notificaciones
  MODIFY COLUMN tipo ENUM(
    'TURNO_ASIGNADO',
    'TURNO_PROXIMO',
    'LISTA_PUBLICADA',
    'LISTA_RETIRADA',
    'CANCION_AGREGADA',
    'CANCION_QUITADA',
    'TONO_CAMBIADO',
    'COMENTARIO',
    'CANCION_APROBADA',
    'CANCION_RECHAZADA',
    'MENCION'
  ) NOT NULL;
