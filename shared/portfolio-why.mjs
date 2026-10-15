export const bannedWhy=/\b(buy|sell|trim|exit|hold|add|book|should|consider)\b|\bclean[\s-]+up\b/i;
const rounded=(value,digits=1)=>value===null?null:Number(value.toFixed(digits));
export function whyFacts(portfolio){
 return [
  ...portfolio.entries.map((row,index)=>({id:`p${index}`,value:rounded(row.value,2),weight:rounded(row.weight),returnPct:rounded(row.returnPct),portfolioReturnPct:rounded(portfolio.gainPct),invested:Math.round(row.invested),gained:Math.round(row.gain),gainShare:portfolio.gain!==0?rounded(row.gain/portfolio.gain*100):null,portfolioGain:Math.round(portfolio.gain),multiple:rounded(row.value/row.invested),rank:1+portfolio.entries.filter(other=>other.value>row.value).length,nextWeight:portfolio.entries[index+1]?rounded(portfolio.entries[index+1].weight):null,ratio:portfolio.entries[index+1]?rounded(row.value/portfolio.entries[index+1].value):null,isinPresent:true,review:false})),
  ...portfolio.review.map((row,index)=>({id:`r${index}`,value:rounded(row.value,2),weight:null,returnPct:rounded(row.returnPct),portfolioReturnPct:rounded(portfolio.gainPct),invested:null,gained:null,gainShare:null,portfolioGain:Math.round(portfolio.gain),multiple:null,rank:null,nextWeight:null,ratio:null,isinPresent:row.isinPresent,review:true}))
 ];
}
export function whySentenceIssue(sentence,facts){
 if(typeof sentence!=='string'||!sentence.trim()||sentence.length>500||bannedWhy.test(sentence)||/\b(years?|months?|weeks?|days?|since|stagnant|flat|barely|twice|double|triple|half|target\w*|will|would|could|ought|must|desired|ideal|optimal|decrease|reduce|increase|rebalance|reallocate|recommend\w*)\b/i.test(sentence))return 'word or history restriction';
 if(sentence.trim().split(/\s+/).length>=25)return 'word count';
 sentence=sentence.replace(/\u2212/g,'-');
 const withoutNumbers=sentence.replace(/[+-]?\d[\d,]*(?:\.\d+)?/g,'');
 if((withoutNumbers.match(/[.!?]/g)||[]).length!==1||!/[.!?]$/.test(sentence.trim()))return 'sentence count';
 const ordinals=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];
 for(const match of sentence.matchAll(/\b(?:(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|next)(?:\s+|-))?(?:biggest|largest)\b/gi)){
  const prefix=match[1]?.toLowerCase();
  if(prefix==='next'?(facts.rank!==1||facts.nextWeight===null):facts.rank!==(prefix?ordinals.indexOf(prefix)+1:1))return 'rank wording';
 }
 if(/(?:₹\s*[+-]?\d[\d,]*\.\d|\d[\d,]*\.\d+\s*rupees)/i.test(sentence))return 'whole rupees';
 const percentages=[...sentence.matchAll(/([+-]?\d[\d,]*(?:\.\d+)?)\s*(?:%|percent\b|per\s+cent\b)/gi)];
 if(facts.returnPct!==null&&percentages.some(match=>Math.abs(Number(match[1].replaceAll(',','')))===Math.abs(facts.returnPct)))return 'repeated Return';
 const money=[...sentence.matchAll(/(?:₹\s*([+-]?\d[\d,]*(?:\.\d+)?)|([+-]?\d[\d,]*(?:\.\d+)?)\s*rupees)/gi)];
 if(facts.value!==null&&money.some(match=>Math.abs(Number((match[1]||match[2]).replaceAll(',','')))===Math.round(facts.value)))return 'repeated Value';
 const permitted=[facts.invested,facts.gained,facts.gainShare,facts.multiple,facts.weight,facts.portfolioReturnPct,facts.nextWeight,facts.ratio,0.5].filter(value=>value!==null&&value!==undefined);
 const numbers=[...sentence.matchAll(/[+-]?\d[\d,]*(?:\.\d+)?/g)];
 if(!numbers.length&&!facts.review)return 'missing numbers';
 if(!facts.review&&!/\b(gain\w*|loss\w*|lost|times|biggest|largest|original|invested)\b/i.test(sentence))return 'missing meaning';
 return numbers.every(match=>{
  const value=Number(match[0].replaceAll(',',''));if(permitted.includes(value))return true;
  const negative=[facts.gained,facts.gainShare,facts.portfolioReturnPct].some(number=>number!==null&&number<0&&-number===value);
  return negative&&(/\b(down|loss|lost|decline|fallen|fell|negative)(?:\W+\w+){0,3}\W*$/i.test(sentence.slice(0,match.index))||/^\s*%\s*(loss|decline)\b/i.test(sentence.slice(match.index+match[0].length)));
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
