import catalog from './data/stock-lists.json' with {type:'json'};
export const stocks=catalog.stocks;
const normal=value=>String(value).toLowerCase().replace(/\b(limited|ltd|incorporated|inc|corporation|corp|plc)\b/g,'').replace(/[^a-z0-9]/g,'');
export function matchStock(name){
 if(/\b(mutual|fund|etf|scheme|index)\b/i.test(name))return null;
 const key=normal(name);if(!key)return null;
 const exact=stocks.filter(s=>[s.ticker,s.name,...s.aliases].some(x=>normal(x)===key));
 return exact.length===1?exact[0]:null;
}
export const getStockById=id=>stocks.find(s=>s.id===id)||null;
export {restricted,stockTakeaway} from './holdings.mjs';
export function validateExtracted(data,input){
 if(!Array.isArray(data?.items)||data.items.length<1||data.items.length>10)throw Error('Could not identify the entries. Try clearer stock names.');
 return data.items.map(row=>{
  if(typeof row.stock!=='string'||!row.stock.trim()||!input.includes(row.stock)||!Array.isArray(row.reasons)||row.reasons.length>6||row.reasons.some(r=>typeof r!=='string'||!r.trim()||r.length>500||!input.includes(r)))throw Error('Could not preserve your exact words. Please try again.');
  return {stock:row.stock,reasons:row.reasons};
 });
}
