export const bannedWhy=/\b(buy|sell|trim|exit|hold|add|book|should|consider)\b|\bclean[\s-]+up\b/i;
const rounded=(value,digits=1)=>value===null?null:Number(value.toFixed(digits));
export function whyFacts(portfolio){
 return [
  ...portfolio.entries.map((row,index)=>({id:`p${index}`,value:rounded(row.value,2),weight:rounded(row.weight),returnPct:rounded(row.returnPct),portfolioReturnPct:rounded(portfolio.gainPct),rank:1+portfolio.entries.filter(other=>other.value>row.value).length,nextWeight:index===0&&portfolio.entries[1]?rounded(portfolio.entries[1].weight):null,ratio:index===0&&portfolio.entries[1]?rounded(row.value/portfolio.entries[1].value):null,isinPresent:true,review:false})),
  ...portfolio.review.map((row,index)=>({id:`r${index}`,value:rounded(row.value,2),weight:null,returnPct:rounded(row.returnPct),portfolioReturnPct:rounded(portfolio.gainPct),rank:null,nextWeight:null,ratio:null,isinPresent:row.isinPresent,review:true}))
 ];
}
export function whySentenceIssue(sentence,facts){
 if(typeof sentence!=='string'||!sentence.trim()||sentence.length>500||bannedWhy.test(sentence)||/\b(years?|months?|weeks?|days?|since|stagnant|flat|barely|twice|double|triple|half|target\w*|will|would|could|ought|must|desired|ideal|optimal|decrease|reduce|increase|rebalance|reallocate|recommend\w*)\b/i.test(sentence))return 'word or history restriction';
 if(sentence.trim().split(/\s+/).length>=30)return 'word count';
 sentence=sentence.replace(/\u2212/g,'-');
 const withoutNumbers=sentence.replace(/[+-]?\d[\d,]*(?:\.\d+)?/g,'');
 if((withoutNumbers.match(/[.!?]/g)||[]).length!==1||!/[.!?]$/.test(sentence.trim()))return 'sentence count';
 const ordinals=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];
 for(const match of sentence.matchAll(/\b(?:(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|next)(?:\s+|-))?(?:biggest|largest)\b/gi)){
  const prefix=match[1]?.toLowerCase();
  if(prefix==='next'?(facts.rank!==1||facts.nextWeight===null):facts.rank!==(prefix?ordinals.indexOf(prefix)+1:1))return 'rank wording';
 }
 const permitted=[facts.value,facts.weight,facts.returnPct,facts.portfolioReturnPct,facts.nextWeight,facts.ratio,0.5].filter(value=>value!==null);
 const numbers=[...sentence.matchAll(/[+-]?\d[\d,]*(?:\.\d+)?/g)];
 if(!numbers.length&&!facts.review)return 'missing numbers';
 return numbers.every(match=>{
  const value=Number(match[0].replaceAll(',',''));if(permitted.includes(value))return true;
  const negative=[facts.returnPct,facts.portfolioReturnPct].some(number=>number!==null&&number<0&&-number===value);
  return negative&&(/\b(down|loss|decline|fallen|fell|negative)(?:\W+\w+){0,3}\W*$/i.test(sentence.slice(0,match.index))||/^\s*%\s*(loss|decline)\b/i.test(sentence.slice(match.index+match[0].length)));
 })?null:'number grounding';
}
export const validWhySentence=(sentence,facts)=>whySentenceIssue(sentence,facts)===null;
export function validateWhyNotes(notes,facts){
 if(!notes||typeof notes!=='object'||Object.keys(notes).length!==facts.length)throw Error('Factual notes could not be verified: incomplete batch.');
 for(const row of facts){const issue=whySentenceIssue(notes[row.id],row);if(issue)throw Error('Factual notes could not be verified: '+row.id+' failed '+issue+'.');}
 return notes;
}
// A rejected request is cached too: repainting or editing a limit never makes another AI call.
export function uploadNoteBatch(load){let pending;return ()=>pending||(pending=Promise.resolve().then(load));}
