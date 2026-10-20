/* Conversas reais do ato 8, com fixtures somente dos atos anteriores.
   --browser acrescenta Edge e texto do DOM; não faz build nem usa o save do usuário. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/narrativa-v67');fs.mkdirSync(out,{recursive:true});
const files=['14-story-world.js','35-valley-saga.js','36-farm-life.js'],sources=Object.fromEntries(files.map(n=>[n,fs.readFileSync(path.join(root,'src/modules',n),'utf8')]));
const ids=['rosa','lia','tomas','ines','caio','nico'],hash=v=>crypto.createHash('sha256').update(v).digest('hex'),plain=v=>JSON.parse(JSON.stringify(v));
const report={geradoEm:new Date().toISOString(),fontes:Object.fromEntries(files.map(n=>[n,hash(sources[n])])),checagens:[],vm:[],browser:[],capturas:[],erros:[],limites:['Atos anteriores, inventário e entregas recentes são preparados. As doze conversas usam FarmStoryWorld.interact, aceite e confirmação usam escolhas reais.','Objetivos de colheita, pausa e produção/encomenda são estimulados por eventos para isolar a conversa; a regressão integrada cobre as ações físicas.','Capturas exigem inspeção visual separada.']};
function check(nome,passou,evidencia){report.checagens.push({nome,passou:!!passou,...(evidencia===undefined?{}:{evidencia})});assert.ok(passou,nome);}
function create(old=false){
 const box={window:{},console};vm.createContext(box);for(const name of files){const source=old&&name==='35-valley-saga.js'?fs.readFileSync(path.resolve(root,'../backups/antes-acoes-v67-20261007/src/modules',name),'utf8'):sources[name];vm.runInContext(source,box);}
 const w=box.window.FarmStoryWorld,s=box.window.FarmValleySaga,f=box.window.FarmLife,ctx={season:'hot',region:'farm',scene:'main',timeOfDay:23,energy:90,playerName:'Jo',active:true,paused:false,player:{x:588,y:1258,coins:200,en:90,hyd:90,inv:{}}},rewards=[];
 w.init({readState:()=>ctx});s.init({readState:()=>ctx,reward:r=>{rewards.push(plain(r));ctx.player.coins+=r.coins;},onDialogue:d=>w.presentSaga(d)});f.init({readState:()=>ctx});
 return{w,s,f,box,ctx,rewards};
}
// A mesma sequência é executada em VM e dentro da página compilada.
function exercise(w,s,f,choice,coins,paint){
 const people=['rosa','lia','tomas','ines','caio','nico'];w.reset();s.reset();f.reset();
 const prior=s.serialize();for(let i=0;i<7;i++)Object.assign(prior.episodes[i],{status:'completed',paid:true,choice:0,acceptedAt:0});prior.clues=s.clueCatalogue().map(c=>c.id);s.restore(prior);
 const deliveries=f.serialize();for(const id of ['cesta-rosa','mesa-lia','canteiro-tomas','fio-ines','rota-caio','lanche-nico'])deliveries.orders[id]={deliveries:1,cooldown:180};f.restore(deliveries);
 const beforeAccept=[];for(const npcId of people){w.interact(npcId);beforeAccept.push({npcId,text:w.currentDialogue().text});w.close();}
 const offered=s.serialize(),initialCoins=coins();s.interact('rosa');s.choose('saga:episode:7:offer');s.choose('saga:episode:7:accept:'+choice);w.close();
 const accepted=s.serialize(),lines=[],queries=[];
 // Força também o caminho de primeira visita de um save antigo.
 const legacy=w.serialize();for(const id of people){legacy.flags['met:'+id]=false;legacy.visits[id]=0;}w.restore(legacy);
 for(const npcId of people){
  const queryBefore=JSON.stringify(s.serialize()),normal=s.greeting(npcId,{visit:2}),first=s.greeting(npcId,{first:true}),night=s.greeting(npcId,{visit:4,night:true});
  for(let i=0;i<25;i++){s.greeting(npcId,{visit:i+1});s.snapshot();s.cinematicScenes();}
  queries.push({npcId,stable:queryBefore===JSON.stringify(s.serialize()),normal,first,night,delivery:f.deliveryMemory(npcId).line});
  const seq=s.serialize().sequence;w.interact(npcId);const d=w.currentDialogue();lines.push({npcId,text:d.text,displayed:paint?paint():null,count:s.snapshot().act.objectives.find(o=>o.id===npcId).n,sequenceDelta:s.serialize().sequence-seq});
  const readOnly=JSON.stringify(s.serialize());w.choose('saga:menu');w.choose('saga:back');queries.at(-1).menuStable=readOnly===JSON.stringify(s.serialize());w.close();
 }
 const saved=s.serialize(),coinsBeforeRestore=coins();s.restore(saved);w.close();const restored=s.serialize(),restoredCoins=coins();
 const repeats=[];for(const npcId of people){w.interact(npcId);repeats.push({npcId,count:s.snapshot().act.objectives.find(o=>o.id===npcId).n,text:w.currentDialogue().text});w.close();}
 s.record('harvest',{amount:4});s.record('rest',{safe:true});s.record(choice?'order':'produce',{amount:3});
 const ready=s.serialize(),readyGreeting=s.greeting('rosa',{visit:2}),readyCoins=coins();s.interact('rosa');s.choose('saga:episode:7:offer');s.choose('saga:episode:7:deliver');const confirmation=s.currentDialogue().text,confirmationCoins=coins();
 s.choose('saga:menu');s.choose('saga:episode:7:offer');s.choose('saga:episode:7:deliver');const confirmationAgain=s.currentDialogue().text;
 s.choose('saga:episode:7:confirm');const resolution=s.currentDialogue().text,final=s.serialize(),paidCoins=coins();s.choose('saga:episode:7:confirm');w.close();
 const settled=f.serialize();for(const order of Object.values(settled.orders))order.cooldown=0;f.restore(settled);
 const echoes=people.map(npcId=>({npcId,text:s.greeting(npcId,{visit:8})})),finalBeforeRestore=s.serialize();s.restore(finalBeforeRestore);w.close();const finalAfterRestore=s.serialize();
 return{choice,proposal:s.snapshot().episodes[7].decision.label,beforeAccept,offered,accepted,lines,queries,saved,restored,repeats,ready,readyGreeting,confirmation,confirmationAgain,resolution,final,echoes,finalBeforeRestore,finalAfterRestore,coins:{initial:initialCoins,beforeRestore:coinsBeforeRestore,restored:restoredCoins,ready:readyCoins,confirmation:confirmationCoins,paid:paidCoins,after:coins()}};
}
const meanings=[{
 rosa:/casa aberta[\s\S]*abrir a porta[\s\S]*quem me substitui/,lia:/roda de perguntas[\s\S]*dúvida[\s\S]*ainda aberta/,tomas:/último reparo[\s\S]*cadeiras[\s\S]*qual peça é sua/,ines:/encontros[\s\S]*hora[\s\S]*voltar[\s\S]*eu confiro a rota/i,caio:/casa aberta[\s\S]*escolher[\s\S]*dizer não/,nico:/mostrar meu canteiro[\s\S]*sem terminar minha frase[\s\S]*eu preparo/i
},{
 rosa:/trabalho e trocas regulares[\s\S]*outra pessoa[\s\S]*não põe tudo no seu nome/,lia:/trabalho e trocas[\s\S]*condições[\s\S]*não quero uma disputa/,tomas:/trabalho regular[\s\S]*prazo[\s\S]*não por todos os atrasos/,ines:/trocas precisam de ida e volta[\s\S]*eu anoto[\s\S]*reorganize o trabalho/i,caio:/trocas regulares[\s\S]*cada lado pode recusar[\s\S]*antes de perguntar/,nico:/registro das trocas[\s\S]*realmente conferir[\s\S]*minha parte/
}];
function validate(p,label){
 const {choice}=p;check(label+' aceite zera as seis conversas, sem aproveitar visitas anteriores',ids.every(id=>p.offered.episodes[7].counts[id]===0&&p.accepted.episodes[7].counts[id]===0)&&p.accepted.episodes[7].acceptedAt===p.accepted.sequence);
 for(const id of ids){const l=p.lines.find(l=>l.npcId===id),q=p.queries.find(q=>q.npcId===id),before=p.beforeAccept.find(l=>l.npcId===id);
  check(label+' '+id+': resposta à proposta, limite pessoal e uma conversa contada',meanings[choice][id].test(l.text)&&l.count===1&&l.sequenceDelta===1,{texto:l.text});
  check(label+' '+id+': sem antecipação; prioridade na primeira visita, noite e entrega recente',!meanings[choice][id].test(before.text)&&q.normal===q.first&&q.normal===q.night&&l.text.startsWith(q.normal)&&!l.text.includes(q.delivery));
  check(label+' '+id+': leitura, menu e retorno não contam nova conversa',q.stable&&q.menuStable);
  if(l.displayed!==null)check(label+' '+id+': texto completo coincide com DOM visível',l.displayed===l.text);
 }
 check(label+' restore mantém progresso e moedas; repetição limita cada morador a uma contribuição',JSON.stringify(p.saved)===JSON.stringify(p.restored)&&p.coins.beforeRestore===p.coins.restored&&p.repeats.every(l=>l.count===1));
 check(label+' confirmação resume responsabilidades e pode ser adiada sem pagar',p.ready.episodes[7].status==='ready'&&p.confirmation===p.confirmationAgain&&p.coins.confirmation===p.coins.initial&&p.readyGreeting.includes('mesa')&&['Rosa','Lia','Tomás','Inês','Caio','Nico'].every(n=>p.confirmation.includes(n)));
 check(label+' Alex responde ao acordo, admite limite e divide trabalho',/quase[\s\S]*prometer demais de novo/.test(p.resolution)&&(choice?/Assumo minhas entregas[\s\S]*Tomás combina os prazos; Inês e Caio decidem suas rotas/.test(p.resolution):/Fico com minha horta[\s\S]*Lia conduz a conversa; Nico conta a parte dele/.test(p.resolution)));
 check(label+' confirmação única paga 40 e restore final não paga nem altera estado',p.final.episodeIndex===8&&p.coins.paid-p.coins.initial===40&&p.coins.after===p.coins.paid&&JSON.stringify(p.finalBeforeRestore)===JSON.stringify(p.finalAfterRestore));
}
async function browserChecks(){
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),base=process.env.FARM37_URL||'http://127.0.0.1:8766';let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});report.navegador=browser.version();const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.erros.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');});await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
  const response=await page.goto(base+'/jogo.html?v=mesa-v67-'+Date.now());assert.ok(response.ok());const body=await response.text();report.jogoSHA256=hash(body);check('Browser usa o módulo35 atual, sem injeção ou alteração em runtime',body.replace(/\r\n/g,'\n').includes(sources['35-valley-saga.js'].replace(/\r\n/g,'\n').trim()));
  await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryIntegration.reset();FarmStoryCinematics.reset();FarmStoryUI.close();FarmValleyPanels.close(false);histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;A11Y.noDeath=true;A11Y.relaxed=true;A11Y.reduceMotion=true;currentWeather=null;weatherCooldown=1e9;timeOfDay=23;currentSeason='hot';isPaused=false;soundEnabled=false;player.name='Jo';player.coins=200;player.en=90;player.hyd=90;player.resting=false;setSceneTo('main',320,864);});
  await page.evaluate('window.__mesaExercise='+exercise.toString());
  for(const choice of [0,1]){
   const p=await page.evaluate(choice=>__mesaExercise(FarmStoryWorld,FarmValleySaga,FarmLife,choice,()=>player.coins,()=>{FarmStoryUI.reveal();return document.querySelector('#valeSpeechText .vale-revealed')?.textContent;}),choice);report.browser.push(p);validate(p,'Edge proposta '+choice);
   const replay=await page.evaluate(()=>{FarmStoryIntegration.restore(FarmStoryWorld.serialize());FarmStoryCinematics.close();const before=JSON.stringify({saga:FarmValleySaga.serialize(),life:FarmLife.serialize(),story:FarmStoryWorld.serialize(),coins:player.coins});const opened=FarmStoryCinematics.play('saga-mesa',{replay:true});FarmStoryCinematics.update(.1);FarmStoryCinematics.close();return{opened,stable:before===JSON.stringify({saga:FarmValleySaga.serialize(),life:FarmLife.serialize(),story:FarmStoryWorld.serialize(),coins:player.coins})};});check('Edge proposta '+choice+': replay da cena não registra falas nem paga',replay.opened&&replay.stable,replay);
   for(const size of [[1280,800],[390,844]]){
    await page.setViewportSize({width:size[0],height:size[1]});await page.evaluate(saved=>{FarmStoryCinematics.close();FarmValleySaga.restore(saved);FarmStoryIntegration.restore(FarmStoryWorld.serialize());timeOfDay=12;FarmStoryWorld.interact('nico');FarmStoryUI.reveal();snapCamera();render();},p.accepted);
    const file=path.join(root,'site/shots','mesa-v67-proposta-'+choice+'-'+size.join('x')+'.png');await page.screenshot({path:file});report.capturas.push(file);
    const fit=await page.locator('.vale-dialog-card').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,screenWidth:innerWidth,screenHeight:innerHeight};});check('Conversa '+choice+' enquadrada em '+size.join('x'),fit.x>=0&&fit.y>=0&&fit.right<=fit.screenWidth&&fit.bottom<=fit.screenHeight,fit);
   }
  }
  check('Doze conversas no navegador sem erros de runtime',report.browser.flatMap(p=>p.lines).length===12&&report.erros.length===0,report.erros);
 }finally{await browser?.close();}
}
(async()=>{
 for(const choice of [0,1]){
  const a=create(),p=exercise(a.w,a.s,a.f,choice,()=>a.ctx.player.coins);report.vm.push(p);validate(p,'VM proposta '+choice);
  const old=create(true),baseline=exercise(old.w,old.s,old.f,choice,()=>old.ctx.player.coins);
  check('Proposta '+choice+': mesmos IDs, formato, progressão e pagamentos do backup V6.6',JSON.stringify(p.final)===JSON.stringify(baseline.final)&&JSON.stringify(a.rewards)===JSON.stringify(old.rewards),{recompensas:a.rewards,campos:Object.keys(p.final)});
  check('Proposta '+choice+': nome escolhido continua nas respostas da Rosa',p.lines[0].text.includes('Jo')&&!p.lines[0].text.includes('Alex'));
 }
 for(const id of ids)check('Propostas distintas retornam respostas e lembranças distintas para '+id,report.vm[0].lines.find(l=>l.npcId===id).text!==report.vm[1].lines.find(l=>l.npcId===id).text&&report.vm[0].echoes.find(l=>l.npcId===id).text!==report.vm[1].echoes.find(l=>l.npcId===id).text);
 if(process.argv.includes('--browser'))await browserChecks();report.passou=true;
})().catch(e=>{report.passou=false;report.falha=e.stack;process.exitCode=1;}).finally(()=>{const file=path.join(out,process.argv.includes('--browser')?'mesa-v67-browser.json':'mesa-v67-vm.json');fs.writeFileSync(file,JSON.stringify(report,null,2));console.log(JSON.stringify({passou:report.passou,checagens:report.checagens.length,conversasVM:report.vm.flatMap(p=>p.lines).length,conversasBrowser:report.browser.flatMap(p=>p.lines).length,relatorio:file,falha:report.falha}));});
