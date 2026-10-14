// References are generated from verified text; the model never rewrites a quote.
export function quoteCatalog(sources){
 return sources.flatMap((source,sourceIndex)=>{
  const quotes=[];let offset=0;
  while(offset<source.excerpt.length){
   let end=Math.min(offset+150,source.excerpt.length);
   if(end<source.excerpt.length){const space=source.excerpt.lastIndexOf(' ',end);if(space>offset+40)end=space;}
   const quote=source.excerpt.slice(offset,end).trim();
   if(quote.length>=15)quotes.push({id:`s${sourceIndex}q${quotes.length}`,sourceUrl:source.url,quote});
   offset=end;
  }
  return quotes;
 });
}
export function resolveEvidenceReferences(raw,quotes,paragraphs=[]){
 const known=new Map(quotes.map(quote=>[quote.id,quote]));
 return {...raw,...(raw.articles?{articles:raw.articles.map(row=>{
  if(!row.paragraphIds)return row;
  const {paragraphIds,...rest}=row;
  return {...rest,paragraphIndices:paragraphIds.map(id=>{const paragraph=paragraphs.find(p=>p.id===id&&p.sourceUrl===row.sourceUrl);if(!paragraph)throw Error('Unknown article paragraph reference.');return paragraph.paragraphIndex;})};
 })}:{}),assumptions:raw.assumptions.map(row=>{
  const {citations,...rest}=row;
  if(!Array.isArray(citations)||citations.length>2||new Set(citations.map(c=>c.sourceUrl)).size!==citations.length)throw Error('Invalid selected citations.');
  return {...rest,sourceUrls:citations.map(c=>c.sourceUrl),brokerageEvidence:citations.flatMap(c=>c.brokerageEvidence.map(item=>({...item,sourceUrl:c.sourceUrl})))};
 }),reviews:raw.reviews.map((review,index)=>({...review,quotes:(review.match==='direct'?raw.assumptions[index].citations.filter(c=>c.quoteId&&c.quoteId!=='none').map(c=>({quoteId:c.quoteId,firm:c.quoteFirm})):[]).map(reference=>{
  const quote=known.get(reference.quoteId);if(!quote)throw Error('Unknown evidence quote reference.');
  return {sourceUrl:quote.sourceUrl,quote:quote.quote,firm:reference.firm};
 })}))};
}
