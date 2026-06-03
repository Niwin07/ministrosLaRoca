# Despliegue — Ministros La Roca (Vercel + MySQL cloud)

App Next.js 14 (App Router) + MySQL + NextAuth v5. Vercel autodetecta Next.js:
**no hace falta `vercel.json`**. El único requisito externo es un **MySQL hosteado**
accesible desde internet (localhost no sirve en la nube).

## 1. Provisionar una base MySQL en la nube

Elegí un proveedor con MySQL gestionado, por ejemplo:

- **Railway** (https://railway.app) — plugin MySQL, simple, plan free/bajo costo.
- **Aiven** (https://aiven.io) — MySQL gestionado con free trial.
- **TiDB Cloud / otros** compatibles con el protocolo MySQL.

Anotá los datos de conexión: **host, puerto, usuario, contraseña, nombre de DB**.
Si el proveedor exige SSL, puede requerir ajustar el pool en `db/index.ts`
(`ssl: { rejectUnauthorized: true }`).

## 2. Cargar el esquema y un usuario inicial en esa DB

Desde tu máquina, apuntando las variables a la DB de producción
(temporalmente en un archivo `.env.prod` o exportándolas), corré:

```bash
# Migraciones (runner idempotente, aplica scripts/sql/*.sql)
npm run db:migrate
# Seed de usuarios + canciones (revisar scripts/seed*.ts)
npm run db:seed
npm run db:seed-canciones
```

> Sin al menos un usuario con password hasheado no vas a poder loguearte.

## 3. Conectar el repo a Vercel

Opción CLI (interactivo — corré estos vos en tu terminal):

```bash
npx vercel login          # autenticación interactiva
npx vercel link           # vincula esta carpeta a un proyecto Vercel
```

O por dashboard: https://vercel.com/new → "Import" el repo
`Niwin07/ministrosLaRoca`. Framework: Next.js (autodetectado).

## 4. Variables de entorno en Vercel

Cargá estas en **Project → Settings → Environment Variables** (Production):

| Variable      | Valor                                  |
|---------------|----------------------------------------|
| `AUTH_SECRET` | secreto largo aleatorio (`openssl rand -base64 32`) |
| `DB_HOST`     | host del MySQL cloud                    |
| `DB_PORT`     | puerto (ej. 3306)                       |
| `DB_USER`     | usuario                                 |
| `DB_PASSWORD` | contraseña                              |
| `DB_NAME`     | nombre de la base                       |

Por CLI (alternativa): `npx vercel env add AUTH_SECRET production`, etc.

> NextAuth v5 en Vercel confía en el host automáticamente. Si lo desplegás
> fuera de Vercel, agregá `AUTH_TRUST_HOST=true`.

## 5. Desplegar

```bash
npx vercel --prod
```

(o cada push a `master` dispara un deploy automático una vez vinculado el repo).

## Notas

- **Build verificado**: `npm run build` pasa limpio; los 13 routes son
  server-rendered dinámicos (usan `auth()`/cookies), no se prerenderizan.
- **Pool MySQL en serverless**: en producción cada cold start crea un pool nuevo
  (`db/index.ts` solo cachea el singleton en dev). Para tráfico de MVP alcanza;
  si escala, cachear el pool en prod o usar un driver serverless reduce el uso
  de conexiones.
- **PWA/manifest** ya configurados (`app/manifest.ts`, íconos en `public/`).
