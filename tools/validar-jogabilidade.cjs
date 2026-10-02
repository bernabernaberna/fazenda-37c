/* Regressões integradas da retomada: simulação real no Chromium, sem backend.
   Inicie tools/capsrv.py 8766. PLAYWRIGHT_MODULE pode apontar ao runtime local. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const raiz = path.resolve(__dirname, '..');
const saida = path.join(raiz, 'analise', 'validacao-jogabilidade');
fs.mkdirSync(saida, { recursive:true });
const url = process.env.FARM37_URL || 'http://127.0.0.1:8766';
(async()=>{
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  const erros=[];
  page.on('pageerror',e=>erros.push(e.message));
  await page.addInitScript(()=>{
    // Controla os passos qualitativos sem depender do relógio real da página.
    window.requestAnimationFrame=()=>0;
    localStorage.clear();
  });
  await page.route('https://**/*',route=>route.abort());
  await page.goto(url+'/jogo.html?v='+Date.now());
  await page.keyboard.press('Space'); // pular a abertura pela mesma ação do jogador
  await page.waitForFunction(()=>!!window.FarmBiomes && !!window.FarmThermalFeedback);
  const resultados=await page.evaluate(()=>{
    soundEnabled=false; gameStarted=true; isPaused=false; cutsceneActive=false;
    document.getElementById('startMenu').classList.add('hide');
    document.body.classList.add('game-on');
    histologyMissions.forEach(m=>m.completed=true);
    const registros=[];
    function checar(nome,condicao){ if(!condicao) throw new Error(nome); registros.push(nome); }
    function base(regiao='farm'){
      if(currentScene!=='main') setSceneTo('main');
      player.x=52*TS; player.y=(regiao==='farm'?65:regiao==='mountain'?18:100)*TS;
      player.temp=37; player.hyd=100; player.en=100; player.dead=false;
      player.resting=false; player.running=false; player.towelTimer=0;
      player.coatEquipped=false; player.scarf=false; player.boots=false;
      player.glovesEquipped=false; player.blanketEquipped=false;
      player.hat=true; player.light=true; player.upgrades.insulation=0;
      currentSeason='hot'; timeOfDay=12; seasonTimer=0;
      currentWeather=null; weatherCooldown=1e6; histologyMissionOpen=false;
      A11Y.relaxed=false;
      A11Y.noDeath=false;
      for(const k of Object.keys(keys)) delete keys[k];
      FarmThermalFeedback.reset();
    }
    function passo(dt=0.05){
      update(dt); updateWeather(dt); FarmThermalFeedback.finish(player.temp);
      FarmThermalFeedback.draw({ativo:true,suspenso:histologyMissionOpen || isPaused,morto:player.dead});
      updateBars();
      const f=FarmThermalFeedback.snapshot();
      const soma=f.termos.reduce((a,t)=>a+t.taxa,0);
      checar('Saldo causal corresponde ao efeito aplicado',Math.abs(soma-f.taxa)<1e-7);
      return f;
    }
    base(); let f=passo(); checar('Sol aquece e tem causa visível',f.taxa>0 && document.getElementById('thermalCause').textContent.includes('sol'));
    keys.d=true; keys.shift=true; f=passo(); checar('Corrida aparece como causa',f.termos.some(t=>t.rotulo==='corrida' && t.taxa>0));
    base('mountain'); f=passo(); checar('Montanha esfria',f.taxa<0 && document.getElementById('thermalCause').textContent.includes('montanha'));
    base('desert'); f=passo(); checar('Deserto aquece',f.taxa>0 && document.getElementById('thermalCause').textContent.includes('deserto'));
    const fogo=objects.find(o=>o.type==='mtn_fire');
    base('mountain'); player.x=fogo.x; player.y=fogo.y; f=passo();
    checar('Fogueira tem causa própria',f.taxa>0 && f.termos.some(t=>t.rotulo==='calor da fogueira'));
    base(); player.temp=39; player.towelTimer=8; f=passo();
    checar('Toalha e suor esfriam',f.taxa<0 && f.termos.some(t=>t.rotulo==='evaporação do suor'));
    base(); player.temp=39; player.hyd=20; f=passo();
    checar('Suor registra hidratação baixa',f.termos.some(t=>t.rotulo==='suor com hidratação baixa'));
    base(); currentWeather='heatwave'; weatherTimer=100; f=passo();
    checar('Onda de calor entra no saldo',f.termos.some(t=>t.rotulo==='onda de calor'));
    base(); currentWeather='frostwave'; weatherTimer=100; f=passo();
    checar('Onda de frio entra no saldo',f.taxa<0 && f.termos.some(t=>t.rotulo==='onda de frio'));
    base(); currentWeather='mildbreeze'; weatherTimer=100; player.temp=36.4; f=passo();
    checar('Brisa respeita o limite e registra efeito real',Math.abs(f.termos.find(t=>t.rotulo==='brisa fresca').taxa)<0.011);
    base(); currentSeason='cold'; player.inv.coat=1; player.coatEquipped=true; f=passo();
    checar('Casaco no frio participa do saldo',f.termos.some(t=>t.rotulo==='proteção do casaco'));
    base(); currentWeather='mildbreeze'; weatherTimer=100; player.temp=35.8; f=passo();
    checar('Brisa não aquece um corpo abaixo do seu limite',!f.termos.some(t=>t.rotulo==='brisa fresca' && t.taxa>0));
    base('desert'); player.temp=40.999; A11Y.noDeath=true; f=passo();
    checar('Modo assistido explica correção no calor',!player.dead && f.termos.some(t=>t.rotulo==='proteção do modo assistido') && document.getElementById('thermalCause').textContent.includes('assistido'));
    base('mountain'); player.temp=35.001; A11Y.noDeath=true; f=passo();
    checar('Modo assistido explica correção no frio',!player.dead && f.termos.some(t=>t.rotulo==='proteção do modo assistido'));
    base(); player.temp=40.999; player.hyd=20; A11Y.noDeath=true;
    currentWeather='heatwave'; weatherTimer=100;
    loop(performance.now()+50);
    checar('Limite após clima aplica modo assistido na mesma frame',!player.dead && player.temp<=40.1 && FarmThermalFeedback.snapshot().termos.some(t=>t.rotulo==='proteção do modo assistido'));
    base('desert'); player.upgrades.insulation=2; A11Y.relaxed=true; f=passo();
    checar('Isolamento e ritmo relaxado mantêm saldo consistente',f.taxa>0);
    base(); setSceneTo('house'); player.temp=39; player.resting=true; f=passo();
    checar('Descanso interior e abrigo entram no saldo',f.taxa<0 && f.termos.some(t=>t.rotulo==='descanso no interior') && f.termos.some(t=>t.rotulo==='equilíbrio no abrigo'));
    base(); currentWeather='heatwave'; weatherTimer=100; histologyMissionOpen=true;
    const antesQuiz=player.temp; update(.05); updateWeather(.05);
    FarmThermalFeedback.draw({ativo:true,suspenso:true,morto:false});
    checar('Quiz pausa temperatura inclusive clima',player.temp===antesQuiz && document.getElementById('thermalTrend').textContent.includes('pausada'));
    base(); const gelo=objects.find(o=>o.type==='mtn_ice_cache');
    checar('Gelo carimbado uma vez no mundo',objects.filter(o=>o.type==='mtn_ice_cache').length===1);
    player.x=gelo.x; player.y=gelo.y; player.inv.ice=0;
    checar('Gelo tem ação contextual',currentHint().includes('coletar gelo'));
    for(let i=0;i<3;i++) tryInteract();
    checar('Coleta gelo com custo de energia',player.inv.ice===3 && player.en===94);
    tryInteract(); checar('Mochila cheia preserva energia',player.inv.ice===3 && player.en===94);
    player.inv.ice=0; player.en=1; tryInteract(); checar('Energia insuficiente preserva recursos',player.inv.ice===0 && player.en===1);
    player.inv.ice=2; player.temp=38; useItemByKey('ice');
    checar('Gelo coletado é utilizável',player.temp===37.5 && player.inv.ice===1);
    player.temp=37.3; useItemByKey('ice'); checar('Gelo não esfria abaixo de 37,2 no jogo',player.temp===37.2);
    player.inv.ice=1; useItemByKey('ice'); checar('Gelo é guardado quando corpo já está frio',player.inv.ice===1);
    const o=objects.find(o=>o.type==='des_oasis_fillpoint');
    base('desert'); player.x=o.x; player.y=o.y; player.inv.oasisWater=0; tryInteract();
    checar('Coleta no oásis é acessível e custa energia',player.inv.oasisWater===1 && player.en===98 && ![T.OASIS,T.WATER,T.RIVER].includes(map[Math.floor(o.y/TS)][Math.floor(o.x/TS)]));
    player.hyd=40; player.en=50; useItemByKey('oasisWater');
    checar('Água do oásis recupera hidratação e energia',player.hyd===75 && player.en===55 && player.inv.oasisWater===0);
    player.inv.ice=2; player.inv.oasisWater=3; saveGame(true);
    const salvo=JSON.parse(localStorage.getItem(SAVE_KEY));
    player.inv.ice=0; player.inv.oasisWater=0; loadGameFromData(salvo);
    checar('Novos recursos persistem no save',player.inv.ice===2 && player.inv.oasisWater===3 && !FarmThermalFeedback.snapshot().pronto);
    delete salvo.player.inv.ice; delete salvo.player.inv.oasisWater; loadGameFromData(salvo);
    checar('Save antigo recebe novos recursos vazios',player.inv.ice===0 && player.inv.oasisWater===0);
    setSceneTo('house'); player.dead=true; respawnPlayer();
    checar('Renascer retorna à fazenda do mundo contíguo',currentScene==='main' && currentRegion()==='farm' && player.y===farmY(17)*TS);
    base(); f=passo(); renderFullInventory();
    checar('Itens aparecem na mochila',document.querySelectorAll('#bagGrid [title^="Gelo da montanha"]').length===1 && document.querySelectorAll('#bagGrid [title^="Água do oásis"]').length===1);
    let desenhosPele=0; const desenharPeleOriginal=drawSkinView;
    drawSkinView=function(){ desenhosPele++; return desenharPeleOriginal(); };
    skinOpen=true; loop(performance.now()+50); skinOpen=false; drawSkinView=desenharPeleOriginal;
    checar('Visão da Pele é atualizada uma vez por frame',desenhosPele===1);
    quickEditSlot=0; assignQuickSlot('ice'); checar('Gelo pode ocupar atalho',player.quickSlots[0]==='ice');
    quickEditSlot=1; assignQuickSlot('oasisWater'); checar('Água pode ocupar atalho',player.quickSlots[1]==='oasisWater');
    base(); FarmThermalFeedback.begin(37,1); FarmThermalFeedback.add('efeitos equilibrados',.0001); FarmThermalFeedback.finish(37.0001);
    FarmThermalFeedback.draw({ativo:true,suspenso:false,morto:false});
    checar('Saldo quase zero mostra estabilidade',document.getElementById('thermalTrend').textContent.includes('Estável'));
    return {checagens:registros.length,nomes:[...new Set(registros)],zoom:ZOOM};
  });
  const capturas=[];
  for(const c of [
    {nome:'fazenda-1280',w:1280,h:800,regiao:'farm',hud:true},
    {nome:'montanha-gelo',w:1280,h:800,tipo:'mtn_ice_cache',hud:true},
    {nome:'deserto-oasis',w:1280,h:800,tipo:'des_oasis_fillpoint',hud:true},
    {nome:'notebook-1024',w:1024,h:640,regiao:'farm',hud:true},
    {nome:'interface-professor',w:1024,h:640,regiao:'farm',hud:false},
    {nome:'celular-390',w:390,h:844,regiao:'farm',hud:true},
    {nome:'tela-320',w:320,h:640,regiao:'farm',hud:true}
  ]){
    await page.setViewportSize({width:c.w,height:c.h});
    await page.evaluate(c=>{
      document.body.classList.toggle('hud-game',c.hud); resize();
      const o=c.tipo && objects.find(o=>o.type===c.tipo);
      player.x=o?o.x:24*TS; player.y=o?o.y:farmY(17)*TS;
      player.temp=37.5; player.hyd=85; player.en=90; player.dead=false; player.resting=false;
      histologyMissionOpen=false; isPaused=false; currentWeather=null;
      if(c.tipo==='des_oasis_fillpoint') player.temp=38;
      _camSnap=true; update(.05); FarmThermalFeedback.finish(player.temp);
      fx.length=0;
      FarmThermalFeedback.draw({ativo:true,suspenso:false,morto:false}); updateBars(); render(); updateInteractionHint();
    },c);
    await page.screenshot({path:path.join(saida,c.nome+'.png')});
    await page.evaluate(async nome=>{
      await fetch('/shot?name='+nome,{method:'POST',body:document.getElementById('game').toDataURL('image/png')});
    },'retomada-'+c.nome);
    const layout=await page.evaluate(()=>{
      const r=document.getElementById('thermalFeedback').getBoundingClientRect();
      return {largura:innerWidth,altura:innerHeight,feedback:{x:r.x,y:r.y,w:r.width,h:r.height},texto:document.getElementById('thermalFeedback').innerText};
    });
    assert.ok(layout.feedback.x>=0 && layout.feedback.y>=0 && layout.feedback.x+layout.feedback.w<=c.w && layout.feedback.y+layout.feedback.h<=c.h,'Feedback visível: '+c.nome);
    if(c.hud){
      const colisoes=await page.evaluate(()=>{
        const hud=document.getElementById('hud').getBoundingClientRect();
        const ids=['clock','histologyChip','coins'];
        return ids.filter(id=>{
          const r=document.getElementById(id).getBoundingClientRect();
          return r.left<hud.right && r.right>hud.left && r.top<hud.bottom && r.bottom>hud.top;
        });
      });
      assert.deepEqual(colisoes,[],'HUD sem colisões: '+c.nome);
      assert.equal(await page.locator('#legend').isVisible(),false,'Cartões não cobrem hotbar');
    }
    capturas.push({nome:c.nome,layout});
  }
  await page.setViewportSize({width:1024,height:640});
  const desempenho=await page.evaluate(()=>{
    document.body.classList.add('hud-game'); resize(); player.x=24*TS; player.y=farmY(17)*TS;
    _camSnap=true; for(let i=0;i<15;i++) render();
    const amostras=[];
    for(let i=0;i<120;i++){ const inicio=performance.now(); render(); amostras.push(performance.now()-inicio); }
    amostras.sort((a,b)=>a-b);
    return {medianaMs:amostras[60],p95Ms:amostras[114],maxMs:amostras[119]};
  });
  assert.deepEqual(erros,[],'Sem erros JavaScript');
  assert.ok(desempenho.medianaMs<16.67,'Render mantém orçamento médio de frame');
  const relatorio={resultados,capturas,desempenho,erros};
  fs.writeFileSync(path.join(saida,'resultado.json'),JSON.stringify(relatorio,null,2));
  console.log(JSON.stringify({checagens:resultados.checagens,capturas:capturas.length,desempenho,erros,relatorio:path.join(saida,'resultado.json')},null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
