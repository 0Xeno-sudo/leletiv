import {Hono} from 'hono';
import {decodeVolume,hashBytes} from './shared/nifti-data';
import {assertSameGrid,measureLabels} from './shared/volume';
import {requiredText} from './shared/care';
const api=new Hono<{Bindings:WorkerBindings}>();
api.get('/studies/:id/analyses',async c=>c.json((await c['env'].DB.prepare('SELECT * FROM scan_analyses WHERE study_id=? ORDER BY created_at DESC').bind(c.req.param('id')).all()).results));
api.post('/studies/:id/analyses',async c=>{
 const db=c['env'].DB,study=await db.prepare('SELECT * FROM imaging_studies WHERE id=?').bind(c.req.param('id')).first<{id:string;object_key:string;file_name:string;case_id:string}>();
 if(!study?.object_key)return c.json({error:'Előbb mentsd a forrásképet az archívumba.'},400);
 const form=await c.req.formData(),region=form.get('region_id'),note=form.get('note'),method=form.get('method'),mask=form.get('mask');
 if(!requiredText(region,100)||!requiredText(note)||!requiredText(method,120)||!(mask instanceof File)||mask.size>32_001_000)return c.json({error:'Régióazonosító, módszer, megjegyzés és legfeljebb 32 MB-os maszk szükséges.'},400);
 let parameters;try{const raw=String(form.get('parameters')||'{}');if(raw.length>10000)throw Error();parameters=JSON.parse(raw);}catch{return c.json({error:'Érvénytelen paraméterek.'},400);}
 const obj=await c['env'].IMAGING.get(study.object_key);if(!obj)return c.json({error:'A forrásfájl nem található.'},404);
 try{
 const base=await decodeVolume(new File([await obj.arrayBuffer()],study.file_name)),sourceHash=await hashBytes(base.bytes);
 if(sourceHash!==form.get('source_hash'))return c.json({error:'Másik felvétel van nyitva. Az eredmény nem menthető ehhez a vizsgálathoz.'},409);
 const labels=await decodeVolume(mask);assertSameGrid(base.geometry,labels.geometry);const measurements=measureLabels(labels.data,base.geometry);
 const id=crypto.randomUUID(),key=`analyses/${study.id}/${id}.nii`,hash=await hashBytes(labels.bytes);
 await c['env'].IMAGING.put(key,labels.bytes,{httpMetadata:{contentType:'application/octet-stream'}});
 try{await db.prepare('INSERT INTO scan_analyses(id,study_id,source_hash,mask_key,mask_hash,region_id,method,measurements_json,parameters_json,note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,study.id,sourceHash,key,hash,region,method,JSON.stringify(measurements),JSON.stringify(parameters),note,new Date().toISOString()).run();}catch(e){await c['env'].IMAGING.delete(key);throw e;}
 return c.json({id,measurements},201);
 }catch(e){return c.json({error:e instanceof Error?e.message:'A mentés nem sikerült.'},400);}
});
api.get('/analyses/:id/mask',async c=>{
 const row=await c['env'].DB.prepare('SELECT mask_key FROM scan_analyses WHERE id=?').bind(c.req.param('id')).first<{mask_key:string}>();
 if(!row?.mask_key)return c.json({error:'A maszk nem található.'},404);const obj=await c['env'].IMAGING.get(row.mask_key);if(!obj)return c.json({error:'A maszk nem található.'},404);
 return new Response(obj.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="saved-region.nii"'}});
});
api.post('/analyses/:id/review',async c=>{
 const b=await c.req.json(),db=c['env'].DB;if(!requiredText(b.actor_id,80)||!await db.prepare('SELECT id FROM team_members WHERE id=?').bind(b.actor_id).first())return c.json({error:'Válassz ellenőrző személyt.'},400);
 const r=await db.prepare("UPDATE scan_analyses SET review_status='reviewed',reviewer_id=?,reviewed_at=? WHERE id=? AND review_status='unreviewed'").bind(b.actor_id,new Date().toISOString(),c.req.param('id')).run();if(!r.meta.changes)return c.json({error:'Nem található vagy már ellenőrzött eredmény.'},409);return c.json({ok:true});
});
export {api as scanApi};
