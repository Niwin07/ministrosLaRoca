// Lógica de suscripción a push notifications compartida entre
// PushSubscribeButton (perfil) y ActivarNotifBanner (banner en home). Antes
// cada componente reimplementaba urlBase64ToUint8Array y el flujo completo de
// registro/suscripción por separado, con manejo de error distinto entre ambos.

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export type PushEstado = "no_soportado" | "bloqueado" | "activo" | "inactivo";

/** Detecta el estado actual del dispositivo sin pedir permiso. */
export async function detectarEstadoPush(): Promise<PushEstado> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "no_soportado";
  if (Notification.permission === "denied") return "bloqueado";

  // Si no hay ningún SW registrado, `ready` nunca resuelve → verificar primero.
  const regs = await navigator.serviceWorker.getRegistrations();
  if (regs.length === 0) return "inactivo";

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? "activo" : "inactivo";
}

/** Registra el SW, pide permiso y suscribe al servidor. Lanza si el usuario rechaza el permiso o falta la VAPID key. */
export async function activarPush(): Promise<void> {
  await navigator.serviceWorker.register("/sw.js");
  // Usar el SW activo (ready), no el resultado de register() que puede estar instalando.
  const reg = await navigator.serviceWorker.ready;

  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("PERMISO_DENEGADO");

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("VAPID_KEY_FALTANTE");

  // Reusar suscripción existente para evitar error por cambio de VAPID key.
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await fetch("/api/push", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(sub.toJSON()),
  });
}

/** Da de baja la suscripción activa del dispositivo (si existe). */
export async function desactivarPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await fetch("/api/push", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
  }
}
