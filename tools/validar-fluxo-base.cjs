/* Smoke complementar no jogo servido, com teclado e botões reais.
   As posições iniciais são preparadas e o loop usa passos de 1/60 s para
   verificar barreiras e ações sem esperar caminhadas longas. Não é ensaio humano.
   Requer tools/capsrv.py 8766, Edge e Playwright local; não modifica o jogo. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.resolve(__dirname,'..');
const saida=path.join(raiz,'analise','validacao-jogabilidade','fluxo-base.json');
const baseURL=process.env.FARM37_URL || 'http://127.0.0.1:8766';
const local=new URL(baseURL);
const resultado={metodo:{geradoEm:new Date().toISOString(),navegador:'Microsoft Edge headless',
  controle:'Teclas Q/F/C/R/E/WASD e botões da loja reais; posições iniciais preparadas; requestAnimationFrame suspenso e update em passos de 1/60 s.',
  limites:['Amostras de colisão e quatro bordas; não prova todos os tiles nem todos os cantos.',
    'Gradientes percorridos na coluna 2, longe das microzonas; não cobre todas as rotas.',
    'Tomate no calor e sem corvos/clima aleatório; não cobre todas as culturas ou estações.',
    'Não mede aprendizagem, acessibilidade por pessoas ou experiência no projetor.']},
  auditoriaExistente:[],checagens:[],erros:[],pedidosExternosBloqueados:[]};
for(const [arquivo,cobertura] of [
  ['resultado.json','Balanço térmico, recursos dos biomas, interior por troca direta de cena, inventário, saves e render em quatro larguras.'],
  ['fluxo-ui.json','Loop real: novo jogo, WASD, recursos E/inventário, pausa e retomada.'],
  ['sandbox-infinito.json','Ciclos, recompensas, relatórios, migração/save e exportação; tarefas preparadas por hooks.']]){
  const p=path.join(path.dirname(saida),arquivo);
  if(fs.existsSync(p)){
    const d=JSON.parse(fs.readFileSync(p,'utf8'));
    resultado.auditoriaExistente.push({arquivo,cobertura,checagens:d.checagens?.length ?? d.resultados?.checagens,
      falhas:d.checagens?.filter(x=>!x.passou).length ?? 0,erros:d.erros?.length ?? 0,
      jogoSHA256:d.metodo?.jogoSHA256 ?? null,
      ressalva:'Hash ausente não identifica a versão só pelo JSON; hash diferente indica outro artefato.'});
  }
}
let browser,page;
function checar(nome,ok,evidencia){resultado.checagens.push({nome,passou:!!ok,evidencia});assert.ok(ok,nome);}
async function estado(){return page.evaluate(()=>window.__baseState());}
async function mover(tecla,passos=30){
  await page.keyboard.down(tecla);
  try{await page.evaluate(n=>window.__baseStep(n),passos);}finally{await page.keyboard.up(tecla);}
  return estado();
}
async function posicionar(x,y){await page.evaluate(({x,y})=>window.__basePosition(x,y),{x,y});}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  resultado.metodo.versaoNavegador=browser.version();
  page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>resultado.erros.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;localStorage.clear();});
  await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===local.origin) return route.continue();
    resultado.pedidosExternosBloqueados.push(route.request().url());return route.abort();
  });
  const response=await page.goto(baseURL+'/jogo.html?v=fluxo-base-'+Date.now());
  resultado.metodo.jogoSHA256=createHash('sha256').update(await response.body()).digest('hex');
  await page.waitForFunction(()=>!!window.FarmBiomes && !!window.FarmThermalFeedback);
  await page.evaluate(()=>{
    startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();soundEnabled=false;
    isPaused=false;histologyMissionOpen=false;currentSeason='hot';seasonTimer=0;timeOfDay=12;
    currentWeather=null;weatherCooldown=1e6;A11Y.relaxed=false;A11Y.noDeath=false;
    crows.length=0; // isola o ciclo agrícola das perdas aleatórias por aves
    document.activeElement?.blur();
    window.__basePosition=(x,y)=>{
      player.x=x;player.y=y;player.temp=37;player.hyd=100;player.en=80;
      player.resting=false;player.dead=false;player.running=false;
      for(const k of Object.keys(keys)) delete keys[k];
    };
    window.__baseStep=n=>{for(let i=0;i<n;i++){update(1/60);updateWeather(1/60);FarmThermalFeedback.finish(player.temp);}};
    window.__baseState=()=>{const t=currentTile();return {x:player.x,y:player.y,cena:currentScene,regiao:currentRegion(),
      tile:t,tileType:(map[t.y]||[])[t.x],en:player.en,hyd:player.hyd,temp:player.temp,resting:player.resting,
      crop:getCrop(t.x,t.y),seed:selectedSeedCount(),veg:player.inv.veg,coins:player.coins,shopOpen,
      tarefas:tasks.map(t=>({id:t.id,n:t.n,done:t.done})),termos:FarmThermalFeedback.snapshot().termos};};
  });
  const limites=await page.evaluate(()=>({w:MW*TS,h:MH*TS,TS}));
  for(const b of [
    {nome:'oeste',x:8,y:20*limites.TS+8,key:'a',eixo:'x',esperado:8},
    {nome:'leste',x:limites.w-8,y:20*limites.TS+8,key:'d',eixo:'x',esperado:limites.w-8},
    {nome:'norte',x:2*limites.TS+8,y:8,key:'w',eixo:'y',esperado:8},
    {nome:'sul',x:2*limites.TS+8,y:limites.h-8,key:'s',eixo:'y',esperado:limites.h-8}]){
    await posicionar(b.x,b.y);const s=await mover(b.key);
    checar('Borda '+b.nome+' mantém jogador dentro do mapa',s.cena==='main' && s[b.eixo]===b.esperado,s);
  }
  for(const [tipo,nome] of [['river','rio'],['oasis','oásis']]){
    const p=await page.evaluate(tipo=>{
      const alvo=tipo==='river'?T.RIVER:T.OASIS;
      const proibidos=new Set([T.WATER,T.RIVER,T.OASIS]);
      for(let y=1;y<MH-1;y++) for(let x=1;x<MW-1;x++){
        if(map[y][x]!==alvo) continue;
        for(const [dx,dy,key] of [[-1,0,'d'],[1,0,'a'],[0,-1,'s'],[0,1,'w']]){
          const sx=x+dx,sy=y+dy;
          if(!proibidos.has(map[sy][sx])) return {x:sx*TS+8,y:sy*TS+8,tile:{x:sx,y:sy},key,alvo:{x,y}};
        }
      }
      throw new Error('Margem não encontrada: '+tipo);
    },tipo);
    await posicionar(p.x,p.y);const s=await mover(p.key);
    checar('Colisão impede entrar na água do '+nome,s.cena==='main' && s.tile.x===p.tile.x && s.tile.y===p.tile.y,s);
  }
  // A arquitetura atual usa o contato dos pés (+7 na física), como os móveis.
  const casa=await page.evaluate(()=>{const o=objects.find(o=>o.type==='house');return {x:o.x+o.w/2,y:o.y+o.h+6,parede:o.y+o.h-3};});
  await posicionar(casa.x,casa.y);let s=await mover('w');
  checar('Parede da casa bloqueia os pés na fachada',s.cena==='main' && s.y+7>=casa.parede && s.y<casa.y,s);
  for(const [tipo,cena] of [['door_house','house'],['door_barn','barn']]){
    const porta=await page.evaluate(tipo=>{const o=objects.find(o=>o.type===tipo);return {x:o.x,y:o.y};},tipo);
    await posicionar(porta.x,porta.y);await page.keyboard.press('e');s=await estado();
    checar('E entra no interior '+cena,s.cena===cena,s);
    const antes=s;const depois=await mover('w',12);
    checar('Corredor de entrada '+cena+' permite caminhar',depois.cena===cena && depois.y<antes.y,depois);
    if(cena==='house'){
      const cama=await page.evaluate(()=>{const b=solidBoxFor(objects.find(o=>o.type==='i_bed'));return {x:b.x+b.w/2,y:b.y+b.h-7+5,bottom:b.y+b.h};});
      await posicionar(cama.x,cama.y);s=await mover('w');
      checar('Móvel interno bloqueia os pés do jogador',s.y+7>=cama.bottom && s.y<cama.y,s);
      await page.evaluate(()=>{const o=objects.find(o=>o.type==='i_bed');__basePosition(o.x+o.w/2,o.y+o.h+5);});
      await page.keyboard.press('r');const antesRest=await estado();
      await page.evaluate(()=>__baseStep(180));const depoisRest=await estado();
      checar('R descansa e recupera energia no interior',antesRest.resting && depoisRest.resting && depoisRest.en>antesRest.en,depoisRest);
      await page.keyboard.press('r');checar('R permite voltar a jogar após descanso',!(await estado()).resting);
    }
    const saidaPorta=await page.evaluate(()=>{const o=objects.find(o=>o.type==='i_door');return {x:o.x,y:o.y,dest:o._dest};});
    await posicionar(saidaPorta.x,saidaPorta.y);await page.keyboard.press('e');s=await estado();
    checar('E sai de '+cena+' na fazenda em coordenadas de mundo',s.cena==='main' && s.regiao==='farm'
      && s.x===saidaPorta.dest.x && s.y===saidaPorta.dest.y,s);
  }
  const estufa=await page.evaluate(()=>{const o=objects.find(o=>o.type==='gh_path');return {x:o.x,y:o.y+20};});
  await posicionar(estufa.x,estufa.y);s=await mover('w',10);
  checar('Caminhar na trilha entra na estufa deslocada no mundo',s.cena==='greenhouse',s);
  const ghExit=await page.evaluate(()=>{const o=objects.find(o=>o.type==='gh_exit');return {x:o.x,y:(MH-1)*TS-6,dest:o._dest};});
  await posicionar(ghExit.x,ghExit.y);s=await mover('s',12);
  checar('Caminhar na saída da estufa retorna à fazenda',s.cena==='main' && s.regiao==='farm',s);
  for(const faixa of [{nome:'montanha → fazenda',inicio:33,fim:42,min:-0.05,max:0},
    {nome:'fazenda → deserto',inicio:81,fim:90,min:0,max:0.05}]){
    await posicionar(2*limites.TS+8,faixa.inicio*limites.TS+8);
    await page.keyboard.down('s');
    let amostras;
    try{amostras=await page.evaluate(({inicio,fim})=>{
      const vistos=new Map();
      for(let i=0;i<360 && currentScene==='main' && currentTile().y<=fim;i++){
        __baseStep(1);const row=currentTile().y;
        if(!vistos.has(row) && row<=fim){const z=getZoneThermal();vistos.set(row,{linha:row,x:player.x,y:player.y,
          pesos:regionWeights(row),tempDelta:z.tempDelta,termos:FarmThermalFeedback.snapshot().termos,
          hydDelta:z.hydDelta,sweatBoost:z.sweatBoost});}
      }
      return {cena:currentScene,linha:currentTile().y,amostras:[...vistos.values()]};
    },faixa);}finally{await page.keyboard.up('s');}
    const a=amostras.amostras;
    checar('Travessia '+faixa.nome+' preserva mundo contíguo e pesos normalizados',amostras.cena==='main'
      && a.length===faixa.fim-faixa.inicio+1 && a.every(p=>Math.abs(p.pesos.reduce((n,x)=>n+x[1],0)-1)<1e-12),amostras);
    checar('Gradiente '+faixa.nome+' muda progressivamente nas oito linhas',Math.abs(a[0].tempDelta-faixa.min)<1e-9
      && Math.abs(a.at(-1).tempDelta-faixa.max)<1e-9
      && a.slice(1).every((p,i)=>p.tempDelta>a[i].tempDelta && p.tempDelta-a[i].tempDelta<=0.006250001),amostras);
    checar('Gradiente '+faixa.nome+' participa do balanço aplicado',a.every(p=>Math.abs(p.termos
      .filter(t=>['frio da montanha','calor do deserto'].includes(t.rotulo)).reduce((n,t)=>n+t.taxa,0)-p.tempDelta)<1e-8),amostras);
  }
  const lavoura=await page.evaluate(()=>{
    for(let y=42;y<82;y++) for(let x=0;x<MW;x++) if(map[y][x]===T.FIELD){
      setCrop(x,y,null);player.selectedSeed='tomato';player.inv.seeds.tomato=1;player.inv.veg=0;
      __basePosition(x*TS+8,y*TS+8);return {x,y};
    }
    throw new Error('Solo arável ausente');
  });
  await page.keyboard.press('q');s=await estado();
  checar('Q planta tomate e consome uma semente',s.crop?.stage===1 && s.crop.type==='tomato' && s.seed===0 && s.en===79,s);
  await page.keyboard.press('q');const repetido=await estado();
  checar('Q em planta existente não gasta energia nem duplica cultivo',repetido.seed===0 && repetido.en===s.en && repetido.crop.stage===1,repetido);
  await page.keyboard.press('c');s=await estado();
  checar('C preserva planta imatura e inventário',s.crop?.stage===1 && s.veg===0,s);
  await page.keyboard.press('f');await page.keyboard.press('f');s=await estado();
  checar('F rega duas vezes e consome energia',s.crop?.water===2 && s.en===77,s);
  await page.keyboard.press('f');const cheio=await estado();
  checar('F em planta já regada preserva energia',cheio.crop.water===2 && cheio.en===s.en,cheio);
  await page.evaluate(()=>__baseStep(624));s=await estado();
  checar('Planta regada amadurece pelo update sem forçar estágio',s.crop?.stage===3 && s.crop.water===0,s);
  await page.keyboard.press('c');s=await estado();
  checar('C colhe, libera solo e devolve produto e duas sementes',!s.crop && s.veg===1 && s.seed===2,{lavoura,estado:s});
  const caixa=await page.evaluate(()=>{const o=objects.find(o=>o.type==='sellbox');return {x:o.x,y:o.y};});
  await posicionar(caixa.x,caixa.y);await page.keyboard.press('e');s=await estado();
  checar('E na caixa abre a loja',s.shopOpen,s);
  await page.locator('#tabSell').click();const moedas=s.coins;
  await page.locator('#seedShopGrid .shopItem').filter({has:page.locator('b',{hasText:'Vegetais'})}).getByRole('button',{name:'Vender tudo',exact:true}).click();
  s=await estado();const reward=s.tarefas.find(t=>t.id==='sell')?.done?5:0;
  checar('Botão Vender tudo troca produto por 25 moedas e recompensa de tarefa',s.veg===0 && s.coins-moedas===25+reward,s);
  await page.keyboard.press('Escape');checar('Escape fecha loja e devolve controles',!(await estado()).shopOpen);
  checar('Navegador termina sem erro JavaScript',resultado.erros.length===0,resultado.erros);
  resultado.passou=true;
})().catch(e=>{resultado.passou=false;resultado.falha=e.stack;process.exitCode=1;})
.finally(async()=>{
  if(browser) await browser.close();
  fs.mkdirSync(path.dirname(saida),{recursive:true});fs.writeFileSync(saida,JSON.stringify(resultado,null,2)+'\n');
  console.log(JSON.stringify({passou:resultado.passou,checagens:resultado.checagens.length,
    erros:resultado.erros,falha:resultado.falha,arquivo:saida}));
});
