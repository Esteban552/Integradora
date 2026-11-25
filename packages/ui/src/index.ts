/**
 * Punto de entrada del paquete compartido `@trabajos/ui`.
 *
 * - `src/components/`: primitivos UI (botones, campos, tarjetas, avisos)
 * - `src/chat/`: chat compartido (UI-EMP-08 / UI-TRAB-08)
 * - `src/reviews/`: evaluaciones (UI-EMP-11 / UI-TRAB-11)
 * - `src/profile/`: avatar y datos de contacto (UI-EMP-13 / UI-TRAB-12)
 * - `src/notifications/`: bandeja de avisos
 *
 * Todos los estilos salen de `@trabajos/theme/native` (tokens.json). No fijar colores aquí.
 */
export { Banner } from './components/Banner';
export type { BannerProps, BannerTone } from './components/Banner';
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant } from './components/Button';
export { Card } from './components/Card';
export type { CardProps } from './components/Card';
export { ChipSelect } from './components/ChipSelect';
export type { ChipOption, ChipSelectProps } from './components/ChipSelect';
export { MapPinPicker } from './components/MapPinPicker';
export type { MapPinPickerProps, MapPinValue } from './components/MapPinPicker';
export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';
export { JobCard } from './components/JobCard';
export type { JobCardProps } from './components/JobCard';
export { CategoryChip, StatusBadge } from './components/StatusBadge';
export type { BadgeTone, CategoryChipProps, StatusBadgeProps } from './components/StatusBadge';
export { EmptyState, ErrorState, LoadingState } from './components/StateViews';
export type { EmptyStateProps, ErrorStateProps } from './components/StateViews';
export { LegalModal } from './components/LegalModal';
export type { LegalModalProps } from './components/LegalModal';
export { PasswordField } from './components/PasswordField';
export type { PasswordFieldProps, PasswordRule } from './components/PasswordField';
export { ScreenHeader } from './components/ScreenHeader';
export type { ScreenHeaderProps } from './components/ScreenHeader';
export { SegmentedTabs } from './components/SegmentedTabs';
export type { SegmentedTabsProps, TabOption } from './components/SegmentedTabs';
export { TextField } from './components/TextField';
export type { TextFieldProps } from './components/TextField';

export const UI_PACKAGE_READY = true;
