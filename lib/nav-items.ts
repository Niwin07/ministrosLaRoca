// Navegación principal (sistema Zarza). Nombres según el rediseño:
// Catálogo → Repertorio, Listas → Servicios, Cola → Turnos (admin).
// Las rutas NO cambian: sólo etiquetas e íconos.

/** Clave del ícono de marca en /public/zarza/icons/<clave>-{claro,oscuro}.webp */
export type IconoNav = "inicio" | "servicios" | "repertorio" | "turnos" | "moderar";

export interface NavItem {
  href:          string;
  label:         string;
  icono:         IconoNav;
  adminOnly?:    boolean;
  ministroOnly?: boolean;
}

// Única fuente de verdad de la navegación principal (SideNav + BottomNav).
// El orden sigue el diseño: Inicio · Servicios · Repertorio · Turnos · Moderar.
export const NAV_ITEMS: NavItem[] = [
  { href: "/",                label: "Inicio",     icono: "inicio"                        },
  { href: "/playlists",       label: "Servicios",  icono: "servicios"                     },
  { href: "/canciones",       label: "Repertorio", icono: "repertorio"                    },
  { href: "/turnos",          label: "Turnos",     icono: "turnos",    ministroOnly: true },
  { href: "/admin/turnos",    label: "Turnos",     icono: "turnos",    adminOnly:    true },
  { href: "/admin/canciones", label: "Moderar",    icono: "moderar",   adminOnly:    true },
];

export function getNavItems(rol?: string): NavItem[] {
  const esAdmin = rol === "ADMINISTRADOR" || rol === "LIDER";
  return NAV_ITEMS.filter((item) => {
    if (item.adminOnly)    return esAdmin;
    if (item.ministroOnly) return !esAdmin;
    return true;
  });
}

export function esRutaActiva(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Rutas donde SideNav/BottomNav no deben renderizarse (antes duplicado en cada uno). */
export function ocultarNav(pathname: string): boolean {
  return pathname.startsWith("/escenario") || pathname.startsWith("/login");
}

/**
 * Fondo animado de cada sección (clases definidas en app/zarza-fondos.css).
 * Una variación del gradiente "Zarza" por sección, como en el diseño.
 */
export function fondoDeRuta(pathname: string): string {
  if (pathname.startsWith("/login"))           return "fondo-login";
  if (pathname.startsWith("/canciones"))       return "fondo-repertorio";
  if (/^\/playlists\/[^/]+/.test(pathname))    return "fondo-detalle";
  if (pathname.startsWith("/playlists"))       return "fondo-servicios";
  if (pathname.startsWith("/turnos"))          return "fondo-turnos";
  if (pathname.startsWith("/admin"))           return "fondo-admin";
  if (pathname.startsWith("/perfil"))          return "fondo-admin";
  if (pathname.startsWith("/calentamiento"))   return "fondo-voces";
  if (pathname.startsWith("/protocolo"))       return "fondo-sonido";
  if (pathname.startsWith("/mejorar"))         return "fondo-mejorar";
  return "fondo-inicio";
}
