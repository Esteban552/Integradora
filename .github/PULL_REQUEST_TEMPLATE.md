## Resumen
- **Pantalla / Módulo:** (ej. `UI-EMP-03`, `packages/services`, `packages/theme`)
- **Rama:** `feat/...` | `fix/...` | `chore/...`

## Checklist antes de pedir revisión
- [ ] El nombre de archivos de pantalla incluye su código (`UI-EMP-XX_`, `UI-TRAB-XX_`, `UI-ADM-XX_`).
- [ ] Ninguna pantalla importa archivos JSON de `mocks/` directamente (todo pasa por `@trabajos/services`).
- [ ] Los colores, tipografías y espaciados provienen de `@trabajos/theme` (sin valores hardcodeados).
- [ ] Al menos 1 integrante revisó y aprobó los cambios antes de hacer merge a `main`.
