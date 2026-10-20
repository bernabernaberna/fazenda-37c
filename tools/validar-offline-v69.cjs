/* Abre os pacotes locais com rede indisponível, como um PC de escola offline. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
  const raiz=path.resolve(__dirname,'..');
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const contexto=await browser.newContext({offline:true});
  const resultados=[];
  try{
    const arquivos=['Fazenda37C-standalone.html','Fazenda37C-COMPLETO.html'].map(arquivo=>({arquivo,caminho:path.join(raiz,'release',arquivo)}));
    if(process.env.FARM37_EXTRACTED_GAME) arquivos.push({arquivo:'Fazenda37C-web.zip extraído',caminho:process.env.FARM37_EXTRACTED_GAME});
    for(const {arquivo,caminho} of arquivos){
      const pagina=await contexto.newPage(), erros=[];
      pagina.on('pageerror',e=>erros.push(e.message));
      await pagina.goto(pathToFileURL(caminho).href);
      await pagina.waitForFunction(()=>!!window.FarmBiomes && !!window.FarmThermalFeedback);
      const estado=await pagina.evaluate(()=>({
        gelo:objects.filter(o=>o.type==='mtn_ice_cache').length,
        oasis:objects.filter(o=>o.type==='des_oasis_fillpoint').length,
        recursos:!!ITEM_DEFS.ice && !!ITEM_DEFS.oasisWater,
        feedback:!!document.getElementById('thermalFeedback'),
        jornada:!!window.FarmLearningJourney,
        relatorio:!!window.FarmActivityReport,
        audioOriginal:window.FarmOriginalAudio?.keys.length===23,
        moradores:window.FarmStoryWorld?.characters.length,
        arteMundo:!!window.FarmWorldArt,
        artePersonagens:!!window.FarmCharacterArt,
        mapa:!!window.FarmWorldMap,
        interiores:!!window.FarmInteriorArt,
        animais:!!window.FarmAnimalLife,
        fronteira:!!window.FarmFrontierStory,
        mundo:{largura:scenes.main.MW,altura:scenes.main.MH}
      }));
      assert.equal(estado.gelo,1); assert.equal(estado.oasis,1);
      assert.ok(estado.recursos && estado.feedback); assert.deepEqual(erros,[]);
      if(arquivo.includes('COMPLETO')) await pagina.locator('#fzPortal .fzbtn.hot').first().click();
      await pagina.keyboard.press('Space');
      await pagina.getByRole('button',{name:'COMEÇAR NOVO JOGO',exact:false}).click();
      await pagina.locator('.cs-option[data-gender="f"]').click();
      await pagina.locator('#csName').fill('Demo offline');
      await pagina.locator('#csClassCode').fill('');
      await pagina.locator('#csStartBtn').click();
      await pagina.waitForFunction(()=>cutsceneActive);
      await pagina.keyboard.press('Space');
      await pagina.waitForFunction(()=>tutorialActive);
      await pagina.getByRole('button',{name:'Pular tutorial',exact:true}).click();
      await pagina.waitForFunction(()=>FarmStoryCinematics.isOpen()&&FarmStoryCinematics.info().id==='carta');
      const cenaAntes=await pagina.evaluate(()=>({player:{x:player.x,y:player.y,temp:player.temp},story:FarmStoryWorld.serialize(),time:timeOfDay}));
      await pagina.keyboard.press('Enter');
      assert.ok((await pagina.locator('.vc-line').textContent()).length>50);
      await pagina.keyboard.down('d');await pagina.waitForTimeout(120);await pagina.keyboard.up('d');
      assert.deepEqual(await pagina.evaluate(()=>({player:{x:player.x,y:player.y,temp:player.temp},story:FarmStoryWorld.serialize(),time:timeOfDay})),cenaAntes);
      await pagina.keyboard.press('Escape');assert.deepEqual(await pagina.evaluate(()=>FarmStoryCinematics.serialize().seenScenes),['carta']);
      const antes=await pagina.evaluate(()=>({x:player.x,y:player.y}));
      await pagina.keyboard.down('d');await pagina.waitForTimeout(200);await pagina.keyboard.up('d');
      const depois=await pagina.evaluate(()=>({x:player.x,y:player.y}));
      assert.ok(Math.hypot(depois.x-antes.x,depois.y-antes.y)>1);
      assert.ok(estado.mapa&&estado.interiores&&estado.animais);
      const bagBefore=await pagina.evaluate(()=>JSON.stringify({inv:player.inv,stock:FarmLife.snapshot().stock}));
      await pagina.keyboard.press('i');await pagina.locator('#inventoryPanel.show').waitFor();
      assert.equal(await pagina.locator('#bagGrid [data-bag-item]').count(),32);
      assert.equal(await pagina.evaluate(()=>getComputedStyle(document.getElementById('status')).display),'none');
      await pagina.locator('#bagSearch').fill('adubo');
      await pagina.locator('[data-bag-item="fertilizer"]').click();
      assert.ok((await pagina.locator('#bagDetail').textContent()).includes('50%'));
      assert.equal(await pagina.evaluate(()=>JSON.stringify({inv:player.inv,stock:FarmLife.snapshot().stock})),bagBefore);
      await pagina.keyboard.press('Escape');assert.equal(await pagina.evaluate(()=>inventoryOpen),false);
      estado.mochilaNovaOffline=true;
      await pagina.keyboard.press('g');await pagina.locator('#worldMapOverlay').waitFor({state:'visible'});
      const mapaAntes=await pagina.evaluate(()=>({x:player.x,y:player.y,temp:player.temp,time:timeOfDay}));
      await pagina.keyboard.down('d');await pagina.waitForTimeout(150);await pagina.keyboard.up('d');
      assert.deepEqual(await pagina.evaluate(()=>({x:player.x,y:player.y,temp:player.temp,time:timeOfDay})),mapaAntes);
      await pagina.keyboard.press('Escape');await pagina.locator('#worldMapOverlay').waitFor({state:'hidden'});
      await pagina.locator('#worldMapMini').click();await pagina.locator('#worldMapOverlay').waitFor({state:'visible'});await pagina.keyboard.press('g');
      await pagina.keyboard.press('h');await pagina.locator('#skinView.show').waitFor();await pagina.keyboard.press('h');
      await pagina.keyboard.press('j');await pagina.locator('#journal.show').waitFor();await pagina.keyboard.press('j');
      await pagina.locator('#journeyButton').click();
      await pagina.locator('#activityReport [data-ar="practice"]').click();
      await pagina.locator('#histologyMissionPanel.show').waitFor();
      const index=await pagina.evaluate(()=>activeHistologyMission.correctIndex);
      await pagina.locator('#histologyOptions button').nth(index).click();
      await pagina.locator('#histologyContinue').click();
      assert.equal(estado.moradores,9);assert.ok(estado.arteMundo&&estado.artePersonagens);
      assert.ok(estado.fronteira);assert.deepEqual(estado.mundo,{largura:96,altura:124});
      // Posição preparada; tecla E e escolha de diálogo reais no arquivo offline.
      await pagina.evaluate(()=>{const n=FarmStoryIntegration.read().npcs.find(n=>n.npcId==='rosa');player.x=n.x+15;player.y=n.y;player.resting=false;});
      await pagina.keyboard.press('e');await pagina.locator('#valeDialogue').waitFor({state:'visible'});
      await pagina.locator('[data-vale-choice="main:accept"]').click();await pagina.keyboard.press('Escape');
      await pagina.evaluate(()=>FarmStoryUI.open());await pagina.locator('.vale-resident').first().waitFor({state:'visible'});await pagina.keyboard.press('Escape');
      // A expansão também precisa funcionar em file://: conversa e revisão reais,
      // sem completar a missão nem produzir recompensa ao aceitar ou recarregar.
      const moedasAntesDaFronteira=await pagina.evaluate(()=>player.coins);
      await pagina.evaluate(()=>{const n=FarmStoryIntegration.read().npcs.find(n=>n.npcId==='bia');player.x=n.x-16;player.y=n.y;player.resting=false;document.getElementById('game').focus();});
      await pagina.keyboard.press('e');await pagina.locator('#valeDialogue').waitFor({state:'visible'});
      assert.equal(await pagina.evaluate(()=>FarmStoryWorld.currentDialogue()?.npcId),'bia');
      await pagina.locator('[data-vale-choice="frontier:mission:bia-nomes:offer"]').click();
      await pagina.locator('[data-vale-choice="frontier:mission:bia-nomes:accept:1"]').click();
      await pagina.keyboard.press('Escape');
      await pagina.evaluate(()=>{const marco=FarmOpenWorld.landmarks.find(m=>m.id==='open_seed_memory');player.x=marco.x;player.y=marco.y;document.getElementById('game').focus();});
      await pagina.keyboard.press('e');await pagina.locator('#valeDialogue').waitFor({state:'visible'});
      await pagina.locator('[data-vale-choice="frontier:survey:open_seed_memory"]').click();
      const fronteiraAntes=await pagina.evaluate(()=>({estado:FarmFrontierStory.serialize(),coins:player.coins}));
      assert.equal(fronteiraAntes.coins,moedasAntesDaFronteira);
      assert.equal(fronteiraAntes.estado.missions['bia-nomes'].status,'active');
      assert.equal(fronteiraAntes.estado.missions['bia-nomes'].choice,1);
      assert.equal(fronteiraAntes.estado.missions['bia-nomes'].counts.bank,1);
      assert.equal(fronteiraAntes.estado.missions['bia-nomes'].paid,false);
      assert.equal(fronteiraAntes.estado.surveys.open_seed_memory.rounds,1);
      assert.equal(fronteiraAntes.estado.surveys.open_seed_memory.cooldown,180);
      // O diálogo permanece aberto, portanto o cooldown fica pausado até salvar.
      await pagina.evaluate(()=>saveGame(true));
      const salvo=await pagina.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)));
      assert.equal(salvo.learningJourney.lifetime.quizCorrect,1);
      assert.equal(salvo.storyWorld.main[0].status,'active');
      assert.deepEqual(salvo.storyCinematics.seenScenes,['carta']);
      assert.equal(salvo.version,2);
      assert.deepEqual(salvo.frontierStory.missions,fronteiraAntes.estado.missions);
      assert.deepEqual(salvo.frontierStory.surveys,fronteiraAntes.estado.surveys);
      assert.equal(salvo.player.coins,moedasAntesDaFronteira);
      await pagina.reload();
      if(arquivo.includes('COMPLETO')) await pagina.locator('#fzPortal .fzbtn.hot').first().click();
      await pagina.keyboard.press('Space');
      // Observa o estado no mesmo evento de Continuar, depois do onclick real e
      // antes do primeiro frame; evita confundir tempo ativo com perda de cooldown.
      await pagina.evaluate(()=>document.getElementById('continueBtn').addEventListener('click',()=>{
        window.__offlineFronteiraRecuperada={estado:FarmFrontierStory.serialize(),coins:player.coins,mundo:{largura:scenes.main.MW,altura:scenes.main.MH},moradores:FarmStoryIntegration.read().npcs.length};
      },{once:true}));
      await pagina.locator('#continueBtn').click();
      await pagina.waitForFunction(()=>gameStarted && !cutsceneActive);
      const recuperado=await pagina.evaluate(()=>({name:player.name,correct:FarmLearningJourney.snapshot().lifetime.quizCorrect,coins:player.coins,capitulo:FarmStoryWorld.snapshot().chapter.status}));
      assert.equal(recuperado.name,'Demo offline');assert.equal(recuperado.correct,1);assert.equal(recuperado.coins,salvo.player.coins);
      assert.equal(recuperado.capitulo,'active');
      const fronteiraRecuperada=await pagina.evaluate(()=>window.__offlineFronteiraRecuperada);
      assert.deepEqual(fronteiraRecuperada.estado.missions,salvo.frontierStory.missions);
      assert.deepEqual(fronteiraRecuperada.estado.surveys,salvo.frontierStory.surveys);
      assert.equal(fronteiraRecuperada.estado.coinsEarned,salvo.frontierStory.coinsEarned);
      assert.equal(fronteiraRecuperada.coins,moedasAntesDaFronteira);
      assert.deepEqual(fronteiraRecuperada.mundo,{largura:96,altura:124});
      assert.equal(fronteiraRecuperada.moradores,9);
      assert.deepEqual(await pagina.evaluate(()=>FarmStoryCinematics.serialize().seenScenes),['carta']);
      await pagina.evaluate(()=>FarmStoryUI.open());await pagina.getByRole('button',{name:'Rever cenas da jornada',exact:true}).click();
      await pagina.locator('.vc-card').first().click();assert.equal(await pagina.evaluate(()=>FarmStoryCinematics.info().replay),true);
      await pagina.keyboard.press('Escape');assert.equal(await pagina.evaluate(()=>player.coins),recuperado.coins);
      assert.deepEqual(erros,[]);
      estado.fluxoCompleto={novoJogo:true,movimento:true,mapaTeclaCliquePausa:true,pele:true,caderno:true,quiz:true,dialogo:true,diario:true,cutscenePausa:true,cutsceneSaveReplay:true,saveReload:true,recuperado,fronteira:{biaPorTeclaE:true,escolhaColetiva:true,revisaoReal:true,missaoCooldownMoedasPreservados:true,recuperado:fronteiraRecuperada}};
      // Verifica também o arquivo distribuído, independentemente da API de áudio.
      const html=fs.readFileSync(caminho,'utf8');
      assert.ok(estado.jornada && estado.relatorio && estado.audioOriginal);
      assert.ok(html.includes('FarmOriginalAudio.createSound'));
      assert.ok(!html.includes('data:audio/ogg;base64,'));
      assert.ok(!/['"]audio\/[a-z_\-]+\.ogg['"]/.test(html));
      estado.audioProceduralIncluido=true;
      resultados.push({arquivo,abriuSemRede:true,erros,estado});
      await pagina.close();
    }
    fs.writeFileSync(path.join(raiz,'analise','validacao-v69','offline.json'),JSON.stringify(resultados,null,2));
    console.log(JSON.stringify(resultados,null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
