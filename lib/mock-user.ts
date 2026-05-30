export type Rol = "ADMINISTRADOR" | "LIDER" | "MINISTRO";

export interface UsuarioSesion {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: Rol;
}

// Cambiá el rol aquí para testear distintas vistas en desarrollo:
// "ADMINISTRADOR" | "LIDER" | "MINISTRO"
export const USUARIO_MOCK: UsuarioSesion = {
  id_usuario: 1,
  nombre: "Juan Pérez",
  email: "juan@iglesia.com",
  rol: "MINISTRO",
};
