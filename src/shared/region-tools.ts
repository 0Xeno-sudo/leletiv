import type {VolumeGeometry} from './volume';
export function growRegion(data:Float32Array,g:VolumeGeometry,seed:number[],low:number,high:number,radiusMm:number){
 if(g.units!==2||![low,high,radiusMm].every(Number.isFinite)||low>high||radiusMm<=0||radiusMm>80)throw new Error('Érvényes küszöbök és 0–80 mm közötti sugár szükséges, milliméteres forrásképen.');
 const [nx,ny,nz]=g.dims;if(seed.length!==3||seed.some((v,i)=>!Number.isInteger(v)||v<0||v>=g.dims[i])||data.length!==nx*ny*nz)throw new Error('Jelölj ki egy pontot a forrásképen.');
 const start=seed[0]+seed[1]*nx+seed[2]*nx*ny;
 if(data[start]<low||data[start]>high)throw new Error('A kijelölt pont intenzitása kívül esik a megadott tartományon.');
 const labels=new Uint8Array(data.length),seen=new Uint8Array(data.length),queue=new Uint32Array(Math.min(data.length,2_000_001));let head=0,tail=1,count=0,sum=0,min=Infinity,max=-Infinity;queue[0]=start;seen[start]=1;
 const a=g.affine;
 while(head<tail){const p=queue[head++],z=Math.floor(p/(nx*ny)),y=Math.floor(p/nx)%ny,x=p%nx;const dx=x-seed[0],dy=y-seed[1],dz=z-seed[2];const dist=[0,1,2].reduce((s,i)=>s+(a[i][0]*dx+a[i][1]*dy+a[i][2]*dz)**2,0);const v=data[p];if(dist>radiusMm**2||v<low||v>high)continue;
 labels[p]=1;count++;sum+=v;min=Math.min(min,v);max=Math.max(max,v);
 for(const [ok,q] of [[x>0,p-1],[x<nx-1,p+1],[y>0,p-nx],[y<ny-1,p+nx],[z>0,p-nx*ny],[z<nz-1,p+nx*ny]] as [boolean,number][]){if(ok&&!seen[q]){if(tail>=queue.length)throw new Error('Túl nagy régió. Szűkítsd a sugarat vagy az intenzitástartományt.');seen[q]=1;queue[tail++]=q;}}
 }
 return {labels,voxels:count,mean:sum/count,min,max,seed,low,high,radiusMm};
}
export function maskDifference(a:Uint8Array,b:Uint8Array){if(a.length!==b.length)throw new Error('Eltérő maszkgeometria.');let added=0,removed=0,overlap=0;const labels=new Uint8Array(a.length);for(let i=0;i<a.length;i++){if(a[i]&&b[i]){labels[i]=1;overlap++;}else if(b[i]){labels[i]=2;added++;}else if(a[i]){labels[i]=3;removed++;}}return{labels,added,removed,overlap};}
