import { Directory, File, Paths } from 'expo-file-system';

/**
 * Photos are copied into the app's private document folder and referenced by file name only.
 * Storing names (not absolute URIs) keeps entries valid if the OS moves the app container.
 */
export const MAX_PHOTOS = 4;

const photoDir = () => new Directory(Paths.document, 'photos');

function ensureDir() {
  const dir = photoDir();
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function photoUri(name: string) {
  return new File(photoDir(), name).uri;
}

/** Copy a picker/camera file into private storage. Returns the stored file name. */
export async function importPhoto(sourceUri: string): Promise<string> {
  const ext = /\.(jpe?g|png|heic|webp)$/i.exec(sourceUri)?.[1]?.toLowerCase() ?? 'jpg';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await new File(sourceUri).copy(new File(ensureDir(), name));
  return name;
}

export function deletePhotos(names: string[]) {
  for (const n of names) {
    try {
      const f = new File(photoDir(), n);
      if (f.exists) f.delete();
    } catch {
      // a missing file is fine; nothing to clean up
    }
  }
}

/** Remove files no entry points to (e.g. a write screen closed by swipe before saving). */
export function deleteOrphans(referenced: Set<string>) {
  try {
    const dir = photoDir();
    if (!dir.exists) return;
    for (const item of dir.list()) {
      if (item instanceof File && !referenced.has(item.name)) item.delete();
    }
  } catch {}
}

export function deleteAllPhotos() {
  try {
    const dir = photoDir();
    if (dir.exists) dir.delete();
  } catch {}
}
