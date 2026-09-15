import {readFile,readdir} from 'node:fs/promises';
export async function migrate(DB){
 await DB.prepare('CREATE TABLE IF NOT EXISTS d1_migrations(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE,applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)').run();
 for(const name of (await readdir('migrations')).filter(n=>n.endsWith('.sql')).sort()){
  if(await DB.prepare('SELECT id FROM d1_migrations WHERE name=?').bind(name).first())continue;
  const sql=await readFile(new URL('../migrations/'+name,import.meta.url),'utf8');
  await DB.batch([...sql.split(/;\s*(?:\n|$)/).filter(s=>s.trim()).map(s=>DB.prepare(s)),DB.prepare('INSERT INTO d1_migrations(name) VALUES(?)').bind(name)]);
 }
}
