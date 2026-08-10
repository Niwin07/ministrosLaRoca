// Etiqueta legible de cada rol. Única fuente de verdad — antes vivía duplicada
// (y desalineada: admin/usuarios mostraba el enum crudo) entre perfil y admin/usuarios.
export const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  LIDER:         "Líder",
  MINISTRO:      "Ministro",
};
