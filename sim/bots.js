const s=require('./sim.js');
const base={pick:{target:'gen',mod:'sm',area:'imm'}, maxMol:8, opt:2, biomarker:false, finance:['equity','rdfund','loan','partner','synth','outl'], levers:'suggested'};
const N=3000;
const runs=[
 ['A. Take any molecule, equity first',base],
 ['B. Selective (market ≥0.8×), equity',Object.assign({},base,{minMkt:.8})],
 ['C. Selective + biomarker',Object.assign({},base,{minMkt:.8,biomarker:true})],
 ['D. Selective, debt first',Object.assign({},base,{minMkt:.8,finance:['loan','rdfund','equity','partner','synth','outl']})],
 ['E. Selective, 50/50 partner at Ph II',Object.assign({},base,{minMkt:.8,partnerAt:'p2'})],
 ['F. Selective, out-license at Ph II',Object.assign({},base,{minMkt:.8,outlAt:'p2'})],
 ['G. Selective, R&D funding at Ph III',Object.assign({},base,{minMkt:.8,rdfund:true})],
 ['H. Novel biology, selective',Object.assign({},base,{minMkt:.8,pick:{target:'nov',mod:'sm',area:'imm'}})],
 ['I. Oncology antibody, selective',Object.assign({},base,{minMkt:.8,pick:{target:'gen',mod:'mab',area:'onc'},biomarker:true})],
 ['J. Cardiometabolic, selective',Object.assign({},base,{minMkt:.8,pick:{target:'gen',mod:'sm',area:'cvm'}})],
 ['K. Rare antibody, selective',Object.assign({},base,{minMkt:.8,pick:{target:'gen',mod:'mab',area:'rare'},sellPRV:true})],
];
for(const [n,p] of runs) s.botReport(n,p,N);
s.quantiles();
