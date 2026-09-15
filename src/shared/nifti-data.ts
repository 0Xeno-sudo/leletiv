import {readHeader,readImage} from 'nifti-reader-js';
import {readNifti,type VolumeGeometry} from './volume';
export async function decodeVolume(file:File){
 const safe=await readNifti(file),bytes=await safe.arrayBuffer(),h=readHeader(bytes);
 const geometry:VolumeGeometry={dims:h.dims.slice(1,4),spacing:h.pixDims.slice(1,4),affine:h.affine,units:h.xyzt_units&7};
 const raw=readImage(h,bytes),v=new DataView(raw),data=new Float32Array(geometry.dims.reduce((a,b)=>a*b,1));
 const readers:Record<number,(p:number)=>number>={2:p=>v.getUint8(p),4:p=>v.getInt16(p,h.littleEndian),8:p=>v.getInt32(p,h.littleEndian),16:p=>v.getFloat32(p,h.littleEndian),64:p=>v.getFloat64(p,h.littleEndian),256:p=>v.getInt8(p),512:p=>v.getUint16(p,h.littleEndian),768:p=>v.getUint32(p,h.littleEndian)};
 if(!readers[h.datatypeCode])throw new Error('Nem támogatott NIfTI intenzitásformátum.');
 const slope=h.scl_slope||1,inter=h.scl_slope?h.scl_inter:0;
 for(let i=0;i<data.length;i++){data[i]=readers[h.datatypeCode](i*h.numBitsPerVoxel/8)*slope+inter;if(!Number.isFinite(data[i]))throw new Error('A kép nem véges intenzitásértékeket tartalmaz.');}
 return {safe,bytes,header:h,geometry,data};
}
export function maskFile(source:ArrayBuffer,labels:Uint8Array,name='region-mask.nii'){
 const src=new DataView(source),little=src.getInt32(0,true)===348;
 const dims=[1,2,3].map(i=>src.getInt16(40+2*i,little));if(labels.length!==dims.reduce((a,b)=>a*b,1))throw new Error('Eltérő maszkgeometria.');
 const bytes=new Uint8Array(352+labels.length);bytes.set(new Uint8Array(source,0,348));
 const h=new DataView(bytes.buffer);h.setInt16(70,2,little);h.setInt16(72,8,little);h.setFloat32(108,352,little);h.setFloat32(112,1,little);h.setFloat32(116,0,little);h.setFloat32(124,255,little);h.setFloat32(128,0,little);bytes.set(labels,352);
 return new File([bytes],name,{type:'application/octet-stream'});
}
export async function hashBytes(bytes:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
