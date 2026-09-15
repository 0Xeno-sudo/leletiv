import {describe,it,expect} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {demoApi} from '../demo-api';
import {demoCases} from './demo';
import {demoVolume} from './demo-volume';
import {readHeader,readImage} from 'nifti-reader-js';

describe('connected synthetic demo installation',()=>{
 it('installs linked records and actual source bytes without resetting edits or existing cases',async()=>{
  const sql=new DatabaseSync(':memory:');
  for(const name of ['0001_initial','0002_scenarios','0003_review','0004_review_datasets','0005_connected_care'])sql.exec(readFileSync(new URL(`../../migrations/${name}.sql`,import.meta.url),'utf8'));
  sql.exec("INSERT INTO patients VALUES('test-patient','TEST-DEMO-KEEP','Synthetic existing case','1980-01-01','Unspecified','Test',1,'2026-01-01')");
  sql.exec("INSERT INTO cases(id,patient_id,pathway,working_diagnosis,priority,status,next_milestone,target_date,summary,created_at,updated_at) VALUES('case-01','test-patient','Test','Synthetic test','routine','triage','Review','2026-10-01','Keep this existing summary','2026-01-01','2026-01-01')");
  const original=sql.prepare("SELECT summary FROM cases WHERE id='case-01'").get();
  const objects=new Map<string,Uint8Array>();
  const prepare=(query:string)=>{let values:unknown[]=[];return {bind(...v:unknown[]){values=v;return this;},async first(){return sql.prepare(query).get(...values as never[])??null;},run(){return sql.prepare(query).run(...values as never[]);}};};
  const env={DB:{prepare,async batch(rows:ReturnType<typeof prepare>[]){sql.exec('BEGIN');try{rows.forEach(r=>r.run());sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}},IMAGING:{async put(key:string,bytes:Uint8Array){objects.set(key,bytes);}}} as unknown as WorkerBindings;
  const install=()=>demoApi.request('http://localhost/install',{method:'POST',headers:{'X-Leletiv-Demo':'synthetic-only'}},env);
  const first=await install();expect(first.status).toBe(200);expect(((await first.json()) as {added:number}).added).toBe(3);
  expect(sql.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  for(const p of demoCases){
   expect(sql.prepare('SELECT count(*) n FROM tasks WHERE case_id=?').get(p.id)?.n).toBe(4);
   expect(sql.prepare('SELECT count(*) n FROM review_documents WHERE case_id=?').get(p.id)?.n).toBe(2);
   const docs=sql.prepare('SELECT d.object_key,d.sha256,e.quote,d.pages_json FROM review_documents d JOIN review_evidence e ON e.document_id=d.id WHERE d.case_id=?').all(p.id);
   for(const d of docs){expect(String(d.pages_json)).toContain(d.quote);expect(objects.has(String(d.object_key))).toBe(true);}
   const studies=sql.prepare('SELECT object_key FROM imaging_studies WHERE case_id=?').all(p.id);
   expect(studies).toHaveLength(2);for(const s of studies)expect(readHeader(objects.get(String(s.object_key))!.buffer as ArrayBuffer).dims.slice(1,4)).toEqual([48,48,48]);
  }
  sql.prepare("UPDATE tasks SET status='done' WHERE id='demo-leletiv-01-task-1'").run();
  const second=await install();expect(((await second.json()) as {added:number}).added).toBe(0);
  expect(sql.prepare("SELECT status FROM tasks WHERE id='demo-leletiv-01-task-1'").get()?.status).toBe('done');
  expect(sql.prepare("SELECT summary FROM cases WHERE id='case-01'").get()).toEqual(original);
  expect(sql.prepare('SELECT count(*) n FROM cases').get()?.n).toBe(4);sql.close();
 });
 it('rejects remote or unmarked demo installation',async()=>{
  for(const [url,headers] of [['https://example.com/install',{'X-Leletiv-Demo':'synthetic-only'}],['http://localhost/install',{}]] as const){const response=await demoApi.request(url,{method:'POST',headers});expect(response.status).toBe(403);}
 });
 it('reports physical mask volume from actual phantom voxels',()=>{
  const {bytes,measurements}=demoVolume(0,false,true);const h=readHeader(bytes.buffer),image=new Uint8Array(readImage(h,bytes.buffer));
  const n=image.reduce((sum,v)=>sum+(v>0?1:0),0);expect(measurements[0].millilitres).toBe(n*8/1000);expect(h.xyzt_units&7).toBe(2);
  expect(demoVolume(0,true,true).measurements[0].voxels).toBeLessThan(n);
 });
});
