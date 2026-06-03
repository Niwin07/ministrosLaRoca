import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { Rol } from "@/lib/mock-user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",      type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const [usuario] = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.email, email));

        if (!usuario) return null;

        const ok = await bcrypt.compare(password, usuario.password_hash);
        if (!ok) return null;

        return {
          id:         String(usuario.id_usuario),
          name:       usuario.nombre,
          email:      usuario.email,
          rol:        usuario.rol,
          id_usuario: usuario.id_usuario,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // user solo existe en el primer login; hydratamos el token para siempre
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
  },
  pages: {
    signIn: "/login",
  },
});
