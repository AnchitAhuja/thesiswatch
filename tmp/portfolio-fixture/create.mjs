import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const book=Workbook.create();
const sheet=book.worksheets.add('Equity P&L');
const header=['Symbol','ISIN','Quantity','Buy Value','Sell Value','Realized P&L','Realized P&L Pct.','Previous Closing Price','Open Quantity','Open Quantity Type','Open Value','Unrealized P&L','Unrealized P&L Pct.'];
const rows=[['FAKE TEST DATA ONLY'],['Client ID','FAKE-CLIENT-NEVER-SEND'],[],['Charges',75],['Other Credit & Debit',-25],['Realized P&L',250],['Unrealized P&L',10],[],[],header,
 ['FAKEALPHA','FAKEISIN0001',10,1000,0,0,0,600,10,'Long',1000,5000,500],
 ['FAKEBETA','FAKEISIN0002',100,10000,0,0,0,50,100,'Long',10000,-5000,-50],
 ['FAKEGAMMA','FAKEISIN0003',1,10,0,0,0,10,1,'Long',10,0,0],
 ['FAKEDELTA','FAKEISIN0004',1,100,0,0,0,110,1,'Long',100,10,10],
 ['FAKEEPSILON',null,1,500,0,0,0,500,1,'Long',500,0,0],
 ['FAKEZETA','FAKEISIN0006',5,0,0,0,0,0,5,'Long',0,0,0]];
sheet.getRange('A1:N16').values=rows.map(row=>[null,...Array.from({length:13},(_,i)=>row[i]??null)]);
const ledger=book.worksheets.add('Account');
ledger.getRange('A1:E4').values=[['FAKE TEST LEDGER',null,null,null],['Particulars','Posting Date','Debit','Credit'],['Delayed payment charges','2026-10-01',30,0],['Unrelated ledger entry','2026-10-02',999,0]].map(row=>[null,...row]);
await fs.mkdir('tests/fixtures',{recursive:true});
const output=await SpreadsheetFile.exportXlsx(book);await output.save('tests/fixtures/sample-pnl.xlsx');
console.log('Created tests/fixtures/sample-pnl.xlsx with six fake symbols.');
