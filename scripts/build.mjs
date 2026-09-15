import {build} from 'vite';
import react from '@vitejs/plugin-react';
await build({configFile:false,envDir:false,plugins:[react()],build:{outDir:'dist/client'},optimizeDeps:{exclude:['@niivue/dcm2niix']}});
await build({configFile:false,envDir:false,publicDir:false,build:{outDir:'dist/worker',target:'esnext',lib:{entry:'src/worker.ts',formats:['es'],fileName:()=> 'worker.js'}}});
