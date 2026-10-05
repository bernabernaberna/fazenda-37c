/* Fila de cenas acompanha aceites/entregas reais, sem crédito retroativo. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const project=path.resolve(__dirname,'..'),played=[],seen=new Set(),saved=[];
let cinematicOpen=false,adapter;
const game={tabIndex:0,focus(){}};
const context={console,Set,Map,Uint8Array,Int8Array,Int32Array,Math,Number,JSON,Promise,
  performance:{now:()=>1000},document:{hidden:false,body:{},getElementById:id=>id==='game'?game:null},
  queueMicrotask:fn=>saved.push(fn),TS:16,T:{GRASS:0,WATER:1,RIVER:2,OASIS:3,FENCE:4},
  currentScene:'main',currentSeason:'hot',timeOfDay:10,currentRegion:()=> 'farm',isFrio:()=>false,
  scenes:{main:{MW:60,MH:124,map:Array.from({length:124},()=>Array(60).fill(0)),objects:[]}},
  player:{name:'Lua',gender:'f',x:280,y:900,moving:false,running:false,resting:false,dead:false,en:90,inv:{},coins:0},
  keys:{},A11Y:{reduceMotion:false},gameStarted:true,isPaused:false,shopOpen:false,inventoryOpen:false,journalOpen:false,skinOpen:false,
  cutsceneActive:false,histologyMissionOpen:false,tutorialActive:false,_pendingTutorialAfterCutscene:false,renderInv(){},renderShop(){},showToast(){},flashFx(){},saveGame(){},
  resumeGame(){context.isPaused=false;},nearObj(){return null;},
  FarmBiomes:{addObjectToMain:o=>context.scenes.main.objects.push(o),registerObjectDrawer(){},registerInteraction(){}},
  FarmCharacterArt:{drawNPC(){}},
  FarmStoryUI:{init(){},refresh(){},update(){},close(){context.FarmStoryWorld.close();},showDialogue(){},isOpen:()=>context.FarmStoryWorld.isOpen(),speechState:()=>({speaking:false})},
  FarmStoryCinematics:{init:a=>adapter=a,update(){},isOpen:()=>cinematicOpen,catalogue:()=>['carta','horta','rio','abrigo','oasis','reabertura'].map(id=>({id,seen:seen.has(id)})),play:id=>{played.push(id);cinematicOpen=true;return true;}}
};
context.window=context;vm.createContext(context);
for(const name of ['14-story-world.js','16-story-integration.js'])vm.runInContext(fs.readFileSync(path.join(project,'src','modules',name),'utf8'),context,{filename:name});
const world=context.FarmStoryWorld,integration=context.FarmStoryIntegration;
integration.init();integration.notifyNewGame();
context.tutorialActive=true;integration.visualUpdate(.05);assert.deepEqual(played,[],'Tutorial impede a cena de entrada');
context.tutorialActive=false;context._pendingTutorialAfterCutscene=true;integration.visualUpdate(.05);assert.deepEqual(played,[],'Intervalo da abertura ao tutorial também bloqueia a carta');
context._pendingTutorialAfterCutscene=false;integration.visualUpdate(.05);assert.deepEqual(played,['carta'],'Cena de entrada aguarda tutorial');
function finishScene(){cinematicOpen=false;seen.add(played.at(-1));adapter.onChange();adapter.onClose();}
finishScene();
for(let index=0;index<6;index++){
  const definition=world.chapters[index];world.interact(definition.npcId);world.choose('main:accept');
  const coins=context.player.coins;integration.visualUpdate(.05);assert.equal(context.player.coins,coins);assert.equal(cinematicOpen,false,'Aceite não interrompe a resposta do NPC');
  world.close();integration.visualUpdate(.05);
  if([1,2,3,4].includes(index)){assert.equal(played.at(-1),({1:'horta',2:'rio',3:'abrigo',4:'oasis'})[index]);finishScene();}
  for(const objective of definition.objectives)world.record(objective.event,{...objective.match,amount:objective.goal});
  assert.equal(world.snapshot().chapter.status,'ready',definition.title);
  world.interact(definition.npcId);world.choose('main:claim');
  integration.visualUpdate(.05);assert.equal(cinematicOpen,false,'Conclusão não interrompe fala final');
  world.close();integration.visualUpdate(.05);
}
assert.equal(played.at(-1),'reabertura');finishScene();assert.deepEqual(played,['carta','horta','rio','abrigo','oasis','reabertura']);
assert.equal(context.player.coins,140,'Cenas não dão nem repetem moedas');
const persisted=world.serialize(),coins=context.player.coins;integration.restore(persisted);integration.visualUpdate(.05);
assert.equal(played.length,6,'Restore não dispara avalanche das cenas anteriores');assert.equal(context.player.coins,coins);
assert.equal(integration.cinematicQueue().length,0);context.document.hidden=true;integration.notifyNewGame();integration.visualUpdate(.05);assert.equal(played.length,6,'Aba oculta não abre cena pendente');
integration.reset();assert.equal(integration.cinematicQueue().length,0,'Reset limpa fila da partida anterior');
console.log(JSON.stringify({passou:true,cenas:played,coins:context.player.coins,checagens:17}));
