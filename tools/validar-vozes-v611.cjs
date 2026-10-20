/* Regressões do estado puro de Vozes do vale. Eventos reais de E, produção e
   cuidado pertencem à suíte integrada; esta cobre o contrato e a persistência. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),file=path.join(root,'src/modules/48-village-stories.js'),source=fs.readFileSync(file,'utf8');
const out=path.join(root,'analise/vozes-v611');fs.mkdirSync(out,{recursive:true});
const report={createdAt:new Date().toISOString(),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),checks:[],paths:[],limits:['VM valida contratos de eventos e estado; alcance físico, botões, renderização e áudio são responsabilidade da suíte integrada.']};
const copy=value=>JSON.parse(JSON.stringify(value));
function check(name,condition,evidence){report.checks.push({name,pass:!!condition,...(evidence===undefined?{}:{evidence})});assert.ok(condition,name);}
function fresh(){const sandbox={window:{},console};vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:file});const api=sandbox.window.FarmVillageStories,rewards=[],dialogs=[],closes=[],context={name:'Jo',timeOfDay:10,region:'farm',scene:'main',active:true,paused:false};let changes=0;api.init({readState:()=>context,reward:r=>rewards.push(copy(r)),onDialogue:d=>dialogs.push(copy(d)),onChange:()=>changes++,onClose:data=>closes.push(copy(data))});return{api,rewards,dialogs,closes,context,changes:()=>changes};}
function choose(api,id){const dialogue=api.currentDialogue();assert.ok(dialogue?.choices.some(choice=>choice.id===id),'Escolha deve existir: '+id);return api.choose(id);}
function openArc(api,def){api.interact(def.npcId);return choose(api,'village:arc:'+def.id);}
function accept(api,def,branch){openArc(api,def);choose(api,'village:accept:'+def.id+':'+branch);api.close();}
function action(api,g,eventId,amount=g.goal){return api.record(g.event,{...g.match,amount,eventId});}
try{
  const initial=fresh(),defs=copy(initial.api.missionCatalogue());
  check('Seis personagens, dois caminhos e três etapas por caminho',defs.length===6&&new Set(defs.map(d=>d.npcId)).size===6&&defs.every(d=>d.choices.length===2&&d.choices.every(c=>c.stages.length===3)));
  check('Cada caminho muda objetivos e epílogo',defs.every(d=>JSON.stringify(d.choices[0].stages.map(s=>s.objectives))!==JSON.stringify(d.choices[1].stages.map(s=>s.objectives))&&d.choices[0].ending!==d.choices[1].ending));
  check('Recompensas únicas de oito a quatorze moedas',defs.every(d=>d.coins>=8&&d.coins<=14)&&initial.rewards.length===0);
  check('Estado inicial não inventa moradores conhecidos ou missões aceitas',initial.api.snapshot().quests.length===0&&initial.api.snapshot().arcs.every(r=>r.status==='available'&&!r.accepted));
  check('IDs de protótipo não viram moradores',!initial.api.hasCharacter('__proto__')&&!initial.api.hasCharacter('constructor')&&initial.api.menuLabel('__proto__')===''&&initial.api.interact('__proto__')===null);
  const independent=initial.api.missionCatalogue();independent[0].choices[0].stages[0].objectives[0].goal=999;check('Catálogo público é cópia independente',initial.api.missionCatalogue()[0].choices[0].stages[0].objectives[0].goal!==999);
  for(const def of defs)for(let branch=0;branch<2;branch++){
    const run=fresh(),api=run.api,pick=def.choices[branch],label=def.id+' / caminho '+branch;
    for(const s of pick.stages)for(const g of s.objectives)action(api,g,'before:'+def.id+':'+g.id);
    const beforeSequence=api.serialize().sequence;api.interact(def.npcId);check(label+' abrir conversa não conta fala em duplicidade',api.serialize().sequence===beforeSequence&&api.snapshot().known.includes(def.npcId));
    for(const topic of ['past','routine','dream']){choose(api,'village:topic:'+topic);const d=api.currentDialogue();check(label+' conversa '+topic+' tem duas vozes e nome escolhido',d.kind==='village'&&d.text.includes('Jo:')&&!/\bAlex\b/.test(d.text));choose(api,'village:menu');}
    choose(api,'village:arc:'+def.id);const offer=api.currentDialogue();check(label+' opção não aceita por simples leitura',offer.choices.filter(c=>c.id.includes(':accept:')).length===2&&api.serialize().arcs[def.id].status==='offered');
    choose(api,'village:accept:'+def.id+':'+branch);check(label+' aceite começa com contagens zeradas',Object.values(api.serialize().arcs[def.id].counts).every(n=>n===0));api.close();
    const stale=JSON.stringify(api.serialize().arcs[def.id]);api.choose('village:claim:'+def.id);api.choose('village:accept:'+def.id+':'+(1-branch));check(label+' escolha fora do diálogo não muda o estado',JSON.stringify(api.serialize().arcs[def.id])===stale);
    for(let stageIndex=0;stageIndex<3;stageIndex++){
      const s=pick.stages[stageIndex],stageLabel=label+' / etapa '+(stageIndex+1),pre=JSON.stringify(api.serialize().arcs[def.id]);
      api.record('unknown',{amount:99});api.record('talk',{npcId:'unknown'});api.record('inspect',{clueId:'unknown'});api.record('care',{kind:'animal',action:'unknown'});
      check(stageLabel+' eventos irrelevantes não avançam',JSON.stringify(api.serialize().arcs[def.id])===pre);
      for(const amount of [0,-1,NaN,Infinity,'2',.5]){for(const g of s.objectives)api.record(g.event,{...g.match,amount});}
      check(stageLabel+' quantidades inválidas não avançam',JSON.stringify(api.serialize().arcs[def.id])===pre);
      for(const [i,g] of s.objectives.entries()){
        if(g.event==='talk')check(stageLabel+' interlocutor reage ao combinado',api.conversationResponse(g.match.npcId).length>80);
        const uid=label+':'+stageIndex+':'+i;
        action(api,g,uid,1);const first=JSON.stringify(api.serialize().arcs[def.id]);action(api,g,uid,1);check(stageLabel+' evento '+g.id+' é idempotente',JSON.stringify(api.serialize().arcs[def.id])===first);
        if(g.goal>1){
          const saved=api.serialize(),rewardsBefore=run.rewards.length;api.restore(saved);check(stageLabel+' reload parcial preserva contagem sem recompensa',api.serialize().arcs[def.id].counts[g.id]===1&&run.rewards.length===rewardsBefore&&!api.isOpen());
          action(api,g,uid,1);check(stageLabel+' replay após reload continua bloqueado',api.serialize().arcs[def.id].counts[g.id]===1);
          action(api,g,uid+':last',g.goal-1);
        }
      }
      check(stageLabel+' pronta só após todas as ações',api.serialize().arcs[def.id].status==='ready'&&run.rewards.length===0);
      const ready=api.serialize();api.restore(ready);check(stageLabel+' reload da etapa pronta não paga nem avança',api.serialize().arcs[def.id].status==='ready'&&api.serialize().arcs[def.id].stage===stageIndex&&run.rewards.length===0);
      if(stageIndex<2){for(const g of pick.stages[stageIndex+1].objectives)action(api,g,'too-soon:'+stageIndex+':'+g.id);openArc(api,def);choose(api,'village:next:'+def.id);check(stageLabel+' próxima etapa exige novo combinado e ações novas',api.serialize().arcs[def.id].stage===stageIndex+1&&Object.values(api.serialize().arcs[def.id].counts).every(n=>n===0));api.close();}
      else {openArc(api,def);choose(api,'village:claim:'+def.id);}
    }
    const ending=api.currentDialogue();check(label+' epílogo respeita escolha e substitui protagonista',ending.text===pick.ending.replace(/\bAlex\b/g,'Jo'));
    check(label+' entrega paga exatamente uma vez',run.rewards.length===1&&run.rewards[0].coins===def.coins&&run.rewards[0].id==='village:'+def.id&&api.snapshot().completedQuestIds.includes(def.id));
    for(let i=0;i<5;i++){api.choose('village:claim:'+def.id);openArc(api,def);api.record('harvest',{amount:50});}
    const completeSave=api.serialize();api.restore(completeSave);openArc(api,def);api.choose('village:claim:'+def.id);check(label+' conversa replay e reload não repetem prêmio',run.rewards.length===1&&api.snapshot().coinsEarned===def.coins&&api.serialize().arcs[def.id].paid);
    const diary=api.diaryView();check(label+' diário conserva epílogo e retira missão já concluída',diary.discoveries.some(d=>d.id==='village:'+def.id&&d.text===pick.ending)&&!diary.quests.some(d=>d.id==='village:'+def.id)&&diary.friendships[def.npcId]===6);
    choose(api,'village:menu');choose(api,'village:topic:past');check(label+' conversa muda após história e lembra o caminho escolhido',api.currentDialogue().text.includes(pick.echo.replace(/\bAlex\b/g,'Jo')));
    choose(api,'village:menu');choose(api,'village:return');check(label+' voltar entrega NPC ao menu habitual sem nova conversa',!api.isOpen()&&run.closes.at(-1).npcId===def.npcId&&run.closes.at(-1).returnToMenu);
    api.reset();check(label+' reinício limpa lembranças, objetivos e escolhas',api.snapshot().known.length===0&&api.snapshot().journal.length===0&&api.snapshot().completedQuestIds.length===0&&api.snapshot().arcs.every(r=>!r.accepted)&&run.rewards.length===1);
    report.paths.push({arc:def.id,branch,stages:3,coins:def.coins});
  }
  const bounds=fresh(),api=bounds.api;for(let i=0;i<300;i++)api.record('talk',{npcId:'unknown',eventId:'bound:'+i});check('Histórico de IDs fica limitado a 160',api.serialize().recentEventIds.length===160);
  const empty=api.serialize(),bad=copy(empty);bad.met=['__proto__','rosa','rosa',5];bad.visits={rosa:Infinity};bad.journal=[{id:'inventado',text:'INJETADO'}];bad.arcs['dobra-rosa']={status:'active',choice:0,stage:1,acceptedAt:0,counts:{harvest:Infinity},paid:true};api.restore(bad);check('Restore sanitiza nomes, números, prêmio e textos externos',api.snapshot().known.length===1&&api.serialize().visits.rosa===0&&api.serialize().arcs['dobra-rosa'].counts.harvest===0&&!api.serialize().arcs['dobra-rosa'].paid&&!JSON.stringify(api.snapshot()).includes('INJETADO')&&bounds.rewards.length===0);
  const protoPayload=Object.create({clueId:'carta-perdida'});api.reset();accept(api,defs[0],0);api.record('inspect',protoPayload);check('Campos herdados não satisfazem objetivos',api.serialize().arcs['dobra-rosa'].counts['inspect-carta-perdida']===0);
  const polluted=Object.create({version:1,arcs:{}});api.restore(polluted);check('Versão herdada não é um save válido',api.snapshot().known.length===0&&bounds.rewards.length===0);
  const input=copy(empty);input.version=999;check('Save desconhecido reinicia somente este módulo sem pagar',api.restore(input)===false&&api.snapshot().arcs.every(r=>r.status==='available')&&bounds.rewards.length===0);
  const visitRun=fresh(),vis=visitRun.api,visitDef=defs.find(d=>d.npcId==='ines');accept(vis,visitDef,0);for(const g of visitDef.choices[0].stages[0].objectives)action(vis,g,'visit:pre:'+g.id);openArc(vis,visitDef);choose(vis,'village:next:'+visitDef.id);vis.close();visitRun.context.region='mountain';const saved=vis.serialize();vis.restore(saved);vis.update(.1,visitRun.context);check('Restaurar na região não inventa nova visita',vis.serialize().arcs[visitDef.id].counts['visit-mountain']===0);visitRun.context.region='farm';vis.update(.1,visitRun.context);visitRun.context.region='mountain';visitRun.context.paused=true;vis.update(.1,visitRun.context);check('Pausa não avança a visita',vis.serialize().arcs[visitDef.id].counts['visit-mountain']===0);visitRun.context.paused=false;vis.update(.1,visitRun.context);check('Entrar na região durante jogo ativo registra visita real',vis.serialize().arcs[visitDef.id].counts['visit-mountain']===1);
  const bridge=fresh(),bd=defs.find(d=>d.npcId==='tomas');accept(bridge.api,bd,0);bridge.api.inspectBridge();check('Inspeção narra protagonista e conta a ponte para Tomás',bridge.api.currentDialogue().npcId==='player'&&bridge.api.currentDialogue().speaker==='Jo'&&bridge.api.serialize().arcs[bd.id].counts['inspect-bridge-crossing']===1);choose(bridge.api,'village:close');check('Inspeção fecha normalmente',!bridge.api.isOpen());
  const sceneDefs=copy(api.cinematicScenes());check('Duas cenas com quatro planos ligadas aos arcos corretos',sceneDefs.length===2&&sceneDefs.every(s=>defs.some(d=>d.id===s.villageMission)&&s.shots.length===4&&s.cast.includes('player')));
  for(const spec of [{id:'margem-lia',branch:0,landmark:'open_spring'},{id:'margem-lia',branch:1,landmark:'open_water_gauge'},{id:'risco-tomas',branch:1,landmark:'open_water_gauge'}]){
    const sandbox={window:{},console};vm.createContext(sandbox);for(const module of ['44-frontier-story.js','48-village-stories.js'])vm.runInContext(fs.readFileSync(path.join(root,'src/modules',module),'utf8'),sandbox,{filename:module});
    const frontier=sandbox.window.FarmFrontierStory,village=sandbox.window.FarmVillageStories,landmark=frontier.landmarks().find(d=>d.id===spec.landmark),world={scene:'main',active:true,paused:false,region:spec.landmark==='open_spring'?'forest':'wetland',x:landmark.x,y:landmark.y},def=defs.find(d=>d.id===spec.id),pick=def.choices[spec.branch];frontier.init({readState:()=>world});village.init({readState:()=>world});accept(village,def,spec.branch);for(const g of pick.stages[0].objectives)action(village,g,'frontier:pre:'+g.id);openArc(village,def);choose(village,'village:next:'+def.id);village.close();
    const goalId='inspect-'+spec.landmark;world.x+=100;check(spec.id+' ramo '+spec.branch+' inspeção distante não gera progresso',frontier.inspect(spec.landmark)===false&&village.serialize().arcs[def.id].counts[goalId]===0);world.x=landmark.x;
    const beforeSequence=village.serialize().sequence;check(spec.id+' ramo '+spec.branch+' inspeção real da fronteira chega uma vez à missão',frontier.inspect(spec.landmark)===true&&village.serialize().arcs[def.id].counts[goalId]===1&&village.serialize().sequence===beforeSequence+1);
  }
  const reentrant=fresh(),re=reentrant.api,last=defs[0],rdata=re.serialize();rdata.arcs[last.id]={status:'ready',choice:0,stage:2,acceptedAt:0,counts:Object.fromEntries(last.choices[0].stages[2].objectives.map(g=>[g.id,g.goal])),paid:false};re.restore(rdata);let calls=0;re.init({reward:()=>{calls++;re.choose('village:claim:'+last.id);}});openArc(re,last);choose(re,'village:claim:'+last.id);check('Callback reentrante não duplica a recompensa',calls===1&&re.serialize().arcs[last.id].paid);
  const catalogueSandbox={window:{},console};vm.createContext(catalogueSandbox);for(const module of ['35-valley-saga.js','44-frontier-story.js'])vm.runInContext(fs.readFileSync(path.join(root,'src/modules',module),'utf8'),catalogueSandbox,{filename:module});
  const clueIds=new Set(['bridge-crossing',...catalogueSandbox.window.FarmValleySaga.clueCatalogue().map(d=>d.id),...catalogueSandbox.window.FarmFrontierStory.landmarks().map(d=>d.id)]),npcIds=new Set([...defs.map(d=>d.npcId),...catalogueSandbox.window.FarmFrontierStory.characters.map(d=>d.id)]);
  check('Objetivos referenciam pistas e moradores dos catálogos reais',defs.every(d=>d.choices.every(c=>c.stages.every(s=>s.objectives.every(g=>g.goal>0&&Number.isInteger(g.goal)&&['talk','visit','inspect','collect','water','harvest','rest','produce','care'].includes(g.event)&&(g.event!=='inspect'||clueIds.has(g.match.clueId))&&(g.event!=='talk'||npcIds.has(g.match.npcId))&&(g.event!=='visit'||['farm','mountain','desert','forest','wetland'].includes(g.match.region)))))));
  report.pass=true;
}catch(error){report.pass=false;report.error=error.stack;process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'estado-vm.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,paths:report.paths.length,sha256:report.sourceSha256,error:report.error}));}
