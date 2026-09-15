import {Hono} from 'hono';
import {demoCases,demoDate} from './shared/demo';
import {demoVolume} from './shared/demo-volume';
import {baselineInput,modelVersion} from './shared/simulation';
const api=new Hono<{Bindings:WorkerBindings}>();
const hash=async(b:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b as Uint8Array<ArrayBuffer>)),v=>v.toString(16).padStart(2,'0')).join('');

/** Explicit, additive installation. Existing IDs (including edited demos) are never overwritten. */
api.post('/install',async c=>{
 const url=new URL(c.req.url),origin=c.req.header('Origin');
 if(!['localhost','127.0.0.1'].includes(url.hostname)||c.req.header('X-Leletiv-Demo')!=='synthetic-only'||(origin&&new URL(origin).hostname!==url.hostname))return c.json({error:'A demócsomag csak a helyi bemutató munkatérben tölthető be.'},403);
 const db=c['env'].DB,anchor=new Date(),created=demoDate(-1,anchor);
 const statements:D1PreparedStatement[]=[];
 const add=(table:string,row:Record<string,string|number|null>)=>{const fields=Object.keys(row);statements.push(db.prepare(`INSERT OR IGNORE INTO ${table} (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).bind(...Object.values(row)));};
 const team=[['rad','Dr. Fenyvesi Eszter','FE','Radiológus','Neuroradiológia','#526c7b'],['onc','Dr. Kárpáti Márton','KM','Klinikai onkológus','Onkológia','#71647e'],['coord','Völgyi Réka','VR','Betegút-koordinátor','Betegút-szervezés','#577568']];
 for(const [id,name,initials,role,specialty,color] of team)add('team_members',{id:'demo-lv-'+id,name:name+' · demó',initials,role,specialty,color,availability:'available'});
 add('resources',{id:'demo-lv-mr',name:'Demó MR-kapacitás',type:'Imaging',location:'Kitalált diagnosztikai központ',status:'limited',next_available:demoDate(2,anchor),utilization:88,detail:'Szemléltető MR-kapacitás a demóbetegutakhoz; nem valós időpontfoglalás.'});
 let added=0;
 for(const [i,p] of demoCases.entries()){
  if(await db.prepare('SELECT id FROM cases WHERE id=?').bind(p.id).first())continue;
  added++;const id=p.id,rad='demo-lv-rad',onc='demo-lv-onc',coord='demo-lv-coord';
  const at=(n:number)=>demoDate(n,anchor),day=(n:number)=>at(n).slice(0,10),modality=i===1?'CT':'MR';
  add('patients',{id:id+'-patient',hospital_id:p.hospitalId,name:p.name+' · demó',birth_date:p.birth,sex:p.sex,city:p.city,synthetic:1,created_at:at(-42)});
  add('cases',{id,patient_id:id+'-patient',pathway:p.pathway,working_diagnosis:p.diagnosis,priority:p.priority,status:p.status,coordinator_id:coord,lead_clinician_id:onc,next_milestone:p.milestone,target_date:at(i===2?21:2),progress:p.progress,summary:p.summary,created_at:at(-42),updated_at:created});
  const requirementNames=['Képanyag rendelkezésre áll','Klinikai összefoglaló elkészült','Végleges szövettani lelet','Kontroll időpontja egyeztetve'];
  for(const [r,label] of requirementNames.entries())add('case_requirements',{id:id+'-req-'+r,case_id:id,label,category:r===2?'Patológia':'Koordináció',status:r===2?(i===1?'blocked':i===0?'not-required':'ready'):r===3?'pending':'ready',owner_id:r===2?onc:coord,updated_at:created});
  const decision=id+'-decision';
  add('board_decisions',{id:decision,case_id:id,recommendation:p.decision,rationale:'Kitalált, korábbi előkészítő megbeszélés. A végleges diagnózis és kezelés meghatározását nem modellezi. '+p.story,recorded_by:'Dr. Kárpáti Márton · demó',decided_at:at(-7),status:'confirmed'});
  const tasks=[['Képanyag és klinikai kérdés összekészítése','Az archív felvételek és a forrásleletek az esethez kapcsolva.',coord,'done',-6], [p.task,'Rögzíts rövid eredményösszefoglalót és ellenőrizd a forrást.',i===1?onc:coord,i===1?'blocked':'in-progress',2],['Kontrolllelet együttes áttekintése','Hasonlítsd össze a két leletet; ellenőrizd az időpontot és a mérési módszert.',rad,'open',5],['Betegút átadási összefoglalójának elkészítése','A lezárt és nyitott teendők, felelősök és következő határidők szerepeljenek az összefoglalóban.',coord,'open',7]] as const;
  for(const [t,[title,description,owner,status,offset]] of tasks.entries()){
   add('tasks',{id:id+'-task-'+t,case_id:id,title,description,owner_id:owner,status,priority:p.priority,due_at:at(offset),category:'Demó betegút',created_at:at(-7),completed_at:t===0?at(-6):null});
   if(t<3)add('decision_steps',{id:id+'-step-'+t,decision_id:decision,task_id:id+'-task-'+t,prerequisite_id:t?id+'-step-'+(t-1):null,expected_result:description,result_note:t===0?'A bemutató képanyag és a klinikai kérdés összekészítve.':'',reviewed_by:t===0?rad:null,reviewed_at:t===0?at(-5):null,created_at:at(-7+t)});
  }
  for(let v=0;v<2;v++){
   const date=day(v?-3:-35),doc=id+'-doc-'+v,quote=`${p.region}: a leírt legnagyobb átmérő ${p.values[v]} mm.`,recommendation=i===1?'A végleges szövettani eredmény beérkezésének követése és az eset ismételt áttekintése.':'A következő kontroll időpontjának egyeztetése és a lelet utánkövetése.';
   const body=`BEMUTATÓ LELET – KITALÁLT ESET, NEM KLINIKAI DOKUMENTUM\n\n${p.name} · ${p.hospitalId}\nVizsgálat: ${modality}, ${date}\nIndikáció: ${v?'Időbeli összehasonlítás a korábbi bemutatóvizsgálattal.':p.diagnosis+'.'}\n\nLeírás\n${quote}\n${v?'A korábbi azonos módon leírt mérés '+p.values[0]+' mm. A méretadat önmagában nem határoz meg terápiás választ.':'A mérés későbbi összehasonlításhoz rögzített kiinduló adat.'}\n\nÖsszefoglalás\n${p.summary}\nKövetkező teendő: ${recommendation}\n\nEz szerkesztett oktatási példa. Az archív geometriai fantom külön műszaki próbakép, nem e lelet anatómiai illusztrációja.`;
   const bytes=new TextEncoder().encode(body),key=`demo/leletiv-v1/${doc}.txt`;
   await c['env'].IMAGING.put(key,bytes,{httpMetadata:{contentType:'text/plain; charset=utf-8'}});
   add('review_documents',{id:doc,case_id:id,title:`${v?'Kontroll':'Kiinduló'} ${modality}-bemutatólelet`,study_date:date,modality,pages_json:JSON.stringify([body]),object_key:key,file_name:doc+'.txt',content_type:'text/plain',sha256:await hash(bytes),created_at:at(v?-3:-35),dataset:'workspace',sample_language:null});
   add('review_evidence',{id:doc+'-evidence',case_id:id,document_id:doc,page:1,quote,note:'Előre megírt demóidézet a mérési adat kipróbálásához.',reviewer_id:rad,created_at:at(v?-2:-34)});
   add('review_measurements',{id:doc+'-measurement',case_id:id,evidence_id:doc+'-evidence',region:p.region,value:p.values[v],unit:'mm',method:'longest-diameter',protocol:modality+' bemutatóprotokoll – azonos leírt mérési módszer',measured_at:date,reviewer_id:rad,comparable:1,created_at:at(v?-2:-34),void_reason:null});
   const image=demoVolume(i,v===1),mask=demoVolume(i,v===1,true),study=id+'-study-'+v,imageKey=`demo/leletiv-v1/${study}.nii`,maskKey=`demo/leletiv-v1/${study}-mask.nii`;
   await c['env'].IMAGING.put(imageKey,image.bytes,{httpMetadata:{contentType:'application/octet-stream'}});await c['env'].IMAGING.put(maskKey,mask.bytes,{httpMetadata:{contentType:'application/octet-stream'}});
   add('imaging_studies',{id:study,case_id:id,modality,description:`${v?'Kontroll':'Kiinduló'} geometriai fantom · szintetikus próbakép`,study_date:date,series_count:1,status:v?'uploaded':'reviewed',object_key:imageKey,file_name:study+'.nii',file_size:image.bytes.length,content_type:'application/octet-stream',created_at:at(v?-3:-35)});
   add('scan_analyses',{id:study+'-analysis',study_id:study,source_hash:await hash(image.bytes),mask_key:maskKey,mask_hash:await hash(mask.bytes),region_id:'demó-régió-01',method:'Ismert geometriai próbarégió',measurements_json:JSON.stringify(mask.measurements),parameters_json:JSON.stringify({synthetic:true,diagnosticUse:false,spacingMm:2}),note:'Generált gömbmaszk a működés kipróbálásához. Nem a leletszövegben szereplő mérés rekonstrukciója.',review_status:v?'unreviewed':'reviewed',reviewer_id:v?null:rad,reviewed_at:v?null:at(-34),created_at:at(v?-3:-35)});
  }
  const follow=id+'-followup';
  add('review_followups',{id:follow,case_id:id,evidence_id:id+'-doc-1-evidence',recommendation:i===1?'Szövettani eredmény beérkezésének ellenőrzése.':'Következő kontroll megszervezése, időpont visszaigazolása.',owner_id:coord,due_date:day(i===2?21:3),priority:p.priority,status:i===2?'acknowledged':'open',version:i===2?2:1,result_evidence_id:null,created_at:at(-2),updated_at:created});
  add('review_events',{id:follow+'-created',followup_id:follow,action:'created',actor_id:coord,note:'Demó utánkövetés létrehozva a kontrollleletből.',result_evidence_id:null,occurred_at:at(-2)});
  if(i===2)add('review_events',{id:follow+'-accepted',followup_id:follow,action:'acknowledged',actor_id:coord,note:'Az időpont-egyeztetési feladatot a demókoordinátor átvette.',result_evidence_id:null,occurred_at:created});
  const exam=id+'-exam';
  add('expected_exams',{id:exam,case_id:id,title:p.exam,owner_id:i===1?onc:rad,due_date:day(i===2?-2:3),appointment_date:day(i===0?1:i===1?-6:-3),status:p.examStatus,study_id:i===2?id+'-study-1':null,document_id:i===2?id+'-doc-1':null,note:i===1?'Mintavétel megtörtént; a végleges lelet még hiányzik.':'Kitalált vizsgálati folyamat a státuszok kipróbálására.',version:i===0?2:i===1?3:5,created_at:at(-8),updated_at:created});
  const examStates=i===0?['requested','scheduled']:i===1?['requested','scheduled','performed']:['requested','scheduled','performed','received','reviewed'];
  examStates.forEach((state,n)=>add('exam_events',{id:exam+'-event-'+n,exam_id:exam,status:state,note:['Vizsgálatkérés rögzítve.','Időpont egyeztetve.','Vizsgálat / mintavétel megtörtént.','Képanyag és lelet beérkezett.','Eredmény áttekintve.'][n]+' Demóesemény.',actor_id:coord,occurred_at:at(i===2?[-8,-7,-3,-2,-1][n]:-8+n)}));
  [['Beutalás rögzítve',p.summary,-42],['Kiinduló képanyag beérkezett','Az esethez két külön időpontú bemutatólelet tartozik.',-35],['Előkészítő megbeszélés',p.decision,-7],['Kontrolllelet beérkezett','A lelet, a forrásidézet és a mérés összekapcsolva.',-3],['Következő lépés',p.milestone,-1]].forEach(([action,detail,dayOffset],n)=>add('activity_log',{id:id+'-activity-'+n,case_id:id,actor:'Demókoordinátor',action:String(action),detail:String(detail),occurred_at:at(Number(dayOffset))}));
 }
 add('scenarios',{id:'demo-lv-scenario',name:'Demó · MR-kiesés és betegút-terhelés',inputs_json:JSON.stringify({...baselineInput,scannerDelay:60,cohortCopies:2}),cohort_json:JSON.stringify(demoCases.map(p=>({id:p.id,patient_name:p.name+' · demó',status:p.status,priority:p.priority}))),model_version:modelVersion,created_at:created});
 // A D1 batch is transactional; rerunning does not reset any existing demo state.
 if(statements.length)await db.batch(statements);
 return c.json({added,caseIds:demoCases.map(p=>p.id),synthetic:true});
});
export {api as demoApi};
