// Only explicit diagnostic fields are logged; never serialize SDK errors or headers.
export function evidenceError(error:unknown):string {
 let message=error instanceof Error?`${error.name}: ${error.message}`:String(error);
 for(const [key,value] of Object.entries(process.env))if(/KEY|SECRET|TOKEN|PASSWORD/i.test(key)&&value)message=message.split(value).join('[REDACTED]');
 return message.replace(/(?:sk-ant-|sk-)[A-Za-z0-9_-]+/g,'[REDACTED]').replace(/(Bearer\s+)[^\s]+/gi,'$1[REDACTED]');
}
export type EvidenceLog=(step:string,details?:Record<string,unknown>)=>void;
export function evidenceLogger(stock:string,reasons:string[]):EvidenceLog {
 const started=Date.now();
 return (step,details={})=>{for(const reason of reasons)console.log('[holdings-evidence]',JSON.stringify({stock,reason,step,totalMs:Date.now()-started,timestamp:new Date().toISOString(),...details}));};
}
export async function timedEvidence<T>(log:EvidenceLog|undefined,step:string,operation:()=>Promise<T>):Promise<T> {
 const started=Date.now();log?.(step);
 try {const result=await operation();log?.(step+' complete',{ms:Date.now()-started});return result;}
 catch(error){log?.(step+' failed',{ms:Date.now()-started,error:evidenceError(error)});throw error;}
}

export type SourceReadDiagnostics=Map<string,{ms:number,characters:number}>;
