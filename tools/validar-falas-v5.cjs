/* Fala progressiva, teclado e gesto: comportamento integrado em navegador. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'analise','cutscenes-v5');fs.mkdirSync(dir,{recursive:true});
const result={geradoEm:new Date().toISOString(),metodo:'Playwright/Edge local; relógio de apresentação controlado e teclas reais; sem backend.',checagens:[],erros:[],externos:[],capturas:[]};
let browser,page;
function check(nome,passou,evidencia){result.checagens.push({nome,passou:!!passou,evidencia});assert.ok(passou,nome);}
async function shot(name){const file=path.join(dir,name+'.png');await page.screenshot({path:file});result.capturas.push(file);}
async function talk(id='rosa'){
  await page.evaluate(id=>{FarmStoryUI.close();const n=FarmStoryIntegration.read().npcs.find(n=>n.npcId===id);player.x=n.x+15;player.y=n.y;player.resting=false;player.temp=37;snapCamera();FarmStoryWorld.interact(id);render();},id);
}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>result.erros.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('farm37_seen_intro','1');requestAnimationFrame=()=>0;});
  await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin==='http://127.0.0.1:8766')return route.continue();result.externos.push(url.href);return route.abort();});
  const response=await page.goto('http://127.0.0.1:8766/jogo.html?v=falas-v5-'+Date.now());result.jogoSHA256=crypto.createHash('sha256').update(await response.body()).digest('hex');
  await page.locator('#startMenu .bigBtn').last().click();await page.locator('.cs-option[data-gender="f"]').click();await page.locator('#csName').fill('Lua');await page.locator('#csStartBtn').click();
  await page.keyboard.press('Escape');await page.waitForFunction(()=>tutorialActive,undefined,{polling:50});await page.getByRole('button',{name:'Pular tutorial',exact:true}).click();
  await page.evaluate(()=>{A11Y.noDeath=true;histologyMissionQueue.length=0;currentWeather=null;weatherCooldown=1e9;});
  await talk();
  const first=await page.evaluate(()=>({view:FarmStoryUI.presentation(),full:document.querySelector('.vale-sr-only').textContent,text:FarmStoryWorld.currentDialogue().text,visual:document.querySelector('.vale-revealed').textContent,hidden:document.querySelector('.vale-unrevealed').textContent,choice:document.activeElement.dataset.valeChoice}));
  check('Texto completo disponível imediatamente para tecnologia assistiva',first.full===first.text&&first.visual+first.hidden===first.text,first.view);
  check('Fala inicia parcial sem modificar a fonte ou recompensas',first.view.visible<first.view.total&&first.view.speaking,first.view);
  const before=await page.evaluate(()=>({player:{x:player.x,y:player.y,temp:player.temp,en:player.en,hyd:player.hyd},timer:seasonTimer,story:FarmStoryWorld.serialize(),actors:FarmStoryIntegration.read().npcs.map(o=>({x:o.x,y:o.y,anim:o.anim}))}));
  await page.evaluate(()=>{for(let i=0;i<8;i++){FarmStoryUI.update(.1);update(.05);updateWeather(.05);}render();});
  const after=await page.evaluate(()=>({player:{x:player.x,y:player.y,temp:player.temp,en:player.en,hyd:player.hyd},timer:seasonTimer,story:FarmStoryWorld.serialize(),actors:FarmStoryIntegration.read().npcs.map(o=>({x:o.x,y:o.y,anim:o.anim})),view:FarmStoryUI.presentation()}));
  check('Apresentação avança enquanto mundo e narrativa permanecem pausados',JSON.stringify(before.player)===JSON.stringify(after.player)&&before.timer===after.timer&&JSON.stringify(before.story)===JSON.stringify(after.story)&&JSON.stringify(before.actors)===JSON.stringify(after.actors)&&after.view.visible>first.view.visible,after.view);
  const npcOptions=await page.evaluate(()=>{const art=FarmCharacterArt;let captured=null;window.FarmCharacterArt={...art,drawNPC:(ctx,o,opts)=>{if(o.npcId==='rosa')captured={...opts};return art.drawNPC(ctx,o,opts);}};render();window.FarmCharacterArt=art;return captured;});
  check('NPC no mundo recebe a mesma direção expressiva do retrato',npcOptions&&npcOptions.speechTime>0&&['warm','thoughtful','joyful','concerned'].includes(npcOptions.expression),npcOptions);
  const canvasPath=path.join(dir,'morador-falando-canvas.png');fs.writeFileSync(canvasPath,Buffer.from(await page.evaluate(()=>document.getElementById('game').toDataURL('image/png').split(',')[1]),'base64'));result.capturas.push(canvasPath);
  await shot('fala-progressiva-1280');
  await page.keyboard.press('e');const revealed=await page.evaluate(()=>FarmStoryUI.presentation());
  check('E revela tudo sem escolher nem avançar a conversa',revealed.visible===revealed.total&&!revealed.speaking&&await page.locator('[data-vale-choice="main:accept"]').count()===1,revealed);
  await talk();await page.locator('[data-vale-choice="chat:return"]').focus();await page.keyboard.press('Enter');
  check('Enter confirma a escolha focada mesmo durante apresentação',await page.evaluate(()=>FarmStoryWorld.currentDialogue().kind==='response'&&FarmStoryWorld.snapshot().memories.some(m=>m.id==='topic:rosa:return'&&m.npcId==='rosa'&&m.text.length>0)));
  await page.keyboard.press('Enter');await page.locator('[data-vale-choice="main:accept"]').focus();await page.keyboard.press('Space');
  check('Espaço confirma escolha focada e aceite real segue íntegro',await page.evaluate(()=>FarmStoryWorld.snapshot().chapter.status==='active'));
  await page.evaluate(()=>{FarmStoryWorld.interact('letter');});
  await page.locator('.vale-dialog-body').focus();await page.keyboard.press('End');const end=await page.locator('.vale-dialog-body').evaluate(n=>n.scrollTop);await page.keyboard.press('Home');const home=await page.locator('.vale-dialog-body').evaluate(n=>n.scrollTop);
  check('Home e End continuam rolando cartas longas',end>0&&home===0,{end,home});
  await page.keyboard.press('Enter');check('Enter no corpo revela antes de avançar',await page.evaluate(()=>FarmStoryUI.presentation().visible===FarmStoryUI.presentation().total&&FarmStoryWorld.currentDialogue().kind==='letter'));
  await page.evaluate(()=>{A11Y.reduceMotion=true;});await talk('lia');
  const reduced=await page.evaluate(()=>FarmStoryUI.presentation());check('Redução de movimento mostra tudo sem boca ou gesto variável',reduced.visible===reduced.total&&!reduced.speaking&&reduced.reducedMotion,reduced);
  for(const width of [1280,1024,800,390,320]){
    await page.setViewportSize({width,height:width===320?640:width===390?844:width===800?480:width===1024?640:800});
    await page.evaluate(()=>{A11Y.reduceMotion=false;FarmStoryWorld.interact('rosa');FarmStoryWorld.choose('lore:rosa:caixa');FarmStoryUI.update(.1);render();});
    const box=await page.locator('.vale-dialog-card').evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight,overflow:n.scrollWidth>n.clientWidth+1};});
    check('Diálogo e revelação cabem em '+width,box.x>=0&&box.y>=0&&box.right<=box.w+1&&box.bottom<=box.h+1&&!box.overflow,box);await shot('fala-'+width);await page.keyboard.press('e');await shot('fala-completa-'+width);
  }
  await page.keyboard.press('Escape');check('Fechar desliga a apresentação e devolve foco ao jogo',await page.evaluate(()=>!FarmStoryUI.isOpen()&&FarmStoryUI.presentation()===null&&document.activeElement.id==='game'));
  check('Sem erro JavaScript nem rede externa',result.erros.length===0&&result.externos.length===0,{erros:result.erros,externos:result.externos});result.passou=true;
})().catch(e=>{result.passou=false;result.falha=e.stack;process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(dir,'falas-ui-v5.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passou:result.passou,checagens:result.checagens.length,erros:result.erros,falha:result.falha}));await browser?.close();});
