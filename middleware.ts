import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// El middleware corre en edge runtime. Usa SOLO `authConfig` (sin db/bcrypt):
// verifica el JWT de la cookie y aplica el callback `authorized` a cada request.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Aplica a todo menos: rutas de la API de NextAuth, assets de _next,
  // el manifest/íconos y cualquier archivo con extensión (favicon, etc.).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\..*).*)"],
};
