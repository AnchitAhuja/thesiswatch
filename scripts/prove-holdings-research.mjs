import {spawnSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {holdingsQueries} from '../shared/holdings-research.mjs';
const deployment=readFileSync('.env.local','utf8').match(/^CONVEX_DEPLOYMENT=(.*)$/m)?.[1].split('#')[0].trim();
if(deployment!=='dev:fearless-ferret-257')throw Error('Dev deployment required.');
function run(name,args){const result=spawnSync(process.execPath,['node_modules/convex/bin/main.js','run',name,JSON.stringify(args)],{encoding:'utf8',timeout:600000});if(result.status!==0)throw Error('Dev function failed: '+name+'\n'+result.stderr);return result.stdout.trim()?JSON.parse(result.stdout):null;}
const reasons=['Tech intensive','dense network','cost optimisation'];
const before=run('aiSpend:today',{});
const parsed=run('holdingsActions:startHolding',{stock:'Delhivery',text:'Tech intensive, dense network, cost optimisation'});
if(parsed.items.length!==1||!parsed.items[0].stock.includes('Delhivery')||JSON.stringify(parsed.items[0].reasons)!==JSON.stringify(reasons))throw Error('Exact reasons were not preserved.');
mkdirSync('tmp/standing',{recursive:true});writeFileSync('tmp/standing/delhivery-private.json',JSON.stringify({token:parsed.token}));

run('holdingsActions:checkAll',{token:parsed.token});
const view=run('holdings:read',{token:parsed.token});const after=run('aiSpend:today',{});
const proof={deployment,queries:holdingsQueries('Delhivery Ltd.',reasons),view,spend:{estimatedInr:after.estimatedInr-before.estimatedInr,calls:after.calls-before.calls,before,after}};
writeFileSync('tmp/standing/delhivery-result.json',JSON.stringify(proof,null,2));const line=view?.lines?.[0];
if(!line||JSON.stringify(line.reasons)!==JSON.stringify(reasons))throw Error('Saved reasons changed.');
if(line.error||!line.result)throw Error(line.error||'Evidence check did not finish.');
console.log(JSON.stringify(proof,null,2));
