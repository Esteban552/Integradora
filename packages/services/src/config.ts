export type DataSource = 'mock' | 'supabase';

/**
 * Interruptor único de origen de datos.
 * - Fase 0: 'mock' (lee los JSON internos de packages/services/src/mocks/).
 * - Fase 1+: 'supabase' (llama a supabase.rpc(...) y consultas RLS definidas en 001_trabajos_temporales.sql).
 *
 * REGLA ESTRICTA: Ninguna pantalla en apps/mobile o apps/web puede importar JSON de mocks/ directamente.
 */
export interface ServiceConfig {
  dataSource: DataSource;
  mockLatencyMs: number;
  supabaseRpc?: <TResult = unknown>(
    fnName: string,
    params?: Record<string, unknown>
  ) => Promise<TResult>;
}

const config: ServiceConfig = {
  dataSource: 'mock',
  mockLatencyMs: 0,
};

export function configureServices(partial: Partial<ServiceConfig>): void {
  Object.assign(config, partial);
}

export function getServiceConfig(): Readonly<ServiceConfig> {
  return config;
}

/**
 * Helper interno para invocar una RPC de Supabase cuando dataSource === 'supabase'.
 * En Fase 1 se inyecta el cliente oficial mediante configureServices({ dataSource: 'supabase', supabaseRpc }).
 */
export async function callRpc<TResult>(
  rpcName: string,
  params: Record<string, unknown> = {}
): Promise<TResult> {
  if (!config.supabaseRpc) {
    throw new Error(
      `ERR_SUPABASE_NOT_CONFIGURED: Configure supabaseRpc antes de llamar a la RPC "${rpcName}".`
    );
  }
  return config.supabaseRpc<TResult>(rpcName, params);
}
