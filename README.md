# Sistema Multiplataforma de Trabajos Temporales — Fase 0 (Estructura)

Monorepo **pnpm** listo para que Empleador, Trabajador, Panel Web y Backend construyan en paralelo sin desorden. Referencia: **Especificación de Arquitectura v2** (SRS v1.4) y esquema único en `supabase/migrations/001_trabajos_temporales.sql`.

---

## 1. Requisitos e inicio rápido (**pnpm obligatorio**)

Este monorepo utiliza dependencias `workspace:*` gestionadas con **pnpm** (`packageManager: pnpm@10.33.0`). No usar `npm install` ni `yarn`.

```bash
pnpm install              # Instala dependencias de todas las apps y paquetes
pnpm typecheck            # Verifica TypeScript en todo el monorepo
pnpm dev:web              # Arranca Panel Web Administrador (Vite — http://localhost:5173)
pnpm start:employer       # Arranca App Móvil Empleador (Expo)
pnpm start:worker         # Arranca App Móvil Trabajador (Expo)
```

---

## 2. Estructura del repositorio (3 apps independientes + 3 paquetes compartidos)

```text
.
├── apps/
│   ├── employer/                     # App Móvil Empleador — Expo + React Native (UI-EMP-01..14)
│   │   ├── app.json / metro.config.js / tsconfig.json / App.tsx (pantalla en blanco)
│   │   └── src/
│   │       ├── components/           # Componentes propios de Empleador
│   │       ├── features/<modulo>/    # auth, jobs, applications, execution, payments,
│   │       │   ├── components/       #   chat, cases, reviews, profile
│   │       │   └── screens/          # Pantallas UI-EMP-XX_<Nombre>.tsx
│   │       ├── navigation/           # Navegación Empleador (Hito 4.1)
│   │       ├── services/             # Re-exporta @trabajos/services
│   │       └── theme/                # Re-exporta @trabajos/theme/native
│   ├── worker/                       # App Móvil Trabajador — Expo + React Native (UI-TRAB-01..14)
│   │   ├── app.json / metro.config.js / tsconfig.json / App.tsx (pantalla en blanco)
│   │   └── src/
│   │       ├── components/           # Componentes propios de Trabajador
│   │       ├── features/<modulo>/    # auth, jobs, applications, execution, payments,
│   │       │   ├── components/       #   chat, cases, reviews, profile, notifications
│   │       │   └── screens/          # Pantallas UI-TRAB-XX_<Nombre>.tsx
│   │       ├── navigation/           # Navegación Trabajador (Hito 4.2)
│   │       ├── services/             # Re-exporta @trabajos/services
│   │       └── theme/                # Re-exporta @trabajos/theme/native
│   └── web/                          # Panel Web Administrador — React 18 + Vite + Tailwind (UI-ADM-01..07)
│       ├── index.html / vite.config.ts / tailwind.config.cjs / tsconfig.json / src/App.tsx
│       └── src/
│           ├── components/           # Componentes compartidos del panel web
│           ├── features/<modulo>/    # auth, cases, moderation, users, payments
│           │   ├── components/
│           │   └── screens/          # Pantallas UI-ADM-XX_<Nombre>.tsx
│           ├── services/             # Re-exporta @trabajos/services
│           └── theme/                # Re-exporta @trabajos/theme
├── packages/
│   ├── ui/                           # @trabajos/ui — Componentes móviles compartidos entre employer y worker
│   │   └── src/                      #   (components, chat, reviews, profile, notifications)
│   ├── theme/                        # @trabajos/theme — Tema único para Expo y Tailwind CSS
│   │   ├── tokens.json               #   ÚNICA fuente de tokens (colores, tipografía, espaciado, radios)
│   │   ├── native.ts                 #   Adaptador React Native (StyleSheet + elevation)
│   │   └── tailwind.preset.cjs       #   Preset Tailwind CSS consumido por apps/web
│   └── services/                     # @trabajos/services — Capa única de datos (mock JSON -> RPC 5.4)
│       └── src/
│           ├── config.ts             #   Interruptor único: dataSource = 'mock' | 'supabase'
│           ├── types/database.ts     #   Tipos alineados a 001_trabajos_temporales.sql
│           ├── mocks/*.json          #   Mocks ampliados (10 estados de trabajo, 9 perfiles, 17 postulaciones, 7 pagos)
│           └── modules/*.service.ts  #   Servicios mapeados a las RPC de la sección 5.4
└── supabase/migrations/
    └── 001_trabajos_temporales.sql   # Esquema PostgreSQL, RLS y RPC (fuente única de verdad)
```

---

## 3. Tema compartido y capa única de servicios

- **Tema (`@trabajos/theme`):** Aleksey actualiza solo `packages/theme/tokens.json`. `apps/employer` y `apps/worker` lo leen desde `src/theme` (`native.ts`), y `apps/web` lo consume automáticamente mediante `tailwind.preset.cjs` en `apps/web/tailwind.config.cjs`.
- **Servicios (`@trabajos/services`):** Toda pantalla pide datos exclusivamente mediante `src/services` (o `@trabajos/services`). **Prohibido importar archivos de `packages/services/src/mocks/` desde una pantalla.** Hoy opera en `dataSource: 'mock'`; en Fase 1 se cambia a `'supabase'` sin tocar pantallas.

---

## 4. Reglas cortas del equipo y mapa de pantallas

1. **Nombres con código de pantalla:** `UI-EMP-01_AuthOnboarding.tsx`, `UI-TRAB-02_JobExplorer.tsx`, `UI-ADM-01_AdminLogin.tsx`.
2. **Ramas por funcionalidad:** nunca subir directo a `main`; usar `feat/<codigo-o-modulo>`, `fix/<descripcion>` o `chore/<descripcion>`.
3. **Revisión obligatoria:** todo cambio entra por Pull Request (`.github/PULL_REQUEST_TEMPLATE.md`) con **mínimo 1 aprobación** antes de hacer merge a `main`.

| App | Ruta base de pantallas | Módulos `features/` y códigos de pantalla (Hito 3) |
| :--- | :--- | :--- |
| **Empleador** | `apps/employer/src/features/<mod>/screens/` | `auth` (`UI-EMP-01`), `jobs` (`02..04`), `applications` (`05`), `execution` (`06,09`), `payments` (`07,12`), `chat` (`08`), `cases` (`10,14`), `reviews` (`11`), `profile` (`13`) |
| **Trabajador** | `apps/worker/src/features/<mod>/screens/` | `auth` (`UI-TRAB-01`), `jobs` (`02..04`), `applications` (`05`), `payments` (`06,13`), `execution` (`07,09`), `chat` (`08`), `cases` (`10`), `reviews` (`11`), `profile` (`12`), `notifications` (`14`) |
| **Panel Web** | `apps/web/src/features/<mod>/screens/` | `auth` (`UI-ADM-01`), `cases` (`02..04`), `moderation` (`05`), `users` (`06`), `payments` (`07`) |

> **Variables de entorno:** Copiar `.env.example` a `.env` local al iniciar Fase 1 (nunca subir `.env` a Git).
