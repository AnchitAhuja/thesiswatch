const fs=require('node:fs');
const {ConvexHttpClient}=require('convex/browser');
const {anyApi}=require('convex/server');
const client=new ConvexHttpClient('https://fearless-ferret-257.convex.cloud',{logger:false});
(async()=>{
for(let run=1;run<=3;run++){
 const draft=await client.action(anyApi.holdingsActions.startHolding,{stock:'NVIDIA',text:'AI data center demand will keep growing'});
 const started=Date.now();console.log(`Run ${run} started`);
 await client.action(anyApi.holdingsActions.checkStock,{token:draft.token,index:0});
 const result=await client.query(anyApi.holdings.read,{token:draft.token});
 fs.writeFileSync(`tmp/evidence-observability-proof/run-${run}.json`,JSON.stringify({run,ms:Date.now()-started,...result},null,2));
 console.log(`Run ${run} returned: ${result.lines[0].error||result.lines[0].result?.assumptions.map(row=>row.status).join(', ')}`);
}
})().catch(e=>{console.error(e.message);process.exitCode=1});
