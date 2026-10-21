/* Arte original do curral: regressão contra V6.13, pés em apoio e raster
   do Canvas real. Os atlas ainda exigem inspeção visual. Não altera o jogo. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/animais-art-v614');fs.mkdirSync(out,{recursive:true});
const file=path.join(root,'src/modules/32-animal-life.js'),source=fs.readFileSync(file,'utf8'),baseline=fs.readFileSync(path.resolve(root,'../backups/antes-personagens-v614-20261020/src/modules/32-animal-life.js'),'utf8');
const checks=[],hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const check=(name,pass,evidence)=>{assert.ok(pass,name);checks.push({nome:name,passou:true,evidencia:evidence});};
function context(text){
 const noop=()=>{},s={window:{},document:{createElement:()=>{const c={width:64,height:64},g={save:noop,restore:noop,translate:noop,scale:noop,beginPath:noop,moveTo:noop,lineTo:noop,closePath:noop,fill:noop,stroke:noop,ellipse:noop,fillRect:noop,drawImage:noop};c.getContext=()=>g;return c;}},motionOk:()=>true};
 vm.runInNewContext(text.replace('window.FarmAnimalLife={','window.__animalArtTest={foot,leg,sprite};window.FarmAnimalLife={'),s,{filename:file});return {life:s.window.FarmAnimalLife,test:s.window.__animalArtTest};
}
const now=context(source),old=context(baseline),kinds=['cow','sheep','chicken'];
const physics=s=>s.slice(s.indexOf(' const kindOf='),s.indexOf(' function foot('));
check('Física, IA, contato, cuidado e taxas de saciedade são textualmente idênticos à V6.13',physics(source)===physics(baseline),hash(physics(source)));
for(const kind of kinds){
 const a={type:'animal',kind,x:70,y:70,well:.85},b={...a},pen={type:'pen',x:0,y:0,w:160,h:160};now.life.reset();old.life.reset();
 for(let i=0;i<1400;i++){
  const c={timeOfDay:i<300?12:i<700?22:6,cold:i>1000,reducedMotion:i>1100,player:{x:i<800?200:40,y:70,moving:i>800&&i<1000,dir:2}};
  if([80,520,850].includes(i)){const action=i===80?'feed':i===520?'pet':'shear';now.life.react(a,action,c.player);old.life.react(b,action,c.player);}
  now.life.update(1/60,[pen,a],c);old.life.update(1/60,[pen,b],c);assert.equal(JSON.stringify(a),JSON.stringify(b),kind+': trajetória e estados legados');
 }
 check(kind+': 1.400 frames mantêm posições, alvo, fome, crescimento, pausa e reações anteriores',true);
 const cycle=now.life.info().cycle[kind],support=[];
 for(let i=0;i<1000;i++){
  const t=i/1000,p=now.test.foot(t*Math.PI*2,0,cycle*.32,2.2);
  if(t<.635){const q=now.test.foot((t+.001)*Math.PI*2,0,cycle*.32,2.2);assert.ok(Math.abs((q.x-p.x)+cycle*.001)<1e-9,'Pé em apoio cancela avanço do corpo');}
  const offsets=kind==='chicken'?[0,.5]:[0,.25,.5,.75];support.push(offsets.filter(offset=>now.test.foot(t*Math.PI*2,offset,cycle*.32,2.2).up===0).length);
 }
 check(kind+': apoio recua pela distância do corpo; sempre há pelo menos '+(kind==='chicken'?1:2)+' pés apoiados',Math.min(...support)>=(kind==='chicken'?1:2),{min:Math.min(...support),max:Math.max(...support),cycle});
 for(const dir of [0,3]){const sign=dir===3?-1:1,positions=[];for(let f=0;f<20;f++){const rects=[],g={beginPath(){},moveTo(){},lineTo(){},stroke(){},fillRect(...r){rects.push(r);}};const t=.05+f*.02;now.test.leg(g,0,-12,t*Math.PI*2,0,false,kind,false,1,0,sign);positions.push(rects[0][1]+sign*t*cycle);}check(kind+': casco no mesmo ponto mundial ao andar para '+(dir===3?'cima':'baixo'),Math.max(...positions)-Math.min(...positions)<=1.01,{min:Math.min(...positions),max:Math.max(...positions)});}
 const a0={type:'animal',kind,x:60,y:60,moving:true,animalBlend:1,animalPhase:0,animalClock:1,animalActivity:'graze',animalGraze:8};
 const frozen=[];for(let i=0;i<30;i++){a0.animalPhase=i;a0.animalClock=i;frozen.push(JSON.stringify(now.life.visualState(a0,true)));}
 check(kind+': reduzir movimento congela pernas, mastigação, respiração e cauda',new Set(frozen).size===1);
 const a1={type:'animal',kind,x:70,y:70,well:.8};now.life.reset();const duration={pet:1.6,feed:1.8,shear:1.2};
 for(const action of Object.keys(duration)){now.life.react(a1,action,{x:50,y:70});const s=now.life.snapshot(a1);check(kind+': '+action+' preserva duração e pés parados',s.reactionRemaining===duration[action]&&a1.x===70&&a1.y===70,s);}
}
check('Animação usa 24 poses vinculadas à distância',now.life.info().poses===24,now.life.info());
let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1536,height:1200},deviceScaleFactor:1});
 await page.setContent('<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#213d36}canvas{display:block;image-rendering:pixelated}</style><canvas id="atlas"></canvas>');
 await page.addScriptTag({content:baseline});await page.evaluate(()=>window.AnimalBaseline=FarmAnimalLife);await page.addScriptTag({content:source});
 const result=await page.evaluate(()=>{
  const kinds=['cow','sheep','chicken'],dirs=[0,1,2,3],poses=['parado','caminhando','pastando','carinho','descansando','tosquiado'];
  const canvas=document.getElementById('atlas'),g=canvas.getContext('2d');canvas.width=1536;canvas.height=2304;g.imageSmoothingEnabled=false;g.fillStyle='#263f36';g.fillRect(0,0,canvas.width,canvas.height);g.font='17px sans-serif';g.fillStyle='#eee8ca';g.fillText('Animais V6.14 · cima: V6.13 / baixo: V6.14 · frente / esquerda / direita / costas',20,25);
  let clipped=0,empty=0,immutable=true,integer=true,alphaEdges=0;const signatures={};
  const ops=['fillRect','translate','drawImage'];const original=document.createElement.bind(document);
  document.createElement=(tag,...args)=>{const c=original(tag,...args);if(tag==='canvas'){const gc=c.getContext.bind(c);c.getContext=(...a)=>{const ctx=gc(...a);for(const op of ops){const f=ctx[op].bind(ctx);ctx[op]=(...xs)=>{for(const n of xs)if(typeof n==='number'&&!Number.isInteger(n))integer=false;return f(...xs);};}return ctx;};}return c;};
  function animal(kind,dir,pose,t=0){return{type:'animal',kind,x:0,y:0,dir,well:.85,animalClock:t,animalPhase:t*Math.PI*2,animalBlend:pose==='caminhando'?1:0,moving:pose==='caminhando',animalGraze:pose==='pastando'?9:0,animalActivity:pose==='descansando'?'rest':pose==='pastando'?(kind==='chicken'?'peck':'graze'):'look',animalRest:pose==='descansando'?1:0,shorn:pose==='tosquiado'&&kind==='sheep'};}
  for(let k=0;k<3;k++)for(let d=0;d<4;d++)for(let p=0;p<6;p++){
   const x=p*256,y=42+(k*4+d)*188;g.fillStyle=p%2?'#768260':'#819069';g.fillRect(x,y,254,186);g.fillStyle='#243f35';g.font='12px sans-serif';g.fillText(kinds[k]+' '+dirs[d]+' · '+poses[p],x+7,y+13);
   for(let version=0;version<2;version++){
    const api=version?FarmAnimalLife:AnimalBaseline,a=animal(kinds[k],dirs[d],poses[p],.32);if(poses[p]==='carinho'){api.react(a,'pet',{x:dirs[d]===1?-20:dirs[d]===2?20:0,y:dirs[d]===3?-20:dirs[d]===0?20:0});const pen={type:'pen',x:-100,y:-100,w:200,h:200};for(let n=0;n<30;n++)api.update(1/60,[pen,a],{timeOfDay:12});}
    g.save();g.translate(x+128,y+80+version*86);g.scale(2,2);api.draw(g,a,{reducedMotion:false});g.restore();
   }
  }
  const scratch=original('canvas');scratch.width=128;scratch.height=128;const sg=scratch.getContext('2d');
  for(const kind of kinds)for(const dir of [0,1,2,3])for(const pose of poses)for(let f=0;f<24;f++){
   const a=animal(kind,dir,pose,f/24),before=JSON.stringify(a);sg.clearRect(0,0,128,128);FarmAnimalLife.draw(sg,a,{x:64,y:64,reducedMotion:false});if(JSON.stringify(a)!==before)immutable=false;
   const data=sg.getImageData(0,0,128,128).data;let minX=128,minY=128,maxX=-1,maxY=-1,count=0;
   for(let y=0;y<128;y++)for(let x=0;x<128;x++){const alpha=data[(y*128+x)*4+3];if(alpha){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}if(alpha>0&&alpha<255)alphaEdges++;}
   if(!count)empty++;if(minX<=34||maxX>=94||minY<=22||maxY>=82)clipped++;
   let signature=2166136261;for(let i=0;i<data.length;i++)signature=Math.imul(signature^data[i],16777619);(signatures[kind+':'+dir+':'+pose]??=new Set()).add(signature>>>0);
  }
  const warm=[];for(let pass=0;pass<3;pass++){for(const kind of kinds)for(const dir of [0,1,2,3])for(let f=0;f<192;f++){const a=animal(kind,dir,'caminhando',f/24);FarmAnimalLife.draw(sg,a,{x:64,y:64,reducedMotion:false});}warm.push(FarmAnimalLife.info());}
  return {clipped,empty,immutable,integer,alphaEdges,cache:warm,movingVariety:Object.fromEntries(Object.entries(signatures).filter(([key])=>key.includes('caminhando')).map(([key,value])=>[key,value.size]))};
 });
 check('3 espécies × 4 vistas × 6 atividades × 24 momentos preservam contorno dentro do sprite',result.clipped===0&&result.empty===0,{clipped:result.clipped,empty:result.empty});
 check('Desenho não altera o animal e operações de sprite usam pixels inteiros',result.immutable&&result.integer,result);
 check('Cada espécie e direção tem pelo menos 12 silhuetas de caminhada distintas',Object.values(result.movingVariety).every(n=>n>=12),result.movingVariety);
 check('Cache permanece no teto de 768 sprites ao revisitar ciclos',result.cache.every(v=>v.cache<=768)&&result.cache[1].cache===result.cache[2].cache,result.cache);
 const atlas=path.join(out,'atlas-comparativo.png');await page.locator('#atlas').screenshot({path:atlas});
 await page.setViewportSize({width:1536,height:2400});for(let k=0;k<3;k++)await page.screenshot({path:path.join(out,'atlas-'+kinds[k]+'.png'),clip:{x:0,y:42+k*4*188,width:1536,height:752}});
 await page.evaluate(()=>{const c=document.getElementById('atlas'),g=c.getContext('2d');c.width=1536;c.height=604;g.fillStyle='#7b8963';g.fillRect(0,0,c.width,c.height);g.fillStyle='#233c35';g.font='18px sans-serif';g.fillText('24 fases · passada por distância · pés no nível da linha',16,25);for(let k=0;k<3;k++)for(let f=0;f<24;f++){const x=(f%12)*128+64,y=100+k*168+Math.floor(f/12)*80;g.fillStyle='#abb991';g.fillRect(x-62,y+(k===2?10:16),124,1);g.save();g.translate(x,y);g.scale(2,2);FarmAnimalLife.draw(g,{type:'animal',kind:['cow','sheep','chicken'][k],x:0,y:0,dir:2,well:.85,animalPhase:f*Math.PI*2/24,animalBlend:1,moving:true,animalClock:0},{reducedMotion:false});g.restore();}});
 const strip=path.join(out,'passadas-24-fases.png');await page.locator('#atlas').screenshot({path:strip});
 if(process.env.FARM37_CAPTURE_GIF_FRAMES==='1'){
  const frames=path.join(out,'quadros');fs.mkdirSync(frames,{recursive:true});for(const kind of kinds)for(let frame=0;frame<24;frame++){
   const data=await page.evaluate(({kind,frame})=>{const c=document.getElementById('atlas'),g=c.getContext('2d');c.width=704;c.height=328;g.imageSmoothingEnabled=false;g.fillStyle='#819069';g.fillRect(0,0,c.width,c.height);g.font='16px sans-serif';g.fillStyle='#233c35';g.fillText(kind+' · pé em apoio acompanha o chão',14,21);const cycle=FarmAnimalLife.info().cycle[kind];for(let version=0;version<2;version++){const y=136+version*145;g.fillStyle='#adb591';g.fillRect(0,y+(kind==='chicken'?20:32),704,2);g.fillStyle='#657654';for(let n=-1;n<25;n++)g.fillRect(Math.round(n*32-frame*cycle/24*4),y+(kind==='chicken'?24:36),8,2);g.fillStyle='#233c35';g.fillText(version?'V6.14':'V6.13',14,y-102);g.save();g.translate(352,y);g.scale(4,4);(version?FarmAnimalLife:AnimalBaseline).draw(g,{type:'animal',kind,x:0,y:0,dir:2,well:.85,animalPhase:frame*Math.PI*2/24,animalBlend:1,moving:true,animalClock:0},{reducedMotion:false});g.restore();}return c.toDataURL('image/png').split(',')[1];},{kind,frame});fs.writeFileSync(path.join(frames,kind+'-'+String(frame).padStart(2,'0')+'.png'),Buffer.from(data,'base64'));
  }
 }
 fs.writeFileSync(path.join(out,'vm-raster.json'),JSON.stringify({geradoEm:new Date().toISOString(),sourceSHA256:hash(source),baselineSHA256:hash(baseline),checks,raster:result,atlas,strip,limites:['Canvas isolado com poses preparadas; inspeção visual não equivale a uma partida.','Sombras elípticas têm antialiasing; a anatomia usa operações inteiras e vizinho mais próximo.']},null,2));
 console.log(JSON.stringify({ok:true,checks:checks.length,sourceSHA256:hash(source),atlas,strip}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
