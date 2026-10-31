"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems, esRutaActiva } from "@/lib/nav-items";
import { IconoMarca } from "@/components/zarza/IconoMarca";

/**
 * Barra de navegación inferior (móvil) — diseño "Main" del sistema Zarza:
 * vidrio crema, íconos ilustrados y etiqueta; la activa en bermellón.
 */
export function BottomNav({ rol }: { rol?: string }) {
  const pathname = usePathname();
  const items = getNavItems(rol);

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 md:hidden">
      <nav
        aria-label="Navegación principal"
        style={{
          paddingTop: 6,
          paddingBottom: "max(14px, env(safe-area-inset-bottom))",
          paddingLeft: "max(6px, env(safe-area-inset-left))",
          paddingRight: "max(6px, env(safe-area-inset-right))",
        }}
        className="flex items-center justify-around gap-0.5 border-t-[1.5px] border-line bg-[rgb(var(--nav-bg)/0.96)]"
      >
        {items.map((item) => {
          const activo = esRutaActiva(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={[
                "flex min-h-[48px] min-w-0 max-w-[88px] flex-1 basis-0 flex-col items-center justify-center gap-[3px] no-underline",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuego-500/40 rounded-xl",
                activo ? "text-fuego-600 dark:text-[#df8067]" : "text-[#7a5444] dark:text-[#d4bfa3]",
              ].join(" ")}
            >
              <span className={`flex rounded-full p-2 transition-colors ${activo ? "bg-fuego-600/10" : ""}`}>
                <IconoMarca nombre={item.icono} size={21} />
              </span>
              <span className={`max-w-full truncate text-[10px] leading-none ${activo ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
