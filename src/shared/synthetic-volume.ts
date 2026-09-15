// Deterministic geometry fixture generated in memory; contains no acquired scan data.
export function syntheticVolume(): ArrayBuffer {
 const n=48,bytes=new ArrayBuffer(352+n*n*n*4),h=new DataView(bytes);
 h.setInt32(0,348,true);h.setInt16(40,3,true);
 for(let axis=0;axis<3;axis++){h.setInt16(42+axis*2,n,true);h.setFloat32(80+axis*4,1,true);h.setFloat32(280+axis*16+axis*4,1,true);}
 h.setInt16(70,16,true);h.setInt16(72,32,true);h.setFloat32(76,1,true);h.setFloat32(108,352,true);h.setFloat32(112,1,true);h.setUint8(123,2);h.setInt16(254,1,true);
 new Uint8Array(bytes,344,4).set([110,43,49,0]);
 new Uint8Array(bytes,148,20).set(new TextEncoder().encode('Synthetic geometry'));
 const data=new Float32Array(bytes,352);
 for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const distance=(x-24)**2+(y-24)**2+(z-24)**2;
  data[x+y*n+z*n*n]=distance<=49?150:distance<400?30:-900;
 }
 return bytes;
}
