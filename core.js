/* CORE START */
const Core = (function(){
"use strict";
let R = Math.random;
const setRng = f => { R = f; };
const rnd = (a,b) => a + R()*(b-a);
const gauss = () => { let u=0,v=0; while(u===0)u=R(); while(v===0)v=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const MKT_SIGMA = 1.1;
const drawMkt = () => Math.exp(gauss()*MKT_SIGMA - MKT_SIGMA*MKT_SIGMA/2);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const DISC = 0.10;                       // valuation discount rate
const DF = t => Math.pow(1+DISC, -t);

const TILES = [
 {k:"lab",n:"Lab",c:"--rd"},{k:"pre",n:"Preclinical",c:"--rd"},
 {k:"p1",n:"Phase I",c:"--clin"},{k:"p2",n:"Phase II",c:"--clin"},{k:"p3",n:"Phase III",c:"--clin"},
 {k:"reg",n:"Filing",c:"--reg"},{k:"launch",n:"Launch",c:"--reg"},
 {k:"y1",n:"Year 1",c:"--mkt"},{k:"y2",n:"Year 2",c:"--mkt"},{k:"y3",n:"Year 3",c:"--mkt"},{k:"y4",n:"Year 4",c:"--mkt"},{k:"y5",n:"Year 5",c:"--mkt"},
 {k:"mature",n:"Years 6–13",c:"--mkt"},{k:"loe",n:"Generics",c:"--loe"}
];
const IDX = {}; TILES.forEach((t,i)=>IDX[t.k]=i);
const DEV = ["pre","p1","p2","p3","reg"];

/* ---- clinical benchmarks: BIO/Informa/QLS 2011–2020 ---- */
const ALL = {p1:52.0,p2:28.9,p3:57.8,reg:90.6};
const PRE_BASE = 69;                     // preclinical → Phase I (Paul et al. 2010)
const AREAS = {
 onc: {n:"Oncology", ph:{p1:48.8,p2:24.6,p3:47.7,reg:92.0}, dur:{pre:1.5,p1:2.7,p2:3.7,p3:3.1,reg:0.8},
       price:180, gtnH:.08, pool:3.1, comp:7.2, dig:.7, msl:1.4, scale:.6, p3cost:1.0, d:"High price, small population, lowest trial success (5.3%)"},
 imm: {n:"Immunology", ph:{p1:55.2,p2:31.4,p3:65.3,reg:94.1}, dur:{pre:1.5,p1:2.3,p2:3.6,p3:3.3,reg:1.3},
       price:60, gtnH:.20, pool:11, comp:48, dig:1.0, msl:1.0, scale:1, p3cost:1.0, d:"Mid price, large chronic market, crowded (10.7%)"},
 cvm: {n:"Cardiometabolic", ph:{p1:55.9,p2:33.0,p3:59.4,reg:85.0}, dur:{pre:1.5,p1:2.2,p2:3.5,p3:3.65,reg:1.2},
       price:14, gtnH:.25, pool:77, comp:300, dig:1.4, msl:.7, scale:2, p3cost:1.6, d:"Huge population, low price, very large outcome trials (~9%)"},
 rare: {n:"Rare disease", ph:{p1:67.4,p2:44.6,p3:60.4,reg:93.6}, dur:{pre:1.5,p1:2.3,p2:3.6,p3:3.3,reg:1.3},
       price:380, gtnH:.06, pool:.77, comp:1.27, dig:.6, msl:1.5, scale:.5, p3cost:.5, prv:true, d:"Tiny population, very high price, best odds (17%)"}
};
const MODS = {
 sm: {n:"Small molecule", ph:{p1:52.6,p2:28.0,p3:56.9,reg:89.5}, cost:1.0, cogs:.08, eff:[40,85], saf:[40,85], keep:.20,
      d:"Oral, cheap to make; generics take ~80% of volume in year one"},
 mab:{n:"Antibody", ph:{p1:54.7,p2:34.1,p3:68.1,reg:95.4}, cost:1.1, cogs:.18, eff:[50,88], saf:[55,92], keep:.40,
      d:"Biologic: better odds (12.1% vs 7.5%), slower biosimilar erosion"},
 adc:{n:"ADC", ph:{p1:41.7,p2:41.5,p3:62.5,reg:100}, cost:1.2, cogs:.22, eff:[60,95], saf:[30,70], keep:.40,
      d:"Antibody + toxic payload: potent, but Phase I toxicity risk"}
};
const TARGETS = {
 gen:{n:"Genetic evidence", f:{pre:1,p1:1.05,p2:1.6,p3:1.25,reg:1}, mkt:.85,
      d:"Human genetics supports the target: about 2.6× approval odds. Rivals chase it too"},
 nov:{n:"Novel biology", f:{pre:1,p1:1.0,p2:.85,p3:.95,reg:1}, mkt:1.15,
      d:"No genetic support: lower odds, first‑in‑class premium if it works"}
};
const BIOM = {pre:1,p1:1,p2:1.64,p3:1.19,reg:1.06};   // BIO: with vs without preselection biomarker
const COST = {lab:25, opt:10, pre:15, p1:35, p2:80, p3:350, reg:5, launch:50, inlic:150};
const DEFAULT_LEVERS = {reps:60,msl:20,digital:20,rebate:.2,support:20};
const BEST_LEVERS = {      // NPV-optimal plan for a typical molecule (grid search in the balance test)
 onc:{reps:40,msl:30,digital:0,rebate:.15,support:50},
 imm:{reps:90,msl:20,digital:0,rebate:.25,support:50},
 cvm:{reps:120,msl:10,digital:50,rebate:.25,support:70},
 rare:{reps:20,msl:30,digital:0,rebate:.15,support:20}
};
const r10 = v => Math.round(v/10)*10;
function suggestLevers(mol){       // scale the plan to the indication's size
  if(!mol) return Object.assign({},DEFAULT_LEVERS);
  const b=BEST_LEVERS[mol.area], f=clamp(Math.pow(mol.mkt||1,.8),.3,2.2);
  return {reps:r10(b.reps*f), msl:r10(b.msl*f), digital:r10(b.digital*f), rebate:b.rebate, support:r10(b.support*f)};
}
const PRV_PRICE = [150,200];

const TRIAL_EVENTS = [
 {t:"Breakthrough designation", d:"Regulators see promise. Faster and cheaper: cost ×0.8, 0.5 years saved.", cost:.8, odds:1.05, dt:-.5, stages:["p2","p3"]},
 {t:"Slow enrolment", d:"Patients are hard to find. Cost ×1.3 and 0.5 years longer.", cost:1.3, dt:.5, stages:["p1","p2","p3"]},
 {t:"Rival's readout fails", d:"A drug with the same mechanism failed elsewhere. Odds ×0.85.", odds:.85, stages:["p2","p3"]},
 {t:"Clean tox data", d:"Animal studies look excellent. Odds ×1.08.", odds:1.08, stages:["pre","p1"]},
 {t:"Manufacturing finding", d:"Inspectors flag a CMC issue. Cost ×1.5, odds ×0.95.", cost:1.5, odds:.95, stages:["reg"]}
];
const MKT_EVENTS = [
 {t:"Competitor launches a similar drug", d:"More of your patients switch away this year.", so:.05},
 {t:"Added to treatment guidelines", d:"Prescribers adopt faster.", A:.1},
 {t:"Large payer restricts access", d:"Coverage drops this year.", cov:-.12},
 {t:"Positive real‑world evidence", d:"New data improve perceived efficacy.", q:.05},
 {t:"Label safety update", d:"A new warning makes some doctors cautious.", q:-.05, so:.02}
];

/* ---------- state ---------- */
function newGame(){
  const S = {cash:800, loans:[], own:1, year:0, stage:0, mol:null, molN:0, opt:0,
    pick:{target:"gen", mod:"sm", area:"imm"}, biomarker:false, bioLock:false, priority:false,
    partner:false, outl:null, royOut:[], msOut:[], funded:null, synthN:0, prvSold:false,
    A:0, active:0, years:[], peak:0, lastRev:0, levers:Object.assign({},DEFAULT_LEVERS),
    ev:null, trial:null, dead:false, over:false, end:null, log:[], raised:null, approved:false, spentRD:0};
  log(S,"Company founded with $800M of founders' and investors' cash, 100% yours. Design a molecule.","--rd");
  return S;
}
function log(S,t,c){ S.log.unshift({t,c:c||"--loe",y:S.year}); }
const debt = S => S.loans.reduce((a,l)=>a+l.amt,0);
const share = S => S.partner ? .5 : 1;
const tk = S => TILES[S.stage].k;
const alive = S => !!S.mol && !S.dead;
const meanOf = r => (r[0]+r[1])/2;
function addTime(S,dt){ if(dt<=0) return; S.year += dt; S.loans.forEach(l=>{ l.amt *= Math.pow(1+l.rate, dt); }); }
function genName(){ const L="ABCDEFGHJKLMNPRSTVXZ"; return L[Math.floor(R()*L.length)]+L[Math.floor(R()*L.length)]+"-"+Math.floor(rnd(100,999)); }

/* ---------- clinical maths ---------- */
function odds(S,k){
  const m=S.mol, a=AREAS[m.area], md=MODS[m.mod];
  let p = k==="pre" ? PRE_BASE : a.ph[k]*(md.ph[k]/ALL[k]);
  p *= TARGETS[m.target].f[k];
  if(S.biomarker) p *= BIOM[k];
  const de=(m.eff-meanOf(md.eff))/100, ds=(m.saf-meanOf(md.saf))/100;
  p *= ({pre:1+.5*ds, p1:1+.6*ds, p2:1+.8*de, p3:1+.4*de+.3*ds, reg:1+.2*ds})[k];
  if(S.ev && S.ev.k===k && S.ev.odds) p *= S.ev.odds;
  return clamp(Math.round(p),3,97);
}
function fullCost(S,k){
  const m=S.mol, md=MODS[m.mod], a=AREAS[m.area];
  if(k==="reg") { let c=COST.reg; if(S.ev&&S.ev.k===k&&S.ev.cost) c*=S.ev.cost; return Math.round(c); }
  let c = COST[k]*md.cost;
  if(k==="p3") c *= a.p3cost;
  if(S.biomarker && (k==="p2"||k==="p3")) c *= 1.2;
  if(S.ev && S.ev.k===k && S.ev.cost) c *= S.ev.cost;
  return Math.round(c);
}
function myCost(S,k){
  if(S.outl) return 0;
  if(k==="p3" && S.funded) return 0;
  return Math.round(fullCost(S,k)*share(S));
}
function dur(S,k){
  const a=AREAS[S.mol.area];
  let d = a.dur[k];
  if(S.ev && S.ev.k===k && S.ev.dt) d += S.ev.dt;
  if(k==="reg" && S.priority) d -= .4;
  return Math.max(.3, Math.round(d*10)/10);
}
const launchCost = S => S.outl ? 0 : Math.round(COST.launch*share(S));
const msOutSum = S => S.msOut.reduce((a,m)=>a+m.amt,0);
const royOutPct = S => S.royOut.reduce((a,r)=>a+r.pct,0);

/* ---------- market maths ---------- */
function marketStep(ctx,L,ev){
  ev = ev||{};
  const m=ctx.mol, a=AREAS[m.area];
  const Q = clamp((m.eff*.6+m.saf*.4)/100 + (ev.q||0), .2, .98);
  const reach = ctx.licensee ? 1.2 : 1;
  const sat = (x,h) => h*(1-Math.exp(-x/h));          // each channel has diminishing returns
  const push = reach*(sat(L.reps,150) + .7*a.dig*sat(L.digital,60) + .8*a.msl*(.6+m.eff/100)*sat(L.msl,40))/(180*a.scale);
  const A = clamp(ctx.A + (1-ctx.A)*(1-Math.exp(-push))*.72 + (ev.A||0), 0, .95);
  const cov = clamp(.35 + .6*(1-Math.exp(-L.rebate/a.gtnH)) + (ev.cov||0), .1, .95);   // rebates buy formulary coverage
  const label = ctx.biomarker ? .7 : 1;
  const mk = (m.mkt||1)*(ev.erode||1);
  const naive = a.pool*mk*label*A*cov*Q*TARGETS[m.target].mkt*.9;
  const sin = a.comp*mk*label*.14*A*cov*Math.max(0,Q-.45);
  const disc = .45 - .2*(1-Math.exp(-L.support/40));
  const soR = clamp(.10*(1-Q) + (ev.so||0), .01, .3);
  const prev=ctx.active, sout=prev*soR, nbrx=naive+sin;
  const end = Math.max(0, prev*(1-disc-soR) + nbrx);
  const avg = (prev+end)/2;
  return {A, active:end, nbrx, sin, sout, trx:avg*12, pers:1-disc, cov, gtn:L.rebate, rev:avg*a.price*(1-L.rebate),
          spend:L.reps+L.msl+L.digital+L.support};
}
const matureEv = y => y<=5 ? null : {erode:Math.pow(.92,y-5), so:Math.min(.12,.015*(y-5))};   // later entrants erode share
const scaleL = (L,f) => ({reps:L.reps*f, msl:L.msl*f, digital:L.digital*f, rebate:L.rebate, support:L.support*f});
const planLevers = S => S.outl ? suggestLevers(S.mol) : S.levers;
function playerCF(S,rev,spend){
  if(S.outl) return S.outl.roy/100*rev;
  const md=MODS[S.mol.mod], sh=share(S);
  return rev*(1-md.cogs)*sh - spend*sh - royOutPct(S)/100*rev*sh;
}
function project(S,fromYear,ctx0){
  const ctx=Object.assign({},ctx0), L5=planLevers(S), out=[];
  let msPaid = S.outl ? (S.outl.salesPaid || !S.outl.salesMs) : true;
  for(let y=fromYear;y<=13;y++){
    const L = y<=5 ? L5 : scaleL(L5,.6);
    const r = marketStep(ctx,L,matureEv(y)); ctx.A=r.A; ctx.active=r.active;
    let cf = playerCF(S,r.rev,r.spend);
    if(!msPaid && r.rev>=1000){ cf += S.outl.salesMs; msPaid=true; }
    out.push({y,rev:r.rev,spend:r.spend,cf});
  }
  const last = out.length ? out[out.length-1].rev : S.lastRev;
  const tail = last*MODS[S.mol.mod].keep;
  out.push({y:14,rev:tail,spend:0,cf:playerCF(S,tail,0)});
  return out;
}
function view100(S){ return Object.assign({},S,{partner:false,outl:null,royOut:[],msOut:[],funded:null}); }

/* risk-adjusted NPV of the remaining asset (no cash, no debt) */
function rnpv(S,asset100){
  if(!alive(S)) return 0;
  const T = asset100 ? view100(S) : S;
  let idx=S.stage, t=0, pr=1, v=0;
  if(idx===IDX.lab) idx=IDX.pre;
  if(idx<=IDX.reg){
    for(const k of DEV){
      const i=IDX[k]; if(i<idx) continue;
      if(i===S.stage && S.trial && S.trial.ok) continue;
      v -= pr*myCost(T,k)*DF(t);
      pr *= odds(T,k)/100; t += dur(T,k);
      if(!asset100 && T.outl && T.outl.ms[k]) v += pr*T.outl.ms[k]*DF(t);
    }
  }
  const prvEligible = !!S.mol.peds && !S.prvSold && (asset100 || !S.outl);
  if(S.stage<=IDX.launch){
    v -= pr*(launchCost(T) + (asset100?0:msOutSum(T)))*DF(t);
    const pj = project(T,1,{mol:S.mol,A:S.priority?.15:.05,active:0,biomarker:S.biomarker,licensee:!!T.outl});
    pj.forEach(r=>{ v += pr*r.cf*DF(t+r.y-.5); });
    if(prvEligible) v += pr*meanOf(PRV_PRICE)*DF(t+.5);
  } else if(S.stage<IDX.loe){
    const y0 = S.stage===IDX.mature ? 6 : S.stage-IDX.y1+1;
    const pj = project(T,y0,{mol:S.mol,A:S.A,active:S.active,biomarker:S.biomarker,licensee:!!T.outl});
    pj.forEach(r=>{ v += r.cf*DF(r.y-y0+.5); });
    if(prvEligible) v += meanOf(PRV_PRICE)*DF(.5);
  }
  return v;
}
/* probability of approval from here and the forecast peak sales (for deal terms) */
function pApproval(S){
  if(!alive(S)) return 0;
  if(S.stage>IDX.reg) return 1;
  let pr=1, idx=Math.max(S.stage,IDX.pre);
  for(const k of DEV){ const i=IDX[k]; if(i<idx) continue; if(i===S.stage&&S.trial&&S.trial.ok) continue; pr*=odds(S,k)/100; }
  return pr;
}
function peakForecast(S,licensee){
  if(!alive(S)) return 0;
  const T = licensee ? Object.assign(view100(S),{outl:{roy:0,ms:{},salesMs:0,salesPaid:true}}) : S;
  const pre = S.stage<=IDX.launch;
  const pj = project(T, pre?1:(S.stage===IDX.mature?6:S.stage-IDX.y1+1),
     pre?{mol:S.mol,A:S.priority?.15:.05,active:0,biomarker:S.biomarker,licensee}:{mol:S.mol,A:S.A,active:S.active,biomarker:S.biomarker,licensee});
  return Math.max(S.peak, ...pj.slice(0,-1).map(r=>r.rev));
}
function expRevPV(S){        // PV of the player's share of future net sales, risk-adjusted
  if(!alive(S)) return 0;
  const pr=pApproval(S); let t=0;
  if(S.stage<=IDX.reg){ for(const k of DEV){ const i=IDX[k]; if(i<Math.max(S.stage,IDX.pre)) continue; if(i===S.stage&&S.trial&&S.trial.ok) continue; t+=dur(S,k);} }
  const pre=S.stage<=IDX.launch, y0 = pre?1:(S.stage===IDX.mature?6:S.stage-IDX.y1+1);
  const pj=project(S,y0,pre?{mol:S.mol,A:S.priority?.15:.05,active:0,biomarker:S.biomarker,licensee:false}:{mol:S.mol,A:S.A,active:S.active,biomarker:S.biomarker,licensee:false});
  return pj.reduce((a,r)=>a + pr*r.rev*share(S)*DF(t+r.y-y0+.5),0);
}

/* ---------- stage flow ---------- */
function enter(S){
  S.trial=null; S.ev=null;
  const k=tk(S);
  if(DEV.includes(k) && !S.outl && R()<.35){
    const pool=TRIAL_EVENTS.filter(e=>e.stages.includes(k));
    if(pool.length){ S.ev=Object.assign({k},pool[Math.floor(R()*pool.length)]); log(S,"Event: "+S.ev.t+".","--reg"); }
  }
  if(["y2","y3","y4","y5"].includes(k) && R()<.45){
    S.ev=Object.assign({k},MKT_EVENTS[Math.floor(R()*MKT_EVENTS.length)]); log(S,"Market event: "+S.ev.t+".","--reg");
  }
}
function screen(S){
  if(tk(S)!=="lab" || S.mol || S.cash<COST.lab) return false;
  S.cash-=COST.lab; S.spentRD+=COST.lab; addTime(S,2); S.molN++; S.opt=0;
  const md=MODS[S.pick.mod];
  S.mol={name:genName(), target:S.pick.target, mod:S.pick.mod, area:S.pick.area,
         eff:Math.round(rnd(md.eff[0],md.eff[1])), saf:Math.round(rnd(md.saf[0],md.saf[1])), mkt:Math.round(drawMkt()*100)/100};
  S.mol.peds = AREAS[S.mol.area].prv && R()<.5;
  S.levers = suggestLevers(S.mol);
  log(S,`Screened ~1M compounds over 2 years: ${S.mol.name} (efficacy ${S.mol.eff}, safety ${S.mol.saf}). Cost $${COST.lab}M.`,"--rd");
  return true;
}
function optimise(S){
  if(tk(S)!=="lab" || !S.mol || S.opt>=3 || S.cash<COST.opt) return false;
  S.cash-=COST.opt; S.spentRD+=COST.opt; addTime(S,.5); S.opt++;
  const de=Math.round(rnd(-3,9)), ds=Math.round(rnd(-3,9));
  S.mol.eff=clamp(S.mol.eff+de,10,99); S.mol.saf=clamp(S.mol.saf+ds,10,99);
  log(S,`Medicinal chemistry round ${S.opt}/3: efficacy ${de>=0?"+":""}${de}, safety ${ds>=0?"+":""}${ds}.`,"--rd");
  return true;
}
function discard(S){ if(tk(S)==="lab" && S.mol){ log(S,`${S.mol.name} shelved.`,"--rd"); S.mol=null; S.opt=0; } }
function nominate(S){ if(tk(S)!=="lab"||!S.mol) return false; S.stage=IDX.pre; log(S,`${S.mol.name} nominated as development candidate.`,"--rd"); enter(S); return true; }
function inLicense(S){
  if(tk(S)!=="lab" || S.mol || S.cash<COST.inlic) return false;
  S.cash-=COST.inlic; S.spentRD+=COST.inlic; addTime(S,.5); S.molN++;
  const md=MODS[S.pick.mod];
  S.mol={name:genName(), target:S.pick.target, mod:S.pick.mod, area:S.pick.area,
         eff:Math.round(rnd(md.eff[0]+5,md.eff[1])), saf:Math.round(rnd(md.saf[0]+5,md.saf[1])), mkt:Math.round(drawMkt()*100)/100};
  S.mol.peds = AREAS[S.mol.area].prv && R()<.5;
  S.levers = suggestLevers(S.mol);
  S.msOut.push({name:"Licensor approval milestone",amt:100}); S.royOut.push({name:"Licensor",pct:10});
  S.stage=IDX.p2; log(S,`In‑licensed ${S.mol.name} (Phase II‑ready) for $150M upfront, $100M on approval and a 10% royalty.`,"--rd");
  enter(S); return true;
}
function toggleBiomarker(S){ const k=tk(S); if((k==="p2"||k==="p3") && !S.trial && !S.bioLock && alive(S)){ S.biomarker=!S.biomarker; return true;} return false; }
const priorityEligible = S => tk(S)==="reg" && !S.trial && alive(S) && S.mol.eff>=70;
function togglePriority(S){ if(priorityEligible(S)){ S.priority=!S.priority; return true;} return false; }
function roll(S){
  const k=tk(S); if(!DEV.includes(k)||S.trial||!alive(S)) return null;
  const c=myCost(S,k); if(S.cash<c) return null;
  const p=odds(S,k), d=dur(S,k);
  S.cash-=c; S.spentRD+=c; addTime(S,d); if(S.biomarker) S.bioLock=true;
  const r=1+Math.floor(R()*100), ok=r<=p;
  S.trial={r,p,ok,c,d};
  const who = S.outl ? "Licensee's " : "";
  if(ok){
    log(S,`${who}${TILES[S.stage].n}: rolled ${r} vs ${p}% → PASS after ${d} yrs.${c?` Cost $${c}M.`:""}`,"--mkt");
    if(S.outl && S.outl.ms[k]){ S.cash+=S.outl.ms[k]; log(S,`Milestone received: $${Math.round(S.outl.ms[k])}M.`,"--rd"); }
  } else {
    log(S,`${who}${TILES[S.stage].n}: rolled ${r} vs ${p}% → FAIL after ${d} yrs.${c?` Cost $${c}M.`:""}`,"--clin");
    failAsset(S);
  }
  return S.trial;
}
function next(S){ if(S.trial && S.trial.ok){ S.stage++; enter(S); return true;} return false; }
function failAsset(S){
  S.dead=true;
  if(S.funded) log(S,"R&D funder absorbs its loss; nothing is owed.","--rd");
  if(S.outl) log(S,"License ends with the failed program.","--rd");
  S.partner=false; S.outl=null; S.royOut=[]; S.msOut=[]; S.funded=null; S.biomarker=false; S.bioLock=false; S.priority=false; S.synthN=0;
  const d=debt(S);
  if(d>0){
    if(S.cash>=d){ S.cash-=d; S.loans=[]; log(S,`Lenders called the loan: $${Math.round(d)}M repaid from cash.`,"--loe"); }
    else { S.cash=0; S.loans=[]; log(S,`Lenders called a $${Math.round(d)}M loan the company cannot repay. Insolvent.`,"--loe"); settle(S,"bankrupt"); }
  }
}
function backToLab(S){ if(!S.dead||S.over) return false; S.mol=null; S.stage=0; S.dead=false; S.trial=null; S.ev=null; S.opt=0; return true; }
function abandon(S){
  const k=tk(S); if(!alive(S)||!DEV.includes(k)||S.trial) return false;
  log(S,`${S.mol.name} abandoned to save cash.`,"--loe"); failAsset(S); if(!S.over) backToLab(S); return true;
}
function launch(S){
  if(tk(S)!=="launch") return false;
  const need=launchCost(S)+(S.outl?0:msOutSum(S)); if(S.cash<need) return false;
  S.cash-=need;
  if(!S.outl && S.msOut.length){ log(S,`Approval milestones paid: ${S.msOut.map(m=>m.name+" $"+Math.round(m.amt)+"M").join(", ")}.`,"--reg"); S.msOut=[]; }
  S.A=S.priority?.15:.05; S.active=0; S.approved=true;
  log(S,S.outl?`Licensee launches ${S.mol.name}.`:`Launched ${S.mol.name}. Field force trained, patient hub live. Cost $${launchCost(S)}M.`,"--reg");
  S.stage++; enter(S); return true;
}
function marketCost(S,L){ return S.outl ? 0 : (L.reps+L.msl+L.digital+L.support)*share(S); }
function runYear(S,L){
  const k=tk(S); if(!/^y[1-5]$/.test(k)) return null;
  L = S.outl ? suggestLevers(S.mol) : L;
  if(S.cash < marketCost(S,L)) return null;
  const r=marketStep({mol:S.mol,A:S.A,active:S.active,biomarker:S.biomarker,licensee:!!S.outl},L,S.ev);
  S.A=r.A; S.active=r.active;
  let cf=playerCF(S,r.rev,r.spend);
  if(S.outl && S.outl.salesMs>0 && !S.outl.salesPaid && r.rev>=1000){ cf+=S.outl.salesMs; S.outl.salesPaid=true; log(S,`Sales milestone: $${Math.round(S.outl.salesMs)}M.`,"--rd"); }
  S.cash+=cf; addTime(S,1);
  if(!S.outl) S.levers=Object.assign({},L);
  const yi=+k.slice(1);
  S.years.push({y:"Y"+yi, nbrx:r.nbrx, sin:r.sin, sout:r.sout, trx:r.trx, pers:r.pers, cov:r.cov, gtn:r.gtn, rev:r.rev, profit:cf, A:r.A});
  S.peak=Math.max(S.peak,r.rev); S.lastRev=r.rev;
  log(S,`Year ${yi}: sales $${Math.round(r.rev)}M, NBRx ${r.nbrx.toFixed(1)}k, ${Math.round(r.A*100)}% of target HCPs prescribing. ${S.outl?"Royalty":"Your profit"} $${Math.round(cf)}M.`,"--mkt");
  S.stage++; enter(S); return r;
}
function runMature(S){
  if(tk(S)!=="mature") return null;
  const L=scaleL(S.outl?suggestLevers(S.mol):S.levers,.6);
  let tot=0, rev=0, nb=0, si=0, so=0, trx=0, pk=0, last=0, cov=0, pers=0;
  const ctx={mol:S.mol,A:S.A,active:S.active,biomarker:S.biomarker,licensee:!!S.outl};
  for(let y=6;y<=13;y++){
    const r=marketStep(ctx,L,matureEv(y)); ctx.A=r.A; ctx.active=r.active;
    let cf=playerCF(S,r.rev,r.spend);
    if(S.outl && S.outl.salesMs>0 && !S.outl.salesPaid && r.rev>=1000){ cf+=S.outl.salesMs; S.outl.salesPaid=true; }
    tot+=cf; rev+=r.rev; nb+=r.nbrx; si+=r.sin; so+=r.sout; trx+=r.trx; cov+=r.cov; pers+=r.pers; pk=Math.max(pk,r.rev); last=r.rev;
  }
  S.A=ctx.A; S.active=ctx.active;
  S.cash+=tot; addTime(S,8);
  S.years.push({y:"Y6–13", avg:true, nbrx:nb/8, sin:si/8, sout:so/8, trx:trx/8, pers:pers/8, cov:cov/8, gtn:L.rebate, rev:rev/8, profit:tot/8, A:ctx.A});
  S.peak=Math.max(S.peak,pk); S.lastRev=last;
  log(S,`Years 6–13 on a maintenance budget: sales $${Math.round(rev)}M in total, ${S.outl?"royalties":"your profit"} $${Math.round(tot)}M.`,"--mkt");
  S.stage++; enter(S); return {tot,rev};
}
function finish(S){
  if(tk(S)!=="loe"||S.over) return;
  const tail=S.lastRev*MODS[S.mol.mod].keep, cf=playerCF(S,tail,0);
  S.cash+=cf; addTime(S,1);
  log(S,`Exclusivity ends after 13 years. ${S.mol.mod==="sm"?"Generics take ~80% of volume in year one":"Biosimilars erode ~60% of net sales"}; final ${S.outl?"royalty":"brand profit"} $${Math.round(cf)}M.`,"--loe");
  settle(S,"complete");
}
function settle(S,type){
  const d=debt(S);
  if(d>0){ const pay=Math.min(S.cash,d); S.cash-=pay; if(pay<d) type="bankrupt"; S.loans=[]; log(S,`Loans settled: $${Math.round(pay)}M repaid.`,"--loe"); }
  const stake = type==="bankrupt" ? 0 : S.own*Math.max(0,S.cash);
  S.over=true; S.end={type, stake, moic:stake/800, peak:S.peak, years:S.year, own:S.own};
}
function windDown(S){ if(S.over) return; log(S,"Board decides to wind down the company and return remaining cash.","--loe"); settle(S,"wound down"); }

/* ---------- finance desk ---------- */
const round5 = v => Math.max(0, Math.floor(v/5)*5);
function loanRate(S){ return S.stage<=IDX.p1 ? .14 : S.stage<=IDX.p3 ? .12 : .10; }
function loanLimit(S){ return round5(.3*Math.max(0,rnpv(S,false)) - debt(S)); }
function equityValue(S){ return Math.max(0,S.cash-debt(S)) + .8*Math.max(0,rnpv(S,false)) + (alive(S)?0:40); }
const raiseKey = S => S.molN+":"+S.stage;
const OUTL_TERMS = {pre:{u:.08,roy:7},p1:{u:.10,roy:10},p2:{u:.15,roy:10},p3:{u:.25,roy:14},reg:{u:.30,roy:14},launch:{u:.40,roy:11},market:{u:.40,roy:11}};
function outlTerms(S){
  const k=tk(S), key = DEV.includes(k)||k==="launch" ? k : "market";
  const T=OUTL_TERMS[key], av=Math.max(0,rnpv(S,true)), U=peakForecast(S,true);
  const ms={};
  const passed = i => i<S.stage || (i===S.stage && S.trial && S.trial.ok);
  if(!passed(IDX.p2) && .05*U>=5) ms.p2=Math.round(.05*U);
  if(!passed(IDX.p3) && .10*U>=5) ms.p3=Math.round(.10*U);
  if(!passed(IDX.reg) && .15*U>=5) ms.reg=Math.round(.15*U);
  return {upfront:Math.max(10,Math.round(T.u*av)), roy:T.roy, ms, salesMs:U>=500?Math.round(.10*U):0, sale:key==="market"||key==="launch", U};
}
function offers(S){
  const k=tk(S), o=[], mol=alive(S), d=debt(S);
  const atDev = DEV.includes(k);
  // 1 loan
  { const lim = mol ? loanLimit(S) : 0, rate=loanRate(S);
    const ch=[...new Set([Math.min(50,lim),Math.min(150,lim),lim])].filter(v=>v>=5).map(v=>({label:`Borrow $${v}M`,v}));
    o.push({id:"loan",t:"Bank or venture loan",ok:ch.length>0,
      why: !mol?"Lenders need an asset to lend against.":"Credit limit reached (30% of your asset's risk‑adjusted value).",
      terms:`${Math.round(rate*100)}% a year, compounding; limit $${lim}M more. If the program fails, lenders call the loan.`,
      ex:"Venture debt runs about 10–13% plus warrants. Revolution Medicines' $750M term loan from Royalty Pharma (2025) is priced at SOFR + 5.75%.",
      choices:ch}); }
  // 2 equity
  { const V=equityValue(S), used=S.raised===raiseKey(S);
    const name = k==="lab"||k==="pre" ? "Venture round" : S.stage<=IDX.p2 ? "IPO or crossover round" : "Follow‑on offering";
    const ch = [.1,.2,.3,.5].map(f=>({label:`Sell ${f*100}% → $${Math.round(f/(1-f)*V*.93)}M`,v:f}));
    o.push({id:"equity",t:name,ok:V>=10 && !used && !S.over,
      why: used?"One round per stage. Investors want new data before the next raise.":"Company value too low to attract investors.",
      terms:`Pre‑money value $${Math.round(V)}M (cash minus debt plus 80% of risk‑adjusted asset value). 7% fees. You own ${Math.round(S.own*100)}% today.`,
      ex:"Biotechs typically raise after positive data, when the risk‑adjusted value jumps. A 7% gross spread is standard for mid‑size IPOs.",
      choices:ch}); }
  // 3 partner
  { const ok = mol && S.stage>=IDX.pre && S.stage<=IDX.p3 && !S.partner && !S.outl && !(S.trial);
    const up = ok ? Math.max(10,Math.round(.15*Math.max(0,rnpv(S,true)))) : 0;
    o.push({id:"partner",t:"Co‑development partner (50/50)",ok,
      why: !mol?"No asset to partner.":S.partner?"Already partnered.":S.outl?"Rights already licensed out.":"Available from preclinical to Phase III, before the roll.",
      terms:`$${up}M upfront now. Partner pays half of all future costs and takes half of all profits.`,
      ex:"AstraZeneca–Daiichi Sankyo, Enhertu (2019): $1.35B upfront, up to $6.9B total, costs and profits shared equally.",
      choices: ok?[{label:`Sign for $${up}M`,v:1}]:[]}); }
  // 4 out-license / sell rights
  { const ok = mol && S.stage>=IDX.pre && S.stage<=IDX.y5 && !S.partner && !S.outl && !(S.trial && !S.trial.ok);
    let terms="", ch=[];
    if(ok){ const T=outlTerms(S);
      const msTxt = Object.entries(T.ms).map(([kk,v])=>`${TILES[IDX[kk]].n} pass $${v}M`).join(", ");
      terms = T.sale ? `$${T.upfront}M upfront, ${T.roy}% royalty on sales. Buyer takes over the product and its obligations.`
                     : `$${T.upfront}M upfront, ${T.roy}% royalty${msTxt?`, milestones: ${msTxt}`:""}${T.salesMs?`, $${T.salesMs}M when sales pass $1B`:""}. Licensee pays all costs.`;
      ch=[{label:`License for $${T.upfront}M`,v:1}]; }
    o.push({id:"outl",t: S.stage>=IDX.launch ? "Sell product rights" : "Out‑license worldwide rights",ok,
      why: !mol?"No asset to license.":S.partner?"A 50/50 partner already shares the rights.":S.outl?"Already licensed.":"Not available at this point.",
      terms, ex:"Royalties rise with stage: ~7% preclinical, ~10% Phase I/II, ~14% Phase III (LES deal data). Sanofi sold Libtayo rights to Regeneron (2022) for $900M upfront plus an 11% royalty.",
      choices:ch}); }
  // 5 synthetic royalty
  { const ok = mol && !S.outl && S.stage>=IDX.p3 && S.stage<=IDX.y5 && S.synthN<2 && !(S.trial&&!S.trial.ok);
    const pv = ok ? expRevPV(S) : 0;
    const ch = ok ? [3,6].map(p=>({label:`Sell ${p}% of sales → $${Math.round(p/100*pv*.75)}M`,v:p})) : [];
    o.push({id:"synth",t:"Royalty financing",ok,
      why: S.outl?"You only hold a royalty now.":S.synthN>=2?"Investors cap royalty sales at two tranches.":"Available from Phase III onwards, once sales can be forecast.",
      terms:"Cash now for a fixed percentage of your future net sales. If the drug fails, the investor loses.",
      ex:"Royalty Pharma paid Revolution Medicines $250M upfront for 2.55% of daraxonrasib sales (2025), part of a $2B package.",
      choices:ch}); }
  // 6 R&D funding
  { const ok = mol && k==="p3" && !S.trial && !S.outl && !S.funded && myCost(S,"p3")>0;
    const amt = ok ? myCost(S,"p3") : 0;
    o.push({id:"rdfund",t:"R&D funding (pay only if it works)",ok,
      why: S.funded?"Phase III already funded.":S.outl?"Licensee pays for trials.":"Available at Phase III, before the roll.",
      terms:`Funder pays your $${amt}M Phase III cost. If approved you pay $${amt}M back at launch plus a 4% royalty. If it fails you owe nothing.`,
      ex:"Blackstone Life Sciences agreed to fund up to $750M of Moderna's flu program (2024) for milestones and royalties on success.",
      choices: ok?[{label:`Accept $${amt}M`,v:amt}]:[]}); }
  // 7 PRV
  { const ok = mol && S.mol.peds && S.approved && !S.prvSold && !S.outl && S.stage<IDX.loe;
    o.push({id:"prv",t:"Sell priority review voucher",ok,
      why: !(S.mol&&S.mol.peds) ? "Only rare pediatric disease approvals earn a voucher." : S.prvSold?"Voucher already sold.":"Earned at approval of a rare pediatric disease drug.",
      terms:"One‑off cash sale. The buyer uses it to speed up review of another drug.",
      ex:"Vouchers sold for $150–160M in 2025 and $200M in early 2026; Congress extended the program to Sept 2029.",
      choices: ok?[{label:"Sell voucher (~$150–200M)",v:1}]:[]}); }
  // repaying only makes sense with spare cash beyond the next step
  { const spare = S.cash - needNow(S);
    if(d>0 && spare>=1) o.push({id:"repay",t:"Repay loans",ok:true,terms:`Outstanding $${Math.round(d)}M. Repaying stops interest and removes the risk of the loan being called.`,ex:"",
      choices:[...new Set([Math.min(100,d,spare),Math.min(d,spare)])].filter(v=>v>=1).map(v=>({label:`Repay $${Math.round(v)}M`,v:Math.round(v)}))}); }
  return o;
}
function take(S,id,v){
  const k=tk(S);
  const o=offers(S).find(x=>x.id===id); if(!o||!o.ok) return false;
  S.deals=S.deals||{}; S.deals[id]=(S.deals[id]||0)+1;
  if(id==="loan"){ const rate=loanRate(S); S.loans.push({amt:v,rate}); S.cash+=v; log(S,`Borrowed $${v}M at ${Math.round(rate*100)}% a year.`,"--reg"); }
  else if(id==="repay"){ let left=Math.min(v,S.cash); S.cash-=left; for(const l of S.loans){ const p=Math.min(l.amt,left); l.amt-=p; left-=p; } S.loans=S.loans.filter(l=>l.amt>.01); log(S,`Repaid $${Math.round(v)}M of loans.`,"--reg"); }
  else if(id==="equity"){ const V=equityValue(S), cash=v/(1-v)*V*.93; S.cash+=cash; S.own*=(1-v); S.raised=raiseKey(S); log(S,`Raised $${Math.round(cash)}M selling ${v*100}% of the company at a $${Math.round(V)}M pre‑money value. You now own ${Math.round(S.own*100)}%.`,"--reg"); }
  else if(id==="partner"){ const up=Math.max(10,Math.round(.15*Math.max(0,rnpv(S,true)))); S.partner=true; S.cash+=up; log(S,`50/50 co‑development deal signed: $${up}M upfront.`,"--rd"); }
  else if(id==="outl"){ const T=outlTerms(S); S.outl={roy:T.roy, ms:T.ms, salesMs:T.salesMs, salesPaid:false}; S.cash+=T.upfront; S.royOut=[]; S.msOut=[]; S.funded=null; S.synthN=0; S.biomarker=S.biomarker;
      log(S,`${T.sale?"Product rights sold":"Worldwide rights licensed out"}: $${T.upfront}M upfront, ${T.roy}% royalty.`,"--rd"); }
  else if(id==="synth"){ const pv=expRevPV(S), cash=v/100*pv*.75; S.cash+=cash; S.royOut.push({name:"Royalty investor",pct:v}); S.synthN++; log(S,`Sold ${v}% of future sales for $${Math.round(cash)}M.`,"--reg"); }
  else if(id==="rdfund"){ const amt=myCost(S,"p3"); S.funded={amt}; S.msOut.push({name:"R&D funder",amt}); S.royOut.push({name:"R&D funder",pct:4}); log(S,`R&D funder covers the $${amt}M Phase III. Repay $${amt}M plus 4% royalty only if approved.`,"--reg"); }
  else if(id==="prv"){ const p=Math.round(rnd(PRV_PRICE[0],PRV_PRICE[1])); S.cash+=p; S.prvSold=true; log(S,`Priority review voucher sold for $${p}M.`,"--reg"); }
  return true;
}
/* what the current step needs in cash */
function needNow(S){
  const k=tk(S);
  if(S.over) return 0;
  if(k==="lab") return S.mol ? 0 : COST.lab;
  if(DEV.includes(k)) return S.trial ? 0 : myCost(S,k);
  if(k==="launch") return launchCost(S)+(S.outl?0:msOutSum(S));
  if(/^y[1-5]$/.test(k)) return S.outl?0:marketCost(S,S.levers);
  return 0;
}
/* true when nothing on the finance desk can cover the next step */
function stuck(S){
  const need=needNow(S); if(S.cash>=need) return false;
  const os=offers(S).filter(x=>x.ok && x.id!=="repay");
  let best=0;
  os.forEach(x=>{ x.choices.forEach(c=>{ const m=/\$(\d+)M/.exec(c.label); if(m) best=Math.max(best,+m[1]); }); if(x.id==="rdfund") best=Math.max(best,need); });
  return S.cash+best < need;
}

return {setRng, drawMkt, matureEv, TILES, IDX, DEV, AREAS, MODS, TARGETS, BIOM, COST, ALL, PRE_BASE, DEFAULT_LEVERS, BEST_LEVERS, suggestLevers, PRV_PRICE,
  newGame, log, debt, share, tk, alive, odds, fullCost, myCost, dur, launchCost, msOutSum, royOutPct,
  marketStep, playerCF, project, rnpv, pApproval, peakForecast, expRevPV, enter, screen, optimise, discard, nominate, inLicense,
  toggleBiomarker, togglePriority, priorityEligible, roll, next, failAsset, backToLab, abandon, launch, marketCost, runYear,
  runMature, finish, settle, windDown, loanRate, loanLimit, equityValue, outlTerms, offers, take, needNow, stuck, addTime, DF};
})();
/* CORE END */
if (typeof module !== "undefined") module.exports = Core;
