import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({envDir:false,plugins:[react()],optimizeDeps:{exclude:['@niivue/dcm2niix']},server:{host:'127.0.0.1',port:5173}});
