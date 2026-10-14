import {ConvexHttpClient} from 'convex/browser';
// This evaluation intentionally cannot target production.
const client=new ConvexHttpClient('https://fearless-ferret-257.convex.cloud',{logger:false});
const cases=[['NVIDIA','ai chip demand will continue to increase'],['Delhivery','technology helps reduce delivery costs'],['Bajaj Auto','two-wheeler demand will keep growing']];
for(const [stock,reason] of cases){
 const start=Date.now();let sourcesFound=0,sourcesKept=0,status='Check failed';let error;
 try{
  const {token}=await client.action('holdingsActions:startHolding',{stock,text:reason});
  await client.action('holdingsActions:checkStock',{token,index:0});
  const view=await client.query('holdings:read',{token});
  const line=view?.lines[0],result=line?.result;
  sourcesFound=result?.searchAudit?.length??0;
  sourcesKept=result?.recentSourcesChecked??0;
  status=result?.assumptions[0]?.status??'Check failed';
  if(line?.error)error=line.error;
 }catch(e){error=e instanceof Error?e.message:String(e);}
 console.log(JSON.stringify({stock,reason,sourcesFound,sourcesKept,status,totalMs:Date.now()-start,...(error?{error}:{})}));
 if(sourcesKept===0||error)process.exitCode=1;
}
