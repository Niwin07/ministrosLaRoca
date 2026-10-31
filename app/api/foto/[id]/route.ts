import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { auth } from "@/auth";

// Sirve la foto de perfil como imagen (no como texto base64 dentro de la
// página). La URL lleva la versión (?v=hash), así que se cachea en el
// navegador "para siempre": cuando la foto cambia, cambia la URL.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new NextResponse(null, { status: 401 });

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return new NextResponse(null, { status: 400 });

  const [fila] = await db.select({ foto: usuarios.foto }).from(usuarios).where(eq(usuarios.id_usuario, id)).limit(1);
  const m = fila?.foto?.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/);
  if (!m) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(m[2], "base64"), {
    headers: {
      "Content-Type": m[1],
      // Privada (sólo el navegador de quien tiene sesión) e inmutable por versión.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
