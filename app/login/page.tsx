import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { IntroBienvenida, SCRIPT_INTRO } from "@/components/zarza/IntroBienvenida";

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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      {!hayError && <script dangerouslySetInnerHTML={{ __html: SCRIPT_INTRO }} />}
      <IntroBienvenida activa={!hayError} />

      {/* Halo de fuego detrás del logo (diseño "Login" · Zarza) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[30%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-55 blur-[70px] dark:opacity-35"
        style={{
          borderRadius: "46% 54% 60% 40% / 50% 42% 58% 50%",
          background:
            "radial-gradient(circle at 45% 55%, #fff1d6 0%, #f0b47a 22%, #d9864a 42%, #b4472a 62%, #7a2a26 82%, rgba(70,12,4,0) 100%)",
        }}
      />

      <div className="relative flex w-full max-w-[384px] flex-col gap-[22px]">

        {/* Logo: la zarza que arde y no se consume */}
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/zarza/logo-zarza.webp"
            alt="La Roca — zarza ardiente"
            width={720}
            height={872}
            className="h-auto w-[180px] select-none sm:w-[220px]"
            draggable={false}
          />
          <h1 className="font-display sr-only">Ministros La Roca</h1>
          <p aria-hidden className="text-center text-xs font-semibold uppercase tracking-[0.34em] text-[#4a2c22] dark:text-[#decfba]">
            Ministros · La Roca
          </p>
        </div>

        {/* Form card */}
        <div className="flex w-full flex-col gap-4 rounded-2xl border border-line bg-card p-6 shadow-card animate-fade-in-up [animation-delay:200ms] dark:shadow-none">

          {hayError && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 animate-fade-in dark:text-red-400">
              Email o contraseña incorrectos.
            </p>
          )}

          <form action={loginAction} className="flex flex-col gap-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              required
              autoComplete="email"
              className="rounded-full"
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Contraseña"
              required
              autoComplete="current-password"
              className="rounded-full"
            />
            <Button
              type="submit"
              size="lg"
              fullWidth
              className="mt-1"
            >
              Ingresar
            </Button>
          </form>

        </div>

      </div>
    </main>
  );
}
