export function bindStockSuggestions(input,list,stocks,onChange){
 let matches=[],active=-1;
 const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');};
 const fit=()=>{if(!list.hidden){const viewport=window.visualViewport;list.style.maxHeight=Math.max(48,Math.min(240,(viewport?.height||window.innerHeight)+(viewport?.offsetTop||0)-input.getBoundingClientRect().bottom-12))+'px';}};
 const choose=index=>{if(!matches[index])return;input.value=matches[index].name;onChange();close();};
 const update=()=>{
  onChange();active=-1;const query=input.value.trim().toLowerCase();
  matches=query?stocks.filter(stock=>[stock.name,stock.ticker,stock.market,...stock.aliases].some(value=>value.toLowerCase().includes(query))):[];
  list.replaceChildren();
  matches.forEach((stock,index)=>{const option=document.createElement('button');option.type='button';option.id='stock-option-'+index;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.tabIndex=-1;option.textContent=stock.name+' ? '+stock.ticker+' ? '+stock.market;option.addEventListener('pointerdown',event=>event.preventDefault());option.addEventListener('click',()=>choose(index));list.append(option);});
  list.hidden=!matches.length;input.setAttribute('aria-expanded',String(!!matches.length));fit();
 };
 input.addEventListener('input',update);
 input.addEventListener('compositionend',update);
 input.addEventListener('focus',()=>{input.scrollIntoView?.({block:'start',behavior:'auto'});update();});
 input.addEventListener('blur',close);
 input.addEventListener('keydown',event=>{
  if(event.isComposing||event.keyCode===229)return;
  if(event.key==='Escape'){close();return;}
  if(list.hidden)return;
  if(event.key==='Enter'&&active>=0){event.preventDefault();choose(active);return;}
  if(!['ArrowDown','ArrowUp'].includes(event.key))return;
  event.preventDefault();active=(active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length;
  [...list.children].forEach((option,index)=>option.setAttribute('aria-selected',String(index===active)));
  input.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView?.({block:'nearest'});
 });
 const resize=()=>{if(document.activeElement===input)input.scrollIntoView?.({block:'start',behavior:'auto'});fit();};
 window.visualViewport?.addEventListener('resize',resize);
 window.addEventListener('pagehide',()=>window.visualViewport?.removeEventListener('resize',resize),{once:true});
}
