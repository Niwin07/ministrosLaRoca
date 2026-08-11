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
Si el proveedor exige SSL, seteá `DB_SSL=true` (o `require`) en las variables
de entorno — `db/index.ts` y `drizzle.config.ts` ya leen esa variable, no hace
falta tocar código.

## 2. Cargar el esquema y un usuario inicial en esa DB

Desde tu máquina, apuntando las variables a la DB de producción
(temporalmente en un archivo `.env.prod` o exportándolas), corré:

```bash
# Migraciones (runner idempotente, aplica scripts/sql/*.sql)
npm run db:migrate
# Seed de usuarios + canciones (revisar scripts/seed*.ts — todos idempotentes,
# se pueden re-correr sin duplicar ni borrar datos existentes)
npm run db:seed
npm run db:seed-canciones
npm run db:seed-canciones-esp
npm run db:seed-canciones-pdfs
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

Cargá estas en **Project → Settings → Environment Variables** (Production).
Ver `.env.example` en la raíz del repo para la lista completa con comentarios.

| Variable                       | Requerida | Valor                                  |
|---------------------------------|-----------|----------------------------------------|
| `AUTH_SECRET`                   | Sí        | secreto largo aleatorio (`openssl rand -base64 32`) — **nunca lo pegues en un doc del repo** |
| `DB_HOST`                       | Sí        | host del MySQL cloud                    |
| `DB_PORT`                       | Sí        | puerto (ej. 3306)                       |
| `DB_USER`                       | Sí        | usuario                                 |
| `DB_PASSWORD`                   | Sí        | contraseña                              |
| `DB_NAME`                       | Sí        | nombre de la base                       |
| `DB_SSL`                        | Solo si el proveedor lo exige | `true` o `require`     |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Opcional — sin esto, las notificaciones push quedan deshabilitadas en silencio | ver `npx web-push generate-vapid-keys` |
| `GROQ_API_KEY`                  | Opcional — sin esto, `/api/ai/interpretar-cancion` responde 500 | clave de [Groq](https://console.groq.com) |

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
- **Pool MySQL en serverless**: `db/index.ts` cachea el pool en `globalThis`,
  así que se reutiliza entre invocaciones "calientes" de la misma instancia de
  Vercel (no solo en dev). Un cold start sí crea un pool nuevo — inevitable en
  serverless sin un driver específico para ese entorno. `connectionLimit: 5`
  ya está pensado para no agotar el límite del MySQL gestionado con varias
  instancias concurrentes.
- **PWA/manifest** ya configurados (`app/manifest.ts`, íconos en `public/`).
