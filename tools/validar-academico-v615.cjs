/* Nível acadêmico: contratos do banco, progressão, integração real e leitura.
   A simulação é avançada em passos controlados; não depende de tempo de rede.
   Use --offline depois de gerar os pacotes para validar também file://. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/academico-v615');
fs.mkdirSync(out,{recursive:true});
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const report={date:new Date().toISOString(),sha256:hash(fs.readFileSync(path.join(root,'jogo.html'))),checks:[],errors:[],screenshots:[],limits:['Edge headless local; relógio de animação parado e simulação avançada explicitamente.','Verificação de conteúdo e integração não substitui revisão pedagógica docente.']};
function check(name,pass,evidence){report.checks.push({name,pass:!!pass,evidence});}
let browser,page;
async function prepare(target){
  const p=await browser.newPage({viewport:{width:1280,height:800}});
  p.on('pageerror',e=>report.errors.push(e.message));
  await p.addInitScript(()=>{requestAnimationFrame=()=>0;if(!sessionStorage.getItem('farm37_academic_test_seed')){localStorage.clear();localStorage.setItem('farm37_seen_intro','1');sessionStorage.setItem('farm37_academic_test_seed','1');}});
  const response=await p.goto(target);
  await p.waitForFunction(()=>!!window.FarmAcademicProgress&&!!window.FarmAcademicHistology);
  if(target.startsWith('http')) assert.equal(hash(await response.body()),report.sha256,'Servidor deve entregar exatamente o build atual');
  await p.evaluate(()=>{
    startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();
    FarmStoryUI.close();FarmStoryIntegration.restore(FarmStoryWorld.serialize());
    soundEnabled=false;isPaused=false;histologyMissionOpen=false;histologyMissionQueue.length=0;
    _lastHistMissionAt=1e9;A11Y.noDeath=true;weatherCooldown=1e8;
    TeacherMode.setConsent(false);TeacherMode.setClassCode('');
    document.getElementById('game').focus();
    window._academicStoryEvents=[];
    const original=FarmStoryIntegration.record;
    FarmStoryIntegration.record=function(type,payload){_academicStoryEvents.push({type,payload});return original.call(this,type,payload);};
  });
  return p;
}
async function closeQuiz(p=page){await p.evaluate(()=>{if(histologyMissionOpen)closeHistologyMission();});}
async function answerCurrent(correct=true,p=page){
  const index=await p.evaluate(right=>right?activeHistologyMission.correctIndex:(activeHistologyMission.correctIndex+1)%activeHistologyMission.options.length,correct);
  await p.locator('#histologyOptions button').nth(index).click();
  return index;
}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const posts=[];
  browser.on('disconnected',()=>{});
  page=await prepare((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=academico-v615-'+Date.now());
  page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  const bank=await page.evaluate(()=>({questions:FarmAcademicHistology.questions(),sources:FarmAcademicHistology.sources()}));
  assert.ok(Array.isArray(bank.questions)&&Array.isArray(bank.sources),'Contrato público do banco acadêmico');
  const distribution=[0,0,0,0],sourceIds=new Set(bank.sources.map(s=>s.id));
  const invalid=bank.questions.filter(q=>{
    if(Number.isInteger(q.correctIndex)&&q.correctIndex>=0&&q.correctIndex<4)distribution[q.correctIndex]++;
    return !/^academic_[a-z0-9_-]+$/.test(q.id)||q.id.length>40||!q.question||!q.concept||!q.topic||
      !Array.isArray(q.options)||q.options.length!==4||new Set(q.options).size!==4||q.options.some(o=>typeof o!=='string'||!o.trim())||
      !Number.isInteger(q.correctIndex)||q.correctIndex<0||q.correctIndex>3||
      !Array.isArray(q.rationale)||q.rationale.length!==4||q.rationale.some(r=>typeof r!=='string'||r.length<20)||
      !Array.isArray(q.sourceIds)||!q.sourceIds.length||q.sourceIds.some(id=>!sourceIds.has(id));
  });
  check('Banco independente contém 24 questões completas e identificadores únicos',bank.questions.length===24&&new Set(bank.questions.map(q=>q.id)).size===24&&invalid.length===0,{total:bank.questions.length,invalid:invalid.map(q=>q.id)});
  check('Gabaritos distribuídos entre quatro alternativas',distribution.every(n=>n>=3&&n<=9),distribution);
  check('Referências legíveis disponíveis sem consulta externa',bank.sources.length>=3&&bank.sources.every(s=>s.id&&s.title&&/^https:\/\//.test(s.url)),bank.sources);
  const detached=await page.evaluate(()=>{const first=FarmAcademicHistology.questions()[0],old=first.options[0];first.options[0]='MUTADO';first.rationale[0]='MUTADO';const next=FarmAcademicHistology.questions()[0];const b=FarmAcademicProgress.bank();b[0].options[0]='MUTADO';return{bankSafe:next.options[0]===old&&next.rationale[0]!=='MUTADO',progressSafe:FarmAcademicProgress.get(next.id).options[0]===old};});
  check('Leituras do banco e da progressão não expõem arrays internos',detached.bankSafe&&detached.progressSafe,detached);
  const unit=await page.evaluate(()=>{
    const api=FarmAcademicProgress;api.reset();const q=api.next(),right=q.correctIndex,wrong=(right+1)%4;
    const empty=api.snapshot(),bad=[api.answer('inexistente',0),api.answer(q.id,-1),api.answer(q.id,4),api.answer(q.id,'0'),api.answer(q.id,NaN)];
    const afterBad=api.snapshot(),error=api.answer(q.id,wrong),afterError=api.snapshot();
    const fixed=api.answer(q.id,right),afterFixed=api.snapshot(),again=api.answer(q.id,right),afterAgain=api.snapshot();
    const lateError=api.answer(q.id,wrong),afterLateError=api.snapshot(),serialized=api.serialize();
    api.reset();api.restore(serialized);const restored=api.snapshot();
    const exposed=api.snapshot();exposed.records[0].attempts=99999;const detached=api.snapshot().attempts===restored.attempts;
    api.reset();return{q:{id:q.id,right,wrong},empty,bad,afterBad,error,afterError,fixed,afterFixed,again,afterAgain,lateError,afterLateError,serialized,restored,detached};
  });
  check('Estado vazio e entradas inválidas não registram tentativas',unit.empty.total===24&&unit.empty.score===0&&unit.empty.attempted===0&&unit.bad.every(r=>r===null)&&JSON.stringify(unit.empty)===JSON.stringify(unit.afterBad),unit.afterBad);
  check('Erro acadêmico tem explicação e zero pontos',!unit.error.correct&&unit.error.delta===0&&!unit.error.review&&unit.error.firstAttempt&&unit.afterError.score===0&&unit.afterError.attempts===1&&unit.afterError.firstCorrect===0,unit.error);
  check('Primeiro domínio vale 15 pontos mesmo após erro anterior',unit.fixed.correct&&unit.fixed.delta===15&&!unit.fixed.review&&!unit.fixed.firstAttempt&&unit.afterFixed.score===15&&unit.afterFixed.mastered===1&&unit.afterFixed.firstCorrect===0,unit.afterFixed);
  check('Revisões corretas e erradas preservam domínio e não pagam novamente',unit.again.review&&unit.again.delta===0&&unit.lateError.review&&unit.lateError.delta===0&&unit.afterLateError.score===15&&unit.afterLateError.mastered===1&&unit.afterLateError.attempts===4,unit.afterLateError);
  check('Serialização conserva tentativas, primeira resposta e domínio',JSON.stringify(unit.afterLateError)===JSON.stringify(unit.restored)&&unit.serialized.version===1&&unit.detached,unit.restored);
  const curriculum=await page.evaluate(()=>{
    const api=FarmAcademicProgress;api.reset();const sequence=[],deltas=[];
    for(let i=0;i<24;i++){
      const q=api.next();sequence.push(q.id);deltas.push(api.answer(q.id,(q.correctIndex+1)%4).delta,api.answer(q.id,q.correctIndex).delta,api.answer(q.id,q.correctIndex).delta);
    }
    const state=api.snapshot(),review=api.next();setEduLevel('academico');_lastHistMissionAt=-1e9;
    checkHistologyMissions(0,false,false);const auto={open:histologyMissionOpen,queued:histologyMissionQueue.length};
    const serialized=api.serialize();api.reset();api.restore(serialized);const restored=api.snapshot();api.reset();_lastHistMissionAt=1e9;
    return{sequence,deltas,state,review:{id:review.id,completed:review.completed},auto,restored};
  });
  check('Prática percorre as 24 questões inéditas antes das revisões',curriculum.sequence.length===24&&new Set(curriculum.sequence).size===24&&curriculum.review.completed,curriculum.sequence);
  check('Currículo completo soma 360 pontos; erros e revisões continuam sem recompensa',curriculum.state.score===360&&curriculum.state.mastered===24&&curriculum.state.attempted===24&&curriculum.state.firstCorrect===0&&curriculum.state.attempts===72&&curriculum.deltas.every((v,i)=>v===(i%3===1?15:0))&&JSON.stringify(curriculum.state)===JSON.stringify(curriculum.restored),curriculum.state);
  check('Seis blocos de estudo mantêm quatro questões e domínio próprios',curriculum.state.topics.length===6&&curriculum.state.topics.every(t=>t.total===4&&t.mastered===4),curriculum.state.topics);
  check('Concluir todo o currículo interrompe as interrupções automáticas',!curriculum.auto.open&&curriculum.auto.queued===0,curriculum.auto);
  const sanitized=await page.evaluate(()=>{
    const api=FarmAcademicProgress,q=FarmAcademicHistology.questions();
    api.restore({version:1,score:999999,records:[
      {id:q[0].id,attempts:Infinity,firstIndex:q[0].correctIndex,lastIndex:q[0].correctIndex,mastered:true},
      {id:q[0].id,attempts:9,firstIndex:0,lastIndex:0,mastered:false},
      {id:'desconhecido',attempts:1,firstIndex:0,lastIndex:0,mastered:true},
      {id:q[1].id,attempts:2,firstIndex:-1,lastIndex:0,mastered:true},
      {id:q[2].id,attempts:999999999,firstIndex:q[2].correctIndex,lastIndex:q[2].correctIndex,mastered:true},
      {id:q[3].id,attempts:-2,firstIndex:0,lastIndex:0,mastered:false}
    ]});const state=api.snapshot();api.restore({version:99,records:api.serialize().records});const rejected=api.snapshot();api.reset();return{state,rejected};
  });
  check('Save acadêmico ignora IDs desconhecidos, duplicados e índices inválidos',sanitized.state.records.length===3&&new Set(sanitized.state.records.map(r=>r.id)).size===3&&sanitized.state.records.every(r=>Number.isInteger(r.attempts)&&r.attempts>=1&&r.attempts<=100000)&&sanitized.state.score===sanitized.state.mastered*15&&sanitized.rejected.attempted===0,sanitized);
  const levels=await page.evaluate(()=>{
    setEduLevel('medio');const medium={n:activeHistologyBank().length,advanced:histologyMissions.filter(m=>missionAllowedForLevel(m)&&m.difficulty==='avancado').length};
    setEduLevel('fund');const fundamental={n:activeHistologyBank().length,advanced:histologyMissions.filter(m=>missionAllowedForLevel(m)&&m.difficulty==='avancado').length};
    setEduLevel('academico');const academic={n:activeHistologyBank().length,onlyAcademic:activeHistologyBank().every(m=>m.id.startsWith('academic_')),selectors:document.querySelectorAll('[data-edu="academico"]').length};
    setEduLevel('nao-existe');return{medium,fundamental,academic,legacy:histologyMissions.length,invalidIgnored:eduLevel==='academico',persisted:localStorage.getItem(EDU_KEY)};
  });
  check('Três níveis selecionam banco adequado sem alterar as 43 questões legadas',levels.legacy===43&&levels.medium.n===43&&levels.medium.advanced>0&&levels.fundamental.advanced===0&&levels.academic.n===24&&levels.academic.onlyAcademic&&levels.academic.selectors>=2&&levels.invalidIgnored&&levels.persisted==='academico',levels);
  await page.evaluate(()=>toggleAccess(true));
  await page.locator('#accessMenu [data-edu="medio"]').click();
  await page.locator('#accessMenu [data-edu="academico"]').click();
  const config=await page.evaluate(()=>({level:eduLevel,n:activeHistologyBank().length,active:document.querySelector('#accessMenu [data-edu="academico"]').classList.contains('eduActive')}));
  check('Botão acadêmico real nas configurações seleciona currículo e estado visual',config.level==='academico'&&config.n===24&&config.active,config);
  await page.evaluate(()=>{toggleAccess(false);openActivityReport();});
  await page.locator('#activityReport [data-ar-level]').focus();
  await page.locator('#activityReport [data-ar-level]').selectOption('fund');
  await page.locator('#activityReport [data-ar-level]').selectOption('academico');
  const reportSelect=await page.evaluate(()=>({level:eduLevel,value:document.querySelector('#activityReport [data-ar-level]').value,focus:document.activeElement?.hasAttribute('data-ar-level'),text:document.querySelector('#activityReport .ar-card').textContent}));
  let reportTrap=true;
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');reportTrap=reportTrap&&await page.evaluate(()=>document.getElementById('activityReport').contains(document.activeElement));}
  await page.locator('#activityReport [data-ar-level]').focus();await page.keyboard.press('Shift+Tab');
  reportTrap=reportTrap&&await page.evaluate(()=>document.getElementById('activityReport').contains(document.activeElement));
  check('Seletor real do relatório mantém valor, foco e navegação dentro do diálogo',reportSelect.level==='academico'&&reportSelect.value==='academico'&&reportSelect.focus&&reportTrap&&reportSelect.text.includes('24 conceitos')&&reportSelect.text.includes('sem moedas'),{...reportSelect,trapped:reportTrap});
  await page.evaluate(()=>FarmActivityReport.close());
  await page.evaluate(()=>FarmStoryWorld.interact('lia'));
  await page.locator('[data-vale-choice="job:offer"]').click();
  await page.locator('[data-vale-choice="job:accept"]').click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('h');await page.locator('#skinView.show').waitFor();await page.keyboard.press('h');
  const liaAccepted=await page.evaluate(()=>({job:FarmStoryWorld.serialize().jobs.lia,quest:FarmStoryWorld.snapshot().quests.find(q=>q.npcId==='lia'&&q.id.startsWith('job:')),events:_academicStoryEvents.slice()}));
  check('Pedido de Lia é aceito por conversa e observação real da pele',liaAccepted.job?.status==='active'&&liaAccepted.job.counts.skin===1&&liaAccepted.job.counts.quiz===0&&liaAccepted.quest.title==='Observar e explicar'&&liaAccepted.events.some(e=>e.type==='skin'),liaAccepted);
  const isolatedProgress=await page.evaluate(()=>{
    const api=FarmAcademicProgress,saved=api.serialize(),q=api.next();
    const read=()=>({lia:FarmStoryWorld.serialize().jobs.lia,events:_academicStoryEvents.slice(),coins:player.coins,journey:FarmLearningJourney.serialize(),legacyScore:histologyScore});
    const before=read();api.answer(q.id,q.correctIndex);const after=read();api.restore(saved);return{before,after};
  });
  check('API isolada de avaliação não fabrica evento, acerto da história ou moedas',require('node:util').isDeepStrictEqual(isolatedProgress.before,isolatedProgress.after),isolatedProgress);
  const queue=await page.evaluate(()=>{
    setEduLevel('medio');const mission=histologyMissions.find(m=>!m.completed);queueHistologyMission(mission);const queued=histologyMissionQueue.length;
    setEduLevel('academico');const changed={queued:histologyMissionQueue.length,flag:mission.queued};
    practiceHistology();const active=activeHistologyMission.id,result=setEduLevel('medio');
    return{queued,changed,active,result,level:eduLevel,open:histologyMissionOpen};
  });
  check('Troca de nível limpa fila antiga e é bloqueada enquanto há questão aberta',queue.queued===1&&queue.changed.queued===0&&!queue.changed.flag&&queue.active.startsWith('academic_')&&queue.result===false&&queue.level==='academico'&&queue.open,queue);
  const before=await page.evaluate(()=>({coins:player.coins,inventory:JSON.stringify(player.inv),legacyScore:histologyScore,concepts:[...unlockedConcepts],completed:histologyMissions.filter(m=>m.completed).map(m=>m.id),journey:FarmLearningJourney.serialize(),story:FarmStoryWorld.serialize(),saga:FarmValleySaga.serialize(),frontier:FarmFrontierStory.serialize(),village:FarmVillageStories.serialize(),expedition:FarmExpeditionStory.serialize(),events:_academicStoryEvents.slice()}));
  await answerCurrent(false);
  const wrongFeedback=await page.locator('#histologyFeedback').innerText();
  const afterWrong=await page.evaluate(()=>({state:FarmAcademicProgress.snapshot(),buttons:[...document.querySelectorAll('#histologyOptions button')].map(b=>b.disabled),feedback:document.getElementById('histologyFeedback').textContent,lia:FarmStoryWorld.serialize().jobs.lia,events:_academicStoryEvents.slice()}));
  check('Resposta acadêmica pelo botão apresenta comentário sem penalidade',afterWrong.state.attempts===1&&afterWrong.state.score===0&&afterWrong.buttons.every(Boolean)&&wrongFeedback.length>180&&!/−5|\-5 pontos/.test(wrongFeedback),{state:afterWrong.state,feedback:wrongFeedback});
  check('Erro acadêmico real não cumpre objetivo de acerto do pedido de Lia',afterWrong.lia.status==='active'&&afterWrong.lia.counts.quiz===0&&afterWrong.events.length===before.events.length+1&&afterWrong.events.at(-1).type==='quiz'&&afterWrong.events.at(-1).payload.correct===false&&afterWrong.events.at(-1).payload.academic===true,{lia:afterWrong.lia,event:afterWrong.events.at(-1)});
  const duplicate=await page.evaluate(()=>{const a={progress:FarmAcademicProgress.serialize(),events:_academicStoryEvents.slice(),lia:FarmStoryWorld.serialize().jobs.lia};answerHistologyMission(activeHistologyMission.correctIndex);const b={progress:FarmAcademicProgress.serialize(),events:_academicStoryEvents.slice(),lia:FarmStoryWorld.serialize().jobs.lia};return JSON.stringify(a)===JSON.stringify(b);});
  check('Clique repetido não registra resposta nem duplica evento ou objetivo da história',duplicate);
  await closeQuiz();
  await page.evaluate(()=>openHistologyMission(FarmAcademicProgress.get(FarmAcademicProgress.snapshot().records[0].id)));
  await answerCurrent(true);
  const correctFeedback=await page.locator('#histologyFeedback').innerText();
  const afterCorrect=await page.evaluate(()=>({state:FarmAcademicProgress.snapshot(),coins:player.coins,inventory:JSON.stringify(player.inv),legacyScore:histologyScore,concepts:[...unlockedConcepts],completed:histologyMissions.filter(m=>m.completed).map(m=>m.id),journey:FarmLearningJourney.serialize(),story:FarmStoryWorld.serialize(),saga:FarmValleySaga.serialize(),frontier:FarmFrontierStory.serialize(),village:FarmVillageStories.serialize(),expedition:FarmExpeditionStory.serialize(),events:_academicStoryEvents.slice()}));
  const independent=record=>Object.fromEntries(['coins','inventory','legacyScore','concepts','completed','journey'].map(k=>[k,record[k]]));
  const beforeNoReward=independent(before),afterNoReward=independent(afterCorrect);
  check('Domínio acadêmico preserva moedas, mochila, jornada e pontuação do banco básico',afterCorrect.state.score===15&&afterCorrect.state.mastered===1&&require('node:util').isDeepStrictEqual(beforeNoReward,afterNoReward),{before:beforeNoReward,after:afterNoReward,academic:afterCorrect.state});
  const quizEvents=afterCorrect.events.slice(before.events.length);
  check('Acerto acadêmico real avança pedido de Lia sem entregar ou pagar automaticamente',afterCorrect.story.jobs.lia.status==='ready'&&afterCorrect.story.jobs.lia.counts.quiz===1&&afterCorrect.story.jobs.lia.counts.skin===1&&afterCorrect.story.jobs.lia.paid===false&&afterCorrect.coins===before.coins&&quizEvents.length===2&&quizEvents.every(e=>e.type==='quiz'&&e.payload.academic===true&&e.payload.id===afterCorrect.state.records[0].id)&&quizEvents[0].payload.correct===false&&quizEvents[1].payload.correct===true&&quizEvents[1].payload.review===false,{lia:afterCorrect.story.jobs.lia,quizEvents});
  check('Feedback acadêmico apresenta raciocínio das quatro alternativas e referências',correctFeedback.length>300&&/[ABCD][\)\.:]/.test(correctFeedback)&&/fonte|referência/i.test(correctFeedback)&&!/\+10 moedas|\+15 moedas/.test(correctFeedback),correctFeedback);
  const switchBlocked=await page.evaluate(()=>{const before=eduLevel;const result=setEduLevel('fund');return{before,result,after:eduLevel};});
  check('Alterar dificuldade não fecha nem mistura a resposta em leitura',switchBlocked.result===false&&switchBlocked.before===switchBlocked.after,switchBlocked);
  const pausedBefore=await page.evaluate(()=>({player:JSON.stringify(player),timeOfDay,seasonTimer,weather:JSON.stringify(currentWeather),weatherCooldown,crops:JSON.stringify(crops),farm:JSON.stringify(FarmLife.serialize()),animals:JSON.stringify(objects.filter(o=>o.type==='animal')),progress:JSON.stringify(FarmAcademicProgress.serialize())}));
  await page.keyboard.down('w');for(const key of ['e','g','i','h','j','q','f','c','1','2'])await page.keyboard.press(key);
  await page.evaluate(()=>{const now=performance.now();for(let i=0;i<120;i++)loop(now+i*16.667);});
  await page.keyboard.up('w');
  const pausedAfter=await page.evaluate(()=>({player:JSON.stringify(player),timeOfDay,seasonTimer,weather:JSON.stringify(currentWeather),weatherCooldown,crops:JSON.stringify(crops),farm:JSON.stringify(FarmLife.serialize()),animals:JSON.stringify(objects.filter(o=>o.type==='animal')),progress:JSON.stringify(FarmAcademicProgress.serialize())}));
  check('Leitura acadêmica pausa corpo, relógios, clima, animais e produção',JSON.stringify(pausedBefore)===JSON.stringify(pausedAfter),{changed:Object.keys(pausedBefore).filter(k=>pausedBefore[k]!==pausedAfter[k])});
  check('Atalhos de jogo não atravessam o diálogo acadêmico',await page.evaluate(()=>histologyMissionOpen&&!inventoryOpen&&!journalOpen&&!skinOpen&&!FarmWorldMap.isOpen()&&!FarmStoryUI.isOpen?.()),await page.evaluate(()=>({quiz:histologyMissionOpen,inventoryOpen,journalOpen,skinOpen,map:FarmWorldMap.isOpen()})));
  const focus=await page.evaluate(()=>{const panel=document.getElementById('histologyMissionPanel');return{role:panel.getAttribute('role'),modal:panel.getAttribute('aria-modal'),inside:panel.contains(document.activeElement)};});
  let trapped=true;for(let i=0;i<12;i++){await page.keyboard.press('Tab');trapped=trapped&&await page.evaluate(()=>document.getElementById('histologyMissionPanel').contains(document.activeElement));}
  check('Diálogo anuncia modalidade e mantém navegação de teclado dentro dele',focus.role==='dialog'&&focus.modal==='true'&&focus.inside&&trapped,{...focus,trapped});
  for(const [width,height] of [[1280,800],[1024,640],[390,844]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>{document.querySelector('#histologyMissionPanel .histologyMissionCard').scrollTop=0;});
    const top=await page.evaluate(()=>{const t=document.getElementById('histologyMissionTitle').getBoundingClientRect(),q=document.getElementById('histologyQuestion').getBoundingClientRect();return{titleTop:t.top,titleBottom:t.bottom,questionLeft:q.left,questionRight:q.right};});
    check('Título e pergunta disponíveis no início da leitura em '+width+'×'+height,top.titleTop>=0&&top.titleBottom<=height&&top.questionLeft>=0&&top.questionRight<=width+1,top);
    const questionFile='academico-'+width+'x'+height+'-pergunta.png';await page.screenshot({path:path.join(out,questionFile)});report.screenshots.push(questionFile);
    await page.locator('#histologyContinue').scrollIntoViewIfNeeded();
    const layout=await page.evaluate(()=>{const panel=document.getElementById('histologyMissionPanel'),card=panel.querySelector('.histologyMissionCard'),r=card.getBoundingClientRect(),button=document.getElementById('histologyContinue').getBoundingClientRect();return{width:innerWidth,height:innerHeight,left:r.left,right:r.right,top:r.top,bottom:r.bottom,horizontal:card.scrollWidth>card.clientWidth+1,button:{top:button.top,bottom:button.bottom}};});
    check('Questão e resposta legíveis em '+width+'×'+height,!layout.horizontal&&layout.left>=-1&&layout.right<=width+1&&layout.top>=-1&&layout.bottom<=height+1&&layout.button.top>=0&&layout.button.bottom<=height+1,layout);
    const filename='academico-'+width+'x'+height+'.png';await page.screenshot({path:path.join(out,filename)});report.screenshots.push(filename);
  }
  const events=await page.evaluate(()=>TeacherMode._readLocal());
  check('Telemetria acadêmica local preserva enum compatível com servidor existente',events.length===2&&events.every(e=>e.mission_id.startsWith('academic_')&&e.difficulty==='avancado'&&['estrutura','celulas','glandulas','vasos','integracao'].includes(e.category))&&events[0].correct===false&&events[0].score===0&&events[1].correct===true&&events[1].score===15,{events,posts});
  check('Sem turma e consentimento não envia respostas à rede',posts.length===0,posts);
  await closeQuiz();
  const academicReport=await page.evaluate(()=>{FarmActivityReport.open();const exported=FarmActivityReport.exportData();return{json:exported,csv:FarmActivityReport.csv(exported),text:document.querySelector('#activityReport .ar-card').textContent};});
  check('Relatório e exportação JSON conservam primeiro erro e domínio acadêmico permanente',academicReport.json.eduLevel==='academico'&&academicReport.json.academic.score===15&&academicReport.json.academic.firstCorrect===0&&academicReport.json.academic.mastered===1&&academicReport.json.academic.records.length===1&&academicReport.text.includes('1/24 conceitos dominados')&&academicReport.text.includes('Epiderme e barreira'),{level:academicReport.json.eduLevel,academic:academicReport.json.academic});
  check('CSV exporta currículo acadêmico separado, permanente e sem moedas',academicReport.csv.includes('"permanente";"todas";"histologia_academica"')&&academicReport.csv.includes('"dominado";"0"')&&academicReport.csv.includes(academicReport.json.academic.records[0].id),academicReport.csv);
  await page.evaluate(()=>{FarmActivityReport.close();atlasCurrentCat='all';toggleHistologyAtlas(true);});
  const academicAtlas=await page.evaluate(()=>({total:document.getElementById('atlasProgressText').textContent,cards:document.querySelectorAll('#atlasGrid .atlas-card-item').length,unlocked:document.querySelectorAll('#atlasGrid .atlas-card-item.unlocked').length}));
  const atlasGroups=[];
  for(const category of ['estrutura','celulas','glandulas','vasos','integracao']){
    await page.locator('#histologyAtlas [data-cat="'+category+'"]').click();
    atlasGroups.push(await page.evaluate(cat=>({cat,cards:document.querySelectorAll('#atlasGrid .atlas-card-item').length,expected:activeHistologyBank().filter(q=>q.category===cat).length}),category));
  }
  await page.evaluate(()=>{toggleHistologyAtlas(false);setEduLevel('medio');atlasCurrentCat='all';toggleHistologyAtlas(true);});
  const legacyAtlas=await page.evaluate(()=>({cards:document.querySelectorAll('#atlasGrid .atlas-card-item').length,total:document.getElementById('atlasProgressText').textContent}));
  check('Atlas acadêmico e suas categorias exibem só as 24 questões próprias',academicAtlas.cards===24&&academicAtlas.unlocked===1&&academicAtlas.total==='1 / 24 conceitos'&&atlasGroups.every(g=>g.cards===g.expected)&&atlasGroups.reduce((n,g)=>n+g.cards,0)===24,{academicAtlas,atlasGroups});
  check('Retornar ao Médio conserva atlas original com 43 questões',legacyAtlas.cards===43&&legacyAtlas.total.endsWith('/ 43 conceitos'),legacyAtlas);
  await page.evaluate(()=>{toggleHistologyAtlas(false);setEduLevel('academico');});
  const persisted=await page.evaluate(()=>{
    saveGame(true);const saved=JSON.parse(localStorage.getItem(SAVE_KEY)),before=FarmAcademicProgress.snapshot();
    FarmAcademicProgress.reset();setEduLevel('medio');loadGameFromData(saved);
    const after=FarmAcademicProgress.snapshot();const academicUnchanged=JSON.stringify(before)===JSON.stringify(after);
    const coins=player.coins;switchSeason();const season=FarmAcademicProgress.snapshot();
    return{saved,academicUnchanged,before,after,level:eduLevel,season,coinsBefore:coins,coinsAfter:player.coins};
  });
  check('Save v2 guarda nível e progresso acadêmico sem mudar formato legado',persisted.saved.version===2&&persisted.saved.eduLevel==='academico'&&persisted.saved.academicHistology?.version===1&&Array.isArray(persisted.saved.histologyCompleted)&&persisted.academicUnchanged&&persisted.level==='academico',{version:persisted.saved.version,level:persisted.level,before:persisted.before,after:persisted.after});
  check('Mudança de estação não reinicia domínio nem permite duplicar pontos acadêmicos',JSON.stringify(persisted.after)===JSON.stringify(persisted.season)&&persisted.coinsBefore===persisted.coinsAfter,{before:persisted.after,after:persisted.season});
  const retry=await page.evaluate(()=>{const q=FarmAcademicProgress.get(FarmAcademicProgress.snapshot().records[0].id),before=FarmAcademicProgress.snapshot().score;const result=FarmAcademicProgress.answer(q.id,q.correctIndex);return{before,after:FarmAcademicProgress.snapshot().score,result};});
  check('Recarregar ou virar estação não renova pagamento por domínio',retry.before===retry.after&&retry.result.delta===0&&retry.result.review,retry);
  const beforeReload=await page.evaluate(()=>{saveGame(true);return{coins:player.coins,academic:FarmAcademicProgress.snapshot(),level:eduLevel,score:histologyScore};});
  await page.reload();await page.waitForFunction(()=>!!window.FarmAcademicProgress);await page.keyboard.press('Space');
  await page.locator('#continueBtn').click();
  const afterReload=await page.evaluate(()=>({coins:player.coins,academic:FarmAcademicProgress.snapshot(),level:eduLevel,score:histologyScore}));
  check('Recarregar a página e clicar Continuar conserva nível e progresso sem pagamento',require('node:util').isDeepStrictEqual(beforeReload,afterReload)&&afterReload.level==='academico'&&afterReload.academic.score===15,{before:beforeReload,after:afterReload});
  const oldSave=await page.evaluate(()=>{
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY));delete saved.academicHistology;delete saved.eduLevel;
    const stable={player:JSON.stringify(saved.player),completed:JSON.stringify(saved.histologyCompleted),score:saved.histologyScore};
    loadGameFromData(saved);return{progress:FarmAcademicProgress.snapshot(),level:eduLevel,coins:player.coins,expectedCoins:saved.player.coins,completed:JSON.stringify(histologyMissions.filter(m=>m.completed).map(m=>m.id)),stable,score:histologyScore};
  });
  check('Save anterior sem campo acadêmico carrega fazenda e inicia currículo vazio',oldSave.progress.attempted===0&&oldSave.progress.score===0&&oldSave.coins===oldSave.expectedCoins&&oldSave.completed===oldSave.stable.completed&&oldSave.score===oldSave.stable.score,oldSave);
  const auto=await page.evaluate(()=>{
    FarmStoryUI.close();FarmAcademicProgress.reset();setEduLevel('academico');histologyMissionQueue.length=0;_lastHistMissionAt=-1e9;
    checkHistologyMissions(0,false,false);const first={open:histologyMissionOpen,id:activeHistologyMission?.id,at:_lastHistMissionAt};
    if(histologyMissionOpen)closeHistologyMission();checkHistologyMissions(89.9,false,false);const early=histologyMissionOpen;
    checkHistologyMissions(.2,false,false);const later={open:histologyMissionOpen,id:activeHistologyMission?.id};
    return{first,early,later};
  });
  check('Missões acadêmicas automáticas respeitam intervalo de 90 segundos ativos',auto.first.open&&auto.first.id.startsWith('academic_')&&!auto.early&&auto.later.open&&auto.later.id.startsWith('academic_'),auto);
  await closeQuiz();
  const reset=await page.evaluate(()=>{
    const q=FarmAcademicProgress.next();FarmAcademicProgress.answer(q.id,q.correctIndex);
    startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();
    return{academic:FarmAcademicProgress.snapshot(),legacy:histologyScore,completed:histologyMissions.filter(m=>m.completed).length,coins:player.coins};
  });
  check('Começar novo jogo no mesmo documento limpa também o currículo acadêmico',reset.academic.score===0&&reset.academic.attempts===0&&reset.legacy===0&&reset.completed===0,reset);
  if(process.argv.includes('--offline')){
    const packages=['Fazenda37C-standalone.html','Fazenda37C-COMPLETO.html'].map(name=>({name,file:path.join(root,'release',name)}));
    if(process.env.FARM37_EXTRACTED_GAME)packages.push({name:'web.zip extraído',file:process.env.FARM37_EXTRACTED_GAME});
    for(const pkg of packages){
      const p=await browser.newPage({viewport:{width:1024,height:640}}),offlineErrors=[];
      await p.context().setOffline(true);p.on('pageerror',e=>offlineErrors.push(e.message));
      await p.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.clear();localStorage.setItem('farm37_seen_intro','1');});
      await p.goto(pathToFileURL(pkg.file).href);await p.waitForFunction(()=>!!window.FarmAcademicProgress);
      if(pkg.name.includes('COMPLETO'))await p.locator('#fzPortal .fzbtn.hot').first().click();
      await p.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();setEduLevel('academico');practiceHistology();});
      await answerCurrent(true,p);const state=await p.evaluate(()=>{saveGame(true);return{score:FarmAcademicProgress.snapshot().score,bank:activeHistologyBank().length,saved:JSON.parse(localStorage.getItem(SAVE_KEY))};});
      check('Currículo acadêmico funciona offline em '+pkg.name,state.score===15&&state.bank===24&&state.saved.academicHistology.version===1&&state.saved.eduLevel==='academico'&&!offlineErrors.length,{score:state.score,bank:state.bank,errors:offlineErrors});
      await p.close();
    }
  }
  check('Sem erros JavaScript',report.errors.length===0,report.errors);
  check('Build não mudou durante a validação',hash(fs.readFileSync(path.join(root,'jogo.html')))===report.sha256);
})().catch(err=>{report.errors.push(err.stack||String(err));report.checks.push({name:'Execução completa',pass:false,evidence:String(err)});}).finally(async()=>{
  await browser?.close();report.pass=report.checks.length>0&&report.checks.every(c=>c.pass)&&report.errors.length===0;
  fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.checks.filter(c=>c.pass).length,total:report.checks.length,failed:report.checks.filter(c=>!c.pass).map(c=>c.name),errors:report.errors,sha256:report.sha256},null,2));
  process.exitCode=report.pass?0:1;
});
