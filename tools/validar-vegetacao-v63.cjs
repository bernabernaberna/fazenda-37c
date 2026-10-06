/* Vegetação V6.3: raízes sobre terreno adequado, fora das construções.
   Executa no jogo servido por tools/capsrv.py; evidências pertencem à build lida.
   Capturas do canvas precisam ser abertas para avaliar composição e oclusão. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'analise','vegetacao-v63');fs.mkdirSync(dir,{recursive:true});
const base=process.env.FARM37_URL||'http://127.0.0.1:8766',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={geradoEm:new Date().toISOString(),jogoSHA256:sha(fs.readFileSync(path.join(root,'jogo.html'))),metodo:'Edge isolado; RAF parado; nova partida; inventário de terreno e capturas reais do canvas.',checagens:[],erros:[],externos:[],capturas:[],limites:['Não avalia todos os dispositivos ou substitui inspeção visual.','Copas podem se projetar sobre caminhos; a verificação considera a implantação do tronco.']};
let browser;
function check(nome,passou,evidencia){report.checagens.push({nome,passou:!!passou,evidencia});assert.ok(passou,nome);}
(async()=>{
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>report.erros.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');});
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===new URL(base).origin)return route.continue();report.externos.push(u.href);return route.abort();});
  await page.goto(base+'/jogo.html?v='+report.jogoSHA256.slice(0,12));
  await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmValleyPanels.close(false);FarmStoryCinematics.close();A11Y.noDeath=true;A11Y.relaxed=true;currentWeather=null;weatherCooldown=1e9;timeOfDay=10;currentSeason='hot';isPaused=false;});
  const geometry=await page.evaluate(()=>{
   const m=scenes.main,types=['tree','fx_fruittree','mtn_pine','des_palm'],terrain=(x,y)=>Object.entries(T).find(([,id])=>id===m.map[Math.floor(y/TS)]?.[Math.floor(x/TS)])?.[0];
   const buildings=m.objects.filter(o=>['house','barn','story_seed_house','mtn_cabin'].includes(o.type));
   const rows=m.objects.filter(o=>types.includes(o.type)).map(o=>{const f=FarmWorldDepth.footprint(o),tree=['tree','fx_fruittree'].includes(o.type),footY=o.y+(tree?11:0);return{type:o.type,x:o.x,y:o.y,anchor:terrain(o.x,o.y),foot:terrain(o.x,footY),overlaps:buildings.filter(b=>{const bf=FarmWorldDepth.footprint(b),cx=f.x+f.w/2,cy=f.y+f.h/2;return cx>bf.x&&cx<bf.x+bf.w&&cy>bf.y&&cy<bf.y+bf.h;}).map(b=>({type:b.type,x:b.x,y:b.y}))};});
   const moved=[['tree',728,1004,664,972],['tree',456,796,488,684],['tree',552,764,600,764],['fx_fruittree',648,1232,712,1248],['mtn_pine',248,495,248,511],['des_palm',568,1698,536,1682]].map(([type,ox,oy,x,y])=>({type,old:{x:ox,y:oy},x,y,oldAbsent:!rows.some(o=>o.type===type&&o.x===ox&&o.y===oy),present:rows.some(o=>o.type===type&&o.x===x&&o.y===y),support:[-5,0,13].flatMap(dy=>[-9,0,9].map(dx=>terrain(x+dx,y+dy))),nearInteractions:m.objects.filter(o=>!(o.x===x&&o.y===y&&o.type===type)&&Object.keys(INTERACTION_HANDLERS).includes(o.type)&&Math.hypot(x-o.x,y-o.y)<26).map(o=>o.type)}));
   return{counts:Object.fromEntries(types.map(type=>[type,rows.filter(o=>o.type===type).length])),rows,moved};
  });
  check('Quantidade de árvores e palmeiras preservada',JSON.stringify(geometry.counts)===JSON.stringify({tree:56,fx_fruittree:7,mtn_pine:27,des_palm:2}),geometry.counts);
  check('Seis implantações corrigidas sem duplicar objetos',geometry.moved.every(o=>o.oldAbsent&&o.present),geometry.moved);
  check('Troncos não nascem em água nem no lago congelado',geometry.rows.every(o=>!['WATER','RIVER','OASIS','ICE'].includes(o.anchor)&&!['WATER','RIVER','OASIS','ICE'].includes(o.foot)),geometry.rows.filter(o=>['WATER','RIVER','OASIS','ICE'].includes(o.anchor)||['WATER','RIVER','OASIS','ICE'].includes(o.foot)));
  check('Centros dos troncos ficam fora dos volumes das construções',geometry.rows.every(o=>!o.overlaps.length),geometry.rows.filter(o=>o.overlaps.length));
  check('Bases deslocadas têm margem de terra firme e não ocupam caminhos',geometry.moved.every(o=>o.support.every(t=>['GRASS','GRASS2','SNOW','SAND','DUNE','CRACKED'].includes(t))),geometry.moved.map(({type,x,y,support})=>({type,x,y,support})));
  check('Bases deslocadas ficam afastadas dos pontos de interação',geometry.moved.every(o=>!o.nearInteractions.length),geometry.moved.map(({type,x,y,nearInteractions})=>({type,x,y,nearInteractions})));
  report.vegetacao=geometry.rows;
  for(const [name,x,y]of [['vegetacao-v63-rio',720,1000],['vegetacao-v63-celeiro',520,780],['vegetacao-v63-casa',648,1248],['vegetacao-v63-oasis',624,1728],['vegetacao-v63-lago-frio',340,464]]){
   const shot=await page.evaluate(async({name,x,y})=>{const land=(px,py)=>[-8,0,8].every(dx=>[0,12].every(dy=>![undefined,T.RIVER,T.WATER,T.OASIS,T.ICE].includes(scenes.main.map[Math.floor((py+dy)/TS)]?.[Math.floor((px+dx)/TS)])));let point=null;for(let dy=-128;dy<=128;dy+=4)for(let dx=-128;dx<=128;dx+=4){const distance=dx*dx+dy*dy;if((!point||distance<point.distance)&&!FarmWorldDepth.isBlocked(x+dx,y+dy)&&land(x+dx,y+dy))point={x:x+dx,y:y+dy,distance};}if(!point)throw Error('Não há pé livre para a captura '+name);player.x=point.x;player.y=point.y;player.temp=37;player.en=100;player.hyd=100;player.moving=false;player.resting=false;ZOOM=2;snapCamera();render();const url=document.getElementById('game').toDataURL('image/png');const r=await fetch('/shot?name='+name,{method:'POST',body:url});if(!r.ok)throw Error('Captura: '+r.status);return{base64:url.split(',')[1],player:{x:point.x,y:point.y,free:!FarmWorldDepth.isBlocked(point.x,point.y),land:land(point.x,point.y)}};},{name,x,y});
   const file=path.join(dir,name+'.png'),bytes=Buffer.from(shot.base64,'base64');fs.writeFileSync(file,bytes);report.capturas.push({file,player:shot.player,SHA256:sha(bytes)});
  }
  check('Jogo não produz erros de execução',report.erros.length===0,report.erros);check('Jogo não solicita dependências externas',report.externos.length===0,report.externos);
 }catch(e){report.falha=e.message;process.exitCode=1;console.error(e.stack);}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(dir,'vegetacao-v63.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passou:report.checagens.filter(c=>c.passou).length,total:report.checagens.length,jogoSHA256:report.jogoSHA256,falha:report.falha||null,capturas:report.capturas.length}));}
})();
