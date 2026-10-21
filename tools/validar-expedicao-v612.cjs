/* Estado puro da expansão. A suíte integrada cobre percurso físico, E e mapa. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),file=path.join(root,'src/modules/50-expedition-story.js'),source=fs.readFileSync(file,'utf8'),out=path.join(root,'analise/expedicao-v612');fs.mkdirSync(out,{recursive:true});
const report={createdAt:new Date().toISOString(),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),checks:[],paths:[],limits:['VM cobre eventos, decisões, recompensas e persistência. Percurso físico, desenho e botões exigem a suíte integrada.']};
const copy=v=>JSON.parse(JSON.stringify(v));
function check(name,pass,evidence){report.checks.push({name,pass:!!pass,...(evidence===undefined?{}:{evidence})});assert.ok(pass,name);}
function fresh(){const sandbox={window:{},console};vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:file});const api=sandbox.window.FarmExpeditionStory,rewards=[],dialogs=[],closes=[],context={name:'Jo',region:'farm',scene:'main',active:true,paused:false,x:0,y:0};let changes=0;api.init({readState:()=>context,reward:r=>rewards.push(copy(r)),onDialogue:d=>dialogs.push(copy(d)),onChange:()=>changes++,onClose:d=>closes.push(copy(d))});return{sandbox,api,rewards,dialogs,closes,context,changes:()=>changes};}
function choose(api,id){assert.ok(api.currentDialogue()?.choices.some(c=>c.id===id),'Escolha disponível: '+id);return api.choose(id);}
function accept(api,d,branch){api.interact(d.npcId);choose(api,'expedition:accept:'+d.id+':'+branch);api.close();}
function action(api,g,eventId,amount=g.goal){return api.record(g.event,{...g.match,amount,eventId});}
function open(api,d){return api.interact(d.npcId);}
try{
  const initial=fresh(),defs=copy(initial.api.missionCatalogue()),landmarks=copy(initial.api.landmarks()),ids=new Set(landmarks.map(d=>d.id)),cast=new Set(defs.flatMap(d=>d.cast));
  check('Três expedições com dois caminhos e três retornos',defs.length===3&&defs.every(d=>d.choices.length===2&&d.choices.every(p=>p.stages.length===3)));
  check('Os nove moradores participam das três expedições',cast.size===9&&['rosa','lia','ines','caio','bia','helena','davi','tomas','nico'].every(id=>cast.has(id)));
  check('Nove lugares distribuídos pelos três biomas novos',landmarks.length===9&&['highlands','meadow','coast'].every(region=>landmarks.filter(d=>d.region===region).length===3));
  check('Cada lugar tem duas observações e posições na expansão',landmarks.every(d=>d.actions.length===2&&d.actions.map(a=>a.id).join(',')==='compare,trace'&&d.x>=96*16&&d.x<144*16&&d.y>=0&&d.y<124*16&&d.actions[0].result!==d.actions[1].result));
  check('Escolhas mudam objetivos e epílogo',defs.every(d=>JSON.stringify(d.choices[0].stages.map(s=>s.objectives))!==JSON.stringify(d.choices[1].stages.map(s=>s.objectives))&&d.choices[0].ending!==d.choices[1].ending));
  check('Objetivos ligam observação e trabalho real da fazenda',defs.every(d=>d.choices.every(p=>p.stages.some(s=>s.objectives.some(g=>['water','harvest','collect','produce','rest'].includes(g.event)))&&p.stages.some(s=>s.objectives.some(g=>g.event==='survey')))));
  check('Prêmios são únicos e só estão previstos na conclusão',initial.rewards.length===0&&defs.every(d=>d.coins>=12&&d.coins<=18)&&initial.api.snapshot().coinsEarned===0);
  check('Estado inicial não inventa missão aceita ou conhecido',initial.api.snapshot().known.length===0&&initial.api.snapshot().quests.length===0&&initial.api.snapshot().arcs.every(d=>d.status==='available'&&!d.accepted));
  check('IDs de protótipo e não líderes não abrem missões',!initial.api.hasCharacter('__proto__')&&!initial.api.hasCharacter('constructor')&&!initial.api.hasCharacter('nico')&&initial.api.interact('__proto__')===null&&initial.api.menuLabel('__proto__')==='');
  const cloneCatalogue=initial.api.missionCatalogue(),cloneLandmark=initial.api.landmarks();cloneCatalogue[0].coins=999;cloneLandmark[0].x=0;
  check('Catálogos são cópias independentes',initial.api.missionCatalogue()[0].coins!==999&&initial.api.landmarks()[0].x!==0);
  for(const d of defs)for(let branch=0;branch<2;branch++){
    const run=fresh(),api=run.api,pick=d.choices[branch],label=d.id+' / caminho '+branch;
    for(const s of pick.stages)for(const g of s.objectives)action(api,g,'before:'+d.id+':'+g.id);
    const beforeSequence=api.serialize().sequence;open(api,d);check(label+' abrir não duplica evento talk',api.serialize().sequence===beforeSequence&&api.snapshot().known.includes(d.npcId));
    check(label+' leitura da oferta não aceita nem concede prêmio',api.currentDialogue().choices.filter(c=>c.id.includes(':accept:')).length===2&&api.serialize().arcs[d.id].status==='offered'&&run.rewards.length===0);
    choose(api,'expedition:accept:'+d.id+':'+branch);check(label+' aceite começa com contagens zeradas',Object.values(api.serialize().arcs[d.id].counts).every(n=>n===0)&&api.currentDialogue().text.includes('“'));
    api.close();const accepted=JSON.stringify(api.serialize().arcs[d.id]);api.choose('expedition:claim:'+d.id);api.choose('expedition:accept:'+d.id+':'+(1-branch));
    check(label+' escolhas fora do diálogo não alteram estado',JSON.stringify(api.serialize().arcs[d.id])===accepted);
    for(let stageIndex=0;stageIndex<3;stageIndex++){
      const s=pick.stages[stageIndex],step=label+' / etapa '+(stageIndex+1),before=JSON.stringify(api.serialize().arcs[d.id]);
      api.record('unknown',{amount:99});api.record('talk',{npcId:'unknown'});api.record('inspect',{clueId:'unknown'});api.record('survey',{landmarkId:'unknown',method:'trace'});
      for(const amount of [0,-1,.2,NaN,Infinity,'2'])for(const g of s.objectives)api.record(g.event,{...g.match,amount});
      check(step+' quantidades e referências inválidas não avançam',JSON.stringify(api.serialize().arcs[d.id])===before);
      for(const [i,g]of s.objectives.entries()){
        if(g.event==='talk')check(step+' morador responde ao combinado em duas vozes',api.conversationResponse(g.match.npcId).length>100&&api.conversationResponse(g.match.npcId).includes('Jo:'));
        if(g.event==='survey'){api.record('survey',{landmarkId:g.match.landmarkId,method:g.match.method==='compare'?'trace':'compare'});check(step+' observar por outro método não resolve o objetivo',api.serialize().arcs[d.id].counts[g.id]===0);}
        const uid=label+':'+stageIndex+':'+i;action(api,g,uid,1);const first=JSON.stringify(api.serialize().arcs[d.id]);action(api,g,uid,1);
        check(step+' evento '+g.id+' é idempotente',JSON.stringify(api.serialize().arcs[d.id])===first);
        if(g.goal>1){const saved=api.serialize();api.restore(saved);check(step+' reload parcial preserva contagem e não paga',api.serialize().arcs[d.id].counts[g.id]===1&&run.rewards.length===0&&!api.isOpen());action(api,g,uid,1);check(step+' replay após reload não avança',api.serialize().arcs[d.id].counts[g.id]===1);action(api,g,uid+':next',g.goal-1);}
      }
      check(step+' pronta depois de todas as ações sem pagamento',api.serialize().arcs[d.id].status==='ready'&&run.rewards.length===0);
      const ready=api.serialize();api.restore(ready);check(step+' reload não entrega nem muda a etapa',api.serialize().arcs[d.id].stage===stageIndex&&api.serialize().arcs[d.id].status==='ready'&&run.rewards.length===0);
      if(stageIndex<2){for(const g of pick.stages[stageIndex+1].objectives)action(api,g,'early:'+stageIndex+':'+g.id);open(api,d);choose(api,'expedition:next:'+d.id);check(step+' novo combinado zera as ações antecipadas',api.serialize().arcs[d.id].stage===stageIndex+1&&Object.values(api.serialize().arcs[d.id].counts).every(n=>n===0));api.close();}
      else{open(api,d);choose(api,'expedition:claim:'+d.id);}
    }
    check(label+' epílogo respeita o caminho e nome do protagonista',api.currentDialogue().text===pick.ending.replace(/\bAlex\b/g,'Jo'));
    check(label+' confirmação final paga exatamente uma vez',run.rewards.length===1&&run.rewards[0].coins===d.coins&&run.rewards[0].id==='expedition:'+d.id&&api.snapshot().completedQuestIds.includes(d.id));
    for(let i=0;i<4;i++){open(api,d);api.choose('expedition:claim:'+d.id);api.record('harvest',{amount:50});}
    api.restore(api.serialize());open(api,d);api.choose('expedition:claim:'+d.id);check(label+' replay reload e conversa não repetem prêmio',run.rewards.length===1&&api.snapshot().coinsEarned===d.coins);
    check(label+' diário e falas posteriores lembram a escolha',api.diaryView().discoveries.some(v=>v.id==='expedition:'+d.id&&v.text===pick.ending)&&!api.diaryView().quests.some(v=>v.id==='expedition:'+d.id)&&api.conversationResponse(d.npcId)===pick.echo.replace(/\bAlex\b/g,'Jo')&&d.cast.every(id=>api.conversationResponse(id).length>50));
    choose(api,'expedition:return');check(label+' voltar retoma o menu habitual sem talk extra',!api.isOpen()&&run.closes.at(-1).npcId===d.npcId&&run.closes.at(-1).returnToMenu);
    api.reset();check(label+' reset limpa só a expansão',api.snapshot().journal.length===0&&api.snapshot().completedQuestIds.length===0&&api.snapshot().known.length===0&&run.rewards.length===1);
    report.paths.push({id:d.id,branch,stages:3,coins:d.coins});
  }
  for(const d of landmarks){
    const run=fresh(),api=run.api,c=run.context;c.x=d.x+80;c.y=d.y;c.region=d.region;
    check(d.id+' inspeção distante não descobre nem narra',api.inspect(d.id)===false&&api.snapshot().clues.length===0&&!api.isOpen());
    c.x=d.x;c.paused=true;check(d.id+' pausa impede nova inspeção',api.inspect(d.id)===false);c.paused=false;c.scene='home';check(d.id+' interior não inspeciona lugar externo',api.inspect(d.id)===false);c.scene='main';c.active=false;check(d.id+' tela inicial não inspeciona',api.inspect(d.id)===false);c.active=true;
    check(d.id+' inspeção próxima abre protagonista e duas ações',api.inspect(d.id)===true&&api.currentDialogue().npcId==='player'&&api.currentDialogue().speaker==='Jo'&&api.currentDialogue().kind==='expedition'&&api.currentDialogue().choices.filter(v=>v.id.includes(':survey:')).length===2&&api.snapshot().clues.length===1&&run.rewards.length===0);
    api.close();check(d.id+' chamada direta sem escolha aberta não registra survey',api.survey(d.id,'compare')===false&&api.serialize().surveys[d.id].rounds===0);
    api.inspect(d.id);c.x=d.x+80;choose(api,'expedition:survey:'+d.id+':compare');check(d.id+' afastar depois de E invalida a observação',api.serialize().surveys[d.id].rounds===0);c.x=d.x;
    choose(api,'expedition:survey:'+d.id+':compare');check(d.id+' ação registra método autoria e cooldown sem prêmio',api.serialize().surveys[d.id].rounds===1&&api.serialize().surveys[d.id].lastMethod==='compare'&&api.serialize().surveys[d.id].cooldown===90&&api.snapshot().journal.some(v=>v.id==='survey:'+d.id+':compare')&&run.rewards.length===0);
    api.inspect(d.id);choose(api,'expedition:survey:'+d.id+':trace');check(d.id+' revisão imediata não gera novo evento',api.serialize().surveys[d.id].rounds===1);
    const saved=api.serialize();api.restore(saved);api.update(1,c);check(d.id+' reload conserva cooldown e fecha diálogo',api.serialize().surveys[d.id].cooldown===89&&!api.isOpen());c.paused=true;for(let i=0;i<20;i++)api.update(1,c);check(d.id+' leitura não encurta espera',api.serialize().surveys[d.id].cooldown===89);c.paused=false;api.inspect(d.id);for(let i=0;i<20;i++)api.update(1,c);check(d.id+' próprio diálogo pausa espera',api.serialize().surveys[d.id].cooldown===89);api.close();for(let i=0;i<90;i++)api.update(1,c);api.inspect(d.id);choose(api,'expedition:survey:'+d.id+':trace');check(d.id+' tempo ativo permite outra observação sem recompensa',api.serialize().surveys[d.id].rounds===2&&api.serialize().surveys[d.id].lastMethod==='trace'&&run.rewards.length===0);
    api.restore(api.serialize());check(d.id+' restore preserva ambos os registros canônicos',api.snapshot().journal.some(v=>v.id==='survey:'+d.id+':compare')&&api.snapshot().journal.some(v=>v.id==='survey:'+d.id+':trace'));
  }
  const bounds=fresh();for(let i=0;i<400;i++)bounds.api.record('talk',{npcId:'unknown',eventId:'bound:'+i});check('Histórico de evento é limitado',bounds.api.serialize().recentEventIds.length===160);
  const bad=bounds.api.serialize();bad.met=['rosa','rosa','__proto__'];bad.journal=[{id:'inventado',text:'INJETADO'}];bad.clues=['exp_windmill','__proto__'];bad.surveys.exp_windmill={rounds:Infinity,cooldown:Infinity,lastMethod:'evil'};bad.arcs['carta-adiante']={status:'ready',choice:0,stage:0,acceptedAt:0,counts:{'inspect-exp_post_shelter':Infinity},paid:true};bounds.api.restore(bad);
  check('Restore sanitiza números nomes status e textos',bounds.api.snapshot().known.length===1&&bounds.api.snapshot().clues.length===1&&!JSON.stringify(bounds.api.snapshot()).includes('INJETADO')&&bounds.api.serialize().surveys.exp_windmill.rounds===0&&bounds.api.serialize().surveys.exp_windmill.cooldown===0&&bounds.api.serialize().arcs['carta-adiante'].counts['inspect-exp_post_shelter']===0&&!bounds.api.serialize().arcs['carta-adiante'].paid&&bounds.rewards.length===0);
  const inherited=Object.create({version:1,arcs:{}});bounds.api.restore(inherited);check('Versão herdada não é save válido',bounds.api.snapshot().known.length===0&&bounds.rewards.length===0);
  accept(bounds.api,defs[0],0);bounds.api.record('inspect',Object.create({clueId:'exp_post_shelter'}));check('Campos herdados não completam objetivos',bounds.api.serialize().arcs['carta-adiante'].counts['inspect-exp_post_shelter']===0);
  check('Save de versão desconhecida reinicia só este módulo',bounds.api.restore({version:999})===false&&bounds.api.snapshot().arcs.every(v=>v.status==='available')&&bounds.rewards.length===0);
  const real=fresh(),d=defs[0];accept(real.api,d,0);const land=landmarks.find(v=>v.id==='exp_post_shelter');real.context.x=land.x;real.context.y=land.y;real.context.region=land.region;real.api.inspect(land.id);check('Inspeção física entra na etapa aceita exatamente uma vez',real.api.serialize().arcs[d.id].counts['inspect-'+land.id]===1&&real.api.serialize().sequence===1);real.api.close();
  real.context.paused=true;const beforeSequence=real.api.serialize().sequence;real.api.update(1,real.context);check('Entrada em região pausada não fabrica visita',real.api.serialize().sequence===beforeSequence);real.context.paused=false;real.api.restore(real.api.serialize());const restored=real.api.serialize().sequence;real.api.update(1,real.context);check('Restore em bioma novo não infere fazenda nem visita retroativa',real.api.serialize().sequence===restored&&real.api.serialize().lastRegion==='meadow');real.context.region='coast';real.api.update(1,real.context);check('Transição para costa registra região própria',real.api.serialize().lastRegion==='coast'&&real.api.serialize().sequence===restored+1);
  const reentrant=fresh(),re=reentrant.api,save=re.serialize(),def=defs[0];save.arcs[def.id]={status:'ready',choice:0,stage:2,acceptedAt:0,counts:Object.fromEntries(def.choices[0].stages[2].objectives.map(g=>[g.id,g.goal])),paid:false};re.restore(save);let calls=0;re.init({reward:()=>{calls++;re.choose('expedition:claim:'+def.id);}});open(re,def);choose(re,'expedition:claim:'+def.id);check('Callback reentrante não repete prêmio',calls===1&&re.serialize().arcs[def.id].paid);
  const allGoals=defs.flatMap(d=>d.choices.flatMap(p=>p.stages.flatMap(s=>s.objectives)));check('Objetivos usam IDs e métodos dos catálogos reais',allGoals.every(g=>g.goal>0&&Number.isInteger(g.goal)&&(g.event!=='inspect'||ids.has(g.match.clueId))&&(g.event!=='survey'||ids.has(g.match.landmarkId)&&['compare','trace'].includes(g.match.method))&&(g.event!=='talk'||cast.has(g.match.npcId))));
  const scenes=copy(initial.api.cinematicScenes());check('Duas cenas com quatro planos e conclusão explícita',scenes.length===2&&scenes.every(s=>defs.some(d=>d.id===s.expeditionMission)&&s.shots.length===4&&s.cast.includes('player')&&s.id.startsWith('expedition-')));
  report.pass=true;
}catch(error){report.pass=false;report.error=error.stack;process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'estado-vm.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,paths:report.paths.length,sha256:report.sourceSha256,error:report.error}));}
