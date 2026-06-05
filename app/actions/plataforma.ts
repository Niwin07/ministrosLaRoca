"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setPlataforma(id_plataforma: number) {
  (await cookies()).set("plataforma_activa", String(id_plataforma), { path: "/" });
  revalidatePath("/", "layout");
}
