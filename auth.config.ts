import type { NextAuthConfig } from "next-auth";
import type { Rol } from "@/lib/mock-user";

// Configuración compartida y EDGE-SAFE: no importa `db` (mysql2) ni `bcryptjs`,
// así puede correr en el middleware (edge runtime). El provider Credentials —que
// sí usa la base— se agrega aparte en `auth.ts`, que corre en Node.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // user solo existe en el primer login; hidratamos el token para siempre
        token.rol        = user.rol;
        token.id_usuario = user.id_usuario;
      }
      return token;
    },
    session({ session, token }) {
      session.user.rol        = token.rol        as Rol;
      session.user.id_usuario = token.id_usuario as number;
      return session;
    },
    // Guard central de rutas (corre en el middleware). Todo requiere sesión
    // salvo /login. Un usuario logueado que visita /login va al inicio.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const estaEnLogin = request.nextUrl.pathname.startsWith("/login");

      if (estaEnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
