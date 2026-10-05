/* Caminho completo da narrativa pela UI. Posições/tempo preparados; sem backend. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'analise','validacao-narrativa');fs.mkdirSync(dir,{recursive:true});
const out={metodo:{geradoEm:new Date().toISOString(),limites:'Teclas e escolhas reais, posições preparadas e tempo acelerado por update; não é ensaio humano.'},checagens:[],erros:[],requestsExternos:[],capturas:[]};
let browser,page;
const check=(nome,ok,evidencia)=>{out.checagens.push({nome,passou:!!ok,evidencia});assert.ok(ok,nome);};
const read=()=>page.evaluate(()=>({story:FarmStoryWorld.snapshot(),saved:JSON.parse(localStorage.getItem(SAVE_KEY)||'null'),coins:player.coins,temp:player.temp,hyd:player.hyd,en:player.en,x:player.x,y:player.y,phase:seasonTimer,scene:currentScene,storyOpen:FarmStoryUI.isOpen()}));
async function near(id){await page.evaluate(id=>{if(currentScene!=='main')setSceneTo('main');const n=FarmStoryIntegration.read().npcs.find(x=>x.npcId===id);player.x=n.x+15;player.y=n.y;player.temp=37;player.hyd=90;player.en=90;player.dead=false;player.resting=false;document.activeElement?.blur();snapCamera();},id);}
async function talk(id){await page.keyboard.press('Escape').catch(()=>{});await page.evaluate(()=>{document.getElementById('pauseMenu').classList.remove('show');isPaused=false;FarmStoryUI.close();});await near(id);await page.keyboard.press('e');assert.equal(await page.evaluate(()=>FarmStoryWorld.currentDialogue()?.npcId),id,'Diálogo via E com '+id);}
async function choice(id){await page.locator('[data-vale-choice="'+id+'"]').click();await page.waitForTimeout(20);}
async function close(){if(await page.evaluate(()=>FarmStoryUI.isOpen()))await page.keyboard.press('Escape');await page.waitForTimeout(30);}
async function accept(id){await talk(id);await choice('main:accept');await close();}
async function claim(id){await talk(id);await choice('main:claim');await close();}
async function shot(name){await page.evaluate(()=>{snapCamera();render();});const f=path.join(dir,name+'.png');await page.screenshot({path:f});out.capturas.push(name+'.png');}
async function grow(){await page.evaluate(()=>{for(let i=0;i<720;i++)update(1/60);});}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});out.metodo.navegador=browser.version();
  page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>out.erros.push(e.message));
  await page.addInitScript(()=>{let seed=37;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);localStorage.setItem('farm37_seen_intro','1');window.requestAnimationFrame=()=>0;});out.metodo.sementeAleatoria=37;
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin==='http://127.0.0.1:8766')return r.continue();out.requestsExternos.push(u.href);return r.abort();});
  const response=await page.goto('http://127.0.0.1:8766/jogo.html?v=narrativa-'+Date.now());out.metodo.jogoSHA256=crypto.createHash('sha256').update(await response.body()).digest('hex');
  await page.locator('#startMenu .bigBtn').last().click();await page.locator('.cs-option[data-gender="f"]').click();await page.locator('#csName').fill('Lua do Vale');await page.locator('#csStartBtn').click();
  await page.keyboard.press('Escape');await page.waitForFunction(()=>tutorialActive,undefined,{polling:50});await page.getByRole('button',{name:'Pular tutorial',exact:true}).click();
  await page.evaluate(()=>{A11Y.noDeath=true;currentWeather=null;weatherCooldown=1e9;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;crows.length=0;});
  check('Novo jogo pela UI contém seis moradores e arco disponível',(await read()).story.chapter.status==='available');
  check('HUD orienta primeiro encontro com Rosa',await page.locator('#valeHud').textContent().then(x=>x.includes('Converse com Rosa')));
  await talk('rosa');check('E abre diálogo com retrato de Rosa e pausa',await page.evaluate(()=>readingPanelOpen()&&document.querySelector('#valeDialogue canvas').getAttribute('aria-label').includes('Rosa')));
  const before=await read();await page.keyboard.down('d');await page.evaluate(()=>{update(.05);updateWeather(.05);});await page.keyboard.up('d');const after=await read();
  check('Conversa bloqueia movimento, clima e relógio',before.x===after.x&&before.temp===after.temp&&before.phase===after.phase);
  await choice('chat:return');check('Escolha retorna fala específica e memória',(await read()).story.memories.some(m=>m.text.includes('começar pequeno')));await page.keyboard.press('Enter');
  await choice('main:accept');check('Aceite persiste imediatamente após a ação',(await read()).saved.storyWorld.main[0].status==='active');await close();
  for(const npc of ['lia','tomas','nico']){await talk(npc);await close();}
  check('Conversas após aceite completam o primeiro objetivo',(await read()).story.chapter.status==='ready');await claim('rosa');check('Entrega real abre capítulo da horta',(await read()).story.chapter.id==='horta');
  await accept('nico');
  const cells=await page.evaluate(()=>{const r=[];for(let y=42;y<82&&r.length<3;y++)for(let x=0;x<MW&&r.length<3;x++)if(map[y][x]===T.FIELD&&!getCrop(x,y))r.push({x,y});return r;});
  for(const c of cells){await page.evaluate(c=>{player.x=c.x*TS+8;player.y=c.y*TS+8;player.resting=false;player.selectedSeed='tomato';},c);await page.keyboard.press('q');await page.keyboard.press('f');await page.keyboard.press('f');}
  check('Q/F alimentam o arco sem eventos inventados',(await read()).story.chapter.objectives.filter(o=>o.id==='plant'||o.id==='water').every(o=>o.n===3));
  await grow();for(const c of cells.slice(0,2)){await page.evaluate(c=>{player.x=c.x*TS+8;player.y=c.y*TS+8;},c);await page.keyboard.press('c');}
  check('Colheita real deixa etapa pronta',(await read()).story.chapter.status==='ready');await claim('nico');await accept('lia');
  await page.keyboard.press('h');await page.keyboard.press('h');
  const worldBefore=await read();
  await page.evaluate(()=>{setSceneTo('house');player.x=3*TS;player.y=3*TS;player.resting=false;stats.restSessionCounted=true;});
  check('Diário interior mantém posição externa',await page.evaluate(p=>{const s=FarmStoryIntegration.read();return s.x===p.x&&s.y===p.y;},worldBefore));
  await page.keyboard.press('e');await page.evaluate(()=>{for(let i=0;i<150;i++)update(1/60);});await page.keyboard.press('e');
  await page.evaluate(()=>{setSceneTo('main');});await page.locator('#journeyButton').click();await page.getByRole('button',{name:/Praticar histologia/}).click();
  const correct=await page.evaluate(()=>activeHistologyMission.correctIndex);await page.locator('#histologyOptions button').nth(correct).click();await page.locator('#histologyContinue').click();
  check('Pele, descanso protegido e quiz contam no capítulo',(await read()).story.chapter.status==='ready');await claim('lia');await accept('ines');
  await page.evaluate(()=>{if(currentSeason!=='cold')switchSeason();histologyMissionQueue.length=0;_lastHistMissionAt=1e9;});
  const sheep=await page.evaluate(()=>{const a=objects.find(o=>o.type==='animal'&&o.kind==='sheep');a.shorn=false;a.well=1;return {x:a.x,y:a.y};});
  await page.evaluate(p=>{player.x=p.x;player.y=p.y;player.resting=false;},sheep);await page.keyboard.press('e');
  await page.evaluate(()=>{player.inv.coat=1;player.coatEquipped=false;});await page.keyboard.press('v');
  await page.evaluate(()=>{const o=objects.find(n=>n.type==='mtn_ice_cache');player.x=o.x;player.y=o.y;player.en=90;player.inv.ice=0;});await page.keyboard.press('e');
  const cold=await read();check('Lã, casaco e gelo reais completam a etapa de frio',cold.story.chapter.status==='ready',cold);await claim('ines');await accept('caio');
  out.oasisAntes=await page.evaluate(()=>{const o=objects.find(n=>n.type==='des_oasis_fillpoint');player.x=o.x;player.y=o.y;player.en=70;player.hyd=30;player.inv.oasisWater=0;return {o,resting:player.resting,near:nearObj(Object.keys(INTERACTION_HANDLERS),26),blocked:_gameInputBlocked(),action:_actionUiOpen(),focused:document.activeElement?.outerHTML};});await page.keyboard.press('e');
  await page.evaluate(()=>useItemByKey('oasisWater'));check('Coleta e uso do oásis deixam etapa pronta',(await read()).story.chapter.status==='ready');
  const consumed=await read();check('Save da conversa inclui efeitos completos do item',consumed.saved.player.hyd===consumed.hyd&&consumed.saved.player.en===consumed.en&&consumed.saved.player.inv.oasisWater===0);
  await claim('caio');await accept('rosa');for(const id of ['lia','tomas','ines','caio','nico']){await talk(id);await choice('invite');await close();}
  await page.evaluate(()=>{if(currentSeason!=='hot')switchSeason();histologyMissionQueue.length=0;_lastHistMissionAt=1e9;});
  // Novo plantio/colheita após o aceite da reabertura.
  for(const c of cells.slice(0,2)){await page.evaluate(c=>{player.x=c.x*TS+8;player.y=c.y*TS+8;player.resting=false;},c);await page.keyboard.press('q');await page.keyboard.press('f');await page.keyboard.press('f');}
  await grow();for(const c of cells.slice(0,2)){await page.evaluate(c=>{player.x=c.x*TS+8;player.y=c.y*TS+8;},c);await page.keyboard.press('c');}
  await page.evaluate(()=>{const o=objects.find(n=>n.type==='sellbox');player.x=o.x;player.y=o.y;});await page.keyboard.press('e');await page.locator('#tabSell').click();await page.getByRole('button',{name:/Vender tudo/i}).first().click();await page.keyboard.press('Escape');
  const festival=await read();check('Convites e produção real deixam reabertura pronta',festival.story.chapter.status==='ready',festival);await claim('rosa');const completed=await read();
  check('Arco inteiro conclui seis capítulos sem encerrar mundo',completed.story.completed&&completed.story.chaptersCompleted===6&&completed.story.coinsEarned===140&&await page.evaluate(()=>gameStarted&&!player.dead));
  await talk('rosa');check('Não há segunda entrega remunerada no diálogo',await page.locator('[data-vale-choice="main:claim"]').count()===0);await close();
  await page.evaluate(()=>FarmStoryUI.open());check('Diário mostra seis moradores e carta',await page.locator('.vale-resident').count()===6&&await page.locator('.vale-letter').textContent().then(t=>t.includes('Rosa')));await shot('jornada-final-1280');await page.keyboard.press('Escape');
  await page.evaluate(()=>saveGame(false));await page.reload();await page.locator('#continueBtn').click();const reloaded=await read();check('Continuar restaura arco, vínculo, memória e moedas',reloaded.story.completed&&reloaded.coins===completed.coins&&reloaded.story.friendships.rosa===completed.story.friendships.rosa);
  await talk('lia');await choice('job:offer');await choice('job:accept');await close();check('Pedidos renováveis seguem disponíveis depois do arco',(await read()).story.quests.some(q=>q.npcId==='lia'&&q.status==='active'));
  for(const width of [1280,1024,390,320]){
    await page.setViewportSize({width,height:width===1024?640:width===390?844:width===320?640:800});await talk('rosa');
    const bounds=await page.locator('.vale-dialog-card').evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight,overflow:n.scrollWidth>n.clientWidth+1};});
    check('Diálogo cabe em '+width,bounds.x>=0&&bounds.y>=0&&bounds.right<=bounds.w+1&&bounds.bottom<=bounds.h+1&&!bounds.overflow,bounds);await shot('dialogo-final-'+width);await close();
    await page.evaluate(()=>FarmStoryUI.open());const br=await page.locator('.vale-book').evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight,overflow:n.scrollWidth>n.clientWidth+1};});
    check('Diário cabe em '+width,br.x>=0&&br.y>=0&&br.right<=br.w+1&&br.bottom<=br.h+1&&!br.overflow,br);await shot('diario-final-'+width);await close();
  }
  await page.evaluate(()=>clearPersonalGameData());const erased=await read();check('Exclusão local também limpa a narrativa',erased.story.chapter.status==='available'&&erased.story.memories.length===0&&!erased.saved);
  check('Sem erro JavaScript nem pedido externo',out.erros.length===0&&out.requestsExternos.length===0);out.passou=true;
})().catch(async e=>{out.passou=false;out.falha=e.stack;process.exitCode=1;out.estadoFalha=await read().catch(()=>null);out.paineis=await page.evaluate(()=>({shopOpen,skinOpen,journalOpen,inventoryOpen,isPaused,histologyMissionOpen,dialogue:FarmStoryWorld.currentDialogue(),inv:player.inv,alert:document.getElementById('alertBox')?.textContent})).catch(()=>null);}).finally(async()=>{fs.writeFileSync(path.join(dir,'narrativa-ui.json'),JSON.stringify(out,null,2));console.log(JSON.stringify({passou:out.passou,checagens:out.checagens.length,erros:out.erros,falha:out.falha}));await browser?.close();});
