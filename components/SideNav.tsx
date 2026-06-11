"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  ListMusic,
  ShieldCheck,
  CalendarPlus,
  Calendar,
  Music2,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href:          string;
  label:         string;
  icon:          LucideIcon;
  adminOnly?:    boolean;
  ministroOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",                label: "Inicio",   icon: Home                              },
  { href: "/canciones",       label: "Catálogo", icon: BookOpen                          },
  { href: "/playlists",       label: "Listas",   icon: ListMusic                         },
  { href: "/turnos",          label: "Turnos",   icon: Calendar,    ministroOnly: true   },
  { href: "/admin/canciones", label: "Moderar",  icon: ShieldCheck, adminOnly:    true   },
  { href: "/admin/turnos",    label: "Cola",     icon: CalendarPlus, adminOnly:   true   },
];

export function SideNav({ rol }: { rol?: string }) {
  const pathname = usePathname();

  if (pathname.startsWith("/escenario") || pathname.startsWith("/login")) return null;

  const esAdmin = rol === "ADMINISTRADOR" || rol === "LIDER";
  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly)    return esAdmin;
    if (item.ministroOnly) return !esAdmin;
    return true;
  });

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-dvh w-64 flex-col border-r border-line bg-base z-40">

      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600">
          <Music2 size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-hi">Ministros</p>
          <p className="text-[10px] text-lo">La Roca</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "text-lo hover:bg-input hover:text-mid"
              }`}
            >
              <Icon
                size={17}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="shrink-0"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
