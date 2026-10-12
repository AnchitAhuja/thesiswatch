import {it,expect} from 'vitest';
import {recentQueries,skipResearchPage,recoverPublication} from '../shared/dev-evidence.mjs';
import {reasonEvidencePackets} from '../shared/evidence-packets.mjs';
it('adds the current month and year to every company query',()=>{
 expect(recentQueries('Delhivery Ltd.',['tech first company optimising logistics cost','partnerships already with multiple ecommerce players'],'2026-10-12')).toEqual(['Delhivery tech first company October 2026','Delhivery partnerships already multiple October 2026','Delhivery brokerage report October 2026','Delhivery quarterly results October 2026']);
});
it('skips profiles and other non-news page types before verification',()=>{
 for(const url of ['https://en.wikipedia.org/wiki/Delhivery','https://www.naukri.com/code360/interview-bundle/delhivery','https://play.google.com/store/apps/details?id=example','https://www.franchisebazar.com/blog/delhivery','https://startupintros.com/orgs/delhivery'])expect(skipResearchPage(url,'Delhivery')).toBe(true);
 expect(skipResearchPage('https://publisher.com/news/delhivery-partnership','Delhivery partnership')).toBe(false);
});
it('recovers publication dates from visible text and URLs without guessing conflicting dates',()=>{
 expect(recoverPublication('<p>Published: October 9, 2026</p>','https://publisher.com/news').date).toBe('2026-10-09');
 expect(recoverPublication('<time datetime="2026-10-10">October 10</time>','https://publisher.com/news').date).toBe('2026-10-10');
 expect(recoverPublication('<article>News</article>','https://publisher.com/news/story-2026-10-09').date).toBe('2026-10-09');
 expect(recoverPublication('<p>Published: February 30, 2026</p>','https://publisher.com/news').date).toBeNull();
 expect(recoverPublication('{"datePublished":"2026-10-09"}{"datePublished":"2025-01-01"}','https://publisher.com/2026/10/09/news').date).toBeNull();
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
