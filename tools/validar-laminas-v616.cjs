/* Lâminas histológicas: imagens incorporadas, leitura, domínio e compatibilidade.
   Contextos Edge novos; nunca abre o perfil nem o save usado pelo jogador.
   --offline acrescenta os três pacotes autocontidos após o empacotamento. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/laminas-v616');
fs.mkdirSync(out,{recursive:true});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const baseline='66a327a5969a46bcd136cfa14b4849654e27dab0a145d508a5e9ad34811ea45f';
const report={date:new Date().toISOString(),sha256:hash(fs.readFileSync(path.join(root,'jogo.html'))),checks:[],errors:[],screenshots:[],limits:['Edge headless local com contextos temporários e relógio de animação controlado.','A falha de decodificação é simulada disparando o evento error da imagem.','Os testes verificam integração, origem declarada e enquadramento; não substituem revisão pedagógica docente.']};
const check=(name,pass,evidence)=>report.checks.push({name,pass:!!pass,evidence});
let browser,page;
async function prepare(target,{offline=false,complete=false}={}){
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  if(offline)await context.setOffline(true);
  const p=await context.newPage();
  p.on('pageerror',error=>report.errors.push(error.message));
  await p.addInitScript(()=>{
    requestAnimationFrame=()=>0;
    if(!sessionStorage.getItem('farm37_slide_test_seed')){
      localStorage.clear();localStorage.setItem('farm37_seen_intro','1');
      sessionStorage.setItem('farm37_slide_test_seed','1');
    }
  });
  const response=await p.goto(target);
  await p.waitForFunction(()=>!!window.FarmAcademicSlides&&!!window.FarmAcademicProgress&&!!window.FarmAcademicHistology);
  if(target.startsWith('http'))check('Servidor entrega exatamente o build identificado',hash(await response.body())===report.sha256);
  if(complete)await p.locator('#fzPortal .fzbtn.hot').first().click();
  await p.evaluate(()=>{
    startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();
    FarmStoryUI.close();FarmStoryIntegration.restore(FarmStoryWorld.serialize());
    soundEnabled=false;isPaused=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;
    A11Y.noDeath=true;weatherCooldown=1e8;TeacherMode.setConsent(false);TeacherMode.setClassCode('');
    setEduLevel('academico');document.getElementById('game').focus();
  });
  return p;
}
async function closeQuiz(p=page){await p.evaluate(()=>{if(histologyMissionOpen)closeHistologyMission();});}
async function openVisual(id,p=page){
  await closeQuiz(p);
  await p.evaluate(id=>{
    const mission=id?FarmAcademicProgress.get(id):FarmAcademicProgress.next('visual');
    if(!mission||!mission.imageId)throw Error('Questão visual ausente');
    openHistologyMission(mission);
  },id||null);
  // A página usa RAF parado para testar pausa. A espera de decodificação deve
  // consultar por intervalo, sem depender desse mesmo relógio de animação.
  try{await p.waitForFunction(()=>FarmAcademicSlides.info().ready||FarmAcademicSlides.info().error,null,{polling:25});}
  catch(error){
    const state=await p.evaluate(()=>{const image=document.getElementById('histologySlideImage');return{mission:activeHistologyMission?.id,open:histologyMissionOpen,info:FarmAcademicSlides.info(),image:{complete:image.complete,width:image.naturalWidth,height:image.naturalHeight,hasSource:!!image.getAttribute('src')}};});
    error.message+=' Diagnóstico: '+JSON.stringify(state);throw error;
  }
}
async function answerCurrent(correct=true,p=page){
  const i=await p.evaluate(right=>right?activeHistologyMission.correctIndex:(activeHistologyMission.correctIndex+1)%4,correct);
  await p.locator('#histologyOptions button').nth(i).click();
}
async function screenshot(name,p=page){await p.screenshot({path:path.join(out,name)});report.screenshots.push(name);}
function safeString(value){return String(value||'').trim().length>0;}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  page=await prepare((process.env.FARM37_URL||'http://127.0.0.1:8766')+'/jogo.html?v=laminas-v616-'+Date.now());
  const bank=await page.evaluate(()=>({all:FarmAcademicHistology.questions(),visual:FarmAcademicSlides.questions(),sources:FarmAcademicHistology.sources()}));
  const original=bank.all.filter(q=>!q.imageId),visual=bank.all.filter(q=>q.imageId),sourceIds=new Set(bank.sources.map(s=>s.id));
  check('24 questões anteriores preservam texto, alternativas, gabaritos e justificativas',original.length===24&&hash(JSON.stringify(original))===baseline,{count:original.length,sha256:hash(JSON.stringify(original))});
  check('Currículo contém 36 questões únicas, sendo 12 de identificação visual',bank.all.length===36&&visual.length===12&&bank.visual.length===12&&new Set(bank.all.map(q=>q.id)).size===36&&isDeepStrictEqual(visual,bank.visual),{total:bank.all.length,visual:visual.length,ids:visual.map(q=>q.id)});
  const invalid=visual.filter(q=>!/^academic_[a-z0-9_-]+$/.test(q.id)||q.id.length>40||!q.question||!q.concept||!q.topic||!Array.isArray(q.options)||q.options.length!==4||new Set(q.options).size!==4||!Number.isInteger(q.correctIndex)||q.correctIndex<0||q.correctIndex>3||!Array.isArray(q.rationale)||q.rationale.length!==4||q.rationale.some(r=>!r||r.length<20)||!Array.isArray(q.sourceIds)||!q.sourceIds.length||q.sourceIds.some(id=>!sourceIds.has(id)));
  check('Perguntas visuais têm quatro alternativas, justificativas e referências registradas',invalid.length===0,{invalid:invalid.map(q=>q.id),topics:[...new Set(visual.map(q=>q.topic))]});
  const assets=await page.evaluate(async()=>{
    const all=FarmAcademicSlides.assets(),rows=[];
    for(const listed of all){
      const a=FarmAcademicSlides.asset(listed.id);
      if(!a){rows.push({id:listed.id,exists:false});continue;}
      const decoded=await new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({ok:true,width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>resolve({ok:false,width:0,height:0});img.src=a.dataUrl;});
      rows.push({id:a.id,exists:true,width:a.width,height:a.height,author:a.author,license:a.license,licenseUrl:a.licenseUrl,sourceUrl:a.sourceUrl,changes:a.changes,stain:a.stain,species:a.species,title:a.title,embedded:/^data:image\/(png|jpeg|webp);base64,/.test(a.dataUrl||''),decoded});
    }
    return rows;
  });
  check('Todas as lâminas decodificam de dados incorporados com dimensões declaradas',assets.length>0&&assets.every(a=>a.exists&&a.embedded&&a.decoded.ok&&a.decoded.width===a.width&&a.decoded.height===a.height&&a.width>=200&&a.height>=240&&Math.max(a.width,a.height)>=600),assets.map(a=>({id:a.id,width:a.width,height:a.height,embedded:a.embedded,decoded:a.decoded})));
  check('Toda pergunta referencia uma lâmina existente',visual.every(q=>assets.some(a=>a.id===q.imageId)),{assets:assets.map(a=>a.id),imageIds:[...new Set(visual.map(q=>q.imageId))]});
  check('Origem, autoria, licença, preparação e alterações estão documentadas',assets.every(a=>safeString(a.author)&&safeString(a.license)&&/^https:\/\//.test(a.licenseUrl||'')&&/^https:\/\//.test(a.sourceUrl||'')&&safeString(a.changes)&&safeString(a.stain)&&safeString(a.species)&&safeString(a.title)),assets.map(({decoded,embedded,...a})=>a));
  const clone=await page.evaluate(()=>{
    const a=FarmAcademicSlides.questions(),id=a[0].id,old=a[0].options[0];a[0].options[0]='MUTADO';
    const b=FarmAcademicHistology.questions();b.find(q=>q.id===id).options[0]='MUTADO';
    return{slidesSafe:FarmAcademicSlides.questions()[0].options[0]===old,bankSafe:FarmAcademicProgress.get(id).options[0]===old};
  });
  check('Leituras das questões visuais devolvem cópias independentes',clone.slidesSafe&&clone.bankSafe,clone);
  const curriculum=await page.evaluate(()=>{
    FarmAcademicProgress.reset();const deltas=[],ids=[];
    for(let i=0;i<36;i++){const q=FarmAcademicProgress.next();ids.push(q.id);deltas.push(FarmAcademicProgress.answer(q.id,(q.correctIndex+1)%4).delta,FarmAcademicProgress.answer(q.id,q.correctIndex).delta,FarmAcademicProgress.answer(q.id,q.correctIndex).delta);}
    const complete=FarmAcademicProgress.snapshot(),saved=FarmAcademicProgress.serialize();
    FarmAcademicProgress.reset();FarmAcademicProgress.restore(saved);const restored=FarmAcademicProgress.snapshot();
    const review=FarmAcademicProgress.next('visual');const repeat=FarmAcademicProgress.answer(review.id,review.correctIndex);
    FarmAcademicProgress.reset();return{ids,deltas,complete,restored,review:{id:review.id,imageId:review.imageId},repeat};
  });
  check('36 domínios somam 540 pontos e revisões não duplicam recompensa',curriculum.ids.length===36&&new Set(curriculum.ids).size===36&&curriculum.complete.total===36&&curriculum.complete.mastered===36&&curriculum.complete.score===540&&curriculum.complete.attempts===108&&curriculum.deltas.every((d,i)=>d===(i%3===1?15:0))&&curriculum.repeat.review&&curriculum.repeat.delta===0,curriculum.complete);
  check('Save completo restaura os 36 registros sem truncar as lâminas',isDeepStrictEqual(curriculum.complete,curriculum.restored)&&!!curriculum.review.imageId,{restored:curriculum.restored,review:curriculum.review});
  const upgraded=await page.evaluate(()=>{
    FarmAcademicProgress.reset();const old=FarmAcademicHistology.questions().filter(q=>!q.imageId);
    for(const q of old)FarmAcademicProgress.answer(q.id,q.correctIndex);
    saveGame(true);const save=JSON.parse(localStorage.getItem(SAVE_KEY));
    const before={coins:player.coins,inv:JSON.stringify(player.inv),legacyScore:histologyScore,completed:histologyMissions.filter(q=>q.completed).map(q=>q.id)};
    FarmAcademicProgress.reset();loadGameFromData(save);
    const after={coins:player.coins,inv:JSON.stringify(player.inv),legacyScore:histologyScore,completed:histologyMissions.filter(q=>q.completed).map(q=>q.id)};
    const snapshot=FarmAcademicProgress.snapshot(),next=FarmAcademicProgress.next(),nextVisual=FarmAcademicProgress.next('visual');
    return{before,after,version:save.version,academicVersion:save.academicHistology.version,snapshot,next:{id:next.id,imageId:next.imageId},nextVisual:{id:nextVisual.id,imageId:nextVisual.imageId}};
  });
  check('Progresso de 24 questões migra para 24/36 com 360 pontos e próximas lâminas',upgraded.version===2&&upgraded.academicVersion===1&&upgraded.snapshot.total===36&&upgraded.snapshot.mastered===24&&upgraded.snapshot.score===360&&upgraded.snapshot.records.length===24&&upgraded.next.imageId&&upgraded.nextVisual.imageId&&isDeepStrictEqual(upgraded.before,upgraded.after),upgraded);
  const loading=await page.evaluate(()=>{
    FarmAcademicProgress.reset();FarmActivityReport.open();practiceAcademicSlides();
    const state=FarmAcademicSlides.info();
    return{state,disabled:[...document.querySelectorAll('#histologyOptions button')].every(b=>b.disabled)};
  });
  check('Alternativas ficam bloqueadas enquanto a imagem ainda não está pronta',loading.state.ready||loading.disabled,loading);
  await page.waitForFunction(()=>FarmAcademicSlides.info().ready||FarmAcademicSlides.info().error,null,{polling:25});
  check('Prática de lâminas fecha relatório e abre questão visual no nível acadêmico',await page.evaluate(()=>eduLevel==='academico'&&histologyMissionOpen&&!!activeHistologyMission.imageId&&!FarmActivityReport.isOpen()&&FarmAcademicSlides.info().ready));
  const opened=await page.evaluate(()=>{
    const fig=document.getElementById('histologySlide'),img=document.getElementById('histologySlideImage'),target=document.getElementById('histologySlideTarget'),credit=document.getElementById('histologySlideCredit'),description=document.getElementById('histologySlideDescription');
    return{info:FarmAcademicSlides.info(),visible:!fig.hidden,alt:img.alt,description:description.textContent,credit:credit.textContent,target:target.textContent,targetExpected:!!activeHistologyMission.target,targetVisible:!target.hidden&&target.getClientRects().length>0,optionsEnabled:[...document.querySelectorAll('#histologyOptions button')].every(b=>!b.disabled),srcEmbedded:img.src.startsWith('data:image/'),naturalWidth:img.naturalWidth,concept:activeHistologyMission.concept,correctOption:activeHistologyMission.options[activeHistologyMission.correctIndex],focusInside:document.getElementById('histologyMissionPanel').contains(document.activeElement)};
  });
  check('Questão abre lâmina nítida, crédito e descrição antes de responder',opened.visible&&opened.info.ready&&!opened.info.error&&opened.info.zoom===1&&opened.srcEmbedded&&opened.naturalWidth>=400&&(opened.targetExpected?opened.targetVisible&&opened.target.trim()==='A':!opened.targetVisible)&&safeString(opened.credit)&&safeString(opened.alt)&&safeString(opened.description)&&opened.optionsEnabled&&opened.focusInside,opened);
  check('Texto alternativo inicial não entrega conceito nem alternativa correta',!opened.alt.includes(opened.concept)&&!opened.alt.includes(opened.correctOption)&&!opened.description.includes(opened.correctOption),{alt:opened.alt,description:opened.description});
  const beforePause=await page.evaluate(()=>({player:JSON.stringify(player),timeOfDay,seasonTimer,weather:JSON.stringify(currentWeather),weatherCooldown,crops:JSON.stringify(crops),farm:JSON.stringify(FarmLife.serialize()),animals:JSON.stringify(objects.filter(o=>o.type==='animal')),progress:JSON.stringify(FarmAcademicProgress.serialize())}));
  await page.keyboard.down('w');for(const key of ['e','g','i','h','j','q','f','c','1','2'])await page.keyboard.press(key);
  await page.evaluate(()=>{const now=performance.now();for(let i=0;i<120;i++)loop(now+i*16.667);});await page.keyboard.up('w');
  const afterPause=await page.evaluate(()=>({player:JSON.stringify(player),timeOfDay,seasonTimer,weather:JSON.stringify(currentWeather),weatherCooldown,crops:JSON.stringify(crops),farm:JSON.stringify(FarmLife.serialize()),animals:JSON.stringify(objects.filter(o=>o.type==='animal')),progress:JSON.stringify(FarmAcademicProgress.serialize())}));
  check('Leitura das lâminas pausa corpo, mundo e produção e bloqueia atalhos',isDeepStrictEqual(beforePause,afterPause)&&await page.evaluate(()=>histologyMissionOpen&&!inventoryOpen&&!journalOpen&&!skinOpen&&!FarmWorldMap.isOpen()),{changed:Object.keys(beforePause).filter(k=>beforePause[k]!==afterPause[k])});
  let trapped=true;
  for(let i=0;i<14;i++){await page.keyboard.press('Tab');trapped=trapped&&await page.evaluate(()=>document.getElementById('histologyMissionPanel').contains(document.activeElement));}
  check('Teclado permanece no diálogo com controles da lâmina',trapped);
  const visualStates=[];
  for(const q of visual){
    await openVisual(q.id);
    visualStates.push(await page.evaluate(()=>{
      const r=document.getElementById('histologySlideImage').getBoundingClientRect(),t=document.getElementById('histologySlideTarget').getBoundingClientRect(),info=FarmAcademicSlides.info();
      const status=document.getElementById('histologyAcademicStatus').textContent;
      return{id:activeHistologyMission.id,imageId:activeHistologyMission.imageId,info,targetExpected:!!activeHistologyMission.target,targetVisible:!document.getElementById('histologySlideTarget').hidden&&t.width>0&&t.height>0,insideTarget:t.width>0&&t.height>0&&t.left>=r.left-1&&t.right<=r.right+1&&t.top>=r.top-1&&t.bottom<=r.bottom+1,specificObjectiveExposed:!!activeHistologyMission.objective&&status.includes(activeHistologyMission.objective),readyOptions:[...document.querySelectorAll('#histologyOptions button')].every(b=>!b.disabled)};
    }));
  }
  check('12 identificações prontas: panorama integral e 11 alvos dentro da lâmina',visualStates.filter(s=>s.targetExpected).length===11&&visualStates.every(s=>s.info.ready&&!s.info.error&&s.info.imageId===s.imageId&&s.info.zoom===1&&(s.targetExpected?s.targetVisible&&s.insideTarget:!s.targetVisible)&&s.readyOptions),visualStates);
  check('Instrução anterior à resposta não revela os objetivos específicos de identificação',visualStates.every(s=>!s.specificObjectiveExposed),{exposed:visualStates.filter(s=>s.specificObjectiveExposed).map(s=>s.id)});
  await openVisual(visual[0].id);
  await page.locator('#histologySlideZoomIn').click();await page.locator('#histologySlideZoomIn').click();await page.locator('#histologySlideZoomIn').click();
  const zoom4=await page.evaluate(()=>({value:FarmAcademicSlides.zoom(),info:FarmAcademicSlides.info(),viewport:document.getElementById('histologySlideViewport').clientWidth,stage:document.getElementById('histologySlideStage').getBoundingClientRect().width}));
  check('Ampliar chega a 4× e preserva a área de inspeção rolável',zoom4.value===4&&zoom4.info.zoom===4&&zoom4.stage>zoom4.viewport,zoom4);
  await page.locator('#histologySlideZoomOut').click();check('Reduzir altera a ampliação para 3×',await page.evaluate(()=>FarmAcademicSlides.zoom())===3);
  await page.locator('#histologySlideFit').click();check('Enquadrar volta a 1×',await page.evaluate(()=>FarmAcademicSlides.zoom())===1);
  await page.evaluate(()=>{FarmAcademicSlides.setZoom(4);});await page.keyboard.press('Escape');
  check('Primeiro Escape reenquadra sem fechar a pergunta nem abrir pausa',await page.evaluate(()=>FarmAcademicSlides.zoom()===1&&histologyMissionOpen&&!isPaused));
  await page.keyboard.press('Escape');
  const escaped=await page.evaluate(()=>({open:histologyMissionOpen,paused:isPaused,info:FarmAcademicSlides.info(),hidden:document.getElementById('histologySlide').hidden,focus:document.activeElement.id}));
  check('Segundo Escape fecha a pergunta, limpa a lâmina e devolve foco',!escaped.open&&!escaped.paused&&!escaped.info.visible&&escaped.info.zoom===1&&escaped.hidden&&escaped.focus==='game',escaped);
  await openVisual(visual[0].id);
  const beforeWrong=await page.evaluate(()=>({coins:player.coins,score:FarmAcademicProgress.snapshot().score,records:FarmAcademicProgress.snapshot().attempts}));
  await answerCurrent(false);
  const wrong=await page.evaluate(()=>({score:FarmAcademicProgress.snapshot().score,attempts:FarmAcademicProgress.snapshot().attempts,coins:player.coins,feedback:document.getElementById('histologyFeedback').textContent,optionsDisabled:[...document.querySelectorAll('#histologyOptions button')].every(b=>b.disabled),description:document.getElementById('histologySlideDescription').textContent}));
  check('Erro de identificação mostra explicação e justificativas sem pontos nem moedas',wrong.score===beforeWrong.score&&wrong.attempts===beforeWrong.records+1&&wrong.coins===beforeWrong.coins&&wrong.optionsDisabled&&wrong.feedback.includes('Conceito:')&&wrong.feedback.includes('A)')&&wrong.feedback.includes('D)')&&safeString(wrong.description),wrong);
  await openVisual(visual[0].id);await answerCurrent(true);
  const correct=await page.evaluate(()=>({score:FarmAcademicProgress.snapshot().score,mastered:FarmAcademicProgress.snapshot().mastered,coins:player.coins,feedback:document.getElementById('histologyFeedback').textContent}));
  check('Primeiro acerto visual após erro concede apenas 15 pontos acadêmicos',correct.score===beforeWrong.score+15&&correct.mastered===1&&correct.coins===beforeWrong.coins&&correct.feedback.includes('15 pontos acadêmicos'),correct);
  for(const [width,height]of [[1280,800],[1024,640],[390,844],[320,640],[844,390]]){
    await page.setViewportSize({width,height});await openVisual(visual[0].id);
    await page.evaluate(()=>{document.querySelector('#histologyMissionPanel .histologyMissionCard').scrollTop=0;});
    const fit=await page.evaluate(()=>{
      const c=document.querySelector('#histologyMissionPanel .histologyMissionCard'),r=c.getBoundingClientRect(),img=document.getElementById('histologySlideImage').getBoundingClientRect(),v=document.getElementById('histologySlideViewport').getBoundingClientRect();
      return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,overflow:c.scrollWidth>c.clientWidth+1,imageWidth:img.width,imageHeight:img.height,viewportWidth:v.width,naturalRatio:document.getElementById('histologySlideImage').naturalWidth/document.getElementById('histologySlideImage').naturalHeight};
    });
    check('Lâmina enquadrada sem distorção nem corte lateral em '+width+'×'+height,!fit.overflow&&fit.left>=-1&&fit.right<=width+1&&fit.top>=-1&&fit.bottom<=height+1&&fit.imageWidth<=fit.viewportWidth+2&&Math.abs(fit.imageWidth/fit.imageHeight-fit.naturalRatio)<.025,fit);
    if(width!==320&&width!==844)await screenshot('lamina-'+width+'x'+height+'-1x.png');
    await page.locator('#histologySlideZoomIn').click();await page.locator('#histologySlideZoomIn').click();await page.locator('#histologySlideZoomIn').click();
    await page.locator('#histologySlideViewport').scrollIntoViewIfNeeded();
    const zoomLayout=await page.evaluate(()=>{const c=document.querySelector('#histologyMissionPanel .histologyMissionCard'),v=document.getElementById('histologySlideViewport');v.scrollLeft=v.scrollWidth;v.scrollTop=v.scrollHeight;return{zoom:FarmAcademicSlides.zoom(),cardOverflow:c.scrollWidth>c.clientWidth+1,panX:v.scrollLeft,scrollable:v.scrollWidth>v.clientWidth,panY:v.scrollTop};});
    check('Inspeção em 4× rola dentro da lâmina em '+width+'×'+height,zoomLayout.zoom===4&&!zoomLayout.cardOverflow&&zoomLayout.scrollable&&zoomLayout.panX>0,zoomLayout);
    await page.evaluate(()=>FarmAcademicSlides.setZoom(4));
    if(width!==320&&width!==844)await screenshot('lamina-'+width+'x'+height+'-4x.png');
    await page.locator('#histologySlideFit').click();await answerCurrent(true);
    await page.locator('#histologyContinue').scrollIntoViewIfNeeded();
    const answer=await page.evaluate(()=>{const r=document.getElementById('histologyContinue').getBoundingClientRect(),c=document.querySelector('#histologyMissionPanel .histologyMissionCard');return{top:r.top,bottom:r.bottom,overflow:c.scrollWidth>c.clientWidth+1};});
    check('Explicação e Continuar alcançáveis em '+width+'×'+height,answer.top>=0&&answer.bottom<=height+1&&!answer.overflow,answer);
  }
  await page.setViewportSize({width:1280,height:800});await openVisual(visual[1].id);
  const beforeError=await page.evaluate(()=>FarmAcademicProgress.serialize());
  await page.evaluate(()=>document.getElementById('histologySlideImage').dispatchEvent(new Event('error')));
  const failed=await page.evaluate(()=>{
    const before=FarmAcademicProgress.serialize();answerHistologyMission(activeHistologyMission.correctIndex);
    return{info:FarmAcademicSlides.info(),errorVisible:!document.getElementById('histologySlideError').hidden,disabled:[...document.querySelectorAll('#histologyOptions button')].every(b=>b.disabled),before,after:FarmAcademicProgress.serialize(),answered:activeHistologyMission.answered};
  });
  check('Falha simulada da imagem impede resposta e pontuação mesmo por chamada direta',failed.info.error&&!failed.info.ready&&failed.errorVisible&&failed.disabled&&!failed.answered&&isDeepStrictEqual(beforeError,failed.before)&&isDeepStrictEqual(failed.before,failed.after),{info:failed.info,errorVisible:failed.errorVisible,disabled:failed.disabled,answered:failed.answered});
  await closeQuiz();await page.evaluate(()=>{setEduLevel('medio');openHistologyMission(histologyMissions[0]);});
  const basic=await page.evaluate(()=>({info:FarmAcademicSlides.info(),hidden:document.getElementById('histologySlide').hidden,src:document.getElementById('histologySlideImage').getAttribute('src'),academic:!!activeHistologyMission.academic,buttons:[...document.querySelectorAll('#histologyOptions button')].length}));
  check('Pergunta escolar após lâmina não herda imagem, zoom ou erro',basic.hidden&&!basic.info.visible&&!basic.info.error&&basic.info.zoom===1&&!basic.src&&!basic.academic&&basic.buttons===4,basic);
  await closeQuiz();await page.evaluate(()=>{setEduLevel('academico');openHistologyMission(FarmAcademicProgress.bank().find(q=>!q.imageId));});
  check('Questões acadêmicas conceituais continuam sem figura e respondíveis',await page.evaluate(()=>document.getElementById('histologySlide').hidden&&[...document.querySelectorAll('#histologyOptions button')].every(b=>!b.disabled)));
  await closeQuiz();await page.evaluate(()=>FarmActivityReport.open());
  await page.locator('#activityReport [data-ar="slides"]').click();
  await page.waitForFunction(()=>FarmAcademicSlides.info().ready||FarmAcademicSlides.info().error,null,{polling:25});
  check('Botão Identificar lâminas no relatório abre a prática visual real',await page.evaluate(()=>histologyMissionOpen&&!!activeHistologyMission.imageId&&FarmAcademicSlides.info().ready&&!FarmActivityReport.isOpen()));
  await closeQuiz();await page.evaluate(()=>{atlasCurrentCat='all';toggleHistologyAtlas(true);});
  const atlas=await page.evaluate(()=>({cards:document.querySelectorAll('#atlasGrid .atlas-card-item').length,total:document.getElementById('atlasProgressText').textContent}));
  check('Atlas e progresso contam as 36 questões sem reiniciar domínio',atlas.cards===36&&atlas.total.endsWith('/ 36 conceitos'),atlas);
  await page.evaluate(()=>{toggleHistologyAtlas(false);saveGame(true);});
  const beforeReload=await page.evaluate(()=>({state:FarmAcademicProgress.snapshot(),coins:player.coins,level:eduLevel}));
  await page.reload();await page.waitForFunction(()=>!!window.FarmAcademicSlides);await page.keyboard.press('Space');await page.locator('#continueBtn').click();
  const afterReload=await page.evaluate(()=>({state:FarmAcademicProgress.snapshot(),coins:player.coins,level:eduLevel}));
  check('Continuar após recarregar mantém domínio visual e fazenda sem pagamento',isDeepStrictEqual(beforeReload,afterReload),{before:beforeReload,after:afterReload});
  if(process.argv.includes('--offline')){
    const packages=['Fazenda37C-standalone.html','Fazenda37C-COMPLETO.html'].map(name=>({name,file:path.join(root,'release',name)}));
    if(process.env.FARM37_EXTRACTED_GAME)packages.push({name:'web.zip extraído',file:process.env.FARM37_EXTRACTED_GAME});
    check('Três formatos offline foram incluídos na validação',packages.length===3,{formats:packages.map(p=>p.name)});
    for(const pkg of packages){
      const p=await prepare(pathToFileURL(pkg.file).href,{offline:true,complete:pkg.name.includes('COMPLETO')}),requests=[];
      p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
      const rows=[];
      for(const q of visual){await openVisual(q.id,p);rows.push(await p.evaluate(()=>({id:activeHistologyMission.id,info:FarmAcademicSlides.info(),naturalWidth:document.getElementById('histologySlideImage').naturalWidth,embedded:document.getElementById('histologySlideImage').src.startsWith('data:image/')})));}
      await answerCurrent(true,p);
      const state=await p.evaluate(()=>{saveGame(true);return{score:FarmAcademicProgress.snapshot().score,records:FarmAcademicProgress.snapshot().records,save:JSON.parse(localStorage.getItem(SAVE_KEY)),total:FarmAcademicProgress.snapshot().total};});
      check('12 lâminas e respostas funcionam offline em '+pkg.name,rows.length===12&&rows.every(r=>r.info.ready&&!r.info.error&&r.naturalWidth>=400&&r.embedded)&&state.score===15&&state.total===36&&state.save.version===2&&state.save.academicHistology.records.length===1&&requests.length===0,{images:rows,score:state.score,total:state.total,externalRequests:requests});
      await p.context().close();
    }
  }
  check('Sem erros JavaScript',report.errors.length===0,report.errors);
  check('Build não mudou durante a validação',hash(fs.readFileSync(path.join(root,'jogo.html')))===report.sha256);
})().catch(error=>{report.errors.push(error.stack||String(error));check('Execução completa',false,String(error));}).finally(async()=>{
  await browser?.close();report.pass=report.checks.length>0&&report.checks.every(c=>c.pass)&&report.errors.length===0;
  fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.checks.filter(c=>c.pass).length,total:report.checks.length,failed:report.checks.filter(c=>!c.pass).map(c=>c.name),errors:report.errors,sha256:report.sha256},null,2));
  process.exitCode=report.pass?0:1;
});
