/* Comparação visual reproduzível da rodada de NPCs e cenários. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),baseline=process.argv.includes('--baseline'),out=path.join(root,'analise/vale-v611',baseline?'antes':'depois');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const report={captures:[],errors:[]};try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('farm37_seen_intro','1');});if(baseline){const bytes=fs.readFileSync(path.join(root,'../backups/antes-vale-v611-20261020/jogo.html'));await page.route('**/jogo.html?*',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:bytes}));}const response=await page.goto('http://127.0.0.1:8766/jogo.html?v=vale-'+Date.now());report.sha256=crypto.createHash('sha256').update(await response.body()).digest('hex');
 await page.evaluate(()=>{startGame(true);_pendingTutorialAfterCutscene=false;endCutscene();skipTutorial();FarmStoryUI.close();FarmStoryCinematics.reset();soundEnabled=false;histologyMissionOpen=false;isPaused=false;A11Y.reduceMotion=true;currentWeather=null;weatherCooldown=1e8;document.body.classList.add('hud-game');});
 for(const p of [{name:'centro',x:380,y:936},{name:'ponte',x:744,y:944},{name:'casa-sementes',x:608,y:1260},{name:'transicao-montanha',x:400,y:600},{name:'montanha',x:250,y:310},{name:'lago-congelado',x:360,y:440},{name:'oasis',x:650,y:1770},{name:'mata',x:1240,y:584},{name:'veredas',x:1352,y:1560}])for(const hour of [7,12,17]){
  await page.evaluate(({p,hour})=>{setSceneTo('main',p.x,p.y);player.temp=37;timeOfDay=hour;ZOOM=2;currentSeason=['montanha','lago-congelado'].includes(p.name)?'cold':'hot';_camSnap=true;snapCamera();render();updateBars();}, {p,hour});const file=p.name+'-'+hour+'.png';await page.screenshot({path:path.join(out,file)});report.captures.push(file);
 }
 if(report.errors.length)throw Error(report.errors.join(';'));
 fs.writeFileSync(path.join(out,'capturas.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({captures:report.captures.length,sha256:report.sha256,errors:report.errors}));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
