export type VolumeGeometry={dims:number[];spacing:number[];affine:number[][];units:number};
export function assertSameGrid(a:VolumeGeometry,b:VolumeGeometry){
 const valid=(g:VolumeGeometry)=>g.dims.length===3&&g.dims.every(v=>Number.isInteger(v)&&v>0)&&g.spacing.length===3&&g.spacing.every(v=>Number.isFinite(v)&&v>0)&&g.affine.length===4&&g.affine.every(row=>row.length===4&&row.every(Number.isFinite));
 if(!valid(a)||!valid(b))throw new Error('The mask does not match the scan grid. Registration is required.');
 if(a.dims.some((v,i)=>v!==b.dims[i])||a.spacing.some((v,i)=>Math.abs(v-b.spacing[i])>1e-5)||a.affine.some((row,i)=>row.some((v,j)=>Math.abs(v-b.affine[i][j])>1e-4))||a.units!==b.units) throw new Error('The mask does not match the scan grid. Registration is required.');
}
export function measureLabels(values:ArrayLike<number>,geometry:VolumeGeometry){
 const factor=geometry.units===2?1:geometry.units===1?1000:geometry.units===3?.001:0;
 if(!factor||geometry.spacing.some(v=>!Number.isFinite(v)||v<=0))throw new Error('The scan needs valid physical units for volume measurements.');
 const expected=geometry.dims.reduce((a,b)=>a*b,1);
 if(values.length!==expected)throw new Error('Only a single 3D label volume is supported.');
 const counts=new Map<number,number>();
 for(let i=0;i<values.length;i++){const label=values[i];if(!Number.isInteger(label)||label<0||label>255)throw new Error('Use an integer label mask with values from 0 to 255, not a probability map.');if(label)counts.set(label,(counts.get(label)??0)+1);}
 const a=geometry.affine;
 const determinant=a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])-a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])+a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);
 if(!Number.isFinite(determinant)||Math.abs(determinant)<1e-9)throw new Error('The scan needs valid physical units for volume measurements.');
 const voxelMl=Math.abs(determinant)*factor**3/1000;
 return [...counts].sort((a,b)=>a[0]-b[0]).map(([label,voxels])=>({label,voxels,millilitres:voxels*voxelMl}));
}
export async function readNifti(file:File):Promise<File>{
 if(!/\.nii(\.gz)?$/i.test(file.name))throw new Error('Choose a NIfTI volume (.nii or .nii.gz). DICOM folders and photographs are not supported here.');
 if(file.size>64*1024*1024)throw new Error('The local viewer accepts files up to 64 MB.');
 let bytes:Uint8Array;
 const signature=new Uint8Array(await file.slice(0,2).arrayBuffer());
 if(signature[0]===0x1f&&signature[1]===0x8b){
  const reader=file.stream().pipeThrough(new DecompressionStream('gzip')).getReader();const chunks:Uint8Array[]=[];let length=0;
  try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>160*1024*1024)throw new Error('The decompressed volume is too large.');chunks.push(part.value);}}finally{await reader.cancel();}
  bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 }else bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length<352)throw new Error('Invalid NIfTI header.');
 const view=new DataView(bytes.buffer);const little=view.getInt32(0,true)===348;
 if(view.getInt32(0,little)!==348||String.fromCharCode(...bytes.slice(344,347))!=='n+1')throw new Error('Use a single-file NIfTI-1 volume.');
 const dims=[1,2,3].map(i=>view.getInt16(40+i*2,little));const count=dims.reduce((a,b)=>a*b,1);
 if(view.getInt16(40,little)<3||dims.some(v=>v<2)||count>32_000_000||[4,5,6,7].some(i=>view.getInt16(40+i*2,little)>1))throw new Error('Use one 3D volume with at most 32 million voxels.');
 const bits=view.getInt16(72,little);const offset=view.getFloat32(108,little);
 if(![8,16,32,64].includes(bits)||!Number.isFinite(offset)||offset<352||offset+count*bits/8>bytes.length)throw new Error('The NIfTI voxel data is incomplete or unsupported.');
 return new File([bytes.buffer as ArrayBuffer],file.name.replace(/\.gz$/i,''),{type:'application/octet-stream'});
}
