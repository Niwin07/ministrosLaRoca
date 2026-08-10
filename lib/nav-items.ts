import {
  Home,
  BookOpen,
  ListMusic,
  ShieldCheck,
  CalendarPlus,
  Calendar,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href:          string;
  label:         string;
  icon:          LucideIcon;
  adminOnly?:    boolean;
  ministroOnly?: boolean;
}

// Única fuente de verdad de la navegación principal — antes duplicada
// byte-a-byte entre SideNav y BottomNav (con riesgo de que diverjan).
export const NAV_ITEMS: NavItem[] = [
  { href: "/",                label: "Inicio",    icon: Home                             },
  { href: "/canciones",       label: "Catálogo",  icon: BookOpen                         },
  { href: "/playlists",       label: "Listas",    icon: ListMusic                        },
  { href: "/turnos",          label: "Turnos",    icon: Calendar,     ministroOnly: true },
  { href: "/admin/canciones", label: "Moderar",   icon: ShieldCheck,  adminOnly:    true },
  { href: "/admin/turnos",    label: "Cola",      icon: CalendarPlus, adminOnly:    true },
];

export function getNavItems(rol?: string): NavItem[] {
  const esAdmin = rol === "ADMINISTRADOR" || rol === "LIDER";
  return NAV_ITEMS.filter((item) => {
    if (item.adminOnly)    return esAdmin;
    if (item.ministroOnly) return !esAdmin;
    return true;
  });
}

/** Rutas donde SideNav/BottomNav no deben renderizarse (antes duplicado en cada uno). */
export function ocultarNav(pathname: string): boolean {
  return pathname.startsWith("/escenario") || pathname.startsWith("/login");
}
