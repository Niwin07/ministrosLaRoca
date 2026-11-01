import { and, eq, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { fotoUrl } from "@/lib/foto";
import { db } from "@/db";
import { turnos_sonido, sonidistas, ajustes_plataforma, usuarios } from "@/db/schema";
import { consultaModulo, lunesDe, sumarSemanas } from "@/lib/modulos";

export interface SemanaSonido {
  semana:    string;               // lunes YYYY-MM-DD
  principal: { id: number; nombre: string; foto?: string | null } | null;
  auxiliar:  { id: number; nombre: string; foto?: string | null } | null;
}

/** Semanas planificadas de la plataforma (default 6). */
export async function getSemanasPlanificadas(id_plataforma: number): Promise<number> {
  const { datos } = await consultaModulo(
    () => db.select().from(ajustes_plataforma).where(eq(ajustes_plataforma.id_plataforma, id_plataforma)).limit(1),
    [],
  );
  return datos[0]?.semanas_planificadas ?? 6;
}

const principalU = alias(usuarios, "principal_u");
const auxiliarU = alias(usuarios, "auxiliar_u");

/** Filas de turnos de sonido desde esta semana, con los nombres ya unidos (una sola consulta). */
export async function getFilasSonido(id_plataforma: number) {
  const hoy = lunesDe(new Date());
  const { datos, faltaMigracion } = await consultaModulo(
    () =>
      db
        .select({
          semana:        turnos_sonido.semana,
          id_principal:  turnos_sonido.id_principal,
          id_auxiliar:   turnos_sonido.id_auxiliar,
          nom_principal: principalU.nombre,
          nom_auxiliar:  auxiliarU.nombre,
          foto_principal: fotoUrl(principalU),
          foto_auxiliar:  fotoUrl(auxiliarU),
        })
        .from(turnos_sonido)
        .leftJoin(principalU, eq(principalU.id_usuario, turnos_sonido.id_principal))
        .leftJoin(auxiliarU, eq(auxiliarU.id_usuario, turnos_sonido.id_auxiliar))
        .where(and(eq(turnos_sonido.id_plataforma, id_plataforma), gte(turnos_sonido.semana, hoy))),
    [] as { semana: unknown; id_principal: number | null; id_auxiliar: number | null; nom_principal: string | null; nom_auxiliar: string | null; foto_principal: string | null; foto_auxiliar: string | null }[],
  );
  return { filas: datos, faltaMigracion };
}

/** Arma `cantidad` semanas (índice 0 = esta semana) a partir de las filas. */
export function armarSemanas(filas: Awaited<ReturnType<typeof getFilasSonido>>["filas"], cantidad: number): SemanaSonido[] {
  const hoy = lunesDe(new Date());
  return Array.from({ length: cantidad }, (_, i) => {
    const semana = sumarSemanas(hoy, i);
    const f = filas.find((x) => String(x.semana instanceof Date ? x.semana.toISOString() : x.semana).slice(0, 10) === semana);
    return {
      semana,
      principal: f?.id_principal && f.nom_principal ? { id: f.id_principal, nombre: f.nom_principal, foto: f.foto_principal } : null,
      auxiliar:  f?.id_auxiliar && f.nom_auxiliar ? { id: f.id_auxiliar, nombre: f.nom_auxiliar, foto: f.foto_auxiliar } : null,
    };
  });
}

/**
 * Turnos de sonido de una plataforma desde esta semana, `cantidad` semanas
 * (índice 0 = esta semana). Si la migración no corrió, devuelve todo vacío.
 */
export async function getTurnosSonido(id_plataforma: number, cantidad: number) {
  const { filas, faltaMigracion } = await getFilasSonido(id_plataforma);
  return { semanas: armarSemanas(filas, cantidad), faltaMigracion };
}

/** Personas habilitadas como sonidistas en la plataforma. */
export async function getSonidistas(id_plataforma: number) {
  const { datos } = await consultaModulo(
    () =>
      db
        .select({ id: usuarios.id_usuario, nombre: usuarios.nombre, foto: fotoUrl() })
        .from(sonidistas)
        .innerJoin(usuarios, eq(usuarios.id_usuario, sonidistas.id_usuario))
        .where(eq(sonidistas.id_plataforma, id_plataforma))
        .orderBy(usuarios.nombre),
    [] as { id: number; nombre: string; foto: string | null }[],
  );
  return datos;
}
