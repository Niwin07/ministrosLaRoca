import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { push_suscripciones } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  const existentes = await db
    .select({ endpoint: push_suscripciones.endpoint })
    .from(push_suscripciones)
    .where(eq(push_suscripciones.id_usuario, session.user.id_usuario));

  const yaExiste = existentes.some((s) => s.endpoint === body.endpoint);

  if (!yaExiste) {
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

  const suscripciones = await db
    .select()
    .from(push_suscripciones)
    .where(eq(push_suscripciones.id_usuario, session.user.id_usuario));

  const target = suscripciones.find((s) => s.endpoint === body.endpoint);
  if (target) {
    await db
      .delete(push_suscripciones)
      .where(eq(push_suscripciones.id_suscripcion, target.id_suscripcion));
  }

  return NextResponse.json({ ok: true });
}
