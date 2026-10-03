const Core = require('../core.js');
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const C = Core;
const pct = x => (100*x).toFixed(1)+"%";
const mean = a => a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
const median = a => { const s=[...a].sort((x,y)=>x-y); return s.length? (s.length%2? s[(s.length-1)/2] : (s[s.length/2-1]+s[s.length/2])/2):0; };
const q = (a,p) => { const s=[...a].sort((x,y)=>x-y); return s[Math.min(s.length-1,Math.floor(p*s.length))]; };

/* ---------- A. program-level realism (solo, unlimited cash) ---------- */
function makeProgram(area, mod, target, startStage, opts={}){
  const S=C.newGame(); S.cash=1e9; S.pick={area,mod,target};
  const md=C.MODS[mod]; const r=()=>Math.random();
  S.mol={name:"T", target, mod, area, eff:Math.round(md.eff[0]+Math.random()*(md.eff[1]-md.eff[0])), saf:Math.round(md.saf[0]+Math.random()*(md.saf[1]-md.saf[0])), mkt: opts.mkt||C.drawMkt()};
  S.molN=1; S.stage=C.IDX[startStage]; C.enter(S);
  return S;
}
function runDev(S, opts={}){
  const flows=[]; const t0=S.year;
  while(!S.over){
    const k=C.tk(S);
    if(!C.DEV.includes(k)) break;
    if(opts.biomarker && k==="p2" && !S.biomarker) C.toggleBiomarker(S);
    const c=C.myCost(S,k); flows.push({t:S.year-t0,c});
    const res=C.roll(S); if(!res) throw new Error("roll failed");
    if(!res.ok) return {approved:false, flows, t:S.year-t0};
    C.next(S);
  }
  return {approved:true, flows, t:S.year-t0};
}
function runMarket(S, levers){
  const lc=C.launchCost(S)+C.msOutSum(S); C.launch(S);
  const revs=[], cfs=[{t:0,v:-lc}]; let spend=0, rev=0;
  const t0=S.year;
  while(/^y[1-5]$/.test(C.tk(S))){ const before=S.cash; const r=C.runYear(S,levers); revs.push(r.rev); spend+=r.spend; rev+=r.rev; cfs.push({t:S.year-t0-.5,v:S.cash-before}); }
  // mature years one by one (deterministic) to get the curve
  const L={...Object.fromEntries(Object.entries(levers).map(([k,v])=>[k,v*.6])),rebate:levers.rebate};
  const ctx={mol:S.mol,A:S.A,active:S.active,biomarker:S.biomarker,licensee:false};
  for(let y=6;y<=13;y++){ const r=C.marketStep(ctx,L,C.matureEv(y)); ctx.A=r.A; ctx.active=r.active; revs.push(r.rev); spend+=r.spend; rev+=r.rev; cfs.push({t:y-.5,v:C.playerCF(S,r.rev,r.spend)}); }
  const tail=revs[revs.length-1]*C.MODS[S.mol.mod].keep; cfs.push({t:13.5,v:C.playerCF(S,tail,0)});
  const peak=Math.max(...revs);
  const t1b=revs.findIndex(v=>v>=1000);
  return {peak, revs, spend, rev, spendRatio:spend/rev, t1b: t1b<0?null:t1b+1, cfs, peakYear: revs.indexOf(peak)+1};
}
function irr(flows){ // flows: [{t,v}]
  const npv=r=>flows.reduce((a,f)=>a+f.v/Math.pow(1+r,f.t),0);
  let lo=-0.9, hi=1.0; if(npv(lo)*npv(hi)>0) return null;
  for(let i=0;i<200;i++){ const m=(lo+hi)/2; if(npv(lo)*npv(m)<=0) hi=m; else lo=m; }
  return (lo+hi)/2;
}

function realism(N=40000){
  const out={};
  const areas=Object.keys(C.AREAS), mods=Object.keys(C.MODS);
  // LOA by area (small molecule, mixed targets 15% genetic) from Phase I
  console.log("\n== LOA from Phase I by area (small molecule, 15% genetic mix, events on) ==");
  for(const a of areas){
    let ok=0, tt=[];
    for(let i=0;i<N;i++){ const g=Math.random()<.15?"gen":"nov"; const S=makeProgram(a,"sm",g,"p1"); const r=runDev(S); if(r.approved){ok++; tt.push(r.t);} }
    console.log(a.padEnd(5), "game LOA", pct(ok/N), " BIO", {onc:"5.3% (sm ~5.0%)",imm:"10.7%",cvm:"4.8% CV / 15.5% metabolic",rare:"17.0%"}[a], " P1→approval yrs", mean(tt).toFixed(1));
  }
  console.log("\n== LOA by modality (all 4 areas pooled, 15% genetic) ==");
  for(const m of mods){
    let ok=0;
    for(let i=0;i<N;i++){ const a=areas[i%4]; const g=Math.random()<.15?"gen":"nov"; const S=makeProgram(a,m,g,"p1"); if(runDev(S).approved) ok++; }
    console.log(m.padEnd(4), "game", pct(ok/N), " BIO", {sm:"7.5%",mab:"12.1%",adc:"10.8%"}[m]);
  }
  console.log("\n== Genetic support and biomarker ratios (imm, sm) ==");
  const loa=(g,b)=>{ let ok=0; for(let i=0;i<N;i++){ const S=makeProgram("imm","sm",g,"p1"); if(runDev(S,{biomarker:b}).approved) ok++; } return ok/N; };
  const lg=loa("gen",false), ln=loa("nov",false), lb=loa("nov",true);
  console.log("genetic", pct(lg), "novel", pct(ln), "ratio", (lg/ln).toFixed(2), "(Minikel 2024: 2.6)");
  console.log("biomarker", pct(lb), "vs none", pct(ln), "ratio", (lb/ln).toFixed(2), "(BIO: 15.9/7.6 = 2.09)");

  // cost per approval & capitalised cost (from preclinical incl. lab) and IRR
  console.log("\n== Cost per approved drug, from discovery (solo, 15% genetic, sm/mab mix, suggested plan) ==");
  for(const a of areas){
    let oop=0, approved=0; const M=N; const meanFlows={}; const all=[]; const tAppr=[]; const peaks=[];
    for(let i=0;i<M;i++){
      const g=Math.random()<.15?"gen":"nov", m=Math.random()<.5?"sm":"mab";
      const S=makeProgram(a,m,g,"pre");
      const r=runDev(S);
      const flows=[{t:-2,c:C.COST.lab}, ...r.flows];
      oop+=flows.reduce((x,f)=>x+f.c,0); all.push(flows);
      flows.forEach(f=>{ const y=Math.floor(f.t+2); meanFlows[y]=(meanFlows[y]||0)-f.c; });
      if(r.approved){ approved++; tAppr.push(r.t); const mk=runMarket(S,C.suggestLevers(S.mol)); peaks.push(mk.peak); mk.cfs.forEach(f=>{ const y=Math.floor(r.t+2+f.t); meanFlows[y]=(meanFlows[y]||0)+f.v; }); }
    }
    const T=mean(tAppr);
    const cap=all.reduce((x,fl)=>x+fl.reduce((y,f)=>y+f.c*Math.pow(1.105,Math.max(0,T-f.t)),0),0);
    const fl=Object.entries(meanFlows).map(([t,v])=>({t:+t,v:v/M}));
    const ir=irr(fl);
    console.log(a.padEnd(5), "approval from nomination", pct(approved/M), " out-of-pocket/approval $"+Math.round(oop/approved)+"M", " capitalised @10.5% $"+Math.round(cap/approved)+"M", " program IRR", ir===null?"n/a":pct(ir), " mean peak $"+Math.round(mean(peaks))+"M");
  }
}

/* ---------- B. peak sales distribution ---------- */
function peaks(N=20000, levers=C.DEFAULT_LEVERS, label="default levers"){
  console.log(`\n== Peak sales of launched drugs (${label}) ==`);
  const all=[]; const byA={};
  for(const a of Object.keys(C.AREAS)){
    byA[a]=[];
    for(let i=0;i<N;i++){
      const g=Math.random()<.15?"gen":"nov", m=["sm","mab","adc"][i%3];
      const S=makeProgram(a,m,g,"launch"); S.stage=C.IDX.launch; S.trial=null; S.ev=null;
      const L = levers==="licensee" ? C.suggestLevers(S.mol) : levers;
      const mk=runMarket(S,L); byA[a].push(mk); all.push(mk);
    }
    const p=byA[a].map(x=>x.peak);
    console.log(a.padEnd(5),"mean $"+Math.round(mean(p))+"M  median $"+Math.round(median(p))+"M  p10 $"+Math.round(q(p,.1))+"M  p90 $"+Math.round(q(p,.9))+"M  ≥$1B "+pct(p.filter(v=>v>=1000).length/p.length)+"  spend/sales (mean of drugs) "+pct(mean(byA[a].map(x=>x.spendRatio)))+" (pooled) "+pct(byA[a].reduce((s,x)=>s+x.spend,0)/byA[a].reduce((s,x)=>s+x.rev,0))+"  peak yr "+mean(byA[a].map(x=>x.peakYear)).toFixed(1)+"  yrs to $1B "+(mean(byA[a].filter(x=>x.t1b).map(x=>x.t1b))||0).toFixed(1));
  }
  const p=all.map(x=>x.peak);
  const cat=[[0,200,"nano <200"],[200,500,"micro 200–500"],[500,1000,"first-run 500–1000"],[1000,5000,"blockbuster 1–5B"],[5000,1e9,"mega >5B"]];
  console.log("ALL   mean $"+Math.round(mean(p))+"M median $"+Math.round(median(p))+"M  "+cat.map(c=>c[2]+": "+pct(p.filter(v=>v>=c[0]&&v<c[1]).length/p.length)).join(" | "));
}

/* ---------- C. lever optimisation per area ---------- */
function bestLevers(){
  console.log("\n== NPV-best levers per area (typical molecule, deterministic) ==");
  const grid=[0,20,40,60,90,120,160,200];
  for(const a of Object.keys(C.AREAS)){
    const S=C.newGame(); S.mol={name:"T",target:"nov",mod:"sm",area:a,eff:65,saf:65,mkt:1}; S.stage=C.IDX.launch;
    let best=null;
    for(const reps of grid) for(const msl of [0,10,20,30,40,60]) for(const digital of [0,10,20,30,50,80,110]) for(const rebate of [0,.05,.1,.15,.2,.25,.3,.4,.5]) for(const support of [0,10,20,30,50,70,100]){
      const L={reps,msl,digital,rebate,support};
      const ctx={mol:S.mol,A:.05,active:0,biomarker:false,licensee:false}; let npv=0;
      for(let y=1;y<=13;y++){ const LL=y<=5?L:{...Object.fromEntries(Object.entries(L).map(([k,v])=>[k,v*.6])),rebate:L.rebate}; const r=C.marketStep(ctx,LL,C.matureEv(y)); ctx.A=r.A; ctx.active=r.active; npv+=C.playerCF(S,r.rev,r.spend)/Math.pow(1.1,y-.5); }
      if(!best||npv>best.npv) best={L,npv};
    }
    const ctx={mol:S.mol,A:.05,active:0,biomarker:false,licensee:false}; let npvD=0;
    for(let y=1;y<=13;y++){ const L=y<=5?C.DEFAULT_LEVERS:{...Object.fromEntries(Object.entries(C.DEFAULT_LEVERS).map(([k,v])=>[k,v*.6])),rebate:C.DEFAULT_LEVERS.rebate}; const r=C.marketStep(ctx,L,C.matureEv(y)); ctx.A=r.A; ctx.active=r.active; npvD+=C.playerCF(S,r.rev,r.spend)/Math.pow(1.1,y-.5); }
    console.log(a.padEnd(5), JSON.stringify(best.L), "NPV $"+Math.round(best.npv)+"M vs default $"+Math.round(npvD)+"M");
  }
}

/* ---------- D. full-game bots ---------- */
function ensureCash(S, need0, policy){
  let guard=0;
  const need = () => { const k=C.tk(S); return (k==='lab' && !S.mol) ? need0 : C.needNow(S); };
  while(S.cash<need() && guard++<12){
    const os=C.offers(S); let took=false;
    for(const id of policy.finance){
      const o=os.find(x=>x.id===id && x.ok); if(!o || !o.choices.length) continue;
      if(id==="rdfund"||id==="partner"){ C.take(S,id,o.choices[0].v); took=true; break; }
      const gap=need()-S.cash;
      const vals=o.choices.map(c=>({c,amt:+(/\$(\d+)M/.exec(c.label)||[0,0])[1]}));
      const cover=vals.filter(x=>x.amt>=gap).sort((x,y)=>x.amt-y.amt)[0] || vals.sort((x,y)=>y.amt-x.amt)[0];
      C.take(S,id,cover.c.v); took=true; break;
    }
    if(!took) break;
  }
  return S.cash>=need();
}
function playBot(policy, seed){
  C.setRng(mulberry32(seed));
  const S=C.newGame(); S.pick=Object.assign({},policy.pick);
  let guard=0;
  while(!S.over && guard++<400){
    const k=C.tk(S);
    if(S.dead){ if(S.molN>=policy.maxMol){ C.windDown(S); break; } C.backToLab(S); continue; }
    if(k==="lab"){
      if(S.molN>=policy.maxMol){ C.windDown(S); break; }
      if(!S.mol){
        if(policy.inlicense && S.cash>=C.COST.inlic+150){ C.inLicense(S); continue; }
        if(!ensureCash(S,C.COST.lab,policy)){ S.stuckEnd=true; S.stuckAt={k:"lab",need:C.COST.lab,cash:S.cash,ok:C.offers(S).filter(o=>o.ok).map(o=>o.id).join(","),raised:S.raised===S.molN+":"+S.stage,rnpv:0}; C.windDown(S); break; }
        C.screen(S);
      } else if(policy.minMkt && S.mol.mkt<policy.minMkt && S.cash>=C.COST.lab+100){ C.discard(S); }
      else if(S.opt<policy.opt && S.cash>=C.COST.opt+200) C.optimise(S);
      else C.nominate(S);
      continue;
    }
    if(C.DEV.includes(k)){
      if(policy.biomarker && (k==="p2") && !S.biomarker && !S.trial) C.toggleBiomarker(S);
      if(k==="reg" && C.priorityEligible(S) && !S.priority) C.togglePriority(S);
      if(policy.partnerAt===k && !S.partner && !S.outl){ const o=C.offers(S).find(x=>x.id==="partner"&&x.ok); if(o) C.take(S,"partner",1); }
      if(policy.outlAt===k && !S.outl && !S.partner){ const o=C.offers(S).find(x=>x.id==="outl"&&x.ok); if(o) C.take(S,"outl",1); }
      if(policy.rdfund && k==="p3" && !S.funded){ const o=C.offers(S).find(x=>x.id==="rdfund"&&x.ok); if(o) C.take(S,"rdfund",o.choices[0].v); }
      const need=C.myCost(S,k);
      if(!ensureCash(S,need,policy) && C.abandon(S)){ continue; }
      if(S.cash<C.needNow(S)){ S.stuckEnd=true; S.stuckAt={k,need:C.needNow(S),cash:S.cash,ok:C.offers(S).filter(o=>o.ok).map(o=>o.id).join(","),raised:S.raised===S.molN+":"+S.stage, rnpv:C.rnpv(S,false)}; C.windDown(S); break; }
      const r=C.roll(S); if(!r){ C.windDown(S); break; }
      if(r.ok) C.next(S);
      continue;
    }
    if(k==="launch"){ const need=C.needNow(S); if(!ensureCash(S,need,policy)){ C.windDown(S); break;} C.launch(S); continue; }
    if(/^y[1-5]$/.test(k)){
      let L = policy.levers==="fixed" ? C.DEFAULT_LEVERS : C.suggestLevers(S.mol);
      const need=C.marketCost(S,L);
      if(S.cash<need){ ensureCash(S,need,policy); }
      if(S.cash<need){ const f=Math.max(0,S.cash/need); L=Object.fromEntries(Object.entries(L).map(([kk,v])=>[kk,Math.floor(v*f)])); }
      if(policy.sellPRV){ const o=C.offers(S).find(x=>x.id==="prv"&&x.ok); if(o) C.take(S,"prv",1); }
      C.runYear(S,L); continue;
    }
    if(k==="mature"){ C.runMature(S); continue; }
    if(k==="loe"){ C.finish(S); continue; }
  }
  if(!S.over) C.windDown(S);
  return S;
}
function botReport(name, policy, N=4000){
  const res=[];
  for(let i=0;i<N;i++) res.push(playBot(policy, 1000+i));
  const approved=res.filter(s=>s.approved).length;
  const bankrupt=res.filter(s=>s.end.type==="bankrupt").length;
  const moic=res.map(s=>s.end.moic);
  const peaks=res.filter(s=>s.approved).map(s=>s.peak);
  const deals={}; res.forEach(s=>Object.entries(s.deals||{}).forEach(([k,v])=>deals[k]=(deals[k]||0)+v));
  const stuckN=res.filter(s=>s.stuckEnd).length;
  console.log("   ", "stuck-ends "+pct(stuckN/N), "deals/game "+Object.entries(deals).map(([k,v])=>k+":"+(v/N).toFixed(2)).join(" "));
  console.log(name.padEnd(34), "approved "+pct(approved/N).padStart(6), " bankrupt "+pct(bankrupt/N).padStart(6), " mean MOIC "+mean(moic).toFixed(2), " median "+median(moic).toFixed(2), " P(MOIC>1) "+pct(moic.filter(x=>x>1).length/N), " mean peak $"+Math.round(mean(peaks))+"M", " yrs "+mean(res.map(s=>s.year)).toFixed(1), " mols "+mean(res.map(s=>s.molN)).toFixed(1), " own "+pct(mean(res.map(s=>s.own))));
  return res;
}
function quantiles(){
  const base={pick:{target:"gen",mod:"sm",area:"imm"}, maxMol:6, opt:2, biomarker:false, finance:["equity","rdfund","loan","partner","synth","outl"], levers:"suggested"};
  const pols=[base, Object.assign({},base,{biomarker:true}), Object.assign({},base,{outlAt:"p2"}), Object.assign({},base,{partnerAt:"p2"}),
    Object.assign({},base,{pick:{target:"gen",mod:"mab",area:"onc"},biomarker:true}), Object.assign({},base,{pick:{target:"gen",mod:"mab",area:"rare"},sellPRV:true}),
    Object.assign({},base,{pick:{target:"nov",mod:"sm",area:"cvm"}}), Object.assign({},base,{finance:["loan","equity","partner","synth","outl"]})];
  const m=[];
  pols.forEach((p,j)=>{ for(let i=0;i<1500;i++){ const S=playBot(p,50000+j*10000+i); m.push(S.end.moic); } });
  m.sort((a,b)=>a-b);
  const qs=[.1,.25,.5,.75,.9,.95,.99].map(p=>[p,m[Math.floor(p*m.length)]]);
  console.log("MOIC quantiles across mixed strategies:", qs.map(([p,v])=>`p${Math.round(p*100)}=${v.toFixed(2)}`).join(" "));
  return m;
}
module.exports={realism, peaks, bestLevers, playBot, botReport, irr, mulberry32, quantiles};
if(require.main===module){
  const what=process.argv[2]||"all";
  if(what==="all"||what==="realism") realism(+process.argv[3]||20000);
  if(what==="all"||what==="peaks"){ peaks(6000); peaks(6000,"licensee","suggested plan scaled to indication"); }
  if(what==="levers") bestLevers();
  if(what==="all"||what==="bots"){
    const base={pick:{target:"gen",mod:"sm",area:"imm"}, maxMol:6, opt:2, biomarker:false, finance:["equity","rdfund","loan","partner","synth","outl"], levers:"suggested"};
    console.log("\n== Full-game bots (4000 games each) ==");
    botReport("Default solo, equity+loans",base);
    botReport("Debt first",Object.assign({},base,{finance:["loan","equity","partner","synth","outl"]}));
    botReport("Biomarker + best levers",Object.assign({},base,{biomarker:true,levers:"best"}));
    botReport("Partner 50/50 at Phase II",Object.assign({},base,{partnerAt:"p2"}));
    botReport("Out-license at Phase II",Object.assign({},base,{outlAt:"p2"}));
    botReport("Out-license at preclinical",Object.assign({},base,{outlAt:"pre"}));
    botReport("R&D funding at Phase III",Object.assign({},base,{rdfund:true}));
    botReport("In-license Phase II assets",Object.assign({},base,{inlicense:true}));
    for(const a of ["onc","imm","cvm","rare"]) for(const m of ["sm","mab","adc"])
      botReport(`Area ${a}/${m} gen, biomarker, best`,Object.assign({},base,{pick:{target:"gen",mod:m,area:a},biomarker:true,levers:"best",sellPRV:true}),1500);
    botReport("Novel biology, imm sm",Object.assign({},base,{pick:{target:"nov",mod:"sm",area:"imm"}}));
  }
}
