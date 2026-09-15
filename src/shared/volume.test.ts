import {describe,it,expect} from 'vitest';
import {assertSameGrid,measureLabels} from './volume';
import {readNifti} from './volume';
import {syntheticVolume} from './synthetic-volume';
import {gzipSync} from 'node:zlib';
const grid={dims:[2,2,2],spacing:[2,2,2],units:2,affine:[[2,0,0,0],[0,2,0,0],[0,0,2,0],[0,0,0,1]]};
describe('traceable segmentation measurements',()=>{
 it('counts separate labels in physical millilitres',()=>expect(measureLabels([1,1,0,0,2,0,0,0],grid)).toEqual([{label:1,voxels:2,millilitres:.016},{label:2,voxels:1,millilitres:.008}]));
 it('rejects probability maps and unknown physical units',()=>{expect(()=>measureLabels([.4,0,0,0,0,0,0,0],grid)).toThrow();expect(()=>measureLabels(new Uint8Array(8),{...grid,units:0})).toThrow();});
 it('rejects masks with the same dimensions but shifted coordinates',()=>{expect(()=>assertSameGrid(grid,{...grid,affine:[[2,0,0,5],...grid.affine.slice(1)]})).toThrow();expect(()=>assertSameGrid(grid,grid)).not.toThrow();});
 it('rejects non-finite or incomplete mask geometry',()=>{expect(()=>assertSameGrid(grid,{...grid,affine:[[NaN,0,0,0],...grid.affine.slice(1)]})).toThrow();expect(()=>assertSameGrid(grid,{...grid,spacing:[]})).toThrow();});
 it('validates a compressed synthetic volume and rejects a fake scan',async()=>{const file=new File([gzipSync(new Uint8Array(syntheticVolume()))],'atlas.nii.gz');const loaded=await readNifti(file);expect(loaded.name).toBe('atlas.nii');expect(loaded.size).toBe(352+48**3*4);await expect(readNifti(new File(['not a volume'],'fake.nii'))).rejects.toThrow('Invalid NIfTI header');});
 it('uses the affine determinant for sheared voxels',()=>{const g={...grid,affine:[[2,1,0,0],[0,2,0,0],[0,0,2,0],[0,0,0,1]]};expect(measureLabels(new Uint8Array(8).fill(1),g)[0].millilitres).toBe(.064);});
 it('accepts a transport-decompressed .nii.gz by inspecting bytes, not its name',async()=>{const raw=await readNifti(new File([gzipSync(new Uint8Array(syntheticVolume()))],'atlas.nii.gz'));const decoded=await readNifti(new File([raw],'atlas.nii.gz'));expect(decoded.size).toBe(raw.size);});
});
