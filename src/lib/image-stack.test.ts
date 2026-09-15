import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildImageStack } from './image-stack';

const settings = { spacing: [1, 1, 1] as [number, number, number], calibrated: false, invert: false };
const files = [new File(['x'], '1.jpg'), new File(['x'], '2.png')];
afterEach(() => vi.unstubAllGlobals());
function decoder(sizes: number[][]) {
  const close = vi.fn();
  const canvas = { width: 0, height: 0, getContext: () => ({ clearRect: vi.fn(), drawImage: vi.fn(), getImageData: () => ({ data: new Uint8ClampedArray(16) }) }) };
  vi.stubGlobal('document', { createElement: () => canvas });
  vi.stubGlobal('window', { setTimeout });
  const decode = vi.fn(async () => { const [width, height] = sizes.shift()!; return { width, height, close }; });
  vi.stubGlobal('createImageBitmap', decode);
  return { close, canvas, decode };
}
describe('slice decoder failure handling', () => {
  it('rejects mismatched dimensions and releases both decoded images', async () => {
    const { close, canvas } = decoder([[2, 2], [3, 2]]);
    await expect(buildImageStack(files, settings, new AbortController().signal, () => {})).rejects.toThrow('same pixel dimensions');
    expect(close).toHaveBeenCalledTimes(2);
    expect(canvas.width).toBe(0);
  });
  it('stops before decoding further slices after cancellation', async () => {
    const { decode, close } = decoder([[2, 2], [2, 2]]);
    const abort = new AbortController();
    await expect(buildImageStack(files, settings, abort.signal, () => abort.abort())).rejects.toThrow();
    expect(decode).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('reports corrupt image data without producing a partial volume', async () => {
    const { decode, canvas } = decoder([]);
    decode.mockRejectedValue(new Error('decode failed'));
    await expect(buildImageStack(files, settings, new AbortController().signal, () => {})).rejects.toThrow('could not be decoded');
    expect(canvas.height).toBe(0);
  });
});
