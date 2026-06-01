"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

export function NavWrapper({ rol }: { rol?: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/escenario")) return null;
  return <BottomNav rol={rol} />;
}
