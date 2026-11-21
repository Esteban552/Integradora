# Sistema Multiplataforma de Trabajos Temporales — Fase 0 (Estructura)

Monorepo base para que móvil, web y backend trabajen en paralelo sin desorden. Referencia: **Especificación de Arquitectura v2** (SRS v1.4) y esquema fuente única de verdad en `supabase/migrations/001_trabajos_temporales.sql`.

---

## 1. Estructura del repositorio (Monorepo con workspaces)

```text
.
├── apps/
│   ├── mobile/                       # App Móvil — React Native (Empleador + Trabajador)
│   │   └── src/
│   │       ├── components/           # Componentes compartidos entre módulos
│   │       ├── features/<modulo>/    # Por funcionalidad (auth, jobs, applications, execution,
│   │       │   ├── components/       #   payments, chat, cases, reviews, profile, notifications)
│   │       │   └── screens/          # Pantallas con código UI-EMP-XX / UI-TRAB-XX
│   │       ├── navigation/           # Configuración de navegación (Hito 4)
│   │       ├── services/             # Re-exporta @trabajos/services (único acceso a datos)
│   │       └── theme/                # Re-exporta @trabajos/theme/native
│   └── web/                          # Panel Web Administrador — React + Vite + Tailwind CSS
│       ├── tailwind.config.cjs       # Carga el preset compartido de @trabajos/theme
│       └── src/
│           ├── components/           # Componentes compartidos del panel
│           ├── features/<modulo>/    # Por funcionalidad (auth, cases, moderation, users, payments)
│           │   ├── components/
│           │   └── screens/          # Pantallas con código UI-ADM-XX
│           ├── services/             # Re-exporta @trabajos/services (único acceso a datos)
│           └── theme/                # Re-exporta @trabajos/theme
├── packages/
│   ├── theme/                        # Tema compartido (tokens de Aleksey -> móvil + web)
│   │   ├── tokens.json               # ÚNICA fuente de tokens (colores, fuentes, espaciado, radios)
│   │   ├── tokens.ts                 # Exportación tipada en TypeScript
│   │   ├── native.ts                 # Adaptador para React Native (StyleSheet + elevation)
│   │   └── tailwind.preset.cjs       # Preset para Tailwind CSS (panel web)
│   └── services/                     # Capa única de servicios (mock JSON hoy -> RPC 5.4 mañana)
│       └── src/
│           ├── config.ts             # Interruptor único: dataSource = 'mock' | 'supabase'
│           ├── types/database.ts     # Tipos alineados a 001_trabajos_temporales.sql
│           ├── mocks/*.json          # Datos simulados (NUNCA importados por pantallas)
│           └── modules/*.service.ts  # Módulos por dominio mapeados a las RPC de sección 5.4
└── supabase/migrations/
    └── 001_trabajos_temporales.sql   # Esquema PostgreSQL, RLS y RPC (fuente única de verdad)
```

---

## 2. Cómo se comparte el tema entre Móvil y Web

Se usa un paquete interno **`@trabajos/theme`** con **`packages/theme/tokens.json`** como única fuente de verdad (sin duplicar valores ni requerir compilación previa):

1. **Aleksey** actualiza únicamente `packages/theme/tokens.json` con los colores, tipografías, espaciados, radios y sombras finales.
2. **App Móvil (React Native)** importa `theme` desde `apps/mobile/src/theme` (`@trabajos/theme/native`), obteniendo valores numéricos listos para `StyleSheet` y sombras nativas.
3. **Panel Web (React + Vite + Tailwind)** carga `packages/theme/tailwind.preset.cjs` en `apps/web/tailwind.config.cjs`, habilitando automáticamente las clases `bg-brand-primary`, `text-neutral-textPrimary`, etc., desde el mismo JSON.

---

## 3. Capa única de servicios (`@trabajos/services`)

- **Un solo lugar para pedir datos:** toda pantalla en `apps/mobile` o `apps/web` importa únicamente desde `src/services` (o `@trabajos/services`). **Está prohibido importar archivos de `packages/services/src/mocks/` desde una pantalla.**
- **Fase 0 (hoy):** `config.ts` opera con `dataSource: 'mock'`, devolviendo respuestas desde JSON simulados con los mismos tipos del esquema SQL.
- **Fase 1 (después):** se cambia a `configureServices({ dataSource: 'supabase', supabaseRpc })` sin modificar ninguna pantalla. Los métodos ya están mapeados a las RPC de la **sección 5.4** (`complete_profile`, `accept_terms`, `save_worker_location`, `create_job`, `update_job`, `cancel_job`, `search_jobs`, `get_job_public`, `get_applicants`, `get_counterpart_contact`, `apply_to_job`, `withdraw_application`, `reject_application`, `select_worker`, `confirm_conditions`, `register_arrival`, `request_completion`, `verify_completion_code`, `renew_completion_code`). Las RPC aún no escritas en SQL están marcadas con `TODO(RPC pendiente en 5.4)`.

---

## 4. Reglas cortas del equipo

1. **Nombres de archivo con código de pantalla:** toda pantalla dentro de `features/<modulo>/screens/` debe iniciar con su código del Hito 3:
   - Empleador: `UI-EMP-01_AuthOnboarding.tsx` … `UI-EMP-14_MyCases.tsx`
   - Trabajador: `UI-TRAB-01_AuthOnboarding.tsx` … `UI-TRAB-14_Notifications.tsx`
   - Admin: `UI-ADM-01_AdminLogin.tsx` … `UI-ADM-07_StripeMonitor.tsx`
2. **Ramas por funcionalidad:** nunca trabajar directo sobre `main`. Crear una rama por tarea:
   - `feat/<codigo-o-modulo>` (ej. `feat/UI-EMP-03-publish-job`), `fix/<descripcion>`, `chore/<descripcion>`.
3. **Revisión obligatoria antes de unir a `main`:** todo cambio entra por **Pull Request** con la plantilla de `.github/PULL_REQUEST_TEMPLATE.md` y requiere **al menos 1 aprobación** de otro integrante antes de hacer merge.

### Mapa rápido de pantallas por carpeta (`features/`)

| App | Carpeta `features/` | Códigos de pantalla (Hito 3) |
| :--- | :--- | :--- |
| **Móvil** | `auth` / `jobs` / `applications` | `UI-EMP-01`, `UI-TRAB-01` / `UI-EMP-02..04`, `UI-TRAB-02..04` / `UI-EMP-05`, `UI-TRAB-05` |
| **Móvil** | `execution` / `payments` / `chat` | `UI-EMP-06,09`, `UI-TRAB-07,09` / `UI-EMP-07,12`, `UI-TRAB-06,13` / `UI-EMP-08`, `UI-TRAB-08` |
| **Móvil** | `cases` / `reviews` / `profile` / `notifications` | `UI-EMP-10,14`, `UI-TRAB-10` / `UI-EMP-11`, `UI-TRAB-11` / `UI-EMP-13`, `UI-TRAB-12` / `UI-TRAB-14` |
| **Web** | `auth` / `cases` / `moderation` / `users` / `payments` | `UI-ADM-01` / `UI-ADM-02..04` / `UI-ADM-05` / `UI-ADM-06` / `UI-ADM-07` |

---

## 5. Variables de entorno (Stripe Connect y Supabase)

Copiar `.env.example` a `.env` al iniciar Fase 1 (nunca subir `.env` al repositorio). Para Fase 1 se requiere cuenta plataforma de **Stripe en modo de prueba con Connect activado** (`pk_test_...` / `sk_test_...`).
