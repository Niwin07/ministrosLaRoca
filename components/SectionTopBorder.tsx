"use client";

import { usePathname } from "next/navigation";
import { SECTION_COLORS, getSectionColor } from "@/lib/sectionColors";

export function SectionTopBorder() {
  const pathname = usePathname();
  if (pathname.startsWith("/escenario") || pathname.startsWith("/login")) return null;

  const color = getSectionColor(pathname);
  const { gradient, bg } = SECTION_COLORS[color];

  return (
    <>
      <div className={`h-[3px] w-full bg-gradient-to-r transition-all duration-500 ${gradient}`} />
      <div className={`fixed inset-0 -z-10 pointer-events-none transition-colors duration-500 ${bg}`} />
    </>
  );
}
