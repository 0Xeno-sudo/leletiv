import type { Connectome } from '@niivue/niivue';

export type ScanPin = { version: 1; sourceKey: string; frac: [number, number, number] };
export function makeScanPin(sourceKey: string, position: ArrayLike<number>): ScanPin {
  const frac = Array.from(position);
  if (!/^[a-f0-9]{64}$/.test(sourceKey) || frac.length !== 3 || frac.some(v => !Number.isFinite(v) || v < 0 || v > 1)) {
    throw new Error('Choose a point inside a scan slice.');
  }
  return { version: 1, sourceKey, frac: [frac[0], frac[1], frac[2]] };
}
export function parseScanPin(raw: string | null, sourceKey: string): ScanPin | null {
  try {
    const data = JSON.parse(raw ?? 'null');
    if (!data || data.version !== 1 || data.sourceKey !== sourceKey || !Array.isArray(data.frac)) return null;
    return makeScanPin(sourceKey, data.frac);
  } catch { return null; }
}
export async function scanFingerprint(bytes: ArrayBuffer): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), v => v.toString(16).padStart(2, '0')).join('');
}
/** A marker is a separate surface mesh, never a voxel label or a lesion measurement. */
export function pinMeshOptions(world: ArrayLike<number>, radius: number): Connectome {
  return {
    name: 'scan-location-pin', nodeColormap: 'scan-pin-yellow', nodeColormapNegative: 'scan-pin-yellow',
    nodeMinColor: 0, nodeMaxColor: 1, nodeScale: radius,
    edgeColormap: 'scan-pin-yellow', edgeColormapNegative: 'scan-pin-yellow', edgeMin: 0, edgeMax: 1, edgeScale: 0,
    showLegend: false, legendLineThickness: 0,
    nodes: [{ name: '', x: world[0], y: world[1], z: world[2], colorValue: 1, sizeValue: 1 }], edges: [],
  };
}
