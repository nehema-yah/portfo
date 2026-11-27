import {SEED} from './seed.js';
import {tr} from './i18n.js';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FA='۰۱۲۳۴۵۶۷۸۹', fa=s=>en()?String(s):String(s).replace(/\d/g,d=>FA[d]);
const n=(x,dp=0)=>x==null||isNaN(x)?'—':fa(Number(x).toLocaleString('en-US',{maximumFractionDigits:dp}).replace(/,/g,en()?',':'٬').replace('-','−'));
const N=(x,dp=0)=>`<bdi>${S?.hide?'•••':n(x,dp)}</bdi>`, pc=x=>x==null?'—':`<bdi>${fa((x*100).toFixed(1).replace('.','٫').replace('-','−'))}٪</bdi>`;
const sg=x=>x>0?'pos':x<0?'neg':'';
const P=s=>{s=String(s).replace(/[۰-۹]/g,d=>FA.indexOf(d)).replace(/[٬,\s]/g,'').replace('٫','.');return s===''?NaN:+s};
const MON='فروردین اردیبهشت خرداد تیر مرداد شهریور مهر آبان آذر دی بهمن اسفند'.split(' ');
const TYPES=['واریز','تبدیل','سود تجمیعی','برداشت'];
const today=()=>{const o={};new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date()).forEach(p=>o[p.type]=+p.value);return o};
const en=()=>S?.lang==='en';
const trObj=o=>Array.isArray(o)?o.map(trObj):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,trObj(v)])):typeof o==='string'?tr(o):o;
const trNode=n=>{if(n.nodeType===3){if(n.nodeValue.trim()&&n.parentNode?.nodeName!=='TEXTAREA'){const v=tr(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}}else if(n.nodeType===1&&!['SCRIPT','STYLE','TEXTAREA','CANVAS'].includes(n.nodeName)){for(const a of['aria-label','placeholder','title'])if(n.hasAttribute(a))n.setAttribute(a,tr(n.getAttribute(a)));n.childNodes.forEach(trNode)}};
const startTr=()=>{document.documentElement.lang='en';document.documentElement.dir='ltr';trNode(document.body);document.title=tr(document.title);new MutationObserver(m=>m.forEach(r=>r.addedNodes.forEach(trNode))).observe(document.body,{childList:true,subtree:true})};
for(const k of['alert','confirm','prompt']){const f=window[k].bind(window);window[k]=(m,d)=>f(en()?tr(m):m,d)}
/* ---------- storage (IndexedDB) ---------- */
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('portfolio',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const kv=async(m,k,v)=>{const db=await idb();return new Promise((res,rej)=>{const q=db.transaction('kv',m==='get'?'readonly':'readwrite').objectStore('kv')[m==='get'?'get':'put'](...(m==='get'?[k]:[v,k]));q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})};
let S; const fresh=()=>({...structuredClone(SEED),priceAt:Date.now(),backupAt:0});
const save=()=>kv('set','state',S);
/* ---------- calculations ---------- */
const JD=(y,m,d)=>{const e=y-474,b=474+((e%2820)+2820)%2820;return d+(m<=7?(m-1)*31:(m-1)*30+6)+Math.floor((b*682-110)/2816)+(b-1)*365+Math.floor(e/2820)*1029983+1948319.5};
const nowJD=()=>{const t=new Date();return Date.UTC(t.getFullYear(),t.getMonth(),t.getDate())/864e5+2440587.5};
const isT=id=>S.assets.find(a=>a.id===id)?.tithe, MA=()=>S.assets.filter(a=>!a.tithe);
function calc(){
  const A=Object.fromEntries(S.assets.map(a=>[a.id,a])),H={},rows={},nj=nowJD();S.assets.forEach(a=>H[a.id]={qty:0,cost:0,real:0,acc:0});let dep=0,wd=0;
  const take=(id,q)=>{const h=H[id];if(!h)return 0;const f=h.qty>0?Math.min(q,h.qty)/h.qty:0,c=h.cost*f;h.acc-=h.acc*f;h.qty-=q;h.cost-=c;return c};
  const accr=(a,q,t)=>{const d=Math.max(0,nj-JD(t.y,t.m,t.d)),T=a.tiers;let r=a.rate||0,dd=d;if(T?.length){const o=[...T].sort((x,y)=>x[0]-y[0]);r=o.filter(k=>k[0]<=d).pop()?.[1]??0;dd=Math.min(d,o.at(-1)[0])}return r>0?q*a.price*r/100*dd/365:0};
  const add=(h,a,t,q)=>{h.qty+=q;const x=accr(a,q,t);h.acc+=x;return x};
  S.tx.map((t,i)=>[t,i]).sort((a,b)=>(a[0].y-b[0].y)||(a[0].m-b[0].m)||(a[0].d-b[0].d)||a[1]-b[1]).forEach(([t])=>{
    const a=A[t.asset],h=H[t.asset];if(!h)return;const r={vq:0,basis:0,acc:0},m=!a.tithe;
    if(t.type==='واریز'){r.acc=add(h,a,t,t.qty);h.cost+=t.amount;if(m)dep+=t.amount;r.vq=t.qty;r.basis=t.amount}
    else if(t.type==='سود تجمیعی'){r.acc=add(h,a,t,t.qty);r.vq=t.qty}
    else if(t.type==='برداشت'){h.real+=t.amount-take(t.asset,t.qty);if(m)wd+=t.amount;r.vq=-t.qty;r.basis=null}
    else if(t.type==='تبدیل'){const c=take(t.from,t.fromQty||0);if(H[t.from])H[t.from].real+=t.amount-c;r.acc=add(h,a,t,t.qty);h.cost+=t.amount;r.vq=t.qty;r.basis=t.amount;r.fq=-(t.fromQty||0)}
    rows[t.id]=r});
  const price=id=>A[id]?.price||0,row=a=>{const h=H[a.id],value=h.qty*a.price+h.acc;return {a,qty:h.qty,cost:h.cost,avg:h.qty?h.cost/h.qty:0,value,pl:value-h.cost,pp:h.cost>0?(value-h.cost)/h.cost:null,real:h.real}};
  let V=0;const list=MA().map(a=>{const x=row(a);V+=x.value;return x}),tl=S.assets.filter(a=>a.tithe).map(row);
  const per=S.periods.at(-1),B=per?per.budget:0,D=dep-wd;
  list.forEach(x=>{x.w=V?x.value/V:0;x.t=x.a.target;x.raw=Math.max(0,(V+B)*x.t-x.value)});
  const sr=list.reduce((s,x)=>s+x.raw,0),k=sr>B&&sr>0?B/sr:1;list.forEach(x=>x.buy=x.raw*k);
  const rep=S.periods.map(p=>{let inv=0,val=0;S.tx.filter(t=>t.period===p.name&&!isT(t.asset)).forEach(t=>{if(t.type==='واریز')inv+=t.amount;if(t.type==='برداشت')inv-=t.amount;const r=rows[t.id];if(r)val+=r.vq*price(t.asset)+(r.acc||0)+(r.fq||0)*price(t.from)});
    const pl=val-inv;return {p,inv,val,pl,ret:inv>0?pl/inv:null,usd:price(SEED.usdNote)?val/price(SEED.usdNote)*100:null}});
  rep.forEach((r,i)=>r.growth=i&&r.ret!=null&&rep[i-1].ret!=null?r.ret-rep[i-1].ret:null);
  return {list,tl,V,D,profit:V-D,B,rows,rep,price};
}
/* ---------- charts ---------- */
const COL=['#0E7C7B','#B8892B','#12263A','#7A5CB0','#C2412D','#4C8FBF','#8A9A3B','#D17A9B','#5A6B7B','#2F9E6B'];
const CH={};
function chart(id,cfg){const el=document.getElementById(id);if(!el)return;CH[id]?.destroy();if(en())cfg=trObj(cfg);Chart.defaults.font.family='Vazirmatn';const cv=k=>getComputedStyle(document.documentElement).getPropertyValue(k).trim();Chart.defaults.color=cv('--mut');Chart.defaults.elements.arc.borderColor=cv('--sf');Chart.defaults.elements.bar.borderRadius=6;Chart.defaults.scale.grid.color=cv('--ln');cfg.options={responsive:true,maintainAspectRatio:false,locale:en()?'en':'fa',...cfg.options,plugins:{...cfg.options?.plugins}};CH[id]=new Chart(el,cfg)}
const tk={callback:v=>n(v)}, tip={callbacks:{label:c=>` ${c.dataset.label||c.label}: ${n(c.parsed.y??c.parsed,c.dataset.pct?1:0)}${c.dataset.pct?(en()?'%':'٪'):''}`}};
function pie(id,type,c,key){chart(id,{type,data:{labels:c.list.map(x=>x.a.name),datasets:[{data:c.list.map(x=>x[key]),backgroundColor:COL}]},options:{cutout:type==='doughnut'?'68%':0,plugins:{legend:{position:'bottom',rtl:!en(),labels:{boxWidth:10}},tooltip:{callbacks:{label:q=>` ${q.label}: ${n(q.parsed)}`}}}}})}
/* ---------- views ---------- */
const V={};let tab='home',repChart=0;
const sp=x=>(x>0?'+':'')+pc(x),col=a=>COL[S.assets.indexOf(a)%10],av=a=>`<i class="av" style="background:${col(a)}">${esc(a.name[0])}</i>`;
V.home=c=>{const nt=c.price(SEED.usdNote),box=c.list.find(x=>x.a.id===SEED.usdBox)?.value||0,age=(Date.now()-S.backupAt)/864e5,top=[...c.list].filter(x=>x.buy>0).sort((a,b)=>b.buy-a.buy).slice(0,4),pr=nt?Math.min(1,box/nt):0;
return `${age>14?`<div class="warn">${S.backupAt?'بیش از ۱۴ روز از آخرین پشتیبان گذشته.':'هنوز پشتیبان نگرفته‌اید.'} <button class="mini" data-act="export">پشتیبان‌گیری</button></div>`:''}
<section class="hero"><div class="lbl">ارزش کل دارایی‌ها</div><div class="big">${N(c.V)}<small> تومان</small></div>
<div class="chips"><span class="pill ${sg(c.profit)}">${N(c.profit)} · ${sp(c.D?c.profit/c.D:null)}</span><span>اصل پول ${N(c.D)}</span></div>
<div class="stack">${c.list.filter(x=>x.value>0).map(x=>`<i style="flex:${x.value};background:${col(x.a)}"></i>`).join('')}</div></section>
<section class="blk"><div class="bh"><h2>پیشنهاد خرید این ماه</h2><div class="bud"><input id="bud" inputmode="numeric" value="${n(c.B)}"><span>تومان</span></div></div>
<div class="grp">${top.map(x=>`<div class="rw">${av(x.a)}<div class="mn"><b>${esc(x.a.name)}</b><small>${pc(x.w)} از ${pc(x.t)}</small></div><div class="en"><b>${N(x.buy)}</b><button class="mini" data-act="buy" data-id="${x.a.id}" data-amt="${Math.round(x.buy)}">ثبت</button></div></div>`).join('')||'<div class="rw"><div class="mn"><small>پیشنهادی وجود ندارد</small></div></div>'}</div>
<button class="lnk" data-t="hold">همه دارایی‌ها و بازتوازن ‹</button></section>
<section class="blk"><div class="grp"><div class="rw"><div class="mn"><b>قلک دلار</b><small>${box>=nt?'آماده خرید ۱ اسکناس ۱۰۰ دلاری':`مانده تا ۱۰۰ دلار: ${N(nt-box)} تومان`}</small><div class="bar"><i style="width:${pr*100}%"></i></div></div><div class="en"><b>${pc(pr)}</b></div></div>
<div class="rw" data-t="rep"><div class="mn"><b>گزارش ماهانه</b><small>روند واریزی، ارزش و بازدهی دوره‌ها</small></div><span class="chev">‹</span></div></div></section>
<section class="blk"><h2>ترکیب دارایی‌ها</h2><div class="card"><div class="cv"><canvas id="c1"></canvas></div></div></section>
<section class="blk"><h2>وزن فعلی و هدف</h2><div class="card"><div class="cv"><canvas id="c2"></canvas></div></div></section>
<details class="blk rules"><summary>منشور کنترل ریسک و انضباط</summary><p>۱. سهم صندوق اهرم تحت هیچ شرایطی از ۳٪ پورتفولیو فراتر نرود؛ در صورت حباب بالای ۱۰٪ نسبت به NAV، از خرید جدید خودداری شود.</p><p>۲. تخصیص ماهانه ۱۰٪ دلار تا رسیدن موجودی قلک به بهای ۱ برگ ۱۰۰ دلاری ادامه می‌یابد و سپس اسکناس فیزیکی در کف قیمتی خریداری می‌شود.</p><p>۳. هم‌تراز (۷٪) ستون رشد شاخص هم‌وزن و کاریس (۵٪) لنگر پایداری ۳۰ شرکت بزرگ است؛ با پایش P/NAV خریداری شوند.</p></details>`};
V.home.after=c=>{pie('c1','doughnut',c,'value');chart('c2',{type:'bar',data:{labels:c.list.map(x=>x.a.name),datasets:[{label:'وزن فعلی',data:c.list.map(x=>x.w*100),backgroundColor:COL[0],pct:1},{label:'وزن هدف',data:c.list.map(x=>x.t*100),backgroundColor:COL[1],pct:1}]},options:{scales:{y:{ticks:tk,title:{display:true,text:'درصد سهم'}},x:{title:{display:true,text:'نام دارایی'}}},plugins:{tooltip:tip,legend:{rtl:!en()}}}});
  $('#bud').onchange=e=>{const v=P(e.target.value),p=S.periods.at(-1);if(v>=0){if(p)p.budget=v;else{const t=today();S.periods.push({name:MON[t.month-1]+' '+(t.year-1000),budget:v,alloc:{}})}save();draw()}}};
V.hold=c=>`<div class="grp">${c.list.map(x=>{const d=Math.abs(x.w-x.t)>.03;return `<div class="rw" data-act="ainfo" data-id="${x.a.id}">${av(x.a)}<div class="mn"><b>${esc(x.a.name)}</b><small class="${d?'neg':''}">${pc(x.w)} از ${pc(x.t)}</small><div class="bar t"><i style="width:${Math.min(100,x.w*100)}%"></i><u style="inset-inline-start:${Math.min(100,x.t*100)}%"></u></div></div><div class="en"><b>${N(x.value)}</b><span class="pill ${sg(x.pp)}">${sp(x.pp)}</span></div></div>`}).join('')}</div>
<div class="grp"><div class="rw"><div class="mn"><b>مجموع</b><small>سود / زیان ${N(c.list.reduce((a,x)=>a+x.pl,0))}</small></div><div class="en"><b>${N(c.V)}</b></div></div></div>
<section class="blk"><h2>وزن فعلی پورتفو</h2><div class="card"><div class="cv"><canvas id="c3"></canvas></div></div></section><section class="blk"><h2>سود و زیان‌ها</h2><div class="card"><div class="cv"><canvas id="c4"></canvas></div></div></section>`;
V.hold.after=c=>{pie('c3','pie',c,'value');chart('c4',{type:'bar',data:{labels:c.list.map(x=>x.a.name),datasets:[{label:'سود / زیان کل',data:c.list.map(x=>x.pl),backgroundColor:c.list.map(x=>x.pl<0?'#C2412D':'#1B8A5A')}]},options:{scales:{y:{ticks:tk},x:{title:{display:true,text:'نام دارایی'}}},plugins:{tooltip:tip,legend:{display:false}}}})};
let fp='';
const TI={'واریز':['↓','pos'],'برداشت':['↑','neg'],'تبدیل':['⇄',''],'سود تجمیعی':['✦','pos']};
V.tx=(c,th)=>{const L=S.tx.filter(t=>(!fp||t.period===fp)&&!!isT(t.asset)===!!th),aN=id=>S.assets.find(a=>a.id===id)?.name||'—',g={};
 [...L].sort((a,b)=>(b.y-a.y)||(b.m-a.m)||(b.d-a.d)).forEach(t=>(g[t.y+'/'+t.m]??=[]).push(t));
 return `<div class="chipsr">${['',...S.periods.map(p=>p.name)].map(p=>`<button data-act="fpf" data-v="${esc(p)}" class="${fp===p?'on':''}">${p?esc(p):'همه'}</button>`).join('')}</div>
${Object.entries(g).map(([k,a])=>{const[y,m]=k.split('/');return `<h3 class="gh">${MON[m-1]} ${fa(y)}</h3><div class="grp">${a.map(t=>{const r=c.rows[t.id]||{},cur=r.vq*c.price(t.asset)+(r.acc||0),pl=r.basis==null?null:cur-r.basis,ic=TI[t.type]||['',''];return `<div class="rw" data-act="edit" data-id="${t.id}"><i class="av ic ${ic[1]}">${ic[0]}</i><div class="mn"><b>${esc(aN(t.asset))}</b><small>${fa(t.d)} ${MON[t.m-1]} · ${t.type} · ${esc(t.period)}</small></div><div class="en"><b class="${ic[1]}">${t.type==='برداشت'?'−':t.type==='تبدیل'?'':'+'}${N(t.amount)}</b>${r.basis>0?`<span class="pill ${sg(pl)}">${sp(pl/r.basis)}</span>`:''}</div></div>`}).join('')}</div>`}).join('')||'<p class="empty">تراکنشی ثبت نشده. با دکمه + اولین تراکنش را اضافه کنید.</p>'}`};
V.tx.after=()=>{};
V.tithe=c=>{const T=c.tl,tv=T.reduce((a,x)=>a+x.value,0),tc=T.reduce((a,x)=>a+x.cost,0),pl=tv-tc;
 return `<h2 class="ph">ده‌یک</h2>${T.length?`<section class="hero"><div class="lbl">موجودی کل ده‌یک (تومان)</div><div class="big">${N(tv)}</div><div class="chips"><span>اصل واریزی <b>${N(tc)}</b></span><span class="${sg(pl)}">سود/زیان <b>${N(pl)}</b> ${pc(tc?pl/tc:null)}</span></div></section>
${T.map(x=>`<article class="card"><header><b>${esc(x.a.name)}</b><span class="${sg(x.pl)}">${N(x.pl)}</span></header><dl><div><dt>موجودی</dt><dd>${N(x.value)}</dd></div><div><dt>اصل پول</dt><dd>${N(x.cost)}</dd></div><div><dt>درصد افت/رشد</dt><dd class="${sg(x.pp)}">${pc(x.pp)}</dd></div></dl></article>`).join('')}
<section class="card"><h2>ترکیب موجودی ده‌یک</h2><div class="cv"><canvas id="c6"></canvas></div></section><section class="card"><h2>سود و زیان ده‌یک</h2><div class="cv"><canvas id="c7"></canvas></div></section>`:'<p class="empty">هنوز دارایی ده‌یک تعریف نشده. در تنظیمات، دارایی جدید را با گزینه «ده‌یک» اضافه کنید.</p>'}<h3 class="gh">تراکنش‌ها</h3>${V.tx(c,true)}`};
V.tithe.after=c=>{if(c.tl.length){const q={list:c.tl};pie('c6','doughnut',q,'value');chart('c7',{type:'bar',data:{labels:c.tl.map(x=>x.a.name),datasets:[{label:'سود / زیان',data:c.tl.map(x=>x.pl),backgroundColor:c.tl.map(x=>x.pl<0?'#C2412D':'#1B8A5A')}]},options:{scales:{y:{ticks:tk}},plugins:{tooltip:tip,legend:{display:false}}}})}V.tx.after()};
const RC=[['سرمایه واریزی','inv','line'],['ارزش پورتفو','val','bar'],['سود و زیان','pl','line'],['بازدهی','ret','line']];
V.rep=c=>{const T=c.rep,s=k=>T.reduce((a,r)=>a+(r[k]||0),0),rr=T.filter(r=>r.ret!=null),avg=rr.length?rr.reduce((a,r)=>a+r.ret,0)/rr.length:null;
return `<div class="kpis"><div class="kp"><small>جمع واریزی</small><b>${N(s('inv'))}</b></div><div class="kp"><small>جمع ارزش</small><b>${N(s('val'))}</b></div><div class="kp"><small>جمع سود / زیان</small><b class="${sg(s('pl'))}">${N(s('pl'))}</b></div><div class="kp"><small>میانگین بازدهی</small><b class="${sg(avg)}">${sp(avg)}</b></div></div>
<div class="card"><div class="segc sm">${RC.map((r,i)=>`<button data-act="rc" data-i="${i}" class="${i===repChart?'on':''}">${r[0]}</button>`).join('')}</div><div class="cv"><canvas id="c5"></canvas></div></div>
<div class="bh"><h3 class="gh">دوره‌ها</h3><span class="sub">معادل دلار کل: ${N(s('usd'),1)}</span></div>
<div class="grp">${T.map(r=>`<div class="rw st"><div class="mn"><b>${esc(r.p.name)}</b><small>واریزی ${N(r.inv)} · سود/زیان ${N(r.pl)}</small><small>معادل ${N(r.usd,1)} دلار</small></div><div class="en"><b>${N(r.val)}</b><span class="pill ${sg(r.pl)}">${sp(r.ret)}</span>${r.growth==null?'':`<small class="${sg(r.growth)}">رشد ${sp(r.growth)}</small>`}</div></div>`).join('')||'<div class="rw st"><small>دوره‌ای ثبت نشده</small></div>'}</div>
<div class="bh"><h3 class="gh">تخصیص بودجه</h3></div>
${S.periods.map((p,i)=>{const sm=MA().reduce((a,x)=>a+(p.alloc[x.id]||0),0),ok=Math.abs(sm-1)<1e-6;return `<details class="grp pd" ${i===S.periods.length-1?'open':''}><summary><div class="mn"><b>${esc(p.name)}</b><small>بودجه ${N(p.budget)} تومان</small></div><span class="pill ${ok?'pos':'neg'}">${ok?pc(1):pc(sm)}</span></summary>${MA().map(a=>{const v=p.alloc[a.id]||0;return `<div class="rw st">${av(a)}<div class="mn"><b>${esc(a.name)}</b><div class="bar"><i style="width:${Math.min(100,v*100)}%"></i></div></div><div class="en"><b>${N(v*p.budget)}</b><small>${pc(v)}</small></div></div>`}).join('')}<div class="rw st"><button class="mini" data-act="eper" data-i="${i}">ویرایش دوره</button>${ok?'':'<small class="neg">جمع درصدها باید ۱۰۰٪ باشد</small>'}</div></details>`}).join('')}
<button class="pri wide" data-act="eper" data-i="-1">+ دوره جدید</button>`};
V.rep.after=c=>{const [t,k,ty]=RC[repChart],pctv=k==='ret';chart('c5',{type:ty,data:{labels:c.rep.map(r=>r.p.name),datasets:[{label:t,data:c.rep.map(r=>pctv&&r[k]!=null?r[k]*100:r[k]),pct:pctv?1:0,backgroundColor:COL[0],borderColor:COL[0],tension:.3}]},options:{scales:{y:{ticks:tk}},plugins:{tooltip:tip,legend:{display:false}}}})};
V.set=c=>{const ts=S.assets.reduce((a,x)=>a+x.target,0),ok=Math.abs(ts-1)<1e-6;let fl=[];try{fl=JSON.parse(window.Android?.getPrices?.()||'{}').failed||[]}catch{}
const rowA=a=>`<div class="rw" data-act="easset" data-i="${S.assets.indexOf(a)}">${av(a)}<div class="mn"><b>${esc(a.name)}</b><small>${a.fixed?'قیمت ثابت ۱':N(a.price)}${a.tiers?.length?' · سود پله‌ای':a.rate>0?' · سود ثابت '+pc(a.rate/100):''}</small></div><div class="en"><span class="pill">${a.tithe?'ده‌یک':pc(a.target)}</span></div></div>`;
return `<h3 class="gh">زبان</h3><div class="card"><div class="segc lg"><button data-act="lang" data-v="fa" class="${en()?'':'on'}">فارسی</button><button data-act="lang" data-v="en" class="${en()?'on':''}">English</button></div></div><h3 class="gh">قیمت‌ها</h3><div class="grp"><div class="rw" data-act="prices"><div class="mn"><b>به‌روزرسانی دستی قیمت‌ها</b><small>آخرین به‌روزرسانی: ${fa(new Date(S.priceAt).toLocaleString((en()?'en-US':'fa-IR')))}</small></div><span class="chev">‹</span></div>${window.Android?`<div class="rw" data-act="fetch"><div class="mn"><b>دریافت آنلاین قیمت‌ها</b><small>${fl.length?'ناموفق در آخرین دریافت: '+esc(fl.map(k=>S.assets.find(a=>a.id===k)?.name||k).join('، ')):'خودکار هر روز ساعت ۱۳، ۱۶ و ۱۸'}</small></div><span class="chev">‹</span></div>`:''}</div>
<div class="bh"><h3 class="gh">دارایی‌ها</h3><button class="mini" data-act="easset" data-i="-1">+ دارایی</button></div>
<div class="grp">${MA().map(rowA).join('')}</div><p class="sub ${ok?'':'neg'}" style="margin:-4px 4px 12px">جمع وزن‌های هدف: ${pc(ts)} ${ok?'✓':'— باید ۱۰۰٪ باشد'}</p>
${S.assets.some(a=>a.tithe)?`<h3 class="gh">ده‌یک</h3><div class="grp">${S.assets.filter(a=>a.tithe).map(rowA).join('')}</div>`:''}
<h3 class="gh">محل نگهداری</h3><div class="grp"><div class="rw" data-act="locs"><div class="mn"><b>مدیریت محل‌های نگهداری</b><small>${fa(S.locs.length)} مورد</small></div><span class="chev">‹</span></div></div>
<h3 class="gh">داده‌ها</h3><div class="grp"><div class="rw" data-act="export"><div class="mn"><b>پشتیبان‌گیری</b><small>آخرین: ${S.backupAt?fa(new Date(S.backupAt).toLocaleDateString((en()?'en-US':'fa-IR'))):'هرگز'}</small></div><span class="chev">‹</span></div><div class="rw" data-act="xlsx"><div class="mn"><b>خروجی اکسل</b><small>همه برگه‌ها در یک فایل xlsx (ذخیره در Downloads)</small></div><span class="chev">‹</span></div><label class="rw"><div class="mn"><b>بازیابی از فایل پشتیبان</b></div><span class="chev">‹</span><input type="file" id="imp" accept=".json" hidden></label><div class="rw danger" data-act="reset"><div class="mn"><b>بازگشت به داده‌های اولیه</b></div></div></div>
<p class="sub" style="margin:-4px 4px 14px">داده‌ها فقط در حافظه همین دستگاه ذخیره می‌شوند.</p>
<details class="rules"><summary>راهنمای مدیریت نرخ‌ها و کنترل حباب</summary><p>۱. قیمت دارایی‌های بورسی و دلار با «دریافت آنلاین» (خودکار، روزی سه بار) یا دستی از «به‌روزرسانی قیمت‌ها» وارد می‌شود.</p><p>۲. برای دارایی‌های ارزش‌ثابت (درآمد ثابت، مگاسود، قلک دلار) قیمت واحد همواره ۱ تومان است و بازدهی آن‌ها با تراکنش «سود تجمیعی» ثبت می‌شود.</p><p>۳. پیش از تایید خرید ماهانه، P/NAV صندوق‌های عیار، هم‌تراز و کاریس چک شود (ترجیحاً حباب زیر ۲٪). برای صندوق اهرم سقف ۳٪ وزن سبد رعایت شود و در حباب بالای ۱۰٪ خرید متوقف گردد.</p></details>`};
function locsForm(){modal('محل‌های نگهداری','<label>هر محل در یک خط<textarea name="l" rows="8">'+esc(S.locs.join('\n'))+'</textarea></label>',f=>{S.locs=f.elements.l.value.split('\n').map(x=>x.trim()).filter(Boolean);save();draw()})}
V.set.after=()=>{$('#imp').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.assets||!d.tx||!d.periods)throw 0;if(confirm('داده‌های فعلی با فایل جایگزین شود؟')){S=d;await save();draw()}}catch{alert('فایل پشتیبان معتبر نیست.')}}};
/* ---------- modal forms ---------- */
const dlg=$('#dlg');
function modal(title,body,onSave,onDel){dlg.innerHTML=`<form><div class="grab"></div><h3>${title}</h3>${body}<div class="btns"><button class="pri" value="ok">ذخیره</button>${onDel?'<button type="button" class="danger" id="del">حذف</button>':''}<button type="button" id="cx">انصراف</button></div></form>`;
 const f=dlg.querySelector('form');f.onsubmit=e=>{e.preventDefault();if(onSave(f)!==false)dlg.close()};$('#cx').onclick=()=>dlg.close();if(onDel)$('#del').onclick=()=>{if(confirm('حذف شود؟')){onDel();dlg.close()}};if(!dlg.open)dlg.showModal()}
const opt=(arr,sel,v=x=>x,l=x=>x)=>arr.map(x=>`<option value="${esc(v(x))}" ${v(x)===sel?'selected':''}>${esc(l(x))}</option>`).join('');
function txForm(t,pre={}){const nw=!t,td=today();t=t||{id:'t'+Date.now(),type:'واریز',period:S.periods.at(-1)?.name||'',d:td.day,m:td.month,y:td.year,asset:pre.asset||(tab==='tithe'?S.assets.find(a=>a.tithe)?.id:0)||S.assets[0].id,loc:'',amount:pre.amount||'',qty:'',note:''};
 const ass=S.assets;
 modal(nw?'تراکنش جدید':'ویرایش تراکنش',`<div class="segc">${TYPES.map(x=>`<button type="button" data-ty="${x}" class="${x===t.type?'on':''}">${x}</button>`).join('')}</div><select name="type" hidden>${opt(TYPES,t.type)}</select>
<label>دوره<select name="period">${opt(S.periods.map(p=>p.name),t.period)}<option value="__new">+ دوره جدید…</option></select></label>
<div class="g3"><label>روز<input name="d" inputmode="numeric" value="${fa(t.d)}"></label><label>ماه<select name="m">${MON.map((m,i)=>`<option value="${i+1}" ${i+1===t.m?'selected':''}>${m}</option>`).join('')}</select></label><label>سال<input name="y" inputmode="numeric" value="${fa(t.y)}"></label></div>
<label>نام دارایی<select name="asset">${opt(ass,t.asset,a=>a.id,a=>a.name)}</select></label>
<div id="cv" hidden><label>دارایی مبدأ<select name="from">${opt(ass,t.from||ass[0].id,a=>a.id,a=>a.name)}</select></label><label>قیمت دارایی مبدأ<input name="fp" inputmode="decimal"></label></div>
<label>محل نگهداری<select name="loc">${opt(S.locs,t.loc||ass.find(a=>a.id===t.asset)?.loc||S.locs[0])}</select></label>
<label>مبلغ کل (تومان)<input name="amount" inputmode="decimal" value="${t.amount===''?'':n(t.amount,4)}"></label>
<div class="g2"><label>قیمت واحد<input name="price" inputmode="decimal" value="${t.qty?n(t.amount/t.qty,4):''}"></label><label>تعداد / مقدار<input name="qty" inputmode="decimal" value="${t.qty?n(t.qty,7):''}"></label></div>
<label>یادداشت<input name="note" value="${esc(t.note)}"></label>`,f=>{
  const g=k=>f.elements[k].value,amount=P(g('amount')),qty=P(g('qty')),y=P(g('y')),d=P(g('d'));
  if(!(amount>0)||!(qty>0)||!(y>1300)||!(d>=1&&d<=31))return alert('مبلغ، تعداد و تاریخ را درست وارد کنید.')||false;
  let per=g('period');if(per==='__new')per=(prompt('نام دوره جدید:',MON[td.month-1]+' '+(td.year-1000))||t.period||'').trim();if(!per)return alert('نام دوره لازم است.')||false;if(!S.periods.find(p=>p.name===per))S.periods.push({name:per,budget:S.periods.at(-1)?.budget||0,alloc:{}});
  const o={id:t.id,type:g('type'),period:per,d,m:+g('m'),y,asset:g('asset'),loc:g('loc'),amount,qty,note:g('note')};
  if(o.type==='تبدیل'){o.from=g('from');const fpz=P(g('fp'))||S.assets.find(a=>a.id===o.from).price;o.fromQty=amount/fpz}
  const i=S.tx.findIndex(x=>x.id===t.id);i<0?S.tx.push(o):S.tx[i]=o;save();draw()},nw?null:()=>{S.tx=S.tx.filter(x=>x.id!==t.id);save();draw()});
 const f=dlg.querySelector('form'),el=f.elements,sync=()=>$('#cv').hidden=el.type.value!=='تبدیل',price=id=>{const a=S.assets.find(a=>a.id===id);return a.fixed?1:a.price};
 el.type.onchange=sync;sync();f.querySelectorAll('[data-ty]').forEach(b=>b.onclick=()=>{el.type.value=b.dataset.ty;f.querySelectorAll('[data-ty]').forEach(x=>x.classList.toggle('on',x===b));sync()});
 el.asset.onchange=()=>{const a=S.assets.find(a=>a.id===el.asset.value);el.loc.value=a.loc||el.loc.value;el.price.value=n(price(a.id),4);el.price.oninput()};
 el.amount.oninput=el.price.oninput=()=>{const a=P(el.amount.value),p=P(el.price.value);if(a>0&&p>0)el.qty.value=n(a/p,7)};
 el.qty.oninput=()=>{const a=P(el.amount.value),q=P(el.qty.value);if(a>0&&q>0)el.price.value=n(a/q,4)};
 if(nw){el.price.value=n(price(t.asset),4);if(t.amount)el.amount.oninput()}}
function priceForm(){modal('به‌روزرسانی قیمت‌ها (تومان)',S.assets.filter(a=>!a.fixed).map(a=>`<label>${esc(a.name)}<input name="${a.id}" inputmode="decimal" value="${n(a.price,4)}"></label>`).join(''),f=>{
 for(const a of S.assets)if(!a.fixed){const v=P(f.elements[a.id].value);if(!(v>0))return alert('قیمت «'+a.name+'» نامعتبر است.')||false;a.price=v}
 S.priceAt=Date.now();save();draw()})}
function assetForm(i){const a=S.assets[i]||{id:'A'+Date.now(),name:'',loc:S.locs[0],target:0,exp:1,price:1,src:'',note:'',fixed:false};
 modal(i<0?'دارایی جدید':'ویرایش دارایی',`<label>نام دارایی<input name="name" value="${esc(a.name)}"></label><label>محل نگهداری<select name="loc"><option value="">—</option>${opt(S.locs,a.loc)}</select></label>
<div class="g2"><label id="tg">وزن هدف (٪)<input name="t" inputmode="decimal" value="${n(a.target*100,2)}"></label><label>پیش‌بینی سود<input name="e" inputmode="decimal" value="${n(a.exp,4)}"></label></div>
<label>قیمت فعلی (تومان)<input name="p" inputmode="decimal" value="${n(a.price,4)}"></label><label class="ck"><input type="checkbox" name="fx" ${a.fixed?'checked':''}> دارایی ارزش‌ثابت (قیمت همیشه ۱)</label>
<label class="ck"><input type="checkbox" name="th" ${a.tithe?'checked':''}> ده‌یک</label><label>سود ثابت (٪)<input name="fr" inputmode="decimal" value="${a.rate?n(a.rate,2):''}"></label><label>سود پله‌ای (روز:درصد، هر پله در یک خط)<textarea name="tr" rows="3">${(a.tiers||[]).map(k=>fa(k[0])+':'+fa(k[1])).join('\n')}</textarea></label><p class="sub">مثال مگاسود: ۰:۳۵ و ۱۸۲:۴۰ و ۳۶۵:۵۲ (هر کدام در یک خط). در صورت پر بودن، جایگزین سود ثابت می‌شود و سود تا آخرین پله (سررسید) محاسبه می‌گردد.</p><p class="sub">نرخ سالانه؛ سود و موجودی امروز به‌صورت روزشمار از تاریخ هر تراکنش محاسبه می‌شود.</p><label>منبع / فرمول آپدیت<input name="src" value="${esc(a.src)}"></label><label>راهنمای عملیاتی<input name="note" value="${esc(a.note)}"></label>`,f=>{
 const g=k=>f.elements[k].value,name=g('name').trim();if(!name)return alert('نام دارایی لازم است.')||false;
 Object.assign(a,{name,loc:g('loc'),target:f.elements.th.checked?0:(P(g('t'))||0)/100,tithe:f.elements.th.checked,rate:P(g('fr'))||0,tiers:g('tr').split('\n').map(l=>l.replace(/[٪%]/g,'').split(':').map(P)).filter(k=>k.length===2&&k[0]>=0&&k[1]>=0),exp:P(g('e'))||1,fixed:f.elements.fx.checked,price:f.elements.fx.checked?1:P(g('p'))||0,src:g('src'),note:g('note')});
 if(i<0)S.assets.push(a);save();draw()},i<0?null:()=>{if(S.tx.some(t=>t.asset===a.id||t.from===a.id))return alert('این دارایی تراکنش دارد و قابل حذف نیست.');S.assets.splice(i,1);save();draw()})
 const f=dlg.querySelector('form'),tg=()=>$('#tg').hidden=f.elements.th.checked;f.elements.th.onchange=tg;tg()}
function perForm(i){const p=S.periods[i]||{name:'',budget:0,alloc:{}};
 modal(i<0?'دوره جدید':'ویرایش دوره',`<label>نام دوره<input name="name" value="${esc(p.name)}"></label><label>بودجه (تومان)<input name="b" inputmode="numeric" value="${n(p.budget)}"></label>
${MA().map(a=>`<label>${esc(a.name)} (٪)<input name="a_${a.id}" inputmode="decimal" value="${n((p.alloc[a.id]||0)*100,2)}"></label>`).join('')}`,f=>{
 const g=k=>f.elements[k].value,alloc={};let sm=0;MA().forEach(a=>{alloc[a.id]=(P(g('a_'+a.id))||0)/100;sm+=alloc[a.id]});
 if(!g('name').trim())return alert('نام دوره لازم است.')||false;if(Math.abs(sm-1)>1e-6&&!confirm('جمع درصدها ۱۰۰٪ نیست. ادامه می‌دهید؟'))return false;
 if(i>=0&&p.name!==g('name').trim())S.tx.forEach(t=>{if(t.period===p.name)t.period=g('name').trim()});
 Object.assign(p,{name:g('name').trim(),budget:P(g('b'))||0,alloc});if(i<0)S.periods.push(p);save();draw()},i<0?null:()=>{if(S.tx.some(t=>t.period===p.name))return alert('این دوره تراکنش دارد و قابل حذف نیست.');S.periods.splice(i,1);save();draw()})}
window.syncPrices=()=>{if(!window.Android||!S)return;try{const d=JSON.parse(Android.getPrices()||'{}');if(d.seq&&d.seq>(S.pxSeq||0)){let k=0;S.assets.forEach(a=>{const v=d.p?.[a.id];if(v>0&&!a.fixed){a.price=v;k++}});S.pxSeq=d.seq;if(k){S.priceAt=d.ts;save();draw()}}}catch{}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPrices()});
/* ---------- shell ---------- */
const loadX=()=>window.XLSX?Promise.resolve():new Promise((r,j)=>{const e=document.createElement('script');e.src='lib/xlsx.js';e.onload=r;e.onerror=j;document.head.appendChild(e)});
async function exportXlsx(){try{await loadX()}catch{return alert('کتابخانه اکسل بارگذاری نشد.')}
 const c=calc(),X=XLSX,A=S.assets,aN=id=>A.find(a=>a.id===id)?.name||'',wb=X.utils.book_new(),add=(n,rows,w)=>{const ws=X.utils.aoa_to_sheet(rows.map(r=>r.map(v=>typeof v==='string'?tr(v):v)));ws['!cols']=w.map(x=>({wch:x}));X.utils.book_append_sheet(wb,ws,tr(n).slice(0,31))};
 add('Dashboard',[['شاخص','مقدار'],['ارزش کل دارایی‌ها (تومان)',c.V],['پول آورده‌شده',c.D],['سود خالص',c.profit],['بازده کل',c.D?c.profit/c.D:''],['بودجه ماه جاری',c.B],[],['دارایی','ارزش','وزن فعلی','وزن هدف','پیشنهاد خرید'],...c.list.map(x=>[x.a.name,x.value,x.w,x.t,x.buy])],[34,18,14,14,18]);
 add('تخصیص و گزارش ماهانه',[['دوره','واریزی','ارزش','سود/زیان','بازدهی','رشد نسبت به قبل','معادل دلار','بودجه',...MA().map(a=>a.name)],...c.rep.map(r=>[r.p.name,r.inv,r.val,r.pl,r.ret??'',r.growth??'',r.usd??'',r.p.budget,...MA().map(a=>r.p.alloc[a.id]||0)])],[22,16,16,16,12,16,14,16]);
 add('تاریخچه تراکنش‌ها',[['دوره','روز','ماه','سال','نوع عملیات','دارایی','محل نگهداری','مبلغ','قیمت واحد','تعداد','ارزش کنونی','سود/زیان','درصد افت/رشد','یادداشت'],...S.tx.map(t=>{const r=c.rows[t.id]||{},cur=r.vq*c.price(t.asset)+(r.acc||0),pl=r.basis==null?'':cur-r.basis;return [t.period,t.d,t.m,t.y,t.type,aN(t.asset),t.loc,t.amount,t.qty?t.amount/t.qty:0,t.qty,cur,pl,r.basis>0?pl/r.basis:'',t.note||'']})],[20,6,6,8,14,26,26,16,16,16,16,16,12,24]);
 add('دارایی‌های فعلی و بازتوازن',[['دارایی','موجودی','میانگین خرید','مبلغ خرید','قیمت روز','ارزش روز','سود/زیان','درصد افت/رشد','وزن فعلی','وزن هدف','شکاف تا هدف','پیشنهاد خرید (متناسب با بودجه)','راهنما'],...c.list.map(x=>[x.a.name,x.qty,x.avg,x.cost,x.a.price,x.value,x.pl,x.pp??'',x.w,x.t,x.raw,x.buy,x.a.note||''])],[26,16,16,16,16,16,16,12,10,10,16,18,40]);
 add('ده‌یک',[['دارایی','موجودی','اصل پول','سود/زیان','درصد افت/رشد'],...c.tl.map(x=>[x.a.name,x.value,x.cost,x.pl,x.pp??''])],[26,16,16,16,14]);
 add('تنظیمات و قیمت لحظه‌ای',[['کد','نام دارایی','محل نگهداری','وزن هدف','پیش‌بینی سود','قیمت','ده‌یک','سود ثابت (٪)','سود پله‌ای','منبع','راهنما'],...A.map(a=>[a.id,a.name,a.loc,a.target,a.exp,a.price,a.tithe?'بله':'',a.rate||'',(a.tiers||[]).map(k=>k[0]+':'+k[1]).join(' | '),a.src||'',a.note||''])],[12,26,26,10,12,16,8,12,22,24,40]);
 wb.Workbook={Views:[{RTL:!en()}]};
 const name='my-portfo-'+new Date().toISOString().slice(0,10)+'.xlsx',b64=X.write(wb,{bookType:'xlsx',type:'base64'});
 if(window.Android?.saveFile(name,b64,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))return;
 const u=URL.createObjectURL(new Blob([Uint8Array.from(atob(b64),ch=>ch.charCodeAt(0))])),l=document.createElement('a');l.href=u;l.download=name;l.click()}
function ainfo(id){const x=calc().list.find(q=>q.a.id===id);if(!x)return;
 dlg.innerHTML=`<form><div class="grab"></div><h3>${esc(x.a.name)}</h3><div class="bigs">${N(x.value)} <span class="pill ${sg(x.pp)}">${sp(x.pp)}</span></div>
<dl><div><dt>موجودی</dt><dd>${N(x.qty,7)}</dd></div><div><dt>میانگین خرید</dt><dd>${N(x.avg)}</dd></div><div><dt>قیمت روز</dt><dd>${N(x.a.price)}</dd></div><div><dt>مبلغ خرید</dt><dd>${N(x.cost)}</dd></div><div><dt>سود / زیان</dt><dd class="${sg(x.pl)}">${N(x.pl)}</dd></div><div><dt>وزن فعلی / هدف</dt><dd>${pc(x.w)} / ${pc(x.t)}</dd></div><div><dt>پیشنهاد خرید</dt><dd>${N(x.buy)}</dd></div><div><dt>شکاف تا هدف</dt><dd>${N(x.raw)}</dd></div></dl>${x.a.note?`<p class="sub">${esc(x.a.note)}</p>`:''}
<div class="btns"><button type="button" class="pri" data-act="buy" data-id="${x.a.id}" data-amt="${Math.round(x.buy)}">ثبت خرید</button><button type="button" data-act="easset" data-i="${S.assets.indexOf(x.a)}">ویرایش</button><button type="button" id="cx">بستن</button></div></form>`;
 $('#cx').onclick=()=>dlg.close();if(!dlg.open)dlg.showModal()}
const applyTheme=()=>{document.documentElement.dataset.theme=S.theme==='dark'?'dark':'light';document.querySelector('meta[name=theme-color]')?.setAttribute('content',S.theme==='dark'?'#0E1417':'#F4F6F9')};
const TTL={home:'خانه',hold:'دارایی‌ها',tx:'تراکنش‌ها',tithe:'ده‌یک',rep:'گزارش ماهانه',set:'تنظیمات'};
const IC={eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',off:'<path d="M3 3l18 18M10.6 6.1A9.5 9.5 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.8M6.5 7.5A16 16 0 0 0 2 12s4 7 10 7c1.5 0 2.9-.4 4-1"/>',gear:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',back:'<path d="M9 6l6 6-6 6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',moon:'<path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});

function draw(){applyTheme();const c=calc(),sub=tab==='rep'||tab==='set';
 $('#bar').innerHTML=`${sub?`<button class="bk" data-t="home" aria-label="بازگشت">${svg('back')}</button>`:''}<h1>${TTL[tab]}</h1><span></span><button data-act="hide" aria-label="پنهان‌سازی مبالغ">${svg(S.hide?'off':'eye')}</button><button data-act="theme" aria-label="تغییر پوسته">${svg(S.theme==='dark'?'sun':'moon')}</button><button data-t="set" aria-label="تنظیمات">${svg('gear')}</button>`;
 $('#view').innerHTML=V[tab](c);V[tab].after?.(c);document.querySelectorAll('nav [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===tab))}
document.addEventListener('click',e=>{const b=e.target.closest('[data-t],[data-act]');if(!b)return;const a=b.dataset.act,i=+b.dataset.i;
 if(b.dataset.t){tab=b.dataset.t;draw();scrollTo(0,0);return}
 if(a==='fab')txForm();else if(a==='edit')txForm(S.tx.find(t=>t.id===b.dataset.id));else if(a==='buy')txForm(null,{asset:b.dataset.id,amount:+b.dataset.amt});
 else if(a==='theme'){S.theme=S.theme==='dark'?'light':'dark';save();draw()}else if(a==='lang'){if((S.lang||'fa')!==b.dataset.v){S.lang=b.dataset.v;save().then(()=>location.reload())}}
 else if(a==='xlsx')exportXlsx();else if(a==='hide'){S.hide=!S.hide;save();draw()}else if(a==='ainfo')ainfo(b.dataset.id);else if(a==='fpf'){fp=b.dataset.v;draw()}
 else if(a==='prices')priceForm();else if(a==='easset')assetForm(i);else if(a==='eper')perForm(i);else if(a==='rc'){repChart=i;draw()}
 else if(a==='locs')locsForm();
 else if(a==='fetch'){Android.fetchNow();let k=0;const t=setInterval(()=>{syncPrices();if(++k>15)clearInterval(t)},3000)}
 else if(a==='export'&&window.Android){Android.shareBackup(JSON.stringify(S));S.backupAt=Date.now();save();draw()}
 else if(a==='export'){const u=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download='my-portfo-backup-'+new Date().toISOString().slice(0,10)+'.json';l.click();S.backupAt=Date.now();save();draw()}
 else if(a==='reset'&&confirm('همه تغییرات پاک و داده‌های اولیه بازگردانده شود؟')){S=fresh();save();draw()}});
(async()=>{S=await kv('get','state')||fresh();applyTheme();if(en())startTr();navigator.storage?.persist?.();draw();syncPrices();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js')})();
