import type { Metadata } from "next";
import localFont from "next/font/local";
import { BottomNav } from "@/components/BottomNav";
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

export const metadata: Metadata = {
  title: "Ministros | App de Alabanza",
  description: "Gestión de turnos, listas y catálogo de canciones",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-zinc-950 text-white antialiased`}
      >
        {/* ── Header glassmorphism (solo cuando hay sesión) ─────────── */}
        {session?.user && (
          <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950/80 px-5 py-3.5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              {/* Avatar inicial */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-400/10 ring-1 ring-lime-400/25">
                <span className="text-[11px] font-bold text-lime-400">
                  {session.user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Nombre y rol */}
              <div className="leading-none">
                <p className="text-sm font-medium text-white">
                  {session.user.name}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-600">
                  {session.user.rol}
                </p>
              </div>
            </div>

            {/* Botón logout */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
              >
                Salir
              </button>
            </form>
          </header>
        )}

        {/* ── Contenido principal ───────────────────────────────────── */}
        <div className="relative mx-auto min-h-dvh max-w-md pb-28">
          {children}
        </div>

        {/* ── Bottom Nav flotante (recibe rol para filtrar admin items) */}
        <BottomNav rol={session?.user?.rol} />
      </body>
    </html>
  );
}
