/* Contratos puros da arte V6.11. Canvas é um registrador de operações finitas;
   capturas reais e inspeção estética ficam na validação integrada do navegador. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),backup=process.env.FARM37_V611_BASELINE||path.resolve(root,'../backups/antes-vale-v611-20261020');
const out=path.join(root,'analise/atuacao-v614');fs.mkdirSync(out,{recursive:true});
const report={geradoEm:new Date().toISOString(),metodo:'VM sem DOM nem navegador; compara ações anteriores, instruções Canvas, estados e geometria.',checagens:[],limites:['Não avalia estética nem p95. Abrir capturas reais dos diálogos, mata, veredas e passarelas.']};
function check(nome,fn){const evidencia=fn();report.checagens.push({nome,passou:true,evidencia});}
function hash(value){return crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');}
function recorder(){
 const env={canvases:[],now:0};
 class Canvas{
  constructor(w,h){this.width=w;this.height=h;this.digest=2166136261;this.depth=0;this.draws=[];env.canvases.push(this);this.ctx=new Context(this);}
  getContext(){return this.ctx;}setAttribute(){}
 }
 class Context{
  constructor(c){this.canvas=c;this.fillStyle='';this.globalAlpha=1;this.globalCompositeOperation='source-over';this.stack=[];}
  op(kind,args){
   for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'Coordenada Canvas finita em '+kind);
   const text=kind+'|'+this.fillStyle+'|'+this.globalAlpha+'|'+this.globalCompositeOperation+'|'+args.map(x=>x instanceof Canvas?x.digest:x).join(',');
   let d=this.canvas.digest;for(let i=0;i<text.length;i++)d=Math.imul(d^text.charCodeAt(i),16777619)>>>0;this.canvas.digest=d;
  }
  save(){this.canvas.depth++;this.stack.push([this.fillStyle,this.globalAlpha,this.globalCompositeOperation]);this.op('save',[]);}
  restore(){assert.ok(this.canvas.depth>0,'restore tem save correspondente');this.op('restore',[]);this.canvas.depth--;[this.fillStyle,this.globalAlpha,this.globalCompositeOperation]=this.stack.pop();}
  fillRect(...args){this.op('fillRect',args);}clearRect(...args){this.op('clearRect',args);}
  translate(...args){this.op('translate',args);}scale(...args){this.op('scale',args);}setTransform(...args){this.op('setTransform',args);}
  drawImage(...args){this.op('drawImage',args);this.canvas.draws.push(args.slice(1));if(this.canvas.draws.length>4)this.canvas.draws.shift();}
 }
 env.Canvas=Canvas;env.context={window:{},OffscreenCanvas:Canvas,performance:{now:()=>env.now},Math,Number,Object,Map,Set};
 vm.createContext(env.context);return env;
}
function art(filename){const env=recorder();vm.runInContext(fs.readFileSync(filename,'utf8'),env.context,{filename});env.art=env.context.window.FarmCharacterArt;return env;}
const copy=value=>JSON.parse(JSON.stringify(value));
try{
 const source=path.join(root,'src/modules/28-character-art.js'),before=art(path.join(backup,'src/modules/28-character-art.js')),current=art(source),A=current.art;
 report.sourceSHA256=hash(fs.readFileSync(source,'utf8'));
 check('Ações mantêm direção e quadros; pixel art renovada intencionalmente',()=>{
  let total=0,changed=0;for(const kind of before.art.actionKinds)for(let dir=0;dir<4;dir++)for(let f=0;f<12;f++){
   const actor={x:80,y:90,dir,gender:'f',hat:true,actionType:kind,actionTimer:1,anim:0},opts={time:1000,actionProgress:(f+.1)/12,actionTarget:{x:80+(dir===1?-26:dir===2?26:0),y:100+(dir===3?-26:dir===0?26:0)}};
   assert.deepEqual(copy(A.actionInfo(actor,opts)),copy(before.art.actionInfo(actor,opts)));
   const old=new before.Canvas(200,180),now=new current.Canvas(200,180);before.art.drawPlayer(old.ctx,actor,opts);A.drawPlayer(now.ctx,actor,opts);
   if(now.digest!==old.digest)changed++;total++;
  }assert.ok(changed>0,'Arte das acoes foi renovada');return{quadros:total,renovados:changed};
 });
 check('Nove moradores articulam, fazem pausas e mantêm os pés ancorados',()=>{
  const rows=[];for(const id of A.keys){const actor={npcId:id,x:80,y:90,dir:0,moving:false,anim:0},mouths=new Set(),phases=new Set();let closed=0;
   for(let i=0;i<160;i++){const pose=A.actingInfo(actor,{time:i*50,speechTime:i*.05,speaking:true,expression:'warm',gesture:'explain'});mouths.add(pose.mouth);phases.add(pose.phase);if(!pose.mouth)closed++;assert.equal(pose.feetOffsetY,10);assert.equal(pose.moving,false);}
   assert.equal(mouths.size,4);assert.equal(phases.size,4);assert.ok(closed>30&&closed<140);rows.push({id,bocas:mouths.size,pausas:closed});
  }return rows;
 });
 check('Escuta permanece de boca fechada e tem acenos esparsos',()=>{
  const actor={npcId:'nico',x:0,y:0,dir:0},poses=Array.from({length:200},(_,i)=>A.actingInfo(actor,{time:i*50,speechTime:i*.05,speaking:true,gesture:'listen'}));
  assert.ok(poses.every(p=>p.mouth===0));assert.ok(poses.some(p=>p.phase>0));assert.ok(poses.filter(p=>p.phase===0).length>140);return{amostras:poses.length,emRepouso:poses.filter(p=>!p.phase).length};
 });
 check('Expressões sem gesto explícito recebem postura coerente e não aleatória',()=>{
  const actor={npcId:'lia'};for(const [expression,gesture]of [['warm','reassure'],['thoughtful','reflect'],['joyful','invite'],['resolved','explain']])assert.equal(A.actingInfo(actor,{expression,speaking:true,time:800,speechTime:.8}).gesture,gesture);
 });
 check('Reduzir movimento congela boca, olhos, gestos, respiração e retrato',()=>{
  let total=0;for(const id of A.keys)for(const gesture of ['explain','listen','reflect']){
   const actor={npcId:id,x:0,y:0,dir:0},opts={reducedMotion:true,speaking:true,gesture,expression:'thoughtful',gaze:1};
   const p=A.actingInfo(actor,{...opts,time:0,speechTime:0});assert.equal(p.mouth,0);assert.equal(p.phase,0);assert.equal(p.breath,0);
   assert.deepEqual(copy(A.actingInfo(actor,{...opts,time:48721,speechTime:48.721})),copy(p));
   const c1=new current.Canvas(96,96),c2=new current.Canvas(96,96);A.drawPortrait(c1,id,{...opts,time:0,speechTime:0});A.drawPortrait(c2,id,{...opts,time:48721,speechTime:48.721});assert.equal(c1.digest,c2.digest);total++;
  }return{combinacoes:total};
 });
 check('Respiração ociosa tem dois estados; fala e passada não arrastam âncoras',()=>{
  const actor={npcId:'rosa',x:74,y:65,dir:2},states=new Set();
  for(let i=0;i<70;i++){const opts={time:i*100},pose=A.actingInfo(actor,opts);states.add(pose.breath);const c=new current.Canvas(180,160);A.drawNPC(c.ctx,actor,opts);assert.deepEqual(c.draws.at(-1),[50,37]);}
  assert.deepEqual([...states].sort(),[0,1]);assert.equal(A.actingInfo({...actor,moving:true,gaitBlend:1},{time:2200}).breath,0);
 });
 check('Bancos de fala, retratos e sprites permanecem nos limites após variedade de poses',()=>{
  const target=new current.Canvas(96,96),g=new current.Canvas(200,160).ctx;
  for(let i=0;i<1100;i++){
   const id=A.keys[i%A.keys.length],opts={time:i*53,speechTime:i*.053,gesture:A.gestures[i%A.gestures.length],expression:A.expressions[i%A.expressions.length],speaking:true,gaze:(i%3)-1};
   A.drawNPC(g,{npcId:id,x:60,y:70,dir:i%4,moving:false},opts);A.drawPortrait(target,id,opts);
   A.drawNPC(g,{npcId:id,x:60,y:70,dir:i%4,moving:true,anim:i*.2,gaitBlend:(i%9)/8,gaitRunBlend:(i%8)/7},{time:i*53});
  }
  const c=A.cacheInfo();assert.ok(c.sprites<=768&&c.portraits<=256&&c.speechBanks<=48);return copy(c);
 });
 check('Todas as chamadas Canvas foram finitas e save/restore equilibrados',()=>{
  assert.ok(current.canvases.every(c=>c.depth===0));assert.ok(before.canvases.every(c=>c.depth===0));return{telasInstrumentadas:current.canvases.length+before.canvases.length};
 });
 function world(filename){
  const env=recorder(),drawers={},types=['GRASS','GRASS2','FLOWER','PATH','FIELD','WATER','RIVER','OASIS','SNOW','ICE','SAND','DUNE','CRACKED','STONE','SNOWROCK','COBBLE','FENCE','WOOD'],T=Object.fromEntries(types.map((t,i)=>[t,i]));
  const main={MW:60,MH:124,map:Array.from({length:124},(_,y)=>Array(60).fill(y<34?T.SNOW:T.GRASS)),objects:[]};
  const API={T,TS:16,rawScene:'main',tileAt:(x,y)=>main.map[y]?.[x],registerTileDrawer:(t,fn)=>drawers[t]=fn,registerObjectDrawer:()=>{},drawBaseTile:()=>{},isFrio:()=>false};
  vm.runInContext(fs.readFileSync(filename,'utf8'),env.context,{filename});env.context.window.__farmBiomes[0](API);const W=env.context.window.FarmOpenWorld;W.expand(main);return{env,T,main,W,API,drawers};
 }
 const oldWorld=world(path.join(backup,'src/modules/43-open-world.js')),newWorld=world(path.join(root,'src/modules/43-open-world.js'));
 check('Arte dos biomas não altera tiles, rotas, objetos, posições ou gradiente',()=>{
  assert.equal(hash(oldWorld.main),hash(newWorld.main));
  for(let y=0;y<124;y+=.5)for(let x=59;x<96;x+=.5)assert.deepEqual(copy(newWorld.W.blendWeights(x,y,[['farm',1]])),copy(oldWorld.W.blendWeights(x,y,[['farm',1]])));
  return{mundoSHA256:hash(newWorld.main),largura:newWorld.main.MW,altura:newWorld.main.MH};
 });
 check('Detalhes da mata e vereda são determinísticos, limitados e não pintam interiores',()=>{
  const w=newWorld,before=hash(w.main);let draws=0;
  for(let y=0;y<124;y++)for(let x=0;x<96;x++){
   const t=w.main.map[y][x],c1=new w.env.Canvas(16,16),c2=new w.env.Canvas(16,16);
   w.W.drawTerrainDetails(c1.ctx,0,0,x,y,t,false);w.W.drawTerrainDetails(c2.ctx,0,0,x,y,t,false);assert.equal(c1.digest,c2.digest);if(c1.digest!==2166136261)draws++;
   if(x<60||y<28||![w.T.GRASS,w.T.GRASS2].includes(t))assert.equal(c1.digest,2166136261);
  }
  w.API.rawScene='house';const inside=new w.env.Canvas(16,16);w.W.drawTerrainDetails(inside.ctx,0,0,78,58,w.T.GRASS,false);assert.equal(inside.digest,2166136261);w.API.rawScene='main';assert.equal(hash(w.main),before);return{tilesElegiveis:draws};
 });
 check('Passarelas têm orientação por seção e metadados não crescem ao redesenhar',()=>{
  const w=newWorld,c=w.W.artInfo();assert.ok(c.bridgeSections>0&&c.bridgeTiles>0&&c.bridgeTiles<96*124);
  const before=hash(w.main);for(let round=0;round<3;round++)for(let y=0;y<124;y++)for(let x=60;x<96;x++)if(w.main.map[y][x]===w.T.WOOD){const a=new w.env.Canvas(16,16),b=new w.env.Canvas(16,16);w.drawers[w.T.WOOD](a.ctx,0,0,x,y);w.drawers[w.T.WOOD](b.ctx,0,0,x,y);assert.equal(a.digest,b.digest);}
  assert.deepEqual(copy(w.W.artInfo()),copy(c));assert.equal(hash(w.main),before);return copy(c);
 });
 report.passou=true;
}catch(error){report.passou=false;report.erro=error.stack;process.exitCode=1;}
fs.writeFileSync(path.join(out,'contratos.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
