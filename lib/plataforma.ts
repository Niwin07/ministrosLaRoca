export const PLATAFORMA_IDS = { joven: 1, general: 2 } as const;
export type SlugPlataforma = keyof typeof PLATAFORMA_IDS;

export const PLATAFORMA_LABELS: Record<number, string> = {
  1: "Remanentes",
  2: "General",
};

export const PLATAFORMAS_LIST = [
  { id: 1, slug: "joven"   as SlugPlataforma, nombre: "Remanentes"        },
  { id: 2, slug: "general" as SlugPlataforma, nombre: "General"           },
] as const;

/** Convierte el valor de la cookie en id_plataforma. Undefined = sin filtro. */
export function resolverPlataforma(cookieVal: string | undefined): number | undefined {
  if (cookieVal === "1" || cookieVal === "2") return Number(cookieVal);
  return undefined;
}

/** Nombre corto para mostrar ("Plataforma General" → "General"), como en el diseño. */
export function nombrePlataforma(nombre: string): string {
  return nombre.replace(/^plataforma\s+/i, "").trim();
}

/** Orden del diseño: General primero, después Remanentes (y el resto por nombre). */
export function ordenarPlataformas<T extends { id: number; nombre: string }>(lista: T[]): T[] {
  const peso = (id: number) => (id === PLATAFORMA_IDS.general ? 0 : id === PLATAFORMA_IDS.joven ? 1 : 2);
  return [...lista].sort((a, b) => peso(a.id) - peso(b.id) || a.nombre.localeCompare(b.nombre));
}
