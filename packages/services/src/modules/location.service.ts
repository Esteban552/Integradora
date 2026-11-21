import { callRpc, getServiceConfig } from '../config';
import jobsData from '../mocks/jobs.json';
import type { SearchRadiusKm, UUID, WorkerLocation } from '../types/database';

/**
 * Servicio de ubicación de referencia del trabajador (RF-08, sin GPS).
 * RPC sección 5.4: save_worker_location(p_lat, p_lng, p_radius).
 */
export const locationService = {
  async getWorkerLocation(workerId: UUID): Promise<WorkerLocation | null> {
    if (getServiceConfig().dataSource === 'mock') {
      const list = jobsData.worker_locations as WorkerLocation[];
      return list.find((l) => l.worker_id === workerId) ?? null;
    }
    // Fase 1: SELECT * FROM worker_locations WHERE worker_id = auth.uid() (RLS)
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async saveWorkerLocation(
    latitude: number,
    longitude: number,
    radiusKm: SearchRadiusKm = 10
  ): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('save_worker_location', {
      p_lat: latitude,
      p_lng: longitude,
      p_radius: radiusKm,
    });
  },
};
