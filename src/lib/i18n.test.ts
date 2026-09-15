import {describe,it,expect} from 'vitest';
import {translate,recordText,setLanguage} from './i18n';
describe('bilingual display strings',()=>{
 it('translates complete labels and preserves names',()=>{expect(translate('Welcome to NeuroFlow','hu')).toBe('Üdvözöljük a NeuroFlow-ban');expect(translate('Dr. Lilla Tóth','hu')).toBe('Dr. Lilla Tóth');});
 it('translates composed labels without changing identifiers',()=>{expect(translate('3 tasks','hu')).toBe('3 feladat');expect(translate('Status for Confirm blood products','hu')).toBe('Feladat állapota: Vérkészítmények visszaigazolása');expect(translate('NF-DEMO-270','hu')).toBe('NF-DEMO-270');});
 it('leaves the English source unchanged',()=>expect(translate('Patient pathways','en')).toBe('Patient pathways'));
 it('does not translate fragments inside words or arbitrary clinical notes',()=>{expect(translate('admin monitoringx','hu')).toBe('admin monitoringx');setLanguage('hu');expect(recordText('The patient requested a review; no urgent concern.')).toBe('The patient requested a review; no urgent concern.');});
});
