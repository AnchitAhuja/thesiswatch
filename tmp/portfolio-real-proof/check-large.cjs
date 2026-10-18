const {spawn}=require('node:child_process'),fs=require('node:fs');
const symbols=Array.from({length:80},(_,i)=>'SCHEMATEST'+i);
const facts=symbols.map((_,i)=>({id:'p'+i,value:1000+i,weight:1.3,returnPct:2.1,portfolioReturnPct:71.5,rank:i+1,nextWeight:i===0?1.3:null,ratio:i===0?1:null,isinPresent:true,review:false}));
Promise.all([['sectors',{symbols}],['whyNotes',{facts}]].map(([name,args])=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['node_modules/convex/bin/main.js','run','portfolioAI:'+name,JSON.stringify(args),'--deployment','fearless-ferret-257','--typecheck=disable','--codegen=disable'],{timeout:120000});let out='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>out+=b);child.on('error',reject);child.on('close',code=>{fs.writeFileSync('tmp/portfolio-real-proof/'+name+'-80-after.txt',out);if(code){console.log(name+' 80-row failure:\n'+out);process.exitCode=1;}else console.log(name+': '+Object.keys(JSON.parse(out)).length+' real AI results; exit '+code);resolve();});
}))).catch(e=>{console.error(e);process.exitCode=1});
