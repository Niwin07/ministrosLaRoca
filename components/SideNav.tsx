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
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlataformaSwitcher } from "@/components/PlataformaSwitcher";
import { NotifBell } from "@/components/NotifBell";

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

const ROL_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  LIDER:         "Líder",
  MINISTRO:      "Ministro",
};

interface Props {
  rol?:               string;
  nombre?:            string;
  foto?:              string | null;
  tema:               "claro" | "oscuro";
  logoutAction:       () => Promise<void>;
  misPlataformas:     { id: number; nombre: string }[];
  plataformaActivaId: number;
}

export function SideNav({
  rol,
  nombre = "",
  foto,
  tema,
  logoutAction,
  misPlataformas,
  plataformaActivaId,
}: Props) {
  const pathname = usePathname();

  if (pathname.startsWith("/escenario") || pathname.startsWith("/login")) return null;

  const esAdmin = rol === "ADMINISTRADOR" || rol === "LIDER";
  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly)    return esAdmin;
    if (item.ministroOnly) return !esAdmin;
    return true;
  });

  const itemCls = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
        : "text-lo hover:bg-input hover:text-mid"
    }`;

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
            <Link key={item.href} href={item.href} className={itemCls(isActive)}>
              <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: notifications, platform, theme, settings, user, logout */}
      <div className="border-t border-line py-2 space-y-0.5">

        {/* Notificaciones */}
        <NotifBell sidebar />

        {/* Platform switcher */}
        {misPlataformas.length >= 2 && (
          <div className="px-3 py-1.5">
            <PlataformaSwitcher plataformas={misPlataformas} activaId={plataformaActivaId} />
          </div>
        )}

        {/* Theme toggle */}
        <ThemeToggle tema={tema} sidebar />

        {/* Admin settings */}
        {rol === "ADMINISTRADOR" && (
          <Link href="/admin/usuarios" className={itemCls(pathname.startsWith("/admin/usuarios"))}>
            <Settings size={17} strokeWidth={1.8} className="shrink-0" />
            Gestión de usuarios
          </Link>
        )}

        {/* User profile */}
        <Link href="/perfil" className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-input">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-white">{nombre.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-hi">{nombre}</p>
            <p className="text-[10px] text-lo">{ROL_LABEL[rol ?? ""] ?? rol}</p>
          </div>
        </Link>

        {/* Logout */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-lo transition-colors hover:bg-input hover:text-hi"
          >
            <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
            Cerrar sesión
          </button>
        </form>

      </div>
    </aside>
  );
}
