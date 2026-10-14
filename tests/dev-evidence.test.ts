import {it,expect} from 'vitest';
import {recentQueries,skipResearchPage,recoverPublication} from '../shared/dev-evidence.mjs';
import {reasonEvidencePackets} from '../shared/evidence-packets.mjs';
it('uses the same four recent company queries for every set of private reasons',()=>{
 expect(recentQueries('Delhivery Ltd.',['tech first company optimising logistics cost','partnerships already with multiple ecommerce players'],'2026-10-12')).toEqual(['Delhivery results October 2026','Delhivery partnership OR deal OR order October 2026','Delhivery news October 2026','Delhivery brokerage target October 2026']);
 expect(recentQueries('Delhivery Ltd.',['other reason'],'2026-10-12')).toEqual(recentQueries('Delhivery Ltd.',['tech intensive company','cost optimization'],'2026-10-12'));
});
it('skips profiles and other non-news page types before verification',()=>{
 for(const url of ['https://en.wikipedia.org/wiki/Delhivery','https://www.naukri.com/code360/interview-bundle/delhivery','https://play.google.com/store/apps/details?id=example','https://www.franchisebazar.com/blog/delhivery','https://startupintros.com/orgs/delhivery'])expect(skipResearchPage(url,'Delhivery')).toBe(true);
 expect(skipResearchPage('https://publisher.com/news/delhivery-partnership','Delhivery partnership')).toBe(false);
});
it('recovers publication dates from visible text and URLs using the requested fallback order',()=>{
 expect(recoverPublication('<p>Published: October 9, 2026</p>','https://publisher.com/news').date).toBe('2026-10-09');
 expect(recoverPublication('<time datetime="2026-10-10">October 10</time>','https://publisher.com/news').date).toBe('2026-10-10');
 expect(recoverPublication('<article>News</article>','https://publisher.com/news/story-2026-10-09').date).toBe('2026-10-09');
 expect(recoverPublication('<p>Published: February 30, 2026</p>','https://publisher.com/news').date).toBeNull();
 expect(recoverPublication('{"datePublished":"2026-10-09"}{"datePublished":"2025-01-01"}','https://publisher.com/2026/10/09/news').date).toBe('2026-10-09');
});
it('gives each exact reason its closest business passage and excludes stock-market distractors',()=>{
 const cost='Delhivery automation and routing software reduced logistics costs by 15%.';
 const partnerships='Delhivery has partnerships with Amazon and Flipkart for e-commerce parcel delivery.';
 const excerpt='Delhivery shares rose and its stock price gained today.\n\n'+cost+'\n\n'+partnerships+'\n\nThe relative strength index shows Delhivery is neither oversold nor overbought.';
 const reasons=['tech first company optimising logistics cost','partnerships already with multiple ecommerce players'];
 const result=reasonEvidencePackets([{title:'Delhivery',url:'https://publisher.com/news',publisher:'publisher',date:'2026-10-09',excerpt}],reasons)[0];
 expect(result.excerpt).toContain(cost);expect(result.excerpt).toContain(partnerships);expect(result.excerpt).not.toContain('shares');expect(result.excerpt).not.toContain('strength index');expect(result.excerpt.split('\n\n').length).toBeLessThanOrEqual(3);
 expect(reasons).toEqual(['tech first company optimising logistics cost','partnerships already with multiple ecommerce players']);
});

it('prefers metadata then search date then URL then the first visible lines',()=>{
 const html='<script>{"datePublished":"2026-10-01"}</script><article><p>October 4, 2026</p></article>';
 expect(recoverPublication(html,'https://publisher.com/2026/10/03/news','2026-10-02').date).toBe('2026-10-01');
 const visible='<article><h1>News</h1><p>October 4, 2026</p></article>';
 expect(recoverPublication(visible,'https://publisher.com/2026/10/03/news','2026-10-02')).toEqual({date:'2026-10-02',verification:'Search result publication date'});
 expect(recoverPublication(visible,'https://publisher.com/2026/10/03/news','not a date')).toEqual({date:'2026-10-03',verification:'Publication date encoded in publisher URL'});
 expect(recoverPublication(visible,'https://publisher.com/news')).toEqual({date:'2026-10-04',verification:'First visible page lines'});
 expect(recoverPublication('<script>October 4, 2026</script><p>News</p>','https://publisher.com/news').date).toBeNull();
 expect(recoverPublication('<p>News</p>'.repeat(31)+'<p>October 4, 2026</p>','https://publisher.com/news').date).toBeNull();
 expect(recoverPublication(visible,'https://publisher.com/news','2 days ago','2026-10-14').date).toBe('2026-10-12');
 expect(recoverPublication('<p>February 30, 2026</p>','https://publisher.com/2026/02/30/news','2026-02-30').date).toBeNull();
});
