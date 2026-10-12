const clean=text=>text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function articleParagraphs(html) {
 const body=html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
 const article=body.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||body;
 const paragraphs=[...article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match=>clean(match[1])).filter(text=>text.length>=50);
 return (paragraphs.length?paragraphs.join('\n\n'):clean(article)).slice(0,24000);
}
export function evidencePackets(sources,reasons) {
 const ignored=new Set('the a an of to is are and or it for with this that one few good able bring years view'.split(' '));
 const words=[...new Set(reasons.join(' ').toLowerCase().match(/[a-z0-9]{3,}/g)||[])].filter(word=>!ignored.has(word));
 // Retrieval vocabulary helps find evidence for the exact reason; it never
 // changes that reason or tells the assessor what conclusion to reach.
 const related={scale:['volume','shipment','capacity','growth'],network:['routing','route','efficiency'],design:['routing','efficiency','service performance'],platforms:['technology','software','competitor']};
 const terms=[...new Set(words.flatMap(word=>[word,...(related[word]||[])]))];
 return sources.map(({title,date,publisher,url,excerpt})=>{
  // Older seven-day cache entries predate paragraph boundaries; select short
  // passages from their original text without refetching or rewriting it.
  const paragraphs=excerpt.includes('\n\n')?excerpt.split(/\n\s*\n/):excerpt.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[excerpt];
  const ranked=paragraphs.map((text,index)=>({text:text.trim(),index,score:terms.reduce((score,word)=>score+(text.toLowerCase().includes(word)?1:0),0)/(text.length>1200?4:1)})).filter(p=>p.text.length>=30&&(excerpt.includes("\n\n")||p.text.length<=1200)&&!(p.text.length>500&&/(?:Subscribe Home|BT Bazaar|Home Markets|Menu Business News)/i.test(p.text)));
  const relevant=ranked.filter(p=>p.score>0);
  const selected=(relevant.length>=2?relevant:ranked).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).sort((a,b)=>a.index-b.index);
  return {title,date,publisher,url,excerpt:selected.map(p=>p.text.slice(0,1200)).join('\n\n')};
 });
}
export function reasonEvidencePackets(sources,reasons) {
 const ignored=new Set('the a an of to is are and or it for with this that one few good able bring years view first company already multiple its their'.split(' '));
 const normalize=text=>text.toLowerCase().replace(/e[- ]commerce/g,'ecommerce').replace(/optimization|optimisation|optimizing|optimising|optimize|optimise/g,'optimisation').replace(/[^a-z0-9 ]/g,' ');
 const related={tech:['technology','software','automation','digital'],optimisation:['efficiency','routing','automation','margin','cost'],cost:['costs','expense','expenses','efficiency','margin'],logistics:['routing','shipment','parcel'],partnerships:['partnership','partners','partner','customers','customer','agreements'],ecommerce:['ecommerce','amazon','flipkart','marketplace','marketplaces'],players:['customers','partners'],scale:['volume','shipment','capacity','growth'],network:['routing','route','density','efficiency'],design:['routing','efficiency','service']};
 const terms=reasons.map(reason=>[...new Set((normalize(reason).match(/[a-z0-9]{3,}/g)||[]).filter(word=>!ignored.has(word)).flatMap(word=>[word,...(related[word]||[])]))]);
 return sources.map(({title,date,publisher,url,excerpt})=>{
  const paragraphs=excerpt.includes('\n\n')?excerpt.split(/\n\s*\n/):excerpt.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[excerpt];
  const ranked=paragraphs.map((text,index)=>{
   text=text.trim();const tokens=new Set(normalize(text).split(/\s+/));
   const market=/\b(?:share price|stock price|target price|price target|relative strength index|rsi|oversold|overbought|market cap|moving averages|stock gained|shares rose|shares of)\b/i.test(text);
   return {text,index,scores:terms.map(words=>market?0:words.reduce((score,word)=>score+(tokens.has(word)?1:0),0)/Math.sqrt(Math.max(1,text.length/200)))};
  }).filter(p=>p.text.length>=30&&p.text.length<=1200&&!/(?:Subscribe Home|BT Bazaar|Home Markets|Menu Business News)/i.test(p.text));
  const selected=new Map();
  // Each reason gets its own best passage before any remaining slots are filled.
  for(let reason=0;reason<terms.length;reason++){
   const best=[...ranked].sort((a,b)=>b.scores[reason]-a.scores[reason]||a.index-b.index)[0];
   if(best?.scores[reason]>0&&(selected.has(best.index)||selected.size<3))selected.set(best.index,best);
  }
  const capacity=3;
  for(const passage of [...ranked].sort((a,b)=>Math.max(...b.scores)-Math.max(...a.scores)||a.index-b.index)){
   if(selected.size>=capacity)break;
   if(Math.max(...passage.scores)>0)selected.set(passage.index,passage);
  }
  return {title,date,publisher,url,excerpt:[...selected.values()].sort((a,b)=>a.index-b.index).map(p=>p.text).join('\n\n')};
 });
}
