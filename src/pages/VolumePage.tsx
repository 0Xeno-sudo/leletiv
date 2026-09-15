import {localize as l,useLanguage,locale,recordText} from '../lib/i18n';
import {useEffect,useRef,useState} from 'react';
import {Niivue,NVImage} from '@niivue/niivue';
import {Link} from 'react-router-dom';
import {PageHeader} from '../components/ui';
import {assertSameGrid,measureLabels,readNifti,type VolumeGeometry} from '../shared/volume';
import {downloadText} from '../lib/download';
import {csv} from '../shared/simulation';
import {hungarian} from '../lib/translations.hu';
import {ScanPipeline} from '../components/ScanPipeline';
import {ModelScope} from '../components/ModelScope';
import {useScanPin} from '../lib/useScanPin';
import {scanFingerprint} from '../shared/scan-pin';
import {ImageStackImport} from '../components/ImageStackImport';
import {LungAssistant} from '../components/LungAssistant';
import {RegionAssistant} from '../components/RegionAssistant';
import {ArchiveBridge} from '../components/ArchiveBridge';
import {maskFile} from '../shared/nifti-data';
import {STACK_DESCRIPTION} from '../shared/image-stack';

function geometry(image:NVImage):VolumeGeometry{
 const h=image.hdr;if(!h)throw new Error('Invalid NIfTI header.');
 return {dims:h.dims.slice(1,4),spacing:h.pixDims.slice(1,4),affine:h.affine,units:h.xyzt_units&7};
}
async function parseVolume(file:File,mask=false){
 const safe=await readNifti(file);
 const image=await NVImage.loadFromFile({file:safe,colormap:mask?'red':'gray',opacity:mask?.8:1});
 if(mask&&image.hdr&&((image.hdr.scl_slope!==0&&image.hdr.scl_slope!==1)||image.hdr.scl_inter!==0))throw new Error('Use an unscaled integer mask. Rescale slope and intercept must be 1 and 0.');
 return {safe,image};
}
const number=(value:number,digits=2)=>new Intl.NumberFormat(locale(),{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
const viewerError=(e:unknown)=>e instanceof Error&&hungarian[e.message]?e.message:'The volume could not be loaded.';
export default function VolumePage(){
  useLanguage();
 const canvas=useRef<HTMLCanvasElement>(null);const viewer=useRef<Niivue|null>(null);const alive=useRef(true);
 const scanPin=useScanPin(viewer);
 const [busy,setBusy]=useState(true);const [error,setError]=useState('');const [source,setSource]=useState('No scan loaded');
 const [maskName,setMaskName]=useState('No region mask');const [demo,setDemo]=useState(false);const [view,setView]=useState('combined');
 const [opacity,setOpacity]=useState(.8);const [clip,setClip]=useState(2);const [stats,setStats]=useState<ReturnType<typeof measureLabels>>([]);
 const [meta,setMeta]=useState<VolumeGeometry|null>(null);const [note,setNote]=useState('');const [baseFile,setBaseFile]=useState<File|null>(null);
 const [stackBusy,setStackBusy]=useState(false);const [imageStack,setImageStack]=useState(false);
 const [analysisMethod,setAnalysisMethod]=useState('Importált kutatási maszk');const [analysisParameters,setAnalysisParameters]=useState<Record<string,unknown>>({});
 const [detectionOverlay,setDetectionOverlay]=useState(false);
 const hasMask=maskName!=='No region mask';
 const renderMode=(value:string)=>{setView(value);const nv=viewer.current;if(!nv)return;nv.setSliceType(value==='3d'?nv.sliceTypeRender:value==='axial'?nv.sliceTypeAxial:value==='coronal'?nv.sliceTypeCoronal:value==='sagittal'?nv.sliceTypeSagittal:nv.sliceTypeMultiplanar);};
 const loadAtlas=async(nv:Niivue)=>{
  const response=await fetch('/volumes/mni152.nii.gz');if(!response.ok)throw new Error('The volume could not be loaded.');
  const {image,safe}=await parseVolume(new File([await response.blob()],'mni152.nii.gz'));
  const sourceKey=await scanFingerprint(await safe.arrayBuffer());
  if(viewer.current!==nv)return;while(nv.volumes.length)nv.removeVolumeByIndex(0);nv.addVolume(image);
  if(!alive.current||viewer.current!==nv)return;const base=nv.volumes[0];setMeta(geometry(base));setImageStack(false);nv.setIsOrientationTextVisible(true);setBaseFile(null);setSource('MNI152 population atlas');setDemo(true);setStats([]);setNote('');setMaskName('No region mask');setOpacity(.8);setClip(2);nv.setClipPlane([2,0,0]);scanPin.bindVolume(nv,sourceKey);
 };
 useEffect(()=>{alive.current=true;const nv=new Niivue({backColor:[.97,.985,1,1],fontColor:[.2,.3,.4,1],crosshairColor:[.02,.42,.85,.75],isColorbar:false,show3Dcrosshair:false,dragAndDropEnabled:false,loadingText:'',logLevel:'error',multiplanarShowRender:2});viewer.current=nv;
  void(async()=>{try{await nv.attachToCanvas(canvas.current!);if(!alive.current||viewer.current!==nv)return;if(viewer.current===nv)nv.setSliceType(nv.sliceTypeMultiplanar);}catch(e){if(alive.current&&viewer.current===nv)setError(viewerError(e));}finally{if(alive.current&&viewer.current===nv)setBusy(false);}})();
  return()=>{alive.current=false;nv.cleanup();viewer.current=null;};
 },[]);
 const action=async(fn:()=>Promise<void>)=>{if(busy||stackBusy)return;setBusy(true);setError('');try{await fn();}catch(e){if(alive.current)setError(viewerError(e));}finally{if(alive.current)setBusy(false);}};
 const installVolume=async(file:File,isMask:boolean,modelResult:boolean|'detection'|'archived'=false)=>{
  setDetectionOverlay(modelResult==='detection');
  setAnalysisMethod(modelResult?'Modellből származó kutatási maszk':'Importált kutatási maszk');setAnalysisParameters({});
  const {safe,image}=await parseVolume(file,isMask);const sourceKey=isMask?'':await scanFingerprint(await safe.arrayBuffer());if(!alive.current||!viewer.current)return;
  const nv=viewer.current!;const g=geometry(image);
  if(isMask){assertSameGrid(geometry(nv.volumes[0]),g);const results=measureLabels(image.img!,g);if(!results.length&&!modelResult)throw new Error('The mask contains no labelled voxels.');while(nv.volumes.length>1)nv.removeVolumeByIndex(1);image.cal_min=0;image.cal_max=1;if(modelResult===true)image.setColormapLabel({R:[0,215,51,0,219],G:[0,161,149,0,94],B:[0,53,223,0,100],A:[0,255,255,0,255],I:[0,1,2,3,4],labels:['Background','Core','Edema','Unused','Enhancing']});nv.addVolume(image);setStats(modelResult==='detection'?[]:results);setMaskName(modelResult==='detection'?'Tüdőgócjelöltek · befoglaló dobozok':modelResult===true?'MONAI candidate regions · unreviewed':file.name);setOpacity(.8);}
  else{while(nv.volumes.length)nv.removeVolumeByIndex(0);nv.addVolume(image);const fromImages=image.hdr?.description?.startsWith(STACK_DESCRIPTION)??false;setImageStack(fromImages);nv.setIsOrientationTextVisible(!fromImages);setMeta(g);setSource(file.name);setBaseFile(safe);setDemo(false);setStats([]);setMaskName('No region mask');setNote('');setClip(2);nv.setClipPlane([2,0,0]);scanPin.bindVolume(nv,sourceKey);}
 };
 const importVolume=(file:File,isMask:boolean)=>action(()=>installVolume(file,isMask));
 const loadImageStack=async(file:File)=>{setBusy(true);setError('');try{await installVolume(file,false);renderMode('3d');canvas.current?.scrollIntoView({behavior:'smooth',block:'center'});}finally{if(alive.current)setBusy(false);}};
 const downloadStack=()=>{if(!baseFile)return;const url=URL.createObjectURL(baseFile);const link=document.createElement('a');link.href=url;link.download=baseFile.name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const loadModelResult=async(source:File,mask:File,synthetic:boolean)=>{
  if(busy||stackBusy)throw new Error('The viewer is busy. Try again after loading finishes.');
  setBusy(true);setError('');try{await installVolume(source,false);await installVolume(mask,true,true);setSource(synthetic?'Synthetic model test phantom':'T1c research source');setDemo(false);}catch(e){setError(viewerError(e));throw e;}finally{setBusy(false);}
 };
 const addDemoRegion=()=>action(async()=>{const nv=viewer.current!;const base=nv.volumes[0];const mask=base.clone();mask.zeroImage();const g=geometry(base);const [nx,ny,nz]=g.dims;
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const distance=((x-nx*.61)*g.spacing[0]/12)**2+((y-ny*.54)*g.spacing[1]/16)**2+((z-nz*.58)*g.spacing[2]/11)**2;if(distance<1)mask.img![x+y*nx+z*nx*ny]=1;}
  mask.hdr!.scl_slope=1;mask.hdr!.scl_inter=0;
  const {image}=await parseVolume(new File([mask.toUint8Array().buffer as ArrayBuffer],'demo-region.nii'),true);
  assertSameGrid(g,geometry(image));const measurements=measureLabels(image.img!,g);
  image.cal_min=0;image.cal_max=1;while(nv.volumes.length>1)nv.removeVolumeByIndex(1);nv.addVolume(image);setStats(measurements);setMaskName('Simulated region · not a tumour finding');setOpacity(.8);
 });
 const exportMeasurements=()=>downloadText('neuroflow-region-measurements.csv',csv([[l('Source'),recordText(source)],[l('Mask'),recordText(maskName)],[l('Status'),l('Unvalidated research visualization')],[l('Grid'),meta?.dims.join(' × ')??''],[l('Notes'),note],['Label','Voxels','Volume (mL)'].map(l),...stats.map(s=>[s.label,s.voxels,s.millilitres.toFixed(3)])]));
 return <>
  <PageHeader title={l("3D scan lab")} description={l("Explore source voxels, inspect a labelled region, and keep every measurement traceable.")} actions={<button className="button secondary" disabled={busy||stackBusy} onClick={()=>void action(()=>loadAtlas(viewer.current!))}>{l("Load atlas demo")}</button>}/>
  <nav className="imaging-shortcuts" aria-label="Képi eszközök"><a href="#image-stack-import">JPG / PNG szeletek</a><a href="#lung-assistant">Tüdőgócjelöltek</a><a href="#region-assistant">Régiókijelölés</a><Link to="/compare">Két időpont összehasonlítása</Link><a href="#archive-bridge">Archívum és mérési napló</a></nav>
  <div className="volume-source"><span className="source-dot"/><strong>{l(source)}</strong><span>{l(demo?'Population template · not a patient scan':'Local research data · no external upload')}</span></div>
  {imageStack&&<div className="image-stack-notice" role="status">{l("Constructed from 2D images. Anatomy and alignment are not verified; image annotations remain part of the volume.")} <strong>{l(meta?.units===2?"Spacing in millimetres was supplied by the user.":"Relative spacing only. Physical measurements are unavailable.")}</strong></div>}
  <div className="volume-workspace"><section className="volume-main">
   <div className="volume-toolbar"><div className="view-tabs">{l([['combined','Slices + 3D'],['3d','3D'],['axial','Axial'],['coronal','Coronal'],['sagittal','Sagittal']].map(([id,label])=><button disabled={busy||stackBusy||!meta} aria-pressed={view===id} className={view===id?'active':''} key={id} onClick={()=>renderMode(id)}>{l(label)}</button>))}</div><button className="button secondary pin-action" disabled={busy||stackBusy||!meta||!scanPin.position||view==='3d'} onClick={()=>scanPin.savePin()}><span className="scan-pin-dot"/>{l(scanPin.pin?'Move pin to selection':'Pin selected point')}</button></div>
   <div className="scan-pin-strip"><p>{l("Select a point in a slice, then pin it. The yellow dot stays anchored while you rotate the 3D view.")}</p>{scanPin.pin&&<div className="scan-pin-details"><span><span className="scan-pin-dot"/>{l("Pinned point")}{scanPin.world&&<small> X {number(scanPin.world[0],1)} · Y {number(scanPin.world[1],1)} · Z {number(scanPin.world[2],1)} {meta?.units===2?'mm':meta?.units===1?'m':meta?.units===3?'µm':l('scan units')}</small>}</span><div className="scan-pin-actions"><button className="text-button" disabled={busy||stackBusy} onClick={()=>{scanPin.jumpToPin();renderMode('combined');}}>{l("Return to pin")}</button><button className="text-button" disabled={busy||stackBusy} onClick={()=>{scanPin.jumpToPin();renderMode('3d');}}>{l("View pin in 3D")}</button><button className="text-button" disabled={busy||stackBusy} onClick={scanPin.removePin}>{l("Remove pin")}</button></div><label><input type="checkbox" checked={scanPin.through} disabled={busy||stackBusy} onChange={e=>scanPin.toggleThrough(e.target.checked)}/>{l("Show pin through anatomy")}</label><small>{l("A location marker, not a tumour boundary. Through-anatomy mode reveals hidden points; use slices or the cutaway to check depth.")}</small></div>}{scanPin.storageWarning&&<p role="status">{l("Local pin storage is unavailable. Changes apply only in this tab and may not survive a reload.")}</p>}</div>
   <div className="volume-canvas-wrap"><canvas ref={canvas} aria-label={l("Interactive volumetric scan viewer")}/>{l(busy&&<div className="volume-loading" role="status">{l("Loading volume…")}</div>)}</div>
   <div className="volume-caption"><span>{l("Drag to rotate in 3D. Scroll through slices. Right-drag to adjust contrast.")}</span><span>{l(imageStack?'Image-stack coordinates · anatomical orientation unknown':'R / L: anatomical right / left')}</span></div>
   {l(error&&<p className="error-banner" role="alert">{l(error)}</p>)}
   <div className="volume-controls"><label><span>{l("Region opacity")}</span><input aria-label={l("Region opacity")} type="range" min="0" max="1" step="0.05" value={opacity} disabled={!hasMask||busy||stackBusy} onChange={e=>{const v=Number(e.target.value);setOpacity(v);viewer.current?.setOpacity(1,v);}}/></label><label><span>{l("3D cutaway")}</span><input aria-label={l("3D cutaway")} type="range" min="-1" max="2" step=".05" value={clip} disabled={busy||stackBusy||!meta} onChange={e=>{const v=Number(e.target.value);setClip(v);viewer.current?.setClipPlane([v,0,0]);}}/></label></div>
  </section><aside className="volume-panel">
   <h2>{l("Source & segmentation")}</h2><p>{l("Opening a volume stays in this tab. The model workspace below sends selected research scans only to the local inference service when you run it.")}</p>
   <label className={`button primary file-button ${busy||stackBusy?'disabled':''}`}>{l("Open scan volume")}<input aria-label={l("Open scan volume")} type="file" accept=".nii,.nii.gz" disabled={busy||stackBusy} onChange={e=>{const f=e.target.files?.[0];if(f)void importVolume(f,false);e.target.value='';}}/></label>
   <a className="button secondary" href="#image-stack-import">{l("Build from JPG / PNG slices")}</a>
   <label className={`button secondary file-button ${busy||stackBusy?'disabled':''}`}>{l("Import region mask")}<input aria-label={l("Import region mask")} type="file" accept=".nii,.nii.gz" disabled={busy||stackBusy||!meta} onChange={e=>{const f=e.target.files?.[0];if(f)void importVolume(f,true);e.target.value='';}}/></label>
   <small>{l("NIfTI-1 · .nii / .nii.gz · up to 64 MB")}</small>
   {l(demo&&<button className="text-button demo-region-button" disabled={busy||stackBusy||!meta} onClick={()=>void addDemoRegion()}>{l("Add simulated region")}</button>)}
   <div className="volume-region"><span className="section-kicker">{l("Region inspection")}</span><h3>{l(maskName)}</h3>{l(stats.length?<><strong className="volume-number">{l(number(stats.reduce((s,r)=>s+r.millilitres,0)))} <small>{l("mL")}</small></strong><p>{l("All non-zero labels combined")}</p>{l(stats.map(s=><div className="region-row" key={s.label}><span>{l("Label ")}{l(s.label)}</span><strong>{l(number(s.millilitres))}{l(" mL")}</strong></div>))}<button className="text-button" disabled={busy||stackBusy} onClick={()=>{const nv=viewer.current!;while(nv.volumes.length>1)nv.removeVolumeByIndex(1);setStats([]);setMaskName('No region mask');}}>{l("Remove mask")}</button></>:<p>{l(detectionOverlay?'A dobozok helymeghatározást szolgálnak; nem mérhető belőlük góctérfogat.':maskName==='MONAI candidate regions · unreviewed'?'No voxels exceeded the model threshold. This does not rule out disease.':"Import a matching segmentation to display the labelled region. A scan alone does not identify a tumour.")}</p>)}</div>
   {l(meta&&<div className="volume-metadata"><span>{l("Voxel grid")}</span><strong>{l(meta.dims.join(' × '))}</strong><span>{l("Voxel spacing")}</span><strong>{l(meta.spacing.map(v=>number(v)).join(' × '))} {l(meta.units===2?'mm':meta.units===1?'m':meta.units===3?'µm':l('Relative units'))}</strong></div>)}
   <label className="volume-notes"><span>{l("Review notes")}</span><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder={l("Observations for the review, not an automated diagnosis")}/></label>
   {imageStack&&<button className="button secondary" disabled={busy||stackBusy} onClick={downloadStack}>{l("Download constructed volume (.nii)")}</button>}
   <button className="button secondary" disabled={!hasMask||detectionOverlay||busy||stackBusy} onClick={exportMeasurements}>{l("Export measurements")}</button>
   <button className="button secondary" disabled={!hasMask||busy||stackBusy} onClick={()=>void viewer.current?.volumes[1]?.saveToDisk("neuroflow-region.nii")}>{l("Download mask (.nii)")}</button><button className="button secondary" disabled={!baseFile||busy||stackBusy||imageStack} onClick={()=>downloadText('segmentation-request.json',JSON.stringify({schema:'neuroflow.segmentation.v1',inputFile:baseFile!.name,geometry:meta,output:'NIfTI-1 integer label mask on the same grid',humanReviewRequired:true,containsImageData:false},null,2))}>{l("Export AI job manifest")}</button>
  </aside></div>
  <div id="image-stack-import"><ImageStackImport disabled={busy} onLoad={loadImageStack} onBusyChange={setStackBusy}/></div>
  <ScanPipeline disabled={busy||stackBusy} onView={file=>importVolume(file,false)} onResult={loadModelResult}/>
  <LungAssistant active={detectionOverlay} disabled={busy||stackBusy} onResult={async(source,boxes)=>{setBusy(true);try{await installVolume(source,false);await installVolume(boxes,true,'detection');canvas.current?.scrollIntoView({behavior:'smooth',block:'center'});}finally{setBusy(false);}}} onLocate={point=>{const nv=viewer.current;if(!nv)return;nv.scene.crosshairPos=nv.mm2frac(point);renderMode('combined');nv.drawScene();canvas.current?.scrollIntoView({behavior:'smooth',block:'center'});}}/>
  <RegionAssistant source={baseFile} disabled={busy||stackBusy} getSeed={()=>Array.from(viewer.current!.frac2vox(viewer.current!.scene.crosshairPos))} onMask={async(file,parameters)=>{setBusy(true);try{await installVolume(file,true);setAnalysisMethod('Félautomatikus régiónövesztés');setAnalysisParameters(parameters);}finally{setBusy(false);}}}/>
  <ArchiveBridge hasMask={hasMask&&!detectionOverlay} source={baseFile} disabled={busy||stackBusy} method={analysisMethod} parameters={analysisParameters} getMask={()=>{if(detectionOverlay)return null;const nv=viewer.current;if(!nv?.volumes[1])return null;return maskFile(nv.volumes[0].toUint8Array().buffer as ArrayBuffer,Uint8Array.from(nv.volumes[1].img!), 'region-mask.nii');}} onOpen={async(source,mask,analysis)=>{setBusy(true);try{await installVolume(source,false);if(mask)await installVolume(mask,true,'archived');if(analysis){setAnalysisMethod(analysis.method);setAnalysisParameters(JSON.parse(analysis.parameters_json));}}finally{setBusy(false);}}}/>
  <ModelScope/>
  <div className="volume-boundaries"><section><h3>{l("What this viewer does")}</h3><p>{l("Renders the actual scan volume and an imported label mask in matching coordinates. Measurements come from labelled voxels and physical spacing. They are not diagnostic conclusions.")}</p></section><section><h3>{l("Pretrained segmentation · research only")}</h3><p>{l("MONAI BraTS predicts candidate glioma regions from four prepared MRI sequences. It is not a general tumour detector, and its output is not validated for diagnosis or treatment planning in this app.")}</p></section><section><h3>{l("Demo attribution")}</h3><p>{l("MNI152 / ICBM average-brain atlas, McGill University, distributed by NiiVue. The optional red region is a synthetic demonstration, not a finding in the atlas.")}</p></section></div>
 </>;
}
