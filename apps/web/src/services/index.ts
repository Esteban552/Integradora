/**
 * Punto único de acceso a datos para el Panel Web Administrador.
 * Las pantallas en `src/features/<modulo>/screens/` siempre importan desde aquí
 * o desde `@trabajos/services`. Nunca leen archivos JSON directamente.
 */
export * from '@trabajos/services';
