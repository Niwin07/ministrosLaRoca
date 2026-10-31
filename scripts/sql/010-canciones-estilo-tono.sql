-- ============================================================================
-- 010 · Estilo y tono de cada canción del repertorio (diseño "Repertorio").
-- Aditiva: agrega dos columnas opcionales y un índice para filtrar por estilo.
-- Si ya se aplicó, MySQL responde ER_DUP_FIELDNAME y el migrador la saltea.
-- ============================================================================

ALTER TABLE canciones
  ADD COLUMN estilo VARCHAR(40) NULL,
  ADD COLUMN tono   VARCHAR(4)  NULL,
  ADD INDEX idx_canciones_estilo (estilo);
