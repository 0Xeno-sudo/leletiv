import {medicalLabel} from '../lib/medical-language';
import {useEffect,useRef,useState} from 'react';
import {Niivue,NVImage} from '@niivue/niivue';
import {artifactUrl,type Job} from '../lib/advanced';

export function AdvancedViewer({job,focus}:{job:Job;focus?:number[]}){
 const canvas=useRef<HTMLCanvasElement>(null),viewer=useRef<Niivue|null>(null);
 const artifacts=job.report!.artifacts.filter(a=>a.kind==='volume'),bases=artifacts.filter(a=>!a.overlay),overlays=artifacts.filter(a=>a.overlay);
 const [base,setBase]=useState(bases[0]?.file??''),[overlay,setOverlay]=useState(overlays[0]?.file??''),[opacity,setOpacity]=useState(.55),[mode,setMode]=useState('multi'),[error,setError]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{
  let live=true;const abort=new AbortController();const nv=new Niivue({backColor:[.055,.065,.085,1],dragAndDropEnabled:false,isColorbar:true,logLevel:'error'});viewer.current=nv;setReady(false);setError('');
  void(async()=>{try{await nv.attachToCanvas(canvas.current!);if(!live)return;for(const name of [base,overlay].filter(Boolean)){const a=artifacts.find(a=>a.file===name)!;const response=await fetch(artifactUrl(job,name),{signal:abort.signal});if(!response.ok)throw new Error('A képfájl nem érhető el.');const image=await NVImage.loadFromFile({file:new File([await response.blob()],name),colormap:a.colormap??(a.overlay?'red':'gray'),opacity:a.overlay?opacity:1});if(!live)return;
    if(a.overlay&&!a.colormap){
     // Compact display IDs preserve sparse source labels and fit the WebGL LUT.
     // Transparent padding also avoids NiiVue's 2/256 opacity-floor clamp on label zero.
     const unique=Array.from(new Set(image.img!)).filter(v=>v>0).sort((a,b)=>a-b);
     const ids=new Map(unique.map((v,i)=>[v,i+1]));for(let i=0;i<image.img!.length;i++)image.img![i]=ids.get(image.img![i])??0;
     const padding=Math.ceil((unique.length+1)/126)+2;
     const labels=Array.from({length:unique.length+padding+1},(_,i)=>i-padding);
     image.setColormapLabel({I:labels,R:labels.map(i=>i>0?70+(i*71)%185:0),G:labels.map(i=>i>0?65+(i*113)%190:0),B:labels.map(i=>i>0?80+(i*157)%175:0),A:labels.map(i=>i>0?255:0),labels:labels.map(i=>i>0?`Régió ${unique[i-1]}`:'Háttér')});
     image.colorbarVisible=false;
    }
    nv.addVolume(image);
   }nv.setSliceType(nv.sliceTypeMultiplanar);setReady(true);
  }catch(e){if(live)setError((e as Error).message);}})();
  return()=>{live=false;abort.abort();nv.cleanup();viewer.current=null;};
 // Viewer is rebuilt only when the chosen image pair changes.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[job.id,base,overlay]);
 useEffect(()=>{if(ready&&focus&&viewer.current?.volumes.length){const nv=viewer.current;nv.scene.crosshairPos=nv.mm2frac(focus);nv.drawScene();}},[focus,ready]);
 useEffect(()=>{if(!ready||!viewer.current?.volumes.length)return;const nv=viewer.current;nv.setSliceType(mode==='3d'?nv.sliceTypeRender:mode==='axial'?nv.sliceTypeAxial:mode==='coronal'?nv.sliceTypeCoronal:mode==='sagittal'?nv.sliceTypeSagittal:nv.sliceTypeMultiplanar);},[mode,ready]);
 useEffect(()=>{if(ready&&viewer.current&&viewer.current.volumes.length>1&&overlay)viewer.current.setOpacity(1,opacity);},[opacity,ready,overlay]);
 if(!bases.length)return null;
 return <section className="advanced-viewer care-panel"><div className="advanced-section-title"><div><span className="advanced-step">02 · Képi ellenőrzés</span><h2>Képek és térképek</h2></div><span className="advanced-pill">{ready?'Interaktív nézet':'Kép betöltése'}</span></div><div className="advanced-fields advanced-controls"><label>Alapkép<select value={base} onChange={e=>setBase(e.target.value)}>{bases.map(a=><option value={a.file} key={a.file}>{medicalLabel(a.label)}</option>)}</select></label><label>Rávetített térkép<select value={overlay} onChange={e=>setOverlay(e.target.value)}><option value="">Nincs rávetítés</option>{overlays.map(a=><option key={a.file} value={a.file}>{medicalLabel(a.label)}</option>)}</select></label><label>Nézet<select value={mode} onChange={e=>setMode(e.target.value)}><option value="multi">Három sík együtt</option><option value="axial">Axialis</option><option value="coronal">Coronalis</option><option value="sagittal">Sagittalis</option><option value="3d">3D térfogat</option></select></label><label>Térkép láthatósága<input type="range" min="0" max="1" step=".05" value={opacity} onChange={e=>setOpacity(Number(e.target.value))}/></label></div><div className="advanced-canvas"><canvas ref={canvas} aria-label="Kvantitatív eredmény metszeti és 3D megjelenítése"/></div>{error&&<p role="alert">{error}</p>}<p className="advanced-hint">Görgetés: metszetváltás. Kattintás: célkereszt. 3D nézetben húzással forgatható. Az illesztést több síkban ellenőrizd.</p></section>;
}
