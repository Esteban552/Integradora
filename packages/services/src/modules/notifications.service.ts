import { getServiceConfig } from '../config';
import notificationsMock from '../mocks/notifications.json';
import type { NotificationItem, UUID } from '../types/database';

/**
 * Servicio de notificaciones y tokens push (UI-TRAB-14 / reutilizable en Empleador).
 * En Fase 1 usa SELECT/UPDATE (read_at) en notifications e INSERT/DELETE en device_tokens (RLS).
 */
export const notificationsService = {
  async getNotifications(userId: UUID): Promise<NotificationItem[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return (notificationsMock as NotificationItem[]).filter((n) => n.user_id === userId);
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async markAsRead(_notificationId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async registerDeviceToken(_token: string, _platform: 'android' | 'ios' = 'android'): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },
};
