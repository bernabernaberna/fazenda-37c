/* Regressão dos pixels anteriores, fala expressiva, apoio e caches finitos.
   --baseline registra a arte v4 antes da alteração, para comparação independente. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/fala-v5'),source=fs.readFileSync(path.join(root,'src/modules/28-character-art.js'),'utf8');
fs.mkdirSync(out,{recursive:true});
const baselinePath=path.join(root,'tools/fixtures/fala-v4-pixels.json'),baselineMode=process.argv.includes('--baseline');
const report={date:new Date().toISOString(),sourceSHA256:createHash('sha256').update(source).digest('hex'),checks:[],errors:[]};
const check=(name,pass,evidence)=>report.checks.push({name,pass:!!pass,evidence});let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1200,height:850}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.setContent('<!doctype html><html lang="pt-BR"><body></body></html>');
 await page.evaluate(()=>{window._artCanvasAllocations=0;const Native=OffscreenCanvas;window.OffscreenCanvas=function(w,h){window._artCanvasAllocations++;return new Native(w,h);};window.OffscreenCanvas.prototype=Native.prototype;});
 await page.addScriptTag({content:source});
 const art=await page.evaluate(()=>{
  const base={x:48,y:52,gender:'m',hat:true,temp:37,dir:0,resting:false,restTimer:4,gaitBlend:0,gaitRunBlend:0,anim:0};
  const make=(actor={},opts={},npc=false)=>{const c=document.createElement('canvas');c.width=96;c.height=96;FarmCharacterArt[npc?'drawNPC':'drawPlayer'](c.getContext('2d'),{...base,...actor},{time:1000,...opts});return c;};
  const hash=(c,y0=0,y1=c.height)=>{const b=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=2166136261;for(let y=y0;y<y1;y++)for(let x=0;x<c.width;x++)for(let k=0;k<4;k++)h=Math.imul(h^b[(y*c.width+x)*4+k],16777619);return h>>>0;};
  const portrait=(id,opts={})=>{const c=document.createElement('canvas');c.width=96;c.height=96;FarmCharacterArt.drawPortrait(c,id,{time:1000,...opts});return c;};
  const previous={};for(const dir of [0,1,2,3]){
   previous['idle-'+dir]=hash(make({dir}));for(const running of [false,true])for(const f of [0,2,4,6,8,10,12,14])previous['gait-'+dir+'-'+running+'-'+f]=hash(make({dir,moving:true,gaitBlend:1,gaitRunBlend:Number(running),running,anim:f*Math.PI/8+.001}));
   for(const mode of ['sit','bed'])for(const restBlend of [0,.5,1])previous['rest-'+dir+'-'+mode+'-'+restBlend]=hash(make({dir,resting:true},{restMode:mode,restBlend,restElapsed:2}));
  }
  for(const id of FarmCharacterArt.keys){previous['npc-'+id]=hash(make({npcId:id}, {},true));previous['portrait-'+id]=hash(portrait(id));}
  for(const gender of ['m','f']){previous['hero-'+gender]=hash(make({gender}));previous['portrait-'+gender]=hash(portrait('player',{gender}));}
  for(const equip of ['coatEquipped','boots','scarf','glovesEquipped','blanketEquipped','towelTimer'])previous['equip-'+equip]=hash(make({[equip]:1}));
  const mouths=[],feet=[],expressions=[],reduced=[],cached=[],priority=[];
  for(const id of [...FarmCharacterArt.keys,'player']){
   const actor=id==='player'?{}:{npcId:id},npc=id!=='player',frames=[0,.12,.24,.6].map(speechTime=>make(actor,{speaking:true,speechTime,expression:'warm',gesture:'explain'},npc));
   mouths.push({id,hashes:frames.map(c=>hash(c,30,47))});feet.push({id,hashes:frames.map(c=>hash(c,57,66))});
   expressions.push({id,hashes:['warm','thoughtful','concerned','joyful'].map(expression=>hash(portrait(id,{speaking:true,speechTime:.24,expression,gesture:'explain'})))});
   reduced.push({id,hashes:[0,.12,.24,.6,1.2,3.4,4.7,8].map(speechTime=>hash(portrait(id,{speaking:true,speechTime,expression:'concerned',gesture:'explain',reducedMotion:true})))});
  }
  for(const dir of [0,1,2,3])for(const gesture of ['explain','invite','nod','listen']){
   feet.push({id:'hero-'+dir+'-'+gesture,hashes:[0,.12,.6,1.2,1.7,4.44].map(speechTime=>hash(make({dir},{speaking:true,speechTime,expression:'warm',gesture}),57,66))});
  }
  for(const resting of [true,false]){
   const actor=resting?{resting:true}:{dead:true};priority.push({mode:resting?'Repouso':'Morte',plain:hash(make(actor,{restBlend:1})),speaking:hash(make(actor,{restBlend:1,speaking:true,speechTime:.24,expression:'joyful',gesture:'invite'}))});
  }
  const warmTarget=document.createElement('canvas');warmTarget.width=96;warmTarget.height=96;const warmG=warmTarget.getContext('2d');
  const warmDraw=i=>{const opts={speaking:true,speechTime:i/60,expression:'thoughtful',gesture:'explain',time:1000};FarmCharacterArt.drawNPC(warmG,{...base,npcId:'tomas'},opts);FarmCharacterArt.drawPortrait(warmTarget,'tomas',opts);};
  warmDraw(0);const allocatedBefore=window._artCanvasAllocations,started=performance.now();for(let i=0;i<1200;i++)warmDraw(i);
  const warm={frames:1200,milliseconds:performance.now()-started,allocated:window._artCanvasAllocations-allocatedBefore};
  const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=826;const g=sheet.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#dce3cd';g.fillRect(0,0,sheet.width,sheet.height);g.fillStyle='#183b36';g.font='21px Segoe UI';g.fillText('Falando no Vale dos Três Ventos · expressões, boca e gestos autorais',18,29);
  for(const [row,id] of [...FarmCharacterArt.keys,'player'].entries()){
   g.fillStyle='#183b36';g.font='16px Segoe UI';g.fillText(FarmCharacterArt.definitions[id].name,14,81+row*105);
   for(const [column,speechTime] of [0,.12,.24,.6].entries()){
    const opts={speaking:true,speechTime,expression:['warm','thoughtful','concerned','joyful'][column],gesture:['explain','nod','listen','invite'][column]};
    g.drawImage(portrait(id,opts),143+column*248,45+row*105,84,84);
    g.drawImage(make(id==='player'?{}:{npcId:id},opts,id!=='player'),220+column*248,23+row*105,154,154);
   }
  }
  const warmStart=FarmCharacterArt.cacheInfo();for(let repeat=0;repeat<2;repeat++){
   for(let i=0;i<2400;i++){const id=FarmCharacterArt.keys[i%6],opts={speaking:true,speechTime:(i%83)/10,expression:['neutral','warm','thoughtful','concerned','joyful'][Math.floor(i/83)%5],gesture:['explain','invite','nod','listen'][Math.floor(i/415)%4],reducedMotion:i%31===0};make({npcId:id,dir:i%4},opts,true);portrait(id,opts);}
   cached.push(FarmCharacterArt.cacheInfo());
  }
  return{previous,mouths,feet,expressions,reduced,priority,warm,cache:{warmStart,cached},sheet:sheet.toDataURL()};
 });
 if(baselineMode){fs.writeFileSync(baselinePath,JSON.stringify({sourceSHA256:report.sourceSHA256,pixels:art.previous},null,2));console.log('Baseline v4: '+Object.keys(art.previous).length+' poses.');return;}
 const baseline=JSON.parse(fs.readFileSync(baselinePath,'utf8')),differences=Object.keys(baseline.pixels).filter(key=>baseline.pixels[key]!==art.previous[key]);
 check('Arte de repouso, equipamento, locomoção e retratos anteriores preservada pixel a pixel',differences.length===0,{cases:Object.keys(baseline.pixels).length,differences});
 check('Quatro bocas diferentes por morador e protagonista',art.mouths.every(x=>new Set(x.hashes).size===4),art.mouths);
 check('Fala não desloca pés nem contato com o chão',art.feet.every(x=>new Set(x.hashes).size===1),art.feet);
 check('Quatro emoções distintas no retrato de cada personagem',art.expressions.every(x=>new Set(x.hashes).size===4),art.expressions);
 check('Redução de movimento congela o retrato expressivo',art.reduced.every(x=>new Set(x.hashes).size===1),art.reduced);
 check('Repouso e morte mantêm prioridade sobre a fala',art.priority.every(x=>x.plain===x.speaking),art.priority);
 check('Avançar fala aquecida não aloca canvas por quadro',art.warm.allocated===0,art.warm);
 check('Caches têm limites explícitos de sprites, retratos e bancos de fala',art.cache.cached.every(x=>x.sprites<=x.maxSprites&&Number.isFinite(x.maxPortraits)&&x.portraits<=x.maxPortraits&&Number.isFinite(x.maxSpeechBanks)&&x.speechBanks<=x.maxSpeechBanks),art.cache);
 check('Sem erros JavaScript',report.errors.length===0,report.errors);
 fs.writeFileSync(path.join(out,'poses-fala-v5.png'),Buffer.from(art.sheet.split(',')[1],'base64'));report.capture='poses-fala-v5.png';
})().catch(e=>report.fatal=e.stack).finally(async()=>{if(browser)await browser.close();if(baselineMode)return;report.status=report.fatal||report.checks.some(c=>!c.pass)?'FALHA':'OK';fs.writeFileSync(path.join(out,'fala-arte-v5.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),fatal:report.fatal,capture:report.capture,sourceSHA256:report.sourceSHA256},null,2));if(report.status!=='OK')process.exitCode=1;});
