import React, { useState } from 'react';
import { type GestureResponderEvent, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { nativeTheme as theme } from '@trabajos/theme/native';

export interface MapPinValue {
  /** 0 = izquierda, 1 = derecha. */
  x: number;
  /** 0 = arriba, 1 = abajo. */
  y: number;
}

export interface MapPinPickerProps {
  label: string;
  value: MapPinValue | null;
  onChange: (value: MapPinValue) => void;
  /** Texto bajo el mapa (por ejemplo, la zona de referencia). */
  helperText?: string;
  error?: string | null;
  height?: number;
}

const { colors, radius, spacing, typography } = theme;
const GRID = 4;

/**
 * Lienzo esquemático para marcar un punto (sin geocodificación, S3).
 * Entrega posiciones relativas 0..1; la conversión a coordenadas la hace la pantalla.
 * Se sustituye por un mapa real cuando el equipo defina el proveedor.
 */
export function MapPinPicker({ label, value, onChange, helperText, error, height = 200 }: MapPinPickerProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const onPress = (e: GestureResponderEvent) => {
    if (size.w === 0 || size.h === 0) return;
    const x = Math.min(1, Math.max(0, e.nativeEvent.locationX / size.w));
    const y = Math.min(1, Math.max(0, e.nativeEvent.locationY / size.h));
    onChange({ x, y });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onLayout={onLayout}
        onPress={onPress}
        accessibilityRole="adjustable"
        accessibilityLabel={`${label}. ${value ? 'Punto marcado' : 'Sin punto marcado'}. Toca para colocar el punto.`}
        style={[styles.canvas, { height }, error ? styles.canvasError : null]}
      >
        {Array.from({ length: GRID - 1 }, (_, i) => (
          <React.Fragment key={i}>
            <View pointerEvents="none" style={[styles.lineV, { left: `${((i + 1) / GRID) * 100}%` }]} />
            <View pointerEvents="none" style={[styles.lineH, { top: `${((i + 1) / GRID) * 100}%` }]} />
          </React.Fragment>
        ))}
        {value ? (
          <View
            pointerEvents="none"
            style={[styles.pin, { left: `${value.x * 100}%`, top: `${value.y * 100}%` }]}
          />
        ) : (
          <View pointerEvents="none">
            <Text style={styles.hint}>Toca para marcar el punto exacto</Text>
          </View>
        )}
      </Pressable>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const PIN = 20;

const styles = StyleSheet.create({
  wrap: { gap: spacing[1] },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.neutral.textPrimary },
  canvas: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    backgroundColor: colors.brand.secondarySoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasError: { borderColor: colors.semantic.danger },
  lineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.neutral.border },
  lineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.neutral.border },
  pin: {
    position: 'absolute',
    width: PIN,
    height: PIN,
    marginLeft: -PIN / 2,
    marginTop: -PIN / 2,
    borderRadius: PIN / 2,
    backgroundColor: colors.brand.primary,
    borderWidth: 3,
    borderColor: colors.neutral.surface,
  },
  hint: { fontSize: typography.fontSize.sm, color: colors.neutral.textSecondary },
  error: { fontSize: typography.fontSize.xs, color: colors.semantic.danger },
  helper: { fontSize: typography.fontSize.xs, color: colors.neutral.textSecondary },
});
