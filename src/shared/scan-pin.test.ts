import { describe, it, expect } from 'vitest';
import { makeScanPin, parseScanPin, scanFingerprint, pinMeshOptions } from './scan-pin';

describe('scan-anchored pins', () => {
  const source = 'a'.repeat(64);
  it('copies the selected location so scrolling cannot move a saved pin', () => {
    const cursor = [0.2, 0.6, 0.8];
    const pin = makeScanPin(source, cursor);
    cursor[0] = 0.9;
    expect(pin.frac).toEqual([0.2, 0.6, 0.8]);
    expect(parseScanPin(JSON.stringify(pin), source)).toEqual(pin);
  });
  it('never restores a pin onto a different scan or accepts corrupt coordinates', () => {
    const pin = makeScanPin(source, [0.5, 0.5, 0.5]);
    expect(parseScanPin(JSON.stringify(pin), 'b'.repeat(64))).toBeNull();
    for (const value of ['invalid', '{}', JSON.stringify({...pin, frac:[2,0,0]}), JSON.stringify({...pin, version:2})]) {
      expect(parseScanPin(value, source)).toBeNull();
    }
    for (const frac of [[NaN,0,0], [0,Infinity,0], [-0.1,0,0], [0,0]]) {
      expect(() => makeScanPin(source, frac)).toThrow();
    }
  });
  it('binds pin identity to scan bytes, not a filename or grid size', async () => {
    expect(await scanFingerprint(new Uint8Array([1,2,3]).buffer)).toBe(await scanFingerprint(new Uint8Array([1,2,3]).buffer));
    expect(await scanFingerprint(new Uint8Array([1,2,3]).buffer)).not.toBe(await scanFingerprint(new Uint8Array([1,2,4]).buffer));
  });
  it('places a single marker at scan world coordinates without altering a segmentation', () => {
    const mesh = pinMeshOptions([-21.5, 12, 34], 2);
    expect(mesh.nodes).toEqual([{name:'',x:-21.5,y:12,z:34,colorValue:1,sizeValue:1}]);
    expect(mesh.edges).toEqual([]);
    expect(mesh.showLegend).toBe(false);
    expect(mesh.nodeScale).toBe(2);
  });
});
