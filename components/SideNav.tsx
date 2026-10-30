"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { IconoMarca } from "@/components/zarza/IconoMarca";
import { getNavItems, ocultarNav, esRutaActiva } from "@/lib/nav-items";
import { ROL_LABEL } from "@/lib/roles";

interface Props {
  rol?:    string;
  nombre?: string;
  foto?:   string | null;
}

const CLAVE_MENU = "roca-menu";

/**
 * Menú lateral plegable (desktop) — diseño "MenuLateral" del sistema Zarza.
 * Vidrio cálido sobre el fondo animado; perfil arriba, navegación con íconos
 * ilustrados. El estado plegado se guarda por navegador (localStorage) y se
 * refleja en <html data-menu> para que el contenido ajuste su margen
 * (clase .con-menu en globals.css). Notificaciones, tema y salir viven en la
 * barra superior (BarraSuperior).
 */
export function SideNav({ rol, nombre = "", foto }: Props) {
  const pathname = usePathname();
  const [plegado, setPlegado] = useState(false);

  // Sincroniza con lo que el script inline de layout ya aplicó antes del pintado.
  useEffect(() => {
    setPlegado(document.documentElement.dataset.menu === "plegado");
  }, []);

  function alternar() {
    const nuevo = !plegado;
    setPlegado(nuevo);
    document.documentElement.dataset.menu = nuevo ? "plegado" : "desplegado";
    try { localStorage.setItem(CLAVE_MENU, nuevo ? "plegado" : "desplegado"); } catch {}
  }

  if (ocultarNav(pathname)) return null;

  const items = getNavItems(rol);
  const rolLabel = ROL_LABEL[rol ?? ""] ?? rol ?? "";

  const itemCls = (activo: boolean) =>
    [
      "flex min-h-[46px] items-center gap-3 rounded-xl text-[15px] transition-colors",
      plegado ? "justify-center px-0" : "justify-start px-3.5",
      activo
        ? "bg-fuego-600/[0.12] font-semibold text-fuego-600 dark:bg-[rgba(226,104,60,0.19)] dark:text-[#d65a32]"
        : "font-medium text-[#6e4c40] hover:bg-fuego-600/[0.06] dark:text-[#d6c2a8] dark:hover:bg-[rgba(226,104,60,0.10)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40",
    ].join(" ");

  const botonMenu = (
    <button
      type="button"
      onClick={alternar}
      aria-label={plegado ? "Desplegar menú" : "Plegar menú"}
      aria-expanded={!plegado}
      title={plegado ? "Desplegar menú" : "Plegar menú"}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#4a2c22] transition-colors hover:bg-fuego-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40 dark:text-[#decfba]"
    >
      <Menu size={20} strokeWidth={2} aria-hidden />
    </button>
  );

  return (
    <aside
      aria-label="Menú"
      className={[
        "fixed left-0 top-0 z-40 hidden h-dvh flex-col overflow-hidden md:flex",
        "border-r border-[rgba(255,247,236,0.35)] bg-[rgb(var(--sidebar-bg)/0.42)] backdrop-blur-[16px]",
        "transition-[width] duration-200 ease-out dark:border-[#4a3530]",
        plegado ? "w-[76px]" : "w-64",
      ].join(" ")}
    >
      {/* Perfil + plegar */}
      <div
        className={[
          "flex items-center gap-2.5 border-b border-line py-3",
          plegado ? "flex-col px-4" : "flex-row px-3",
        ].join(" ")}
      >
        {plegado && botonMenu}
        <Link
          href="/perfil"
          aria-label={`Mi perfil: ${nombre}, ${rolLabel}`}
          title="Mi perfil"
          className={`flex min-w-0 items-center gap-3 rounded-[14px] p-1 text-hi transition-colors hover:bg-fuego-600/[0.06] ${plegado ? "" : "flex-1"}`}
        >
          <Avatar foto={foto ?? null} nombre={nombre} size={40} />
          {!plegado && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight">{nombre}</span>
              <span className="mt-0.5 block text-xs text-lo">{rolLabel}</span>
            </span>
          )}
        </Link>
        {!plegado && botonMenu}
      </div>

      {/* Navegación */}
      <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3.5">
        {items.map((item) => {
          const activo = esRutaActiva(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              aria-label={plegado ? item.label : undefined}
              title={item.label}
              className={itemCls(activo)}
            >
              <IconoMarca nombre={item.icono} size={21} />
              {!plegado && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}

        {rol === "ADMINISTRADOR" && (
          <Link
            href="/admin/usuarios"
            aria-current={pathname.startsWith("/admin/usuarios") ? "page" : undefined}
            aria-label={plegado ? "Usuarios" : undefined}
            title="Usuarios"
            className={itemCls(pathname.startsWith("/admin/usuarios"))}
          >
            <Users size={19} strokeWidth={pathname.startsWith("/admin/usuarios") ? 2.4 : 1.8} aria-hidden />
            {!plegado && <span className="whitespace-nowrap">Usuarios</span>}
          </Link>
        )}
      </nav>
    </aside>
  );
}
