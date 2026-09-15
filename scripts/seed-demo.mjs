// Additive local-only demo setup. Existing edits are retained.
const root='http://127.0.0.1:5173';
const request=async(url,init)=>{const r=await fetch(url,init);const body=await r.json();if(!r.ok)throw new Error(body.error||body.detail||`HTTP ${r.status}`);return body;};
console.log(await request(root+'/api/demo/install',{method:'POST',headers:{'Content-Type':'application/json','X-Leletiv-Demo':'synthetic-only'},body:'{}'}));
const advanced='http://127.0.0.1:8789/advanced';
try{await request(advanced+'/capabilities');}catch{console.log('A betegutak elkészültek. A kvantitatív mintákhoz indítsd el a helyi Python-feldolgozót, majd futtasd újra ezt a parancsot.');process.exit(0);}
const examples=[['longitudinal','demo-leletiv-03'],['body','demo-leletiv-02'],['pet','demo-leletiv-02'],['pathology','demo-leletiv-02'],['mri','demo-leletiv-01']];
for(const [kind,caseId] of examples){
 const jobs=await request(advanced+'/jobs');
 const existing=jobs.find(j=>j.kind===kind&&j.caseId===caseId&&j.status==='completed');
 if(existing){console.log(kind+': meglévő demóeredmény megőrizve.');continue;}
 let job=await request(advanced+'/demo/'+kind,{method:'POST',headers:{'Content-Type':'application/json','X-NeuroFlow-Research':'1'},body:JSON.stringify({caseId})});
 for(let n=0;n<120&&['queued','running'].includes(job.status);n++){await new Promise(r=>setTimeout(r,500));job=await request(advanced+'/jobs/'+job.id);}
 if(job.status!=='completed')throw new Error(kind+': '+(job.error||job.status));
 console.log(kind+': '+job.id+' · '+caseId+' · elkészült');
}
