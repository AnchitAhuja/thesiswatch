const {spawnSync}=require('node:child_process'),fs=require('node:fs');
const symbols=['INFY','BAJAJ-AUTO','DELHIVERY','NVDA','NIFTYBEES'];
const facts=symbols.map((_,i)=>({id:'p'+i,value:[146520,125400,100500,85000,500][i],weight:[32,27.4,21.9,18.6,0.1][i],returnPct:[2.1,86.4,-42.7,124.8,3.2][i],portfolioReturnPct:71.5,rank:i+1,nextWeight:i===0?27.4:null,ratio:i===0?1.2:null,isinPresent:true,review:false}));
for(const [name,args] of [['portfolioAI:whyNotes',{facts}],['portfolioAI:sectors',{symbols}]]){
 const r=spawnSync(process.execPath,['node_modules/convex/bin/main.js','run',name,JSON.stringify(args),'--deployment','fearless-ferret-257','--typecheck=disable','--codegen=disable'],{encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024});
 const output=(r.stdout||'')+(r.stderr||'');fs.writeFileSync('tmp/portfolio-real-proof/'+name.split(':')[1]+'-after.txt',output);console.log(name);process.stdout.write(output);console.log('Exit code: '+r.status);
}
