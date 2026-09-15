declare module '@niivue/dcm2niix'{
 interface Processor{b(value:string):Processor;ba(value:string):Processor;f(value:string):Processor;z(value:string):Processor;v(value:string):Processor;run():Promise<File[]>;}
 export class Dcm2niix{worker:Worker|null;init():Promise<boolean>;input(files:File[]):Processor;}
}
