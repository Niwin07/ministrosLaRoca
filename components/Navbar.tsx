"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { USUARIO_MOCK, type Rol } from "@/lib/mock-user";

const ROL_STYLES: Record<Rol, string> = {
  ADMINISTRADOR: "border-red-500/40 bg-red-500/10 text-red-300",
  LIDER:         "border-blue-500/40 bg-blue-500/10 text-blue-300",
  MINISTRO:      "border-purple-500/40 bg-purple-500/10 text-purple-300",
};

const NAV_LINKS = [
  { href: "/",          label: "Dashboard"  },
  { href: "/turnos",    label: "Turnos"     },
  { href: "/canciones", label: "Canciones"  },
  { href: "/playlists", label: "Playlists"  },
];

export function Navbar() {
  const pathname  = usePathname();
  const usuario   = USUARIO_MOCK;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          {/* Marca + links de navegación */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-bold tracking-wide text-white"
            >
              ♪ Ministros
            </Link>

            <div className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-slate-700 font-medium text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Badge de usuario */}
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROL_STYLES[usuario.rol]}`}
            >
              {usuario.rol}
            </span>
            <span className="hidden text-sm text-slate-300 sm:block">
              {usuario.nombre}
            </span>
          </div>

        </div>
      </div>
    </nav>
  );
}
