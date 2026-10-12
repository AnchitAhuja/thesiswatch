export function articlePassages(source) {
 return (source.excerpt.includes('\n\n')?source.excerpt.split(/\n\s*\n/):source.excerpt.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[source.excerpt]).map(text=>text.trim()).filter(Boolean);
}
export function assembleMeaningMatches(response,sources,reasons) {
 if(!Array.isArray(response?.articles)||response.articles.length!==sources.length)throw Error('Incomplete article matching.');
 const known=new Map(sources.map(source=>[source.url,source])),seen=new Set(),packets=[];
 const reasonArticleMatches=reasons.map(reason=>({reason,sources:[]}));
 for(const row of response.articles){
  const source=known.get(row.sourceUrl);
  if(!source||seen.has(row.sourceUrl)||!Array.isArray(row.reasonIndices)||!Array.isArray(row.paragraphIndices)||row.paragraphIndices.length>3)throw Error('Invalid article matching.');
  seen.add(row.sourceUrl);const paragraphs=articlePassages(source);
  if(row.reasonIndices.some(index=>!Number.isInteger(index)||index<0||index>=reasons.length)||row.paragraphIndices.some(index=>!Number.isInteger(index)||index<0||index>=paragraphs.length))throw Error('Invalid article matching index.');
  if(!row.reasonIndices.length)continue;
  if(!row.paragraphIndices.length)throw Error('Matched article has no passage.');
  const {excerpt,...metadata}=source;
  for(const index of new Set(row.reasonIndices))reasonArticleMatches[index].sources.push(metadata);
  packets.push({...metadata,reasonIndices:[...new Set(row.reasonIndices)],excerpt:[...new Set(row.paragraphIndices)].sort((a,b)=>a-b).map(index=>paragraphs[index]).join('\n\n')});
 }
 return {packets,reasonArticleMatches};
}
