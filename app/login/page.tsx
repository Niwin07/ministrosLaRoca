import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Music2 } from "lucide-react";
import { Button } from "@/components/Button";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const searchParams = await props.searchParams;
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
      throw error;
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-4">

      {/* Glow ambiental de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[100px] animate-pulse-soft"
      />

      <div className="relative w-full max-w-sm space-y-8">

        {/* App logo / title */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/30 animate-scale-in">
            <Music2 size={28} className="text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center animate-fade-in-up [animation-delay:120ms]">
            <h1 className="text-2xl font-bold text-hi">Ministros</h1>
            <p className="mt-0.5 text-sm text-lo">Portal de Alabanza</p>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full space-y-5 rounded-2xl border border-line bg-card p-6 shadow-card animate-fade-in-up [animation-delay:200ms] dark:shadow-none">

          {hayError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 animate-fade-in dark:text-red-400">
              Email o contraseña incorrectos.
            </p>
          )}

          <form action={loginAction} className="flex flex-col gap-3">
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            />
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            />
            <Button
              type="submit"
              shape="block"
              size="lg"
              fullWidth
              className="mt-1 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40"
            >
              Ingresar
            </Button>
          </form>

        </div>

      </div>
    </main>
  );
}
