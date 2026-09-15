import { useRef, useState, type RefObject } from 'react';
import type { Niivue, NVMesh } from '@niivue/niivue';
import { makeScanPin, parseScanPin, pinMeshOptions, type ScanPin } from '../shared/scan-pin';

const storageKey = (key: string) => `scan-location-pin.v1:${key}`;
export function useScanPin(viewer: RefObject<Niivue | null>) {
  const [pin, setPin] = useState<ScanPin | null>(null);
  const [position, setPosition] = useState<number[] | null>(null);
  const [through, setThrough] = useState(true);
  const [storageWarning, setStorageWarning] = useState(false);
  const mesh = useRef<NVMesh | null>(null);
  const sourceKey = useRef('');
  const radius = useRef(2);
  const throughRef = useRef(true);

  function drawPin(nv: Niivue, next: ScanPin | null) {
    if (mesh.current && nv.meshes.includes(mesh.current)) nv.removeMesh(mesh.current);
    mesh.current = null;
    nv.opts.meshXRay = next && throughRef.current ? 0.85 : 0;
    if (next) {
      // NiiVue applies the loaded image affine: do not treat voxel indexes as world coordinates.
      const world = nv.frac2mm(next.frac);
      nv.addColormap('scan-pin-yellow', {R:[255,255], G:[211,211], B:[0,0], A:[255,255], I:[0,255]});
      const marker = nv.loadConnectomeAsMesh(pinMeshOptions(world, radius.current));
      nv.addMesh(marker);
      nv.setMeshShader(marker.id, 'Flat');
      mesh.current = marker;
    }
    nv.drawScene();
  }
  function bindVolume(nv: Niivue, key: string) {
    sourceKey.current = key;
    radius.current = 4 * Math.min(...nv.volumes[0].hdr!.pixDims.slice(1,4).map(Math.abs));
    nv.setMeshThicknessOn2D(radius.current / 2);
    let restored: ScanPin | null = null;
    try { restored = parseScanPin(localStorage.getItem(storageKey(key)), key); setStorageWarning(false); }
    catch { setStorageWarning(true); }
    setPin(restored);
    nv.onLocationChange = () => {
      if (viewer.current !== nv) return;
      const frac = Array.from(nv.scene.crosshairPos);
      setPosition(frac.length === 3 && frac.every(v => Number.isFinite(v) && v >= 0 && v <= 1) ? Array.from(nv.frac2mm(nv.scene.crosshairPos)).slice(0,3) : null);
    };
    nv.onLocationChange(null);
    drawPin(nv, restored);
  }
  function savePin() {
    const nv = viewer.current;
    if (!nv || !sourceKey.current) return;
    const next = makeScanPin(sourceKey.current, nv.scene.crosshairPos);
    drawPin(nv, next);
    setPin(next);
    try { localStorage.setItem(storageKey(next.sourceKey), JSON.stringify(next)); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }
  function removePin() {
    const nv = viewer.current;
    if (!nv) return;
    drawPin(nv, null);
    setPin(null);
    try { localStorage.removeItem(storageKey(sourceKey.current)); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }
  function jumpToPin() {
    if (!pin || !viewer.current) return;
    viewer.current.scene.crosshairPos = [...pin.frac];
    viewer.current.drawScene();
    viewer.current.onLocationChange(null);
  }
  function toggleThrough(value: boolean) {
    throughRef.current = value;
    setThrough(value);
    if (viewer.current) { viewer.current.opts.meshXRay = pin && value ? 0.85 : 0; viewer.current.drawScene(); }
  }
  const world = pin && viewer.current?.volumes.length ? Array.from(viewer.current.frac2mm(pin.frac)).slice(0,3) : null;
  return { pin, position, world, through, storageWarning, bindVolume, savePin, removePin, jumpToPin, toggleThrough };
}
