import { getServiceConfig } from '../config';
import chatMock from '../mocks/chat.json';
import type { ChatMessage, UUID } from '../types/database';

/**
 * Servicio de chat en tiempo real (RF-14, aislado por hilo job_id + worker_id).
 * En Fase 1 usa SELECT/INSERT permitidos por RLS + suscripción Supabase Realtime.
 */
export const chatService = {
  async getMessages(jobId: UUID, workerId: UUID): Promise<ChatMessage[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return (chatMock as ChatMessage[]).filter(
        (m) => m.job_id === jobId && m.worker_id === workerId
      );
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async sendMessage(jobId: UUID, workerId: UUID, senderId: UUID, body: string): Promise<ChatMessage> {
    if (getServiceConfig().dataSource === 'mock') {
      return {
        id: 'ffff1111-1111-4111-8111-999999999999',
        job_id: jobId,
        worker_id: workerId,
        sender_id: senderId,
        body,
        moderation_status: 'visible',
        created_at: new Date().toISOString(),
      };
    }
    // Fase 1: INSERT INTO public.chat_messages (job_id, worker_id, sender_id, body) (RLS)
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },
};
