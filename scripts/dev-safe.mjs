// Local-only development without loading credential-bearing configuration files.
import {build,createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {migrate} from './migrate.mjs';
import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
const output=resolve('.wrangler/local-build');
const port=Number(process.argv[2] || 5173);
async function bundle(){await build({configFile:false,envDir:false,publicDir:false,logLevel:'error',build:{outDir:output,emptyOutDir:true,minify:false,target:'esnext',lib:{entry:resolve('src/worker.ts'),formats:['es'],fileName:()=> 'worker.js'}}});}
await bundle();
const worker=new Miniflare({...convertV4MiniflareOptions({workers:[{name:'neuroflow-local',modules:true,script:'export default {fetch(){return new Response("storage")}}',compatibilityDate:'2026-09-13',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'00000000-0000-0000-0000-000000000001'},r2Buckets:{IMAGING:'neuroflow-imaging'}}],}),resourcePersistencePath:resolve('.wrangler/state/connected-care')});
await worker.setOptions({...convertV4MiniflareOptions({workers:[{name:'neuroflow-local',modules:true,script:await readFile(output+'/worker.js','utf8'),compatibilityDate:'2026-09-13',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'00000000-0000-0000-0000-000000000001'},r2Buckets:{IMAGING:'neuroflow-imaging'}}]}),resourcePersistencePath:resolve('.wrangler/state/connected-care')});
const bindings={DB:await worker.getD1Database('DB'),IMAGING:await worker.getR2Bucket('IMAGING')};
await migrate(bindings.DB);
const server=await createServer({configFile:false,envDir:false,plugins:[react(),{name:'local-worker',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/api/'))return next();try{const chunks=[];for await(const c of req)chunks.push(c);const r=await worker.dispatchFetch('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});res.statusCode=r.status;r.headers.forEach((v,k)=>res.setHeader(k,v));res.end(Buffer.from(await r.arrayBuffer()));}catch{res.statusCode=500;res.end('{"error":"Local Worker failed"}');}});}}],server:{host:'127.0.0.1',port,strictPort:true},optimizeDeps:{exclude:['@niivue/dcm2niix']}});
let pending=Promise.resolve();server.watcher.on('change',path=>{if(/(worker|care-api|scan-api|review-api|shared\/).*\.(ts)$/.test(path)){pending=pending.then(async()=>{await bundle();await worker.setOptions({...convertV4MiniflareOptions({workers:[{name:'neuroflow-local',modules:true,script:await readFile(output+'/worker.js','utf8'),compatibilityDate:'2026-09-13',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'00000000-0000-0000-0000-000000000001'},r2Buckets:{IMAGING:'neuroflow-imaging'}}]}),resourcePersistencePath:resolve('.wrangler/state/connected-care')});}).catch(e=>console.error(e.message));}});
await server.listen();console.log('Local NeuroFlow ready at http://127.0.0.1:'+port);
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,async()=>{await server.close();await worker.dispose();process.exit();});
