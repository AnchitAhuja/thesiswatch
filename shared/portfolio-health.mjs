export const SECTORS=['Financial Services','Information Technology','Energy','Consumer Staples','Consumer Discretionary','Industrials','Materials','Healthcare','Utilities','Telecommunications','Real Estate','Automobiles','Diversified','Other','ETF'];
export const unsafeCopy=/\b(buy|sell|trim|exit|hold|add)\b|clean\s+up/i;
const clean=value=>String(value??'').trim();
const key=value=>clean(value).toLowerCase().replace(/\s+/g,' ');
export function amount(value){
 if(typeof value==='number')return Number.isFinite(value)?value:NaN;
 const text=clean(value);if(!text)return NaN;
 const number=Number(text.replace(/[₹,\s%]/g,'').replace(/^\((.*)\)$/,'-$1'));
 return Number.isFinite(number)?number:NaN;
}
const cents=value=>Math.round(value*100);
export function parsePortfolioSheets(sheets){
 const rows=sheets[0]?.data;if(!Array.isArray(rows))throw Error('Choose a Zerodha equity P&L .xlsx statement.');
 const header=rows.findIndex(row=>row.some(cell=>key(cell)==='symbol'));
 if(header<0)throw Error('The first sheet needs a Symbol header row.');
 const columns=new Map(rows[header].map((cell,index)=>[key(cell),index]));
 for(const name of ['symbol','isin','open quantity','open value','unrealized p&l'])if(!columns.has(name))throw Error('A required equity P&L column is missing: '+name+'.');
 const get=(row,name)=>row[columns.get(name)];
 const positions=new Map(),review=[];
 for(const row of rows.slice(header+1)){
  const quantity=amount(get(row,'open quantity'));if(!(quantity>0))continue;
  const symbol=clean(get(row,'symbol')),isin=clean(get(row,'isin'));
  const invested=amount(get(row,'open value')),gain=amount(get(row,'unrealized p&l'));
  const value=invested+gain;
  if(!symbol||!isin||!Number.isFinite(value)||invested<=0||value<=0){review.push({symbol:symbol||'Unnamed security',value:Number.isFinite(value)?value:null,returnPct:invested>0&&Number.isFinite(gain)?gain/invested*100:null,isinPresent:!!isin});continue;}
  const existing=positions.get(isin)||{symbol,quantity:0,investedCents:0,gainCents:0};
  existing.quantity+=quantity;existing.investedCents+=cents(invested);existing.gainCents+=cents(gain);positions.set(isin,existing);
 }
 const entries=[...positions.values()].map(({investedCents,gainCents,...row})=>({...row,invested:investedCents/100,gain:gainCents/100,value:(investedCents+gainCents)/100,returnPct:gainCents/investedCents*100}));
 const total=entries.reduce((sum,row)=>sum+cents(row.value),0)/100;
 const invested=entries.reduce((sum,row)=>sum+cents(row.invested),0)/100;
 entries.forEach(row=>row.weight=total?row.value/total*100:0);entries.sort((a,b)=>b.value-a.value);
 const summary=new Map();
 for(const row of rows.slice(0,header))for(let index=0;index<row.length;index++){
  const name=key(row[index]);if(!['charges','other credit & debit','realized p&l','unrealized p&l'].includes(name))continue;
  const value=row.slice(index+1).map(amount).find(Number.isFinite);if(value!==undefined)summary.set(name,value);
 }
 const ledger=sheets[1]?.data||[];const ledgerHeader=ledger.findIndex(row=>row.some(cell=>key(cell)==='particulars'));
 let delayed=0;
 if(ledgerHeader>=0){const fields=ledger[ledgerHeader].map(key),particulars=fields.indexOf('particulars'),debit=fields.indexOf('debit'),credit=fields.indexOf('credit');
  if(debit<0||credit<0)throw Error('The account sheet needs Debit and Credit columns.');
  for(const row of ledger.slice(ledgerHeader+1))if(/delayed\s+payment\s+charges/i.test(clean(row[particulars]))){const d=amount(row[debit]),c=amount(row[credit]);if(clean(row[debit])&&!Number.isFinite(d)||clean(row[credit])&&!Number.isFinite(c))throw Error('A delayed payment entry has an invalid amount.');delayed+=cents(Number.isFinite(d)?d:0)-cents(Number.isFinite(c)?c:0);}
 }
 return {entries,review,total,invested,gain:total-invested,gainPct:invested?(total-invested)/invested*100:0,account:{realised:summary.get('realized p&l')??null,charges:summary.has('charges')?Math.abs(summary.get('charges')):null,other:summary.get('other credit & debit')??null,delayed:ledgerHeader>=0?delayed/100:null}};
}
export function portfolioFacts(portfolio){const small=portfolio.entries.filter(row=>row.weight<0.5);return {largestPct:Number((portfolio.entries[0]?.weight||0).toFixed(1)),smallCount:small.length,count:portfolio.entries.length};}
export function factualSummaries(facts){const small=`${facts.smallCount} ${facts.smallCount===1?'position is':'positions are'} under 0.5% each`;return [`The largest position is ${facts.largestPct.toFixed(1)}% of your portfolio; ${small}.`,`${facts.count} ${facts.count===1?'position makes':'positions make'} up your portfolio; the largest is ${facts.largestPct.toFixed(1)}%.`,`${small}, and the largest position is ${facts.largestPct.toFixed(1)}% of your portfolio.`];}
export function portfolioFlags(portfolio,limit){
 const flags=[];
 for(const row of portfolio.entries){const why=`${row.weight.toFixed(1)}% of portfolio, ${row.returnPct>=0?'+':''}${row.returnPct.toFixed(1)}% return`;
  const add=flag=>flags.push({...row,flag,why});
  if(row.weight>limit)add(`Above your ${limit}% limit`);
  if(row.value/row.invested>5)add('Up more than 5x');
  if(row.returnPct< -40)add('Down more than 40%');
  if(row.weight<0.5)add('Under 0.5% of portfolio');
 }
 for(const row of portfolio.review)flags.push({...row,flag:'Check with your broker',why:`ISIN present: ${Number(row.isinPresent)}, value: ${row.value===null?'unavailable':row.value.toFixed(2)}`});
 return flags;
}
export function sectorTotals(portfolio,sectors){const totals=new Map();for(const row of portfolio.entries){const sector=SECTORS.includes(sectors[row.symbol])?sectors[row.symbol]:'Other';totals.set(sector,(totals.get(sector)||0)+row.value);}return [...totals].map(([name,value])=>({name,value,weight:portfolio.total?value/portfolio.total*100:0})).sort((a,b)=>b.value-a.value);}
