"use strict";
const esc=t=>String(t).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));

const meta={t:'Legumes no almoço',d:4,of:5};
const metaDates=new Set();
const todayKey=()=>new Date().toLocaleDateString('en-CA');
const LEAF='M0 0C8-16 30-16 36 0C30 16 8 16 0 0Z';
function plantStage(d,of){if(d<=0)return 0;if(d>=of)return 4;const q=d/of;return q<.4?1:q<.7?2:3}
function plantSVG(stage,dark,w){
  w=w||96;
  const stem=dark?'#CFF580':'#2B6130', a=dark?'#E7F5BE':'#2B6130', b=dark?'#A8D45E':'#7DB35A';
  const L=(x,y,rot,sc,c)=>`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"><path d="${LEAF}" fill="${c}"/></g>`;
  const pair=(y,sc,c1,c2)=>L(50,y,-30,sc,c1)+L(50,y,-150,sc,c2);
  let body='';
  if(stage===0) body='<ellipse cx="50" cy="83" rx="3" ry="4" fill="#B98A5E"/>';
  if(stage>=1) body+=`<path d="M50 88V${[0,70,56,40,30][stage]}" stroke="${stem}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  if(stage===1) body+=pair(72,.55,b,b);
  if(stage===2) body+=pair(58,.8,a,a)+pair(74,.55,b,b);
  if(stage===3) body+=pair(42,.9,a,a)+pair(58,.8,b,b)+pair(74,.55,a,a);
  if(stage===4) body+=pair(34,1,a,a)+pair(50,.9,b,b)+pair(66,.75,a,a)+pair(79,.5,b,b)+'<circle cx="50" cy="24" r="7" fill="#E8732C"/><circle cx="50" cy="24" r="3" fill="#FDE7D6"/>';
  const nomes=['semente','broto','haste','folhas','flor'];
  return `<svg width="${w}" height="${Math.round(w*1.2)}" viewBox="0 0 100 120" role="img" aria-label="Planta: estágio ${nomes[stage]}"><path d="M28 94h44l-5 24H33z" fill="#C9A27A"/><rect x="24" y="88" width="52" height="9" rx="4.5" fill="#B98A5E"/><path d="M38 88c4-9 20-9 24 0z" fill="#7A5A3A"/>${body}</svg>`;
}
function renderPlants(animate){
  const st=plantStage(meta.d,meta.of), falta=meta.of-meta.d;
  const pill=meta.d>=meta.of?'Meta cumprida':`${meta.d} de ${meta.of} dias`;
  const h=$('#plantHoje');
  if(h){h.innerHTML=plantSVG(st,true,100)+`<span class="pill">${esc(pill)}</span>`; if(animate&&!reduce){h.classList.remove('grow');void h.offsetWidth;h.classList.add('grow')}}
  const e=$('#heroEvo');
  if(e){e.innerHTML=`<div class="txt"><div class="eyebrow">SUA CONSTÂNCIA</div><h2>${esc(meta.d)} de ${esc(meta.of)} dias na semana</h2><p>${falta>0?`Falta ${falta} dia${falta>1?'s':''} para a flor.`:'A flor abriu. Boa semana!'}</p></div><div class="plantBox">${plantSVG(st,true,88)}</div>`}
}
function renderHero(){
  const mt=$('#heroMeal'); if(!mt)return;
  const nx=meals.find(m=>!m.d), btn=$('#heroDone');
  if(nx){$('#heroEy').textContent='PRÓXIMA REFEIÇÃO · '+nx.h.toUpperCase();mt.textContent=nx.n;$('#heroSub').textContent='Marque quando fizer. A planta cresce com os seus dias.';btn.hidden=false;btn.onclick=()=>{nx.d=true;drawMeals();renderPlants(true)}}
  else{$('#heroEy').textContent='DIA COMPLETO';mt.textContent='Todas as refeições feitas';$('#heroSub').textContent='Agora é só descansar. Amanhã tem mais.';btn.hidden=true}
}
function toast(msg){const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2800)}
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#data').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();

/* ---------- troca de visão ---------- */
function view(v){
  $('#paciente').hidden=v!=='pac'; $('#nutri').hidden=v!=='nut';
  $('#v-pac').setAttribute('aria-pressed',v==='pac'); $('#v-nut').setAttribute('aria-pressed',v==='nut');
  const s=$(v==='pac'?'#paciente':'#nutri'); s.classList.remove('enter'); void s.offsetWidth; s.classList.add('enter');
  if(v==='nut') renderNut(); else {renderWaPac();renderGrpPac();renderMeta();renderFicha()}
}
$('#v-pac').onclick=()=>view('pac'); $('#v-nut').onclick=()=>view('nut');

/* ---------- paciente: abas ---------- */
let curTab="hoje";
function goTab(t){
  curTab=t; if(t==="msg"){$("#bgPac").hidden=true} if(t==='com')renderCom(); if(t==='perfil')renderPerfilPac(); if(t==='hoje'||t==='evolucao')renderPlants(false);
  $$('#paciente [data-tab]').forEach(el=>{const on=el.dataset.tab===t; el.hidden=!on; if(on){el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter')}});
  $$('nav.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.go===t));
  if(t==='evolucao'){const c=$('#chart');c.classList.remove('go');void c.getBoundingClientRect();c.classList.add('go')}
  scrollTo({top:0,behavior:reduce?'auto':'smooth'});
}
$$('nav.tabs button').forEach(b=>b.onclick=()=>goTab(b.dataset.go));
$('#btnMsg').onclick=()=>goTab('msg'); $('#btnPerfil').onclick=()=>goTab('perfil');

/* ---------- hoje ---------- */
const meals=[{n:'Café da manhã',h:'7h30',d:true},{n:'Almoço',h:'12h30',d:true},{n:'Lanche da tarde',h:'16h00',d:false},{n:'Jantar',h:'19h30',d:false}];
function drawMeals(){
  $('#meals').innerHTML=meals.map((m,i)=>`<button class="meal ${m.d?'done':''}" data-i="${i}" aria-pressed="${m.d}"><span class="dot"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></span><span class="nm">${m.n}</span><span class="hr">${m.h}</span></button>`).join('');
  $$('.meal').forEach(b=>b.onclick=()=>{const m=meals[b.dataset.i];m.d=!m.d;drawMeals();if(m.d)renderPlants(true)});
  const n=meals.filter(m=>m.d).length;
  $('#ring').style.strokeDashoffset=264-264*n/meals.length;
  $('#ringTxt').textContent=n+'/'+meals.length;
  $('#ringMsg').textContent=n===meals.length?'Dia completo':n>=2?'Bom ritmo':'Vamos começar';
  renderHero();
}
let agua=0; const syncAgua=()=>{$('#aguaN').textContent=agua.toFixed(1).replace('.',',');$('#glass').style.height=Math.min(100,agua/2*100)+'%'};
$('#agua').onclick=()=>{agua=Math.min(2,agua+.25);syncAgua()};

drawMeals(); requestAnimationFrame(()=>setTimeout(()=>{drawMeals();syncAgua()},60));

/* ---------- plano com trocas ---------- */
let plano={
 'Café':[['Pão integral','2 fatias',['Tapioca|3 colheres de sopa','Cuscuz|1 fatia média']],['Ovo mexido','2 unidades',['Queijo minas|2 fatias']],['Mamão','1 fatia média',['Banana|1 unidade']]],
 'Almoço':[['Arroz branco','4 colheres de sopa (100 g)',['Batata inglesa cozida|1 unidade média','Macarrão cozido|3 colheres de servir','Mandioca cozida|2 pedaços pequenos']],['Feijão carioca','1 concha média',['Lentilha|1 concha média']],['Filé de frango grelhado','1 filé médio (100 g)',['Peixe assado|1 posta média','Ovos|2 unidades']],['Salada de folhas e tomate','À vontade',[]]],
 'Lanche':[['Iogurte natural','1 pote (170 g)',['Leite|1 copo']],['Aveia em flocos','1 colher de sopa',[]],['Banana prata','1 unidade',['Maçã|1 unidade']]],
 'Jantar':[['Sopa de legumes com frango','1 prato fundo',['Omelete com legumes|2 ovos']],['Torrada integral','2 unidades',[]]]
};
let mealSel='Almoço', openItem=0;
function drawPlano(){
  $('#planChips').innerHTML=Object.keys(plano).map(k=>`<button class="chip" aria-pressed="${k===mealSel}" data-k="${esc(k)}">${esc(k)}</button>`).join('');
  $$('#planChips .chip').forEach(b=>b.onclick=()=>{mealSel=b.dataset.k;openItem=0;drawPlano()});
  $('#planBody').innerHTML=`<div class="card" style="padding:4px 16px">`+plano[mealSel].map((it,i)=>{
    const sw=it[2]; const open=i===openItem&&sw.length;
    return `<div class="${open?'open':''}"><button class="item" data-i="${i}"><div><b>${esc(it[0])}</b><span>${esc(it[1])}</span></div>${sw.length?'<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B6130" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>':''}</button>
    ${sw.length?`<div class="swaps ${open?'open':''}"><div><div class="swap-list"><p class="eyebrow" style="margin:8px 0 2px;color:#1E4723">PODE TROCAR POR</p>${sw.map((s,j)=>{const [a,b]=s.split('|');return `<button data-i="${i}" data-j="${j}"><span>${esc(a)}</span><em>${esc(b)}</em></button>`}).join('')}</div></div></div>`:''}</div>`}).join('')+`</div><p class="note">Trocas equivalentes definidas pela sua nutricionista. Qualquer uma mantém o plano.</p>`;
  $$('#planBody .item').forEach(b=>b.onclick=()=>{openItem=openItem==b.dataset.i?-1:+b.dataset.i;drawPlano()});
  $$('#planBody .swap-list button').forEach(b=>b.onclick=()=>{
    const it=plano[mealSel][b.dataset.i], s=it[2][b.dataset.j].split('|'), old=[it[0],it[1]];
    it[0]=s[0]; it[1]=s[1]; it[2][b.dataset.j]=old.join('|'); drawPlano();
  });
}
drawPlano();

/* ---------- diário ---------- */
const humores=['Com fome','Satisfeita','Ansiosa','Tranquila']; let hum=1;
$('#humor').innerHTML=humores.map((h,i)=>`<button class="chip" data-i="${i}" aria-pressed="${i==hum}">${h}</button>`).join('');
$$('#humor .chip').forEach(b=>b.onclick=()=>{hum=+b.dataset.i;$$('#humor .chip').forEach(c=>c.setAttribute('aria-pressed',c===b))});
const diario=[{t:'Café com pão integral e ovo.',h:'Satisfeita',q:'Hoje, 7h40'}];
function drawDia(){$('#diaList').innerHTML=diario.map((e,i)=>`<div class="entry ${i===0&&diario.length>1?'enter':''}"><small>${esc(e.q)} · ${esc(e.h)}</small><div>${esc(e.t)}</div></div>`).join('')}
$('#diaSave').onclick=()=>{const v=$('#diaTxt').value.trim();if(!v)return;diario.unshift({t:v,h:humores[hum],q:'Agora'});if(typeof grp!=='undefined')grp.col.d=Math.min(grp.col.of,grp.col.d+1);$('#diaTxt').value='';drawDia()};
drawDia();

/* ---------- fotos antes e depois (ficam só no navegador) ---------- */
function photoCompare(host){
  host.innerHTML=`<h3 class="eyebrow">FOTOS · ANTES E DEPOIS</h3>
  <div class="cmp"><div class="ph before">Adicione a foto de antes</div><div class="ph after">Adicione a foto de depois</div><span class="lab" style="left:10px">Antes</span><span class="lab" style="right:10px">Depois</span><div class="bar"></div><input type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois"></div>
  <div class="pick"><label>Escolher antes<input type="file" accept="image/*" data-w="before"></label><label>Escolher depois<input type="file" accept="image/*" data-w="after"></label></div>
  <p class="note" style="margin:10px 0 0">As fotos ficam só neste aparelho e não são enviadas. Na versão completa, só você e sua nutricionista veem.</p>`;
  const cmp=$('.cmp',host), after=$('.after',cmp), bar=$('.bar',cmp), rng=$('input[type=range]',cmp);
  const set=v=>{after.style.clipPath=`inset(0 0 0 ${v}%)`;bar.style.left=v+'%'};
  rng.oninput=()=>set(rng.value);
  $$('input[type=file]',host).forEach(f=>f.onchange=()=>{
    const file=f.files[0]; if(!file)return; const el=$('.'+f.dataset.w,cmp);
    if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)){toast('Escolha uma foto (JPG, PNG, WEBP ou HEIC).');f.value='';return}
    if(file.size>8*1024*1024){toast('A foto passa de 8 MB. Escolha uma menor.');f.value='';return}
    if(el.dataset.url)URL.revokeObjectURL(el.dataset.url);
    const u=URL.createObjectURL(file); el.dataset.url=u;
    el.style.backgroundImage=`url("${u}")`; el.textContent='';
    if(!reduce){cmp.animate([{opacity:.6},{opacity:1}],{duration:350})}
  });
}
photoCompare($('#fotoPac'));

/* ---------- silhueta genérica (ilustração igual para todos, guiada só pelas medidas) ---------- */
const consultas=[{d:'28 ago',c:88,q:106,kg:78.4},{d:'21 set',c:86.5,q:105,kg:77.6},{d:'16 out',c:85,q:104,kg:76.9}];
function silPath(c,q){
  const W=c*0.30, H=q*0.38, ch=37, sh=43, th=H*.92, kn=H*.6, an=H*.4;
  const R=[[8,70],[sh,92],[ch,130],[W,190],[H,245],[th,292],[kn,335],[an,385],[an-9,392],[11,392],[13,330],[10,290],[6,272]];
  const L=R.slice().reverse().map(([x,y])=>[-x,y]);
  const pts=[...R,...L].map(([x,y])=>[100+x,y]); const n=pts.length; let d=`M${pts[0][0]} ${pts[0][1]}`;
  for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
    d+=` C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`}
  return d+'Z';
}
function silhouette(host){
  let cur={c:consultas[0].c,q:consultas[0].q}, idx=0, raf;
  host.innerHTML=`<h3 class="eyebrow">SILHUETA · ILUSTRAÇÃO GENÉRICA</h3>
  <div class="chips" id="silChips" role="group" aria-label="Escolher consulta" style="margin-bottom:12px"></div>
  <div class="sil"><svg viewBox="0 0 200 400" role="img" aria-label="Silhueta genérica que muda conforme as medidas"><path class="ghost" id="silGhost"/><path class="body" id="silBody"/><circle class="head" cx="100" cy="40" r="22"/></svg>
  <dl><div><dt>CINTURA</dt><dd id="sC"></dd></div><div><dt>QUADRIL</dt><dd id="sQ"></dd></div><div><dt>PESO</dt><dd id="sK"></dd></div></dl></div>
  <p class="note" style="margin:10px 0 0">A linha tracejada é a 1ª consulta. É um desenho igual para todas as pessoas, ajustado só pelas medidas; não representa o seu corpo.</p>`;
  const body=$('#silBody',host), ghost=$('#silGhost',host);
  ghost.setAttribute('d',silPath(consultas[0].c,consultas[0].q));
  const fmt=n=>String(n).replace('.',',');
  function paint(){body.setAttribute('d',silPath(cur.c,cur.q))}
  function show(i){
    idx=i; const t=consultas[i], f={...cur}, t0=performance.now(), dur=reduce?1:650;
    cancelAnimationFrame(raf);
    (function step(now){const k=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-k,3);
      cur.c=f.c+(t.c-f.c)*e; cur.q=f.q+(t.q-f.q)*e; paint(); if(k<1)raf=requestAnimationFrame(step)})(t0);
    $('#sC',host).innerHTML=`${fmt(t.c)} <small>cm</small>`; $('#sQ',host).innerHTML=`${fmt(t.q)} <small>cm</small>`; $('#sK',host).innerHTML=`${fmt(t.kg)} <small>kg</small>`;
    $$('#silChips .chip',host).forEach((b,j)=>b.setAttribute('aria-pressed',j===i));
  }
  $('#silChips',host).innerHTML=consultas.map((c,i)=>`<button class="chip" data-i="${i}" aria-pressed="false">${c.d}</button>`).join('');
  $$('#silChips .chip',host).forEach(b=>b.onclick=()=>show(+b.dataset.i));
  paint(); show(2);
}
silhouette($('#silPac'));


/* ---------- nutricionista ---------- */
const pacientes=[
 {n:'Marina Costa',s:'Em acompanhamento',w:false,obj:'Reeducação alimentar',ult:'16 out',prox:'13 nov',peso:'76,9 kg',cint:'85 cm',consent:{quando:'28/08/2026',fotos:true,grupo:true},ficha:null},
 {n:'Carlos Mendes',s:'Sem retorno há 34 dias',w:true,obj:'Ganho de massa',ult:'12 set',prox:'—',peso:'82,3 kg',cint:'90 cm',consent:{quando:'12/08/2026'}},
 {n:'Joana Ribeiro',s:'Em acompanhamento',w:false,obj:'Diabetes tipo 2',ult:'09 out',prox:'06 nov',peso:'68,0 kg',cint:'79 cm',consent:{quando:'03/09/2026'}},
 {n:'Paulo Lima',s:'Novo este mês',w:false,obj:'Performance esportiva',ult:'—',prox:'20 out',peso:'74,5 kg',cint:'84 cm',consent:{quando:'10/10/2026'}}
]; let sel=0;
function renderNut(){
  const q=($('#busca').value||'').toLowerCase();
  $('#lista').innerHTML=pacientes.map((p,i)=>({p,i})).filter(o=>o.p.n.toLowerCase().includes(q)).map(({p,i})=>`<button data-i="${i}" ${i===sel?'style="background:#F2F8E2"':''}><span><b>${esc(p.n)}</b><br><small style="color:var(--muted)">${esc(p.obj)}</small></span><span class="status ${p.w?'warn':''}">${esc(p.s)}</span></button>`).join('')||'<div class="empty"><svg width="56" height="40" viewBox="0 0 60 40" aria-hidden="true"><g transform="translate(8 24) rotate(-30)"><path d="M0 0C6-12 22-12 26 0C22 12 6 12 0 0Z" fill="#7DB35A"/></g><g transform="translate(30 26) rotate(-150) scale(.8)"><path d="M0 0C6-12 22-12 26 0C22 12 6 12 0 0Z" fill="#2B6130"/></g></svg><span>Ninguém encontrado.</span></div>';
  $$('#lista button').forEach(b=>b.onclick=()=>{sel=+b.dataset.i;renderNut()});
  const p=pacientes[sel];
  $('[data-n-view=plano] h1').textContent='Montar plano · '+p.n;
  $('#resumo').innerHTML=`<h2 style="font-size:22px">${esc(p.n)}</h2><p class="note" style="margin:2px 0 12px">${esc(p.obj)}</p>
   <div class="two" style="margin-bottom:12px"><div><div class="eyebrow">PESO</div><div class="num" style="font-size:22px">${esc(p.peso)}</div></div><div><div class="eyebrow">CINTURA</div><div class="num" style="font-size:22px">${esc(p.cint)}</div></div></div>
   <p class="note" style="margin:0 0 4px">Última consulta: ${esc(p.ult)} · Próxima: ${esc(p.prox)}</p>
   <div class="consent"><span aria-hidden="true">🔒</span><span>${p.consent?`Termo de consentimento assinado em ${esc(p.consent.quando)}. Fotos e medidas só aparecem para quem o paciente autorizou.`:'Aguardando o paciente aceitar o termo. Nenhum dado de saúde é coletado antes disso.'}</span></div>`;
  if(!$('#fotoNut .cmp')) photoCompare($('#fotoNut'));
  renderFichaNut();
}
$('#busca').oninput=renderNut;
$$('.side button').forEach(b=>b.onclick=()=>{
  $$('.side button').forEach(x=>x.removeAttribute('aria-current')); b.setAttribute('aria-current','true');
  $$('[data-n-view]').forEach(v=>{const on=v.dataset.nView===b.dataset.n;v.hidden=!on;if(on){v.classList.remove('stagger');void v.offsetWidth;v.classList.add('stagger')}});
  nView=b.dataset.n; if(nView==='fin') countUp(); if(nView==='plano') renderPlanEd(); if(nView==='msg'){renderMsgs();renderWaNut();$('#bgNut').hidden=true} if(nView==='grp'){renderGrpNut();$('#bgGrp').hidden=true} if(nView==='plano') renderMetaEd(); if(nView==='com'){renderComNut();$('#bgCom').hidden=true} if(nView==='perfil') renderPerfilNut(); 
});
$('#agendaL').innerHTML=[['8h00','Paulo Lima','Primeira consulta · presencial'],['10h30','Joana Ribeiro','Retorno · online'],['15h00','Marina Costa','Retorno · online']].map(a=>`<div style="display:flex;gap:14px;align-items:center;min-height:56px;border-bottom:1px solid #EEF1EF"><b style="width:56px;font-variant-numeric:tabular-nums">${a[0]}</b><span><b>${a[1]}</b><br><small style="color:var(--muted)">${a[2]}</small></span></div>`).join('');


/* ---------- util ---------- */

/* ---------- mensagens (compartilhadas entre as duas visões) ---------- */
const msgs=[
 {f:'pac',t:'Vou num aniversário sábado. O que eu como lá?',w:'Ontem'},
 {f:'nut',t:'Aproveite a festa! Faça o almoço normal, escolha os salgados assados e beba água entre um copo e outro. No domingo é só voltar ao plano.',w:'Ontem'},
 {f:'pac',t:'Saiu o exame de sangue.',w:'Hoje'},
 {f:'nut',t:'Recebi, obrigada! Vamos conversar sobre o ferro na consulta de hoje às 15h.',w:'Hoje'}
];
let nView='pac';
function bubbles(side){let last='';return msgs.map(m=>{const sep=m.w!==last?`<span class="when">${m.w}</span>`:'';last=m.w;return sep+`<div class="bub ${m.f===side?'me':'other'}">${esc(m.t)}</div>`}).join('')}
function renderMsgs(){
  const a=$('#msgPac'),b=$('#msgNut'); if(a)a.innerHTML=bubbles('pac'); if(b)b.innerHTML=bubbles('nut');
}
function sendMsg(from,input){
  const v=input.value.trim(); if(!v)return; msgs.push({f:from,t:v,w:'Hoje'}); input.value=''; renderMsgs();
  if(from==='pac'&&!(nView==='msg'&&!$('#nutri').hidden)) {$('#bgNut').hidden=false}
  if(from==='nut'&&!(curTab==='msg'&&!$('#paciente').hidden)) {$('#bgPac').hidden=false}
}
$('#formPac').onsubmit=e=>{e.preventDefault();sendMsg('pac',$('#inPac'))};
$('#formNut').onsubmit=e=>{e.preventDefault();sendMsg('nut',$('#inNut'))};
$('#msgChips').innerHTML=['Dúvida sobre troca','Enviar exame','Remarcar'].map(c=>`<button type="button" class="chip">${c}</button>`).join('');
$$('#msgChips .chip').forEach(b=>b.onclick=()=>{$('#inPac').value=b.textContent==='Enviar exame'?'Vou enviar meu exame de sangue.':b.textContent==='Remarcar'?'Preciso remarcar minha consulta.':'Tenho uma dúvida sobre uma troca do plano: ';$('#inPac').focus()});
renderMsgs();

/* ---------- montagem do plano (nutricionista) ---------- */
let draft=null, edMeal='Almoço', draftPatient=-1;
const seedPlan=JSON.parse(JSON.stringify(plano)), patientPlans=new Map(), drafts=new Map();
const swapsToText=a=>a.map(x=>{const [n,p]=x.split('|');return p?`${n} (${p})`:n}).join('; ');
const textToSwaps=t=>t.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const m=x.match(/^(.*?)\s*\((.*)\)$/);return m?`${m[1]}|${m[2]}`:`${x}|1 porção`});
function renderPlanEd(){
  if(draftPatient!==sel){if(draft&&draftPatient>=0)drafts.set(draftPatient,draft);draftPatient=sel;draft=drafts.get(sel)||null;}
  if(!draft)draft=JSON.parse(JSON.stringify(sel===0?plano:(patientPlans.get(sel)||seedPlan)));
  const host=$('#planEd');
  host.innerHTML=`<div class="chips" id="edChips" role="group" aria-label="Refeição" style="margin-bottom:12px">${Object.keys(draft).map(k=>`<button class="chip" aria-pressed="${k===edMeal}" data-k="${k}">${k}</button>`).join('')}</div>
  <div class="stack">${draft[edMeal].map((it,i)=>`<div class="ed"><div class="row"><input aria-label="Alimento" value="${esc(it[0])}" data-i="${i}" data-f="0"><input aria-label="Porção" value="${esc(it[1])}" data-i="${i}" data-f="1"><button type="button" class="x" data-del="${i}" aria-label="Remover ${esc(it[0])}">✕</button></div>
  <label><small>Trocas equivalentes (separe por ponto e vírgula)</small><input aria-label="Trocas" value="${esc(swapsToText(it[2]))}" data-i="${i}" data-f="s" placeholder="Batata (1 unidade); Macarrão (3 colheres)"></label></div>`).join('')}
  <button type="button" class="btn" id="edAdd">+ Adicionar alimento</button></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button type="button" class="btn primary" id="edPub">Publicar para ${esc(pacientes[sel].n)}</button><button type="button" class="btn" id="edReset">Descartar mudanças</button></div>
  <p class="note" style="margin:10px 0 0">O paciente só vê as mudanças depois que você publicar.</p>`;
  $$('#edChips .chip',host).forEach(b=>b.onclick=()=>{edMeal=b.dataset.k;renderPlanEd()});
  $$('.ed input',host).forEach(inp=>inp.oninput=()=>{const it=draft[edMeal][+inp.dataset.i];if(inp.dataset.f==='s')it[2]=textToSwaps(inp.value);else{it[+inp.dataset.f]=inp.value;if(it[3]&&[0,1].includes(+inp.dataset.f)){delete it[3];renderBank()}}});
  $$('[data-del]',host).forEach(b=>b.onclick=()=>{draft[edMeal].splice(+b.dataset.del,1);renderPlanEd()});
  $('#edAdd',host).onclick=()=>{draft[edMeal].push(['Novo alimento','1 porção',[]]);renderPlanEd();const ins=$$('.ed .row input:first-child',host);ins[ins.length-1].focus();ins[ins.length-1].select()};
  $('#edPub',host).onclick=()=>{if(sel===0)plano=JSON.parse(JSON.stringify(draft));else patientPlans.set(sel,JSON.parse(JSON.stringify(draft)));openItem=0;drawPlano();$('#planUp').textContent='Atualizado hoje por Ana Ribeiro';toast('Plano publicado para '+pacientes[sel].n+'.')};
  $('#edReset',host).onclick=()=>{draft=JSON.parse(JSON.stringify(sel===0?plano:(patientPlans.get(sel)||seedPlan)));renderPlanEd();toast('Mudanças descartadas.')};
  renderBank();
}


/* ---------- banco de alimentos e cálculo nutricional ---------- */
// Valores APROXIMADOS por 100 g (ordem de grandeza da TACO), só para a demonstração.
// Na versão real, importar a TACO completa e conferir com o nutricionista.
const FOODS=[['Arroz branco cozido',128,2.5,28.1,.2],['Arroz integral cozido',124,2.6,25.8,1],['Feijão carioca cozido',76,4.8,13.6,.5],['Feijão preto cozido',77,4.5,14,.5],['Lentilha cozida',93,6.3,16.3,.5],
['Peito de frango grelhado',159,32,0,2.5],['Patinho bovino grelhado',219,35.9,0,7.3],['Ovo cozido',146,13.3,.6,9.5],['Tilápia grelhada',128,26,0,2.7],['Atum em conserva (água)',118,26,0,1],
['Batata inglesa cozida',52,1.2,11.9,0],['Batata-doce cozida',77,.6,18.4,.1],['Mandioca cozida',125,.6,30.1,.3],['Macarrão cozido',102,3.4,19.9,.5],['Pão francês',300,8,58.6,3.1],['Pão integral',253,9.4,49.9,3.7],['Aveia em flocos',394,13.9,66.6,8.5],
['Banana prata',98,1.3,26,.1],['Maçã',56,.3,15.2,0],['Laranja',37,1,8.9,.1],['Mamão',40,.5,10.4,.1],['Abacate',96,1.2,6,8.4],['Morango',30,.9,6.8,.3],
['Leite integral',61,2.9,4.3,3.2],['Leite desnatado',35,3.4,4.9,.1],['Iogurte natural',51,4.1,1.9,3],['Queijo minas frescal',264,17.4,3.2,20.2],['Queijo muçarela',330,22.6,3,25.2],
['Brócolis cozido',25,2.1,4.4,.5],['Cenoura cozida',30,.8,6.7,.2],['Tomate',15,1.1,3.1,.2],['Alface',11,1.4,1.7,.2],['Abobrinha cozida',15,1.1,3,.2],['Couve refogada',90,1.7,8.7,6.6],
['Azeite de oliva',884,0,0,100],['Amendoim',544,27,20.3,43.9],['Castanha-do-pará',643,14.5,15.1,63.5],['Café sem açúcar',2,.1,.3,0],['Açúcar',387,0,99.8,0]];
const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const bank={q:'',sel:-1,g:100};
const r1=n=>Math.round(n*10)/10;
function itemMac(it){const m=it[3];return m&&[m.k,m.p,m.c,m.f].every(Number.isFinite)?m:null}
function sumMac(items){return items.reduce((a,it)=>{const m=itemMac(it);if(m){a.k+=m.k;a.p+=m.p;a.c+=m.c;a.f+=m.f;a.n++}else a.sem++;return a},{k:0,p:0,c:0,f:0,n:0,sem:0})}
function macHtml(s){return `<div class="macros"><div><b>${Math.round(s.k)}</b><small>kcal</small></div><div><b>${r1(s.p)} g</b><small>proteína</small></div><div><b>${r1(s.c)} g</b><small>carboidrato</small></div><div><b>${r1(s.f)} g</b><small>gordura</small></div></div>`}
function renderBank(){
  const h=$('#foodBank'); if(!h||!draft)return;
  const q=norm(bank.q.trim());
  const res=FOODS.map((f,i)=>[f,i]).filter(([f])=>!q||norm(f[0]).includes(q)).slice(0,6);
  const f=FOODS[bank.sel], g=bank.g;
  const meal=sumMac(draft[edMeal]), day=sumMac(Object.values(draft).flat());
  h.innerHTML=`<h3 class="eyebrow">BANCO DE ALIMENTOS · CÁLCULO</h3>
  <label class="fld"><span>Buscar alimento</span><input id="fbQ" type="search" maxlength="40" value="${esc(bank.q)}" placeholder="Ex.: arroz, frango, banana" autocomplete="off"></label>
  <div class="fbRes" role="listbox" aria-label="Resultados">${res.map(([x,i])=>`<button type="button" role="option" data-fb="${i}" aria-pressed="${i===bank.sel}"><span>${esc(x[0])}</span><small>${x[1]} kcal / 100 g</small></button>`).join('')||'<p class="note" style="margin:0">Nenhum alimento encontrado.</p>'}</div>
  ${f?`<div class="row" style="gap:10px;align-items:end;flex-wrap:wrap"><label class="fld" style="margin:0;flex:1;min-width:120px"><span>Quantidade (g)</span><input id="fbG" type="number" inputmode="decimal" min="1" max="2000" step="1" value="${g}"></label><button type="button" class="btn primary" id="fbAdd">Adicionar em ${esc(edMeal)}</button></div>
  ${macHtml({k:f[1]*g/100,p:f[2]*g/100,c:f[3]*g/100,f:f[4]*g/100})}`:'<p class="note" style="margin:0">Escolha um alimento para ver as calorias e os macronutrientes da quantidade.</p>'}
  <h3 class="eyebrow" style="margin-top:18px">TOTAL · ${esc(edMeal).toUpperCase()}</h3>${macHtml(meal)}
  <h3 class="eyebrow" style="margin-top:14px">TOTAL DO DIA</h3>${macHtml(day)}
  <p class="note" style="margin:10px 0 0">${day.sem?`${day.sem} item(ns) sem cálculo, digitados à mão. `:''}Valores aproximados de exemplo (por 100 g). Na versão real, a tabela TACO completa e a revisão do profissional.</p>`;
  $('#fbQ').oninput=e=>{bank.q=e.target.value.slice(0,40);const p=e.target.selectionStart;renderBank();const n=$('#fbQ');n.focus();n.setSelectionRange(p,p)};
  $$('#foodBank [data-fb]').forEach(b=>b.onclick=()=>{bank.sel=+b.dataset.fb;renderBank()});
  if(f){
    $('#fbG').oninput=e=>{const v=parseFloat(e.target.value);bank.g=Number.isFinite(v)?Math.min(2000,Math.max(1,v)):100;const p=e.target.selectionStart;renderBank();const n=$('#fbG');n.focus();try{n.setSelectionRange(p,p)}catch(_){}};
    $('#fbAdd').onclick=()=>{const m={k:Math.round(f[1]*g/100),p:r1(f[2]*g/100),c:r1(f[3]*g/100),f:r1(f[4]*g/100)};
      draft[edMeal].push([f[0],`${g} g`,[],m]);renderPlanEd();toast(`${f[0]} adicionado em ${edMeal}.`)};
  }
}

/* ---------- convite e termo de consentimento ---------- */
let lastInvite=null;
function renderInvite(){
  const c=$('#convCard');
  c.innerHTML=`<h3 class="eyebrow">CONVIDAR PACIENTE</h3>
  <form class="invite" id="invForm"><div class="two"><label><small class="note">Nome</small><input type="text" id="invN" required placeholder="Nome do paciente"></label><label><small class="note">E-mail ou WhatsApp</small><input type="text" id="invC" required placeholder="contato"></label></div>
  <button class="btn primary" style="justify-self:start">Gerar convite</button></form>
  <div id="invOut"></div>`;
  $('#invForm').onsubmit=e=>{
    e.preventDefault();
    const n=$('#invN').value.trim(); if(!n)return;
    const tok=Array.from(crypto.getRandomValues(new Uint8Array(9)),b=>b.toString(36).padStart(2,'0')).join('').slice(0,14);
    const base=location.protocol.startsWith('http')?location.origin+location.pathname:'https://seu-site.github.io/nutrilume/';
    const link=`${base}?convite=${tok}`;
    pacientes.push({n,s:'Convite enviado',w:true,obj:'Primeira consulta',ult:'—',prox:'—',peso:'—',cint:'—',consent:null});
    lastInvite=pacientes.length-1; sel=lastInvite; renderNut();
    $('#invOut').innerHTML=`<div class="stack" style="margin-top:12px"><div class="linkbox"><b>Convite para ${esc(n)}</b><br>${esc(link)}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn" id="invCopy">Copiar link</button><button type="button" class="btn" id="invSim">Ver como o paciente (simulação)</button></div>
    <p class="note" style="margin:0">Demonstração: o link não funciona de verdade. Na versão completa, ele é de uso único e expira.</p></div>`;
    $('#invCopy').onclick=()=>{try{navigator.clipboard.writeText(link).then(()=>toast('Link copiado.'),()=>toast('Não consegui copiar. Selecione o texto.'))}catch(_){toast('Não consegui copiar. Selecione o texto.')}};
    $('#invSim').onclick=()=>{view('pac');goTab('hoje');showConsent(lastInvite)};
  };
}
function showConsent(i){
  const p=pacientes[i], ov=document.createElement('div'); ov.className='overlay';
  ov.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="cTitle"><h2 id="cTitle" style="font-size:24px">Olá, ${esc(p.n.split(' ')[0])}</h2>
  <p style="margin:6px 0 10px;color:var(--muted)">Ana Ribeiro convidou você para acompanhar o plano alimentar aqui. Antes de começar, leia e escolha o que autoriza.</p>
  <label class="ck"><input type="checkbox" id="c1"><span><b>Obrigatório.</b> Autorizo a Ana Ribeiro a tratar meus dados de saúde (medidas, diário e plano) para o meu acompanhamento.</span></label>
  <label class="ck"><input type="checkbox" id="c2"><span><b>Opcional.</b> Autorizo guardar minhas fotos de evolução, visíveis só para mim e para a Ana.</span></label>
  <label class="ck"><input type="checkbox" id="c3"><span><b>Opcional.</b> Quero participar do grupo do consultório.</span></label>
  <p class="note" style="margin:10px 0 14px">Você pode mudar isso depois e pedir para apagar sua conta e seus dados quando quiser.</p>
  <button class="btn primary" id="cOk" style="width:100%" disabled>Aceitar e começar</button></div>`;
  document.body.appendChild(ov);
  const c1=$('#c1',ov),ok=$('#cOk',ov); c1.focus();
  c1.onchange=()=>ok.disabled=!c1.checked;
  ok.onclick=()=>{
    p.consent={fotos:$('#c2',ov).checked,grupo:$('#c3',ov).checked,quando:new Date().toLocaleDateString('pt-BR')};
    p.s='Novo este mês'; p.w=false; ov.remove(); renderNut(); toast('Termo aceito. Bem-vindo(a)!');
  };
}
renderInvite();

/* animação 5: números que sobem uma vez */
function countUp(){
  $$('[data-count]').forEach(el=>{
    const to=+el.dataset.count, pre=el.dataset.pre||'', t0=performance.now(), dur=reduce?1:900;
    (function step(t){const k=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-k,3);el.textContent=pre+Math.round(to*e).toLocaleString('pt-BR');if(k<1)requestAnimationFrame(step)})(t0);
  });
}

if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});

/* =====================================================================
   Funções adicionadas: WhatsApp, grupo, compras, receitas, ficha, metas, lembretes
   ===================================================================== */
function modal(inner,{dismiss=true}={}){
  const ov=document.createElement('div'); ov.className='overlay';
  ov.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${inner}</div>`;
  const prev=document.activeElement;
  const kd=e=>{if(e.key==='Escape'&&dismiss)close()};
  function close(){ov.remove();document.removeEventListener('keydown',kd);if(prev&&prev.focus)prev.focus()}
  document.addEventListener('keydown',kd); document.body.appendChild(ov);
  return {ov,close};
}
function modeChips(host,labels,cur,onPick){
  host.innerHTML=labels.map(l=>`<button class="chip" type="button" aria-pressed="${l===cur}">${esc(l)}</button>`).join('');
  $$('.chip',host).forEach(b=>b.onclick=()=>onPick(b.textContent));
}

/* ---------- WhatsApp ---------- */
const wa={on:true,num:'5581900000000'};            // número fictício de exemplo
const patientTel={'Marina Costa':'5581911112222'};  // número fictício de exemplo
const WA_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.3z"/></svg>';
const onlyDigits=v=>String(v).replace(/\D/g,'');
function normBR(v){let d=onlyDigits(v); if(d.length===10||d.length===11)d='55'+d; return /^55\d{10,11}$/.test(d)?d:null}
function waLink(num,text){const n=normBR(num); if(!n)return null; return 'https://wa.me/'+n+'?text='+encodeURIComponent(String(text).slice(0,300))}
function waOpen(num,text,quem){
  const href=waLink(num,text);
  if(!href||!href.startsWith('https://wa.me/')){toast('Número de WhatsApp inválido. Use DDD + número.');return}
  const m=modal(`<h2 style="font-size:22px">Abrir o WhatsApp?</h2>
    <p style="margin:8px 0;color:var(--muted)">O WhatsApp é um serviço de terceiros, fora do Nutrilume. Para sua privacidade, <b>não envie exames, fotos do corpo nem outros dados de saúde por lá</b>. Use as Mensagens do app para isso.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px" id="waBtns"></div>`);
  const a=document.createElement('a'); a.className='btn primary'; a.textContent='Continuar para o WhatsApp'; a.href=href; a.target='_blank'; a.rel='noopener noreferrer'; a.onclick=()=>setTimeout(m.close,50);
  const c=document.createElement('button'); c.className='btn'; c.type='button'; c.textContent='Cancelar'; c.onclick=m.close;
  $('#waBtns',m.ov).append(a,c); c.focus();
}
function renderWaPac(){
  const h=$('#waPac'); if(!h)return;
  if(wa.on&&normBR(wa.num)){
    h.innerHTML=`<button type="button" class="btn wa" id="waGo" style="width:100%">${WA_ICON}Falar pelo WhatsApp</button><p class="note" style="margin:8px 0 0">Para dados de saúde e exames, use as mensagens aqui no app.</p>`;
    $('#waGo').onclick=()=>waOpen(wa.num,'Olá, Ana! Aqui é a Marina, paciente no Nutrilume.','Ana');
  } else h.innerHTML='<p class="note" style="margin:0">A Ana atende somente pelas mensagens do app.</p>';
}
function renderWaNut(){
  const h=$('#waNut'); if(!h)return;
  h.innerHTML=`<div class="card" style="background:#FBFCFB"><h3 class="eyebrow">WHATSAPP</h3>
   <label class="ck" style="cursor:pointer"><input type="checkbox" id="waOn" ${wa.on?'checked':''}><span>Mostrar o botão do WhatsApp para os pacientes</span></label>
   <div class="sendrow"><input type="tel" id="waNum" inputmode="tel" maxlength="20" placeholder="Seu WhatsApp com DDD" aria-label="Seu WhatsApp com DDD" value="${esc(wa.num?wa.num.replace(/^55/,''):'')}"><button type="button" class="btn" id="waSave" style="width:auto;border-radius:14px">Salvar</button></div>
   <div style="margin-top:12px"><button type="button" class="btn wa" id="waMarina">${WA_ICON}Chamar a Marina no WhatsApp</button></div>
   <p class="note" style="margin:8px 0 0">Conversas no WhatsApp ficam fora da plataforma e do termo de consentimento. Evite dados sensíveis lá.</p></div>`;
  $('#waOn').onchange=e=>{wa.on=e.target.checked;toast(wa.on?'Botão ativado para os pacientes.':'Botão desativado.')};
  $('#waSave').onclick=()=>{const n=normBR($('#waNum').value); if(!n){toast('Número inválido. Use DDD + número, por exemplo 81 99999-0000.');return} wa.num=n;toast('Número salvo.')};
  $('#waMarina').onclick=()=>waOpen(patientTel['Marina Costa'],'Olá, Marina! Aqui é a Ana Ribeiro, sua nutricionista.','Marina');
}

/* ---------- plano: refeições / compras / receitas ---------- */
let planMode='Refeições'; const shopDone=new Set(); const shopExtra=[];
function setPlanMode(m){
  planMode=m; modeChips($('#planMode'),['Refeições','Lista de compras','Receitas'],m,setPlanMode);
  $('#planView').hidden=m!=='Refeições'; $('#shopView').hidden=m!=='Lista de compras'; $('#recView').hidden=m!=='Receitas';
  if(m==='Lista de compras')renderShop(); if(m==='Receitas')renderRec();
}
function shopItems(){
  const map=new Map();
  Object.values(plano).forEach(arr=>arr.forEach(it=>{const k=String(it[0]).trim(); if(k&&!map.has(k))map.set(k,String(it[1]))}));
  return [...map.entries()].map(([k,p])=>({k,p})).concat(shopExtra.map(k=>({k,p:'adicionado por você'})));
}
function renderShop(){
  const h=$('#shopView'), items=shopItems();
  h.innerHTML=`<div class="card shop"><h3 class="eyebrow">LISTA DE COMPRAS DA SEMANA</h3>${items.map((it,i)=>`<label><input type="checkbox" data-k="${esc(it.k)}" ${shopDone.has(it.k)?'checked':''}><span><b>${esc(it.k)}</b><br><small style="color:var(--muted)">${esc(it.p)}</small></span></label>`).join('')}
  <form class="sendrow" id="shopForm"><input type="text" id="shopIn" maxlength="60" placeholder="Adicionar item" aria-label="Adicionar item"><button aria-label="Adicionar">+</button></form>
  <div style="display:flex;gap:10px;margin-top:12px"><button type="button" class="btn" id="shopCopy">Copiar o que falta</button></div></div>
  <p class="note">A lista vem do seu plano e se atualiza quando a Ana publica mudanças.</p>`;
  $$('#shopView input[type=checkbox]').forEach(c=>c.onchange=()=>{c.checked?shopDone.add(c.dataset.k):shopDone.delete(c.dataset.k)});
  $('#shopForm').onsubmit=e=>{e.preventDefault();const v=$('#shopIn').value.trim().slice(0,60); if(!v)return; if(!shopExtra.includes(v))shopExtra.push(v); renderShop()};
  $('#shopCopy').onclick=()=>{const t=shopItems().filter(i=>!shopDone.has(i.k)).map(i=>'- '+i.k).join('\n');try{navigator.clipboard.writeText(t).then(()=>toast('Lista copiada.'),()=>toast('Não consegui copiar.'))}catch(_){toast('Não consegui copiar.')}};
}
const receitas=[
 {t:'Omelete de forno com legumes',q:'Jantar',ing:['4 ovos','1 tomate pequeno picado','1/2 abobrinha ralada','1 colher de sopa de salsinha','sal a gosto'],pas:['Bata os ovos com o sal.','Misture os legumes e a salsinha.','Coloque em forma untada e asse a 200 °C por 20 minutos, até firmar.']},
 {t:'Iogurte com aveia e banana',q:'Lanche',ing:['1 pote de iogurte natural (170 g)','1 colher de sopa de aveia em flocos','1 banana prata em rodelas'],pas:['Coloque o iogurte numa tigela.','Acrescente a aveia e a banana por cima.']},
 {t:'Sopa de legumes com frango',q:'Jantar',ing:['1 filé de frango em cubos','1 batata média','1 cenoura','1 chuchu','água, alho e sal a gosto'],pas:['Refogue o alho e o frango.','Junte os legumes picados e cubra com água.','Cozinhe até os legumes ficarem macios, cerca de 25 minutos.']}
];
function renderRec(){
  const h=$('#recView');
  h.innerHTML=receitas.map((r,i)=>`<div class="card rec" data-i="${i}"><button class="h" type="button" aria-expanded="false"><span>${esc(r.t)}<br><small style="color:var(--muted);font-weight:500">Combina com: ${esc(r.q)}</small></span><svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B6130" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></button>
   <div class="body"><div><b>Ingredientes</b><ul>${r.ing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><b>Modo de preparo</b><ol>${r.pas.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div></div></div>`).join('')+'<p class="note">Receitas de exemplo, sem promessa de resultado. Siga as quantidades do seu plano.</p>';
  $$('.rec .h',h).forEach(b=>b.onclick=()=>{const c=b.closest('.rec');const o=c.classList.toggle('open');b.setAttribute('aria-expanded',o);});
}
setPlanMode('Refeições');

/* ---------- ficha (anamnese) ---------- */
function renderFicha(){
  const p=pacientes[0], h=$('#fichaCard'); if(!h)return;
  h.innerHTML=p.ficha
   ?`<h3 class="eyebrow">MINHA FICHA</h3><p style="margin:0 0 10px">Enviada em ${esc(p.ficha.quando)}. Só você e a Ana veem.</p><button class="btn" id="fichaBtn" style="width:100%">Editar ficha</button>`
   :`<h3 class="eyebrow">MINHA FICHA</h3><p style="margin:0 0 10px">Conte à Ana sobre alergias, remédios e rotina. Leva uns 3 minutos.</p><button class="btn primary" id="fichaBtn" style="width:100%">Preencher ficha</button>`;
  $('#fichaBtn').onclick=openFicha;
}
function openFicha(){
  const p=pacientes[0], f=p.ficha||{};
  const m=modal(`<h2 style="font-size:22px">Minha ficha</h2><p class="note" style="margin:4px 0 12px">Dados de saúde. Só você e a Ana Ribeiro veem.</p>
  <form class="form" id="fForm">
   <label>Alergias ou intolerâncias<input id="fAl" required maxlength="200" placeholder="Se não tiver, escreva: nenhuma"></label>
   <label>Remédios em uso<input id="fMed" maxlength="200" placeholder="Opcional"></label>
   <label>Horas de sono por noite<select id="fSono"><option>Menos de 6 h</option><option>6 a 8 h</option><option>Mais de 8 h</option></select></label>
   <label>Refeições fora de casa por semana<input id="fFora" type="number" min="0" max="21" value="0" required></label>
   <label>Seu objetivo<input id="fObj" required maxlength="200" placeholder="Ex.: ter mais energia"></label>
   <label>Algo mais que a Ana deva saber?<textarea id="fObs" rows="3" maxlength="400"></textarea></label>
   <div style="display:flex;gap:10px"><button class="btn primary" style="flex:1">Salvar</button><button type="button" class="btn" id="fCancel">Cancelar</button></div></form>`);
  $('#fAl',m.ov).value=f.al||''; $('#fMed',m.ov).value=f.med||''; $('#fSono',m.ov).value=f.sono||'6 a 8 h'; $('#fFora',m.ov).value=f.fora??0; $('#fObj',m.ov).value=f.obj||''; $('#fObs',m.ov).value=f.obs||'';
  $('#fAl',m.ov).focus(); $('#fCancel',m.ov).onclick=m.close;
  $('#fForm',m.ov).onsubmit=e=>{
    e.preventDefault();
    const fora=Math.max(0,Math.min(21,parseInt($('#fFora',m.ov).value,10)||0));
    p.ficha={al:$('#fAl',m.ov).value.trim().slice(0,200),med:$('#fMed',m.ov).value.trim().slice(0,200),sono:['Menos de 6 h','6 a 8 h','Mais de 8 h'].includes($('#fSono',m.ov).value)?$('#fSono',m.ov).value:'6 a 8 h',fora,obj:$('#fObj',m.ov).value.trim().slice(0,200),obs:$('#fObs',m.ov).value.trim().slice(0,400),quando:new Date().toLocaleDateString('pt-BR')};
    m.close(); renderFicha(); renderFichaNut(); toast('Ficha enviada para a Ana.');
  };
}
function renderFichaNut(){
  const h=$('#fichaNut'); if(!h)return; const p=pacientes[sel], f=p&&p.ficha;
  h.innerHTML='<h3 class="eyebrow">FICHA DE PRIMEIRA CONSULTA</h3>'+(f
   ?`<dl style="margin:0;display:grid;gap:8px"><div><b>Alergias:</b> ${esc(f.al)}</div><div><b>Remédios:</b> ${esc(f.med||'—')}</div><div><b>Sono:</b> ${esc(f.sono)}</div><div><b>Refeições fora de casa/semana:</b> ${esc(f.fora)}</div><div><b>Objetivo:</b> ${esc(f.obj)}</div><div><b>Observações:</b> ${esc(f.obs||'—')}</div><div class="note">Enviada em ${esc(f.quando)}</div></dl>`
   :'<p class="note" style="margin:0">Ficha ainda não preenchida pelo paciente.</p>');
}

/* ---------- meta da semana ---------- */
function renderMeta(){
  if(!$('#metaTxt'))return;
  $('#metaTxt').textContent=meta.t;
  $('#metaBars').innerHTML=Array.from({length:meta.of},(_,i)=>`<span style="flex:1;height:8px;border-radius:4px;background:${i<meta.d?'#2B6130':'#E8EDDC'};transition:background .3s"></span>`).join('');
  $('#metaNote').textContent=`${meta.d} de ${meta.of} dias`; $('#metaBtn').disabled=meta.d>=meta.of||metaDates.has(todayKey()); renderPlants(false);
}
$('#metaBtn').onclick=()=>{if(meta.d<meta.of&&!metaDates.has(todayKey())){metaDates.add(todayKey());meta.d++;renderMeta();renderPlants(true)}};
renderMeta();
function renderMetaEd(){
  const h=$('#metaEd'); if(!h)return;
  h.innerHTML=`<h3 class="eyebrow">META DA SEMANA DA MARINA</h3><form class="sendrow" id="metaForm" style="flex-wrap:wrap"><input id="metaIn" maxlength="60" value="${esc(meta.t)}" aria-label="Meta"><select id="metaDias" aria-label="Dias" style="min-height:44px;border-radius:12px;border:1px solid var(--line);padding:0 10px">${[3,4,5,6,7].map(n=>`<option ${n===meta.of?'selected':''}>${n}</option>`).join('')}</select><button class="btn primary" style="width:auto;border-radius:14px;font-size:14px">Salvar meta</button></form>
  <p class="note" style="margin:8px 0 0">Metas medem constância (dias cumpridos), nunca peso.</p>`;
  $('#metaForm').onsubmit=e=>{e.preventDefault();const t=$('#metaIn').value.trim().slice(0,60); const n=Math.max(3,Math.min(7,parseInt($('#metaDias').value,10)||5)); if(!t)return; if(/\d+([.,]\d+)?\s*(kg|quilos?)/i.test(t)){toast('Metas não devem ser de peso. Use hábitos, como dias cumpridos.');return} meta.t=t;meta.of=n;meta.d=0;metaDates.clear();renderMeta();toast('Meta salva. A Marina já vê.')};
}

/* ---------- lembretes ---------- */
function renderLem(){
  const h=$('#lemCard'); if(!h)return;
  const sup='Notification' in window, perm=sup?Notification.permission:'unsupported';
  h.innerHTML=`<h3 class="eyebrow">LEMBRETES</h3><p style="margin:0 0 10px">${perm==='granted'?'Avisos ativados neste aparelho.':'Receba um aviso na hora das refeições.'}</p><button class="btn ${perm==='granted'?'':'primary'}" id="lemBtn" style="width:100%">${perm==='granted'?'Enviar aviso de teste':'Ativar lembretes'}</button><p class="note" style="margin:8px 0 0">No iPhone, os avisos só funcionam depois de instalar o app na Tela de Início. Nesta demonstração eles aparecem apenas com a página aberta.</p>`;
  $('#lemBtn').onclick=async()=>{
    if(!sup){toast('Este navegador não oferece avisos. No iPhone, instale o app na Tela de Início.');return}
    try{ if(Notification.permission!=='granted'){const r=await Notification.requestPermission(); if(r!=='granted'){toast('Os avisos não foram permitidos.');renderLem();return}}
      new Notification('Nutrilume',{body:'Teste: hora do lanche da tarde (16h00).'}); renderLem();
    }catch(_){toast('Não foi possível ativar os avisos aqui.')}
  };
}
renderLem();

/* ---------- grupo do consultório ---------- */
const dayIdx=(new Date().getDay()+6)%7, DAYL=['S','T','Q','Q','S','S','D'];
const grp={col:{d:28,of:40},nextId:3,lastPost:0,alerts:[],goal:5,days:[1,1,0,0,0,0,0],
 posts:[{id:1,by:'Ana Ribeiro',nut:true,t:'Bem-vindos ao grupo! Aqui trocamos receitas e desafios de constância. Dúvida sobre o seu caso, mande mensagem privada.',hidden:false,rep:0},
        {id:2,by:'Joana R.',nut:false,t:'Fiz o omelete de forno de ontem e ficou ótimo!',hidden:false,rep:0}],
 poll:{q:'Que horário você prefere para o encontro de receitas?',opts:[{t:'Terça, 19h',v:4},{t:'Quinta, 12h30',v:2},{t:'Sábado, 9h',v:5}],voted:-1}};
function moderate(t){
  const x=t.toLowerCase();
  if(/(jejum prolongado|laxante|vomitar|me odeio|passar fome|purgar)/.test(x))return 'alerta';
  if(/\d+([.,]\d+)?\s*(kg|quilos?)/.test(x))return 'peso';
  if(/(https?:|www\.|\.com\b|\.br\b)/.test(x))return 'link';
  if(/(\b\d+\s*(mg|mcg)\b|\bdose\b|suplement)/.test(x))return 'clinico';
  return null;
}
const modMsg={peso:'No grupo não compartilhamos pesos nem medidas. Fale com a Ana pela mensagem privada.',link:'Links não são permitidos no grupo.',clinico:'Orientação sobre dose ou suplemento só com a sua nutricionista.'};
function setMsgMode(m){
  modeChips($('#msgMode'),['Conversa','Grupo'],m,setMsgMode);
  $('#chatView').hidden=m!=='Conversa'; $('#grpView').hidden=m!=='Grupo'; if(m==='Grupo')renderGrpPac();
}
function postHtml(p,withReport){return `<div class="post"><div class="by">${esc(p.by)}${p.nut?' <span class="status">Nutricionista</span>':''}</div><div>${esc(p.t)}</div>${withReport&&!p.nut?`<button class="link" type="button" data-rep="${p.id}">Denunciar</button>`:''}</div>`}
function renderGrpPac(){
  const h=$('#grpView'); if(!h)return;
  const total=grp.poll.opts.reduce((a,o)=>a+o.v,0), voted=grp.poll.voted>=0;
  const done=grp.days.reduce((a,b)=>a+b,0);
  const vis=grp.posts.filter(p=>!p.hidden);
  h.innerHTML=`<div class="card hero"><div class="txt"><div class="eyebrow">PLANTA DO GRUPO</div><h2>${grp.col.d} de ${grp.col.of} registros nesta semana</h2><p>Cresce quando o grupo todo participa. Ninguém é comparado.</p></div><div class="plantBox">${plantSVG(plantStage(grp.col.d,grp.col.of),true,88)}</div></div>
   <div class="card"><h3 class="eyebrow">AVISO DA ANA</h3>${vis.filter(p=>p.nut).slice(-1).map(p=>`<div>${esc(p.t)}</div>`).join('')||'<p class="note" style="margin:0">Sem avisos.</p>'}</div>
   <div class="card poll"><h3 class="eyebrow">ENQUETE</h3><p style="margin:0 0 10px;font-weight:600">${esc(grp.poll.q)}</p>${grp.poll.opts.map((o,i)=>`<button class="opt" type="button" data-v="${i}" ${voted?'disabled':''}><span class="fill" style="width:${voted?Math.round(o.v/total*100):0}%"></span><span>${esc(o.t)}${grp.poll.voted===i?' ✓':''}</span><span>${voted?o.v+' voto'+(o.v===1?'':'s'):''}</span></button>`).join('')}${voted?'':'<p class="note" style="margin:0">Você pode votar uma vez.</p>'}</div>
   <div class="card"><h3 class="eyebrow">DESAFIO DA SEMANA · CONSTÂNCIA</h3><p style="margin:0 0 10px;font-weight:600">Registrar o diário em ${grp.goal} dias</p><div class="days" role="group" aria-label="Dias da semana">${DAYL.map((l,i)=>`<button type="button" data-d="${i}" aria-pressed="${!!grp.days[i]}" ${i===dayIdx?'':'disabled'} aria-label="${['segunda','terça','quarta','quinta','sexta','sábado','domingo'][i]}">${l}</button>`).join('')}</div><p class="note" style="margin:8px 0 0">${done} de ${grp.goal} dias. O desafio premia constância, não quilos.</p></div>
   <div class="card"><h3 class="eyebrow">CONVERSA DO GRUPO</h3>${vis.filter(p=>!p.nut).map(p=>postHtml(p,true)).join('')||'<p class="note">Ainda sem mensagens.</p>'}
   <form class="sendrow" id="grpForm"><input id="grpIn" maxlength="280" placeholder="Escreva para o grupo" aria-label="Mensagem para o grupo"><button aria-label="Publicar">→</button></form>
   <p class="note" style="margin:8px 0 0">Sem pesos, links ou orientação de dose. Dúvidas sobre o seu caso, fale com a Ana em particular.</p></div>`;
  $$('#grpView .opt').forEach(b=>b.onclick=()=>{if(grp.poll.voted>=0)return;const i=+b.dataset.v;grp.poll.voted=i;grp.poll.opts[i].v++;renderGrpPac()});
  $$('#grpView .days button').forEach(b=>b.onclick=()=>{const i=+b.dataset.d;if(i!==dayIdx)return;grp.days[i]=grp.days[i]?0:1;renderGrpPac()});
  $$('#grpView [data-rep]').forEach(b=>b.onclick=()=>{const p=grp.posts.find(x=>x.id===+b.dataset.rep);if(p){p.rep++;$('#bgGrp').hidden=false;b.disabled=true;b.textContent='Denunciado';toast('Denúncia enviada para a Ana.')}});
  $('#grpForm').onsubmit=e=>{
    e.preventDefault(); const v=$('#grpIn').value.trim().slice(0,280); if(!v)return;
    if(Date.now()-grp.lastPost<3000){toast('Aguarde alguns segundos para publicar de novo.');return}
    const r=moderate(v);
    if(r==='alerta'){grp.alerts.push({when:new Date().toLocaleString('pt-BR')});$('#bgGrp').hidden=false;$('#grpIn').value='';
      modal('<h2 style="font-size:22px">Estamos com você</h2><p style="margin:8px 0;color:var(--muted)">Sua mensagem não foi publicada no grupo. Parece que a comida ou o que você sente sobre ela está pesando. Fale com a Ana pela mensagem privada. Se precisar conversar com alguém agora, o CVV atende pelo 188, a qualquer hora, de graça.</p><button class="btn primary" id="okA" style="width:100%">Entendi</button>').ov.querySelector('#okA').onclick=ev=>ev.target.closest('.overlay').remove();
      return}
    if(r){toast(modMsg[r]);return}
    grp.posts.push({id:grp.nextId++,by:'Marina C.',nut:false,t:v,hidden:false,rep:0}); grp.lastPost=Date.now(); $('#bgGrp').hidden=false; renderGrpPac();
  };
}
function renderGrpNut(){
  const h=$('#grpNut'); if(!h)return;
  h.innerHTML=`<div class="card"><h3 class="eyebrow">PUBLICAR AVISO</h3><form class="sendrow" id="avForm"><input id="avIn" maxlength="280" placeholder="Aviso para os pacientes" aria-label="Aviso"><button aria-label="Publicar">→</button></form></div>
   ${grp.alerts.length?`<div class="alertbox" role="alert"><b>${grp.alerts.length} alerta${grp.alerts.length>1?'s':''} de cuidado.</b> Uma ou mais mensagens com palavras de alerta foram bloqueadas e não foram publicadas. O texto não é guardado. Vale procurar o paciente em particular.<br><small>${grp.alerts.map(a=>esc(a.when)).join(' · ')}</small></div>`:''}
   <div class="card"><h3 class="eyebrow">MENSAGENS DO GRUPO</h3>${grp.posts.map(p=>`<div class="post"><div class="by">${esc(p.by)}${p.nut?' <span class="status">Nutricionista</span>':''}${p.hidden?' <span class="status warn">Oculta</span>':''}${p.rep?` <span class="status warn">${p.rep} denúncia${p.rep>1?'s':''}</span>`:''}</div><div>${esc(p.t)}</div><button class="link" type="button" data-hide="${p.id}">${p.hidden?'Mostrar':'Ocultar'}</button></div>`).join('')}</div>`;
  $('#avForm').onsubmit=e=>{e.preventDefault();const v=$('#avIn').value.trim().slice(0,280);if(!v)return;grp.posts.push({id:grp.nextId++,by:'Ana Ribeiro',nut:true,t:v,hidden:false,rep:0});renderGrpNut();toast('Aviso publicado.')};
  $$('#grpNut [data-hide]').forEach(b=>b.onclick=()=>{const p=grp.posts.find(x=>x.id===+b.dataset.hide);if(p){p.hidden=!p.hidden;renderGrpNut()}});
}
setMsgMode('Conversa'); renderWaPac(); renderFicha();

/* ---------- perfil e avatar (paciente e nutricionista) ---------- */
const prof={
  pac:{nome:'Marina Costa',bio:'Mãe de dois, trabalho o dia todo e quero cozinhar mais em casa.',cidade:'Recife, PE',objetivo:'Ter mais energia e rotina',foto:null},
  nut:{nome:'Ana Ribeiro',crn:'CRN-6 00000 (exemplo)',bio:'Nutricionista clínica. Comida de verdade, sem terrorismo nutricional.',esp:'Emagrecimento, nutrição esportiva',atende:'Presencial e online',foto:null}
};
function avHtml(who){const f=prof[who].foto;return f?`<img src="${f}" alt="">`:'<img src="avatar-logo.png" alt="">'}
function paintAvatars(){$$('[data-av]').forEach(el=>{const w=el.dataset.av;if(prof[w]){el.innerHTML=avHtml(w);const i=el.firstChild;if(i)i.alt=''}})}
const FOTO_OK=['image/jpeg','image/png','image/webp','image/heic','image/heif'];
function lerFoto(file,done){
  if(!file)return;
  if(!FOTO_OK.includes(file.type)){toast('Use uma foto JPG, PNG, WEBP ou HEIC.');return}
  if(file.size>8*1024*1024){toast('A foto passa de 8 MB.');return}
  const url=URL.createObjectURL(file), img=new Image();
  img.onload=()=>{
    const s=256,c=document.createElement('canvas');c.width=c.height=s;
    const m=Math.min(img.width,img.height),sx=(img.width-m)/2,sy=(img.height-m)/2;
    c.getContext('2d').drawImage(img,sx,sy,m,m,0,0,s,s);
    URL.revokeObjectURL(url);
    done(c.toDataURL('image/jpeg',.85));          // reencodar remove EXIF/localização
  };
  img.onerror=()=>{URL.revokeObjectURL(url);toast('Este aparelho não abriu essa foto. Tente JPG ou PNG.')};
  img.src=url;
}
function perfilForm(who,host){
  const p=prof[who], pac=who==='pac';
  const campos=pac
   ?[['nome','Nome',60],['cidade','Cidade',60],['objetivo','Meu objetivo',80]]
   :[['nome','Nome',60],['crn','Registro (CRN)',40],['esp','Especialidades',100],['atende','Atendimento',60]];
  host.innerHTML=`<div class="card hero profHero"><div class="av lg" data-av="${who}"></div><div class="txt"><div class="eyebrow">${pac?'MEU PERFIL':'PERFIL PROFISSIONAL'}</div><h2>${esc(p.nome)}</h2><p>${pac?'Quem vê: só o seu nutricionista.':'Quem vê: seus pacientes.'}</p></div></div>
  <form class="card" id="pf-${who}" novalidate>
    <h3 class="eyebrow">FOTO</h3>
    <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:14px">
      <label class="btn ghost" for="pfFoto-${who}">Escolher foto</label><input type="file" id="pfFoto-${who}" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden>
      <button type="button" class="btn ghost" id="pfRem-${who}">Usar a logo</button>
    </div>
    <p class="note" style="margin:-6px 0 14px">Sem foto, aparece a logo do Nutrilume. A foto é recortada e a localização do arquivo é removida.</p>
    ${campos.map(([k,l,m])=>`<label class="fld"><span>${l}</span><input name="${k}" maxlength="${m}" value="${esc(p[k])}" autocomplete="off"></label>`).join('')}
    <label class="fld"><span>Bio</span><textarea name="bio" maxlength="200" rows="3">${esc(p.bio)}</textarea></label>
    <div class="note" id="pfCnt-${who}" style="margin:-4px 0 12px">${p.bio.length}/200</div>
    <button class="btn" type="submit">Salvar perfil</button>
  </form>
  ${pac?'<div class="card"><h3 class="eyebrow">NA COMUNIDADE</h3><p style="margin:0">Lá você aparece só com apelido e planta. Nome, foto, bio e cidade nunca aparecem.</p></div>':'<div class="card"><h3 class="eyebrow">COMO O PACIENTE TE VÊ</h3><div class="row" style="gap:12px;align-items:center"><div class="av" data-av="nut"></div><div><b>'+esc(p.nome)+'</b><div class="note" style="margin:0">'+esc(p.crn)+'</div></div></div><p style="margin:10px 0 0">'+esc(p.bio)+'</p></div>'}`;
  paintAvatars();
  const f=$('#pf-'+who);
  f.bio.oninput=()=>{$('#pfCnt-'+who).textContent=f.bio.value.length+'/200'};
  $('#pfFoto-'+who).onchange=e=>{lerFoto(e.target.files[0],d=>{p.foto=d;paintAvatars();perfilForm(who,host);toast('Foto atualizada.')});e.target.value=''};
  $('#pfRem-'+who).onclick=()=>{p.foto=null;perfilForm(who,host);toast('Voltou para a logo.')};
  f.onsubmit=e=>{e.preventDefault();
    const nome=f.nome.value.trim();
    if(!nome){toast('Escreva um nome.');return}
    campos.forEach(([k,,m])=>{p[k]=f[k].value.trim().slice(0,m)});
    p.bio=f.bio.value.trim().slice(0,200);
    if(who==='pac'){$('#paciente .hello h1').textContent='Olá, '+p.nome.split(' ')[0];pacientes[0].n=p.nome;}
    perfilForm(who,host);toast('Perfil salvo.');
  };
}
function renderPerfilPac(){perfilForm('pac',$('#perfilPac'))}
function renderPerfilNut(){perfilForm('nut',$('#perfilNut'))}
paintAvatars();

/* ---------- comunidade ---------- */
const com={ok:false,apelido:'',lastPost:0,sala:null,blocked:new Set(),nextId:100,
 salas:[
  {id:'rec',nome:'Receitas do dia a dia',host:'Dra. Paula M.',n:128,mine:false,posts:[
    {id:1,by:'Raiz-Calma',t:'Deixo arroz e feijão porcionados no domingo. Alguém tem outra ideia de marmita?',likes:12,hidden:false,rep:0},
    {id:2,by:'Dra. Paula M.',nut:true,t:'Boa ideia! O que serve para uma pessoa pode não servir para outra. Para o seu caso, fale com o seu nutricionista.',likes:21,hidden:false,rep:0},
    {id:3,by:'Broto-Azul',t:'Fiz iogurte com aveia e banana hoje e ficou ótimo.',likes:4,hidden:false,rep:0}]},
  {id:'rot',nome:'Rotina corrida',host:'Dr. Rafael T.',n:96,mine:false,posts:[{id:4,by:'Pedra-Doce',t:'Alguém tem lanche rápido para levar no trabalho?',likes:3,hidden:false,rep:0}]},
  {id:'dia',nome:'Diabetes no dia a dia',host:'Dra. Helena S.',n:74,mine:false,posts:[{id:5,by:'Galho-Firme',t:'Bom dia! Como vocês organizam as refeições da semana?',likes:2,hidden:false,rep:0}]},
  {id:'esp',nome:'Esporte e energia',host:'Dr. Lucas B.',n:61,mine:false,posts:[]},
  {id:'ana',nome:'Cozinha leve com a Ana',host:'Ana Ribeiro',n:23,mine:true,posts:[
    {id:6,by:'Ana Ribeiro',nut:true,t:'Bem-vindos à sala! Aqui trocamos receitas e ideias de rotina.',likes:5,hidden:false,rep:0},
    {id:7,by:'Folha-Verde',t:'Fiz o omelete de forno e rendeu três dias.',likes:2,hidden:false,rep:0}]}
 ],alerts:0};
const sala=id=>com.salas.find(s=>s.id===id);
const APELIDO_RE=/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9-]{2,19}$/;
function apelidoErro(v){
  if(!APELIDO_RE.test(v))return 'Use 3 a 20 letras, números ou hífen, sem espaço.';
  if(/\d{4,}/.test(v))return 'Não use números de telefone ou documento.';
  const nm=prof.pac.nome.toLowerCase().split(/\s+/).filter(x=>x.length>2);
  if(nm.some(x=>v.toLowerCase().includes(x)))return 'Não use seu nome real.';
  if(moderate(v))return 'Escolha outro apelido.';
  return null;
}
function renderCom(){
  const h=$('#comView'); if(!h)return;
  if(!com.ok){
    h.innerHTML=`<div class="card"><h2 style="font-size:24px">Antes de entrar</h2><p class="note" style="margin:4px 0 0">Aqui você conversa com pacientes de outros nutricionistas. Só aparece o seu apelido.</p></div>
    <form class="card" id="comEnt" novalidate>
      <label class="chk"><input type="checkbox" name="c1"><span>Tenho 18 anos ou mais.</span></label>
      <label class="chk"><input type="checkbox" name="c2"><span>Li as regras: nada de peso, medidas, links ou orientação de dose.</span></label>
      <label class="chk"><input type="checkbox" name="c3"><span>Entendo que o nutricionista da sala vê as mensagens e que aqui não é atendimento. Dúvida do meu caso é com o meu nutricionista.</span></label>
      <label class="chk"><input type="checkbox" name="c4"><span>Aceito o termo da comunidade. Posso sair e apagar minhas mensagens quando quiser.</span></label>
      <div class="hero apel"><div class="txt"><div class="eyebrow">SEU APELIDO NA COMUNIDADE</div><label class="fld inv"><span class="sr">Apelido</span><input name="ap" maxlength="20" value="Folha-do-Sul" autocomplete="off"></label><p>Não use seu nome real. Sugestões: Broto-Azul, Raiz-Calma, Pedra-Doce.</p></div></div>
      <button class="btn" type="submit" id="comGo" disabled>Entrar na comunidade</button>
      <p class="note" style="text-align:center;margin:8px 0 0">O botão só libera depois de marcar os 4 itens.</p>
    </form>`;
    const f=$('#comEnt'), go=$('#comGo');
    const chk=()=>{go.disabled=!['c1','c2','c3','c4'].every(k=>f[k].checked)};
    $$('input[type=checkbox]',f).forEach(c=>c.onchange=chk);
    f.onsubmit=e=>{e.preventDefault();chk();if(go.disabled)return;
      const v=f.ap.value.trim(), er=apelidoErro(v); if(er){toast(er);return}
      com.apelido=v; com.ok=true; renderCom();};
    return;
  }
  if(com.sala){renderSala();return}
  h.innerHTML=`<div class="card hero apelHero"><div class="av lg"><img src="avatar-logo.png" alt=""></div><div class="txt"><div class="eyebrow">VOCÊ APARECE COMO</div><h2>${esc(com.apelido)}</h2><p>Sem nome, foto, bio ou cidade.</p></div></div>
  <h3 class="eyebrow" style="margin:6px 4px 0">SALAS</h3>
  ${com.salas.map(s=>`<button type="button" class="card salaBtn" data-sala="${s.id}"><span class="salaIc" aria-hidden="true">${s.nome[0]}</span><span class="grow1"><b>${esc(s.nome)}</b><span class="note" style="display:block;margin:0">${esc(s.host)} · CRN conferido ✓</span><span class="note" style="display:block;margin:0">${s.n} pessoas</span></span><span class="entrar">Entrar</span></button>`).join('')}
  <span class="pill" style="align-self:flex-start">Dados de exemplo</span>
  <div class="card"><button type="button" class="link" id="comSair">Sair da comunidade e apagar minhas mensagens</button></div>`;
  $$('#comView [data-sala]').forEach(b=>b.onclick=()=>{com.sala=b.dataset.sala;renderCom()});
  $('#comSair').onclick=()=>{com.salas.forEach(s=>{s.posts=s.posts.filter(p=>!p.mine)});com.blocked.clear();com.ok=false;com.sala=null;renderCom();toast('Você saiu e suas mensagens foram apagadas.')};
}
function renderSala(){
  const s=sala(com.sala), h=$('#comView');
  const vis=s.posts.filter(p=>!p.hidden&&!com.blocked.has(p.by));
  h.innerHTML=`<button type="button" class="link back" id="salaVolta">← Salas</button><h2 style="font-size:24px;margin:0">${esc(s.nome)}</h2>
  <div class="card hero host"><div class="txt"><b>${esc(s.host)} · anfitriã(o)</b><p style="margin:2px 0 0">Nutricionista · CRN conferido ✓</p></div></div>
  <div class="aviso">Sem peso, medidas, links ou dose. Dúvida do seu caso é com o seu nutricionista.</div>
  ${vis.map(p=>`<article class="post ${p.nut?'nutPost':''}"><div class="by">${esc(p.by)}${p.nut?' <span class="status">Nutricionista</span>':''}${p.mine?' <span class="status">Você</span>':''}</div><div>${esc(p.t)}</div>
   <div class="row" style="gap:14px;margin-top:6px"><button type="button" class="link" data-like="${p.id}" aria-pressed="${!!p.liked}">Gostei · ${p.likes}</button>${p.mine||p.nut?(p.mine?`<button type="button" class="link" data-del="${p.id}">Apagar</button>`:''):`<button type="button" class="link" data-rep="${p.id}">Denunciar</button><button type="button" class="link" data-blk="${esc(p.by)}">Bloquear</button>`}</div></article>`).join('')||'<p class="note">Ainda sem mensagens.</p>'}
  <form class="sendrow" id="salaForm"><input id="salaIn" maxlength="280" placeholder="Escreva como ${esc(com.apelido)}" aria-label="Mensagem para a sala"><button aria-label="Publicar">→</button></form>
  <button type="button" class="link" id="salaSair">Sair desta sala</button>`;
  $('#salaVolta').onclick=()=>{com.sala=null;renderCom()};
  $('#salaSair').onclick=()=>{com.sala=null;renderCom();toast('Você saiu da sala.')};
  $$('#comView [data-like]').forEach(b=>b.onclick=()=>{const p=s.posts.find(x=>x.id===+b.dataset.like);if(!p)return;p.liked=!p.liked;p.likes+=p.liked?1:-1;renderSala()});
  $$('#comView [data-del]').forEach(b=>b.onclick=()=>{s.posts=s.posts.filter(x=>x.id!==+b.dataset.del);renderSala()});
  $$('#comView [data-rep]').forEach(b=>b.onclick=()=>{const p=s.posts.find(x=>x.id===+b.dataset.rep);if(p){p.rep++;$('#bgCom').hidden=false;b.disabled=true;b.textContent='Denunciado';toast('Denúncia enviada ao anfitrião.')}});
  $$('#comView [data-blk]').forEach(b=>b.onclick=()=>{com.blocked.add(b.dataset.blk);renderSala();toast('Pessoa bloqueada. Você não vê mais as mensagens dela.')});
  $('#salaForm').onsubmit=e=>{
    e.preventDefault(); const v=$('#salaIn').value.trim().slice(0,280); if(!v)return;
    if(Date.now()-com.lastPost<3000){toast('Aguarde alguns segundos para publicar de novo.');return}
    const r=moderate(v);
    if(r==='alerta'){com.alerts++;$('#bgCom').hidden=false;$('#salaIn').value='';
      modal('<h2 style="font-size:22px">Estamos com você</h2><p style="margin:8px 0;color:var(--muted)">Sua mensagem não foi publicada. Parece que a comida ou o que você sente sobre ela está pesando. Fale com o seu nutricionista. Se precisar conversar com alguém agora, o CVV atende pelo 188, a qualquer hora.</p><button class="btn" type="button" id="alOk">Entendi</button>');
      $('#alOk').onclick=()=>$('.overlay').remove(); return}
    if(r){toast({peso:'Aqui não compartilhamos pesos nem medidas.',link:'Links não são permitidos na comunidade.',clinico:'Orientação sobre dose ou suplemento só com o seu nutricionista.'}[r]);return}
    s.posts.push({id:com.nextId++,by:com.apelido,mine:true,t:v,likes:0,hidden:false,rep:0}); com.lastPost=Date.now(); renderSala();
  };
}
function renderComNut(){
  const h=$('#comNut'); if(!h)return;
  const s=sala('ana'), den=s.posts.filter(p=>p.rep>0).length;
  h.innerHTML=`<div class="card hero"><div class="txt"><div class="eyebrow">SUA SALA</div><h2>${esc(s.nome)}</h2><p>${s.n} pessoas · você é a anfitriã</p></div></div>
  ${com.alerts?`<div class="alertbox" role="alert"><b>${com.alerts} alerta${com.alerts>1?'s':''} de cuidado.</b> Mensagens com palavras de alerta foram bloqueadas. O texto não é guardado. Se alguém da sala parecer em sofrimento, encaminhe com cuidado.</div>`:''}
  <div class="card"><h3 class="eyebrow">MENSAGENS DA SALA${den?` · ${den} denunciada${den>1?'s':''}`:''}</h3>
  ${s.posts.map(p=>`<div class="post"><div class="by">${esc(p.by)}${p.nut?' <span class="status">Nutricionista</span>':''}${p.hidden?' <span class="status warn">Oculta</span>':''}${p.rep?` <span class="status warn">${p.rep} denúncia${p.rep>1?'s':''}</span>`:''}</div><div>${esc(p.t)}</div>${p.nut?'':`<button type="button" class="link" data-hide="${p.id}">${p.hidden?'Mostrar':'Ocultar'}</button>`}</div>`).join('')||'<p class="note">Ainda sem mensagens.</p>'}</div>
  <form class="card sendrow" id="comAv"><input id="comAvIn" maxlength="280" placeholder="Publicar na sala" aria-label="Publicar na sala"><button aria-label="Publicar">→</button></form>
  <div class="card"><h3 class="eyebrow">PRIVACIDADE</h3><p style="margin:0">Aqui você vê só apelidos. A atividade dos seus pacientes em outras salas não aparece para você.</p></div>`;
  $$('#comNut [data-hide]').forEach(b=>b.onclick=()=>{const p=s.posts.find(x=>x.id===+b.dataset.hide);if(p){p.hidden=!p.hidden;renderComNut()}});
  $('#comAv').onsubmit=e=>{e.preventDefault();const v=$('#comAvIn').value.trim().slice(0,280);if(!v)return;s.posts.push({id:com.nextId++,by:prof.nut.nome,nut:true,t:v,likes:0,hidden:false,rep:0});renderComNut();toast('Publicado na sala.')};
}
