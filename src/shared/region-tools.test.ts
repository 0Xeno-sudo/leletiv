import {describe,it,expect} from 'vitest';
import {syntheticVolume} from './synthetic-volume';
import {growRegion,maskDifference} from './region-tools';
import {decodeVolume,hashBytes,maskFile} from './nifti-data';
import {assertSameGrid,measureLabels} from './volume';
import {validDate} from './care';
const g={dims:[5,5,5],spacing:[1,1,1],units:2,affine:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
describe('interactive region and longitudinal tools',()=>{
 it('includes exactly the seed and its six neighbours within a one mm radius',()=>{const r=growRegion(new Float32Array(125).fill(10),g,[2,2,2],5,15,1);expect(r.voxels).toBe(7);expect(r.mean).toBe(10);});
 it('does not jump disconnected islands and respects anisotropic physical distance',()=>{const a=new Float32Array(125);a[62]=10;a[64]=10;expect(growRegion(a,g,[2,2,2],5,15,20).voxels).toBe(1);expect(growRegion(new Float32Array(125).fill(10),{...g,spacing:[2,1,1],affine:[[2,0,0,0],...g.affine.slice(1)]},[2,2,2],5,15,1).voxels).toBe(5);});
 it('rejects missing calibration, out-of-range seeds and unsuitable thresholds',()=>{for(const run of [()=>growRegion(new Float32Array(125),{...g,units:0},[2,2,2],0,1,2),()=>growRegion(new Float32Array(125),g,[5,2,2],0,1,2),()=>growRegion(new Float32Array(125),g,[2,2,2],2,1,2)])expect(run).toThrow();});
 it('separates overlap, appearance and disappearance without calling it response',()=>expect(maskDifference(Uint8Array.of(0,1,1,0),Uint8Array.of(0,1,0,2))).toEqual({labels:Uint8Array.of(0,1,3,2),overlap:1,added:1,removed:1}));
 it('round-trips a mask in source coordinates with exact volume and provenance',async()=>{const source=await decodeVolume(new File([syntheticVolume()],'baseline.nii.gz'));const r=growRegion(source.data,source.geometry,[24,24,24],100,200,10);expect(r.voxels).toBe(1419);const mask=await decodeVolume(maskFile(source.bytes,r.labels));assertSameGrid(source.geometry,mask.geometry);expect(measureLabels(mask.data,mask.geometry)[0].millilitres).toBe(1.419);expect(await hashBytes(source.bytes)).not.toBe(await hashBytes(mask.bytes));expect(Array.from(mask.data)).toEqual(Array.from(r.labels));});
 it('accepts leap days and rejects impossible dates',()=>{expect(validDate('2024-02-29')).toBe(true);expect(validDate('2026-02-29')).toBe(false);expect(validDate('2026-04-31')).toBe(false);});
});
