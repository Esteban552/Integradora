import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { applicationsService, type Job, type Profile, type Review, type ApplicantPublicProfile } from '@trabajos/services';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  StatusBadge,
} from '@trabajos/ui';
import { theme } from '../../../theme';
import { APPLICATION_STATUS_META, appliedLabel, formatRating, initials } from '../jobDetail';
import { formatDate, formatMxn, formatTime } from '../jobPresentation';
import {
  SELECTION_BLOCK_MESSAGE,
  canReject,
  rejectConfirm,
  rejectErrorMessage,
  ratingLabel,
  reviewDateLabel,
  selectConfirm,
  selectErrorMessage,
  selectionBlock,
} from '../jobSelection';
import { useApplicantProfile } from '../useApplicantProfile';

export interface EmployerApplicantScreenProps {
  employer: Profile;
  jobId: string;
  applicationId: string;
  /** Volver al detalle de la publicación (UI-EMP-04). */
  onBack: () => void;
  /** Se seleccionó al candidato: sigue UI-EMP-06 (trabajo asignado). */
  onSelected: (jobId: string) => void;
  /** Se rechazó la postulación: se vuelve al detalle para ver la lista actualizada. */
  onRejected: (jobId: string) => void;
}

/** UI-EMP-05 — Perfil del candidato postulado y selección (RF-12, FL-EMP-05). */
export function EmployerApplicantScreen({
  employer,
  jobId,
  applicationId,
  onBack,
  onSelected,
  onRejected,
}: EmployerApplicantScreenProps) {
  const { state, reload } = useApplicantProfile(employer.id, jobId, applicationId);
  const [busy, setBusy] = useState<'select' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const back = <Button title="Volver" variant="ghost" onPress={onBack} accessibilityLabel="Volver al detalle" />;

  if (state.status !== 'ready') {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenHeader title="Perfil del postulante" right={back} />
          {state.status === 'loading' ? (
            <LoadingState label="Cargando el perfil..." />
          ) : state.status === 'error' ? (
            <ErrorState message={state.message} onRetry={reload} />
          ) : (
            <EmptyState
              title="No encontramos esta postulación"
              description="Puede que ya no exista o que no sea de tu publicación."
              actionLabel="Volver"
              onAction={onBack}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { job, applicant, reviews } = state;
  const block = selectionBlock(job, applicant);
  const rejectable = canReject(job, applicant);
  const status = APPLICATION_STATUS_META[applicant.status];

  const doSelect = async () => {
    setError(null);
    setBusy('select');
    try {
      await applicationsService.selectWorker(applicant.application_id);
      onSelected(job.id);
    } catch (err) {
      setError(selectErrorMessage(err));
      setBusy(null);
    }
  };

  const doReject = async () => {
    setError(null);
    setBusy('reject');
    try {
      await applicationsService.rejectApplication(applicant.application_id);
      onRejected(job.id);
    } catch (err) {
      setError(rejectErrorMessage(err));
      setBusy(null);
    }
  };

  const askSelect = () => {
    const c = selectConfirm(applicant.full_name);
    Alert.alert(c.title, c.message, [
      { text: c.dismiss, style: 'cancel' },
      { text: c.confirm, onPress: () => void doSelect() },
    ]);
  };

  const askReject = () => {
    const c = rejectConfirm(applicant.full_name);
    Alert.alert(c.title, c.message, [
      { text: c.dismiss, style: 'cancel' },
      { text: c.confirm, style: 'destructive', onPress: () => void doReject() },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Perfil del postulante" right={back} />

        <JobContext job={job} />

        <ProfileCard applicant={applicant} statusLabel={status.label} statusTone={status.tone} />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Evaluaciones
          </Text>
          <Text style={styles.sectionCount}>{formatRating(applicant.rating, applicant.review_count)}</Text>
        </View>

        {reviews.length === 0 ? (
          <Card>
            <Text style={styles.muted}>Este trabajador aún no tiene reseñas.</Text>
          </Card>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}

        {block ? <Banner tone="info" message={SELECTION_BLOCK_MESSAGE[block]} /> : null}
        {error ? <Banner tone="error" message={error} /> : null}

        {block === null || rejectable ? (
          <View style={styles.actions}>
            {block === null ? (
              <Button
                title="Seleccionar candidato"
                onPress={askSelect}
                loading={busy === 'select'}
                disabled={busy === 'reject'}
                fullWidth
              />
            ) : null}
            {rejectable ? (
              <Button
                title="Rechazar postulación"
                variant="secondary"
                onPress={askReject}
                loading={busy === 'reject'}
                disabled={busy === 'select'}
                fullWidth
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function JobContext({ job }: { job: Job }) {
  return (
    <Card style={styles.jobCard}>
      <Text style={styles.label}>Trabajo</Text>
      <Text style={styles.jobTitle}>{job.title}</Text>
      <Text style={styles.muted}>
        {`${formatDate(job.job_date)}, ${formatTime(job.start_time)} - ${formatTime(job.end_time)} | ${formatMxn(job.fixed_payment_mxn)}`}
      </Text>
    </Card>
  );
}

function ProfileCard({
  applicant,
  statusLabel,
  statusTone,
}: {
  applicant: ApplicantPublicProfile;
  statusLabel: string;
  statusTone: React.ComponentProps<typeof StatusBadge>['tone'];
}) {
  return (
    <Card style={styles.profileCard}>
      <View style={styles.profileTop}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>{initials(applicant.full_name)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{applicant.full_name}</Text>
          <StatusBadge label={statusLabel} tone={statusTone} />
        </View>
      </View>
      <Field label="Habilidades" value={applicant.skills ?? 'No indicadas'} />
      <Field label="Disponibilidad" value={applicant.availability ?? 'No indicada'} />
      <Field label="Postulación" value={appliedLabel(applicant.applied_at)} />
      <Text style={styles.hint}>
        El teléfono y la ubicación exacta del trabajador se muestran solo después de seleccionarlo.
      </Text>
    </Card>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <Text style={styles.reviewRating}>{ratingLabel(review.rating)}</Text>
        <Text style={styles.hint}>{reviewDateLabel(review.created_at)}</Text>
      </View>
      {review.comment ? <Text style={styles.value}>{review.comment}</Text> : <Text style={styles.muted}>Sin comentario.</Text>}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const { colors, radius, spacing, typography } = theme;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral.background },
  content: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] },
  jobCard: { gap: spacing[1] },
  jobTitle: { fontSize: typography.fontSize.md, fontWeight: '600', color: colors.neutral.textPrimary },
  profileCard: { gap: spacing[3] },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  profileInfo: { flex: 1, gap: spacing[2] },
  name: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.neutral.textPrimary },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.brand.primary },
  field: { gap: 2 },
  label: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.neutral.textMuted },
  value: { fontSize: typography.fontSize.sm, color: colors.neutral.textPrimary },
  muted: { fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary },
  hint: { fontSize: typography.fontSize.xs, color: colors.neutral.textMuted },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing[3] },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.neutral.textPrimary },
  sectionCount: { flexShrink: 1, fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary, textAlign: 'right' },
  reviewCard: { gap: spacing[2] },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewRating: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.neutral.textPrimary },
  actions: { gap: spacing[3] },
});
