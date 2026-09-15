/** Geometric brain-shaped phantom, not a patient image or diagnostic ground truth. */
export function demoVolume(index:number,followup=false,mask=false){
 const n=48,bytes=new Uint8Array(352+n*n*n),h=new DataView(bytes.buffer);
 h.setInt32(0,348,true);h.setInt16(40,3,true);for(let i=1;i<=3;i++){h.setInt16(40+i*2,n,true);h.setFloat32(76+i*4,2,true);}h.setInt16(70,2,true);h.setInt16(72,8,true);h.setFloat32(108,352,true);h.setFloat32(112,1,true);h.setUint8(123,2);h.setInt16(254,1,true);for(let i=0;i<3;i++)h.setFloat32(280+i*16+i*4,2,true);h.setFloat32(124,mask?1:200,true);bytes.set(new TextEncoder().encode('SYNTHETIC GEOMETRIC DEMO - NOT A PATIENT SCAN'),148);bytes.set([110,43,49,0],344);
 const radius=followup?(index===2?5:4):5;let count=0;
 for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
 const ell=((x-24)/18)**2+((y-24)/21)**2+((z-24)/18)**2;
 const lesion=(x-30)**2+(y-23)**2+(z-25)**2<=radius**2;const p=352+x+n*y+n*n*z;
 if(lesion)count++;bytes[p]=mask?(lesion?1:0):ell>1?0:lesion?190:ell>.85?110:Math.abs(x-24)<2&&Math.abs(y-24)<8?30:75+Math.round(8*Math.sin(x*.9)*Math.cos(y*.7));
 }
 return {bytes,measurements:[{label:1,voxels:count,millilitres:count*8/1000}]};
}
