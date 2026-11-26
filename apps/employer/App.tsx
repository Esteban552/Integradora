import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Profile } from '@trabajos/services';
import { Button } from '@trabajos/ui';
import { EmployerAuthScreen } from './src/features/auth';
import { EmployerFeedScreen, EmployerJobDetailScreen, EmployerJobFormScreen } from './src/features/jobs';
import { theme } from './src/theme';

type Route =
  | { name: 'feed' }
  | { name: 'form'; jobId: string | null }
  | { name: 'detail'; jobId: string }
  | { name: 'pending'; label: string };

/**
 * Fase 1: UI-EMP-01 a UI-EMP-04 conectadas. La navegación completa (src/navigation/)
 * se agrega cuando se defina la librería de navegación del equipo; mientras tanto
 * las pantallas que faltan muestran un marcador con botón para volver.
 */
export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [route, setRoute] = useState<Route>({ name: 'feed' });

  if (!profile) {
    return (
      <>
        <StatusBar style="dark" />
        <EmployerAuthScreen onAuthenticated={setProfile} />
      </>
    );
  }

  if (route.name === 'pending') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <View style={styles.pending}>
          <Text style={styles.text}>{route.label} pendiente.</Text>
          <Button title="Volver" onPress={() => setRoute({ name: 'feed' })} />
        </View>
      </SafeAreaView>
    );
  }

  if (route.name === 'form') {
    return (
      <>
        <StatusBar style="dark" />
        <EmployerJobFormScreen
          employer={profile}
          jobId={route.jobId}
          onCancel={() => setRoute(route.jobId ? { name: 'detail', jobId: route.jobId } : { name: 'feed' })}
          onDone={(id) => setRoute({ name: 'detail', jobId: id })}
        />
      </>
    );
  }

  if (route.name === 'detail') {
    return (
      <>
        <StatusBar style="dark" />
        <EmployerJobDetailScreen
          employer={profile}
          jobId={route.jobId}
          onBack={() => setRoute({ name: 'feed' })}
          onEdit={(id) => setRoute({ name: 'form', jobId: id })}
          onReviewApplicant={() => setRoute({ name: 'pending', label: 'UI-EMP-05 (perfil del postulante y selección)' })}
          onCancelled={() => setRoute({ name: 'feed' })}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <EmployerFeedScreen
        employer={profile}
        onCreate={() => setRoute({ name: 'form', jobId: null })}
        onOpenJob={(id, destination) =>
          setRoute(destination === 'UI-EMP-04' ? { name: 'detail', jobId: id } : { name: 'pending', label: destination })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.neutral.background },
  pending: { padding: theme.spacing[4], gap: theme.spacing[4] },
  text: { fontSize: theme.typography.fontSize.md, color: theme.colors.neutral.textPrimary },
});
