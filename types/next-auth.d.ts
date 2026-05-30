import type { DefaultSession } from "next-auth";
import type { Rol } from "@/lib/mock-user";

// Extiende la sesión para inyectar los campos del dominio
declare module "next-auth" {
  interface Session {
    user: {
      rol:        Rol;
      id_usuario: number;
    } & DefaultSession["user"];
  }

  interface User {
    rol:        Rol;
    id_usuario: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol:        Rol;
    id_usuario: number;
  }
}
