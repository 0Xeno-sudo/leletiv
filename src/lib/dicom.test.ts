import {describe,it,expect} from 'vitest';
import {validateDicomSelection} from './dicom';
describe('DICOM batch boundaries',()=>{
 it('rejects empty and excessive selections',()=>{expect(()=>validateDicomSelection([])).toThrow();expect(()=>validateDicomSelection(Array(2001).fill(new File(['x'],'x.dcm')))).toThrow();});
 it('accepts bounded selections',()=>expect(()=>validateDicomSelection([new File(['x'],'x.dcm')])).not.toThrow());
});
