"use server";

import { cookies } from "next/headers";

export async function setTema(tema: "claro" | "oscuro") {
  cookies().set("tema", tema, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 año
  });
}
