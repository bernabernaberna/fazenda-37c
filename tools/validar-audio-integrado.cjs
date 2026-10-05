/* Integração de áudio pela UI real, com observação dos nós Web Audio nativos.
   Não altera fontes, não usa gravação humana e bloqueia requests externos.
   Execute com tools/capsrv.py 8766 ativo. JSON: analise/audio-integrado.json. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const raiz=path.resolve(__dirname,'..');
const origin=process.env.FARM37_URL||'http://127.0.0.1:8766';
const relatorio={checagens:[],etapas:[],erros:[],pedidosExternos:[],arquivosAudioPedidos:[]};
function check(nome,ok,evidencia){relatorio.checagens.push({nome,passou:!!ok,evidencia});}
function instrumentacao(){
  const Native=window.AudioContext||window.webkitAudioContext;
  const contexts=[],records=new WeakMap();
  const connect=AudioNode.prototype.connect,disconnect=AudioNode.prototype.disconnect;
  AudioNode.prototype.connect=function(target,...args){
    const result=connect.call(this,target,...args);
    if(records.has(this)){const m=records.get(this);m.connections.push(target);}
    return result;
  };
  AudioNode.prototype.disconnect=function(...args){
    const result=disconnect.apply(this,args);
    if(records.has(this)){
      const m=records.get(this);
      m.connections=args.length?m.connections.filter(node=>node!==args[0]):[];
    }
    return result;
  };
  class ObservedAudioContext extends Native{
    constructor(...args){
      super(...args);
      const entry={ctx:this,stack:new Error().stack,gains:[],analyser:null};contexts.push(entry);
      const createGain=this.createGain.bind(this);
      this.createGain=()=>{
        const node=createGain(),meta={node,connections:[],events:[]};entry.gains.push(meta);records.set(node,meta);
        const param=node.gain,descriptor=Object.getOwnPropertyDescriptor(AudioParam.prototype,'value');
        const remember=(method,value,time)=>{
          meta.events.push({method,value,time});
          if(meta.events.length>12) meta.events.shift();
        };
        Object.defineProperty(param,'value',{configurable:true,
          get(){return descriptor.get.call(param);},
          set(value){remember('value',value,entry.ctx.currentTime);descriptor.set.call(param,value);}});
        for(const method of ['setValueAtTime','linearRampToValueAtTime','exponentialRampToValueAtTime','setTargetAtTime']){
          const native=param[method].bind(param);
          param[method]=(...args)=>{remember(method,args[0],args[1]);return native(...args);};
        }
        return node;
      };
    }
  }
  window.AudioContext=ObservedAudioContext;
  if(window.webkitAudioContext) window.webkitAudioContext=ObservedAudioContext;
  window.__audioObserved={contexts,records};
}
async function snapshot(page,nome){
  const data=await page.evaluate(()=>{
    const graphs=window.__audioObserved.contexts.map(entry=>{
      const bus=entry.gains[0];
      let label='desconhecido';
      if(entry.ctx===AmbientMusic.ctx) label='musica';
      else if(entry.stack.includes('Object.setRiver')||entry.stack.includes('Object.setCrickets')) label='ambiente90';
      else if(entry.stack.includes('Object.play')||entry.stack.includes('at ensure ')) label='banco71';
      else if(entry.stack.includes('Object.click')||entry.stack.includes('_tone')||entry.stack.includes('_noiseBurst')) label='synth70';
      if(bus&&!entry.analyser){
        entry.analyser=entry.ctx.createAnalyser();entry.analyser.fftSize=2048;
        bus.node.connect(entry.analyser);
      }
      let rms=null;
      if(entry.analyser){const d=new Float32Array(entry.analyser.fftSize);entry.analyser.getFloatTimeDomainData(d);rms=Math.sqrt(d.reduce((sum,v)=>sum+v*v,0)/d.length);}
      return {label,state:entry.ctx.state,currentTime:entry.ctx.currentTime,busGain:bus?.node.gain.value,
        busTarget:bus?.events.at(-1)?.value,rms,
        liveVoiceGains:entry.gains.filter(g=>g!==bus&&g.connections.includes(bus?.node)).map(g=>({gain:g.node.gain.value,target:g.events.at(-1)?.value}))};
    });
    return {soundEnabled,master:AudioManager.master,musicActive:AmbientMusic.active,musicProfile:AmbientMusic.state(),paused:isPaused||readingPanelOpen()||histologyMissionOpen,
      slider:document.getElementById('volumeSlider').value,accessSlider:document.getElementById('accessVolume').value,
      bank:FarmOriginalAudio.state(),loops:Object.values(AudioManager.sounds).filter(a=>a.loop).map(a=>({name:a.name,volume:a.volume,paused:a.paused})),graphs};
  });
  relatorio.etapas.push({nome,data});return data;
}
async function slider(page,value){
  const input=page.locator('#accessVolume');await input.focus();await input.press('Home');
  for(let i=0;i<Math.round(value/0.05);i++) await input.press('ArrowRight');
}
function targets(data){return Object.fromEntries(data.graphs.map(g=>[g.label,g.busTarget]));}
function musicTarget(data){const p=data.musicProfile;return data.musicActive?.06*data.master*p.duck*(p.night?.72:1)*(p.indoor?.8:1)*(p.resting?.55:1):0;}
function loopsExpected(data){return data.paused?data.loops.every(a=>a.volume===0&&a.paused):data.loops.some(a=>a.volume>0&&!a.paused);}
(async()=>{
  const local=new URL(origin);assert.equal(local.hostname,'127.0.0.1');
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}});
    await page.addInitScript(instrumentacao);
    page.on('pageerror',e=>relatorio.erros.push(e.message));
    page.on('request',r=>{if(/\.(ogg|wav|mp3)(?:\?|$)/i.test(r.url()))relatorio.arquivosAudioPedidos.push(r.url());});
    await page.route('**/*',route=>{
      const u=new URL(route.request().url());
      if(u.origin===local.origin) return route.continue();
      relatorio.pedidosExternos.push(u.href);return route.abort();
    });
    await page.goto(origin+'/jogo.html?v=audio-integrado-'+Date.now());
    await page.waitForFunction(()=>!!window.FarmOriginalAudio);
    await page.keyboard.press('Space');
    await page.getByRole('button',{name:'COMEÇAR NOVO JOGO',exact:false}).click();
    await page.locator('.cs-option[data-gender="f"]').click();
    await page.locator('#csName').fill('Áudio integrado');
    await page.locator('#csStartBtn').click();
    await page.waitForFunction(()=>cutsceneActive);
    await page.keyboard.press('Space');await page.waitForFunction(()=>tutorialActive);
    await page.getByRole('button',{name:'Pular tutorial',exact:true}).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'⚙ Configurações',exact:true}).click();
    await page.evaluate(()=>{AmbientSynth.setRiver(0.35);AmbientSynth.setCrickets(0.3);synthSfx.levelup();AudioManager.playSfx('death_sound',0.8);});
    await page.waitForTimeout(700);
    const initial=await snapshot(page,'partida e quatro sistemas ativos');
    check('Build integrado cria os quatro sistemas Web Audio',['musica','synth70','ambiente90','banco71'].every(label=>initial.graphs.some(g=>g.label===label)),initial.graphs.map(g=>g.label));
    check('AudioManager usa 23 chaves procedurais e 13 loops, sem arquivos',await page.evaluate(()=>Object.keys(AudioManager.files).length===23&&AudioManager.loops.length===13&&Object.values(AudioManager.files).every(v=>v==='procedural')));
    await slider(page,0.5);await page.waitForTimeout(650);
    // Um buffer de ambiente usado como efeito (loop false) mantém o clone vivo
    // por todo o percurso do slider; evita confundir fim natural com silenciamento.
    await page.evaluate(()=>AudioManager.playSfx('farm_ambience',0.8));
    const half=await snapshot(page,'slider 0,5');const halfTargets=targets(half);
    check('Slider 0,5 chega ao AudioManager',Math.abs(half.master-0.5)<1e-9,half.master);
    check('Slider 0,5 controla música com redução de leitura, synth70 e ambiente90',Math.abs(halfTargets.musica-musicTarget(half))<1e-8&&Math.abs(halfTargets.synth70-0.275)<1e-8&&Math.abs(halfTargets.ambiente90-0.5)<1e-8,{...halfTargets,musicExpected:musicTarget(half)});
    check('Clone em andamento recebe volume absoluto 0,4, sem ganho mestre duplicado',half.bank.effects>=1&&half.graphs.find(g=>g.label==='banco71').liveVoiceGains.some(g=>Math.abs(g.gain-0.4)<1e-6),half.graphs.find(g=>g.label==='banco71').liveVoiceGains);
    await page.evaluate(()=>{AudioManager.playSfx('death_sound',0.8);synthSfx.levelup();AmbientSynth.setRiver(0.35);});
    await slider(page,0);await page.waitForTimeout(650);
    const zero=await snapshot(page,'slider 0');const zeroTargets=targets(zero),zeroBank=zero.graphs.find(g=>g.label==='banco71');
    check('Slider 0 preserva zero em todas as rotas de ganho',zero.master===0&&zero.bank.effects>=1&&zero.loops.every(a=>a.volume===0)&&zeroBank?.liveVoiceGains.every(g=>Math.abs(g.gain)<1e-10&&Math.abs(g.target||0)<1e-10)&&zero.graphs.filter(g=>g.label!=='banco71').every(g=>g.busGain===0&&g.busTarget===0),{master:zero.master,targets:zeroTargets,loops:zero.loops,clones:zeroBank?.liveVoiceGains});
    check('Saída dos quatro buses sem sinal no volume zero',zero.graphs.every(g=>g.rms!==null&&g.rms<1e-6),zero.graphs.map(g=>({label:g.label,rms:g.rms})));
    const oscBefore=await page.evaluate(()=>__audioObserved.contexts.find(e=>e.stack.includes('_tone'))?.gains.length);
    await page.evaluate(()=>{synthSfx.click();synthSfx.splash();AudioManager.playSfx('harvest',0.8);AmbientSynth.setRiver(0.35);});
    const oscAfter=await page.evaluate(()=>__audioObserved.contexts.find(e=>e.stack.includes('_tone'))?.gains.length);
    check('Sons synth70 chamados com master zero não geram novas vozes',oscBefore===oscAfter,{antes:oscBefore,depois:oscAfter});
    await slider(page,0.75);await page.waitForTimeout(650);
    const recovered=await snapshot(page,'slider 0,75 recuperado');const recoveredTargets=targets(recovered);
    check('Slider 0,75 recupera música e UI; loops respeitam pausa',recovered.master===0.75&&Math.abs(recoveredTargets.musica-musicTarget(recovered))<1e-8&&Math.abs(recoveredTargets.synth70-0.4125)<1e-8&&recoveredTargets.ambiente90===0.75&&loopsExpected(recovered),{...recoveredTargets,musicExpected:musicTarget(recovered),paused:recovered.paused});
    check('Clone silenciado em andamento recupera 0,6 ao voltar para 0,75',recovered.bank.effects>=1&&recovered.graphs.find(g=>g.label==='banco71').liveVoiceGains.some(g=>Math.abs(g.gain-0.6)<1e-6),recovered.graphs.find(g=>g.label==='banco71').liveVoiceGains);
    await slider(page,0.5);await page.locator('#accessSoundBtn').click();await page.waitForTimeout(700);
    const off=await snapshot(page,'som desligado em 0,5');const offTargets=targets(off);
    check('Botão desligar corta os quatro sistemas e vozes do banco',!off.soundEnabled&&!off.bank.enabled&&off.bank.voices===0&&off.bank.outputGain===0&&off.graphs.every(g=>g.busGain===0&&g.busTarget===0),{bank:off.bank,targets:offTargets});
    check('Saída dos quatro buses sem sinal com som desligado',off.graphs.every(g=>g.rms!==null&&g.rms<1e-6),off.graphs.map(g=>({label:g.label,rms:g.rms})));
    await page.locator('#accessSoundBtn').click();await page.waitForTimeout(700);
    const on=await snapshot(page,'som ligado novamente');const onTargets=targets(on);
    check('Religar mantém o volume escolhido pelo jogador',on.soundEnabled&&on.master===0.5,{master:on.master,slider:on.slider,accessSlider:on.accessSlider});
    check('Religar recupera música e UI, mantendo silêncio do mundo pausado',on.bank.enabled&&on.musicActive&&onTargets.musica>0&&onTargets.synth70>0&&onTargets.ambiente90>0&&loopsExpected(on),onTargets);
    await page.getByRole('button',{name:'Voltar ao jogo',exact:true}).click();await page.waitForTimeout(650);
    const resumed=await snapshot(page,'jogo retomado após configurações');
    check('Ao voltar ao jogo, loops do banco reiniciam com ganho positivo',resumed.bank.loops>0&&resumed.loops.some(a=>!a.paused&&a.volume>0)&&resumed.graphs.find(g=>g.label==='banco71').rms>0,{bank:resumed.bank,loops:resumed.loops});
    check('Nenhum pedido de gravações ou rede externa',!relatorio.arquivosAudioPedidos.length&&!relatorio.pedidosExternos.length,{audio:relatorio.arquivosAudioPedidos,externos:relatorio.pedidosExternos});
    check('Sem erros JavaScript',!relatorio.erros.length,relatorio.erros);
  }finally{await browser.close();}
  const falhas=relatorio.checagens.filter(c=>!c.passou);
  relatorio.status=falhas.length?'FALHA':'OK';relatorio.escutaHumana=false;
  fs.writeFileSync(path.join(raiz,'analise','audio-integrado.json'),JSON.stringify(relatorio,null,2));
  console.log(JSON.stringify({status:relatorio.status,checagens:relatorio.checagens.length,falhas,relatorio:path.join(raiz,'analise','audio-integrado.json')},null,2));
  if(falhas.length) process.exitCode=1;
})().catch(error=>{relatorio.falhaExecucao=error.stack;fs.writeFileSync(path.join(raiz,'analise','audio-integrado.json'),JSON.stringify(relatorio,null,2));console.error(error);process.exitCode=1;});
