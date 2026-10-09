import {writeFileSync,mkdirSync} from 'node:fs';
const sources=['https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv','https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt','https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt'];
const contents=await Promise.all(sources.map(async u=>{const r=await fetch(u,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`List fetch ${r.status}`);return r.text();}));
const csv=s=>s.trim().split(/\r?\n/).map(line=>line.match(/("(?:[^"]|"")*"|[^,]+)(?:,|$)/g)?.map(x=>x.replace(/,$/,'').replace(/^"|"$/g,'').replace(/""/g,'"'))||[]);
const rows=csv(contents[0]);const header=rows.shift();const col=n=>header.indexOf(n);const stocks=[];
for(const r of rows){if(!r[col('Symbol')])continue;stocks.push({id:'IN:'+r[col('Symbol')],ticker:r[col('Symbol')],name:r[col('Company Name')],market:'India',aliases:[]});}
if(stocks.length<490)throw Error('Nifty list incomplete');
for(let n=1;n<3;n++){const lines=contents[n].trim().split(/\r?\n/),h=lines.shift().split('|');for(const line of lines){const a=line.split('|'),get=k=>a[h.indexOf(k)];const full=get('Security Name');if(!full||get('Test Issue')!=='N'||get('ETF')!=='N'||!/common stock|common shares|ordinary shares|depositary shares|depository shares/i.test(full)||/warrant|units|preferred|preference|note|debenture/i.test(full))continue;const exchange=n===1?'Nasdaq':get('Exchange');if(n===2&&exchange!=='N'&&exchange!=='A')continue;const ticker=get(n===1?'Symbol':'ACT Symbol');const name=full.split(' - ')[0].trim();if(stocks.some(s=>s.id==='US:'+ticker))continue;stocks.push({id:'US:'+ticker,ticker,name,market:'US',aliases:[]});}}
const eternal=stocks.find(s=>s.id==='IN:ETERNAL');if(eternal)eternal.aliases=['Zomato'];
mkdirSync('shared/data',{recursive:true});writeFileSync('shared/data/stock-lists.json',JSON.stringify({verifiedAt:new Date().toISOString().slice(0,10),sources,stocks},null,2));
console.log(JSON.stringify({india:stocks.filter(s=>s.market==='India').length,us:stocks.filter(s=>s.market==='US').length,demo:stocks.filter(s=>['IN:BAJAJ-AUTO','IN:ETERNAL','US:AAPL'].includes(s.id))}));
