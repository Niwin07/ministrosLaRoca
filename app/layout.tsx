import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { cookies } from "next/headers";
import { Settings, LogOut } from "lucide-react";
import { NavWrapper } from "@/components/NavWrapper";
import { ThemeToggle } from "@/components/ThemeToggle";
import { auth, signOut } from "@/auth";
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
  const tema = ((await cookies()).get("tema")?.value ?? "oscuro") as "claro" | "oscuro";

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <html lang="es" className={tema === "oscuro" ? "dark" : ""}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        {session?.user && (
          <header className="sticky top-0 z-50 mx-auto flex w-full max-w-md items-center justify-between border-b border-line/60 bg-base/95 px-5 py-3.5 backdrop-blur-xl animate-fade-in-down">

            {/* Avatar — enlace al perfil */}
            <Link
              href="/perfil"
              aria-label="Mi perfil"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 transition-opacity hover:opacity-80"
            >
              <span className="text-[11px] font-semibold text-white">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </Link>

            {/* Acciones */}
            <div className="flex items-center gap-1">
              <ThemeToggle tema={tema} />
              {session.user.rol === "ADMINISTRADOR" && (
                <Link
                  href="/admin/usuarios"
                  aria-label="Gestión de usuarios"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gone transition-colors duration-200 hover:text-hi"
                >
                  <Settings size={15} />
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gone transition-colors duration-200 hover:text-hi"
                >
                  <LogOut size={15} />
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
      </body>
    </html>
  );
}
