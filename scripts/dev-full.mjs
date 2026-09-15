import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
const python=new URL('../.venv-inference/bin/python',import.meta.url);
if(!existsSync(python)){console.error('Set up the local inference environment first. See inference/README.md.');process.exit(1);}
const inference=spawn(python.pathname,['inference/server.py'],{stdio:'inherit'});
const web=spawn(process.execPath,['scripts/dev-safe.mjs'],{stdio:'inherit'});
let closing=false;
function stop(){if(closing)return;closing=true;web.kill('SIGTERM');inference.kill('SIGTERM');}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
for(const child of [web,inference]){child.on('error',error=>{console.error(error.message);stop();process.exitCode=1;});child.on('exit',code=>{if(!closing){stop();process.exitCode=code??1;}});}
