import {medicalLabel} from './medical-language';
export const advancedRoot = 'http://127.0.0.1:8789/advanced';
export type Workflow = 'longitudinal'|'body'|'pet'|'pathology'|'mri';
export const workflows: {id:Workflow; title:string; short:string; description:string; input:string}[] = [
 {id:'longitudinal',title:'Elváltozások követése',short:'Időbeli változás',description:'Illesztett kontrollképek, régiópárosítás, térfogatváltozás és ellenőrizhető RECIST-munkalap.',input:'Kiinduló és 1–4 kontrollvizsgálat, mindegyikhez az elváltozások külön számozott kijelölése.'},
 {id:'body',title:'3D szervtérkép',short:'Anatómia és testösszetétel',description:'Szervek automatikus körülhatárolása CT-n, anatómiai térfogatok és testösszetétel az L3 szintjében.',input:'HU-kalibrált CT. A helyi modellek automatikusan körülhatárolják a szerveket és szöveteket; ellenőrzött kijelölés is betölthető.'},
 {id:'pet',title:'PET/CT elemzés',short:'Metabolikus aktivitás',description:'PET/CT fúzió, SUV-mérések és a kiválasztott aktivitásrégiók összesítése.',input:'Térben illeszkedő CT és kalibrált PET-képanyag. Képernyőfotóból SUV nem számítható.'},
 {id:'pathology',title:'Digitális szövettan',short:'Sejtmagok és Ki-67',description:'Kijelölt régió sejtmagjainak felismerése, DAB-pozitivitás és javítható sejtszámlálás.',input:'Hematoxilin–DAB festésű kép vagy teljes digitalizált metszet, ismert µm/képpont és patológus által kijelölt tumorrégió.'},
 {id:'mri',title:'Multiparametrikus MR',short:'Diffúzió és perfúzió',description:'ADC-számítás, DSC-integrál, normalizált rCBV és régiónkénti térképstatisztika.',input:'Anatómiai MR, mozgáskorrigált DWI/DSC vagy kész ADC/perfúziós térképek.'},
];
export type Region={label:number;name?:string;volumeMl:number;centerRasMm:number[];maxInPlaneDiameterMm:number;suvMean?:number;suvMax?:number;tlg?:number|null};
export type Pair={baselineLabel:number;followupLabel:number|null};
export type Cell={id:number;x:number;y:number;areaUm2:number;dabOpticalDensity:number;positive:boolean};
export type Artifact={file:string;label:string;kind:'volume'|'image';overlay?:boolean;colormap?:string;sha256:string};
export type Target={id:number;organ:string;lymphNode:boolean;baselineMm:number;followupMm:(number|null)[]};
export type RecistInput={targets:Target[];nonTarget:string[];newLesions:string[]};
export type RecistResult={visits:{visit:number;sumMm:number;baselineChangePercent:number;nadirBeforeMm:number;overallResponse:string;targetResponse:string}[];limitations:string};
export type Review={reviewer:string;note:string;time:number;confirmed:boolean;matching?:Pair[][];recistInputs?:RecistInput;recist?:RecistResult;includedRegions?:number[];metabolicVolumeMl?:number;tlg?:number|null;positivePercent?:number|null;cells?:Record<string,string>;counts?:Record<string,number>};
export type Report={kind:Workflow;method:string;limitations:string[];artifacts:Artifact[];elapsedSeconds:number;parameters:Record<string,unknown>;baseline?:Region[];visits?:{index:number;date:string;registration:{coverageFraction:number};matching:Pair[];regions:Region[]}[];regions?:Region[];composition?:Record<string,string|number|null>|null;cells?:Cell[];summary?:{cells:number;positive:number;positivePercent:number|null};roi?:{x:number;y:number;width:number;height:number};measurements?:{map:string;region:number;validVoxels:number;median:number|null;p10:number|null;p90:number|null}[];quality?:Record<string,string|number>;tracer?:string};
export type Job={id:string;title?:string;caseId?:string;kind:Workflow;status:string;stage:string;progress:number;created:number;version:number;options?:Record<string,unknown>;report:Report|null;review:Review|null;error?:string};
export type Capabilities={simpleitk:boolean;totalSegmentator:boolean;bodyWeights:boolean;compositionWeights:boolean;histology:boolean};
export async function advanced<T>(path:string,init?:RequestInit):Promise<T>{
 const headers=new Headers(init?.headers);if(init?.method&&init.method!=='GET')headers.set('X-NeuroFlow-Research','1');
 if(init?.body&&!(init.body instanceof FormData))headers.set('Content-Type','application/json');
 const response=await fetch(advancedRoot+path,{...init,headers,signal:init?.signal??AbortSignal.timeout(60000)});
 const value=await response.json() as T & {detail?:string};if(!response.ok)throw new Error(typeof value.detail==='string'?medicalLabel(value.detail):'A helyi feldolgozó nem fogadta el a kérést.');return value;
}
export const artifactUrl=(job:Job,file:string)=>`${advancedRoot}/jobs/${job.id}/artifacts/${encodeURIComponent(file)}`;
export const number=(value:number|null|undefined,digits=2)=>value==null?'—':value.toLocaleString('hu-HU',{maximumFractionDigits:digits});
export const statusLabel:Record<string,string>={queued:'Várakozik',running:'Feldolgozás',completed:'Ellenőrzésre kész',failed:'Sikertelen',cancelled:'Megszakítva',interrupted:'Újraindítás miatt megszakadt'};
