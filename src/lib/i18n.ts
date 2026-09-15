import {useSyncExternalStore} from 'react';
import {hungarian} from './translations.hu';
export type Language='hu'|'en';
let language:Language='hu';
try{language=localStorage.getItem('leletiv.language')==='en'?'en':'hu';}catch{/* Storage can be unavailable in private contexts. */}
const listeners=new Set<()=>void>();
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export const getLanguage=()=>language;
export const locale=()=>language==='hu'?'hu-HU':'en-GB';
export function setLanguage(next:Language){language=next;try{localStorage.setItem('leletiv.language',next);}catch{};if(typeof document!=='undefined'){document.documentElement.lang=next;document.title=next==='hu'?'Áttekintés':'Overview';}listeners.forEach(fn=>fn());}
export function useLanguage(){return useSyncExternalStore(subscribe,getLanguage,()=> 'hu' as Language);}
const entries=Object.entries(hungarian).sort((a,b)=>b[0].length-a[0].length);
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp(`(?<![\\p{L}])(${entries.map(([key])=>escape(key)).join('|')})(?![\\p{L}])`,'gu');
export function translate(text:string,lang:Language=language):string{
 if(lang==='en')return text;
 const direct=hungarian[text.trim()];if(direct)return text.replace(text.trim(),direct);
 return text.replace(pattern,key=>hungarian[key]??key);
}
/** Translate display strings only. Elements, event handlers, record IDs and form values retain their identity. */
export function localize<T>(value:T):T{
 if(typeof value==='string')return translate(value) as T;
 if(Array.isArray(value))return value.map(localize) as T;
 return value;
}
/** Known demo copy has authored translations. Unrecognized user-entered clinical text is never machine-translated. */
export function recordText<T>(value:T):T{
 return typeof value==='string'&&language==='hu'?(hungarian[value]??value) as T:value;
}
