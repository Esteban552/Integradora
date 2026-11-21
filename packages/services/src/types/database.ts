/**
 * Tipos y enums alineados 1:1 con supabase/migrations/001_trabajos_temporales.sql (v2).
 *
 * NOTA (Sección 5): En Fase 1, al conectar con el proyecto real de Supabase,
 * los tipos de tablas/RPC se regenerarán con `supabase gen types typescript`
 * para mantener la base de datos como fuente única de verdad.
 */

export type UUID = string;

// --- 1. Enums del esquema SQL ---
export type UserRole = 'employer' | 'worker' | 'admin';
export type AccountStatus = 'active' | 'warned' | 'suspended' | 'blocked' | 'soft_deleted';
export type JobCategory = 'limpieza' | 'pintura' | 'jardineria' | 'mudanzas' | 'eventos' | 'otros';

export type JobStatus =
  | 'published'
  | 'has_applications'
  | 'assigned'
  | 'arrival_registered'
  | 'in_progress'
  | 'completion_requested'
  | 'in_claim'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
export type CompletionMethod = 'with_code' | 'without_code';
export type VerifyCodeResult = 'ok' | 'invalid' | 'blocked' | 'expired';
export type RenewCodeResult = 'renewed' | 'without_code';

export type PaymentStatus =
  | 'not_started'
  | 'payment_pending'
  | 'confirmed'
  | 'failed'
  | 'in_claim'
  | 'transfer_pending'
  | 'transfer_failed'
  | 'transferred'
  | 'partial_settlement_pending'
  | 'partial_settlement_failed'
  | 'partial_settlement_completed'
  | 'refund_failed'
  | 'refunded'
  | 'cancelled';

export type PaymentOperationType = 'charge' | 'transfer' | 'refund';
export type PaymentOperationStatus = 'pending' | 'succeeded' | 'failed';

export type CaseType = 'ticket' | 'claim' | 'report';
export type CaseStatus =
  | 'open'
  | 'pending'
  | 'in_review'
  | 'resolved'
  | 'closed'
  | 'dismissed'
  | 'attended';
export type CaseDecision = 'transfer_full' | 'refund_full' | 'partial';
export type CaseSource = 'user' | 'system';
export type TicketCategory =
  | 'account'
  | 'publication'
  | 'application'
  | 'job'
  | 'payment'
  | 'technical';
export type ReportTarget = 'user' | 'job' | 'application' | 'review' | 'chat_message';

export type ModerationStatus = 'visible' | 'hidden' | 'removed';
export type SanctionType =
  | 'warning'
  | 'suspension_1d'
  | 'suspension_7d'
  | 'suspension_30d'
  | 'permanent_block'
  | 'soft_delete';
export type AttachmentKind = 'job_photo' | 'completion_evidence' | 'case_evidence';

export type SearchRadiusKm = 5 | 10 | 25 | 50;
export type DistanceRange = 'lt_5' | '5_10' | '10_25' | '25_50' | 'gt_50';
export type LegalDocument = 'terms' | 'privacy';

// --- 2. Entidades principales ---
export interface Profile {
  id: UUID;
  role: UserRole;
  full_name: string;
  phone: string;
  birth_date: string; // YYYY-MM-DD
  photo_path: string | null;
  skills: string | null;
  availability: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  account_status: AccountStatus;
  suspended_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerLocation {
  worker_id: UUID;
  latitude: number;
  longitude: number;
  search_radius_km: SearchRadiusKm;
  recent_changes: string[];
  updated_at: string;
}

export interface Job {
  id: UUID;
  employer_id: UUID;
  title: string;
  description: string;
  category: JobCategory;
  fixed_payment_mxn: number;
  job_date: string;
  start_time: string;
  end_time: string;
  start_at: string;
  end_at: string;
  conditions: string | null;
  neighborhood: string;
  status: JobStatus;
  moderation_status: ModerationStatus;
  selected_worker_id: UUID | null;
  selection_round: number;
  selection_expires_at: string | null;
  assigned_at: string | null;
  arrived_at: string | null;
  completion_method: CompletionMethod | null;
  completion_requested_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobPrivate {
  job_id: UUID;
  exact_address: string;
  exact_latitude: number;
  exact_longitude: number;
}

export interface JobCompletion {
  job_id: UUID;
  code: string;
  code_expires_at: string;
  attempts: number;
  renewals: number;
  used_at: string | null;
}

export interface JobApplication {
  id: UUID;
  job_id: UUID;
  worker_id: UUID;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: UUID;
  job_id: UUID;
  employer_id: UUID;
  worker_id: UUID;
  job_amount_mxn: number;
  platform_fee_mxn: number;
  total_charged_mxn: number;
  stripe_payment_intent_id: string | null;
  status: PaymentStatus;
  payment_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface StripeEvent {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  received_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export interface ChatMessage {
  id: UUID;
  job_id: UUID;
  worker_id: UUID;
  sender_id: UUID;
  body: string;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface CaseRecord {
  id: UUID;
  case_type: CaseType;
  status: CaseStatus;
  source: CaseSource;
  reporter_id: UUID | null;
  job_id: UUID | null;
  reported_user_id: UUID | null;
  target_type: ReportTarget | null;
  target_id: UUID | null;
  ticket_category: TicketCategory | null;
  description: string;
  decision: CaseDecision | null;
  approved_transfer_amount: number | null;
  approved_refund_amount: number | null;
  resolution_notes: string | null;
  assigned_admin_id: UUID | null;
  resolved_at: string | null;
  closed_at: string | null;
  auto_close_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseMessage {
  id: UUID;
  case_id: UUID;
  author_id: UUID;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface Review {
  id: UUID;
  job_id: UUID;
  reviewer_id: UUID;
  reviewee_id: UUID;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface NotificationItem {
  id: UUID;
  user_id: UUID;
  event_type: string;
  target_screen: string | null;
  target_id: UUID | null;
  read_at: string | null;
  created_at: string;
}

// --- 3. Retornos específicos de RPC (Sección 5.4) ---
export interface SearchJobRow {
  job_id: UUID;
  title: string;
  category: JobCategory;
  fixed_payment_mxn: number;
  job_date: string;
  start_time: string;
  end_time: string;
  neighborhood: string;
  distance_range: DistanceRange;
  out_of_range: boolean;
  employer_id: UUID;
  employer_name: string;
  employer_rating: number | null;
  employer_review_count: number;
}

export interface JobPublicDetail extends SearchJobRow {
  description: string;
  conditions: string | null;
  status: JobStatus;
  already_applied: boolean;
}

export interface ApplicantPublicProfile {
  application_id: UUID;
  worker_id: UUID;
  status: ApplicationStatus;
  applied_at: string;
  full_name: string;
  photo_path: string | null;
  skills: string | null;
  availability: string | null;
  rating: number | null;
  review_count: number;
}

export interface CounterpartContact {
  full_name: string;
  phone: string;
}
