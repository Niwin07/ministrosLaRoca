export const ESTADO_LABEL: Record<string, string> = {
  PREPARACION: "En preparación",
  ENSAYO:      "En ensayo",
  DEFINITIVA:  "Definitiva",
  MAZO:        "Archivada",
};

export const ESTADO_DESC: Record<string, string> = {
  PREPARACION: "Estás armando la lista",
  ENSAYO:      "Lista en práctica con el equipo",
  DEFINITIVA:  "Aprobada para el servicio",
  MAZO:        "Servicio finalizado — podés clonarla",
};

export const ESTADO_NEXT_HINT: Record<string, string> = {
  PREPARACION: "Cuando tengas las canciones, pasala a 'En ensayo' para que el equipo la vea.",
  ENSAYO:      "¿Ya practicaron? Marcala como 'Definitiva' para confirmarla.",
  DEFINITIVA:  "Lista confirmada. Podés abrirla en Modo Escenario cuando arranque el servicio.",
  MAZO:        "Servicio terminado. Podés clonar esta lista como base para el próximo.",
};
