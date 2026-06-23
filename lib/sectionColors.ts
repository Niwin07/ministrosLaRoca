export const SECTION_COLORS = {
  violet:  { bg: "bg-violet-500/10 dark:bg-violet-400/10",  text: "text-violet-600 dark:text-violet-400",  gradient: "from-violet-500 to-violet-400"  },
  emerald: { bg: "bg-emerald-500/10 dark:bg-emerald-400/10", text: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-500 to-emerald-400" },
  sky:     { bg: "bg-sky-500/10 dark:bg-sky-400/10",        text: "text-sky-600 dark:text-sky-400",        gradient: "from-sky-500 to-sky-400"        },
  amber:   { bg: "bg-amber-500/10 dark:bg-amber-400/10",    text: "text-amber-600 dark:text-amber-400",    gradient: "from-amber-500 to-amber-400"    },
  rose:    { bg: "bg-rose-500/10 dark:bg-rose-400/10",      text: "text-rose-600 dark:text-rose-400",      gradient: "from-rose-500 to-rose-400"      },
  orange:  { bg: "bg-orange-500/10 dark:bg-orange-400/10",  text: "text-orange-600 dark:text-orange-400",  gradient: "from-orange-500 to-orange-400"  },
} as const;

export type SectionColor = keyof typeof SECTION_COLORS;

// Ordered longest-prefix-first so /admin/canciones matches before /admin
export const ROUTE_COLOR_MAP: [string, SectionColor][] = [
  ["/admin/canciones", "rose"],
  ["/admin/turnos",    "orange"],
  ["/admin",           "rose"],
  ["/canciones",       "emerald"],
  ["/playlists",       "sky"],
  ["/turnos",          "amber"],
  ["/",                "violet"],
];

export function getSectionColor(pathname: string): SectionColor {
  for (const [route, color] of ROUTE_COLOR_MAP) {
    if (route === "/" ? pathname === "/" : pathname.startsWith(route)) return color;
  }
  return "violet";
}
