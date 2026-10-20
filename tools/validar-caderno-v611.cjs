/* Leitura do caderno V6.11. Estados narrativos são fixtures por restore;
   esta suíte verifica apresentação e ausência de mutações, não progressão. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'analise/caderno-v611'),base=process.env.FARM37_URL||'http://127.0.0.1:8766';fs.mkdirSync(out,{recursive:true});
const report={created:new Date().toISOString(),checks:[],errors:[],external:[],captures:[],limits:['Estados active/ready/completed preparados por restore; progressão e recompensas reais têm testes separados.','Capturas precisam de inspeção visual.']};let browser,page;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function check(name,pass,evidence){report.checks.push({name,pass:!!pass,evidence});assert.ok(pass,name);}
const state=()=>page.evaluate(()=>JSON.stringify({village:FarmVillageStories.serialize(),story:FarmStoryWorld.serialize(),saga:FarmValleySaga.serialize(),farm:FarmLife.serialize(),frontier:FarmFrontierStory.serialize(),coins:player.coins,inv:player.inv,timeOfDay,currentSeason}));
async function open(section){await page.evaluate(section=>{FarmValleyPanels.close(false);FarmWorldMap.close();FarmStoryUI.close();FarmVillageStories.close();if(!FarmValleyPanels.open(section))throw Error('Caderno não abriu '+section);},section);}
async function capture(section,viewport){await page.setViewportSize(viewport);await open(section);const fit=await page.locator('.v6-notebook').evaluate(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight,bodyScroll:n.querySelector('.v6-body').scrollHeight,bodyClient:n.querySelector('.v6-body').clientHeight};});check('Caderno '+section+' cabe em '+viewport.width+'×'+viewport.height,fit.x>=0&&fit.y>=0&&fit.right<=fit.w+1&&fit.bottom<=fit.h+1,fit);const file=path.join(out,section+'-'+viewport.width+'x'+viewport.height+'.png');await page.screenshot({path:file});report.captures.push({section,viewport,file,SHA256:sha(fs.readFileSync(file))});}
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');});
 await page.route('**/*',r=>{if(new URL(r.request().url()).origin===new URL(base).origin)return r.continue();report.external.push(r.request().url());return r.abort();});
 const response=await page.goto(base+'/jogo.html?v=caderno-v611-'+Date.now());report.jogoSHA256=sha(await response.body());
 const fixture=await page.evaluate(()=>{
  startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.close();FarmAnimalCare.close(false);FarmValleyPanels.close(false);histologyMissionOpen=false;histologyMissionQueue.length=0;_lastHistMissionAt=1e9;currentWeather=null;weatherCooldown=1e9;isPaused=false;A11Y.noDeath=true;A11Y.relaxed=true;player.name='Lua';player.moving=false;player.resting=false;soundEnabled=false;
  const saved=FarmVillageStories.serialize(),defs=FarmVillageStories.missionCatalogue();saved.met=defs.map(d=>d.npcId);saved.sequence=20;
  for(const [index,status]of [[0,'active'],[1,'ready'],[2,'completed']]){const d=defs[index],stage=index===0?1:index===1?0:2,objectives=d.choices[0].stages[stage].objectives;Object.assign(saved.arcs[d.id],{status,choice:0,stage,acceptedAt:1,paid:status==='completed',counts:Object.fromEntries(objectives.map((g,i)=>[g.id,status==='active'?(i===0?0:g.goal):g.goal]))});}
  FarmVillageStories.restore(saved);return{snapshot:FarmVillageStories.snapshot(),diary:FarmVillageStories.diaryView()};
 });
 const before=await state();await open('people');
 const people=await page.locator('#valleyNotebook .v6-body').innerText();
 check('Pessoas apresenta as seis histórias com seus moradores',fixture.snapshot.arcs.every(a=>people.includes(a.title)));
 check('Pessoas distingue encontro em andamento, retorno e história concluída',people.includes('Encontro 2 / 3 · Em andamento')&&people.includes('Encontro 1 / 3 · Volte para conversar')&&people.includes('História concluída · 3 encontros'));
 check('Objetivos e contagens vêm do estado narrativo',fixture.snapshot.arcs.filter(a=>a.status==='active'||a.status==='ready').every(a=>a.objectives.every(o=>people.includes(o.text+' · '+o.n+' / '+o.goal))));
 const completed=fixture.snapshot.arcs.find(a=>a.completed);check('Epílogo concluído e eco estão disponíveis sem pagamento',people.includes(completed.consequence.replace(/\bAlex\b/g,'Lua'))&&await page.locator('.v6-memory summary').filter({hasText:'Relembrar o último encontro'}).count()===1);
 await page.getByText('Relembrar o último encontro',{exact:true}).click();check('Epílogo abre texto canônico',await page.locator('.v6-memory[open]').innerText().then(t=>t.includes(fixture.diary.discoveries[0].text.replace(/\bAlex\b/g,'Lua'))));
 await open('saga');const summary=await page.locator('#valleyNotebook .v6-body').innerText();check('História resume duas ativas e uma concluída',summary.includes('2 histórias em andamento.')&&summary.includes('1 / 6 histórias concluídas')&&fixture.snapshot.arcs.filter(a=>a.status==='active'||a.status==='ready').every(a=>summary.includes(a.title)));
 await page.locator('[data-valley-action="village:people"]').click();check('Botão de histórias abre Pessoas',await page.evaluate(()=>FarmValleyPanels.snapshot().section==='people'));
 await open('journal');const journal=await page.locator('#valleyNotebook .v6-body').innerText();check('Caderno mostra lembranças sem mensagem de página vazia',fixture.snapshot.journal.every(e=>journal.includes(e.title))&&!journal.includes('Uma primeira página em branco'));
 const actions=await page.locator('#valleyNotebook [data-valley-action]').evaluateAll(nodes=>nodes.map(n=>n.dataset.valleyAction));check('Caderno não oferece aceite, entrega ou recompensa remotos',!actions.some(a=>/village:(accept|claim|next)/.test(a)),actions);
 for(const viewport of [{width:1280,height:800},{width:1024,height:640},{width:390,height:844}])for(const section of ['people','saga','journal'])await capture(section,viewport);
 for(const [name,title,viewport]of [['progresso',fixture.snapshot.arcs[0].title,{width:390,height:844}],['epilogo',completed.title,{width:1280,height:800}]]){
  await page.setViewportSize(viewport);await open('people');const heading=page.getByRole('heading',{name:title,exact:true});await heading.evaluate(n=>{const body=n.closest('.v6-body');body.scrollTop+=n.getBoundingClientRect().top-body.getBoundingClientRect().top-16;});
  if(name==='epilogo')await page.getByText('Relembrar o último encontro',{exact:true}).click();
  const file=path.join(out,'people-'+name+'-'+viewport.width+'x'+viewport.height+'.png');await page.screenshot({path:file});report.captures.push({section:'people',detail:name,viewport,file,SHA256:sha(fs.readFileSync(file))});
 }
 check('Ler, trocar páginas e expandir epílogo não muda história, inventário ou relógio',before===await state());
 await open('people');await page.locator('[data-valley-action="map:npc:rosa"]').click();check('Encontrar morador fecha caderno e abre mapa',await page.evaluate(()=>!FarmValleyPanels.isOpen()&&FarmWorldMap.isOpen()));
 check('Navegar ao mapa não aceita nem conclui história',before===await state());check('Nenhum erro JavaScript ou requisição externa',report.errors.length===0&&report.external.length===0,{errors:report.errors,external:report.external});report.pass=true;
})().catch(error=>{report.pass=false;report.error=error.stack;process.exitCode=1;}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'caderno-v611.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,captures:report.captures.length,error:report.error},null,2));});
