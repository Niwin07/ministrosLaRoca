"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

export function NavWrapper({ rol }: { rol?: string }) {
  const pathname = usePathname();
  // La barra no aparece en escenario (modo full-screen) ni en el login.
  if (pathname.startsWith("/escenario") || pathname.startsWith("/login")) return null;
  return <BottomNav rol={rol} />;
}
