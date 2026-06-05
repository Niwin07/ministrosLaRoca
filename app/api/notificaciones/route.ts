import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { notificaciones } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// GET /api/notificaciones — últimas 20 notificaciones del usuario
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const rows = await db
    .select()
    .from(notificaciones)
    .where(eq(notificaciones.id_usuario, session.user.id_usuario))
    .orderBy(desc(notificaciones.creadaEn))
    .limit(20);

  return NextResponse.json(rows);
}

// PATCH /api/notificaciones — marca todas como leídas
export async function PATCH() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  await db
    .update(notificaciones)
    .set({ leida: 1 })
    .where(eq(notificaciones.id_usuario, session.user.id_usuario));

  return NextResponse.json({ ok: true });
}
