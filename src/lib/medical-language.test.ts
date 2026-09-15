import {describe,expect,it} from 'vitest';
import {anatomyLabel,medicalLabel,qualityValue} from './medical-language';
import {translate,recordText,setLanguage} from './i18n';
import {hungarian} from './translations.hu';

describe('Hungarian analysis presentation',()=>{
 it('preserves anatomical side, level and numbering',()=>{
  expect(anatomyLabel('kidney_left')).toBe('Bal vese');
  expect(anatomyLabel('lung_lower_lobe_right')).toBe('Jobb alsó tüdőlebeny');
  expect(anatomyLabel('rib_right_12')).toBe('Jobb 12. borda');
  expect(anatomyLabel('vertebrae_L3')).toBe('L3 csigolya');
  expect(anatomyLabel('vertebrae_C3')).toBe('C3 csigolya');
 });
 it('keeps counts distinct from physical volume and resolution',()=>{
  expect(translate('Voxels','hu')).toBe('Térbeli képpontok száma');
  expect(translate('Voxel spacing','hu')).toBe('Térbeli felbontás');
  expect(translate('Volume (mL)','hu')).toBe('Térfogat (mL)');
  expect(Object.values(hungarian).filter(s=>/voxel/i.test(s))).toEqual([]);
 });
 it('formats coverage as a percentage without claiming registration accuracy',()=>{
  const result=qualityValue('dwiRegistration',JSON.stringify({coverageFraction:.85}));
  expect(result).toContain('85%');
  expect(result).toContain('nem az illesztési pontosság');
  expect(qualityValue('adcValidFraction',.5)).toBe('50%');
  expect(qualityValue('dscRegistration','invalid')).toContain('eredménycsomagban');
 });
 it('leaves source notes and unknown metadata unchanged',()=>{
  setLanguage('hu');
  const source='ROI: 120 voxel. Original clinical description.';
  expect(recordText(source)).toBe(source);
  expect(medicalLabel(source)).toBe(source);
  expect(anatomyLabel('future_organ_code')).toBe('future_organ_code');
 });
});
