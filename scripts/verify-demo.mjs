import assert from 'node:assert/strict';
import {readHeader,readImage} from 'nifti-reader-js';
const root=process.argv[2]||'http://127.0.0.1:5173';
assert(['localhost','127.0.0.1'].includes(new URL(root).hostname),'Local verification only');
const get=async(path)=>{const r=await fetch(root+path);assert.equal(r.status,200,path);return r.json();};
const data=await get('/api/bootstrap');
for(const i of [1,2,3]){
 const id=`demo-leletiv-0${i}`;assert(data.cases.some(c=>c.id===id));
 const review=await get(`/api/review/cases/${id}?language=hu`),care=await get(`/api/care/cases/${id}`);
 assert.equal(review.documents.length,2);assert.equal(review.measurements.length,2);assert.equal(review.evidence.length,2);assert.equal(review.followups.length,1);
 assert.equal(care.steps.length,3);assert.equal(care.exams.length,1);assert.equal(care.analyses.length,2);
 for(const doc of review.documents){const r=await fetch(root+`/api/review/documents/${doc.id}/source`);assert.equal(r.status,200);const b=await r.arrayBuffer();const sha=Buffer.from(await crypto.subtle.digest('SHA-256',b)).toString('hex');assert.equal(sha,doc.sha256);assert(new TextDecoder().decode(b).includes('BEMUTATÓ LELET'));}
 for(const v of [0,1]){
  const study=`${id}-study-${v}`,r=await fetch(root+`/api/studies/${study}/download`);assert.equal(r.status,200);const bytes=await r.arrayBuffer();const analysis=care.analyses.find(a=>a.study_id===study);assert.equal(Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex'),analysis.source_hash);
  const mr=await fetch(root+`/api/scans/analyses/${analysis.id}/mask`);assert.equal(mr.status,200);const mask=await mr.arrayBuffer(),h=readHeader(mask),count=new Uint8Array(readImage(h,mask)).filter(v=>v>0).length;
  assert.equal(JSON.parse(analysis.measurements_json)[0].millilitres,count*8/1000);
 }
 console.log(id+': documents, quotations, measurements, tasks, exams and image/mask bytes verified');
}
const before=JSON.stringify(data.tasks.filter(t=>t.case_id.startsWith('demo-leletiv-')));
const install=await fetch(root+'/api/demo/install',{method:'POST',headers:{'X-Leletiv-Demo':'synthetic-only','Content-Type':'application/json'},body:'{}'});assert.equal(install.status,200);assert.equal((await install.json()).added,0);
assert.equal(JSON.stringify((await get('/api/bootstrap')).tasks.filter(t=>t.case_id.startsWith('demo-leletiv-'))),before);
console.log('Repeat installation preserved saved edits.');
