"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  ListMusic,
  ShieldCheck,
  CalendarPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href:         string;
  label:        string;
  icon:         LucideIcon;
  adminOnly?:   boolean; // ADMINISTRADOR | LIDER
  adminStrict?: boolean; // ADMINISTRADOR solamente
}

interface BottomNavProps {
  rol?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",                label: "Inicio",   icon: Home                                  },
  { href: "/canciones",       label: "Catálogo", icon: BookOpen                              },
  { href: "/playlists",       label: "Listas",   icon: ListMusic                             },
  { href: "/admin/canciones", label: "Moderar",  icon: ShieldCheck,  adminOnly:   true       },
  { href: "/admin/turnos",    label: "Turnos",   icon: CalendarPlus, adminOnly:   true       },
  { href: "/admin/usuarios",  label: "Usuarios", icon: Users,        adminStrict: true       },
];

export function BottomNav({ rol }: BottomNavProps) {
  const pathname = usePathname();
  const esAdmin  = rol === "ADMINISTRADOR" || rol === "LIDER";

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminStrict) return rol === "ADMINISTRADOR";
    if (item.adminOnly)   return esAdmin;
    return true;
  });

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)]">
      <nav
        aria-label="Navegación principal"
        className="flex items-center justify-around rounded-full border border-white/8 bg-zinc-900/80 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1"
            >
              <span
                className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-lime-400 p-2 text-black shadow-lg shadow-lime-400/25"
                    : "p-2 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </span>
              <span
                className={`text-[10px] font-medium leading-none transition-colors ${
                  isActive ? "text-lime-400" : "text-zinc-600"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
