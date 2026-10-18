const fs=require('node:fs');
for(const stock of ['nvidia','delhivery']){
 const raw=fs.readFileSync(`tmp/evidence-fresh-proof/${stock}-raw.txt`,'utf8');
 const lines=raw.split(/\r?\n/);
 const start=lines.find(line=>line.includes('"step":"Check started"'));
 const end=lines.find(line=>line.includes('"step":"Check complete"'));
 const filters=lines.filter(line=>line.includes('"step":"Source filtering"')||line.includes('"step":"Source filtering complete"'));
 const stamp=line=>JSON.parse(line.slice(line.indexOf('{'),line.lastIndexOf('}')+1)).timestamp;
 const statuses=fs.readFileSync(`tmp/evidence-fresh-proof/${stock}-result.json`,'utf8').split(/\r?\n/).filter(line=>line.includes('"status":'));
 const text=[start,...filters,`kept:true count: ${filters.filter(line=>line.includes('"kept":true')).length}`,...statuses,end,`Check started to Check complete: ${Date.parse(stamp(end))-Date.parse(stamp(start))} ms`].join('\n');
 fs.writeFileSync(`tmp/evidence-fresh-proof/${stock}-proof.txt`,text+'\n');
 console.log(stock+'\n'+text);
}
