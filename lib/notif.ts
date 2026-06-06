import webpush from "web-push";
import { db } from "@/db";
import { notificaciones, push_suscripciones } from "@/db/schema";
import { eq } from "drizzle-orm";

export type TipoNotif =
  | "TURNO_ASIGNADO"
  | "TURNO_PROXIMO"
  | "LISTA_PUBLICADA"
  | "LISTA_RETIRADA"
  | "CANCION_AGREGADA"
  | "CANCION_APROBADA"
  | "CANCION_RECHAZADA"
  | "MENCION";

let _vapidListo = false;

function setupVapid() {
  if (_vapidListo) return;
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subj) return;
  webpush.setVapidDetails(subj, pub, priv);
  _vapidListo = true;
}

/**
 * Inserta una notificación para el usuario y envía el push a todos sus
 * dispositivos suscritos. Fire-and-forget: los errores de push no bloquean.
 */
export async function crearNotificacion(
  id_usuario: number,
  tipo: TipoNotif,
  titulo: string,
  cuerpo: string,
): Promise<void> {
  await db.insert(notificaciones).values({ id_usuario, tipo, titulo, cuerpo, leida: 0 });

  setupVapid();
  if (!_vapidListo) return;

  const suscripciones = await db
    .select()
    .from(push_suscripciones)
    .where(eq(push_suscripciones.id_usuario, id_usuario));

  if (suscripciones.length === 0) return;

  const payload = JSON.stringify({ title: titulo, body: cuerpo });

  for (const s of suscripciones) {
    webpush
      .sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        payload,
      )
      .catch((err: { statusCode?: number }) => {
        // 410 Gone = la suscripción expiró; la eliminamos
        if (err?.statusCode === 410) {
          db.delete(push_suscripciones)
            .where(eq(push_suscripciones.id_suscripcion, s.id_suscripcion))
            .catch(() => {});
        }
      });
  }
}
