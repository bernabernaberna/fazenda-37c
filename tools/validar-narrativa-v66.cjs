/* Estado real de entregas e escolhas: consultas de apresentação não pagam nem
   criam novos campos persistidos. A inspeção do desenho é feita no navegador. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),files=['35-valley-saga.js','36-farm-life.js'];
const sources=Object.fromEntries(files.map(name=>[name,fs.readFileSync(path.join(root,'src/modules',name),'utf8')]));
const ids=['rosa','lia','tomas','ines','caio','nico'],owners=['rosa','tomas','lia','ines','caio','nico','rosa','rosa'];
const orderIds={'rosa':'cesta-rosa','lia':'mesa-lia','tomas':'canteiro-tomas','ines':'fio-ines','caio':'rota-caio','nico':'lanche-nico'};
const plain=value=>JSON.parse(JSON.stringify(value)),checks=[];
function check(name,run){run();checks.push(name);}
function create(){
 const events=[],rewards=[],context={season:'hot',region:'farm',scene:'main',active:true,paused:false,playerName:'Alex Vale',animals:[],player:{x:588,y:1258,en:50,hyd:50,coins:200,inv:{veg:50,hay:50,wood:50,wool:50,water:50}}};
 const box={window:{},console:{warn(){}}};vm.createContext(box);for(const source of Object.values(sources))vm.runInContext(source,box);
 const saga=box.window.FarmValleySaga,farm=box.window.FarmLife;saga.init({readState:()=>context,reward:r=>rewards.push(plain(r))});
 farm.init({readState:()=>context,onEvent(type,payload){events.push({type,payload:plain(payload)});saga.record(type,payload);}});
 const prepared=farm.serialize();for(const key of Object.keys(prepared.stock))prepared.stock[key]=50;farm.restore(prepared);
 return{saga,farm,context,events,rewards,box};
}
function accept(saga,index,choice=0){saga.interact(owners[index]);saga.choose('saga:episode:'+index+':offer');saga.choose('saga:episode:'+index+':accept:'+choice);saga.close();}
function complete(saga,index){saga.interact(owners[index]);saga.choose('saga:episode:'+index+':offer');saga.choose('saga:episode:'+index+':deliver');if(index===7)saga.choose('saga:episode:7:confirm');}
function actions(saga){
 for(const c of saga.clueCatalogue())saga.record('inspect',{clueId:c.id});for(const npcId of ids)saga.record('talk',{npcId});
 for(const region of ['farm','mountain','desert'])saga.record('visit',{region});
 for(const event of ['plant','water','harvest','sell','repair','craft','produce','order','skin'])saga.record(event,{amount:6});
 for(const item of ['wool','ice','oasisWater'])saga.record('collect',{item,amount:6});
 saga.record('rest',{safe:true,amount:2});saga.record('equip',{item:'coat',equipped:true});saga.record('use',{item:'oasisWater'});
 for(const studyId of ['barreira','evaporacao','vasos'])saga.record('study',{studyId,correct:true});
}
function finishStory(saga,choice=0){for(let i=0;i<8;i++){accept(saga,i,choice);actions(saga);assert.equal(saga.snapshot().act.status,'ready');complete(saga,i);saga.close();}}
check('Seis destinatários começam sem lembrança; IDs desconhecidos não retornam uma fala',()=>{
 const {farm,saga}=create();for(const id of [...ids,'__proto__','constructor',null,''])assert.equal(farm.deliveryMemory(id),null);
 for(const id of ids)assert.ok(!saga.greeting(id,{visit:2}).includes('entrega'));
});
for(const npcId of ids)check('Entrega de '+npcId+': falha, sucesso, repetição bloqueada, prazo, nova entrega e restore',()=>{
 const a=create(),{farm,saga,context}=a,id=orderIds[npcId],order=farm.snapshot().orders.find(o=>o.id===id);
 const before=JSON.stringify(farm.serialize()),coins=context.player.coins;
 context.player.x=0;assert.equal(farm.deliverOrder(id).ok,false);assert.equal(farm.deliveryMemory(npcId),null);assert.equal(JSON.stringify(farm.serialize()),before);assert.equal(context.player.coins,coins);
 context.player.x=588;const result=farm.deliverOrder(id);assert.equal(result.ok,true);const memory=farm.deliveryMemory(npcId);
 assert.equal(memory.orderId,id);assert.equal(memory.deliveries,1);assert.equal(memory.recent,true);assert.ok(result.message.includes(memory.line));assert.equal(context.player.coins,coins+order.reward);
 assert.ok(saga.greeting(npcId,{visit:2}).includes(memory.line));for(const other of ids.filter(id=>id!==npcId))assert.equal(farm.deliveryMemory(other),null);
 const saved=JSON.stringify(farm.serialize()),sagaSaved=JSON.stringify(saga.serialize()),playerSaved=JSON.stringify(context.player),revision=saga.revision(),eventCount=a.events.length;
 for(let i=0;i<100;i++){farm.deliveryMemory(npcId);saga.greeting(npcId,{visit:2});}
 assert.equal(JSON.stringify(farm.serialize()),saved);assert.equal(JSON.stringify(saga.serialize()),sagaSaved);assert.equal(JSON.stringify(context.player),playerSaved);assert.equal(saga.revision(),revision);assert.equal(a.events.length,eventCount);
 assert.equal(farm.deliverOrder(id).ok,false);assert.equal(JSON.stringify(farm.serialize()),saved);assert.equal(JSON.stringify(context.player),playerSaved);
 const restored=create();restored.farm.restore(JSON.parse(saved));restored.saga.restore(JSON.parse(sagaSaved));assert.deepEqual(plain(restored.farm.deliveryMemory(npcId)),plain(memory));assert.equal(restored.events.length,0);assert.equal(restored.rewards.length,0);
 context.paused=true;for(let i=0;i<190;i++)farm.update(1);assert.equal(farm.deliveryMemory(npcId).recent,true);
 context.paused=false;for(let i=0;i<180;i++)farm.update(1);const old=farm.deliveryMemory(npcId);assert.equal(old.recent,false);assert.notEqual(old.line,memory.line);assert.equal(old.deliveries,1);assert.ok(saga.greeting(npcId,{visit:2}).includes(old.line));
 const stale=create();stale.farm.restore(farm.serialize());assert.deepEqual(plain(stale.farm.deliveryMemory(npcId)),plain(old));assert.equal(stale.rewards.length,0);
 assert.equal(farm.deliverOrder(id).ok,true);const repeat=farm.deliveryMemory(npcId);assert.equal(repeat.deliveries,2);assert.equal(repeat.recent,true);assert.notEqual(repeat.line,memory.line);assert.equal(context.player.coins,coins+2*order.reward);
 assert.ok(!/envelope|assinatura de Alex|reserva.*antes da ventania|seis assinaturas|trouxe a caixa da horta/.test(repeat.line));
 assert.deepEqual(Object.keys(farm.serialize()).sort(),Object.keys(JSON.parse(before)).sort());
});
check('Entrega sem recursos ou bolsa cheia não gera reconhecimento',()=>{
 const a=create();a.context.player.inv.veg=0;assert.equal(a.farm.deliverOrder('cesta-rosa').ok,false);assert.equal(a.farm.deliveryMemory('rosa'),null);
 a.context.player.inv.veg=50;a.context.player.coins=1000000;assert.equal(a.farm.deliverOrder('cesta-rosa').ok,false);assert.equal(a.farm.deliveryMemory('rosa'),null);assert.equal(a.events.length,0);
});
check('Lembrança não depende do módulo de fazenda; não esconde tarefa ativa ou pronta',()=>{
 const a=create();delete a.box.window.FarmLife;assert.ok(a.saga.greeting('rosa',{visit:2}));a.box.window.FarmLife=a.farm;
 accept(a.saga,0);const active=a.saga.greeting('rosa',{visit:2});a.farm.deliverOrder('cesta-rosa');assert.ok(a.saga.greeting('rosa',{visit:2}).includes(active));
 actions(a.saga);delete a.box.window.FarmLife;const readyBase=a.saga.greeting('rosa',{visit:2});a.box.window.FarmLife=a.farm;const ready=a.saga.greeting('rosa',{visit:2});assert.ok(ready.includes(a.farm.deliveryMemory('rosa').line));assert.ok(ready.includes(readyBase));
});
check('Dobra e grafite antecipam transporte; descoberta de Nico resolve a pergunta sem mudar os 32 planos',()=>{
 const a=create(),first=a.saga.clueCatalogue()[0],map=a.saga.clueCatalogue().find(c=>c.id==='mapa-nico');
 assert.match(first.text,/grafite/);assert.match(first.text,/triângulo/);assert.match(map.text,/canto dobrado em triângulo/);
 a.saga.record('inspect',{clueId:'carta-perdida'});for(let visit=1;visit<=24;visit++)for(const npcId of ids)assert.ok(!/Fui eu que trouxe|trouxe a caixa da horta/.test(a.saga.greeting(npcId,{visit})));
 for(let i=0;i<6;i++){accept(a.saga,i);actions(a.saga);complete(a.saga,i);}
 const resolution=a.saga.currentDialogue().text;assert.match(resolution,/Fui eu que trouxe a caixa/);assert.match(resolution,/antes de você chegar/);assert.match(resolution,/terra das mãos/);assert.match(resolution,/queria levar uma resposta pronta/);
 const scenes=a.saga.cinematicScenes();assert.equal(scenes.length,8);assert.equal(scenes.reduce((sum,c)=>sum+c.shots.length,0),32);assert.match(scenes.find(c=>c.id==='saga-mapa').shots[0].line,/trouxe a caixa da horta/);
 assert.equal(a.rewards.length,6);assert.equal(a.saga.snapshot().act.index,6);
 const saved=a.saga.serialize(),restored=create();restored.saga.restore(saved);assert.equal(restored.rewards.length,0);assert.match(restored.saga.snapshot().journal.find(x=>x.id==='finish:episode:5').text,/traço de grafite era de Nico/);
});
const surfaces=['seedbox','notebook','workbench','routeboard','reserve','mapboard'];
const variants=[['shared','questions','signed','notices','community','presentation'],['reference','collective','demonstration','observations','shared-work','collective']];
for(const choice of [0,1])check('Seis motivos da escolha '+choice+' exigem conclusão, sobrevivem restore e não alteram save',()=>{
 const a=create();assert.deepEqual(plain(a.saga.decorationState()),[]);finishStory(a.saga,choice);
 for(const npcId of ids)for(let step=0;step<2;step++){
  const prefix='saga:arc:'+npcId+':'+step,before=plain(a.saga.decorationState());a.saga.interact(npcId);a.saga.choose(prefix+':offer');a.saga.choose(prefix+':accept:'+choice);a.saga.close();
  assert.deepEqual(plain(a.saga.decorationState()),before);actions(a.saga);assert.equal(a.saga.snapshot().arcs.find(a=>a.npcId===npcId).stages[step].status,'ready');assert.deepEqual(plain(a.saga.decorationState()),before);
  a.saga.interact(npcId);a.saga.choose(prefix+':offer');a.saga.choose(prefix+':deliver');a.saga.close();
 }
 const motifs=plain(a.saga.decorationState());assert.equal(motifs.length,6);assert.deepEqual(motifs.map(d=>d.surface),surfaces);assert.deepEqual(motifs.map(d=>d.variant),variants[choice]);assert.equal(new Set(motifs.map(d=>d.id)).size,6);
 const saved=JSON.stringify(a.saga.serialize()),revision=a.saga.revision(),rewardCount=a.rewards.length;
 for(let i=0;i<500;i++){const copy=a.saga.decorationState();copy[0].variant='mutado';copy.push({});a.saga.worldState();}
 assert.deepEqual(plain(a.saga.decorationState()),motifs);assert.equal(a.saga.revision(),revision);assert.equal(JSON.stringify(a.saga.serialize()),saved);assert.equal(a.rewards.length,rewardCount);assert.ok(!('revision'in a.saga.serialize()));
 const b=create(),previous=b.saga.revision();b.saga.restore(JSON.parse(saved));assert.deepEqual(plain(b.saga.decorationState()),motifs);assert.ok(b.saga.revision()>previous);assert.equal(b.rewards.length,0);
 const resetRevision=b.saga.revision();b.saga.reset();assert.deepEqual(plain(b.saga.decorationState()),[]);assert.ok(b.saga.revision()>resetRevision);
});
check('Falsos flags decorativos ou escolha oferecida não expõem resultados futuros',()=>{
 const a=create(),save=a.saga.serialize();save.decorationFlags={seedShare:true};save.arcs.rosa[0].choice=1;save.arcs.rosa[0].paid=true;a.saga.restore(save);assert.deepEqual(plain(a.saga.decorationState()),[]);
});
const report={passou:true,checagens:checks.length,nomes:checks,fontes:Object.fromEntries(Object.entries(sources).map(([name,source])=>[name,crypto.createHash('sha256').update(source).digest('hex')])),observacao:'VM: transações de entrega, retorno de falas e motivos puros. Não substitui inspeção visual do cenário ou caminhada.'};
const output=path.join(root,'analise','narrativa-v66');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'narrativa-v66.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passou:true,checagens:checks.length}));
