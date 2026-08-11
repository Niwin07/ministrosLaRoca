import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { push_suscripciones } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// POST /api/push — guarda la suscripción del dispositivo
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: "Datos de suscripción incompletos" }, { status: 400 });
  }

  // Filtrado en SQL en vez de traer todas las suscripciones del usuario y
  // comparar en JS — antes hacía un SELECT completo solo para deduplicar.
  const [existente] = await db
    .select({ id_suscripcion: push_suscripciones.id_suscripcion })
    .from(push_suscripciones)
    .where(and(
      eq(push_suscripciones.id_usuario, session.user.id_usuario),
      eq(push_suscripciones.endpoint, body.endpoint),
    ))
    .limit(1);

  if (!existente) {
    await db.insert(push_suscripciones).values({
      id_usuario: session.user.id_usuario,
      endpoint:   body.endpoint,
      p256dh:     body.keys.p256dh,
      auth_key:   body.keys.auth,
    });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/push — elimina la suscripción del dispositivo
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json() as { endpoint: string };
  if (!body?.endpoint) return NextResponse.json({ ok: true });

  // DELETE directo por (id_usuario, endpoint) — antes traía TODAS las
  // suscripciones del usuario (filas completas, con endpoint/p256dh) solo
  // para encontrar en JS cuál borrar.
  await db
    .delete(push_suscripciones)
    .where(and(
      eq(push_suscripciones.id_usuario, session.user.id_usuario),
      eq(push_suscripciones.endpoint, body.endpoint),
    ));

  return NextResponse.json({ ok: true });
}
