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
 return sources.map(({title,date,publisher,url,excerpt})=>{
  // Older seven-day cache entries predate paragraph boundaries; select short
  // passages from their original text without refetching or rewriting it.
  const paragraphs=excerpt.includes('\n\n')?excerpt.split(/\n\s*\n/):excerpt.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[excerpt];
  const ranked=paragraphs.map((text,index)=>({text:text.trim(),index,score:words.reduce((score,word)=>score+(text.toLowerCase().includes(word)?1:0),0)})).filter(p=>p.text.length>=30);
  const relevant=ranked.filter(p=>p.score>0);
  const selected=(relevant.length>=2?relevant:ranked).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).sort((a,b)=>a.index-b.index);
  return {title,date,publisher,url,excerpt:selected.map(p=>p.text.slice(0,1200)).join('\n\n')};
 });
}
