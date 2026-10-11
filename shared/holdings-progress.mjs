export async function checkStocksTogether(lines, check) {
 return await Promise.allSettled(lines.map((line,index)=>line.thesisId?check(index):Promise.resolve()));
}
