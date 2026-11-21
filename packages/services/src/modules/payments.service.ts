import { callRpc, getServiceConfig } from '../config';
import paymentsMock from '../mocks/payments.json';
import stripeEventsMock from '../mocks/stripe_events.json';
import type { Payment, StripeEvent, UUID } from '../types/database';

/**
 * Servicio de pagos (Escrow Stripe Connect) y monitoreo financiero.
 * Nota: Las Edge Functions de Stripe (alta Connect, cobro, transferencia y reintentos)
 * se conectarán aquí en Fase 1 sin cambiar la firma usada por las pantallas.
 */
export const paymentsService = {
  async getPaymentsForUser(userId: UUID): Promise<Payment[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return (paymentsMock as Payment[]).filter(
        (p) => p.employer_id === userId || p.worker_id === userId
      );
    }
    // Fase 1: SELECT * FROM payments (RLS por employer_id / worker_id)
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  async getPaymentByJob(jobId: UUID): Promise<Payment | null> {
    if (getServiceConfig().dataSource === 'mock') {
      return (paymentsMock as Payment[]).find((p) => p.job_id === jobId) ?? null;
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /** Solo administrador (UI-ADM-07). */
  async getStripeEvents(): Promise<StripeEvent[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return stripeEventsMock as StripeEvent[];
    }
    // Fase 1: SELECT * FROM stripe_events (RLS solo admin)
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /** TODO(Edge Function pendiente en 6.2): genera link de onboarding Stripe Connect. */
  async createStripeOnboardingLink(): Promise<{ url: string }> {
    if (getServiceConfig().dataSource === 'mock') {
      return { url: 'https://connect.stripe.com/setup/e/mock_onboarding_link' };
    }
    return callRpc<{ url: string }>('create_stripe_onboarding_link');
  },

  /** TODO(Edge Function pendiente en 6.2): reintento manual de operación fallida (UI-ADM-07). */
  async retryPaymentOperation(paymentId: UUID): Promise<void> {
    if (getServiceConfig().dataSource === 'mock') {
      return;
    }
    return callRpc<void>('retry_payment_operation', { p_payment: paymentId });
  },
};
