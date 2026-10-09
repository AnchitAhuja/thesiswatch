export const restricted=value=>/\b(buy|sell|hold|exit|recommend\w*)\b/i.test(value);
export function stockTakeaway(rows){
 if(!rows.length)return 'Add your reason before checking.';
 if(rows.every(r=>r.status==='No new evidence'))return 'No new evidence for your reasons.';
 const words={'STRENGTHENING':'strengthened','WEAKENING':'weakened','INTACT':'remained intact','WATCH':'needs attention','No new evidence':'has no new evidence'};
 const distinct=new Set(rows.map(r=>r.status));
 const prefix=distinct.size>1?'Mixed':rows[0].status==='WATCH'?'Watch':rows[0].status.charAt(0)+rows[0].status.slice(1).toLowerCase();
 return prefix+': '+rows.map((r,i)=>`reason ${i+1} ${words[r.status]}`).join('; ')+'.';
}
