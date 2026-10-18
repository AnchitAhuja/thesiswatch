const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
fs.mkdirSync('tmp/evidence-fresh-proof',{recursive:true});
function run(name,args,label){
 const r=spawnSync(process.execPath,['node_modules/convex/bin/main.js','run',name,JSON.stringify(args),'--deployment','fearless-ferret-257'],{encoding:'utf8',timeout:360000});
 if(label){fs.writeFileSync(`tmp/evidence-fresh-proof/${label}-raw.txt`,r.stderr||'');fs.writeFileSync(`tmp/evidence-fresh-proof/${label}-result.json`,r.stdout||'');}
 if(r.status!==0)throw Error(`${name} failed: ${r.stderr}`);
 return JSON.parse(r.stdout);
}
for(const [stock,text] of [['NVIDIA','AI data center demand will keep growing'],['Delhivery','Its technology helps reduce delivery costs']]){
 const draft=run('holdingsActions:startHolding',{stock,text});
 const session=run('holdings:get',{token:draft.token});
 console.log(`${stock} check started`);
 const result=run('standingActions:checkSaved',{id:session.lines[0].thesisId,bypassCache:true},stock.toLowerCase());
 console.log(`${stock} check returned`);
 if(!result.assumptions?.length)throw Error('No final result');
}
