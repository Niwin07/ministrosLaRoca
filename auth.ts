import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";

// Instancia completa (Node runtime): hereda `authConfig` (callbacks + pages) y
// le suma el provider Credentials, que usa la base y bcrypt. Lo de edge vive en
// auth.config.ts para que el middleware no arrastre mysql2/bcryptjs.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
});
