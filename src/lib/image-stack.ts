import { encodeImageStack, validateSliceFiles, validateStackGeometry, writeGrayscale, type StackSettings } from '../shared/image-stack';

export async function buildImageStack(files: File[], settings: StackSettings, signal: AbortSignal, progress: (done: number) => void): Promise<File> {
  validateSliceFiles(files);
  let voxels: Uint8Array | undefined;
  let width = 0, height = 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Image decoding is unavailable in this browser.');
  try {
    for (let z = 0; z < files.length; z++) {
      signal.throwIfAborted();
      let bitmap: ImageBitmap;
      try { bitmap = await createImageBitmap(files[z]); }
      catch { throw new Error('A selected image could not be decoded. Convert it to PNG and try again.'); }
      try {
        signal.throwIfAborted();
        if (!voxels) {
          width = bitmap.width; height = bitmap.height;
          validateStackGeometry(width, height, files.length, settings);
          voxels = new Uint8Array(width * height * files.length);
          canvas.width = width; canvas.height = height;
        }
        if (bitmap.width !== width || bitmap.height !== height) throw new Error('Every slice must have the same pixel dimensions. Images are never stretched or cropped automatically.');
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(bitmap, 0, 0);
        writeGrayscale(ctx.getImageData(0, 0, width, height).data, voxels, z * width * height, settings.invert);
      } finally { bitmap.close(); }
      progress(z + 1);
      await new Promise<void>(resolve => window.setTimeout(resolve, 0));
    }
    signal.throwIfAborted();
    return new File([encodeImageStack(voxels!, width, height, files.length, settings)], 'image-stack-unoriented.nii', { type: 'application/octet-stream' });
  } finally { canvas.width = 0; canvas.height = 0; }
}
