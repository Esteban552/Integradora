import { callRpc, getServiceConfig } from '../config';
import reviewsMock from '../mocks/reviews.json';
import type { Review, UUID } from '../types/database';

/**
 * Servicio de evaluaciones y reseñas (RF-31).
 * Pendiente en sección 5.4: submit_review.
 */
export const reviewsService = {
  async getReviewsForUser(revieweeId: UUID): Promise<Review[]> {
    if (getServiceConfig().dataSource === 'mock') {
      return (reviewsMock as Review[]).filter(
        (r) => r.reviewee_id === revieweeId && r.moderation_status === 'visible'
      );
    }
    throw new Error('ERR_NOT_IMPLEMENTED_SUPABASE_CLIENT');
  },

  /** TODO(RPC pendiente en 5.4): submit_review */
  async submitReview(
    jobId: UUID,
    revieweeId: UUID,
    rating: 1 | 2 | 3 | 4 | 5,
    comment?: string
  ): Promise<UUID> {
    if (getServiceConfig().dataSource === 'mock') {
      return '99991111-1111-4111-8111-999999999999';
    }
    return callRpc<UUID>('submit_review', {
      p_job: jobId,
      p_reviewee: revieweeId,
      p_rating: rating,
      p_comment: comment ?? null,
    });
  },
};
