// Lógica do painel: filtros, gráficos, mapas e tabelas

const $=s=>document.querySelector(s),N=(v,d=0)=>v==null||isNaN(v)?'–':v.toLocaleString('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:d});
const RG={};"Norte:RO AC AM RR PA AP TO|Nordeste:MA PI CE RN PB PE AL SE BA|Sudeste:MG ES RJ SP|Sul:PR SC RS|Centro-Oeste:MS MT GO DF".split('|').forEach(s=>{const[r,u]=s.split(':');u.split(' ').forEach(x=>RG[x]=r)});
const UFS=Object.keys(RG);let CY=[];const MK=[{x:2018,t:'Vírus volta (2018)'},{x:2019,t:'Perde o título (2019)'},{x:2024,t:'Recupera o título (2024)'}];
let f={},sortK='cas',sortD=-1;
const pp=(u,y)=>DATA.pop[u]?.[y];const cs=(u,y)=>DATA.cases[u]?.[y]??0,cv=(u,y)=>(f.dose=='D2'?DATA.cov2:DATA.cov)[u]?.[y];
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:undefined;
const sg=(v,u,d=1)=>v==null||isNaN(v)?'–':(v>0?'▲ +':v<0?'▼ ':'')+N(v,d)+u;
const opt=(id,a,all)=>$(id).innerHTML=(all?`<option value="">${all}</option>`:'')+a.map(x=>`<option>${x}</option>`).join('');
const Ys=[];for(let y=2018;y<=2026;y++)Ys.push(y);
opt('#y0',Ys);opt('#y1',Ys);opt('#reg',[...new Set(Object.values(RG))],'Todas');opt('#uf',[...UFS].sort(),'Todas');
function reset(){f={y0:2018,y1:2026,reg:'',uf:'',dose:'D1'};sync();draw()}
const sync=()=>{for(const k in f)$('#'+k).value=f[k]};
['y0','y1','reg','uf','dose'].forEach(k=>$('#'+k).onchange=e=>{f[k]=k[0]=='y'?+e.target.value:e.target.value;if(f.y0>f.y1){f.y0=f.y1;sync()}draw()});
$('#rst').onclick=reset;$('#met').onchange=draw;
const pick=(k,v)=>{f[k]=f[k]==v?'':v;sync();draw()};
const selUf=(withUf=1)=>UFS.filter(u=>(!f.reg||RG[u]==f.reg)&&(!withUf||!f.uf||u==f.uf));
const allSel=()=>!f.reg&&!f.uf;
function line(el,pts,o={}){if(!pts.length){$(el).innerHTML='<p class="note">Sem dados no período selecionado.</p>';return}
const W=560,H=210,L=44,R=28,T=12,B=26,ys=pts.map(p=>p.y).concat(o.ref??[]);let lo=o.zero?0:Math.min(...ys),hi=Math.max(...ys);if(hi==lo)hi=lo+1;if(!o.zero){const p=(hi-lo)*.15;lo-=p;hi+=p}
const X=i=>L+(pts.length>1?i*(W-L-R)/(pts.length-1):(W-L-R)/2),Y=v=>T+(hi-v)*(H-T-B)/(hi-lo);let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.t||'Gráfico de linha'}">`;
for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;s+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L-5}" y="${Y(v)+4}" text-anchor="end">${N(v,o.d||0)}</text>`}
if(o.ref!=null)s+=`<line x1="${L}" x2="${W-R}" y1="${Y(o.ref)}" y2="${Y(o.ref)}" stroke="var(--ok)" stroke-dasharray="5 4"/><text x="${W-R}" y="${Y(o.ref)-4}" text-anchor="end">meta ${o.ref}%</text>`;
(o.marks||[]).forEach(mk=>{const i=pts.findIndex(p=>p.x==mk.x);if(i>=0)s+=`<line x1="${X(i)}" x2="${X(i)}" y1="${T}" y2="${H-B}" stroke="var(--mut)" stroke-dasharray="3 3" opacity=".6"/><text x="${X(i)+9}" y="${T+4}" transform="rotate(90 ${X(i)+9} ${T+4})" style="font-size:10px">${mk.t}</text>`});s+=`<polyline fill="none" stroke="${o.col}" stroke-width="2.5" points="${pts.map((p,i)=>X(i)+','+Y(p.y)).join(' ')}"/>`;
pts.forEach((p,i)=>s+=`<circle cx="${X(i)}" cy="${Y(p.y)}" r="3.5" fill="${o.col}"><title>${p.x}: ${N(p.y,o.d||0)}</title></circle>`+(pts.length<13||i%3==0?`<text x="${X(i)}" y="${H-8}" text-anchor="middle">${p.x}</text>`:''));
$(el).innerHTML=s+'</svg>'}
function bars(el,it,o={}){const mx=o.max||Math.max(...it.map(i=>i.v),1e-9);$(el).innerHTML=it.map(i=>`<div class="br ${i.sel?'sel':''}" ${i.click?`onclick="pick('${i.click}','${i.k}')" tabindex="0" role="button"`:''}><span>${i.k}</span><div class="t"><div class="f" style="width:${Math.max(1,Math.min(100,i.v/mx*100))}%"></div></div><span>${N(i.v,o.d||0)}${o.u||''}</span></div>`).join('')}
const POS="RR:1,0 AP:3,0 AM:1,1 PA:3,1 MA:4,1 PI:5,1 CE:6,1 RN:7,1 AC:0,2 RO:1,2 MT:2,2 TO:3,2 BA:4,2 PE:6,2 PB:7,2 MS:2,3 GO:3,3 MG:4,3 ES:5,3 AL:6,3 SE:7,3 DF:2,4 SP:3,4 RJ:4,4 PR:3,5 SC:3,6 RS:2,6".split(' ');
function draw(){CY=Object.keys(f.dose=='D2'?DATA.tot2:DATA.tot).map(Number);const S=selUf(),Y=[];for(let y=f.y0;y<=f.y1;y++)Y.push(y);
const cSer=Y.map(y=>({x:y,y:S.reduce((s,u)=>s+cs(u,y),0)})),vY=Y.filter(y=>CY.includes(y));
const vSer=vY.map(y=>({x:y,y:allSel()?(f.dose=='D2'?DATA.tot2:DATA.tot)[y]:mean(S.map(u=>cv(u,y)).filter(v=>v!=null))})).filter(p=>p.y!=null);
const tot=cSer.reduce((s,p)=>s+p.y,0),pk=cSer.reduce((a,p)=>p.y>a.y?p:a,cSer[0]),c0=cSer[0].y,c1=cSer.at(-1).y;
const v0=vSer[0],v1=vSer.at(-1),ly=v1?.x,low=ly?S.filter(u=>cv(u,ly)<95).length:null;
const K=(l,v,d)=>`<div class="card kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
const py=Y.filter(y=>S.some(u=>pp(u,y)!=null)).at(-1),pop=py?S.reduce((a,u)=>a+(pp(u,py)||0),0):null;
$('#kpis').innerHTML=K(v1?`Crianças vacinadas em ${ly}`:'Crianças vacinadas',v1?N(v1.y,1)+'%':'sem dado',v1&&v0&&v0.x!=ly?`${sg(v1.y-v0.y,' pontos')} desde ${v0.x}`:(v1?'um único ano no período':'vacinação disponível só de 2018 a 2025'))+K('Casos de sarampo',N(tot),`de ${f.y0} a ${f.y1} (${N(c1)} em ${f.y1})`)+K(py?`População (${py})`:'População',py?N(pop):'–','pessoas nos estados escolhidos')+K('Estados analisados',S.length,ly?`${low} abaixo da meta de 95% em ${ly}`:'sem dado de vacinação no período');
line('#lc',vSer,{ref:95,col:'var(--acc)',d:1,marks:MK,t:'Gráfico de linha: crianças vacinadas por ano, com a meta de 95%'});$('#lcn').textContent=allSel()?'Dados do Brasil inteiro.':'Média dos estados escolhidos (cada estado conta igual, seja grande ou pequeno).';
line('#ln',cSer,{col:'var(--hot)',zero:1,marks:MK,t:'Gráfico de linha: casos de sarampo por ano'});
// territorial
const pop_=u=>{const yy=Y.filter(y=>pp(u,y)!=null);return yy.length?pp(u,yy.at(-1)):undefined};const S2=selUf(0),T=S2.map(u=>{const yy=CY.filter(y=>y<=f.y1&&y>=f.y0&&cv(u,y)!=null),yf=yy[0],yl=yy.at(-1);let c=0;for(let y=f.y0;y<=f.y1;y++)c+=cs(u,y);
return{uf:u,reg:RG[u],cov0:yf&&cv(u,yf),cov:yl&&cv(u,yl),c,c1:cs(u,f.y1),p:pop_(u),inc:pop_(u)?c/pop_(u)*1e5:undefined,dc:yl&&yf&&yl!=yf?cv(u,yl)-cv(u,yf):undefined}}),m=$('#met').value,val=t=>m=='cob'?t.cov:m=='inc'?t.inc:t.c;
const mx=Math.max(...T.map(t=>val(t)||0),1);
$('#map').innerHTML=`<svg viewBox="${GEO.vb}" role="img" aria-label="Mapa do Brasil por estado">`+Object.entries(GEO.p).map(([u,d])=>{const t=T.find(z=>z.uf==u),v=t?val(t):null;let fill='var(--line)',tip=u+' · '+RG[u]+': sem dado no filtro atual';
if(t){const i=v==null?null:(m=='cob'?(c=>Math.max(0,Math.min(1,(Math.max(...c)-v)/((Math.max(...c)-Math.min(...c))||1))))(T.map(z=>z.cov).filter(x=>x!=null)):v/mx);fill=i==null?'var(--line)':`color-mix(in srgb,var(--hot) ${Math.round(i*85+6)}%,var(--card))`;
tip=`${u} · ${RG[u]}
Crianças vacinadas (último ano): ${N(t.cov,1)}${t.cov!=null?'%':''}
Casos de ${f.y0} a ${f.y1}: ${N(t.c)}
Casos por 100 mil habitantes: ${N(t.inc,1)}`}
return`<path d="${d}" fill="${fill}" stroke="${f.uf==u?'var(--ink)':'var(--card)'}" stroke-width="${f.uf==u?1.6:.6}" style="cursor:pointer" onclick="pick('uf','${u}')"  tabindex="0" role="button" aria-label="${tip.replace(/\n/g,'. ')}"><title>${tip}</title></path>`}).join('')+'</svg>';
$('#rt').textContent=m=='cob'?'Os 10 estados com menos crianças vacinadas':m=='inc'?'Os 10 estados com mais casos para cada 100 mil habitantes':'Os 10 estados com mais casos';
const R=T.filter(t=>val(t)!=null).sort((a,b)=>m=='cob'?a.cov-b.cov:val(b)-val(a)).slice(0,10);
bars('#rank',R.map(t=>({k:t.uf,v:val(t),sel:f.uf==t.uf,click:'uf'})),{max:m=='cob'?110:mx,d:m=='cob'?1:0,u:m=='cob'?'%':''});
const rg=[...new Set(S2.map(u=>RG[u]))].map(r=>{const x=T.filter(t=>t.reg==r);return{k:r,v:m=='cob'?mean(x.map(t=>t.cov).filter(v=>v!=null)):m=='inc'?x.reduce((s,t)=>s+t.c,0)/x.reduce((s,t)=>s+(t.p||0),0)*1e5:x.reduce((s,t)=>s+t.c,0),sel:f.reg==r,click:'reg'}}).filter(r=>r.v!=null);
bars('#regb',rg,{max:m=='cob'?110:undefined,d:m=='cas'?0:1,u:m=='cob'?'%':''});
// heatmap
const hy=CY.filter(y=>y>=f.y0&&y<=f.y1);
$('#hm').innerHTML=hy.length?`<table class="hm"><tr><th>UF</th>${hy.map(y=>`<th>${y}</th>`).join('')}<th>Casos no período</th></tr>`+T.map(t=>`<tr><td><b>${t.uf}</b></td>${hy.map(y=>{const v=cv(t.uf,y),i=v==null?0:v<80?.6:v<95?.25:0;return`<td style="background:color-mix(in srgb,var(--hot) ${i*100}%,var(--card));color:${i>.5?'#fff':'var(--ink)'}">${N(v,1)}</td>`}).join('')}<td style="text-align:right">${N(t.c)}</td></tr>`).join('')+'</table>':'<p class="note">Nenhum ano com dado de cobertura no período selecionado (2018–2025).</p>';
// tabela
const q=T.map(t=>t.c).sort((a,b)=>a-b),q3=q[Math.floor(q.length*.75)]??0;
T.forEach(t=>{const a=t.cov!=null&&t.cov<95,b=t.c>=q3&&t.c>0;t.sig=a&&b?2:(a||b)?1:0;t.a=a;t.b=b});
const cols=[['uf','Estado'],['reg','Região'],['cov0','% vacinados no início'],['cov','% vacinados no fim'],['dc','Mudança (pontos)'],['c','Casos no período'],['c1',`Casos ${f.y1}`],['inc','Casos por 100 mil'],['sig','Atenção']];
T.sort((a,b)=>{const x=a[sortK]??-1e9,y=b[sortK]??-1e9;return(typeof x=='string'?x.localeCompare(y):x-y)*sortD});
const lab=t=>t.sig==2?'<span class="tag w">poucos vacinados e muitos casos: olhar com atenção</span>':t.sig?`<span class="tag">${t.a?'abaixo da meta de vacinação':'muitos casos'}</span>`:'';
$('#tb').innerHTML=`<table><tr>${cols.map(c=>`<th onclick="srt('${c[0]}')">${c[1]}${sortK==c[0]?(sortD>0?' ▲':' ▼'):''}</th>`).join('')}</tr>`+T.filter(t=>(t.uf+' '+t.reg).toLowerCase().includes($('#q').value.toLowerCase())).map(t=>`<tr><td><a href="#" onclick="pick('uf','${t.uf}');return false" style="color:var(--acc)">${t.uf}</a></td><td>${t.reg}</td><td>${N(t.cov0,1)}${t.cov0!=null?'%':''}</td><td>${N(t.cov,1)}${t.cov!=null?'%':''}</td><td>${N(t.dc,1)}</td><td>${N(t.c)}</td><td>${N(t.c1)}</td><td>${N(t.inc,2)}</td><td>${lab(t)}</td></tr>`).join('')+'</table>';extra(T,vSer,cSer)}
function kmeans(T){const P=T.filter(t=>t.cov!=null&&t.inc!=null);
if(P.length<6){$('#km').innerHTML='<p class="note">São necessárias pelo menos 6 UFs com dados na seleção atual.</p>';$('#kmn').textContent='';return}
const raw=P.map(t=>[t.cov,Math.log10(t.inc+1)]),mu=[0,1].map(j=>raw.reduce((a,r)=>a+r[j],0)/raw.length),sd=[0,1].map(j=>Math.sqrt(raw.reduce((a,r)=>a+(r[j]-mu[j])**2,0)/raw.length)||1),Z=raw.map(r=>r.map((v,j)=>(v-mu[j])/sd[j]));
const o=[...Z.keys()].sort((a,b)=>Z[a][0]-Z[b][0]),d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);let C=[0,Math.floor(o.length/2),o.length-1].map(i=>[...Z[o[i]]]),L=[];
for(let it=0;it<30;it++){L=Z.map(z=>C.map(c=>d(z,c)).reduce((m,v,i,a)=>v<a[m]?i:m,0));C=C.map((c,i)=>{const m=Z.filter((_,q)=>L[q]==i);return m.length?[0,1].map(j=>m.reduce((a,z)=>a+z[j],0)/m.length):c})}
const sil=Z.map((z,i)=>{const own=Z.filter((_,q)=>L[q]==L[i]&&q!=i);if(!own.length)return 0;const a=own.reduce((s,y)=>s+d(z,y),0)/own.length,b=Math.min(...[0,1,2].filter(g=>g!=L[i]).map(g=>{const m=Z.filter((_,q)=>L[q]==g);return m.length?m.reduce((s,y)=>s+d(z,y),0)/m.length:1e9}));return(b-a)/Math.max(a,b)}),S=sil.reduce((a,v)=>a+v,0)/sil.length;
const G=[0,1,2].map(g=>{const m=P.filter((_,q)=>L[q]==g);return{m,cov:m.reduce((a,t)=>a+t.cov,0)/(m.length||1),inc:m.reduce((a,t)=>a+t.inc,0)/(m.length||1)}}).filter(g=>g.m.length).sort((a,b)=>a.cov-b.cov);
$('#km').innerHTML='<table><tr><th>Grupo</th><th>Estados</th><th>% vacinados (média)</th><th>Casos por 100 mil (média)</th><th>Nº de estados</th></tr>'+G.map((g,i)=>`<tr><td>${'ABC'[i]}</td><td style="white-space:normal">${g.m.map(t=>t.uf).join(', ')}</td><td>${N(g.cov,1)}%</td><td>${N(g.inc,1)}</td><td>${g.m.length}</td></tr>`).join('')+'</table>';
$('#kmn').textContent=`O computador junta estados parecidos em 3 grupos, olhando as crianças vacinadas e os casos. O grupo A é o que tem menos crianças vacinadas. A nota de separação (${N(S,2)}, de 0 a 1) diz se os grupos ficaram bem diferentes entre si: quanto mais perto de 1, melhor. Isso só descreve semelhanças e não prevê surtos nem prova causa.`}
function vacina(){const y=Math.min(f.y1,2025),V=DATA.vac[y];if(!V){$('#vb').innerHTML='<p class="note">Disponível apenas para 2023–2025. Ajuste o ano final.</p>';$('#vn').textContent='';return}
const v=$('#vsel').value,mm=V[v];if(!mm){$('#vb').innerHTML='<p class="note">Esta vacina não consta nos dados de '+y+'.</p>';$('#vn').textContent='';return}
bars('#vb',Object.entries(mm).filter(([u])=>u!='BR'&&(!f.reg||RG[u]==f.reg)).map(([u,c])=>({k:u,v:c,sel:f.uf==u,click:'uf'})).sort((a,b)=>a.v-b.v),{max:110,d:1,u:'%'});
$('#vn').textContent=v+' · '+y+' · Brasil: '+N(mm.BR,1)+'%. Estados ordenados do menos para o mais vacinado. A meta costuma ser 95%. O foco desta página é o sarampo (vacina tríplice viral); as outras vacinas servem para comparar.'}
function idade(){const A=DATA.age,y0=Math.max(f.y0,2020),y1=Math.min(f.y1,2026);
if(y0>y1){$('#at').innerHTML='<p class="note">Os casos por faixa etária existem para 2020–2026. Ajuste o período.</p>';$('#ab').innerHTML=$('#al').innerHTML='';$('#an').textContent='';return}
const Y=[];for(let y=y0;y<=y1;y++)Y.push(y);const sm=(fx,ys)=>ys.reduce((a,y)=>a+(A.cases[fx][y]||0),0);
const tot=A.faixas.reduce((a,fx)=>a+sm(fx,Y),0),pm=y1+'',inc=fx=>{const g=[fx],c=g.reduce((a,x)=>a+sm(x,Y),0),p=g.reduce((a,x)=>a+A.pop[x][pm],0);return c/p*1e5};
$('#at').innerHTML='<table><tr><th>Idade</th><th>Casos</th><th>% do total</th><th>Casos por 100 mil da idade</th></tr>'+A.faixas.map(fx=>`<tr><td>${fx}</td><td>${N(sm(fx,Y))}</td><td>${N(tot?sm(fx,Y)/tot*100:NaN,1)}%</td><td>${N(inc(fx),2)}</td></tr>`).join('')+`<tr><td><b>Total</b></td><td><b>${N(tot)}</b></td><td>100%</td><td></td></tr></table>`;
bars('#ab',A.faixas.map(fx=>({k:fx,v:sm(fx,Y)})),{d:0});
const v=$('#asel').value||'Todas as idades';$('#al').innerHTML='';line('#al',Y.map(y=>({x:y,y:v=='Todas as idades'?A.faixas.reduce((a,fx)=>a+(A.cases[fx][y]||0),0):(A.cases[v][y]||0)})),{col:'var(--hot)',zero:1});
$('#an').textContent=`Casos de sarampo registrados no sistema de vigilância (SINAN), por idade, para o Brasil todo, de 2020 a 2026. Os filtros de região, estado e dose não valem para esta parte. Os totais diferem um pouco da outra contagem de casos, porque a fonte e o critério são outros. "Casos por 100 mil da idade" compara idades com quantidades de pessoas diferentes. Não inclui 2018 e 2019.`}
const UC={RO:11,AC:12,AM:13,RR:14,PA:15,AP:16,TO:17,MA:21,PI:22,CE:23,RN:24,PB:25,PE:26,AL:27,SE:28,BA:29,MG:31,ES:32,RJ:33,SP:35,PR:41,SC:42,SC_:42,RS:43,MS:50,MT:51,GO:52,DF:53};
function mmap(A){const G=DATA.mgeo,ufs=UFS.filter(u=>(!f.reg||RG[u]==f.reg)&&(!f.uf||u==f.uf)),cs=ufs.map(u=>String(UC[u])),b=cs.map(c=>G.bb[c]),x0=Math.min(...b.map(v=>v[0]))-4,y0=Math.min(...b.map(v=>v[1]))-4,x1=Math.max(...b.map(v=>v[2]))+4,y1=Math.max(...b.map(v=>v[3]))+4,w=x1-x0,h=y1-y0;
const M={};A.forEach(r=>M[r.code]=r);let s=`<svg viewBox="${x0} ${y0} ${w} ${h}" style="max-height:420px" role="img" aria-label="Mapa das cidades coloridas pela porcentagem de crianças vacinadas">`;
for(const [code,d] of Object.entries(G.p)){if(!cs.includes(code.slice(0,2)))continue;const r=M[code],c=r?r.c:null;
const fill=c==null?'var(--line)':c<80?'color-mix(in srgb,var(--hot) 85%,var(--card))':c<95?'color-mix(in srgb,var(--hot) 40%,var(--card))':'var(--card)';
const uf=Object.keys(UC).find(k=>UC[k]==+code.slice(0,2));s+=`<path d="${d}" fill="${fill}" stroke="var(--mut)" stroke-width="${(w/3000).toFixed(2)}" onclick="pick('uf','${uf}')" style="cursor:pointer"><title>${r?r.n+' ('+r.u+'): '+N(c,1)+'% vacinados · crianças a vacinar: '+(r.d==null?'não informado':N(r.d)):'Sem dado ou fora do filtro de tamanho'}</title></path>`}
$('#mmap').innerHTML=s+'</svg><div class="note">Laranja forte: menos de 80% vacinados. Laranja claro: de 80% a 94,9%. Sem cor: 95% ou mais. Cinza: sem informação ou fora do filtro de tamanho. Clique para escolher o estado. Mapa simplificado (IBGE).</div>'}
function mesmat(){const ys=[2023,2024,2025,2026].filter(y=>y>=f.y0&&y<=f.y1);
if(!ys.length){$('#mesm').innerHTML='<p class="note">Cobertura mensal disponível de 2023 a julho de 2026. Ajuste o período.</p>';$('#mesn').textContent='';return}
const rows=DATA.mes.filter(r=>ys.includes(r[1])),cols=[...new Set(rows.map(r=>r[1]*100+r[2]))].sort(),M={};rows.forEach(r=>M[r[0]+'|'+(r[1]*100+r[2])]=r[3]);
const ufs=selUf().sort(),bg=v=>v==null?'':v<80?'background:color-mix(in srgb,var(--hot) 60%,var(--card));color:#fff':v<95?'background:color-mix(in srgb,var(--hot) 25%,var(--card))':'';
$('#mesm').innerHTML='<table class="hm" style="font-size:10.5px"><tr><th style="position:sticky;left:0;background:var(--card)">UF</th>'+cols.map(c=>`<th style="min-width:34px;padding:3px">${String(c%100).padStart(2,'0')}/${String(Math.floor(c/100)).slice(2)}</th>`).join('')+'</tr>'+ufs.map(u=>`<tr><td style="position:sticky;left:0;background:var(--card);padding:3px"><b>${u}</b></td>`+cols.map(c=>{const v=M[u+'|'+c];return`<td style="padding:3px;${bg(v)}" title="${u} ${String(c%100).padStart(2,'0')}/${Math.floor(c/100)}: ${N(v,1)}%">${v==null?'':N(v,0)}</td>`}).join('')+'</tr>').join('')+'</table>';
$('#mesn').textContent='Cada número é a % de crianças vacinadas naquele mês (1ª dose). Os meses oscilam bastante e os mais recentes ainda podem ser corrigidos. 2026 vai até cerca de julho. Laranja forte: menos de 80%. Laranja claro: de 80% a 94,9%.'}
function conf(){const A=DATA.age,rows=[];let mx=0;for(let y=2020;y<=2026;y++){const c=Object.values(DATA.cases).reduce((a,v)=>a+(v[y]||0),0),sn=A.faixas.reduce((a,fx)=>a+(A.cases[fx][y]||0),0),d=sn-c,p=c?d/c*100:NaN;if(c)mx=Math.max(mx,Math.abs(p));rows.push(`<tr><td>${y}</td><td>${N(c)}</td><td>${N(sn)}</td><td>${d>0?'+':''}${N(d)}</td><td>${isNaN(p)?'–':(d>0?'+':'')+N(p,1)+'%'}</td></tr>`)}
$('#cf').innerHTML='<table><tr><th>Ano</th><th>Casos confirmados (tabela por estado)</th><th>Casos no SINAN (tabela por idade)</th><th>Diferença</th><th>Diferença %</th></tr>'+rows.join('')+'</table>';
$('#cfn').textContent='Cada tabela vem de uma fonte e usa um critério diferente (data do caso x data de notificação), por isso os totais são parecidos, mas não iguais. Isso não é erro de conta. Quando há poucos casos, uma diferença de 3 ou 4 já muda muito a porcentagem. Para casos por estado, use a tabela por estado; para casos por idade, a do SINAN.'}
function csvBox(el,head,rows,name){const q=v=>{if(typeof v=='number')v=String(+v.toFixed(2)).replace('.',',');v=v==null?'':String(v);return/[";\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v},txt=[head,...rows].map(r=>r.map(q).join(';')).join('\n');
$(el).innerHTML=`<a class="np" download="${name}.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent('\ufeff'+txt)}" style="color:var(--acc)">Baixar CSV</a> · <details class="csv" style="display:inline"><summary style="display:inline">ou copiar os dados para colar no Excel</summary><textarea readonly onclick="this.select()" aria-label="Dados em CSV">${txt.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea></details>`}
let sortKA='y',sortDA=1;function srtA(k){sortDA=sortKA==k?-sortDA:1;sortKA=k;tabAno()}
function tabAno(){const ys=[];for(let y=f.y0;y<=f.y1;y++)ys.push(y);const q=($('#qa').value||'').toLowerCase();let R=[];
selUf().forEach(u=>ys.forEach(y=>{const c=cs(u,y),p=pp(u,y),v=cv(u,y);R.push({u,g:RG[u],y,v,c,p,i:p?c/p*1e5:null})}));
R=R.filter(r=>(r.u+' '+r.g+' '+r.y).toLowerCase().includes(q)).sort((a,b)=>{const x=a[sortKA]??-1e9,z=b[sortKA]??-1e9;return(typeof x=='string'?x.localeCompare(z):x-z)*sortDA||a.y-b.y});
const H=[['u','Estado'],['g','Região'],['y','Ano'],['v','% vacinados ('+(f.dose=='D2'?'2ª':'1ª')+' dose)'],['c','Casos'],['p','População'],['i','Casos por 100 mil']];
$('#tba').innerHTML='<table><tr>'+H.map(h=>`<th onclick="srtA('${h[0]}')" style="cursor:pointer">${h[1]}${sortKA==h[0]?(sortDA>0?' ▲':' ▼'):''}</th>`).join('')+'</tr>'+R.slice(0,600).map(r=>`<tr><td>${r.u}</td><td>${r.g}</td><td>${r.y}</td><td>${r.v==null?'–':N(r.v,1)+'%'}</td><td>${N(r.c)}</td><td>${r.p?N(r.p):'–'}</td><td>${r.i==null?'–':N(r.i,2)}</td></tr>`).join('')+'</table>';
csvBox('#csv3',H.map(h=>h[1]),R.map(r=>[r.u,r.g,r.y,r.v,r.c,r.p,r.i]),'estado-por-ano')}
function scat(T){const P=T.filter(t=>t.cov!=null&&t.inc!=null);if(P.length<2){$('#sc').innerHTML='<p class="note">Dados insuficientes na seleção atual.</p>';return}
const W=560,H=300,L=46,Rr=14,Tp=12,B=34,xs=P.map(t=>t.cov),x0=Math.min(60,...xs)-2,x1=Math.max(100,...xs)+2,L1=v=>Math.log10(v+1),ym=Math.max(...P.map(t=>L1(t.inc)),.5)*1.1;
const X=v=>L+(v-x0)/(x1-x0)*(W-L-Rr),Y=v=>Tp+(1-L1(v)/ym)*(H-Tp-B);let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de pontos: crianças vacinadas e casos por 100 mil habitantes, estado por estado">`;
[0,1,10,100,1000].filter(v=>L1(v)<=ym).forEach(v=>s+=`<line x1="${L}" x2="${W-Rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L-5}" y="${Y(v)+4}" text-anchor="end">${v}</text>`);
s+=`<line x1="${X(95)}" x2="${X(95)}" y1="${Tp}" y2="${H-B}" stroke="var(--ok)" stroke-dasharray="5 4"/><text x="${X(95)+4}" y="${Tp+10}" style="fill:var(--ok)">95%</text>`;
for(let v=Math.ceil(x0/10)*10;v<=x1;v+=10)s+=`<text x="${X(v)}" y="${H-18}" text-anchor="middle">${v}</text>`;
s+=`<text x="${(L+W-Rr)/2}" y="${H-3}" text-anchor="middle">Crianças vacinadas (%): mais à direita, mais vacinados</text><text x="12" y="${H/2}" transform="rotate(-90 12 ${H/2})" text-anchor="middle">Casos por 100 mil habitantes (↑ mais casos)</text>`;
P.forEach(t=>s+=`<g style="cursor:pointer" onclick="pick('uf','${t.uf}')"><circle cx="${X(t.cov)}" cy="${Y(t.inc)}" r="${f.uf==t.uf?7:5}" fill="${f.uf==t.uf?'var(--hot)':'var(--acc)'}" opacity=".75"><title>${t.uf}: ${N(t.cov,1)}% vacinados · ${N(t.inc,1)} casos por 100 mil · ${N(t.c)} casos</title></circle><text x="${X(t.cov)+7}" y="${Y(t.inc)+3}" style="font-size:10px">${t.uf}</text></g>`);
$('#sc').innerHTML=s+'</svg>'}
function munic(){const y=Math.min(f.y1,2025),M=DATA.mun[y];
if(!M){$('#mkp').innerHTML='';$('#mbar').innerHTML='<p class="note">Dados municipais disponíveis apenas para 2023–2025. Ajuste o ano final.</p>';$('#mt').innerHTML='';$('#csv2').innerHTML='';$('#mmap').innerHTML='';$('#mnote').textContent='';return}
const di=f.dose=='D2'?2:0,mn=+$('#mden').value,q=$('#mq').value.toLowerCase();
const A=M.filter(r=>(!f.reg||RG[r[0]]==f.reg)&&(!f.uf||r[0]==f.uf)&&r[2+di]!=null&&(r[3+di]==null||r[3+di]>=Math.max(mn,1))).map(r=>({u:r[0],n:r[1],c:r[2+di],d:r[3+di],code:r[6]}));
if(!A.length){$('#mkp').innerHTML='';$('#mbar').innerHTML='<p class="note">Sem dados municipais para esta dose neste ano. A cobertura por município existe para 2018–2025.</p>';$('#mt').innerHTML='';$('#csv2').innerHTML='';$('#mmap').innerHTML='';$('#mnote').textContent='';return}
const n=A.length,b95=A.filter(r=>r.c<95).length,b80=A.filter(r=>r.c<80).length,md=n?A.map(r=>r.c).sort((a,b)=>a-b)[Math.floor(n/2)]:NaN;
const K=(l,v,d)=>`<div class="card kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
$('#mkp').innerHTML=K(`Cidades analisadas (${y})`,N(n),'no filtro atual')+K('Abaixo da meta (95%)',N(b95),N(n?b95/n*100:NaN,0)+'% das cidades')+K('Abaixo de 80% (mais grave)',N(b80),N(n?b80/n*100:NaN,0)+'% das cidades')+K('Valor típico das cidades',N(md,1)+'%',(f.dose=='D2'?'2ª dose':'1ª dose')+' · metade das cidades está acima disso');
const G={};A.forEach(r=>(G[r.u]??=[]).push(r));
bars('#mbar',Object.entries(G).map(([u,x])=>({k:u,v:x.filter(r=>r.c<95).length/x.length*100,sel:f.uf==u,click:'uf'})).sort((a,b)=>b.v-a.v).slice(0,12),{max:100,d:0,u:'%'});
const L=A.filter(r=>(r.n+' '+r.u).toLowerCase().includes(q)).sort((a,b)=>a.c-b.c);
$('#mt').innerHTML='<table><tr><th>Cidade</th><th>Estado</th><th>% vacinados</th><th>Crianças a vacinar</th></tr>'+L.slice(0,150).map(r=>`<tr><td>${r.n}</td><td>${r.u}</td><td>${N(r.c,1)}%</td><td>${N(r.d)}</td></tr>`).join('')+'</table>';
csvBox('#csv2',['Cidade','Estado','% vacinados','Crianças a vacinar'],L.slice(0,6000).map(r=>[r.n,r.u,r.c,r.d]),'cidades-'+y);mmap(A);$('#mnote').textContent=`Mostrando ${N(Math.min(150,L.length))} de ${N(L.length)} cidades (as com menos vacinados primeiro). Ano ${y}, ${f.dose=='D2'?'2ª':'1ª'} dose.${y<2023?' Antes de 2023 não há o número de crianças a vacinar, e por isso o filtro de tamanho não funciona.':''} Cidades com poucas crianças variam muito de um ano para outro. Valores acima de 100% acontecem quando foram vacinadas mais crianças do que a estimativa previa. Fonte: Painel de Cobertura Vacinal por residência (consulta de 01/10/2026) e mapa do IBGE.`}
function extra(T,vS,cS){const I=[],tc=T.reduce((a,t)=>a+t.c,0),fl=T.filter(t=>t.sig==2);
$('#prio').innerHTML=fl.length?fl.map(t=>`<span class="tag w" style="margin:2px;display:inline-block">${t.uf}: ${N(t.cov,1)}% vacinados · ${N(t.c)} casos</span>`).join(''):'<p class="note">Nenhuma UF atende aos dois critérios ao mesmo tempo na seleção atual.</p>';
if(vS.length>1)I.push(`Entre ${vS[0].x} e ${vS.at(-1).x}, a vacinação variou ${sg(vS.at(-1).y-vS[0].y,' pontos')} na seleção atual.`);
const cv_=T.filter(t=>t.cov!=null).sort((a,b)=>b.cov-a.cov);if(cv_.length>1)I.push(`${cv_[0].uf} teve mais crianças vacinadas (${N(cv_[0].cov,1)}%) e ${cv_.at(-1).uf}, menos (${N(cv_.at(-1).cov,1)}%) no último ano com dado.`);
const mc=[...T].sort((a,b)=>b.c-a.c)[0];if(mc&&mc.c>0)I.push(`${mc.uf} concentrou ${N(mc.c)} dos ${N(tc)} casos do período (${N(mc.c/tc*100,0)}%).`);
const pk=cS.reduce((a,p)=>p.y>a.y?p:a,cS[0]);if(pk&&pk.y>0)I.push(`O ano com mais casos foi ${pk.x} (${N(pk.y)}).`);
$('#ins').innerHTML=I.length?I.map(x=>`<li>${x}</li>`).join(''):'<li>Sem dados para a seleção atual.</li>';const qv=($('#q').value||'').toLowerCase();csvBox('#csv1',['Estado','Região','% vacinados no início','% vacinados no fim','Mudança (pontos)','Casos no período','Casos no último ano','Casos por 100 mil','Atenção'],T.filter(t=>(t.uf+' '+t.reg).toLowerCase().includes(qv)).map(t=>[t.uf,t.reg,t.cov0,t.cov,t.dc,t.c,t.c1,t.inc,t.sig==2?'poucos vacinados e muitos casos':t.sig?(t.a?'abaixo da meta de vacinação':'muitos casos'):'']),'tabela-por-estado');
munic();scat(T);kmeans(T);vacina();idade();mesmat();tabAno()}
const srt=k=>{sortD=sortK==k?-sortD:-1;sortK=k;draw()};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches&&e.target.matches('path[role=button],.br[role=button]'))e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))});opt('#vsel',Object.keys(DATA.vac['2025']).sort());$('#vsel').value='Tríplice Viral - 1° Dose';opt('#asel',['Todas as idades',...DATA.age.faixas]);conf();reset();
