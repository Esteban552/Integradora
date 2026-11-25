# Guía de trabajo con el repositorio

Esta guía aplica a todo el equipo hasta la entrega (jueves 26/11/2026, 1:00 p.m., hora de Hermosillo).

## Reglas

1. Nadie sube directo a `main`. Todo cambio entra por una rama y un Pull Request (PR).
2. Solo Isa aprueba y hace merge a `main`.
3. Las llaves (Stripe, Supabase, contraseñas) nunca van al repositorio ni en capturas. Van en `.env`, que está ignorado por git. En el repo solo vive `.env.example`, sin valores reales.
4. Antes de subir, el código debe pasar `pnpm typecheck` y las pruebas del área que tocaste.
5. Las migraciones 001 a 004 ya están aplicadas en Supabase: no se editan. Cualquier cambio de base de datos va en un archivo nuevo (`005_...`, `006_...`) y se avisa a Isa y Ezequiel antes de correrlo.

## Quién toca qué

| Área | Responsable |
|---|---|
| `apps/employer` (UI-EMP-01 a 09 y 13) | Isa |
| `apps/worker`, UI-EMP-10, 11, 12 y 14, diseño y `packages/theme` | Aleksey |
| `apps/web` (panel de administración), funciones de Stripe, modo supabase de `packages/services` | Esteban |
| `supabase/` (migraciones y verificación) | Ezequiel, con Isa |
| `docs/`, textos legales y pruebas | Lluvia |

`packages/ui`, `packages/theme` y `packages/services` los usan todos. Si cambias algo ahí, avisa en el grupo en el mismo momento y mantén el cambio pequeño.

## Nombres de rama

`tipo/área-tema`, en minúsculas y con guiones:

- `feat/ui-emp-04` para una pantalla o función nueva.
- `fix/jobform-fecha` para corregir algo.
- `docs/checklist-pruebas` para documentación.

## Flujo de trabajo

1. Actualiza `main` y crea tu rama desde ahí:
   ```
   git checkout main
   git pull
   git checkout -b feat/mi-tema
   ```
2. Trabaja con commits pequeños y con mensaje claro, por ejemplo `Agrega filtro de postulantes en UI-EMP-04`.
3. Antes de subir:
   ```
   pnpm install
   pnpm typecheck
   ```
   Corre también las pruebas de lo que tocaste (por ejemplo `npx tsx --test src/features/jobs/jobForm.test.ts` dentro de `apps/employer`).
4. Revisa qué vas a subir:
   ```
   git status
   git diff --cached
   ```
   No debe aparecer ningún `.env`, llave, `node_modules` ni archivo `.patch`.
5. Sube tu rama y abre el PR hacia `main`:
   ```
   git push -u origin HEAD
   ```
   En el PR escribe qué cambió, cómo probarlo y si toca algo compartido.
6. Isa revisa y hace el merge. Si pide cambios, los haces en la misma rama y vuelves a subir.
7. Después del merge, todos actualizan `main` antes de empezar algo nuevo.

## Conflictos

- Si git marca conflicto en `pnpm-lock.yaml`, no lo edites a mano: acepta la versión de `main` y corre `pnpm install`.
- Si el conflicto es en otro archivo, avisa a quien lo tocó antes de resolverlo.
- Si no estás seguro, no fuerces el push (`--force`). Pregunta a Isa.

## Calendario hasta la entrega

- **Mar 24 y mié 25:** desarrollo en ramas; PR en cuanto una pieza funcione, sin esperar a terminar todo.
- **Mié 25, 8:00 p.m.:** todo lo importante, incluidas las funciones de Stripe en modo de prueba, ya debe tener PR abierto.
- **Jue 26, 8:00 a.m.:** congelamiento. Después de esa hora solo entran correcciones que Isa apruebe.
- **Jue 26, 12:00 p.m.:** revisión del equipo.
- **Jue 26, 1:00 p.m.:** entrega.

## Configuración que debe hacer el dueño del repo (Esteban)

En GitHub, en Settings del repositorio:

1. Dar a Isa permiso de administración (Collaborators and teams).
2. Crear una regla de protección para la rama `main` (Branches o Rules):
   - Exigir Pull Request antes de hacer merge.
   - Exigir al menos 1 aprobación.
   - Exigir revisión de los propietarios del código (Code Owners).
   - Bloquear los push directos a `main`.
3. Confirmar que `CODEOWNERS` (en `.github/`) apunte al usuario de GitHub de Isa.
