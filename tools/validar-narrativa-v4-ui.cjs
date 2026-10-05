/* Leitura das lembranças no jogo integrado: E, botões, teclado, save e telas. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'analise/narrativa-v4');fs.mkdirSync(dir,{recursive:true});
const out={geradoEm:new Date().toISOString(),metodo:'Jogo integrado com teclas/botões reais. Posição junto de Rosa preparada, RAF desativado e update explícito para verificar pausa.',checagens:[],erros:[],capturas:[]};
let browser,page;
const check=(name,ok,evidence)=>{out.checagens.push({name,passou:!!ok,evidence});assert.ok(ok,name);};
async function choice(id){await page.locator('[data-vale-choice="'+id+'"]').click();await page.waitForTimeout(20);}
async function close(){if(await page.evaluate(()=>FarmStoryUI.isOpen()))await page.keyboard.press('Escape');}
async function talk(){
 await close();await page.evaluate(()=>{const o=FarmStoryIntegration.read().npcs.find(n=>n.npcId==='rosa');player.x=o.x+15;player.y=o.y;player.en=90;player.hyd=90;player.temp=37;player.resting=false;document.activeElement?.blur();snapCamera();});
 await page.keyboard.press('e');assert.equal(await page.evaluate(()=>FarmStoryWorld.currentDialogue()?.npcId),'rosa');
}
const sim=()=>page.evaluate(()=>({x:player.x,y:player.y,anim:player.anim,en:player.en,hyd:player.hyd,temp:player.temp,time:timeOfDay,season:seasonTimer,npcs:FarmStoryIntegration.navigationState().map(n=>({x:n.x,y:n.y})),coins:player.coins}));
async function bounds(selector){return page.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,overflow:n.scrollWidth>n.clientWidth+1};});}
const fits=r=>r.x>=-1&&r.y>=-1&&r.right<=r.width+1&&r.bottom<=r.height+1&&!r.overflow;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>out.erros.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('farm37_seen_intro','1');window.requestAnimationFrame=()=>0;});
 const response=await page.goto((process.env.GAME_URL||'http://127.0.0.1:8766/jogo.html')+'?v=narrativa-v4-'+Date.now());out.jogoSHA256=crypto.createHash('sha256').update(await response.body()).digest('hex');
 await page.locator('#startMenu .bigBtn').last().click();await page.locator('.cs-option[data-gender="f"]').click();await page.locator('#csName').fill('Lua');await page.locator('#csStartBtn').click();
 await page.keyboard.press('Escape');await page.waitForFunction(()=>tutorialActive,undefined,{polling:50});await page.getByRole('button',{name:'Pular tutorial',exact:true}).click();
 await page.evaluate(()=>{A11Y.noDeath=true;currentWeather=null;weatherCooldown=1e9;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;});
 check('Build contém as 18 lembranças novas',await page.evaluate(()=>FarmStoryWorld.snapshot().discoveryTotal===18));
 for(const viewport of [{width:1280,height:800},{width:1024,height:640},{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
  await page.setViewportSize(viewport);await talk();
  const menu=await bounds('.vale-dialog-card');check('Menu com capítulo e assuntos cabe em '+viewport.width+'x'+viewport.height,fits(menu),menu);
  const reachable=await page.locator('.vale-choices').evaluate(n=>{const outer=n.getBoundingClientRect();for(const b of n.querySelectorAll('button')){b.focus();const r=b.getBoundingClientRect();if(r.top<outer.top-2||r.bottom>outer.bottom+2)return false;}return true;});
  check('Todas as opções alcançam a área visível por foco em '+viewport.width+'x'+viewport.height,reachable);
  await choice('lore:rosa:caixa');
  const name=viewport.width+'x'+viewport.height,r=await bounds('.vale-dialog-card'),choiceBox=await bounds('.vale-choices');
  check('Diálogo e respostas cabem em '+name,fits(r)&&fits(choiceBox),{card:r,respostas:choiceBox});
  check('Lembrança preserva duas respostas e a opção de pensar em '+name,await page.locator('[data-vale-choice^="reply:"]').count()===2&&await page.locator('[data-vale-choice="close"]').count()===1);
  const before=await sim();await page.keyboard.down('d');await page.evaluate(()=>{for(let i=0;i<30;i++){update(.05);updateWeather(.05);}});await page.keyboard.up('d');const after=await sim();
  check('Leitura pausa movimento, NPCs, temperatura e relógio em '+name,JSON.stringify(before)===JSON.stringify(after),{before,after});
  await page.locator('.vale-dialog-body').focus();await page.keyboard.press('End');
  const reading=await page.locator('.vale-dialog-body').evaluate(n=>({scroll:n.scrollTop,bottom:n.scrollTop+n.clientHeight,height:n.scrollHeight,fullText:n.textContent.includes('escrever sua carta')}));
  check('Texto integral pode ser lido em '+name,reading.fullText&&reading.bottom>=reading.height-3,reading);
  const closeHeader=page.locator('.vale-dialog-header .vale-close');await closeHeader.focus();await page.keyboard.press('Shift+Tab');
  check('Shift+Tab mantém foco na última resposta em '+name,await page.evaluate(()=>document.activeElement?.dataset?.valeChoice==='close'));
  await page.evaluate(()=>render());await page.screenshot({path:path.join(dir,'leitura-'+name+'.png')});out.capturas.push('leitura-'+name+'.png');await close();
  check('Esc fecha a lembrança e devolve foco ao jogo em '+name,await page.evaluate(()=>!readingPanelOpen()&&document.activeElement?.id==='game'));
 }
 await page.setViewportSize({width:1280,height:800});await talk();
 check('Lembrança sem resposta pode ser retomada no menu',await page.locator('[data-vale-choice="lore:rosa:caixa"]').textContent().then(t=>t.includes('Retomar')));await choice('lore:rosa:caixa');
 const before=await sim();await page.keyboard.press('2');
 check('Tecla 2 confirma a segunda postura com fala própria',await page.evaluate(()=>FarmStoryWorld.serialize().decisions['rosa:caixa']===1&&FarmStoryWorld.currentDialogue().text.includes('embrulho')));
 check('Escolha opcional não cobra nem entrega moedas',(await sim()).coins===before.coins);
 check('Resposta não duplica o botão continuar',await page.locator('.vale-choices button').count()===2);
 await page.waitForTimeout(50);const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).storyWorld);
 check('Escolha e lembrança persistem no save v2',saved.decisions['rosa:caixa']===1&&saved.discoveries.includes('rosa:caixa'));
 await close();await page.locator('#valeHud').click();
 check('Diário registra o título e sua consequência',await page.locator('.vale-discovery summary').textContent().then(t=>t==='A caixa sem etiqueta')&&await page.locator('.vale-decision').textContent().then(t=>t.includes('semente guardada')));
 await page.locator('.vale-discovery summary').focus();await page.keyboard.press('Enter');check('Enter expande lembrança no diário',await page.locator('.vale-discovery').evaluate(n=>n.open===true));
 await page.evaluate(()=>render());await page.screenshot({path:path.join(dir,'diario-escolha-1280.png')});out.capturas.push('diario-escolha-1280.png');await close();
 await page.evaluate(()=>saveGame(true));await page.reload();await page.locator('#continueBtn').click();
 check('Continuar restaura a postura e não abre diálogo automaticamente',await page.evaluate(()=>FarmStoryWorld.serialize().decisions['rosa:caixa']===1&&!FarmStoryUI.isOpen()));
 await talk();await choice('lore:revisit');await choice('lore:rosa:caixa');
 check('Revisitar mantém sua postura e não oferece resposta repetida',await page.locator('[data-vale-choice^="reply:"]').count()===0&&await page.locator('.vale-dialog-text').textContent().then(t=>t.includes('embrulho dos três riscos')));
 await close();
 for(const viewport of [{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.locator('#valeHud').click();const r=await bounds('.vale-book');check('Diário de lembranças cabe em '+viewport.width+'x'+viewport.height,fits(r),r);await page.evaluate(()=>render());await page.screenshot({path:path.join(dir,'diario-'+viewport.width+'x'+viewport.height+'.png')});out.capturas.push('diario-'+viewport.width+'x'+viewport.height+'.png');await close();
 }
 check('Sem erros JavaScript',out.erros.length===0,out.erros);out.passou=true;
})().catch(e=>{out.passou=false;out.falha=e.stack;process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(dir,'ui.json'),JSON.stringify(out,null,2));console.log(JSON.stringify({passou:out.passou,checagens:out.checagens.length,erros:out.erros,falha:out.falha}));await browser?.close();});
