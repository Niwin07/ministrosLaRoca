# SYSTEM HANDOVER — Ministros App
> Última actualización: 2026-05-29  
> Estado: **MVP completado**. Listo para datos reales + seed de usuarios.

---

## 1. Mapa del Sistema

### Stack
| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router, Server Components) |
| Base de datos | MySQL 8 |
| ORM | Drizzle ORM (`drizzle-orm/mysql2`) |
| Auth | NextAuth v5 (`next-auth@beta`) — estrategia JWT + CredentialsProvider |
| Hashing | `bcryptjs` |
| UI | Tailwind CSS + Lucide React |
| Tipado | TypeScript strict |

### Árbol de rutas

```
app/
├── layout.tsx                   Server — header glassmorphism + BottomNav (recibe rol por prop)
├── page.tsx                     ⚠️ DEUDA — usa USUARIO_MOCK y datos hardcodeados (ver §4)
├── login/
│   └── page.tsx                 Público — formulario signIn (CredentialsProvider)
│
├── canciones/
│   └── page.tsx                 Auth — catálogo APROBADAS + formulario sugerir
├── turnos/
│   └── page.tsx                 Auth — grilla de próximos turnos (solo lectura)
├── playlists/
│   ├── page.tsx                 Auth — mis listas + crear (filtra por id_usuario)
│   └── [id]/
│       └── page.tsx             Auth — detalle lista: agregar/quitar canciones, notas
│
├── admin/
│   ├── canciones/
│   │   └── page.tsx             Auth + ADMINISTRADOR|LIDER — moderación PENDIENTES
│   └── turnos/
│       └── page.tsx             Auth + ADMINISTRADOR|LIDER — asignar turnos
│
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts         Handlers GET/POST de NextAuth v5

app/actions/
├── canciones.ts    sugerirCancion(input) · resolverSugerencia(formData)
├── playlists.ts    crearPlaylist(formData) · clonarMazo(id, userId)
├── listas.ts       agregarCancionALista · actualizarNotaCancion · reordenarLista · eliminarCancionDeLista
└── turnos.ts       asignarTurno(input) · obtenerTurnosActivos()   ⚠️ ver §4

components/
├── BottomNav.tsx   Client — glassmorphism pill nav, acepta prop `rol?: string`
└── ChartViewer.tsx Client — renderiza cifra Nashville/acordes con colores por sección

db/
├── schema.ts       Fuente de verdad del esquema Drizzle
└── index.ts        Pool mysql2 + instancia drizzle

auth.ts             Configuración NextAuth v5 (CredentialsProvider + callbacks jwt/session)
types/
└── next-auth.d.ts  Augmentación: Session.user.{rol, id_usuario} · JWT.{rol, id_usuario}
lib/
└── mock-user.ts    Solo exporta los tipos Rol y UsuarioSesion (ya no exporta datos)
```

---

## 2. Estado de la Base de Datos

### `usuarios`
| Columna | Tipo | Notas |
|---------|------|-------|
| id_usuario | INT PK AI | |
| nombre | VARCHAR(100) NOT NULL | |
| email | VARCHAR(255) NOT NULL UNIQUE | |
| password_hash | VARCHAR(255) NOT NULL | bcrypt hash |
| rol | ENUM NOT NULL | `ADMINISTRADOR` · `LIDER` · `MINISTRO` |

### `cronograma`
| Columna | Tipo | Notas |
|---------|------|-------|
| id_turno | INT PK AI | |
| id_usuario | INT FK → usuarios | |
| fecha_servicio | DATE NOT NULL | |
| estado_turno | ENUM NOT NULL DEFAULT 'PENDIENTE' | `PENDIENTE` · `COMPLETADO` · `AUSENTE` |

> ✅ `rol_servicio` **eliminado** del esquema y del código en esta sesión. Confirmar que la columna también fue eliminada de la BD real antes de correr la app.

### `canciones`
| Columna | Tipo | Notas |
|---------|------|-------|
| id_cancion | INT PK AI | |
| nombre | VARCHAR(255) NOT NULL | |
| artista | VARCHAR(255) NOT NULL | |
| bpm | INT nullable | |
| metrica | VARCHAR(10) nullable | |
| estado_aprobacion | ENUM NOT NULL DEFAULT 'PENDIENTE' | `APROBADA` · `PENDIENTE` · `RECHAZADA` |
| motivo_rechazo | TEXT nullable | Se limpia al aprobar |
| letra | TEXT nullable | Se carga al aprobar desde `/admin/canciones` |
| charts | TEXT nullable | Cifra Nashville; se carga al aprobar. `\r\n` normalizado a `\n` |

### `playlists`
| Columna | Tipo | Notas |
|---------|------|-------|
| id_playlist | INT PK AI | |
| id_usuario | INT FK → usuarios | |
| nombre | VARCHAR(255) NOT NULL | |
| tipo | ENUM NOT NULL | `PRESET` · `EVENTO` |
| estado | ENUM nullable | `PREPARACION` · `ENSAYO` · `DEFINITIVA` · `MAZO` |
| fecha_programada | DATETIME nullable | |

### `lista_canciones`
| Columna | Tipo | Notas |
|---------|------|-------|
| id_lista_cancion | INT PK AI | PK autoincremental (no compuesta) — permite misma canción en posiciones distintas |
| id_playlist | INT FK → playlists | |
| id_cancion | INT FK → canciones | |
| orden | INT NOT NULL | |
| nota | VARCHAR(10) nullable | Tonalidad de la canción en esta lista (ej: Am, G#) |

> Constraint: `UNIQUE(id_playlist, orden)` — no pueden coexistir dos ítems en la misma posición de la misma lista.  
> El algoritmo `reordenarLista` usa una estrategia de dos fases (+1.000.000 offset) para evitar colisiones intermedias en MySQL.

---

## 3. Matriz de Seguridad

### Rutas públicas (sin sesión)
| Ruta | Descripción |
|------|------------|
| `GET /login` | Formulario de autenticación |
| `POST /api/auth/callback/credentials` | Handler de NextAuth (interno) |
| `GET /api/auth/session` | Handler de NextAuth (interno) |

### Rutas protegidas (cualquier rol autenticado)
| Ruta | Verificación |
|------|-------------|
| `GET /` | `session?.user` o redirige a `/login` ⚠️ ver §4 |
| `GET /canciones` | `auth()` → redirect `/login` |
| `GET /turnos` | `auth()` → redirect `/login` |
| `GET /playlists` | `auth()` → redirect `/login` |
| `GET /playlists/[id]` | `auth()` implícito (no redirige, pero accede a datos del usuario) ⚠️ ver §4 |

### Rutas protegidas (ADMINISTRADOR o LIDER)
| Ruta | Verificación |
|------|-------------|
| `GET /admin/canciones` | `auth()` + `rol !== ADMIN && rol !== LIDER → redirect("/")` |
| `GET /admin/turnos` | `auth()` + `rol !== ADMIN && rol !== LIDER → redirect("/")` |

### Server Actions
| Action | Protección actual |
|--------|------------------|
| `sugerirCancion` (inline en `/canciones`) | Solo ejecutable por usuarios con sesión activa (page ya redirige) |
| `resolverSugerencia` (en `app/actions/canciones.ts`) | ⚠️ **Sin guard de rol propio** — depende de que la UI esté en `/admin/canciones` |
| `crearPlaylist` | Llama `auth()` internamente → lanza error si no hay sesión |
| `asignarTurno` (inline en `/admin/turnos`) | ⚠️ **Sin guard propio** — depende de que la page ya validó el rol |
| `agregarCancionALista` / `eliminarCancionDeLista` | Sin guard de autenticación propio |
| `clonarMazo` | Sin guard de autenticación propio |

---

## 4. Deuda Técnica y Pendientes

### 🔴 Crítico (bloquea datos reales)

| ID | Descripción |
|----|-------------|
| DT-01 | **`app/page.tsx` usa `USUARIO_MOCK`** y `MAZOS_RECIENTES` hardcodeados. Necesita `auth()` + query real de mazos recientes del usuario logueado. |
| DT-02 | **`app/playlists/[id]/page.tsx` no valida que el playlist pertenezca al usuario**. Cualquier usuario autenticado puede ver (y editar) la lista de otro. |
| DT-03 | **`rol_servicio` eliminado del schema de código pero requiere confirmación de que el ALTER TABLE también se ejecutó en la BD real**. |
| DT-04 | **No existe seed de usuarios** con passwords hasheados. Sin eso, la pantalla de login no puede ser probada. Crear un script `scripts/seed.ts` que use `bcrypt.hash()`. |

### 🟡 Importante (funcionalidad incompleta)

| ID | Descripción |
|----|-------------|
| DT-05 | **`clonarMazo`** está implementado en `app/actions/playlists.ts` con lógica completa pero **no tiene ningún botón/UI que lo invoque**. |
| DT-06 | **Transiciones de estado de playlist** (PREPARACION → ENSAYO → DEFINITIVA → MAZO) están modeladas en el schema pero no existe UI para avanzarlas. |
| DT-07 | **Transiciones de estado de turno** (PENDIENTE → COMPLETADO / AUSENTE) igualmente sin UI. |
| DT-08 | **BottomNav no incluye enlace a `/turnos`** para usuarios con rol MINISTRO. Solo ven Inicio, Catálogo y Listas. No pueden ver su propio cronograma desde la nav. |
| DT-09 | **`app/actions/turnos.ts` → `asignarTurno`** tiene validación de doble booking, pero el action inline de `/admin/turnos/page.tsx` **hace el INSERT directo**, saltándose esa validación. |
| DT-10 | **Creación de playlists tipo EVENTO** no está disponible en la UI (solo crea PRESET). |

### 🟢 Mejoras (post-MVP)

| ID | Descripción |
|----|-------------|
| DT-11 | **Sin `middleware.ts`** para protección de rutas. La seguridad se maneja página por página. Considerar añadir middleware global para el grupo `/admin/*` y rutas autenticadas. |
| DT-12 | **Los Server Actions críticos** (`resolverSugerencia`, `asignarTurno` inline, `agregarCancionALista`) no tienen guard de autenticación propio. Si alguien invoca la acción directamente (sin pasar por la UI), no hay barrera. Agregar `const session = await auth(); if (!session?.user) throw new Error(...)` en cada uno. |
| DT-13 | **Perfil de usuario**: no existe página de perfil ni cambio de contraseña. |
| DT-14 | **`lib/mock-user.ts`** solo exporta tipos ahora (`Rol`, `UsuarioSesion`). Mover las definiciones a `types/` y eliminar el archivo mock. |
| DT-15 | **`app/actions/turnos.ts → obtenerTurnosActivos()`** no es utilizada por ninguna página (las pages hacen su propia query). Función muerta. |
| DT-16 | **9 vulnerabilidades de `npm audit`** (5 moderate, 4 high). Evaluar `npm audit fix` antes de producción. |
| DT-17 | **Sin manejo de errores en UI**: los Server Actions lanzan errores pero ninguna página los captura/muestra. Agregar `useFormState` o `error.tsx` boundaries. |
| DT-18 | **`app/playlists/[id]/page.tsx`** no tiene guard de auth explícito — accede a datos del usuario pero no redirige si no hay sesión. |

---

## 5. Checkpoint Final

### Variables de entorno (`.env.local`)

```bash
# Generada en esta sesión — NO regenerar salvo que se pierda
AUTH_SECRET=+z4EdzBqS1RE6F2O1jOUpuMnrxKNXKJz3ky1/kaFRRg=

# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # completar
DB_NAME=ministros

# Opcional — solo requerido en producción con dominio real
# AUTH_URL=https://tu-dominio.com
```

### Estado de NextAuth v5

```
✅ auth.ts            — CredentialsProvider configurado
✅ authorize()        — busca por email → bcrypt.compare() → retorna { id, name, email, rol, id_usuario }
✅ jwt callback       — hidrata token con rol + id_usuario en primer login
✅ session callback   — expone session.user.rol + session.user.id_usuario
✅ pages.signIn       — apunta a "/login"
✅ route handler      — app/api/auth/[...nextauth]/route.ts exporta { GET, POST }
✅ types              — types/next-auth.d.ts augmenta Session, User y JWT
```

### Server Actions críticos — estado

| Action | Archivo | Revalida |
|--------|---------|---------|
| `sugerirCancion` | inline `/canciones/page.tsx` | `/canciones` |
| `resolverSugerencia` | `app/actions/canciones.ts` | `/canciones` + `/admin/canciones` |
| `crearPlaylist` | `app/actions/playlists.ts` | redirect a `/playlists/[id]` |
| `clonarMazo` | `app/actions/playlists.ts` | sin revalidatePath (⚠️ ver DT-05) |
| `agregarCancionALista` | `app/actions/listas.ts` | caller hace `revalidatePath` |
| `eliminarCancionDeLista` | `app/actions/listas.ts` | caller hace `revalidatePath` |
| `actualizarNotaCancion` | `app/actions/listas.ts` | caller hace `revalidatePath` |
| `reordenarLista` | `app/actions/listas.ts` | caller hace `revalidatePath` |
| `asignarTurno` (inline) | `/admin/turnos/page.tsx` | `/turnos` + `/admin/turnos` |

### Próxima sesión — orden de ataque sugerido

```
1. scripts/seed.ts         → crear usuarios con bcrypt.hash para poder probar login
2. DT-01 app/page.tsx      → conectar home con auth() y query real de mazos
3. DT-02 playlists/[id]    → validar ownership del playlist
4. DT-08 BottomNav         → agregar ítem /turnos para rol MINISTRO
5. DT-09 asignarTurno      → usar el action exportado con validación de doble booking
6. DT-12 guard en actions  → agregar auth guard a resolverSugerencia y agregarCancionALista
7. DT-05 clonarMazo UI     → botón "Clonar este mazo" en /playlists/[id]
```

---

*Generado al cierre de sesión MVP. Todos los archivos de código están sincronizados con este documento.*
