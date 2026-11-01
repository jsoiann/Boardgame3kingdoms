/* 天下三分 規則引擎 v0.1 — 純函數、可重現（隨機只用 seed）。數值全部集中喺呢度，方便調。 */
(function(G){
const U=['s','a','c'],UN={s:'步',a:'弓',c:'騎'},NN={wei:'魏',shu:'蜀',wu:'吳'},PREY={s:'a',a:'c',c:'s'},BC=[3,4,5,6];
// 武將：名 + 文/武 + 招攬費 + 強度 + 兵種(s步 a弓 c騎) + *跨國
const GD={
wei:['荀彧文31,郭嘉文52,典韋武31s,夏侯惇武31sc,關羽武52cs*','賈詡文52,徐庶文31*,張遼武73c,徐晃武52s,龐德武31c','司馬懿文73,陳群文52,鄧艾武73sa,張郃武52c,黃權武31s*'],
shu:['關羽武52cs*,張飛武52s,趙雲武31c,糜竺文31,徐庶文31*','諸葛亮文73,龐統文52*,馬超武52c,黃忠武31a,法正文31','姜維武73sc,魏延武52cs,蔣琬文52,費禕文52,黃權武31s*'],
wu:['程普武31s,黃蓋武31a,張昭文31,太史慈武52ca,魯肅文52','周瑜武73a,甘寧武52as,呂蒙武52sa,龐統文31*,諸葛瑾文31','陸遜武73sa,陸抗武73as,顧雍文52,朱然武52s,丁奉武31a']};
// 歷史事件（階段開頭自動觸發）m民心 k軍威 inc每回合資源 free免費升級(b軍營/m市場/g糧倉) u永久兵力 tmp本階段兵力 top最高兵種 disc下階段首位文官折扣
const EV={
wei:[{n:'官渡之戰',t:{k:2,m:1}},{n:'赤壁之戰',t:{k:-2,free:'m'}},{n:'屯田大成',t:{m:2,inc:1}}],
shu:[{n:'三顧茅廬',t:{m:2,disc:2}},{n:'奪益州·漢中',t:{m:2,k:1}},{n:'夷陵之戰',t:{k:-3,top:-1,m:2}}],
wu:[{n:'孫策定江東',t:{free:'g'}},{n:'赤壁之戰',t:{k:3,tmp:{a:1}}},{n:'夷陵（陸遜）',t:{k:2,u:{s:1}}}]};
const parse=s=>s.split(',').map(x=>{const m=x.match(/^(.+?)(文|武)(\d)(\d)([sac]*)(\*?)$/);return{name:m[1],ty:m[2],cost:+m[3],pw:+m[4],us:m[5].split(''),x:!!m[6]}});
const rnd=S=>{S.r=(S.r+0x6D2B79F5)|0;let t=S.r;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
const newP=()=>({n:null,res:0,m:0,u:{s:2,a:2,c:2},b:{b:0,m:0,g:0},gen:[],pool:[],kept:[],inc:0,disc:null,tmp:{}});
const mk=seed=>({r:seed|0,ph:0,rd:0,st:'nation',nat:[null,null],P:[newP(),newP()],pos:0,turn:0,pass:[0,0],mk:null,d:null,set:[null,null],win:null,log:[]});
const chk=S=>{if(S.win!=null)S.st='end'};
const addM=(S,i,n)=>{const P=S.P[i];if(n>0&&P.n=='shu')n++;P.m=Math.max(0,P.m+n);if(P.m>=15&&S.win==null)S.win=i};
const push=(S,i,k)=>{S.pos=Math.max(-10,Math.min(10,S.pos+(i==0?k:-k)));if(S.pos>=10&&S.win==null)S.win=0;if(S.pos<=-10&&S.win==null)S.win=1};
const lv=(S,i,b)=>{S.P[i].b[b]++;if(b=='g'){addM(S,i,1);push(S,i,1)}};
const gc=(S,p,g)=>{const P=S.P[p];let c=g.cost+(P.n=='wei'?1:0);if(P.disc&&P.disc[0]==S.ph&&g.ty=='文')c=Math.max(1,c-P.disc[1]);return c};
const cc=(P,c)=>c.t=='u'?(P.u[c.x]<6?3:-1):(P.b[c.x]<4?BC[P.b[c.x]]:-1);
const gain=(a,b)=>Math.max(0,a.s-b.a)+Math.max(0,a.a-b.c)+Math.max(0,a.c-b.s);

function sp(S){S.ph++;S.rd=0;
 for(const i of[0,1]){const P=S.P[i],e=EV[P.n][S.ph-1],t=e.t;S.log.push(NN[P.n]+'事件：'+e.n);
  if(t.m)addM(S,i,t.m);if(t.k)push(S,i,t.k);if(t.inc)P.inc+=t.inc;if(t.disc)P.disc=[S.ph+1,t.disc];if(t.free)lv(S,i,t.free);
  if(t.u)for(const x in t.u)P.u[x]+=t.u[x];
  if(t.tmp)for(const x in t.tmp)P.tmp[x]=(P.tmp[x]||0)+t.tmp[x];
  if(t.top){const x=U.reduce((a,b)=>P.u[b]>P.u[a]?b:a);P.tmp[x]=(P.tmp[x]||0)+t.top}
  P.pool=parse(GD[P.n][S.ph-1]);P.kept=[]}
 const dk=[];for(const x of U)for(let j=0;j<2;j++)dk.push({t:'u',x});for(const x of['b','m','g'])for(let j=0;j<2;j++)dk.push({t:'b',x});
 for(let j=dk.length-1;j>0;j--){const k=Math.floor(rnd(S)*(j+1));[dk[j],dk[k]]=[dk[k],dk[j]]}
 S.mk={deck:dk,up:dk.splice(0,4)};S.d={step:0,done:[0,0]};S.st='draft';chk(S)}
function sr(S){S.rd++;for(const P of S.P)P.res+=10+P.b.m+P.inc+(P.n=='wei'&&S.ph>=2?1:0);S.turn=(S.rd+S.ph)%2;S.pass=[0,0];S.st='round'}
function er(S){for(const P of S.P)P.res=Math.min(P.res,3);
 if(S.rd<3)return sr(S);S.st='settle';S.set=[null,null];for(const i of[0,1])if(!S.P[i].b.b)S.set[i]='s';if(S.set[0]&&S.set[1])rs(S)}
function rs(S){
 const W=[0,1].map(i=>{const P=S.P[i],w={...P.u};for(const x of U)w[x]+=P.tmp[x]||0;if(P.b.b)w[S.set[i]]+=P.b.b;return w});
 for(const i of[0,1])for(const g of S.P[i].gen)if(g.ty=='武'){let best=g.us[0],bv=-99;
  for(const x of g.us){W[i][x]+=g.pw;const v=gain(W[i],W[1-i])-gain(W[1-i],W[i]);W[i][x]-=g.pw;if(v>bv){bv=v;best=x}}W[i][best]+=g.pw}
 let n=gain(W[0],W[1])-gain(W[1],W[0]);
 if(n>0&&S.P[1].n=='wu')n=Math.max(0,n-2);if(n<0&&S.P[0].n=='wu')n=Math.min(0,n+2); // 吳：長江天險
 push(S,n>=0?0:1,Math.abs(n));
 S.log.push('階段'+S.ph+'結算 '+W.map(w=>U.map(x=>UN[x]+w[x]).join('')).join(' vs ')+' → 軍威'+(n>0?'+':'')+n+'（正數=玩家1領先）');
 for(let i=0;i<2;i++){for(const g of S.P[i].gen)if(g.ty=='文')addM(S,i,1);S.P[i].tmp={};S.P[i].kept=[]}
 if(S.win==null){if(S.ph<3)sp(S);else{const s=S.pos+S.P[0].m-S.P[1].m;S.win=s>0?0:s<0?1:2}}chk(S)}

// 套用一個動作；非法動作回傳 0，唔改變狀態
function step(S,a){const p=a.p,P=S.P[p];if(S.st=='end')return 0;
 if(a.t=='nat'){if(S.st!='nation'||S.nat[p]||S.nat[1-p]==a.n||!NN[a.n])return 0;S.nat[p]=a.n;P.n=a.n;if(S.nat[0]&&S.nat[1])sp(S);return 1}
 if(S.st=='draft'){const d=S.d;if(d.done[p])return 0;
  if(d.step%2==0){if(a.t!='pick'||!P.pool[a.i])return 0;P.kept.push(P.pool.splice(a.i,1)[0])}
  else{const O=S.P[1-p];if(a.t!='drop'||!O.pool[a.i])return 0;O.pool.splice(a.i,1)}
  d.done[p]=1;if(d.done[0]&&d.done[1]){d.done=[0,0];if(++d.step==4){for(const Q of S.P)Q.kept.push(Q.pool.pop());sr(S)}}return 1}
 if(S.st=='round'){if(S.turn!=p)return 0;
  if(a.t=='pass')S.pass[p]=1;
  else if(a.t=='rec'){const g=P.kept[a.i];if(!g)return 0;const c=gc(S,p,g);if(P.res<c)return 0;P.res-=c;
   if(P.disc&&P.disc[0]==S.ph&&g.ty=='文')P.disc=null;P.kept.splice(a.i,1);
   P.gen.push({...g,pw:g.pw+(P.n=='shu'&&g.ty=='武'?1:0)});if(g.ty=='文')addM(S,p,g.pw)}
  else if(a.t=='buy'){const c=S.mk.up[a.i];if(!c)return 0;const k=cc(P,c);if(k<0||P.res<k)return 0;P.res-=k;
   if(c.t=='u')P.u[c.x]++;else lv(S,p,c.x);S.mk.up.splice(a.i,1);if(S.mk.deck.length)S.mk.up.push(S.mk.deck.shift())}
  else return 0;
  if(!S.pass[1-p])S.turn=1-p;if(S.pass[0]&&S.pass[1])er(S);chk(S);return 1}
 if(S.st=='settle'){if(a.t!='bar'||S.set[p]||!PREY[a.x])return 0;S.set[p]=a.x;if(S.set[0]&&S.set[1])rs(S);return 1}
 return 0}

// 電腦對手（簡單啟發式）
const best=(arr,f)=>arr.reduce((b,x,i)=>f(x)>f(arr[b])?i:b,0);
function ai(S,p){const P=S.P[p],O=S.P[1-p];
 if(S.st=='nation'){if(S.nat[p]||!S.nat[1-p])return null;const o=Object.keys(NN).filter(n=>n!=S.nat[1-p]);return{p,t:'nat',n:o[Math.floor(Math.random()*o.length)]}}
 if(S.st=='draft'){if(S.d.done[p])return null;const sc=g=>g.pw*2-g.cost*.3+(g.ty=='武'?.5:0);
  return S.d.step%2==0?{p,t:'pick',i:best(P.pool,sc)}:{p,t:'drop',i:best(O.pool,sc)}}
 if(S.st=='round'){if(S.turn!=p)return null;
  const r=P.kept.map((g,i)=>[i,gc(S,p,g)]).filter(x=>P.res>=x[1]).sort((a,b)=>P.kept[b[0]].pw-P.kept[a[0]].pw)[0];if(r)return{p,t:'rec',i:r[0]};
  const pr=c=>c.t=='b'?(c.x=='m'?(S.ph<3?6:1):c.x=='g'?5:2.5):3.5-(P.u[c.x]-2)*.5;
  const o=S.mk.up.map((c,i)=>[i,c]).filter(([i,c])=>{const k=cc(P,c);return k>=0&&P.res>=k});
  if(!o.length)return{p,t:'pass'};o.sort((a,b)=>pr(b[1])-pr(a[1]));return{p,t:'buy',i:o[0][0]}}
 if(S.st=='settle'&&!S.set[p]){const x=U.reduce((a,b)=>(P.u[b]-O.u[PREY[b]])>(P.u[a]-O.u[PREY[a]])?b:a);return{p,t:'bar',x}}
 return null}
const API={mk,step,ai,gc,cc,U,UN,NN,PREY,BC};G.TK=API;if(typeof module!='undefined')module.exports=API;
})(typeof window!='undefined'?window:globalThis);
