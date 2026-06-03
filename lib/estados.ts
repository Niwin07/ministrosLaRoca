// Etapas de un servicio (EVENTO):
//   Preparación → En ensayo → Definitiva → Archivada.
// Son una señal de comunicación al equipo:
//   - En ensayo:  lista publicada para el equipo, todavía modificable.
//   - Definitiva: lista final confirmada, el equipo sabe que esa es LA lista.
// El ministro puede volver hacia atrás en cualquier momento para corregir
// (ver el stepper en app/playlists/[id]/page.tsx). El contenido es editable
// en Preparación y En ensayo; en Definitiva/Archivada hay que retroceder.
export const ESTADO_LABEL: Record<string, string> = {
  PREPARACION: "En preparación",
  ENSAYO:      "En ensayo",
  DEFINITIVA:  "Definitiva",
  MAZO:        "Archivada",
};

export const ESTADO_DESC: Record<string, string> = {
  PREPARACION: "Estás armando la lista",
  ENSAYO:      "Publicada para el equipo — todavía podés modificarla",
  DEFINITIVA:  "Lista final confirmada para el servicio",
  MAZO:        "Servicio finalizado — podés clonarla",
};

export const ESTADO_NEXT_HINT: Record<string, string> = {
  PREPARACION: "Cuando tengas las canciones, pasala a 'En ensayo' para que el equipo la vea y la practique.",
  ENSAYO:      "¿Ya practicaron? Marcala como 'Definitiva' para confirmarla. Podés seguir editándola o volver atrás cuando quieras.",
  DEFINITIVA:  "Lista confirmada. Si necesitás corregirla, volvé a 'En ensayo' o 'En preparación' con los botones de arriba.",
  MAZO:        "Servicio terminado. Podés clonar esta lista como base para el próximo, o volver atrás para reabrirla.",
};
