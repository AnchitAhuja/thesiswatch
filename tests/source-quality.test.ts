import { it,expect } from 'vitest';
import { sourceQuality } from '../shared/source-quality.mjs';
import { validateStanding,NO_EVIDENCE } from '../shared/standing.mjs';
it('ranks trusted publishers first, allows other publishers and blocks known content farms',()=>{
 expect(sourceQuality('https://www.techradar.com/pro/news')).toBe('outlet');
 expect(sourceQuality('https://economictimes.indiatimes.com/news/story')).toBe('outlet');
 expect(sourceQuality('https://ir.amd.com/news-events/press-releases/detail/123')).toBe('primary');
 expect(sourceQuality('https://www.sec.gov/Archives/edgar/data/123/filing.htm')).toBe('primary');
 expect(sourceQuality('https://www.brandiconimage.com/2026/10/amd-to-substantially-increase-ai-chip.html')).toBeNull();
 expect(sourceQuality('https://techradar.com.example.org/news')).toBe('other');
 expect(sourceQuality('https://independent-journal.com/news')).toBe('other');
 expect(sourceQuality('https://www.amd.com/en/products/processors.html')).toBe('other');
 expect(sourceQuality('https://news.brandiconimage.com/article')).toBeNull();
});
it('shows no clear evidence if source-quality filtering removes all available sources',()=>{
 const sources=[{url:'https://brandiconimage.com/news'}].filter(s=>sourceQuality(s.url));
 const data={takeaway:'Evidence unclear.',assumptions:Array.from({length:3},()=>({status:'WATCH',signalStrength:'soft',reason:NO_EVIDENCE,sourceUrls:[]}))};
 const result=validateStanding(data,['a','b','c'],sources);
 expect(result.assumptions.every(r=>r.reason===NO_EVIDENCE && r.status==='No new evidence' && r.sources.length===0)).toBe(true);
});
