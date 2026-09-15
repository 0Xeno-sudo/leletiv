import { describe, it, expect } from 'vitest';
import { readHeader, readImage } from 'nifti-reader-js';
import { encodeImageStack, sortSlices, validateSliceFiles, validateStackGeometry, writeGrayscale, STACK_DESCRIPTION } from './image-stack';
import { readNifti, measureLabels } from './volume';
const settings = { spacing: [1, 1, 1] as [number, number, number], calibrated: false, invert: false };
describe('image slices to NIfTI volume', () => {
  it('sorts numeric filenames without changing the selected list', () => {
    const files = [{name:'slice-10.PNG'}, {name:'slice-2.PNG'}, {name:'slice-1.PNG'}];
    expect(sortSlices(files).map(f => f.name)).toEqual(['slice-1.PNG','slice-2.PNG','slice-10.PNG']);
    expect(files[0].name).toBe('slice-10.PNG');
  });
  it('rejects single images, unknown formats and excessive source sizes', () => {
    expect(() => validateSliceFiles([{name:'slice.png',size:20}])).toThrow('at least two');
    expect(() => validateSliceFiles([{name:'1.png',size:20},{name:'2.tiff',size:20}])).toThrow('Convert');
    expect(() => validateSliceFiles([{name:'1.png',size:30e6},{name:'2.png',size:20}])).toThrow('20 MB');
    expect(() => validateSliceFiles([{name:'1.jpeg',size:20},{name:'2.webp',size:20},{name:'3.bmp',size:20}])).not.toThrow();
  });
  it('converts luminance, composites transparency onto black and inverts without turning transparent pixels white', () => {
    const source = new Uint8ClampedArray([255,0,0,255,255,255,255,128,0,0,0,0]);
    const out = new Uint8Array(6); writeGrayscale(source, out, 3, false);
    expect([...out]).toEqual([0,0,0,54,128,0]);
    writeGrayscale(source, out, 0, true); expect([...out.slice(0,3)]).toEqual([201,0,0]);
    expect(() => writeGrayscale(source,out,4,false)).toThrow();
  });
  it('round-trips exact slice order and spacing through the independent NIfTI reader and existing validator', async () => {
    const voxels = Uint8Array.from([1,2,3,4,10,20,30,40,100,110,120,130]);
    const bytes = encodeImageStack(voxels,2,2,3,{...settings,spacing:[.5,.75,3],calibrated:true});
    const file = await readNifti(new File([bytes],'image-stack.nii'));
    const hdr = readHeader(await file.arrayBuffer());
    expect(hdr.dims.slice(1,4)).toEqual([2,2,3]);
    expect(hdr.pixDims.slice(1,4)).toEqual([.5,.75,3]);
    expect(hdr.xyzt_units).toBe(2);
    expect(hdr.qform_code).toBe(0); expect(hdr.sform_code).toBe(0);
    expect(hdr.description.startsWith(STACK_DESCRIPTION)).toBe(true);
    expect([...new Uint8Array(readImage(hdr,bytes))]).toEqual([...voxels]);
  });
  it('does not invent physical units for a stack with relative spacing', () => {
    const hdr = readHeader(encodeImageStack(new Uint8Array(8),2,2,2,settings));
    expect(hdr.xyzt_units).toBe(0);
    expect(() => measureLabels(new Uint8Array(8),{dims:[2,2,2],spacing:[1,1,1],units:0,affine:hdr.affine})).toThrow('physical units');
  });
  it('bounds allocation and rejects invalid spacing and pixel counts', () => {
    for (const spacing of [[0,1,1],[NaN,1,1],[1,1,101]]) expect(() => validateStackGeometry(20,20,3,{...settings,spacing:spacing as [number,number,number]})).toThrow('spacing');
    expect(() => validateStackGeometry(512,512,200,settings)).toThrow('32 million');
    expect(() => encodeImageStack(new Uint8Array(7),2,2,2,settings)).toThrow('pixel data');
  });
});
