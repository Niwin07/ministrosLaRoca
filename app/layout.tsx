import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { NavWrapper } from "@/components/NavWrapper";
import { SideNav } from "@/components/SideNav";
import { BarraSuperior } from "@/components/BarraSuperior";
import { PlataformaCookieSetter } from "@/components/PlataformaCookieSetter";
import { FondoSeccion } from "@/components/zarza/FondoSeccion";
import { auth, signOut } from "@/auth";
import { getUsuarioFoto, getMisPlataformas } from "@/lib/usuario-request-cache";
import { resolverPlataforma, PLATAFORMA_IDS } from "@/lib/plataforma";
// Tipografías del sistema Zarza, auto-hospedadas (no dependen de Google Fonts en build).
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import "./zarza-fondos.css";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7efe2" },
    { media: "(prefers-color-scheme: dark)",  color: "#1a0504" },
  ],
};

export const metadata: Metadata = {
  title: "Ministros La Roca | Portal de Alabanza",
  description: "Gestión de turnos, servicios y repertorio de canciones",
  appleWebApp: {
    capable: true,
    title: "Ministros",
    statusBarStyle: "black-translucent",
  },
};

// Aplica el estado del menú lateral antes del primer pintado (evita el salto
// de ancho al recargar con el menú plegado).
const SCRIPT_MENU = `try{var m=localStorage.getItem('roca-menu');if(m==='plegado')document.documentElement.dataset.menu='plegado'}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const jar = await cookies();
  // El diseño Zarza parte del modo claro; quien ya eligió un tema lo conserva (cookie).
  const tema = (jar.get("tema")?.value ?? "claro") as "claro" | "oscuro";

  let foto: string | null = null;
  let misPlataformas: { id: number; nombre: string }[] = [];
  let plataformaActivaId: number = PLATAFORMA_IDS.general;
  let cookieValida = false;

  if (session?.user) {
    const [userFoto, userPlataformas] = await Promise.all([
      getUsuarioFoto(session.user.id_usuario),
      getMisPlataformas(session.user.id_usuario),
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
    <html lang="es" className={tema === "oscuro" ? "dark" : ""} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_MENU }} />
      </head>
      <body className={`${geistMono.variable} font-sans antialiased`}>

        {/* ── Fondo animado de la sección ("Zarza") ─────────────────── */}
        <FondoSeccion />

        {/* ── Menú lateral plegable (desktop) ───────────────────────── */}
        {session?.user && (
          <SideNav rol={session.user.rol} nombre={session.user.name ?? ""} foto={foto} />
        )}

        {/* ── Contenido principal ──────────────────────────────────── */}
        <div className={session?.user ? "con-menu" : ""}>
          {session?.user && (
            <div className="md:px-6">
              <BarraSuperior
                rol={session.user.rol}
                nombre={session.user.name ?? ""}
                foto={foto}
                tema={tema}
                logoutAction={logoutAction}
              />
            </div>
          )}
          <div className="relative mx-auto min-h-dvh max-w-md pb-28 md:max-w-none md:px-8 md:pb-10 md:pt-2 xl:max-w-[1400px]">
            {children}
          </div>
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
