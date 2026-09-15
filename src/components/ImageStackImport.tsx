import { useEffect, useRef, useState } from 'react';
import { localize as l, useLanguage } from '../lib/i18n';
import { buildImageStack } from '../lib/image-stack';
import { sortSlices, validateSliceFiles } from '../shared/image-stack';

export function ImageStackImport({ disabled, onLoad, onBusyChange }: { disabled: boolean; onLoad: (file: File) => Promise<void>; onBusyChange: (busy: boolean) => void }) {
  useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(0);
  const [spacing, setSpacing] = useState<[string, string, string]>(['1', '1', '1']);
  const [calibrated, setCalibrated] = useState(false);
  const [invert, setInvert] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => {
    const file = files[selected];
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [files, selected]);
  const locked = disabled || working;
  const replaceFiles = (next: File[]) => { setFiles(next); setSelected(0); setConfirmed(false); setNotice(''); setError(''); };
  const move = (direction: number) => {
    const next = [...files], index = selected + direction;
    [next[selected], next[index]] = [next[index], next[selected]];
    setFiles(next); setSelected(index); setConfirmed(false); setNotice('');
  };
  const build = async () => {
    if (locked || !confirmed) return;
    const abort = new AbortController(); controller.current = abort;
    setWorking(true); onBusyChange(true); setDone(0); setError(''); setNotice('');
    try {
      const file = await buildImageStack(files, { spacing: spacing.map(Number) as [number, number, number], calibrated, invert }, abort.signal, value => { if (mounted.current) setDone(value); });
      abort.signal.throwIfAborted();
      await onLoad(file);
      if (mounted.current) setNotice('The image stack is now open in 3D. Rotate it or switch to slices to inspect the result.');
    } catch (e) {
      if (mounted.current) setError(abort.signal.aborted ? 'Image-stack construction cancelled.' : e instanceof Error ? e.message : 'The volume could not be loaded.');
    } finally {
      if (mounted.current) { setWorking(false); onBusyChange(false); }
      controller.current = null;
    }
  };
  return <section className="image-stack-import" aria-labelledby="image-stack-title">
    <header><div><span className="section-kicker">{l('From images to volume')}</span><h2 id="image-stack-title">{l('Build a 3D image stack')}</h2></div>
      <label className={`button primary file-button ${locked ? 'disabled' : ''}`}>{l('Choose slice images')}<input type="file" accept=".jpg,.jpeg,.png,.webp,.bmp" multiple disabled={locked} aria-label={l('Choose slice images')} onChange={e => {
        const next = Array.from(e.target.files ?? []); e.target.value = ''; if (!next.length) return;
        try { validateSliceFiles(next); replaceFiles(sortSlices(next)); } catch (e) { setError(e instanceof Error ? e.message : 'The volume could not be loaded.'); }
      }}/></label>
    </header>
    <p className="image-stack-intro">{l('Use consecutive, aligned slices from one scan, with identical dimensions and one image per slice. JPG, PNG, WebP and BMP stay in this browser. A screenshot montage, mixed views or a single image cannot reconstruct a complete brain.')}</p>
    {files.length > 0 && <div className="image-stack-grid">
      <div className="image-stack-preview">
        <div className="slice-preview-image">{preview && <img src={preview} alt={l('Selected slice preview')} style={{ filter: invert ? 'grayscale(1) invert(1)' : 'grayscale(1)' }}/>}</div>
        <label>{l('Slice preview')} <output>{selected + 1} / {files.length}</output><input type="range" min={0} max={files.length - 1} value={selected} disabled={locked} onChange={e => setSelected(Number(e.target.value))}/></label>
        <p>{files[selected]?.name}</p>
      </div>
      <div className="image-stack-order">
        <h3>{l('Check the slice order')}</h3><p>{l('Initially sorted by filename: 1, 2, 10. The first image is the start of the stack. Select a slice to move it or reverse the whole stack.')}</p>
        <select size={6} aria-label={l('Slice order')} value={selected} disabled={locked} onChange={e => setSelected(Number(e.target.value))}>{files.map((f, i) => <option key={i} value={i}>{i + 1}. {f.name}</option>)}</select>
        <div className="image-stack-actions"><button className="button secondary compact" disabled={locked || selected === 0} onClick={() => move(-1)}>{l('Move earlier')}</button><button className="button secondary compact" disabled={locked || selected === files.length - 1} onClick={() => move(1)}>{l('Move later')}</button><button className="text-button" disabled={locked} onClick={() => replaceFiles([...files].reverse())}>{l('Reverse order')}</button><button className="text-button" disabled={locked} onClick={() => replaceFiles(files.filter((_, i) => i !== selected))}>{l('Remove selected slice')}</button></div>
      </div>
      <div className="image-stack-settings">
        <h3>{l('Shape and spacing')}</h3>
        <p>{l('Use the distance between slice centres, not the slice thickness. Without known spacing, use relative proportions; millimetres and anatomical orientation are not inferred from pictures.')}</p>
        <label className="stack-check"><input type="checkbox" checked={calibrated} disabled={locked} onChange={e => { setCalibrated(e.target.checked); setNotice(''); }}/>{l('I know the pixel and slice spacing in millimetres')}</label>
        <div className="stack-spacing">{['Horizontal pixel spacing', 'Vertical pixel spacing', 'Distance between slices'].map((label, i) => <label key={label}>{l(label)}<input type="number" min="0.01" max="100" step="any" value={spacing[i]} disabled={locked} onChange={e => { setSpacing(previous => previous.map((v, j) => i === j ? e.target.value : v) as [string, string, string]); setNotice(''); }}/><small>{l(calibrated ? 'mm · supplied by you' : 'Relative units')}</small></label>)}</div>
        <label className="stack-check"><input type="checkbox" checked={invert} disabled={locked} onChange={e => { setInvert(e.target.checked); setNotice(''); }}/>{l('Invert brightness for a white background')}</label>
      </div>
      <footer className="image-stack-footer">
        <label className="stack-check"><input type="checkbox" checked={confirmed} disabled={locked} onChange={e => setConfirmed(e.target.checked)}/>{l('I checked the order and spacing. These are aligned, de-identified research or demonstration slices from one series.')}</label>
        <p>{l('This stacks the visible pixels into a volume. It does not recover missing anatomy, align slices, remove skull or detect a tumour. Labels and borders in images will also appear in 3D.')}</p>
        <div className="image-stack-actions"><button className="button primary" disabled={locked || !confirmed || files.length < 2} onClick={() => void build()}>{l(working ? 'Building volume…' : 'Build and open in 3D')}</button>{working && <button className="button secondary" disabled={disabled} onClick={() => controller.current?.abort()}>{l('Cancel')}</button>}{!working && <button className="text-button" disabled={locked} onClick={() => replaceFiles([])}>{l('Clear selected images')}</button>}</div>
        {working && <div role="status"><progress value={done} max={files.length}/><span>{done} / {files.length} {l('slices decoded')}</span></div>}
      </footer>
    </div>}
    {error && <p className="mutation-error" role="alert">{l(error)}</p>}
    {notice && <p className="image-stack-success" role="status">{l(notice)}</p>}
  </section>;
}
