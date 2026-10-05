/* Lembranças, escolhas e continuidade reais da máquina narrativa; sem DOM. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/modules/14-story-world.js'),'utf8');
const checks=[],check=(name,fn)=>{fn();checks.push(name);};
function fixture(){
 const box={window:{},console};vm.createContext(box);vm.runInContext(source,box);
 const story=box.window.FarmStoryWorld,rewards=[],context={season:'hot',timeOfDay:12,scene:'main',region:'farm',playerName:'Lua',energy:90};
 story.init({readState:()=>context,reward:r=>rewards.push(r)});return {story,rewards,context};
}
function finish(s){for(const c of s.chapters){s.interact(c.npcId);s.choose('main:accept');s.close();for(const o of c.objectives)s.record(o.event,{...o.match,amount:o.goal});s.interact(c.npcId);s.choose('main:claim');s.close();}}
function loreChoice(s){return s.currentDialogue().choices.find(c=>c.id.startsWith('lore:')&&c.id!=='lore:revisit');}
function reveal(s,npc,which=0){s.interact(npc);const offer=loreChoice(s);assert.ok(offer,'Lembrança disponível de '+npc);s.choose(offer.id);const reply=s.currentDialogue().choices.filter(c=>c.id.startsWith('reply:'))[which];assert.ok(reply);s.choose(reply.id);s.close();return offer.id;}
const a=fixture(),s=a.story;
check('A carta explica a ventania, a espera e a volta, sem iniciar a história automaticamente',()=>{s.interact('letter');assert.match(s.currentDialogue().text,/ventania/);assert.match(s.currentDialogue().text,/perfeita/);assert.equal(s.snapshot().chapter.status,'available');assert.equal(a.rewards.length,0);s.close();});
check('Todos os seis moradores oferecem uma primeira lembrança original e duas respostas',()=>{
 const titles=new Set(),texts=new Set();for(const npc of s.characters){s.interact(npc.id);const offer=loreChoice(s);assert.ok(offer);s.choose(offer.id);titles.add(s.currentDialogue().title);texts.add(s.currentDialogue().text);assert.equal(s.currentDialogue().choices.filter(c=>c.id.startsWith('reply:')).length,2);s.close();}
 assert.equal(titles.size,6);assert.equal(texts.size,6);assert.equal(s.snapshot().discoveries.length,6);assert.equal(a.rewards.length,0);
});
check('Ouvir e fechar mantém uma resposta pendente, sem reiniciar a amizade ao retomar',()=>{
 s.interact('rosa');const offer=loreChoice(s);assert.match(offer.label,/Retomar/);const before=s.snapshot().friendships.rosa;s.choose(offer.id);s.choose('close');s.interact('rosa');s.choose(offer.id);assert.equal(s.snapshot().friendships.rosa,before);assert.equal(s.snapshot().discoveries.length,6);
});
check('A escolha guarda uma consequência, recebe fala própria e nunca entrega moedas',()=>{
 const before=s.snapshot().friendships.rosa;s.choose('reply:rosa:caixa:0');assert.match(s.currentDialogue().text,/convite/);assert.equal(s.serialize().decisions['rosa:caixa'],0);assert.equal(s.snapshot().friendships.rosa,before+1);assert.match(s.snapshot().discoveries.find(d=>d.id==='rosa:caixa').response,/chegar/);assert.equal(a.rewards.length,0);s.close();
});
check('Repetir escolha ou revisitar a mesma lembrança não duplica vínculo, memória nem recompensa',()=>{
 const bond=s.snapshot().friendships.rosa,memories=s.snapshot().memories.length;s.interact('rosa');s.choose('lore:revisit');s.choose('lore:rosa:caixa');assert.equal(s.currentDialogue().choices.some(c=>c.id.startsWith('reply:')),false);s.choose('reply:rosa:caixa:1');assert.equal(s.serialize().decisions['rosa:caixa'],0);assert.equal(s.snapshot().friendships.rosa,bond);assert.equal(s.snapshot().memories.length,memories);s.close();
});
check('As duas posturas têm respostas diferentes e aparecem na retomada posterior',()=>{
 const b=fixture();reveal(b.story,'rosa',1);assert.equal(b.story.serialize().decisions['rosa:caixa'],1);const response=b.story.snapshot().discoveries[0].response;assert.match(response,/semente/);let heard=false;for(let i=0;i<6;i++){b.story.interact('rosa');heard=heard||b.story.currentDialogue().text.includes('embrulho dos três riscos');b.story.close();}assert.ok(heard);assert.equal(b.rewards.length,0);
});
check('Histórias de depois da reabertura não vazam antes dela, mesmo com amizade máxima',()=>{
 const b=fixture(),old=b.story.serialize();old.friendships.rosa=100;b.story.restore(old,b.context);reveal(b.story,'rosa');reveal(b.story,'rosa');b.story.interact('rosa');assert.equal(loreChoice(b.story),undefined);assert.equal(b.story.snapshot().completed,false);
});
check('As 18 histórias podem ser descobertas após o arco sem alterar as 140 moedas principais',()=>{
 const b=fixture();finish(b.story);const coins=b.rewards.reduce((n,r)=>n+r.coins,0);for(const npc of b.story.characters)for(let i=0;i<3;i++)reveal(b.story,npc.id,i%2);
 assert.equal(b.story.snapshot().discoveries.length,18);assert.equal(b.story.snapshot().discoveryTotal,18);assert.equal(Object.keys(b.story.serialize().decisions).length,18);assert.equal(b.rewards.length,6);assert.equal(coins,140);assert.equal(b.story.snapshot().coinsEarned,140);
 for(const npc of b.story.characters){b.story.interact(npc.id);assert.equal(loreChoice(b.story),undefined);b.story.choose('lore:revisit');assert.equal(b.story.currentDialogue().choices.filter(c=>c.id.startsWith('lore:')).length,3);b.story.close();}
});
check('Save e carregar conservam as escolhas e lembranças sem pagar ou abrir leitura',()=>{
 const b=fixture();finish(b.story);reveal(b.story,'caio',1);const old=b.story.serialize(),c=fixture();c.story.restore(old,c.context);assert.equal(c.story.isOpen(),false);assert.equal(c.rewards.length,0);assert.equal(JSON.stringify(c.story.snapshot().discoveries),JSON.stringify(b.story.snapshot().discoveries));assert.equal(c.story.serialize().decisions['caio:recipiente'],1);
});
check('Save legado sem campos v4 migra com histórias opcionais vazias, capítulos e amizade preservados',()=>{
 const b=fixture();finish(b.story);const old=b.story.serialize();for(const key of ['discoveries','decisions','visits','recentActions','spokenActions'])delete old[key];const c=fixture();assert.equal(c.story.restore(old,c.context),true);assert.equal(c.story.snapshot().completed,true);assert.equal(c.story.snapshot().discoveries.length,0);assert.equal(c.rewards.length,0);assert.equal(c.story.serialize().version,1);
});
check('IDs estranhos, escolhas inválidas, sequências infinitas e arrays enormes são sanitizados',()=>{
 const b=fixture(),old=b.story.serialize();old.discoveries=['__proto__','constructor','rosa:caixa','rosa:caixa',...Array(200).fill('lore-inexistente')];old.decisions={'rosa:caixa':2,'evil':0};old.visits={rosa:Infinity,lia:-50};old.spokenActions={rosa:1e20};old.recentActions=Array.from({length:200},()=>({event:'evil',sequence:Infinity}));assert.equal(b.story.restore(old,b.context),true);const clean=b.story.serialize();assert.deepEqual(Array.from(clean.discoveries),['rosa:caixa']);assert.equal(Object.keys(clean.decisions).length,0);assert.equal(clean.visits.rosa,0);assert.equal(clean.recentActions.length,0);assert.doesNotThrow(()=>b.story.snapshot());assert.equal(b.rewards.length,0);
});
check('Últimas ações reais geram comentário específico, uma vez por ação e morador',()=>{
 const b=fixture();b.story.interact('nico');b.story.close();b.story.record('plant',{eventId:'planta-1'});b.story.interact('nico');assert.match(b.story.currentDialogue().text,/Você plantou/);b.story.close();b.story.interact('nico');assert.doesNotMatch(b.story.currentDialogue().text,/Você plantou/);b.story.close();b.story.record('plant',{eventId:'planta-1'});b.story.interact('nico');assert.doesNotMatch(b.story.currentDialogue().text,/Você plantou/);b.story.close();b.story.record('water',{eventId:'rega-1'});b.story.interact('nico');assert.match(b.story.currentDialogue().text,/Vi a rega/);
});
check('Conversar não gera ações falsas de horta nem progresso anterior ao aceite',()=>{
 const b=fixture();for(let i=0;i<20;i++){b.story.interact('nico');b.story.close();}assert.equal(b.story.serialize().events.plant,0);assert.equal(b.story.serialize().events.harvest,0);assert.equal(b.story.snapshot().chapter.progress,0);assert.equal(b.story.snapshot().friendships.nico,2);
});
check('Cumprimentos variam e descanso com baixa energia recebe acolhimento sem alterar a simulação',()=>{
 const b=fixture();b.story.interact('rosa');b.story.close();const lines=new Set();for(let i=0;i<5;i++){b.story.interact('rosa');lines.add(b.story.currentDialogue().text);b.story.close();}assert.ok(lines.size>=3);b.context.energy=20;b.story.interact('rosa');assert.match(b.story.currentDialogue().text,/Minha cadeira/);assert.equal(b.context.energy,20);
});
check('Virada de estação conserva descobertas e escolhas e renova somente os pedidos',()=>{
 const b=fixture();reveal(b.story,'ines',1);const before=JSON.stringify(b.story.snapshot().discoveries);b.context.season='cold';b.story.update(.05,b.context);assert.equal(JSON.stringify(b.story.snapshot().discoveries),before);assert.equal(b.story.serialize().decisions['ines:fita'],1);assert.equal(b.story.snapshot().cycleId,2);assert.equal(b.rewards.length,0);
});
check('Partida longa limita ações, visitas, memórias e rebase não deixa avisos repetidos presos',()=>{
 const b=fixture();for(let i=0;i<100;i++){b.story.record('plant',{eventId:'plant-'+i});b.story.interact('nico');b.story.close();}assert.ok(b.story.serialize().recentActions.length<=6);const old=b.story.serialize();old.sequence=1000000;old.spokenActions.nico=1000000;b.story.restore(old,b.context);b.story.record('water',{eventId:'apos-rebase'});b.story.interact('nico');assert.match(b.story.currentDialogue().text,/Vi a rega/);assert.equal(b.story.serialize().sequence,2);
});
check('Novo jogo limpa todas as escolhas, avisos, descobertas e vínculos',()=>{s.reset();const clean=s.serialize();assert.equal(clean.discoveries.length,0);assert.equal(Object.keys(clean.decisions).length,0);assert.equal(clean.recentActions.length,0);assert.equal(s.snapshot().memories.length,0);assert.ok(s.snapshot().relationships.every(r=>r.label==='Por conhecer'));assert.equal(s.isOpen(),false);});
const result={geradoEm:new Date().toISOString(),passou:true,checagens:checks.length,nomes:checks,fonteSHA256:crypto.createHash('sha256').update(source).digest('hex'),limites:'VM verifica narrativa e migração. Leitura, foco, pausa e respostas precisam de navegador integrado.'};
const dir=path.join(root,'analise/narrativa-v4');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'unidade.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passou:true,checagens:checks.length}));
