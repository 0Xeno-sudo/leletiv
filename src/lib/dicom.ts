import {readNifti} from '../shared/volume';

export function validateDicomSelection(files:File[]){
 if(!files.length||files.length>2000)throw new Error('Choose between 1 and 2,000 DICOM files.');
 if(files.reduce((total,file)=>total+file.size,0)>256*1024*1024)throw new Error('The DICOM selection exceeds 256 MB.');
}

export async function convertDicom(files:File[],signal?:AbortSignal):Promise<File[]>{
 validateDicomSelection(files);
 const {Dcm2niix}=await import('@niivue/dcm2niix');
 const converter=new Dcm2niix();
 let timer:ReturnType<typeof setTimeout>|undefined;
 let stop:()=>void=()=>{};
 try{
  return await Promise.race([
   (async()=>{
    await converter.init();
    if(signal?.aborted)throw new Error('DICOM conversion cancelled.');
    // Unique neutral names avoid duplicate basenames, patient names and output-name collisions.
    const neutral=files.map((f,i)=>new File([f],`slice-${String(i).padStart(5,'0')}.dcm`));
    const converted=await converter.input(neutral).b('n').ba('y').f('series-%s').z('n').v('0').run();
    const volumes=converted.filter(file=>/\.nii(\.gz)?$/i.test(file.name));
    if(!volumes.length)throw new Error('No supported 3D series was found in these DICOM files.');
    // Do not silently display only the first acquisition; retain separate converted series.
    return await Promise.all(volumes.map(readNifti));
   })(),
   new Promise<never>((_,reject)=>{
    stop=()=>reject(new Error('DICOM conversion cancelled.'));
    signal?.addEventListener('abort',stop,{once:true});
    timer=setTimeout(()=>reject(new Error('DICOM conversion timed out. Try a smaller series.')),120_000);
   })
  ]);
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',stop);converter.worker?.terminate();}
}
