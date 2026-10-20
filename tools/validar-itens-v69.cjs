/* Consumíveis, equipamentos e adubo pelas funções reais do jogo. Posições e
   quantidades são preparadas; efeitos, eventos, crescimento e save são reais. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/itens-v69');fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),method:'Edge sem RAF; ações reais, observação dos eventos após efeitos, update controlado e save v2.',checks:[],errors:[]};let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});
 const response=await page.goto((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=itens-v69-'+Date.now());
 report.sha256=crypto.createHash('sha256').update(await response.body()).digest('hex');
 await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.reset();soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;A11Y.noDeath=true;A11Y.relaxed=true;currentWeather=null;weatherCooldown=1e8;currentSeason='hot';timeOfDay=11;});
 const result=await page.evaluate(()=>{
  const checks=[],events=[],check=(name,pass,evidence)=>{checks.push({name,pass:!!pass,evidence});if(!pass)throw Error(name);};
  const record=FarmStoryIntegration.record;
  FarmStoryIntegration.record=function(type,payload){events.push({type,payload:JSON.parse(JSON.stringify(payload)),inv:{...player.inv},temp:player.temp,en:player.en,hyd:player.hyd});return record.call(this,type,payload);};
  const clear=()=>{FarmPlayerActions.reset(player);FarmStoryUI.close();FarmValleyPanels.close(false);if(inventoryOpen)toggleInventory(false);player.resting=false;player.dead=false;player.temp=37;player.en=100;player.hyd=100;for(const k of Object.keys(keys))delete keys[k];events.length=0;};
  const observed=(type,item)=>events.filter(e=>e.type===type&&e.payload.item===item);
  const refused=(key,temp,en,hyd)=>{clear();Object.assign(player,{temp,en,hyd});player.inv[key]=2;const before={temp,en,hyd};useItemByKey(key);return player.inv[key]===2&&player.temp===before.temp&&player.en===before.en&&player.hyd===before.hyd&&observed('use',key).length===0;};
  try{
   check('Água cheia não é consumida nem emite uso',refused('water',37,100,100));
   check('Isotônico sem benefício não é consumido',refused('isotonic',37,100,100));
   check('Água do oásis sem benefício não é consumida',refused('oasisWater',37,100,100));
   check('Gelo não é gasto no corpo frio',refused('ice',36,100,100));
   check('Toalha não aquece nem é gasta abaixo de 36,5 °C',refused('towel',35.8,100,100));
   check('Bebida não esfria corpo quente nem é gasta sem benefício',refused('warmDrink',39,100,100));
   check('Sopa não esfria corpo quente nem é gasta sem benefício',refused('soup',39,100,100));
   clear();player.inv.water=2;player.hyd=90;player.quickSlots=['water','seed','watercan','hay','towel','coat'];useSlot(0);
   check('Atalho de água restaura até 100, desconta uma vez e publica após efeito',player.inv.water===1&&player.hyd===100&&observed('use','water').length===1&&observed('use','water')[0].hyd===100&&observed('use','water')[0].inv.water===1);
   clear();player.inv.isotonic=2;player.hyd=92;player.en=70;useItemByKey('isotonic');
   check('Isotônico mantém +18, limitado a 100, com evento único',player.inv.isotonic===1&&player.hyd===100&&player.en===88&&observed('use','isotonic').length===1);
   clear();player.inv.oasisWater=2;player.hyd=90;player.en=98;useItemByKey('oasisWater');
   check('Água do oásis mantém limites e evento após efeito',player.inv.oasisWater===1&&player.hyd===100&&player.en===100&&observed('use','oasisWater').length===1&&observed('use','oasisWater')[0].en===100);
   clear();player.inv.ice=2;player.temp=37.4;useItemByKey('ice');
   check('Gelo resfria somente até 37,2 °C',player.inv.ice===1&&player.temp===37.2&&observed('use','ice').length===1&&observed('use','ice')[0].temp===37.2);
   clear();player.inv.towel=2;player.temp=36.8;useItemByKey('towel');
   check('Toalha resfria sem ultrapassar 36,5 °C e emite uma vez',player.inv.towel===1&&player.temp===36.5&&player.towelTimer===8&&observed('use','towel').length===1);
   clear();player.inv.warmDrink=2;player.temp=39;player.en=80;useItemByKey('warmDrink');
   check('Bebida quente pode recuperar energia sem resfriar corpo quente',player.inv.warmDrink===1&&player.temp===39&&player.en===90&&observed('use','warmDrink').length===1);
   clear();player.inv.warmDrink=2;player.temp=37.5;useItemByKey('warmDrink');
   check('Bebida aquece no máximo até 37,8 °C',player.temp===37.8&&player.inv.warmDrink===1&&observed('use','warmDrink').length===1);
   clear();player.inv.soup=2;player.temp=39;player.en=90;player.hyd=97;useItemByKey('soup');
   check('Sopa recupera energia e água sem resfriar corpo quente',player.inv.soup===1&&player.temp===39&&player.en===100&&player.hyd===100&&observed('use','soup').length===1);
   clear();player.inv.soup=2;player.temp=37.8;useItemByKey('soup');
   check('Sopa aquece no máximo até 38 °C',player.temp===38&&player.inv.soup===1&&observed('use','soup').length===1);
   for(const [item,flag]of [['coat','coatEquipped'],['blanket','blanketEquipped'],['gloves','glovesEquipped'],['scarf','scarf'],['boots','boots']]){
    clear();player.inv[item]=1;player[flag]=false;useItemByKey(item);useItemByKey(item);const log=observed('equip',item);
    check('Equipar e retirar '+item+' mantém posse e dois eventos distintos',player.inv[item]===1&&player[flag]===false&&log.length===2&&log[0].payload.equipped===true&&log[1].payload.equipped===false);
   }
   clear();player.inv.gloves=0;player.glovesEquipped=false;useItemByKey('gloves');
   check('Equipamento ausente não é ativado e não emite evento',!player.glovesEquipped&&observed('equip','gloves').length===0);
   clear();player.inv.fertilizer=2.9;normalizePlayerState();check('Adubo tem catálogo e quantidade inteira',ITEM_DEFS.fertilizer&&countForInv('fertilizer')===2);
   let field=null;for(let y=1;y<MH-1&&!field;y++)for(let x=2;x<MW-3&&!field;x++)if([0,1,2].every(dx=>map[y][x+dx]===T.FIELD&&!FarmWorldDepth.isBlocked((x+dx)*TS+8,y*TS+8)))field={x,y};
   if(!field)throw Error('Três canteiros contíguos não encontrados');
   const emptyArea=()=>{for(let y=field.y-3;y<=field.y+3;y++)for(let x=field.x-3;x<=field.x+4;x++)setCrop(x,y,null);};
   const at=()=>{player.x=field.x*TS+8;player.y=field.y*TS+8;};
   const crop=()=>getCrop(field.x,field.y);
   clear();emptyArea();at();player.inv.fertilizer=4;useItemByKey('fertilizer');
   check('Adubo não é gasto sem planta próxima',player.inv.fertilizer===4&&observed('use','fertilizer').length===0);
   setCrop(field.x,field.y,{type:'tomato',stage:3,t:0,water:1});useItemByKey('fertilizer');
   check('Adubo não é gasto numa planta madura',player.inv.fertilizer===4&&!crop().fertilized&&observed('use','fertilizer').length===0);
   crop().stage=1;player.x+=24.01;useItemByKey('fertilizer');
   check('Adubo não alcança planta além de 24 pixels',player.inv.fertilizer===4&&!crop().fertilized&&observed('use','fertilizer').length===0);
   player.x=field.x*TS+8+24;useItemByKey('fertilizer');
   check('Adubo alcança 24 pixels e consome exatamente uma unidade',player.inv.fertilizer===3&&crop().fertilized===true&&observed('use','fertilizer').length===1);
   at();useItemByKey('fertilizer');
   check('Repetir adubação não gasta nem duplica evento',player.inv.fertilizer===3&&observed('use','fertilizer').length===1);
   crop().water=1;crop().t=0;setCrop(field.x+1,field.y,{type:'tomato',stage:1,t:0,water:1});setCrop(field.x+2,field.y,{type:'tomato',stage:1,t:0,water:0,fertilized:true});
   const random=Math.random;Math.random=()=>.99;try{update(.2);}finally{Math.random=random;}
   const normal=getCrop(field.x+1,field.y),dry=getCrop(field.x+2,field.y);
   check('Adubo acelera 50% apenas com água',Math.abs(crop().t-normal.t*1.5)<1e-9&&normal.t>0&&dry.t===0,{adubada:crop().t,normal:normal.t,seca:dry.t});
   saveGame(true);const saved=JSON.parse(localStorage.getItem(SAVE_KEY));events.length=0;loadGameFromData(saved);loadGameFromData(saved);
   check('Save v2 conserva adubo, flag e moedas sem efeitos ao carregar',saved.version===2&&crop().fertilized===true&&player.inv.fertilizer===saved.player.inv.fertilizer&&player.coins===saved.player.coins&&observed('use','fertilizer').length===0);
   at();crop().stage=3;const seeds=player.inv.seeds.tomato,vegetables=player.inv.veg;harvestCrop();
   check('Colher planta adubada conserva produção e remove a flag junto da planta',crop()===null&&player.inv.seeds.tomato===seeds+2&&player.inv.veg===vegetables+1);
   plantCrop();check('Nova planta no mesmo solo começa sem adubo',crop()?.stage===1&&!crop().fertilized);
   const legacy=JSON.parse(JSON.stringify(saved));delete legacy.player.inv.fertilizer;delete legacy.crops[field.x+','+field.y].fertilized;
   loadGameFromData(legacy);check('Save anterior sem adubo carrega sem conceder unidades ou bônus',player.inv.fertilizer===0&&!crop().fertilized&&legacy.version===2);
   return{checks};
  }catch(error){return{checks,fatal:error.stack};}finally{FarmStoryIntegration.record=record;}
 });
 report.checks=result.checks;if(result.fatal)throw Error(result.fatal);if(report.errors.length)throw Error(report.errors.join('\n'));
})().catch(e=>{report.fatal=e.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();report.pass=!report.fatal&&!report.errors.length&&report.checks.every(c=>c.pass);fs.writeFileSync(path.join(out,'itens-v69.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,sha256:report.sha256,errors:report.errors,fatal:report.fatal},null,2));});
