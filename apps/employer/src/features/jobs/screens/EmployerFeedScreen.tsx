import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, View } from 'react-native';
import type { Profile } from '@trabajos/services';
import {
  Button,
  EmptyState,
  ErrorState,
  JobCard,
  LoadingState,
  ScreenHeader,
  SegmentedTabs,
} from '@trabajos/ui';
import { theme } from '../../../theme';
import {
  CATEGORY_LABEL,
  FEED_FILTERS,
  JOB_STATUS_META,
  applicantsLabel,
  destinationFor,
  filterJobs,
  formatDate,
  formatMxn,
  formatTime,
  type FeedFilter,
  type JobDestination,
} from '../jobPresentation';
import { useEmployerJobs } from '../useEmployerJobs';

export interface EmployerFeedScreenProps {
  employer: Profile;
  /** Ir a UI-EMP-03 (crear publicación). */
  onCreate: () => void;
  /** Abrir un trabajo en la pantalla que le corresponde según su estado. */
  onOpenJob: (jobId: string, destination: JobDestination) => void;
}

/** UI-EMP-02 — Mis publicaciones (RF-04, RF-11). */
export function EmployerFeedScreen({ employer, onCreate, onOpenJob }: EmployerFeedScreenProps) {
  const { state, refreshing, refresh, retry } = useEmployerJobs(employer.id);
  const [filter, setFilter] = useState<FeedFilter>('all');

  const jobs = useMemo(() => (state.status === 'ready' ? filterJobs(state.jobs, filter) : []), [state, filter]);

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        title="Mis publicaciones"
        subtitle={employer.full_name}
        right={<Button title="Crear" onPress={onCreate} accessibilityLabel="Crear publicación" />}
      />
      <SegmentedTabs activeId={filter} onChange={setFilter} options={FEED_FILTERS} />
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={Separator}
        refreshControl={
          state.status === 'ready' ? <RefreshControl refreshing={refreshing} onRefresh={refresh} /> : undefined
        }
        renderItem={({ item }) => {
          const meta = JOB_STATUS_META[item.status];
          return (
            <JobCard
              categoryLabel={CATEGORY_LABEL[item.category]}
              statusLabel={meta.label}
              statusTone={meta.tone}
              title={item.title}
              paymentLabel={formatMxn(item.fixed_payment_mxn)}
              dateLabel={formatDate(item.job_date)}
              timeLabel={`${formatTime(item.start_time)} - ${formatTime(item.end_time)}`}
              neighborhood={item.neighborhood}
              footerRight={applicantsLabel(item.applicants_count)}
              onPress={() => onOpenJob(item.id, destinationFor(item.status))}
            />
          );
        }}
        ListEmptyComponent={
          state.status === 'loading' ? (
            <LoadingState label="Cargando tus publicaciones..." />
          ) : state.status === 'error' ? (
            <ErrorState message={state.message} onRetry={retry} />
          ) : (
            <EmptyState
              title={filter === 'all' ? 'Aún no tienes publicaciones' : 'Sin publicaciones en esta vista'}
              description="Publica un trabajo temporal con pago fijo en MXN y recibe postulaciones."
              actionLabel="Crear publicación"
              onAction={onCreate}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.neutral.background },
  content: { padding: theme.spacing[4], paddingBottom: theme.spacing[10] },
  header: { gap: theme.spacing[4], marginBottom: theme.spacing[4] },
  sep: { height: theme.spacing[3] },
});
