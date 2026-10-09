import { spawnSync } from 'node:child_process';
import { randomBytes,createHash } from 'node:crypto';
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
function run(name,args){const r=spawnSync(process.execPath,['node_modules/convex/bin/main.js','run',name,JSON.stringify(args)],{encoding:'utf8',timeout:360000});if(r.status!==0)throw Error(r.stderr||r.stdout);return r.stdout.trim()?JSON.parse(r.stdout):null;}
mkdirSync('tmp/standing',{recursive:true});
let token;
if(process.argv.includes('--cached')) token=JSON.parse(readFileSync('tmp/standing/private.json','utf8')).token;
else {
 token=randomBytes(32).toString('hex');
 const thesis='Power availability will constrain AI infrastructure expansion more than chip supply over five years';
 const assumptions=['Electricity generation and grid connection capacity will fall short of AI data centre demand.','AI chip supply will expand faster than usable power capacity for data centres.','Power shortages will delay AI infrastructure projects despite available chips over the next five years.'];
 const id=run('theses:reserve',{tokenHash:createHash('sha256').update(token).digest('hex'),original:thesis,investments:[]});
 run('theses:finish',{id,result:{belief:thesis,reflection:thesis,statedReasons:[],inferredAssumptions:assumptions,unverifiedClaims:[],risks:[],strengtheningEvidence:[],weakeningEvidence:[]}});
 writeFileSync('tmp/standing/private.json',JSON.stringify({token,id}));
}
const before=run('aiSpend:today',{});
const result=run('standingActions:check',{token});
const after=run('aiSpend:today',{});
writeFileSync('tmp/standing/result.json',JSON.stringify({result,before,after},null,2));
console.log(JSON.stringify({result,before,after},null,2));
