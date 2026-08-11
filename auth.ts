import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "@/auth.config";
import { permitir } from "@/lib/rate-limit";

// Hash "señuelo" precalculado: se compara contra él cuando el email no existe
// para que el authorize() tarde lo mismo con email inválido que con password
// incorrecta, y así no se pueda enumerar emails registrados por timing.
const DUMMY_HASH = bcrypt.hashSync("no-existe-este-usuario", 10);

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

        // Máximo 10 intentos cada 5 minutos por email — best-effort contra
        // fuerza bruta (ver lib/rate-limit.ts para el alcance real de esto).
        if (!permitir(`login:${email.toLowerCase()}`, 10, 5 * 60 * 1000)) {
          return null;
        }

        const [usuario] = await db
          .select({
            id_usuario:    usuarios.id_usuario,
            nombre:        usuarios.nombre,
            email:         usuarios.email,
            rol:           usuarios.rol,
            password_hash: usuarios.password_hash,
          })
          .from(usuarios)
          .where(eq(usuarios.email, email));

        // Siempre se ejecuta un bcrypt.compare (contra el hash real o el
        // señuelo) para que el tiempo de respuesta no delate si el email existe.
        const ok = await bcrypt.compare(password, usuario?.password_hash ?? DUMMY_HASH);
        if (!usuario || !ok) return null;

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
