export const STACK_DESCRIPTION = 'NeuroFlow image stack; orientation unknown';
export const MAX_STACK_VOXELS = 32_000_000;
export type StackSettings = { spacing: [number, number, number]; calibrated: boolean; invert: boolean };

export function sortSlices<T extends { name: string }>(files: T[]): T[] {
  const compare = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  return [...files].sort((a, b) => compare.compare(a.name, b.name));
}

export function validateSliceFiles(files: { name: string; size: number }[]) {
  if (files.length < 2) throw new Error('Choose at least two consecutive slices. One image cannot reconstruct a 3D brain.');
  if (files.length > 512) throw new Error('Choose no more than 512 slices.');
  if (files.some(f => !/\.(jpe?g|png|webp|bmp)$/i.test(f.name))) throw new Error('Use JPG, PNG, WebP or BMP. Convert HEIC, TIFF, GIF and other formats to PNG first.');
  if (files.some(f => f.size === 0 || f.size > 20 * 1024 * 1024) || files.reduce((sum, f) => sum + f.size, 0) > 128 * 1024 * 1024) throw new Error('Use files up to 20 MB each and 128 MB in total.');
}

export function validateStackGeometry(width: number, height: number, depth: number, settings: StackSettings) {
  if (![width, height, depth].every(v => Number.isInteger(v) && v >= 2) || width > 2048 || height > 2048 || depth > 512 || width * height * depth > MAX_STACK_VOXELS) throw new Error('Use slices up to 2048 × 2048 pixels and a stack of at most 32 million voxels.');
  if (!settings.spacing.every(v => Number.isFinite(v) && v >= .01 && v <= 100)) throw new Error('Enter spacing values between 0.01 and 100.');
}

/** One unsigned grayscale voxel per pixel. Transparent pixels composite on black. */
export function writeGrayscale(rgba: Uint8ClampedArray, target: Uint8Array, offset: number, invert: boolean) {
  if (rgba.length % 4 || offset < 0 || !Number.isInteger(offset) || offset + rgba.length / 4 > target.length) throw new Error('Invalid slice pixel data.');
  for (let i = 0; i < rgba.length; i += 4) {
    const value = .2126 * rgba[i] + .7152 * rgba[i + 1] + .0722 * rgba[i + 2];
    target[offset + i / 4] = Math.round((invert ? 255 - value : value) * rgba[i + 3] / 255);
  }
}

/** NIfTI-1, uint8, file-order Z. qform/sform=0: no invented anatomical orientation. */
export function encodeImageStack(voxels: Uint8Array, width: number, height: number, depth: number, settings: StackSettings): ArrayBuffer {
  validateStackGeometry(width, height, depth, settings);
  if (voxels.length !== width * height * depth) throw new Error('Invalid slice pixel data.');
  const buffer = new ArrayBuffer(352 + voxels.length);
  const h = new DataView(buffer);
  h.setInt32(0, 348, true);
  [3, width, height, depth, 1, 1, 1, 1].forEach((v, i) => h.setInt16(40 + i * 2, v, true));
  h.setInt16(70, 2, true); // DT_UINT8
  h.setInt16(72, 8, true);
  [1, ...settings.spacing, 1, 1, 1, 1].forEach((v, i) => h.setFloat32(76 + i * 4, v, true));
  h.setFloat32(108, 352, true);
  h.setFloat32(112, 1, true);
  h.setUint8(123, settings.calibrated ? 2 : 0);
  h.setFloat32(124, 255, true);
  const description = `${STACK_DESCRIPTION}; ${settings.calibrated ? 'user spacing (mm)' : 'relative spacing'}`;
  new Uint8Array(buffer, 148, 80).set(new TextEncoder().encode(description));
  new Uint8Array(buffer, 344, 4).set([110, 43, 49, 0]);
  new Uint8Array(buffer, 352).set(voxels);
  return buffer;
}
