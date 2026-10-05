/* Narrativa v2: consequências físicas, encontro optativo e deslocamentos de moradores.
   VM usa uma barreira de água e uma ponte estreita para exercitar caminhos reais. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),output=path.join(root,'analise','revisao-completa');fs.mkdirSync(output,{recursive:true});
const files=['14-story-world.js','15-story-ui.js','16-story-integration.js'];
const sources=Object.fromEntries(files.map(f=>[f,fs.readFileSync(path.join(root,'src/modules',f),'utf8')]));
const checks=[],check=(name,fn)=>{fn();checks.push(name);};
function fixture(){
 const context={season:'hot',timeOfDay:8,scene:'main',region:'farm',playerName:'Lua'},rewards=[];
 const box={window:{},console};vm.createContext(box);vm.runInContext(sources['14-story-world.js'],box);
 const story=box.window.FarmStoryWorld;story.init({readState:()=>context,reward:e=>rewards.push(e)});
 return {story,context,rewards,box};
}
function finish(story){
 for(const c of story.chapters){story.interact(c.npcId);story.choose('main:accept');story.close();
  for(const o of c.objectives)story.record(o.event,{...o.match,amount:o.goal});
  story.interact(c.npcId);story.choose('main:claim');story.close();
 }
}
const a=fixture(),s=a.story;
check('Casa começa fechada e sem melhorias herdadas',()=>{assert.equal(s.worldState().seedHouse.stage,'closed');assert.equal(s.worldState().gathering,false);assert.equal(s.worldState().seedHouse.seedCrates,false);});
check('Reunião não abre antes de cumprir os capítulos',()=>{s.interact('rosa');assert.equal(s.currentDialogue().choices.some(c=>c.id==='community:gather'),false);s.choose('community:gather');assert.equal(s.worldState().gathering,false);s.close();});
check('Cada capítulo abre uma consequência da mesma partida',()=>{
 const expected=['preparing','supplied','supplied','supplied','supplied','open'];
 for(const [i,c] of s.chapters.entries()){
  s.interact(c.npcId);s.choose('main:accept');s.close();for(const o of c.objectives)s.record(o.event,{...o.match,amount:o.goal});
  assert.equal(s.worldState().chaptersCompleted,i);s.interact(c.npcId);s.choose('main:claim');s.close();
  assert.equal(s.worldState().seedHouse.stage,expected[i]);assert.equal(s.worldState().chaptersCompleted,i+1);
  if(i===0)assert.equal(s.worldState().seedHouse.workbench,true);
  if(i===1)assert.equal(s.worldState().seedHouse.seedCrates,true);
  if(i===2)assert.equal(s.worldState().seedHouse.shadeAndWater,true);
  if(i===3)assert.equal(s.worldState().seedHouse.woolAndMountainRoute,true);
  if(i===4)assert.equal(s.worldState().seedHouse.oasisRoute,true);
 }assert.equal(s.worldState().seedHouse.bunting,true);assert.equal(a.rewards.reduce((n,r)=>n+r.coins,0),140);
});
check('Todos os moradores têm fala própria sobre a casa reaberta',()=>{
 const dialogue=new Set();for(const npc of s.characters){s.interact(npc.id);s.close();s.interact(npc.id);dialogue.add(s.currentDialogue().text);s.close();}
 assert.equal(dialogue.size,6);assert.match([...dialogue].join(' '),/placa|bancada|cesta|mesa/);
});
check('Convocar e dispensar é optativo, persiste e nunca duplica moedas',()=>{
 const before=a.rewards.length;s.interact('rosa');s.choose('community:gather');assert.equal(s.worldState().gathering,true);assert.match(s.currentDialogue().text,/caminhando/);s.close();
 const saved=s.serialize(),b=fixture();b.story.restore(saved,b.context);assert.equal(b.story.worldState().gathering,true);assert.equal(b.rewards.length,0);
 b.story.interact('rosa');b.story.choose('community:release');assert.equal(b.story.worldState().gathering,false);assert.equal(b.rewards.length,0);assert.equal(a.rewards.length,before);
});
check('Save legado completo ganha a casa pronta sem repagar ou convocar por conta própria',()=>{
 const b=fixture(),old=s.serialize();delete old.flags.communityGathering;b.story.restore(old,b.context);assert.equal(b.story.worldState().seedHouse.open,true);assert.equal(b.story.worldState().gathering,false);assert.equal(b.rewards.length,0);
});
check('Flag de encontro forjada não abre casa nem libera reunião prematura',()=>{
 const b=fixture(),old=b.story.serialize();old.flags.communityGathering=true;b.story.restore(old,b.context);assert.equal(b.story.worldState().gathering,false);assert.equal(b.story.serialize().flags.communityGathering,undefined);
});
check('Novo jogo limpa casa, encontro e memórias',()=>{const b=fixture();b.story.restore(s.serialize(),b.context);b.story.reset();assert.equal(b.story.worldState().seedHouse.stage,'closed');assert.equal(b.story.worldState().gathering,false);assert.equal(b.story.snapshot().memories.length,0);});
const T={GRASS:0,GRASS2:1,FLOWER:2,PATH:3,WOOD:4,WATER:5,RIVER:6,OASIS:7,FENCE:8,SNOW:9,ICE:10,SNOWROCK:11,SAND:12,DUNE:13,CRACKED:14,FIELD:15,STONE:16};
const main={MW:60,MH:124,map:Array.from({length:124},()=>Array(60).fill(T.GRASS)),objects:[]};
for(let y=0;y<124;y++)if(y!==58)main.map[y][30]=T.RIVER;
main.objects.push({type:'story_seed_house',x:552,y:1168,w:112,h:88});
const j=fixture(),box=j.box,blocked=(x,y)=>{const o=main.objects[0];return (x>o.x-3&&x<o.x+o.w+3&&y+7>o.y&&y+7<o.y+o.h)||(x>445&&x<451&&y>700&&y<915);};
Object.assign(box,{FarmStoryWorld:j.story,TS:16,T,scenes:{main},currentScene:'main',currentSeason:'hot',timeOfDay:8,currentRegion:()=> 'farm',isFrio:()=>false,
 player:{x:-500,y:-500,name:'Lua',gender:'f',inv:{},coatEquipped:false,dead:false,coins:0},A11Y:{reduceMotion:false},gameStarted:true,
 isPaused:false,cutsceneActive:false,histologyMissionOpen:false,shopOpen:false,inventoryOpen:false,journalOpen:false,skinOpen:false,keys:{},
 resumeGame(){},closeShop(){},toggleInventory(){},toggleJournal(){},toggleSkinView(){},nearObj(){return null;},
 renderInv(){},renderShop(){},showToast(){},flashFx(){},saveGame(){},queueMicrotask(){},performance:{now:()=>0},
 document:{getElementById:()=>({tabIndex:-1,classList:{contains:()=>false},focus(){}})},
 FarmStoryUI:{init(){},refresh(){},showDialogue(){},close(){j.story.close();}},
 FarmBiomes:{addObjectToMain:o=>main.objects.push(o),registerObjectDrawer(){},registerInteraction(){}},
});
box.window.FarmStoryUI=box.FarmStoryUI;box.window.FarmWorldDepth={isBlocked:blocked,navigationVersion:1};
vm.runInContext(sources['16-story-integration.js'],box);const integration=box.window.FarmStoryIntegration;integration.init();
const actors=()=>integration.read().npcs;
function tick(seconds){for(let i=0;i<Math.ceil(seconds/.05);i++)integration.update(.05);}
check('Moradores mudam de lugar conforme a rotina, com passo por distância percorrida',()=>{
 tick(.1);const before=actors().map(o=>({x:o.x,y:o.y,anim:o.anim}));box.timeOfDay=13;integration.update(.05);
 let moved=0;actors().forEach((o,i)=>{const d=Math.hypot(o.x-before[i].x,o.y-before[i].y);if(d>.01){moved++;assert.ok(Math.abs(o.anim-before[i].anim-d*Math.PI*2/36)<1e-8);}else assert.equal(o.moving,false);});assert.ok(moved>=4);
 tick(15);assert.ok(actors().every(o=>o.routineDescription.length>8));assert.ok(actors().some(o=>o.npcActivity==='rest'));
});
check('Proximidade interrompe trajeto e gesto sem arrastar os pés',()=>{
 box.timeOfDay=16;integration.update(.05);const n=actors()[0];box.player.x=n.x+15;box.player.y=n.y;const before={x:n.x,y:n.y,anim:n.anim};tick(.5);
 assert.equal(n.x,before.x);assert.equal(n.y,before.y);assert.equal(n.anim,before.anim);assert.equal(n.moving,false);assert.equal(n.npcActivity,'talk');box.player.x=-500;box.player.y=-500;
});
check('Encontro contorna cerca fina entre tiles, atravessa a ponte e chega sem cruzar sólidos',()=>{
 finish(j.story);j.story.interact('rosa');j.story.choose('community:gather');j.story.close();let crossings=0;const crossed=new Set();
 for(let i=0;i<2600;i++){
  const before=actors().map(o=>o.x);integration.update(.05);
  actors().forEach((o,index)=>{const tx=Math.floor(o.x/16),ty=Math.floor(o.y/16);assert.notEqual(main.map[ty][tx],T.RIVER,o.npcId+' entrou na água');assert.equal(blocked(o.x,o.y),false,o.npcId+' entrou na casa');
   if((before[index]<480&&o.x>=480)||(before[index]>=496&&o.x<496)){assert.equal(ty,58);crossings++;crossed.add(o.npcId);}
  });
 }
 assert.ok(crossings>=4);assert.ok(crossed.size>=4);
 const result=integration.navigationState();assert.ok(result.every(o=>o.routeLength===0),JSON.stringify(result));assert.ok(result.every(o=>o.activity==='talk'));
 assert.equal(new Set(result.map(o=>Math.round(o.x)+','+Math.round(o.y))).size,6);
 assert.ok(result.every(o=>Math.hypot(o.x-608,o.y-1260)<85));
});
check('Dispensar devolve os moradores aos biomas por caminhada',()=>{
 j.story.interact('rosa');j.story.choose('community:release');j.story.close();const before=actors().map(o=>({x:o.x,y:o.y}));integration.update(.05);
 assert.ok(actors().every((o,i)=>Math.hypot(o.x-before[i].x,o.y-before[i].y)<1));tick(130);
 assert.ok(actors().find(o=>o.npcId==='ines').y<42*16);assert.ok(actors().find(o=>o.npcId==='caio').y>=90*16);
});
check('Redução de movimento não impede deslocamento funcional ao encontro',()=>{
 box.A11Y.reduceMotion=true;j.story.interact('rosa');j.story.choose('community:gather');j.story.close();const before=actors().map(o=>({x:o.x,y:o.y}));tick(3);assert.ok(actors().some((o,i)=>Math.hypot(o.x-before[i].x,o.y-before[i].y)>10));
});
const result={geradoEm:new Date().toISOString(),passou:true,checagens:checks.length,nomes:checks,fonts:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(sources[f]).digest('hex')])),limites:'VM cobre estados, pagamentos e navegação sobre obstáculo deliberado. Legibilidade e caminhos no mapa real exigem validação no navegador.'};
fs.writeFileSync(path.join(output,'historia-v2-unidade.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passou:true,checagens:checks.length}));
if(process.argv.includes('--browser'))(async()=>{
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const out={geradoEm:new Date().toISOString(),passou:false,metodo:'Mapa real no navegador: partida nova pela UI; capítulos preparados por eventos do módulo; reunião por escolha real. Tempo dos NPCs avançado em passos de 50ms sem alterar relógio/clima. Não substitui percurso humano.',checagens:[],erros:[],externos:[],capturas:[]};
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1280,height:800}});
 const ok=(name,value,data)=>{out.checagens.push({nome:name,passou:!!value,evidencia:data});assert.ok(value,name);};
 try{
  page.on('pageerror',e=>out.erros.push(e.message));
  await page.addInitScript(()=>{let seed=37;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);localStorage.setItem('farm37_seen_intro','1');window.requestAnimationFrame=()=>0;});
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin==='http://127.0.0.1:8766')return r.continue();out.externos.push(u.href);return r.abort();});
  const response=await page.goto('http://127.0.0.1:8766/jogo.html?v=historia-v2-'+Date.now());out.jogoSHA256=crypto.createHash('sha256').update(await response.body()).digest('hex');
  await page.locator('#startMenu .bigBtn').last().click();await page.locator('.cs-option[data-gender="f"]').click();await page.locator('#csName').fill('Lua');await page.locator('#csStartBtn').click();await page.keyboard.press('Escape');
  await page.waitForFunction(()=>tutorialActive,undefined,{polling:50});await page.getByRole('button',{name:'Pular tutorial',exact:true}).click();
  await page.evaluate(()=>{A11Y.noDeath=true;currentWeather=null;weatherCooldown=1e9;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;player.x=900;player.y=500;});
  const features=await page.evaluate(()=>({world:typeof FarmStoryWorld.worldState,depth:typeof FarmWorldDepth,actors:FarmStoryIntegration.navigationState(),house:scenes.main.objects.find(o=>o.type==='story_seed_house')}));
  ok('Build contém consequências, NPCs com rotina e Casa física',features.world==='function'&&features.depth==='object'&&features.actors.length===6&&!!features.house,features);
  const routines=await page.evaluate(()=>{
   const summary=[],invalid=[];
   for(const hour of [8,13,16,22]){timeOfDay=hour;for(let i=0;i<800;i++){FarmStoryIntegration.update(.05);for(const a of FarmStoryIntegration.read().npcs)if(FarmWorldDepth.isBlocked(a.x,a.y)&&invalid.length<10)invalid.push({id:a.npcId,x:a.x,y:a.y,hour});}summary.push({hour,actors:FarmStoryIntegration.navigationState()});}
   return {summary,invalid};
  });
  out.rotinas=routines;ok('Quatro horários mantêm seis moradores em chão livre',routines.invalid.length===0,routines.invalid);ok('Horários mudam as posições e atividades no mapa real',routines.summary.some((x,i)=>i&&x.actors.some((a,k)=>Math.hypot(a.x-routines.summary[0].actors[k].x,a.y-routines.summary[0].actors[k].y)>16)));
  const stages=await page.evaluate(()=>{const states=[];for(const c of FarmStoryWorld.chapters){FarmStoryWorld.interact(c.npcId);FarmStoryWorld.choose('main:accept');FarmStoryWorld.close();for(const o of c.objectives)FarmStoryWorld.record(o.event,{...o.match,amount:o.goal});FarmStoryWorld.interact(c.npcId);FarmStoryWorld.choose('main:claim');FarmStoryWorld.close();states.push(FarmStoryWorld.worldState());}return states;});
  ok('Seis entregas mantêm consequências progressivas na construção',stages.length===6&&stages[0].seedHouse.stage==='preparing'&&stages[5].seedHouse.open,stages);
  await page.evaluate(()=>{timeOfDay=15;const a=FarmStoryIntegration.read().npcs.find(n=>n.npcId==='rosa');player.x=a.x+15;player.y=a.y;player.resting=false;document.activeElement?.blur();snapCamera();});
  await page.keyboard.press('e');ok('E abre diálogo de Rosa no local físico',await page.evaluate(()=>FarmStoryWorld.currentDialogue()?.npcId==='rosa'));await page.locator('[data-vale-choice="community:gather"]').click();await page.keyboard.press('Escape');
  await page.evaluate(()=>{player.x=900;player.y=500;});
  const gathering=await page.evaluate(()=>{const invalid=[];for(let i=0;i<3800;i++){FarmStoryIntegration.update(.05);for(const a of FarmStoryIntegration.read().npcs)if(FarmWorldDepth.isBlocked(a.x,a.y)&&invalid.length<10)invalid.push({id:a.npcId,x:a.x,y:a.y});}return {actors:FarmStoryIntegration.navigationState(),invalid,world:FarmStoryWorld.worldState()};});
  out.encontro=gathering;ok('Convite pela UI leva seis moradores ao adro sem atravessar sólidos',gathering.invalid.length===0&&gathering.actors.every(a=>a.routeLength===0&&Math.hypot(a.x-608,a.y-1260)<90),gathering);
  ok('Seis lugares são distintos e ninguém continua andando parado',new Set(gathering.actors.map(a=>Math.round(a.x)+','+Math.round(a.y))).size===6&&gathering.actors.every(a=>!a.moving&&a.activity==='talk'));
  await page.evaluate(()=>{player.x=608;player.y=1320;timeOfDay=17;FarmStoryIntegration.update(.05);snapCamera();render();});
  await page.locator('#cameraBtn').click();await page.waitForTimeout(5100);await page.evaluate(()=>{updateBars();snapCamera();render();});
  await page.screenshot({path:path.join(output,'historia-casa-encontro.png')});out.capturas.push('historia-casa-encontro.png');
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:width<500?844:800});
   await page.evaluate(()=>FarmStoryWorld.interact('rosa'));await page.evaluate(()=>{snapCamera();render();});
   const dialog=await page.locator('.vale-dialog-card').boundingBox();ok('Diálogo legível dentro da tela '+width,dialog.x>=0&&dialog.width<=width&&dialog.height<=(width<500?844:800));
   await page.screenshot({path:path.join(output,'historia-dialogo-'+width+'.png')});out.capturas.push('historia-dialogo-'+width+'.png');await page.keyboard.press('Escape');
   await page.evaluate(()=>FarmStoryUI.open());const book=await page.locator('.vale-book').boundingBox();ok('Diário com Casa e atividades cabe em '+width,book.x>=0&&book.width<=width&&await page.locator('.vale-world-state').count()===1&&await page.locator('.vale-resident').count()===6);
   await page.screenshot({path:path.join(output,'historia-diario-'+width+'.png')});out.capturas.push('historia-diario-'+width+'.png');await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>{saveGame(true);});const before=await page.evaluate(()=>({world:FarmStoryWorld.worldState(),coins:player.coins}));await page.reload();await page.locator('#startMenu .bigBtn').first().click();
  const after=await page.evaluate(()=>({world:FarmStoryWorld.worldState(),coins:player.coins}));ok('Save real mantém casa/reunião/moedas sem recompensa duplicada',after.world.gathering&&after.world.seedHouse.open&&before.coins===after.coins,{before,after});
  ok('Nenhum erro JavaScript e nenhuma dependência externa',out.erros.length===0&&out.externos.length===0,{errors:out.erros,external:out.externos});out.passou=true;
 }catch(e){out.erroFatal=e.stack;process.exitCode=1;}finally{fs.writeFileSync(path.join(output,'historia-v2-navegador.json'),JSON.stringify(out,null,2));await browser.close();console.log(JSON.stringify({navegador:true,passou:out.passou,checagens:out.checagens.length,erro:out.erroFatal}));}
})();
