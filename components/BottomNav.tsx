"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  BookOpen,
  ListMusic,
  ShieldCheck,
  CalendarPlus,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { SECTION_COLORS, type SectionColor } from "@/lib/sectionColors";

interface NavItem {
  href:          string;
  label:         string;
  icon:          LucideIcon;
  color:         SectionColor;
  adminOnly?:    boolean;
  ministroOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",                label: "Inicio",    icon: Home,        color: "violet"  },
  { href: "/canciones",       label: "Canciones", icon: BookOpen,    color: "emerald" },
  { href: "/playlists",       label: "Listas",    icon: ListMusic,   color: "sky"     },
  { href: "/turnos",          label: "Turnos",    icon: Calendar,    color: "amber",  ministroOnly: true  },
  { href: "/admin/canciones", label: "Moderar",   icon: ShieldCheck, color: "rose",   adminOnly:    true  },
  { href: "/admin/turnos",    label: "Cola",      icon: CalendarPlus,color: "orange", adminOnly:    true  },
];

export function BottomNav({ rol }: { rol?: string }) {
  const pathname = usePathname();
  const esAdmin  = rol === "ADMINISTRADOR" || rol === "LIDER";

  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly)    return esAdmin;
    if (item.ministroOnly) return !esAdmin;
    return true;
  });

  return (
    // Anchored tab bar — both modes. Centered on the max-w-md content column.
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 md:hidden">
      <nav
        aria-label="Navegación principal"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        className="flex items-center justify-around border-t-[1.5px] border-line bg-base/95 px-4 pt-2 backdrop-blur-xl"
      >
        {items.map((item) => {
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
              className="group flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-[3px]"
            >
              {/* Icon — pill animado deslizante (layoutId) */}
              <motion.span
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative flex items-center justify-center p-2"
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className={`absolute inset-0 rounded-full ${SECTION_COLORS[item.color].bg}`}
                  />
                )}
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={`relative transition-colors duration-200 ${
                    isActive
                      ? SECTION_COLORS[item.color].text
                      : "text-lo group-hover:text-mid"
                  }`}
                />
              </motion.span>

              {/* Label */}
              <span
                className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
                  isActive
                    ? SECTION_COLORS[item.color].text
                    : "text-lo"
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
