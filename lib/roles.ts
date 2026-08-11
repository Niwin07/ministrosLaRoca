export type Rol = "ADMINISTRADOR" | "LIDER" | "MINISTRO";

// Etiqueta legible de cada rol. Única fuente de verdad — antes vivía duplicada
// (y desalineada: admin/usuarios mostraba el enum crudo) entre perfil y admin/usuarios.
// Record<string, ...> (no Record<Rol, ...>) a propósito: varios callers
// indexan con un `string | undefined` con fallback (`ROL_LABEL[rol ?? ""]`).
export const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  LIDER:         "Líder",
  MINISTRO:      "Ministro",
};
