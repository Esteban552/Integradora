import * as ImagePicker from 'expo-image-picker';
import { MAX_PHOTOS, validatePhoto, type PhotoDraft } from './jobForm';

export interface PickResult {
  photos: PhotoDraft[];
  /** Mensajes de las fotos descartadas (tipo o tamaño no permitido). */
  rejected: string[];
}

function mimeFrom(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.mimeType) return asset.mimeType.toLowerCase();
  const name = (asset.fileName ?? asset.uri).toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

/** Algunos dispositivos no informan el tamaño: se mide leyendo el archivo. */
async function sizeOf(asset: ImagePicker.ImagePickerAsset): Promise<number> {
  if (asset.fileSize && asset.fileSize > 0) return asset.fileSize;
  try {
    const blob = await (await fetch(asset.uri)).blob();
    return blob.size;
  } catch {
    return 0;
  }
}

/** Abre la galería y devuelve solo las fotos que cumplen las reglas de S4 (JPG/PNG, máximo 10 MB). */
export async function pickPhotos(alreadySelected: number): Promise<PickResult> {
  const remaining = MAX_PHOTOS - alreadySelected;
  if (remaining <= 0) return { photos: [], rejected: [] };
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.8,
  });
  if (result.canceled) return { photos: [], rejected: [] };

  const photos: PhotoDraft[] = [];
  const rejected: string[] = [];
  for (const asset of result.assets.slice(0, remaining)) {
    const draft: PhotoDraft = {
      uri: asset.uri,
      mimeType: mimeFrom(asset),
      sizeBytes: await sizeOf(asset),
      name: asset.fileName ?? `foto-${photos.length + 1}`,
    };
    const problem = validatePhoto(draft);
    if (problem) rejected.push(`${draft.name}: ${problem}`);
    else photos.push(draft);
  }
  return { photos, rejected };
}
