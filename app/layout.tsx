import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { cookies } from "next/headers";
import { Settings, LogOut } from "lucide-react";
import { NavWrapper } from "@/components/NavWrapper";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotifBell } from "@/components/NotifBell";
import { PlataformaSwitcher } from "@/components/PlataformaSwitcher";
import { PlataformaCookieSetter } from "@/components/PlataformaCookieSetter";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { usuarios, usuario_plataforma, plataformas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolverPlataforma, PLATAFORMA_IDS } from "@/lib/plataforma";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "Ministros | App de Alabanza",
  description: "Gestión de turnos, listas y catálogo de canciones",
  appleWebApp: {
    capable: true,
    title: "Ministros",
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const jar = await cookies();
  const tema = (jar.get("tema")?.value ?? "oscuro") as "claro" | "oscuro";

  let foto: string | null = null;
  let misPlataformas: { id: number; nombre: string }[] = [];
  let plataformaActivaId: number = PLATAFORMA_IDS.general;
  let cookieValida = false;

  if (session?.user) {
    const [userFoto, userPlataformas] = await Promise.all([
      db
        .select({ foto: usuarios.foto })
        .from(usuarios)
        .where(eq(usuarios.id_usuario, session.user.id_usuario))
        .limit(1)
        .then((r) => r[0]?.foto ?? null),

      db
        .select({ id_plataforma: plataformas.id_plataforma, nombre: plataformas.nombre, es_principal: usuario_plataforma.es_principal })
        .from(usuario_plataforma)
        .innerJoin(plataformas, eq(usuario_plataforma.id_plataforma, plataformas.id_plataforma))
        .where(eq(usuario_plataforma.id_usuario, session.user.id_usuario)),
    ]);

    foto = userFoto;
    misPlataformas = userPlataformas.map((p) => ({ id: p.id_plataforma, nombre: p.nombre }));

    // Resolver plataforma activa: cookie → principal → primera → general
    const cookieId = resolverPlataforma(jar.get("plataforma_activa")?.value);
    cookieValida = !!(cookieId && misPlataformas.some((p) => p.id === cookieId));

    if (cookieValida) {
      plataformaActivaId = cookieId!;
    } else {
      const principal = userPlataformas.find((p) => p.es_principal === 1);
      plataformaActivaId = principal?.id_plataforma ?? misPlataformas[0]?.id ?? PLATAFORMA_IDS.general;
    }
  }

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <html lang="es" className={tema === "oscuro" ? "dark" : ""}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        {session?.user && (
          <header className="sticky top-0 z-50 mx-auto flex w-full max-w-md items-center justify-between border-b border-line/60 bg-base/95 px-4 py-2 backdrop-blur-xl animate-fade-in-down" style={{ paddingTop: "env(safe-area-inset-top)", paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}>

            {/* Avatar — enlace al perfil */}
            <Link
              href="/perfil"
              aria-label="Mi perfil"
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600 transition-opacity hover:opacity-80"
            >
              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={foto} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-white">
                  {session.user.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>

            {/* Switcher de plataforma — solo visible si el usuario está en ambas */}
            {misPlataformas.length >= 2 && (
              <PlataformaSwitcher plataformas={misPlataformas} activaId={plataformaActivaId} />
            )}

            {/* Acciones */}
            <div className="flex items-center">
              <NotifBell />
              <ThemeToggle tema={tema} />
              {session.user.rol === "ADMINISTRADOR" && (
                <Link
                  href="/admin/usuarios"
                  aria-label="Gestión de usuarios"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-gone transition-colors duration-200 hover:text-hi"
                >
                  <Settings size={20} />
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-gone transition-colors duration-200 hover:text-hi"
                >
                  <LogOut size={20} />
                </button>
              </form>
            </div>
          </header>
        )}

        {/* ── Contenido principal ──────────────────────────────────────── */}
        <div className="relative mx-auto min-h-dvh max-w-md pb-28">
          {children}
        </div>

        {session?.user && <NavWrapper rol={session.user.rol} />}

        {/* Persiste la plataforma resuelta a la cookie si estaba ausente/inválida */}
        {session?.user && !cookieValida && (
          <PlataformaCookieSetter id={plataformaActivaId} />
        )}
      </body>
    </html>
  );
}
