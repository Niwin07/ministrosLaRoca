export const PLATAFORMA_IDS = { joven: 1, general: 2 } as const;
export type SlugPlataforma = keyof typeof PLATAFORMA_IDS;

export const PLATAFORMA_LABELS: Record<number, string> = {
  1: "Remanentes",
  2: "General",
};

export const PLATAFORMAS_LIST = [
  { id: 1, slug: "joven"   as SlugPlataforma, nombre: "Remanentes"        },
  { id: 2, slug: "general" as SlugPlataforma, nombre: "Plataforma General" },
] as const;

/** Convierte el valor de la cookie en id_plataforma. Undefined = sin filtro. */
export function resolverPlataforma(cookieVal: string | undefined): number | undefined {
  if (cookieVal === "1" || cookieVal === "2") return Number(cookieVal);
  return undefined;
}
