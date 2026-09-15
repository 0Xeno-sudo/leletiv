// Isolated integration check: does not open or alter the user's workspace data.
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {migrate} from './migrate.mjs';
const root=await mkdtemp(join(tmpdir(),'leletiv-empty-'));
const options={...convertV4MiniflareOptions({workers:[{name:'verify',modules:true,script:await readFile('dist/worker/worker.js','utf8'),compatibilityDate:'2026-09-13',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'verify'},r2Buckets:{IMAGING:'verify'}}]}),resourcePersistencePath:root};
let mf=new Miniflare(options);
const request=async(path,body,method='POST',status=200)=>{
 const input=new Request('http://localhost/api/'+path,{method,headers:body instanceof FormData?{}:{'Content-Type':'application/json'},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
 const response=await mf.dispatchFetch(input.url,{method,headers:Object.fromEntries(input.headers),body:body?await input.arrayBuffer():undefined});
 const result=await response.json();assert.equal(response.status,status,JSON.stringify(result));return result;
};
try{
 await migrate(await mf.getD1Database('DB'));
 const empty=await request('bootstrap',undefined,'GET');
 for(const key of ['cases','tasks','team','resources','requirements','studies','decisions','activity'])assert.equal(empty[key].length,0,key+' must start empty');
 assert.equal((await request('health',undefined,'GET')).cases,0);
 assert.equal((await mf.dispatchFetch('http://localhost/api/team',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:'{}'})).status,403);
 // A case must also work before any team member exists.
 const caseRecord=await request('cases',{patient_name:'Synthetic verification case',hospital_id:'TEST-EMPTY-001',birth_date:'1980-01-01',working_diagnosis:'Synthetic workflow test'},'POST',201);
 const actor=await request('team',{name:'Synthetic reviewer',role:'Research reviewer',specialty:'Demonstration'},'POST',201);
 await request('team',{name:'Incomplete'},'POST',400);
 const task=await request('tasks',{case_id:caseRecord.id,title:'Synthetic task',owner_id:actor.id},'POST',201);
 await request('tasks/'+task.id,{status:'done'},'PATCH');
 await request('decisions',{case_id:caseRecord.id,recommendation:'Synthetic review',rationale:'Software verification only',recorded_by:'Synthetic reviewer'},'POST',201);
 const bytes=new TextEncoder().encode('SYNTHETIC FILE: no patient data');
 const form=new FormData();form.set('file',new File([bytes],'synthetic.txt',{type:'text/plain'}));form.set('case_id',caseRecord.id);form.set('modality','MR');
 const study=await request('studies/upload',form,'POST',201);
 const loaded=await request('bootstrap',undefined,'GET');assert.equal(loaded.cases[0].coordinator_id,null);assert.equal(loaded.tasks[0].status,'done');assert.equal(loaded.decisions.length,1);
 await mf.dispose();mf=new Miniflare(options);await migrate(await mf.getD1Database('DB'));
 const again=await request('bootstrap',undefined,'GET');assert.equal(again.cases.length,1);assert.equal(again.team[0].id,actor.id);assert.equal(again.tasks[0].status,'done');assert.equal(again.studies[0].id,study.id);
 const download=await mf.dispatchFetch('http://localhost/api/studies/'+study.id+'/download');assert.equal(download.status,200);assert.deepEqual(new Uint8Array(await download.arrayBuffer()),bytes);
 console.log('PASS: empty migrations, first case without seed owners, team, validation, task, decision, R2 bytes, persisted reload and origin rejection.');
}finally{await mf.dispose();await rm(root,{recursive:true,force:true});}
