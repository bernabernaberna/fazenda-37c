/* Integração da mochila: recursos são preparados; seleção, uso, atalhos e
   navegação passam pela interface real. Não substitui ensaio humano em celular. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/inventario-v69');fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],captures:[],limitations:['Recursos preparados; efeitos e consumo executados pelas APIs reais e botões.','Inspeção visual humana das capturas é registrada separadamente.']};
let browser,page;
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});if(!pass)throw Error(name);};
const click=(selector)=>page.locator(selector).click();
const item=(id)=>click('[data-bag-item="'+id+'"]');
const use=()=>click('[data-bag-command="use"]');
const category=(id)=>click('[data-bag-category="'+id+'"]');
async function shot(name){await page.screenshot({path:path.join(out,name+'.png')});report.captures.push(name+'.png');}
async function setup(){await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.reset();FarmValleyPanels.close(false);isPaused=false;soundEnabled=false;histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;A11Y.noDeath=true;A11Y.relaxed=true;currentWeather=null;weatherCooldown=1e8;currentSeason='hot';timeOfDay=8;player.inv.water=4;player.inv.coat=1;player.coatEquipped=false;player.hyd=40;player.en=50;player.inv.seeds.carrot=6;player.selectedSeed='tomato';renderInv();updateBars();render();});}
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');});
 const response=await page.goto((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=inventario-'+Date.now());report.sha256=crypto.createHash('sha256').update(await response.body()).digest('hex');await setup();
 const status=await page.evaluate(()=>({hidden:getComputedStyle(document.getElementById('status')).display==='none',aria:document.getElementById('status').getAttribute('aria-hidden'),ids:['sSweat','sCansado','sHyd','sCalor','sVaso','sGland'].map(id=>document.querySelectorAll('#'+id).length)}));
 check('Faixa de seis ícones retirada; IDs preservados para atualização térmica',status.hidden&&status.aria==='true'&&status.ids.every(n=>n===1),status);
 await shot('jogo-sem-faixa');await page.keyboard.press('i');
 check('I abre diálogo acessível com foco em Fechar',await page.evaluate(()=>inventoryOpen&&document.querySelector('#inventoryPanel').getAttribute('aria-modal')==='true'&&document.activeElement.dataset.bagCommand==='close'));
 const catalogue=await page.evaluate(()=>({names:[...document.querySelectorAll('.bagItemName')].map(e=>e.textContent),categories:[...document.querySelectorAll('[data-bag-category]')].map(e=>e.textContent),quick:document.querySelectorAll('[data-bag-quick]').length}));
 check('Nomes, seis categorias e seis atalhos presentes',catalogue.quick===6&&catalogue.categories.length===6&&catalogue.names.includes('Água do cantil')&&catalogue.names.includes('Compota de frutas'),catalogue);
 const selection=await page.evaluate(()=>JSON.stringify({inv:player.inv,coins:player.coins,hyd:player.hyd,en:player.en,seed:player.selectedSeed,coat:player.coatEquipped}));
 for(const id of ['water','coat','seed_carrot','stock_compota'])await item(id);
 check('Inspecionar quatro itens não consome, equipa, planta ou recompensa',selection===await page.evaluate(()=>JSON.stringify({inv:player.inv,coins:player.coins,hyd:player.hyd,en:player.en,seed:player.selectedSeed,coat:player.coatEquipped})));
 await category('seeds');check('Filtro Sementes só mostra sementes',await page.locator('#bagGrid button').evaluateAll(nodes=>nodes.length===7&&nodes.every(n=>n.dataset.bagItem.startsWith('seed_'))));
 await category('all');await page.locator('#bagSearch').fill('agua');check('Busca sem acentos encontra cantil e oásis',await page.locator('#bagGrid button').evaluateAll(nodes=>nodes.length===2&&nodes.every(n=>['water','oasisWater'].includes(n.dataset.bagItem))));
 await page.locator('#bagSearch').fill('inexistente-xyz');check('Busca vazia explica ausência de resultados',await page.locator('#bagEmpty').isVisible());await page.locator('#bagSearch').fill('');
 await item('water');await use();check('Beber explícito consome uma água e recupera 25',await page.evaluate(()=>player.inv.water===3&&player.hyd===65));
 await page.evaluate(()=>{player.hyd=100;renderFullInventory();});await use();check('Água não é consumida quando a hidratação está completa',await page.evaluate(()=>player.inv.water===3));
 await item('coat');await use();check('Equipar casaco conserva sua unidade e atualiza o detalhe',await page.evaluate(()=>player.coatEquipped&&player.inv.coat===1&&document.querySelector('[data-bag-command="use"]').textContent==='Guardar equipamento'));
 await use();check('Guardar casaco é reversível e não consome',await page.evaluate(()=>!player.coatEquipped&&player.inv.coat===1));
 await item('seed_carrot');await use();check('Selecionar semente não planta nem gasta sementes',await page.evaluate(()=>player.selectedSeed==='carrot'&&player.inv.seeds.carrot===6));
 const quickBefore=await page.evaluate(()=>player.quickSlots.slice());await click('[data-bag-quick="0"]');await item('coat');await click('[data-bag-command="assign"]');
 const quickAfter=await page.evaluate(()=>player.quickSlots.slice());check('Troca de atalho move o item anterior sem duplicar',quickAfter[0]==='coat'&&quickAfter[quickBefore.indexOf('coat')]===quickBefore[0]&&new Set(quickAfter).size===6,{quickBefore,quickAfter});
 const pausedBefore=await page.evaluate(()=>({x:player.x,y:player.y,t:timeOfDay,hyd:player.hyd,en:player.en,life:FarmLife.serialize().activeSeconds,frontier:FarmFrontierStory.serialize().activeSeconds}));
 await page.keyboard.down('ArrowRight');await page.keyboard.press('1');await page.keyboard.press('q');await page.keyboard.press('j');await page.evaluate(()=>{for(let i=0;i<120;i++)update(1/60);});await page.keyboard.up('ArrowRight');
 const pausedAfter=await page.evaluate(()=>({x:player.x,y:player.y,t:timeOfDay,hyd:player.hyd,en:player.en,life:FarmLife.serialize().activeSeconds,frontier:FarmFrontierStory.serialize().activeSeconds}));
 check('Mochila pausa movimento, clima, relógio e produção; atalhos não vazam',JSON.stringify(pausedBefore)===JSON.stringify(pausedAfter)&&await page.evaluate(()=>inventoryOpen&&!journalOpen),{pausedBefore,pausedAfter});
 await page.evaluate(()=>document.querySelector('.bagClose').focus());await page.keyboard.press('Shift+Tab');check('Shift+Tab circula para o último controle',await page.evaluate(()=>{const nodes=[...document.querySelectorAll('#inventoryPanel button:not(:disabled),#inventoryPanel input')].filter(n=>n.getClientRects().length);return document.activeElement===nodes.at(-1);}));await page.keyboard.press('Tab');check('Tab volta para Fechar sem sair do diálogo',await page.evaluate(()=>document.activeElement.classList.contains('bagClose')));
 await page.keyboard.press('Escape');check('Escape fecha apenas a mochila',await page.evaluate(()=>!inventoryOpen&&!isPaused));
 const saved=await page.evaluate(()=>{saveGame(true);return JSON.parse(localStorage.getItem(SAVE_KEY));});await page.reload();await page.evaluate(()=>{loadGame();startGame(false);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.reset();isPaused=false;soundEnabled=false;});
 check('Reload preserva save v2, atalhos, semente e quantidades',await page.evaluate(({saved,quickAfter})=>JSON.parse(localStorage.getItem(SAVE_KEY)).version===2&&JSON.stringify(player.quickSlots)===JSON.stringify(quickAfter)&&player.selectedSeed==='carrot'&&player.inv.water===saved.player.inv.water&&player.inv.seeds.carrot===saved.player.inv.seeds.carrot,{saved,quickAfter}));
 const crafted=await page.evaluate(()=>{const data=FarmLife.serialize();data.projects.cozinha=true;data.stock.compota=0;data.stock.fruta=4;data.stock.mel=2;FarmLife.restore(data);player.x=244;player.y=848;player.en=40;player.hyd=60;return {result:FarmLife.craft('compota'),stock:FarmLife.snapshot().stock};});
 check('Receita real gasta 2 frutas e 1 mel para uma compota única',crafted.result.ok&&crafted.stock.compota===1&&crafted.stock.fruta===2&&crafted.stock.mel===1,crafted);
 await page.keyboard.press('i');await category('stock');await item('stock_compota');
 check('Depósito da mochila lê exatamente o estoque FarmLife',await page.evaluate(()=>{const a=FarmInventory.snapshot().items.filter(i=>i.group==='stock'),b=FarmLife.snapshot().stock;return a.length===5&&a.every(i=>i.amount===b[i.key.slice(6)])&&!Object.hasOwn(player.inv,'compota');}));
 await use();await page.evaluate(()=>new Promise(r=>queueMicrotask(r)));
 const consumed=await page.evaluate(()=>({stock:FarmLife.snapshot().stock.compota,energy:player.en,hyd:player.hyd,ui:FarmInventory.snapshot().items.find(i=>i.key==='stock_compota').amount,save:JSON.parse(localStorage.getItem(SAVE_KEY)).farmLife?.stock?.compota}));
 check('Comer compota reduz o depósito uma vez, recupera 22/8 e salva',consumed.stock===0&&consumed.ui===0&&consumed.energy===62&&consumed.hyd===68&&consumed.save===0,consumed);
 check('Compota esgotada bloqueia novo consumo na interface',await page.locator('[data-bag-command="use"]').isDisabled());
 const repeat=await page.evaluate(()=>{const result=FarmLife.consume('compota');return{result,stock:FarmLife.snapshot().stock.compota,en:player.en,hyd:player.hyd};});check('API também recusa consumo repetido sem estoque',!repeat.result.ok&&repeat.stock===0&&repeat.en===62&&repeat.hyd===68,repeat);
 await page.evaluate(()=>{const data=FarmLife.serialize();data.stock.compota=1;FarmLife.restore(data);player.en=100;player.hyd=100;renderFullInventory();});
 check('Compota com energia e hidratação completas fica bloqueada com explicação',await page.locator('[data-bag-command="use"]').isDisabled()&&/completas/.test(await page.locator('.bagReason').textContent()));
 const noBenefit=await page.evaluate(()=>({result:FarmLife.consume('compota'),amount:FarmLife.snapshot().stock.compota}));check('API conserva compota quando não há benefício',!noBenefit.result.ok&&noBenefit.amount===1,noBenefit);
 await item('stock_fruta');await use();check('Ver receitas abre Caderno e fecha mochila sem consumir',await page.evaluate(()=>!inventoryOpen&&FarmValleyPanels.isOpen()&&FarmLife.snapshot().stock.fruta===2));await page.evaluate(()=>FarmValleyPanels.close(false));
 for(const viewport of [{width:1280,height:800},{width:1024,height:640},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>{toggleInventory(true);player.inv.water=3;player.hyd=60;renderFullInventory();render();});await category('all');await page.locator('#bagSearch').fill('');await item('water');
  const bounds=await page.locator('.inv-v69 .invWindow').boundingBox();const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
  check('Janela dentro do viewport '+viewport.width+'×'+viewport.height,bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width+1&&bounds.y+bounds.height<=viewport.height+1&&noOverflow,bounds);
  await shot('mochila-'+viewport.width+'x'+viewport.height);
  await page.locator('[data-bag-command="use"]').scrollIntoViewIfNeeded();const action=await page.locator('[data-bag-command="use"]').boundingBox();check('Ação de item alcançável '+viewport.width+'×'+viewport.height,action.y>=0&&action.y+action.height<=viewport.height&&action.x>=0&&action.x+action.width<=viewport.width,action);await shot('detalhe-'+viewport.width+'x'+viewport.height);await use();check('Ação funciona no viewport '+viewport.width+'×'+viewport.height,await page.evaluate(()=>player.inv.water===2&&player.hyd===85));await page.keyboard.press('Escape');
 }
 await click('#inv .inv-open');check('Botão da barra abre a mesma mochila',await page.evaluate(()=>inventoryOpen));await page.keyboard.press('Escape');check('Fechar devolve o foco ao botão que abriu a mochila',await page.evaluate(()=>document.activeElement.matches('#inv .inv-open')));
 await click('#inv .inv-open');await item('water');await use();await page.keyboard.press('Escape');check('Após consumir e recriar a barra, foco volta ao novo botão da mochila',await page.evaluate(()=>!inventoryOpen&&document.activeElement.matches('#inv .inv-open')&&player.inv.water===1&&player.hyd===100));
 check('Sem erros JavaScript',report.errors.length===0,report.errors);report.pass=true;
})().catch(e=>{report.fatal=e.stack;report.pass=false;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'integracao.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),fatal:report.fatal,sha256:report.sha256},null,2));});
