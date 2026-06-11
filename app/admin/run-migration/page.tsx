import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { correrMigraciones } from "@/app/actions/migrations";

export default async function RunMigrationPage(props: {
  searchParams: Promise<{ resultado?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.rol !== "ADMINISTRADOR") redirect("/");

  const { resultado, error } = await props.searchParams;

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-4 text-xl font-bold">Migración de base de datos</h1>
      <p className="mb-6 text-sm text-lo">
        Esta página es temporal. Borrala del código una vez que la migración corra exitosamente.
      </p>

      {resultado && (
        <pre className="mb-4 rounded-xl bg-green-500/10 p-4 text-xs text-green-700 dark:text-green-400 whitespace-pre-wrap">
          {decodeURIComponent(resultado)}
        </pre>
      )}
      {error && (
        <pre className="mb-4 rounded-xl bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap">
          {decodeURIComponent(error)}
        </pre>
      )}

      <form action={correrMigraciones}>
        <button
          type="submit"
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500"
        >
          Correr migraciones
        </button>
      </form>
    </main>
  );
}
