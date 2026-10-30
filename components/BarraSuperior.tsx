"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotifBell } from "@/components/NotifBell";
import { PlataformaSwitcher } from "@/components/PlataformaSwitcher";
import { Avatar } from "@/components/Avatar";
import { IconoMarca } from "@/components/zarza/IconoMarca";
import { ocultarNav } from "@/lib/nav-items";
import { Users } from "lucide-react";

interface Props {
  rol?:               string;
  nombre:             string;
  foto:               string | null;
  tema:               "claro" | "oscuro";
  logoutAction:       () => Promise<void>;
  misPlataformas:     { id: number; nombre: string }[];
  plataformaActivaId: number;
}

/**
 * Barra superior (diseño "BarraSuperior" / header móvil de "Main").
 * - Móvil: avatar → perfil a la izquierda; notificaciones · tema · salir a la
 *   derecha, sobre vidrio cálido y sticky.
 * - Desktop: transparente sobre el fondo, acciones alineadas a la derecha
 *   (el perfil vive en el menú lateral).
 * El selector de plataforma se mantiene (funcionalidad existente) cuando el
 * usuario pertenece a 2+ plataformas.
 */
export function BarraSuperior({
  rol,
  nombre,
  foto,
  tema,
  logoutAction,
  misPlataformas,
  plataformaActivaId,
}: Props) {
  const pathname = usePathname();
  if (ocultarNav(pathname)) return null;

  const multiPlataforma = misPlataformas.length >= 2;

  return (
    <header
      className={[
        "sticky top-0 z-30 flex items-center justify-between gap-2",
        // móvil: vidrio cálido con borde suave
        "border-b border-[rgba(255,247,236,0.28)] bg-[rgba(255,214,170,0.14)] backdrop-blur-[14px] dark:border-[#4a3530]/60 dark:bg-[rgba(27,19,17,0.55)]",
        // desktop: transparente, alto fijo de 64px
        "md:static md:h-16 md:border-0 md:bg-transparent md:backdrop-blur-0 md:dark:bg-transparent",
      ].join(" ")}
      style={{
        paddingTop: "max(8px, env(safe-area-inset-top))",
        paddingBottom: 8,
        paddingLeft: "max(16px, env(safe-area-inset-left))",
        paddingRight: "max(16px, env(safe-area-inset-right))",
      }}
    >
      <Link
        href="/perfil"
        aria-label="Mi perfil"
        className="flex shrink-0 rounded-full transition-opacity hover:opacity-85 md:hidden"
      >
        <Avatar foto={foto} nombre={nombre} size={40} />
      </Link>

      <div className="flex min-w-0 flex-1 justify-center md:justify-start">
        {multiPlataforma && (
          <PlataformaSwitcher plataformas={misPlataformas} activaId={plataformaActivaId} />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <NotifBell />
        <ThemeToggle tema={tema} />
        {/* En móvil no hay menú lateral: Usuarios (sólo ADMINISTRADOR) queda acá
            para no perder el acceso que tenía el header anterior. */}
        {rol === "ADMINISTRADOR" && (
          <Link
            href="/admin/usuarios"
            aria-label="Gestión de usuarios"
            title="Usuarios"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#4a2c22] transition-colors hover:bg-fuego-600/10 dark:text-[#decfba] md:hidden"
          >
            <Users size={20} aria-hidden />
          </Link>
        )}
        <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-[#e0cbb0] dark:bg-[#5e472a] md:block" />
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-fuego-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40"
          >
            <IconoMarca nombre="salir" size={22} />
          </button>
        </form>
      </div>
    </header>
  );
}
