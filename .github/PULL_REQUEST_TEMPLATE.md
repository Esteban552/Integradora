## Resumen
- **App / Paquete:** (`apps/employer` | `apps/worker` | `apps/web` | `packages/ui` | `packages/services` | `packages/theme`)
- **Pantalla / Módulo:** (ej. `UI-EMP-03`, `UI-TRAB-02`, `UI-ADM-02`)
- **Rama:** `feat/...` | `fix/...` | `chore/...`

## Checklist antes de pedir revisión
- [ ] El nombre de archivos de pantalla incluye su código (`UI-EMP-XX_`, `UI-TRAB-XX_`, `UI-ADM-XX_`).
- [ ] Ninguna pantalla importa archivos JSON de `mocks/` directamente (todo pasa por `@trabajos/services`).
- [ ] Componentes compartidos entre Empleador y Trabajador viven en `@trabajos/ui`.
- [ ] Los colores, tipografías y espaciados provienen de `@trabajos/theme` (sin valores hardcodeados).
- [ ] `pnpm typecheck` pasa sin errores y al menos 1 integrante aprobó el PR antes de unir a `main`.
