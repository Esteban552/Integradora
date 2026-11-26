import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  jobsService,
  type ApplicantPublicProfile,
  type Job,
  type JobPrivate,
  type Profile,
} from '@trabajos/services';
import {
  Banner,
  Button,
  Card,
  CategoryChip,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  StatusBadge,
} from '@trabajos/ui';
import { theme } from '../../../theme';
import {
  APPLICATION_STATUS_META,
  CANCEL_CONFIRM,
  activeApplicantsCount,
  appliedLabel,
  canCancelJob,
  canEditJob,
  cancelErrorMessage,
  detailNotice,
  formatRating,
  initials,
  isReviewable,
} from '../jobDetail';
import { feeBreakdown } from '../jobForm';
import {
  CATEGORY_LABEL,
  JOB_STATUS_META,
  applicantsLabel,
  formatDate,
  formatMxn,
  formatTime,
} from '../jobPresentation';
import { useJobDetail } from '../useJobDetail';

export interface EmployerJobDetailScreenProps {
  employer: Profile;
  jobId: string;
  onBack: () => void;
  /** Ir a UI-EMP-03 en modo edición. */
  onEdit: (jobId: string) => void;
  /** Ir a UI-EMP-05 (perfil del postulante y selección). */
  onReviewApplicant: (jobId: string, applicationId: string) => void;
  /** La publicación se canceló correctamente. */
  onCancelled: () => void;
}

/** UI-EMP-04 — Detalle de la publicación y postulantes (RF-05, RF-06, RF-11). */
export function EmployerJobDetailScreen({
  employer,
  jobId,
  onBack,
  onEdit,
  onReviewApplicant,
  onCancelled,
}: EmployerJobDetailScreenProps) {
  const { state, reload } = useJobDetail(employer.id, jobId);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const askCancel = () => {
    Alert.alert(CANCEL_CONFIRM.title, CANCEL_CONFIRM.message, [
      { text: CANCEL_CONFIRM.dismiss, style: 'cancel' },
      { text: CANCEL_CONFIRM.confirm, style: 'destructive', onPress: () => void doCancel() },
    ]);
  };

  const doCancel = async () => {
    setCancelError(null);
    setCancelling(true);
    try {
      await jobsService.cancelJob(jobId);
      onCancelled();
    } catch (err) {
      setCancelError(cancelErrorMessage(err));
      setCancelling(false);
    }
  };

  const back = <Button title="Volver" variant="ghost" onPress={onBack} accessibilityLabel="Volver a mis publicaciones" />;

  if (state.status !== 'ready') {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenHeader title="Detalle de la publicación" right={back} />
          {state.status === 'loading' ? (
            <LoadingState label="Cargando la publicación..." />
          ) : state.status === 'error' ? (
            <ErrorState message={state.message} onRetry={reload} />
          ) : (
            <EmptyState
              title="No encontramos esta publicación"
              description="Puede que ya no exista o que no sea tuya."
              actionLabel="Volver"
              onAction={onBack}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { job, privateData, applicants } = state;
  const meta = JOB_STATUS_META[job.status];
  const activeCount = activeApplicantsCount(applicants);
  const notice = detailNotice(job, activeCount);
  const editable = canEditJob(job);
  const cancellable = canCancelJob(job);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Detalle de la publicación" right={back} />

        {notice ? <Banner tone={notice.tone} message={notice.message} /> : null}

        <JobInfo job={job} privateData={privateData} statusLabel={meta.label} statusTone={meta.tone} />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Postulantes
          </Text>
          <Text style={styles.sectionCount}>{applicantsLabel(activeCount)}</Text>
        </View>

        {applicants.length === 0 ? (
          <Card>
            <Text style={styles.muted}>Todavía nadie se ha postulado a este trabajo.</Text>
          </Card>
        ) : (
          applicants.map((a) => (
            <ApplicantCard
              key={a.application_id}
              applicant={a}
              onReview={() => onReviewApplicant(job.id, a.application_id)}
            />
          ))
        )}

        {cancelError ? <Banner tone="error" message={cancelError} /> : null}

        {editable || cancellable ? (
          <View style={styles.actions}>
            {editable ? (
              <Button
                title="Editar publicación"
                variant="secondary"
                onPress={() => onEdit(job.id)}
                disabled={cancelling}
                fullWidth
              />
            ) : null}
            {cancellable ? (
              <Button
                title="Cancelar publicación"
                variant="danger"
                onPress={askCancel}
                loading={cancelling}
                fullWidth
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function JobInfo({
  job,
  privateData,
  statusLabel,
  statusTone,
}: {
  job: Job;
  privateData: JobPrivate | null;
  statusLabel: string;
  statusTone: React.ComponentProps<typeof StatusBadge>['tone'];
}) {
  const fee = feeBreakdown(job.fixed_payment_mxn);
  return (
    <Card style={styles.card}>
      <View style={styles.chips}>
        <CategoryChip label={CATEGORY_LABEL[job.category]} />
        <StatusBadge label={statusLabel} tone={statusTone} />
      </View>
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.payment}>{formatMxn(job.fixed_payment_mxn)}</Text>
      <Text style={styles.muted}>
        {`Comisión de plataforma 10 %: ${formatMxn(fee.fee)}. Total que pagas al seleccionar: ${formatMxn(fee.total)}.`}
      </Text>

      <Field label="Fecha" value={formatDate(job.job_date)} />
      <Field label="Horario" value={`${formatTime(job.start_time)} - ${formatTime(job.end_time)}`} />
      <Field label="Colonia o localidad" value={job.neighborhood} />
      {privateData ? (
        <Field
          label="Dirección exacta"
          value={privateData.exact_address}
          hint="Solo la ven tú y el trabajador seleccionado."
        />
      ) : null}
      <Field label="Descripción" value={job.description} />
      {job.conditions ? <Field label="Condiciones" value={job.conditions} /> : null}
    </Card>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function ApplicantCard({ applicant, onReview }: { applicant: ApplicantPublicProfile; onReview: () => void }) {
  const meta = APPLICATION_STATUS_META[applicant.status];
  return (
    <Card style={styles.applicant}>
      <View style={styles.applicantTop}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>{initials(applicant.full_name)}</Text>
        </View>
        <View style={styles.applicantInfo}>
          <Text style={styles.applicantName}>{applicant.full_name}</Text>
          <Text style={styles.muted}>{formatRating(applicant.rating, applicant.review_count)}</Text>
        </View>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </View>
      {applicant.skills ? <Text style={styles.value}>{applicant.skills}</Text> : null}
      {applicant.availability ? <Text style={styles.muted}>{applicant.availability}</Text> : null}
      <Text style={styles.hint}>{appliedLabel(applicant.applied_at)}</Text>
      {isReviewable(applicant) ? <Button title="Revisar perfil" variant="secondary" onPress={onReview} fullWidth /> : null}
    </Card>
  );
}

const { colors, radius, spacing, typography } = theme;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral.background },
  content: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] },
  card: { gap: spacing[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[2] },
  title: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.neutral.textPrimary },
  payment: { fontSize: typography.fontSize['2xl'], fontWeight: '700', color: colors.brand.primary },
  field: { gap: 2 },
  label: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.neutral.textMuted },
  value: { fontSize: typography.fontSize.sm, color: colors.neutral.textPrimary },
  hint: { fontSize: typography.fontSize.xs, color: colors.neutral.textMuted },
  muted: { fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.neutral.textPrimary },
  sectionCount: { fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary },
  applicant: { gap: spacing[2] },
  applicantTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  applicantInfo: { flex: 1, gap: 2 },
  applicantName: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.neutral.textPrimary },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.brand.primary },
  actions: { gap: spacing[3] },
});
