import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { turnos_sonido, sonidistas, ajustes_plataforma, usuarios } from "@/db/schema";
import { consultaModulo, lunesDe, sumarSemanas } from "@/lib/modulos";

export interface SemanaSonido {
  semana:    string;               // lunes YYYY-MM-DD
  principal: { id: number; nombre: string } | null;
  auxiliar:  { id: number; nombre: string } | null;
}

/** Semanas planificadas de la plataforma (default 6). */
export async function getSemanasPlanificadas(id_plataforma: number): Promise<number> {
  const { datos } = await consultaModulo(
    () => db.select().from(ajustes_plataforma).where(eq(ajustes_plataforma.id_plataforma, id_plataforma)).limit(1),
    [],
  );
  return datos[0]?.semanas_planificadas ?? 6;
}

/**
 * Turnos de sonido de una plataforma desde esta semana, `cantidad` semanas
 * (índice 0 = esta semana). Si la migración no corrió, devuelve todo vacío.
 */
export async function getTurnosSonido(id_plataforma: number, cantidad: number) {
  const hoy = lunesDe(new Date());
  const { datos: filas, faltaMigracion } = await consultaModulo(
    () =>
      db
        .select()
        .from(turnos_sonido)
        .where(and(eq(turnos_sonido.id_plataforma, id_plataforma), gte(turnos_sonido.semana, hoy))),
    [] as (typeof turnos_sonido.$inferSelect)[],
  );

  const ids = Array.from(new Set(filas.flatMap((f) => [f.id_principal, f.id_auxiliar]).filter((x): x is number => !!x)));
  const nombres = ids.length
    ? new Map(
        (await db.select({ id: usuarios.id_usuario, nombre: usuarios.nombre }).from(usuarios).where(inArray(usuarios.id_usuario, ids)))
          .map((u) => [u.id, u.nombre]),
      )
    : new Map<number, string>();

  const persona = (id: number | null) => (id && nombres.has(id) ? { id, nombre: nombres.get(id)! } : null);

  const semanas: SemanaSonido[] = Array.from({ length: cantidad }, (_, i) => {
    const semana = sumarSemanas(hoy, i);
    const f = filas.find((x) => String(x.semana).slice(0, 10) === semana);
    return { semana, principal: persona(f?.id_principal ?? null), auxiliar: persona(f?.id_auxiliar ?? null) };
  });

  return { semanas, faltaMigracion };
}

/** Personas habilitadas como sonidistas en la plataforma. */
export async function getSonidistas(id_plataforma: number) {
  const { datos } = await consultaModulo(
    () =>
      db
        .select({ id: usuarios.id_usuario, nombre: usuarios.nombre, foto: usuarios.foto })
        .from(sonidistas)
        .innerJoin(usuarios, eq(usuarios.id_usuario, sonidistas.id_usuario))
        .where(eq(sonidistas.id_plataforma, id_plataforma))
        .orderBy(usuarios.nombre),
    [] as { id: number; nombre: string; foto: string | null }[],
  );
  return datos;
}
