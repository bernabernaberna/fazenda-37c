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
        audioOriginal:window.FarmOriginalAudio?.keys.length===20,
        moradores:window.FarmStoryWorld?.characters.length,
        arteMundo:!!window.FarmWorldArt,
        artePersonagens:!!window.FarmCharacterArt,
        mapa:!!window.FarmWorldMap,
        interiores:!!window.FarmInteriorArt,
        animais:!!window.FarmAnimalLife
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
      const antes=await pagina.evaluate(()=>({x:player.x,y:player.y}));
      await pagina.keyboard.down('d');await pagina.waitForTimeout(200);await pagina.keyboard.up('d');
      const depois=await pagina.evaluate(()=>({x:player.x,y:player.y}));
      assert.ok(Math.hypot(depois.x-antes.x,depois.y-antes.y)>1);
      assert.ok(estado.mapa&&estado.interiores&&estado.animais);
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
      assert.equal(estado.moradores,6);assert.ok(estado.arteMundo&&estado.artePersonagens);
      // Posição preparada; tecla E e escolha de diálogo reais no arquivo offline.
      await pagina.evaluate(()=>{const n=FarmStoryIntegration.read().npcs.find(n=>n.npcId==='rosa');player.x=n.x+15;player.y=n.y;player.resting=false;});
      await pagina.keyboard.press('e');await pagina.locator('#valeDialogue').waitFor({state:'visible'});
      await pagina.locator('[data-vale-choice="main:accept"]').click();await pagina.keyboard.press('Escape');
      await pagina.locator('#valeHud').click();await pagina.locator('.vale-resident').first().waitFor({state:'visible'});await pagina.keyboard.press('Escape');
      await pagina.evaluate(()=>saveGame(true));
      const salvo=await pagina.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)));
      assert.equal(salvo.learningJourney.lifetime.quizCorrect,1);
      assert.equal(salvo.storyWorld.main[0].status,'active');
      await pagina.reload();
      if(arquivo.includes('COMPLETO')) await pagina.locator('#fzPortal .fzbtn.hot').first().click();
      await pagina.keyboard.press('Space');
      await pagina.locator('#continueBtn').click();
      await pagina.waitForFunction(()=>gameStarted && !cutsceneActive);
      const recuperado=await pagina.evaluate(()=>({name:player.name,correct:FarmLearningJourney.snapshot().lifetime.quizCorrect,coins:player.coins,capitulo:FarmStoryWorld.snapshot().chapter.status}));
      assert.equal(recuperado.name,'Demo offline');assert.equal(recuperado.correct,1);assert.equal(recuperado.coins,salvo.player.coins);
      assert.equal(recuperado.capitulo,'active');
      assert.deepEqual(erros,[]);
      estado.fluxoCompleto={novoJogo:true,movimento:true,mapaTeclaCliquePausa:true,pele:true,caderno:true,quiz:true,dialogo:true,diario:true,saveReload:true,recuperado};
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
    fs.writeFileSync(path.join(raiz,'analise','validacao-jogabilidade','offline.json'),JSON.stringify(resultados,null,2));
    console.log(JSON.stringify(resultados,null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
