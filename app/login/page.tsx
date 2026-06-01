import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string | string[] };
}) {
  const hayError = searchParams?.error === "credenciales";

  async function loginAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email:      formData.get("email"),
        password:   formData.get("password"),
        redirectTo: "/playlists",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=credenciales");
      }
      throw error; // re-lanzar NEXT_REDIRECT para que Next.js lo procese
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>

        {hayError && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Email o contraseña incorrectos.
          </p>
        )}

        <form action={loginAction} className="flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full rounded-xl bg-glass-base px-4 py-3 text-sm text-content-primary placeholder-content-muted outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            autoComplete="current-password"
            className="w-full rounded-xl bg-glass-base px-4 py-3 text-sm text-content-primary placeholder-content-muted outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 active:bg-purple-700"
          >
            Ingresar
          </button>
        </form>

      </div>
    </main>
  );
}
