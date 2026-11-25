/**
 * Punto único de entrada para la capa de servicios (@trabajos/services).
 *
 * REGLA: Las pantallas de apps/employer, apps/worker y apps/web SOLO importan desde aquí
 * (o desde su re-exportación local `src/services`). Nunca leen JSON directamente.
 */
export { configureServices, getServiceConfig } from './config';
export type { DataSource, ServiceConfig } from './config';

export { authService } from './modules/auth.service';
export { locationService } from './modules/location.service';
export { jobsService } from './modules/jobs.service';
export type { SaveJobParams, SearchJobsParams } from './modules/jobs.service';
export { applicationsService } from './modules/applications.service';
export { executionService } from './modules/execution.service';
export { paymentsService } from './modules/payments.service';
export { chatService } from './modules/chat.service';
export { casesService } from './modules/cases.service';
export { reviewsService } from './modules/reviews.service';
export { notificationsService } from './modules/notifications.service';
export { adminService } from './modules/admin.service';
export { attachmentsService } from './modules/attachments.service';
export type { UploadPhotoInput } from './modules/attachments.service';

export type * from './types/database';
