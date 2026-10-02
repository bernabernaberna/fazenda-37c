/* Locomoção: examina o desenho real dos pés/mãos, não só número de frames.
   A captura contínua chama update/render do jogo com teclas reais. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/movimento-mapa-v3'),label=process.env.MOVIMENTO_LABEL||'atual';fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),mode:process.env.MOVIMENTO_SOURCE==='1'?'Fonte28 injetada':'Build integrada',checks:[],captures:[],errors:[]};let b;
(async()=>{b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>report.errors.push(e.message));
 await p.addInitScript(()=>{window.__qaRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});
 const response=await p.goto((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=movimento-v3-'+Date.now());report.sha256=createHash('sha256').update(await response.body()).digest('hex');
 const src=fs.readFileSync(path.join(root,'src/modules/28-character-art.js'),'utf8');report.sourceSHA256=createHash('sha256').update(src).digest('hex');if(process.env.MOVIMENTO_SOURCE==='1')await p.addScriptTag({content:src});
 const result=await p.evaluate(()=>{
  const recordings=new WeakMap(),P=OffscreenCanvasRenderingContext2D.prototype,oldRect=P.fillRect,oldImage=P.drawImage;
  P.fillRect=function(x,y,w,h){let record=recordings.get(this.canvas);if(!record){record={feet:[],hands:[]};recordings.set(this.canvas,record);}const color=this.fillStyle,m=this.getTransform();
   if(color==='#705348'&&w===4&&h===3)record.feet.push({x:x+m.e,y:y+m.f});
   if(color==='#d2a17b'&&w===2&&h===2)record.hands.push({x:x+m.e,y:y+m.f});return oldRect.call(this,x,y,w,h);};
  P.drawImage=function(img,...args){const record=recordings.get(img);if(record)recordings.set(this.canvas,{feet:[...record.feet],hands:[...record.hands]});return oldImage.call(this,img,...args);};
  const rows=[],sheets=[];try{for(const running of [false,true]){
   const sheet=document.createElement('canvas');sheet.width=1216;sheet.height=492;const g=sheet.getContext('2d');g.fillStyle='#dce3cd';g.fillRect(0,0,sheet.width,sheet.height);g.fillStyle='#183b36';g.font='20px Segoe UI';g.fillText((running?'Corrida':'Caminhada')+' real · direita e esquerda · 16 fases',20,28);const measures=[];
   for(const dir of [2,1])for(let f=0;f<16;f++){
    const c=document.createElement('canvas');c.width=64;c.height=66;const ctx=c.getContext('2d'),old=ctx.drawImage;let trace;
    ctx.drawImage=function(img,...args){trace=recordings.get(img);return old.call(this,img,...args);};
    FarmCharacterArt.drawPlayer(ctx,{x:32,y:40,gender:'m',hat:false,dir,moving:true,running,anim:f*Math.PI/8+.001,temp:37},{time:1000});
    if(dir===2)measures.push({f,feet:trace?.feet||[],hands:trace?.hands||[]});
    g.imageSmoothingEnabled=false;const col=f%8,row=Math.floor(f/8)+(dir===1?2:0);g.drawImage(c,12+col*150,28+row*114,128,132);g.fillStyle='#183b36';g.font='10px Segoe UI';g.fillText(String(f),15+col*150,145+row*114);
   }
   const points=measures.filter(x=>x.feet.length>=2&&x.hands.length>=2),a=FarmCharacterArt.anchor;
   const widths=points.map(x=>Math.abs(x.feet[1].x-x.feet[0].x)+4),reach=points.map(x=>Math.hypot(x.feet[1].x-a.x+3,x.feet[1].y-a.y+9));
   const jumps=points.map((x,i)=>Math.abs(x.feet[1].x-points[(i+1)%points.length].feet[1].x));
   const foot=points.map(x=>x.feet[1].x),hand=points.map(x=>x.hands[1].x),avg=a=>a.reduce((s,x)=>s+x,0)/a.length,mf=avg(foot),mh=avg(hand);
   const covariance=avg(foot.map((x,i)=>(x-mf)*(hand[i]-mh))),correlation=covariance/Math.sqrt(avg(foot.map(x=>(x-mf)**2))*avg(hand.map(x=>(x-mh)**2)));
   const contact=points.slice(0,running?6:8),stride=running?32:24;
   const plantedX=contact.map(x=>x.feet[1].x+x.f*stride/16),plantedY=contact.map(x=>x.feet[1].y);
   rows.push({running,samples:points.length,maxFootSpan:Math.max(...widths),maxReach:Math.max(...reach),maxFrameJump:Math.max(...jumps),armFootCorrelation:correlation,stanceDrift:Math.max(...plantedX)-Math.min(...plantedX),stanceHeightRange:Math.max(...plantedY)-Math.min(...plantedY),measures});sheets.push({name:running?'corrida':'caminhada',url:sheet.toDataURL()});
  }}finally{P.fillRect=oldRect;P.drawImage=oldImage;}
  return{rows,sheets};
 });
 report.geometry=result.rows;for(const row of result.rows){const name=row.running?'Corrida':'Caminhada';report.checks.push({name:name+': pés não abrem tesoura desproporcional',pass:row.samples===16&&row.maxFootSpan<=(row.running?17:15),value:row.maxFootSpan});report.checks.push({name:name+': alcance compatível com perna de 9px',pass:row.maxReach<=10.6,value:row.maxReach});report.checks.push({name:name+': pé avança até 2px por fase',pass:row.maxFrameJump<=2,value:row.maxFrameJump});report.checks.push({name:name+': braço contrabalança a perna do mesmo lado',pass:row.armFootCorrelation<-.4,value:row.armFootCorrelation});report.checks.push({name:name+': planta mantém apoio no ciclo 24/32px',pass:row.stanceDrift<=1&&row.stanceHeightRange===0,drift:row.stanceDrift,heightRange:row.stanceHeightRange});}
 for(const s of result.sheets){const name='animacoes-'+label+'-'+s.name+'.png';fs.writeFileSync(path.join(out,name),Buffer.from(s.url.split(',')[1],'base64'));report.captures.push(name);}
 const supporting=await p.evaluate(()=>{
  const make=(actor,opts={},npc=false)=>{const c=document.createElement('canvas');c.width=60;c.height=58;FarmCharacterArt[npc?'drawNPC':'drawPlayer'](c.getContext('2d'),{x:30,y:38,gender:'m',hat:true,temp:37,dir:2,...actor},{time:1000,...opts});return c;};
  const hash=c=>{let h=2166136261;for(const v of c.getContext('2d').getImageData(0,0,c.width,c.height).data)h=Math.imul(h^v,16777619);return h>>>0;};
  const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=1030;const g=sheet.getContext('2d');g.fillStyle='#dce3cd';g.fillRect(0,0,sheet.width,sheet.height);g.imageSmoothingEnabled=false;g.font='18px Segoe UI';g.fillStyle='#183b36';g.fillText('Frente/costas · caminhar e correr · fases 0 a 15',16,25);
  let group=0;for(const running of [false,true])for(const dir of [0,3]){for(let f=0;f<16;f++){const row=group*2+Math.floor(f/8),col=f%8;g.drawImage(make({dir,moving:true,running,anim:f*Math.PI/8+.001}),8+col*148,32+row*122,120,116);}group++;}
  const actions=[];for(const actionType of ['water','plant','harvest','work'])for(const dir of [0,1,2,3]){const frames=[];for(let i=0;i<8;i++)frames.push(hash(make({dir,actionTimer:.34-i*.04,actionType})));actions.push({actionType,dir,unique:new Set(frames).size});}
  const npcs=FarmCharacterArt.keys.map(npcId=>({npcId,unique:new Set([0,Math.PI/2,Math.PI,Math.PI*1.5].map(anim=>hash(make({npcId,moving:true,anim}, {},true)))).size}));
  const plain=hash(make({hat:false})),equipment=['hat','coatEquipped','scarf','boots','glovesEquipped','blanketEquipped'].map(key=>({key,changes:hash(make({hat:false,[key]:true}))!==plain}));
  const reduced=new Set([0,1,2,3,4,5].map(anim=>hash(make({moving:true,running:true,anim},{reducedMotion:true})))).size;
  return{url:sheet.toDataURL(),actions,npcs,equipment,reduced};
 });
 const frontal='animacoes-'+label+'-frente-costas.png';fs.writeFileSync(path.join(out,frontal),Buffer.from(supporting.url.split(',')[1],'base64'));report.captures.push(frontal);delete supporting.url;report.supporting=supporting;
 report.checks.push({name:'Quatro ações continuam visíveis nas quatro direções',pass:supporting.actions.every(a=>a.unique>=4)});
 report.checks.push({name:'Seis moradores mantêm locomoção própria',pass:supporting.npcs.every(a=>a.unique>=3)});
 report.checks.push({name:'Seis equipamentos continuam visíveis',pass:supporting.equipment.every(a=>a.changes)});
 report.checks.push({name:'Redução de movimento mantém a figura estável',pass:supporting.reduced===1});
 // Documento fresco evita que leitura/instrumentação de canvas contamine o filme.
 const fresh=await p.reload();report.videoSHA256=createHash('sha256').update(await fresh.body()).digest('hex');if(process.env.MOVIMENTO_SOURCE==='1')await p.addScriptTag({content:src});
 report.checks.push({name:'Build não mudou entre geometria e gameplay',pass:report.videoSHA256===report.sha256});
 await p.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;FarmStoryUI.close();A11Y.noDeath=true;A11Y.relaxed=true;currentWeather=null;weatherCooldown=1e8;currentSeason='hot';timeOfDay=11;player.x=18*TS+8;player.y=59*TS+8;player.temp=37;player.hyd=100;player.en=100;player.anim=0;player.actionTimer=0;_camSnap=true;});
 if(process.env.MOVIMENTO_VIDEO==='1'){
  const movie=await p.evaluate(async()=>{const c=document.getElementById('game'),stream=c.captureStream(60),chunks=[],r=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:2500000});r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const ended=new Promise(resolve=>{r.onstop=()=>{const f=new FileReader();f.onloadend=()=>resolve(f.result);f.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});const frames=[];r.start();window.__movementRecorder=r;window.__movementFrames=frames;window.__movementEnded=ended;window.__movementStream=stream;return true;});
  const trace=[];
  // update usa o intervalo REAL de cada RAF do navegador. Teclado entra pelo
  // Playwright; não há teleportes nem alteração da fase durante o percurso.
  for(const [key,run,duration] of [['d',false,1600],['',false,260],['a',true,1200],['',false,260],['w',false,1100],['s',true,850],['',false,350]]){
   if(key)await p.keyboard.down(key);if(run)await p.keyboard.down('Shift');
   const segment=await p.evaluate(({duration,key,run})=>new Promise(resolve=>{
    const trace=[],start=performance.now();let previous=start,capture=0;
    const marks=key?[240,480,720]:[20,100,220];
    function tick(now){const dt=Math.min(.05,Math.max(0,(now-previous)/1000));previous=now;update(dt);render();
     trace.push({ms:now-start,key,run,x:player.x,y:player.y,dir:player.dir,anim:player.anim,moving:player.moving,running:player.running,gaitBlend:player.gaitBlend,gaitRunBlend:player.gaitRunBlend});
     if(capture<marks.length&&now-start>=marks[capture]){capture++;__movementFrames.push({n:__movementFrames.length,key,run,ms:now-start,url:document.getElementById('game').toDataURL()});}
     if(now-start>=duration)resolve(trace);else __qaRAF(tick);
    }__qaRAF(tick);
   }),{duration,key,run});trace.push(...segment);
   if(key)await p.keyboard.up(key);if(run)await p.keyboard.up('Shift');
  }
  const recorded=await p.evaluate(async()=>{__movementRecorder.stop();const url=await __movementEnded;__movementStream.getTracks().forEach(t=>t.stop());return{url,frames:__movementFrames};});
  const file='animacoes-'+label+'-jogando.webm';fs.writeFileSync(path.join(out,file),Buffer.from(recorded.url.split(',')[1],'base64'));report.video=file;report.trace=trace;
  for(const f of recorded.frames){const name='animacoes-'+label+'-jogando-'+f.n+'.png';fs.writeFileSync(path.join(out,name),Buffer.from(f.url.split(',')[1],'base64'));report.captures.push(name);}
 }
 report.checks.push({name:'Sem erros JS',pass:report.errors.length===0});
})().catch(e=>{report.fatal=e.stack;process.exitCode=1;}).finally(async()=>{await b?.close();if(report.checks.some(c=>!c.pass))process.exitCode=1;fs.writeFileSync(path.join(out,'animacoes-'+label+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({mode:report.mode,sha256:report.sha256,checks:report.checks,errors:report.errors,fatal:report.fatal,captures:report.captures},null,2));});
