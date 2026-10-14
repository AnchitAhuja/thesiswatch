import {it,expect} from 'vitest';
import {companyAliasMatch} from '../shared/company-aliases.mjs';
it('accepts full, short and ticker names without case sensitivity',()=>{
 expect(companyAliasMatch('NVIDIA Corporation','NVIDIA Corporation earnings','')).toMatchObject({alias:'NVIDIA Corporation',kind:'fullName'});
 expect(companyAliasMatch('NVIDIA Corporation','nvidia demand','')).toMatchObject({alias:'NVIDIA',kind:'shortName'});
 expect(companyAliasMatch('NVIDIA Corporation','Chip demand','NVDA shipments grew')).toMatchObject({alias:'NVDA',kind:'ticker'});
 expect(companyAliasMatch('Delhivery Ltd.','Delhivery demand','')).toMatchObject({alias:'Delhivery'});
 expect(companyAliasMatch('Bajaj Auto Ltd.','Bajaj Auto volumes','')).toMatchObject({alias:'Bajaj Auto'});
});
it('accepts company-owned domains and subdomains, rejects lookalikes and partial words',()=>{
 for(const host of ['nvidia.com','investor.nvidia.com'])expect(companyAliasMatch('NVIDIA Corporation','Results','Demand','https://'+host+'/news')).toMatchObject({kind:'domain'});
 for(const host of ['notnvidia.com','nvidia.com.evil.example'])expect(companyAliasMatch('NVIDIA Corporation','Results','Demand','https://'+host+'/news')).toBeNull();
 expect(companyAliasMatch('NVIDIA Corporation','NVDAA and Nvidiafake','')).toBeNull();
 expect(companyAliasMatch('NVIDIA Corporation','Other chip company','Demand grew')).toBeNull();
});
