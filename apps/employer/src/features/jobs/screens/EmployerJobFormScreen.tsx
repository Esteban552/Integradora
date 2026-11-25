import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { attachmentsService, jobsService, type JobCategory, type Profile } from '@trabajos/services';
import {
  Banner,
  Button,
  Card,
  ChipSelect,
  ErrorState,
  LoadingState,
  MapPinPicker,
  ScreenHeader,
  TextField,
} from '@trabajos/ui';
import { theme } from '../../../theme';
import { CATEGORY_LABEL, formatMxn } from '../jobPresentation';
import {
  CONDITIONS_MAX,
  DESCRIPTION_MAX,
  EMPTY_FORM,
  MAX_PHOTOS,
  PIN_BBOX,
  TITLE_MAX,
  feeBreakdown,
  hasErrors,
  maskDate,
  maskTime,
  parsePayment,
  quickDates,
  saveErrorMessage,
  toSaveParams,
  validateJobForm,
  valuesFromJob,
  type JobFormValues,
} from '../jobForm';
import { pickPhotos } from '../photoPicker';

export interface EmployerJobFormScreenProps {
  employer: Profile;
  /** Si se indica, la pantalla edita esa publicación (RF-06); si no, crea una nueva. */
  jobId?: string | null;
  /** Se llama al terminar de guardar, con el id del trabajo. */
  onDone: (jobId: string) => void;
  onCancel: () => void;
}

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; initial: JobFormValues };

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as JobCategory[]).map((id) => ({ id, label: CATEGORY_LABEL[id] }));

/** UI-EMP-03 — Crear o editar publicación (RF-05, RF-06). */
export function EmployerJobFormScreen({ employer, jobId, onDone, onCancel }: EmployerJobFormScreenProps) {
  const editing = Boolean(jobId);
  const [load, setLoad] = useState<Load>(editing ? { status: 'loading' } : { status: 'ready', initial: EMPTY_FORM });

  const loadExisting = useCallback(async () => {
    if (!jobId) return;
    setLoad({ status: 'loading' });
    try {
      const jobs = await jobsService.getEmployerJobs(employer.id);
      const job = jobs.find((j) => j.id === jobId);
      if (!job) throw new Error('ERR_NOT_FOUND');
      const priv = await jobsService.getJobPrivate(jobId);
      setLoad({ status: 'ready', initial: valuesFromJob(job, priv) });
    } catch {
      setLoad({ status: 'error' });
    }
  }, [employer.id, jobId]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  if (load.status === 'loading') {
    return (
      <SafeAreaView style={styles.root}>
        <LoadingState label="Cargando publicación..." />
      </SafeAreaView>
    );
  }
  if (load.status === 'error') {
    return (
      <SafeAreaView style={styles.root}>
        <ErrorState message="No se pudo cargar la publicación." onRetry={loadExisting} />
        <View style={styles.pad}>
          <Button title="Volver" variant="secondary" onPress={onCancel} />
        </View>
      </SafeAreaView>
    );
  }
  return <JobForm initial={load.initial} editing={editing} jobId={jobId ?? null} onDone={onDone} onCancel={onCancel} />;
}

interface JobFormProps {
  initial: JobFormValues;
  editing: boolean;
  jobId: string | null;
  onDone: (jobId: string) => void;
  onCancel: () => void;
}

function JobForm({ initial, editing, jobId, onDone, onCancel }: JobFormProps) {
  const [values, setValues] = useState<JobFormValues>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoNotes, setPhotoNotes] = useState<string[]>([]);
  const [uploadFailed, setUploadFailed] = useState<{ jobId: string; count: number } | null>(null);

  const set = <K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  const errors = useMemo(() => validateJobForm(values), [values]);
  const show = (field: keyof JobFormValues) => (submitted ? errors[field] ?? null : null);

  const payment = parsePayment(values.payment);
  const breakdown = payment !== null && payment >= 10 && payment <= 100000 ? feeBreakdown(payment) : null;
  const dates = useMemo(() => quickDates(), []);
  const activeDate = dates.find((d) => d.value === values.date)?.id ?? null;

  const addPhotos = async () => {
    setPhotoNotes([]);
    try {
      const { photos, rejected } = await pickPhotos(values.photos.length);
      if (photos.length) set('photos', [...values.photos, ...photos]);
      setPhotoNotes(rejected);
    } catch {
      setPhotoNotes(['No se pudo abrir la galería.']);
    }
  };

  const submit = async () => {
    setSubmitted(true);
    setSaveError(null);
    if (hasErrors(validateJobForm(values))) return;
    setSaving(true);
    try {
      const params = toSaveParams(values);
      let id: string;
      if (editing && jobId) {
        await jobsService.updateJob(jobId, params);
        id = jobId;
      } else {
        id = await jobsService.createJob(params);
      }
      let failed = 0;
      if (!editing) {
        for (const photo of values.photos) {
          try {
            await attachmentsService.uploadJobPhoto(id, photo);
          } catch {
            failed += 1;
          }
        }
      }
      if (failed > 0) {
        setUploadFailed({ jobId: id, count: failed });
      } else {
        onDone(id);
      }
    } catch (e) {
      setSaveError(saveErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (uploadFailed) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.pad}>
          <ScreenHeader title="Publicación creada" />
          <Banner
            tone="warning"
            message={`Tu publicación ya está visible, pero ${uploadFailed.count} foto(s) no se pudieron subir. Podrás agregarlas después.`}
          />
          <Button title="Continuar" onPress={() => onDone(uploadFailed.jobId)} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={editing ? 'Editar publicación' : 'Publicar trabajo'}
            subtitle="Pago fijo en MXN · ubicación privada"
            right={<Button title="Cancelar" variant="ghost" onPress={onCancel} accessibilityLabel="Cancelar y volver" />}
          />

          {submitted && hasErrors(errors) ? <Banner tone="error" message="Revisa los campos marcados." /> : null}
          {saveError ? <Banner tone="error" message={saveError} /> : null}

          <Card>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos generales</Text>
              <TextField
                label="Título del trabajo"
                value={values.title}
                onChangeText={(t) => set('title', t)}
                placeholder="Ej. Limpieza general de terraza"
                maxLength={TITLE_MAX}
                error={show('title')}
              />
              <ChipSelect
                label="Categoría"
                options={CATEGORY_OPTIONS}
                value={values.category}
                onChange={(c) => set('category', c)}
                error={show('category')}
              />
              <TextField
                label="Descripción de actividades"
                value={values.description}
                onChangeText={(t) => set('description', t)}
                placeholder="Detalla qué actividades incluye el trabajo"
                multiline
                maxLength={DESCRIPTION_MAX}
                error={show('description')}
              />
              <TextField
                label="Pago fijo al trabajador (MXN)"
                value={values.payment}
                onChangeText={(t) => set('payment', t)}
                keyboardType="decimal-pad"
                placeholder="750.00"
                helperText="Mínimo $10.00 y máximo $100,000.00."
                error={show('payment')}
              />
              {breakdown ? (
                <View style={styles.breakdown} accessibilityLabel="Desglose de cobro">
                  <Row label="Pago al trabajador" value={formatMxn(breakdown.jobAmount)} />
                  <Row label="Comisión de la plataforma (10 %)" value={formatMxn(breakdown.fee)} />
                  <Row label="Total que se te cobrará" value={formatMxn(breakdown.total)} strong />
                </View>
              ) : null}
            </View>
          </Card>

          <Card>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fecha, horario y condiciones</Text>
              <ChipSelect
                label="Fecha del trabajo"
                options={dates.map((d) => ({ id: d.id, label: d.label }))}
                value={activeDate}
                onChange={(id) => set('date', dates.find((d) => d.id === id)?.value ?? values.date)}
              />
              <TextField
                label="Fecha (AAAA-MM-DD)"
                value={values.date}
                onChangeText={(t) => set('date', maskDate(t))}
                keyboardType="number-pad"
                placeholder="2026-11-25"
                maxLength={10}
                error={show('date')}
              />
              <View style={styles.twoCols}>
                <View style={styles.col}>
                  <TextField
                    label="Hora de inicio"
                    value={values.startTime}
                    onChangeText={(t) => set('startTime', maskTime(t))}
                    keyboardType="number-pad"
                    placeholder="09:00"
                    maxLength={5}
                    helperText="Formato 24 h."
                    error={show('startTime')}
                  />
                </View>
                <View style={styles.col}>
                  <TextField
                    label="Hora de fin"
                    value={values.endTime}
                    onChangeText={(t) => set('endTime', maskTime(t))}
                    keyboardType="number-pad"
                    placeholder="13:00"
                    maxLength={5}
                    error={show('endTime')}
                  />
                </View>
              </View>
              <TextField
                label="Condiciones del trabajo (opcional)"
                value={values.conditions}
                onChangeText={(t) => set('conditions', t)}
                placeholder="Vestimenta, equipo, acceso"
                multiline
                maxLength={CONDITIONS_MAX}
                error={show('conditions')}
              />
            </View>
          </Card>

          <Card>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <TextField
                label="Colonia o localidad (pública)"
                value={values.neighborhood}
                onChangeText={(t) => set('neighborhood', t)}
                placeholder="Col. Centro"
                helperText="Los trabajadores la ven antes de postularse."
                error={show('neighborhood')}
              />
              <TextField
                label="Domicilio exacto o referencia (privado)"
                value={values.address}
                onChangeText={(t) => set('address', t)}
                placeholder="Calle, número y referencias"
                multiline
                helperText="Solo lo ve el trabajador que seleccionas."
                error={show('address')}
              />
              <MapPinPicker
                label="Punto exacto (privado)"
                value={values.pin}
                onChange={(p) => set('pin', p)}
                helperText={`Zona de referencia: ${PIN_BBOX.south.toFixed(2)}° a ${PIN_BBOX.north.toFixed(2)}° N.`}
                error={show('pin')}
              />
            </View>
          </Card>

          {!editing ? (
            <Card>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fotografías de apoyo (opcional)</Text>
                <Text style={styles.helper}>
                  Hasta {MAX_PHOTOS} fotos JPG o PNG de máximo 10 MB. Seleccionadas: {values.photos.length}/{MAX_PHOTOS}.
                </Text>
                {values.photos.length > 0 ? (
                  <View style={styles.photos}>
                    {values.photos.map((p, i) => (
                      <View key={`${p.uri}-${i}`} style={styles.photoBox}>
                        <Image source={{ uri: p.uri }} style={styles.photo} accessibilityLabel={`Foto ${i + 1}`} />
                        <Pressable
                          onPress={() => set('photos', values.photos.filter((_, k) => k !== i))}
                          accessibilityRole="button"
                          accessibilityLabel={`Quitar foto ${i + 1}`}
                          style={styles.remove}
                        >
                          <Text style={styles.removeText}>Quitar</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
                {photoNotes.map((n) => (
                  <Banner key={n} tone="warning" message={n} />
                ))}
                {show('photos') ? <Banner tone="error" message={show('photos') as string} /> : null}
                <Button
                  title="Agregar fotos"
                  variant="secondary"
                  onPress={addPhotos}
                  disabled={values.photos.length >= MAX_PHOTOS}
                />
              </View>
            </Card>
          ) : null}

          <Button
            title={editing ? 'Guardar cambios' : 'Publicar trabajo'}
            onPress={submit}
            loading={saving}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const { colors, radius, spacing, typography } = theme;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral.background },
  flex: { flex: 1 },
  pad: { padding: spacing[4], gap: spacing[4] },
  content: { padding: spacing[4], gap: spacing[4] },
  section: { gap: spacing[3] },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: '700', color: colors.neutral.textPrimary },
  helper: { fontSize: typography.fontSize.xs, color: colors.neutral.textSecondary },
  twoCols: { flexDirection: 'row', gap: spacing[3] },
  col: { flex: 1 },
  breakdown: {
    gap: spacing[1],
    padding: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.neutral.surfaceMuted,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2] },
  rowLabel: { flex: 1, fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary },
  rowValue: { fontSize: typography.fontSize.sm, color: colors.neutral.textPrimary },
  strong: { fontWeight: '700', color: colors.neutral.textPrimary },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  photoBox: { width: 88, gap: spacing[1] },
  photo: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.neutral.surfaceMuted },
  remove: { minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: typography.fontSize.xs, color: colors.semantic.danger, fontWeight: '600' },
});
