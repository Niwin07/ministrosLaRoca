import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { NavWrapper } from "@/components/NavWrapper";
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
  themeColor: "#0f172a",
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

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} text-white antialiased`}>

        {/* ── Fondo mesh gradient — fijo, detrás de todo ──────────────── */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
          <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-900/30 blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 h-[400px] w-[400px] rounded-full bg-indigo-800/25 blur-[100px]" />
          <div className="absolute top-2/3 left-0 h-[300px] w-[300px] rounded-full bg-violet-900/20 blur-[80px]" />
        </div>

        {/* ── Header glassmorphism ─────────────────────────────────────── */}
        {session?.user && (
          <header className="sticky top-0 z-50 flex items-center justify-between border-b border-glass-elevated bg-glass-subtle px-5 py-2 backdrop-blur-xl">

            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-400/15 ring-1 ring-lime-400/25">
              <span className="text-[11px] font-bold text-lime-400">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1">
              {session.user.rol === "ADMINISTRADOR" && (
                <Link
                  href="/admin/usuarios"
                  aria-label="Gestión de usuarios"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-content-muted transition-colors duration-200 hover:text-content-primary"
                >
                  <Settings size={15} />
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-content-muted transition-colors duration-200 hover:text-content-primary"
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

        <NavWrapper rol={session?.user?.rol} />
      </body>
    </html>
  );
}
