import {useState,useEffect} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {useAppData} from '../lib/workspace';
import {apiRequest} from '../lib/api';
import {demoCases,demoGuides} from '../shared/demo';

export function DemoGuide(){
 const {data,reload}=useAppData(),location=useLocation(),navigate=useNavigate();
 const [chosen,setChosen]=useState<string>(demoCases[0].id),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const params=new URLSearchParams(location.search),routeCase=location.pathname.startsWith('/cases/')?location.pathname.split('/')[2]:params.get('case');
 const studyCase=data?.studies.find(s=>s.id===params.get('study'))?.case_id;
 useEffect(()=>{const id=routeCase||studyCase;if(demoCases.some(p=>p.id===id))setChosen(id!);},[routeCase,studyCase]);
 const item=demoCases.find(p=>p.id===(routeCase||studyCase||chosen))??demoCases[0];
 const installed=demoCases.filter(p=>data?.cases.some(c=>c.id===p.id)),ready=installed.length===demoCases.length;
 const root='/'+location.pathname.split('/')[1],guide=demoGuides[root]??{title:'Az eset teljes története egy helyen',try:'Nézd át a kitalált beteg összefoglalóját, előfeltételeit, feladatait és a korábbi döntést. Az átadási összefoglaló nyomtatható.',next:'/care'};
 const pathFor=(path:string,id:string=item.id)=>path==='/cases'?`/cases/${id}`:path==='/volume-lab'?`/volume-lab?study=${id}-study-1&analysis=${id}-study-1-analysis`:path==='/advanced'?`/advanced?module=${demoCases.find(p=>p.id===id)?.module??'longitudinal'}&case=${id}`:`${path}?case=${id}`;
 const select=(id:string)=>{setChosen(id);const path=location.pathname.startsWith('/cases/')?'/cases':location.pathname;if(['/care','/review','/tasks','/imaging','/volume-lab','/compare','/advanced','/cases'].includes(path))navigate(pathFor(path,id));};
 const install=async()=>{setBusy(true);setMessage('');try{const r=await apiRequest<{added:number}>('/api/demo/install',{method:'POST',headers:{'X-Leletiv-Demo':'synthetic-only'},body:'{}'});await reload();setMessage(r.added?`${r.added} összefüggő demóbetegút betöltve.`:'A demóbetegutak már elérhetők; a módosításaid megmaradtak.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
 return <aside className="demo-guide no-print" aria-label="Demó útmutató"><div className="demo-guide-heading"><div><span className="demo-label">SZINTETIKUS DEMÓ</span><strong>{guide.title}</strong></div>{!ready&&<button className="button secondary" disabled={busy} onClick={()=>void install()}>{busy?'Demócsomag betöltése…':'Három demóbetegút betöltése'}</button>}</div><p>{guide.try}</p>{ready&&<><div className="demo-guide-controls"><label>Követett demóeset<select aria-label="Követett demóeset" value={item.id} onChange={e=>select(e.target.value)}>{demoCases.map(p=><option key={p.id} value={p.id}>{p.name} · {p.hospitalId}</option>)}</select></label><Link className="button secondary" to={`/cases/${item.id}`}>Betegút megnyitása</Link><Link className="button secondary" to={pathFor(guide.next)}>Következő lépés →</Link></div><details><summary>Az eset története és kipróbálható állomásai</summary><p>{item.story}</p><nav aria-label="Demóbetegút állomásai">{[['/cases','Betegút'],['/board','Onkoteam'],['/care','Végrehajtás'],['/tasks','Feladatok'],['/review','Leletek'],['/imaging','Képanyag'],['/volume-lab','3D'],['/compare','Összehasonlítás'],['/advanced','Kvantitatív mérések']].map(([path,label])=><Link key={path} to={pathFor(path)}>{label} ↗</Link>)}</nav></details></>}<small>Kitalált személyek és szerkesztett leletek. Szabadon szerkeszthető próbák; a mentések megmaradnak. A mesterségesen készített próbaképek nem valódi betegfelvételek.</small>{message&&<p role="status">{message}</p>}</aside>;
}
