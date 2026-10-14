// Also bound waiting if a provider does not promptly honour cancellation.
/** @template T @param {(signal: AbortSignal) => Promise<T>} operation @param {number} ms @returns {Promise<T>} */
export async function searchDeadline(operation, ms=8000) {
 const controller=new AbortController();
 let timer;
 /** @type {Promise<never>} */
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{const error=new Error('Search timed out after '+ms+'ms');error.name='TimeoutError';controller.abort(error);reject(error);},ms);});
 try{return await Promise.race([operation(controller.signal),timeout]);}finally{clearTimeout(timer);}
}
