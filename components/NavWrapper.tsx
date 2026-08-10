"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ocultarNav } from "@/lib/nav-items";

export function NavWrapper({ rol }: { rol?: string }) {
  const pathname = usePathname();
  // La barra no aparece en escenario (modo full-screen) ni en el login.
  if (ocultarNav(pathname)) return null;
  return <BottomNav rol={rol} />;
}
