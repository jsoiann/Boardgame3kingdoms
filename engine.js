/* 天下三分 規則引擎 v0.2 — 純函數、可重現。數值全部集中喺呢度。 */
(function(G){
const U=['s','a','c'],UN={s:'步',a:'弓',c:'騎'},NN={wei:'魏',shu:'蜀',wu:'吳'},PREY={s:'a',a:'c',c:'s'},BC=[3,4,5,6],KILL={S:'s',A:'a',C:'c'};
const AB={S:'殺敵步1',A:'殺敵弓1',C:'殺敵騎1',P:'軍威+1',R:'即時+2資源',B:'建築升級費-1',U:'兵種升級費-1',I:'每回合+1資源',G:'招攬費-1'};
// 名+文/武+費+強度+兵種(sac)+技能(大寫)+*跨國。武：≤5費 +1，7費 +2；5費1個一次性技能、7費2個。文：民心一次+1/+2＋持續技能
const GD={
wei:['荀彧文31B,郭嘉文52U,典韋武31s,夏侯惇武31sc,關羽武51csP*','賈詡文52G,徐庶文31U*,張遼武72cSP,徐晃武51sA,龐德武31c','司馬懿文72BI,陳群文52I,鄧艾武72saAC,張郃武51cS,黃權武31s*'],
shu:['關羽武51csP*,張飛武51sA,趙雲武31c,糜竺文31I,徐庶文31U*','諸葛亮文72BG,龐統文52U*,馬超武51cS,黃忠武31a,法正文31B','姜維武72scSP,魏延武51csP,蔣琬文52I,費禕文52G,黃權武31s*'],
wu:['程普武31s,黃蓋武31a,張昭文31B,太史慈武51caC,魯肅文52I','周瑜武72aCP,甘寧武51asC,呂蒙武51saR,龐統文31U*,諸葛瑾文31G','陸遜武72saAP,陸抗武72asCR,顧雍文52B,朱然武51sA,丁奉武31a']};
// 每階段3個事件(三國各一)，由指定玩家揀1個，必定執行
const EV={
wei:[{n:'官渡之戰',t:{k:2,m:1}},{n:'赤壁之戰',t:{k:-2,free:'m'}},{n:'屯田大成',t:{m:2,inc:1}}],
shu:[{n:'三顧茅廬',t:{m:2,disc:2}},{n:'奪益州·漢中',t:{m:2,k:1}},{n:'夷陵之戰',t:{k:-3,top:-1,m:2}}],
wu:[{n:'孫策定江東',t:{free:'g'}},{n:'赤壁之戰',t:{k:3,tmp:{a:1}}},{n:'夷陵（陸遜）',t:{k:2,u:{s:1}}}]};
const BN={b:'軍營',m:'市場',g:'糧倉'};
const fx=t=>[t.m&&'民心'+(t.m>0?'+':'')+t.m,t.k&&'軍威'+(t.k>0?'+':'')+t.k,t.inc&&'每回合+'+t.inc+'資源',t.free&&BN[t.free]+'免費升級',t.u&&'步兵+1',t.tmp&&'本階段弓兵+1',t.top&&'最強兵種'+t.top,t.disc&&'下階段首位文官-'+t.disc].filter(Boolean).join('、');
const parse=s=>s.split(',').map(x=>{const m=x.match(/^(.+?)(文|武)(\d)(\d)([sac]*)([A-Z]*)(\*?)$/);return{name:m[1],ty:m[2],cost:+m[3],pw:+m[4],us:m[5].split(''),ab:m[6],x:!!m[7]}});
const rnd=S=>{S.r=(S.r+0x6D2B79F5)|0;let t=S.r;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
const newP=()=>({n:null,res:0,u:{s:2,a:2,c:2},b:{b:0,m:0,g:0},gen:[],pool:[],kept:[],inc:0,disc:null,tmp:{}});
const mk=seed=>({r:seed|0,ph:0,rd:0,st:'nation',nat:[null,null],P:[newP(),newP()],pos:0,mpos:0,turn:0,pass:[0,0],mk:null,ev:null,d:null,set:[null,null],win:null,log:[]});
const chk=S=>{if(S.win!=null)S.st='end'};
const cnt=(P,c)=>P.gen.filter(g=>g.ab.includes(c)).length;
const cl=v=>Math.max(-10,Math.min(10,v));
const push=(S,i,k)=>{S.pos=cl(S.pos+(i==0?k:-k));if(S.pos>=10&&S.win==null)S.win=0;if(S.pos<=-10&&S.win==null)S.win=1};
const addM=(S,i,k)=>{S.mpos=cl(S.mpos+(i==0?k:-k));if(S.mpos>=10&&S.win==null)S.win=0;if(S.mpos<=-10&&S.win==null)S.win=1};
const lv=(S,i,b)=>{S.P[i].b[b]++;if(b=='g'){addM(S,i,1);push(S,i,1)}};
const gc=(S,p,g)=>{const P=S.P[p];let c=g.cost-(P.n=='shu'?1:0)-cnt(P,'G');if(P.disc&&P.disc[0]==S.ph&&g.ty=='文')c-=P.disc[1];return Math.max(1,c)};
const cc=(P,c)=>c.t=='u'?(P.u[c.x]<6?Math.max(1,3-cnt(P,'U')):-1):(P.b[c.x]<4?Math.max(1,BC[P.b[c.x]]-cnt(P,'B')):-1);
const gain=(a,b)=>Math.max(0,a.s-b.a)+Math.max(0,a.a-b.c)+Math.max(0,a.c-b.s);
function ap(S,i,t){const P=S.P[i];
 if(t.m)addM(S,i,t.m);if(t.k)push(S,i,t.k);if(t.inc)P.inc+=t.inc;if(t.disc)P.disc=[S.ph+1,t.disc];if(t.free)lv(S,i,t.free);
 if(t.u)for(const x in t.u)P.u[x]+=t.u[x];
 if(t.tmp)for(const x in t.tmp)P.tmp[x]=(P.tmp[x]||0)+t.tmp[x];
 if(t.top){const x=U.reduce((a,b)=>P.u[b]>P.u[a]?b:a);P.tmp[x]=(P.tmp[x]||0)+t.top}}
function sp(S){S.ph++;S.rd=0;
 if(S.ph==1){const j=S.P.findIndex(P=>P.n=='shu');if(j>=0)addM(S,j,1)} // 蜀：開局民心+1（一次）
 for(const P of S.P){P.pool=parse(GD[P.n][S.ph-1]);P.kept=[]}
 const dk=[];for(const x of U)for(let j=0;j<2;j++)dk.push({t:'u',x});for(const x of['b','m','g'])for(let j=0;j<2;j++)dk.push({t:'b',x});
 for(let j=dk.length-1;j>0;j--){const k=Math.floor(rnd(S)*(j+1));[dk[j],dk[k]]=[dk[k],dk[j]]}
 S.mk={deck:dk,up:dk.splice(0,4)};
 S.ev={o:['wei','shu','wu'].map(n=>({nat:n,...EV[n][S.ph-1]})),c:S.ph%2,pick:null};S.st='event';chk(S)}
function sr(S){S.rd++;for(const P of S.P)P.res+=10+P.b.m+P.inc+cnt(P,'I')+(P.n=='wei'&&S.ph>=2?1:0);S.turn=(S.rd+S.ph)%2;S.pass=[0,0];S.st='round'}
function er(S){for(const P of S.P)P.res=Math.min(P.res,3);
 if(S.rd<3)return sr(S);S.st='settle';S.set=[null,null];for(const i of[0,1])if(!S.P[i].b.b)S.set[i]='s';if(S.set[0]&&S.set[1])rs(S)}
function rs(S){const ex=[0,0];
 for(const i of[0,1])for(const g of S.P[i].gen)if(g.ty=='武'&&g.ab){for(const c of g.ab){if(KILL[c]){const O=S.P[1-i];O.u[KILL[c]]=Math.max(0,O.u[KILL[c]]-1)}else if(c=='P')ex[i]++}g.ab=''}
 const W=[0,1].map(i=>{const P=S.P[i],w={...P.u};for(const x of U)w[x]+=P.tmp[x]||0;if(P.b.b)w[S.set[i]]+=P.b.b;return w});
 for(const i of[0,1])for(const g of S.P[i].gen)if(g.ty=='武'){let best=g.us[0],bv=-99;
  for(const x of g.us){W[i][x]+=g.pw;const v=gain(W[i],W[1-i])-gain(W[1-i],W[i]);W[i][x]-=g.pw;if(v>bv){bv=v;best=x}}W[i][best]+=g.pw}
 let n=gain(W[0],W[1])-gain(W[1],W[0]);
 if(n>0&&S.P[1].n=='wu')n=Math.max(0,n-2);if(n<0&&S.P[0].n=='wu')n=Math.min(0,n+2);
 n+=ex[0]-ex[1];push(S,n>=0?0:1,Math.abs(n));
 S.log.push('階段'+S.ph+'結算 '+W.map(w=>U.map(x=>UN[x]+w[x]).join('')).join(' vs ')+' → 軍威'+(n>0?'+':'')+n);
 for(const P of S.P){P.tmp={};P.kept=[]}
 if(S.win==null){if(S.ph<3)sp(S);else{const s=S.pos+S.mpos;S.win=s>0?0:s<0?1:2}}chk(S)}
function step(S,a){const p=a.p,P=S.P[p];if(S.st=='end')return 0;
 if(a.t=='nat'){if(S.st!='nation'||S.nat[p]||S.nat[1-p]==a.n||!NN[a.n])return 0;S.nat[p]=a.n;P.n=a.n;if(S.nat[0]&&S.nat[1])sp(S);return 1}
 if(S.st=='event'){if(a.t!='ev'||p!=S.ev.c||!S.ev.o[a.i])return 0;const e=S.ev.o[a.i];
  let t=S.P.map((Q,i)=>Q.n==e.nat?i:-1).filter(i=>i>=0);if(!t.length)t=[p]; // 該國唔喺場→落喺揀嘅人身上
  S.log.push('事件：'+e.n+'（'+NN[e.nat]+'）');S.ev.pick=a.i;for(const i of t)ap(S,i,e.t);S.d={step:0,done:[0,0]};S.st='draft';chk(S);return 1}
 if(S.st=='draft'){const d=S.d;if(d.done[p])return 0;
  if(d.step%2==0){if(a.t!='pick'||!P.pool[a.i])return 0;P.kept.push(P.pool.splice(a.i,1)[0])}
  else{const O=S.P[1-p];if(a.t!='drop'||!O.pool[a.i])return 0;O.pool.splice(a.i,1)}
  d.done[p]=1;if(d.done[0]&&d.done[1]){d.done=[0,0];if(++d.step==4){for(const Q of S.P)Q.kept.push(Q.pool.pop());sr(S)}}return 1}
 if(S.st=='round'){if(S.turn!=p)return 0;
  if(a.t=='pass')S.pass[p]=1;
  else if(a.t=='rec'){const g=P.kept[a.i];if(!g)return 0;const c=gc(S,p,g);if(P.res<c)return 0;P.res-=c;
   if(P.disc&&P.disc[0]==S.ph&&g.ty=='文')P.disc=null;P.kept.splice(a.i,1);
   if(g.ab.includes('R')){P.res+=2;g.ab=g.ab.replace('R','')}
   P.gen.push(g);if(g.ty=='文')addM(S,p,Math.min(g.pw,2))}
  else if(a.t=='buy'){const c=S.mk.up[a.i];if(!c)return 0;const k=cc(P,c);if(k<0||P.res<k)return 0;P.res-=k;
   if(c.t=='u')P.u[c.x]++;else lv(S,p,c.x);S.mk.up.splice(a.i,1);if(S.mk.deck.length)S.mk.up.push(S.mk.deck.shift())}
  else return 0;
  if(!S.pass[1-p])S.turn=1-p;if(S.pass[0]&&S.pass[1])er(S);chk(S);return 1}
 if(S.st=='settle'){if(a.t!='bar'||S.set[p]||!PREY[a.x])return 0;S.set[p]=a.x;if(S.set[0]&&S.set[1])rs(S);return 1}
 return 0}
const best=(arr,f)=>arr.reduce((b,x,i)=>f(x)>f(arr[b])?i:b,0);
function ai(S,p){const P=S.P[p],O=S.P[1-p];
 if(S.st=='nation'){if(S.nat[p]||!S.nat[1-p])return null;const o=Object.keys(NN).filter(n=>n!=S.nat[1-p]);return{p,t:'nat',n:o[Math.floor(Math.random()*o.length)]}}
 if(S.st=='event'){if(S.ev.c!=p)return null;const v=t=>(t.k||0)+(t.m||0)+(t.inc||0)*3+(t.free?3:0)+(t.u?2:0)+(t.tmp?1:0)+(t.top||0)*2+(t.disc?1:0);
  return{p,t:'ev',i:best(S.ev.o,e=>e.nat==O.n?-v(e.t):v(e.t))}}
 if(S.st=='draft'){if(S.d.done[p])return null;const sc=g=>g.pw*2+g.ab.length-g.cost*.3+(g.ty=='武'?.5:0);
  return S.d.step%2==0?{p,t:'pick',i:best(P.pool,sc)}:{p,t:'drop',i:best(O.pool,sc)}}
 if(S.st=='round'){if(S.turn!=p)return null;
  const r=P.kept.map((g,i)=>[i,gc(S,p,g)]).filter(x=>P.res>=x[1]).sort((a,b)=>P.kept[b[0]].pw-P.kept[a[0]].pw)[0];if(r)return{p,t:'rec',i:r[0]};
  const pr=c=>c.t=='b'?(c.x=='m'?(S.ph<3?6:1):c.x=='g'?5:2.5):3.5-(P.u[c.x]-2)*.5;
  const o=S.mk.up.map((c,i)=>[i,c]).filter(([i,c])=>{const k=cc(P,c);return k>=0&&P.res>=k});
  if(!o.length)return{p,t:'pass'};o.sort((a,b)=>pr(b[1])-pr(a[1]));return{p,t:'buy',i:o[0][0]}}
 if(S.st=='settle'&&!S.set[p]){const x=U.reduce((a,b)=>(P.u[b]-O.u[PREY[b]])>(P.u[a]-O.u[PREY[a]])?b:a);return{p,t:'bar',x}}
 return null}
const API={mk,step,ai,gc,cc,fx,U,UN,NN,PREY,AB,BN};G.TK=API;if(typeof module!='undefined')module.exports=API;
})(typeof window!='undefined'?window:globalThis);
