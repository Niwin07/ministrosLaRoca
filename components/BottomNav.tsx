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

interface NavItem {
  href:          string;
  label:         string;
  icon:          LucideIcon;
  adminOnly?:    boolean;
  ministroOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",                label: "Inicio",   icon: Home                               },
  { href: "/canciones",       label: "Catálogo", icon: BookOpen                           },
  { href: "/playlists",       label: "Listas",   icon: ListMusic                          },
  { href: "/turnos",          label: "Turnos",   icon: Calendar,    ministroOnly: true    },
  { href: "/admin/canciones", label: "Moderar",  icon: ShieldCheck, adminOnly:    true    },
  { href: "/admin/turnos",    label: "Cola",     icon: CalendarPlus, adminOnly:    true   },
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
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2">
      <nav
        aria-label="Navegación principal"
        className="flex items-center justify-around border-t-[1.5px] border-line bg-base/95 px-4 pb-5 pt-2 backdrop-blur-xl"
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
              className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-[3px]"
            >
              {/* Icon — color-only active state (iOS tab bar) */}
              <motion.span
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex items-center justify-center p-2"
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-lo"
                  }`}
                />
              </motion.span>

              {/* Label */}
              <span
                className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
                  isActive
                    ? "text-violet-600 dark:text-violet-400"
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
