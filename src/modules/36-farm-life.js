/* Trabalho e descobertas no Vale dos Três Ventos.
   Custos são conferidos por inteiro antes de consumir recursos; todo relógio
   usa segundos de simulação ativa. Ler/carregar não entrega produtos nem moedas.
   Novos produtos pertencem ao depósito local, sem reindexar inventário/objetos. */
(function(){
 'use strict';
 const LIMIT=999,MAX_COUNT=1000000;
 const ITEMS={wood:{name:'Lenha',icon:'🪵'},hay:{name:'Feno',icon:'🌾'},wool:{name:'Lã',icon:'🐑'},veg:{name:'Vegetais',icon:'🥕'},water:{name:'Água',icon:'💧'},
  soup:{name:'Sopa da horta',icon:'🍲'},warmDrink:{name:'Chá com mel',icon:'☕'},blanket:{name:'Cobertor',icon:'🛏️'},gloves:{name:'Luvas',icon:'🧤'},
  mel:{name:'Mel',icon:'🍯',description:'Colhido no apiário recuperado; usado na cozinha e nas encomendas.'},
  fruta:{name:'Frutas do pomar',icon:'🍎',description:'Frutas renováveis do pomar do leste, para compotas e cestas.'},
  leite:{name:'Leite do curral',icon:'🥛',description:'A produção depende de vacas alimentadas; entregue na mesa comunitária.'},
  ovos:{name:'Ovos do curral',icon:'🥚',description:'Galinhas alimentadas produzem ovos para a cozinha e os moradores.'},
  compota:{name:'Compota de frutas',icon:'🫙',description:'Um lanche da fazenda: recupera até 22 de energia e 8 de hidratação.'}};
 const STOCK_IDS=['mel','fruta','leite','ovos','compota'];
 const PROJECTS=[
  {id:'oficina',name:'Oficina de Tomás',description:'Uma bancada esquecida, um tear pequeno e ferramentas que ainda têm conserto. Tomás faz os encaixes; Inês ensina as costuras.',benefit:'Libera cobertores e luvas; o trabalho aparece no mapa.',x:280,y:1096,cost:{coins:18,items:{wood:3,wool:1}}},
  {id:'cozinha',name:'Cozinha do encontro',description:'Rosa guardou o fogareiro. Você traz a lenha; os moradores trazem suas receitas.',benefit:'Libera sopa, chá com mel, compota e preparo de ração.',x:176,y:1096,cost:{coins:24,items:{wood:4,veg:1}}},
  {id:'apiario',name:'Apiário dos três ventos',description:'Reparar as caixas e plantar flores devolve abrigo às abelhas do pomar.',benefit:'Produz mel a cada 90 segundos de jogo ativo; até 3 por coleta.',x:808,y:1072,cost:{coins:22,items:{wood:4,hay:2}}},
  {id:'irrigacao',name:'Bomba e canais da horta',description:'Tomás reconhece a velha bomba do vale. Conserte o mecanismo e recarregue o reservatório.',benefit:'Duas águas irrigam até 6 canteiros secos, um a cada 12 segundos ativos.',x:344,y:1016,cost:{coins:26,items:{wood:5}}}
 ];
 const RECIPES=[
  {id:'sopa',name:'Sopa da horta',description:'Transforma a colheita em uma refeição quente. Use a sopa pela mochila.',projectId:'cozinha',cost:{items:{veg:1,wood:1}},result:{id:'soup',amount:1,source:'inv'}},
  {id:'cha-mel',name:'Chá com mel',description:'Uma bebida quente para a trilha fria; o mel vem do seu apiário.',projectId:'cozinha',cost:{items:{mel:1,water:1,wood:1}},result:{id:'warmDrink',amount:1,source:'inv'}},
  {id:'compota',name:'Compota de frutas',description:'Guarde um lanche ou prepare a encomenda de Nico. Consuma no depósito da fazenda.',projectId:'cozinha',cost:{items:{fruta:2,mel:1}},result:{id:'compota',amount:1,source:'stock'}},
  {id:'cobertor',name:'Cobertor de retalhos',description:'Feito com lã do curral. Equipar pela mochila melhora o descanso no frio.',projectId:'oficina',cost:{items:{wool:2}},result:{id:'blanket',amount:1,source:'inv'}},
  {id:'luvas',name:'Luvas de trabalho',description:'Inês ensina uma costura firme. Equipar pela mochila reduz perdas de calor nas tarefas.',projectId:'oficina',cost:{items:{wool:1}},result:{id:'gloves',amount:1,source:'inv'}},
  {id:'racao',name:'Ração da colheita',description:'Aproveite vegetais e feno para alimentar os animais. Uma mistura rende 6 fenos.',projectId:'cozinha',cost:{items:{veg:1,hay:1}},result:{id:'hay',amount:6,source:'inv'}}
 ];
 const PRODUCTION=[
  {id:'mel',name:'Colher mel no apiário',item:'mel',projectId:'apiario',x:808,y:1072,cycleSeconds:90},
  {id:'pomar',name:'Colher frutos do pomar',item:'fruta',projectId:null,x:856,y:928,cycleSeconds:70},
  {id:'leite',name:'Ordenhar o curral',item:'leite',projectId:null,x:512,y:918,kind:'cow',cycleSeconds:100},
  {id:'ovos',name:'Recolher os ovos',item:'ovos',projectId:null,x:512,y:918,kind:'chicken',cycleSeconds:80}
 ];
 const BOARD={id:'quadro',name:'Quadro de encomendas',x:568,y:1290};
 const ORDERS=[
  {id:'cesta-rosa',npcId:'rosa',title:'A cesta de Rosa',description:'Rosa leva uma cesta às pessoas que ainda não conseguem visitar a feira.',cost:{items:{veg:2,fruta:1}},reward:64},
  {id:'fio-ines',npcId:'ines',title:'Fios e cuidado',description:'Inês prepara um cobertor para a cabana e guarda mel para o chá de quem chega.',cost:{items:{wool:2,mel:1}},reward:42},
  {id:'lanche-nico',npcId:'nico',title:'O lanche da expedição',description:'Nico quer investigar as marcas da ponte, mas prometeu levar comida para dois.',cost:{items:{compota:1,ovos:2}},reward:32},
  {id:'canteiro-tomas',npcId:'tomas',title:'Canteiros e vizinhos',description:'Tomás divide feno com a criação dos vizinhos e frutas com quem o ajuda na horta.',cost:{items:{hay:3,fruta:1}},reward:26},
  {id:'mesa-lia',npcId:'lia',title:'Uma mesa para todos',description:'Lia organiza um lanche depois da caminhada do vale: leite e um pouco de mel.',cost:{items:{leite:2,mel:1}},reward:34},
  {id:'rota-caio',npcId:'caio',title:'Provisões de Caio',description:'Caio prepara provisões para os visitantes do oásis; ninguém precisa caminhar de estômago vazio.',cost:{items:{fruta:2,mel:1}},reward:30}
 ];
 const CLUES=[
  {id:'carta-perdida',title:'Uma dobra na carta',x:264,y:928,text:'O envelope tem três riscos e nenhum remetente. “Quando a casa voltar a ouvir gente, procure onde os três caminhos se encontram.” Uma dobra guarda terra fresca da horta.'},
  {id:'ponte-marca',title:'Marcas sob a ponte',x:720,y:936,text:'O verso da placa tem uma seta feita para virar. Tomás reconhece o encaixe: estas marcas orientavam as trocas antes da ventania.'},
  {id:'horta-caderno',title:'O caderno da horta',x:408,y:984,text:'Três colunas dizem “alto, margem, areia”. São os lugares de quem guardou as amostras antes da ventania, não coordenadas de um tesouro.'},
  {id:'cabana-fita',title:'Uma fita na cabana',x:520,y:272,text:'Uma fita de lã prende um recado de Inês, datado de antes da ventania: “Reserva entregue; se a neve fechar a rota, a próxima tentativa continua aqui.”'},
  {id:'oasis-caixa',title:'A caixa do oásis',x:640,y:1812,text:'A etiqueta tem as assinaturas de Rosa e Caio: “Esta reserva pertence ao vale. Não confundir troca com dívida.” A rede também alcançava o oásis.'},
  {id:'mapa-nico',title:'O mapa de Nico',x:392,y:1000,text:'As rotas se sobrepõem e deixam a Casa no centro. Um rascunho tem a assinatura de Alex: “Não guardar tudo no mesmo teto.” Você já conhecia esta ideia.'},
  {id:'arquivo-casa',title:'O arquivo da Casa',x:608,y:1280,text:'O acordo distribuía amostras entre os três biomas e previa encontros para comparar o que crescia. Os papéis voaram; o silêncio desfez os encontros. As sementes já estavam protegidas pela rede.'}
 ];
 let callbacks={},API=null,state=fresh(),animalCache={objects:null,length:0,list:[]};
 const sprites=new Map();
 function fresh(){return{version:1,projects:Object.fromEntries(PROJECTS.map(p=>[p.id,false])),maintenance:Object.fromEntries(PROJECTS.map(p=>[p.id,{remaining:0,cooldown:0,times:0}])),stock:Object.fromEntries(STOCK_IDS.map(id=>[id,0])),production:Object.fromEntries(PRODUCTION.map(p=>[p.id,{elapsed:0,ready:0}])),crafted:Object.fromEntries(RECIPES.map(r=>[r.id,0])),orders:Object.fromEntries(ORDERS.map(o=>[o.id,{deliveries:0,cooldown:0}])),clues:Object.fromEntries(CLUES.map(c=>[c.id,{found:false,reads:0}])),irrigation:{charges:0,elapsed:0},totals:{crafted:0,produced:0,orders:0},activeSeconds:0};}
 const count=(n,max=LIMIT)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
 const seconds=(n,max)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(max,n)):0;
 function read(){try{return(callbacks.readState||callbacks.read)?.()||{};}catch(e){return{};}}
 function player(){return read().player||API?.player||null;}
 function inventory(p){return p?.inv||read().inventory||null;}
 function invAmount(id,p=player()){return count(inventory(p)?.[id],MAX_COUNT);}
 const isStock=id=>STOCK_IDS.includes(id);
 const amount=(id,p)=>isStock(id)?state.stock[id]:invAmount(id,p);
 function pointReason(point,radius=42){const r=read(),p=r.player||API?.player;if(!p||p.dead)return'Comece uma partida para trabalhar na fazenda.';const scene=r.scene??r.rawScene??API?.rawScene??'main';if(scene!=='main'&&scene!=='farm')return'Saia para o vale e vá até este local.';if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.hypot(p.x-point.x,p.y-point.y)>radius)return'Vá até '+(point.name||point.title||'este local')+' no mapa e aproxime-se para interagir.';return'';}
 function costEntries(cost,p=player()){return Object.entries(cost?.items||{}).map(([id,n])=>({id,name:ITEMS[id]?.name||id,icon:ITEMS[id]?.icon||'📦',amount:n,have:amount(id,p),source:isStock(id)?'stock':'inv'}));}
 function costReason(cost,p=player()){
  if(!p||!inventory(p))return'O inventário ainda não está disponível.';
  if(count(p.coins,MAX_COUNT)<(cost?.coins||0))return'Faltam '+((cost.coins||0)-count(p.coins,MAX_COUNT))+' moedas.';
  const missing=costEntries(cost,p).filter(i=>i.have<i.amount);return missing.length?'Falta: '+missing.map(i=>(i.amount-i.have)+' '+i.name.toLowerCase()).join(', ')+'.':'';
 }
 function pay(cost,p){const why=costReason(cost,p);if(why)return why;for(const [id,n]of Object.entries(cost?.items||{})){if(isStock(id))state.stock[id]-=n;else inventory(p)[id]=invAmount(id,p)-n;}if(cost?.coins)p.coins=count(p.coins,MAX_COUNT)-cost.coins;return'';}
 function answer(ok,message,extra){return{ok,message,...extra};}
 function announce(type,payload,message){
  try{callbacks.onEvent?.(type,payload);}catch(e){console.warn('[fazenda] evento',e);}
  try{callbacks.onChange?.(snapshot(),{type,payload});}catch(e){console.warn('[fazenda] alteração',e);}
  try{API?.refreshInventory?.();}catch(e){console.warn('[fazenda] inventário',e);}return answer(true,message,payload);
 }
 function project(id){return PROJECTS.find(p=>p.id===id);}
 function clue(d){const canon=window.FarmValleySaga?.clueCatalogue?.()?.find(c=>c.id===d.id);return canon?{...d,title:canon.title||d.title,text:canon.text||d.text}:d;}
 function built(id){return !!state.projects[id];}
 const MAINTENANCE_COST={items:{wood:1}},MAINTENANCE_BENEFIT={oficina:'Bancada organizada: confeccionar recupera até 3 de energia por 180 segundos ativos.',cozinha:'Fogareiro ajustado: cada sopa rende 2 por 180 segundos ativos.',apiario:'Caixas cuidadas: o mel cresce 25% mais rápido por 180 segundos ativos.',irrigacao:'Bomba lubrificada: a rega leva 8 segundos por 180 segundos ativos.'};
 const maintained=id=>state.maintenance[id]?.remaining>0;
 function maintainReason(d,p){return !built(d.id)?'Recupere este projeto primeiro.':pointReason(d)||(state.maintenance[d.id].cooldown>0?'A próxima manutenção fica disponível em '+Math.ceil(state.maintenance[d.id].cooldown)+' segundos ativos.':'')||costReason(MAINTENANCE_COST,p);}
 function maintain(id){const d=project(id);if(!d)return answer(false,'Projeto desconhecido.');const p=player(),why=maintainReason(d,p);if(why)return answer(false,why);pay(MAINTENANCE_COST,p);const m=state.maintenance[id];m.remaining=180;m.cooldown=60;m.times=Math.min(MAX_COUNT,m.times+1);return announce('repair',{projectId:id,first:false,maintenance:true},'Manutenção concluída. '+MAINTENANCE_BENEFIT[id]);}
 function recipeResult(r){return{...r.result,amount:r.id==='sopa'&&maintained('cozinha')?2:r.result.amount};}
 function recipeReason(r,p){const pr=project(r.projectId),result=recipeResult(r);return!built(r.projectId)?'Primeiro recupere '+pr.name+'.':pointReason(pr)||costReason(r.cost,p)||(amount(result.id,p)+result.amount>LIMIT?'Não há espaço para mais '+(ITEMS[result.id]?.name||result.id)+'.':'');}
 function build(id){const d=project(id);if(!d)return answer(false,'Projeto desconhecido.');if(built(id))return answer(false,'Este projeto já foi recuperado.');const p=player(),why=pointReason(d)||costReason(d.cost,p);if(why)return answer(false,why);pay(d.cost,p);state.projects[id]=true;return announce('repair',{projectId:id,first:true},d.name+' recuperada! '+d.benefit);}
 function craft(id){const r=RECIPES.find(r=>r.id===id);if(!r)return answer(false,'Receita desconhecida.');const p=player(),why=recipeReason(r,p),result=recipeResult(r);if(why)return answer(false,why);pay(r.cost,p);if(result.source==='stock')state.stock[result.id]+=result.amount;else inventory(p)[result.id]=invAmount(result.id,p)+result.amount;if(r.projectId==='oficina'&&maintained('oficina')&&Number.isFinite(p.en))p.en=Math.min(100,p.en+3);state.crafted[id]=Math.min(MAX_COUNT,state.crafted[id]+1);state.totals.crafted=Math.min(MAX_COUNT,state.totals.crafted+1);return announce('craft',{recipeId:id,item:result.id,amount:result.amount},'Preparado: '+result.amount+' '+r.name+'.');}
 function animals(value){const r=value||read();if(Array.isArray(r.animals))return r.animals;const objects=r.objects||API?.scenes?.main?.objects||[];if(objects!==animalCache.objects||objects.length!==animalCache.length){animalCache={objects,length:objects.length,list:objects.filter(o=>o.type==='animal')};}return animalCache.list;}
 function healthy(kind,value){return animals(value).some(a=>(kind==='chicken'?['chick','chicken'].includes(a.kind):a.kind===kind)&&Number(a.well??.85)>=.45);}
 function productionReason(d,value){if(d.projectId&&!built(d.projectId))return'Primeiro recupere '+project(d.projectId).name+'.';if(d.kind&&!healthy(d.kind,value))return d.kind==='cow'?'Alimente as vacas do curral para produzir leite.':'Alimente as galinhas do curral para produzir ovos.';return'';}
 function collect(id){const d=PRODUCTION.find(p=>p.id===id);if(!d)return answer(false,'Produção desconhecida.');const p=player(),row=state.production[id],why=pointReason(d)||(!row.ready?'Ainda está crescendo: '+Math.ceil(d.cycleSeconds-row.elapsed)+' segundos de jogo ativo.':'')||(state.stock[d.item]>=LIMIT?'O depósito está cheio.':'');if(why)return answer(false,why);const n=Math.min(row.ready,LIMIT-state.stock[d.item]);row.ready-=n;state.stock[d.item]+=n;state.totals.produced=Math.min(MAX_COUNT,state.totals.produced+n);return announce('produce',{productionId:id,item:d.item,amount:n},'Colhido: '+n+' '+ITEMS[d.item].name.toLowerCase()+'.');}
 function deliverOrder(id){const d=ORDERS.find(o=>o.id===id);if(!d)return answer(false,'Encomenda desconhecida.');const p=player(),row=state.orders[id],why=pointReason(BOARD)||(row.cooldown>0?'Esta encomenda volta em '+Math.ceil(row.cooldown)+' segundos de jogo ativo.':'')||costReason(d.cost,p)||(count(p?.coins,MAX_COUNT)+d.reward>MAX_COUNT?'A bolsa de moedas está cheia.':'');if(why)return answer(false,why);pay(d.cost,p);row.deliveries=Math.min(MAX_COUNT,row.deliveries+1);row.cooldown=180;p.coins=count(p.coins,MAX_COUNT)+d.reward;state.totals.orders=Math.min(MAX_COUNT,state.totals.orders+1);return announce('order',{orderId:id,npcId:d.npcId,coins:d.reward,amount:1,delivery:row.deliveries},'Encomenda entregue: +'+d.reward+' moedas. O morador agradece o seu trabalho.');}
 function inspect(id){const def=CLUES.find(c=>c.id===id);if(!def)return answer(false,'Pista desconhecida.');const d=clue(def),why=pointReason(d,38);if(why)return answer(false,why);const row=state.clues[id],first=!row.found;row.found=true;row.reads=Math.min(MAX_COUNT,row.reads+1);return announce('inspect',{clueId:id,first,text:d.text,title:d.title},d.text);}
 function consume(id){if(id!=='compota')return answer(false,'Este produto deve ser usado numa receita ou encomenda.');const p=player();if(!p||p.dead)return answer(false,'Comece uma partida para consumir o lanche.');if(!state.stock.compota)return answer(false,'Prepare compota na cozinha primeiro.');if(!Number.isFinite(p.en)||!Number.isFinite(p.hyd))return answer(false,'O estado do jogador ainda não está disponível.');const energy=Math.max(0,Math.min(22,100-p.en)),water=Math.max(0,Math.min(8,100-p.hyd));if(!energy&&!water)return answer(false,'Você já está com energia e hidratação completas. Guarde o lanche.');state.stock.compota--;p.en=Math.min(100,p.en+energy);p.hyd=Math.min(100,p.hyd+water);return announce('use',{item:'compota',amount:1,energy,hydration:water},'Compota: +'+Math.round(energy)+' energia e +'+Math.round(water)+' hidratação.');}
 const CORRAL={id:'curral',name:'Curral',x:512,y:918};
 function care(id){if(id!=='curral')return answer(false,'Cuidado desconhecido.');const p=player(),list=animals(),cost={items:{hay:2,water:1}},why=pointReason(CORRAL)||(!list.length?'Não há animais neste curral.':'')||(list.every(a=>Number(a.well??.85)>=.9)?'Os animais já estão bem alimentados.':'')||costReason(cost,p);if(why)return answer(false,why);pay(cost,p);for(const a of list)a.well=1;return announce('care',{kind:'curral',animals:list.length},'Feno e água fresca para o curral. Animais alimentados voltam a produzir.');}
 function refillIrrigation(){const p=player(),d=project('irrigacao'),cost={items:{water:2}},why=!built(d.id)?'Recupere a bomba da horta primeiro.':pointReason(d)||(state.irrigation.charges>0?'O reservatório ainda tem '+state.irrigation.charges+' regas.':'')||costReason(cost,p);if(why)return answer(false,why);pay(cost,p);state.irrigation.charges=6;state.irrigation.elapsed=0;return announce('care',{kind:'irrigacao',charges:6},'Reservatório abastecido: até 6 canteiros secos serão regados.');}
 function cropSet(value){const r=value||read();return r.mainCrops||API?.scenes?.main?.crops||r.crops||{};}
 function update(dt){
  const r=read(),p=r.player||API?.player;if(!p||p.dead||r.paused||r.active===false||window.document?.hidden||!Number.isFinite(dt)||dt<=0)return;
  const step=Math.min(1,dt);state.activeSeconds=Math.min(MAX_COUNT,state.activeSeconds+step);let changed=false;
  for(const d of PRODUCTION){const row=state.production[d.id];if(productionReason(d,r)||row.ready>=3)continue;row.elapsed+=step*(d.id==='mel'&&maintained('apiario')?1.25:1);while(row.elapsed>=d.cycleSeconds&&row.ready<3){row.elapsed-=d.cycleSeconds;row.ready++;changed=true;}if(row.ready===3)row.elapsed=0;}
  for(const d of PROJECTS){const m=state.maintenance[d.id];if(m.remaining>0){m.remaining=Math.max(0,m.remaining-step);if(m.remaining===0)changed=true;}if(m.cooldown>0){m.cooldown=Math.max(0,m.cooldown-step);if(m.cooldown===0)changed=true;}}
  for(const d of ORDERS){const row=state.orders[d.id];if(row.cooldown>0){row.cooldown=Math.max(0,row.cooldown-step);if(row.cooldown===0)changed=true;}}
  if(built('irrigacao')&&state.irrigation.charges>0){
   const crops=cropSet(r),dry=Object.keys(crops).find(k=>{const c=crops[k];return c&&c.stage>0&&c.stage<3&&Number(c.water||0)===0;});
   if(dry){state.irrigation.elapsed+=step;if(state.irrigation.elapsed>=(maintained('irrigacao')?8:12)){const c=crops[dry];c.water=1;state.irrigation.elapsed=0;state.irrigation.charges--;changed=true;try{callbacks.onEvent?.('water',{amount:1,source:'irrigacao',crop:dry});}catch(e){console.warn('[fazenda] irrigação',e);}API?.flashFx?.(Number(dry.split(',')[0])*16+8,Number(dry.split(',')[1])*16,'regado pela bomba','#7bc7cb');}}
  }
  if(changed)try{callbacks.onChange?.(snapshot(),{type:'production-ready'});}catch(e){console.warn('[fazenda] relógio',e);}
 }
 function snapshot(){
  const p=player(),projects=PROJECTS.map(d=>{const why=built(d.id)?'Projeto concluído.':pointReason(d)||costReason(d.cost,p),m=state.maintenance[d.id],maintenanceWhy=maintainReason(d,p);return{...d,cost:JSON.parse(JSON.stringify(d.cost)),built:built(d.id),costs:costEntries(d.cost,p),canBuild:!why,disabledReason:why,maintenanceCost:JSON.parse(JSON.stringify(MAINTENANCE_COST)),maintenanceCosts:costEntries(MAINTENANCE_COST,p),maintenanceCooldown:Math.ceil(m.cooldown),maintenanceRemaining:Math.ceil(m.remaining),maintenanceBenefit:MAINTENANCE_BENEFIT[d.id],canMaintain:!maintenanceWhy,maintenanceDisabledReason:maintenanceWhy};});
  const careWhy=pointReason(CORRAL)||(!animals().length?'Não há animais neste curral.':'')||(animals().every(a=>Number(a.well??.85)>=.9)?'Os animais já estão bem alimentados.':'')||costReason({items:{hay:2,water:1}},p);
  const irrigationWhy=!built('irrigacao')?'Recupere a bomba da horta primeiro.':pointReason(project('irrigacao'))||(state.irrigation.charges>0?'O reservatório ainda tem '+state.irrigation.charges+' regas.':'')||costReason({items:{water:2}},p);
  return{version:1,activeSeconds:state.activeSeconds,stock:{...state.stock},stockItems:STOCK_IDS.map(id=>({id,...ITEMS[id],amount:state.stock[id],canConsume:id==='compota'&&state.stock[id]>0&&!!p&&!p.dead&&(p.en<100||p.hyd<100),disabledReason:id!=='compota'?'Use nas receitas e encomendas.':!state.stock[id]?'Prepare na cozinha.':p?.en>=100&&p?.hyd>=100?'Energia e hidratação completas.':''})),
   stations:[...PROJECTS.map(({id,name,x,y})=>({id,name,x,y})),{...BOARD},{...CORRAL},{id:'pomar',name:'Pomar do leste',x:856,y:928}],projects,
   recipes:RECIPES.map(r=>{const pr=project(r.projectId),why=recipeReason(r,p),result=recipeResult(r);return{...r,x:pr.x,y:pr.y,cost:JSON.parse(JSON.stringify(r.cost)),result:{...result,name:ITEMS[result.id]?.name,icon:ITEMS[result.id]?.icon},costs:costEntries(r.cost,p),crafted:state.crafted[r.id],canCraft:!why,disabledReason:why};}),
   production:PRODUCTION.map(d=>{const row=state.production[d.id],status=productionReason(d),left=Math.ceil((d.cycleSeconds-row.elapsed)/(d.id==='mel'&&maintained('apiario')?1.25:1)),why=pointReason(d)||(!row.ready?status||'O próximo produto fica pronto em '+left+' segundos ativos.':'')||(state.stock[d.item]>=LIMIT?'Depósito cheio.':'');return{...d,ready:row.ready,capacity:3,secondsRemaining:left,status:status||(row.ready?'Pronto para colher.':'Crescendo durante o jogo ativo.'),canCollect:!why,disabledReason:why};}),
   orders:ORDERS.map(d=>{const row=state.orders[d.id],why=pointReason(BOARD)||(row.cooldown>0?'Volta em '+Math.ceil(row.cooldown)+' segundos ativos.':'')||costReason(d.cost,p)||(count(p?.coins,MAX_COUNT)+d.reward>MAX_COUNT?'Bolsa de moedas cheia.':'');return{...d,x:BOARD.x,y:BOARD.y,cost:JSON.parse(JSON.stringify(d.cost)),costs:costEntries(d.cost,p),deliveries:row.deliveries,cooldown:Math.ceil(row.cooldown),canDeliver:!why,disabledReason:why};}),
   clues:CLUES.map(def=>{const d=clue(def);return{...d,...state.clues[d.id],canInspect:!pointReason(d,38),disabledReason:pointReason(d,38)};}),
   corral:{...CORRAL,cost:{items:{hay:2,water:1}},costs:costEntries({items:{hay:2,water:1}},p),canCare:!careWhy,disabledReason:careWhy},
   animalCare:{...CORRAL,cost:{items:{hay:2,water:1}},costs:costEntries({items:{hay:2,water:1}},p),canCare:!careWhy,disabledReason:careWhy},
   irrigation:{...state.irrigation,canRefill:!irrigationWhy,disabledReason:irrigationWhy,costs:costEntries({items:{water:2}},p),x:project('irrigacao').x,y:project('irrigacao').y},
   totals:{...state.totals,built:PROJECTS.filter(d=>built(d.id)).length,clues:CLUES.filter(d=>state.clues[d.id].found).length}};
 }
 function serialize(){return JSON.parse(JSON.stringify(state));}
 function restore(saved){
  const next=fresh(),data=saved&&typeof saved==='object'&&!Array.isArray(saved)&&saved.version===1?saved:{};
  for(const d of PROJECTS)next.projects[d.id]=data.projects?.[d.id]===true;
  for(const d of PROJECTS)if(next.projects[d.id])next.maintenance[d.id]={remaining:seconds(data.maintenance?.[d.id]?.remaining,180),cooldown:seconds(data.maintenance?.[d.id]?.cooldown,60),times:count(data.maintenance?.[d.id]?.times,MAX_COUNT)};
  for(const id of STOCK_IDS)next.stock[id]=count(data.stock?.[id]);
  for(const d of PRODUCTION){const row=data.production?.[d.id];if(d.projectId&&!next.projects[d.projectId])continue;next.production[d.id]={elapsed:seconds(row?.elapsed,d.cycleSeconds-0.001),ready:count(row?.ready,3)};if(next.production[d.id].ready===3)next.production[d.id].elapsed=0;}
  for(const d of RECIPES)next.crafted[d.id]=count(data.crafted?.[d.id],MAX_COUNT);
  for(const d of ORDERS)next.orders[d.id]={deliveries:count(data.orders?.[d.id]?.deliveries,MAX_COUNT),cooldown:seconds(data.orders?.[d.id]?.cooldown,180)};
  for(const d of CLUES){const row=data.clues?.[d.id];next.clues[d.id]={found:row?.found===true,reads:row?.found===true?Math.max(1,count(row.reads,MAX_COUNT)):0};}
  if(next.projects.irrigacao)next.irrigation={charges:count(data.irrigation?.charges,6),elapsed:seconds(data.irrigation?.elapsed,11.999)};
  next.totals={crafted:count(Object.values(next.crafted).reduce((a,b)=>a+b,0),MAX_COUNT),orders:count(Object.values(next.orders).reduce((a,b)=>a+b.deliveries,0),MAX_COUNT),produced:count(data.totals?.produced,MAX_COUNT)};
  next.activeSeconds=seconds(data.activeSeconds,MAX_COUNT);state=next;animalCache={objects:null,length:0,list:[]};return snapshot();
 }
 function reset(){state=fresh();animalCache={objects:null,length:0,list:[]};return snapshot();}
 function R(g,c,x,y,w,h){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 const P={ink:'#2b4036',dark:'#5c4d3b',wood:'#92754d',light:'#c9a56b',cream:'#eee0b2',green:'#65865f',sage:'#a4b985',clay:'#b46f54',water:'#65adb5',amber:'#e1b957'};
 function cached(key,width,height,paint){let c=sprites.get(key);if(!c){c=document.createElement('canvas');c.width=width;c.height=height;paint(c.getContext('2d'));sprites.set(key,c);}return c;}
 function roof(g,x,y,w,color){for(let row=0;row<12;row++){const edge=Math.floor(row/2);R(g,row===11?P.dark:color,x-edge,y+row,w+edge*2,1);if(row%4===1)R(g,P.light,x-edge,y+row,w+edge*2,1);}R(g,P.dark,x-6,y+12,w+12,3);}
 function paintProject(g,id,done){
  const x=10,y=14;R(g,'rgba(32,50,38,.2)',x-3,68,66,7);R(g,'#b1a075',x,63,58,9);R(g,P.dark,x,69,60,3);R(g,P.cream,x+1,63,58,2);
  if(!done){
   R(g,P.dark,x+2,44,3,23);R(g,P.dark,x+50,44,3,23);R(g,P.wood,x+2,43,51,3);R(g,P.light,x+4,43,48,1);
   for(let n=0;n<3;n++){R(g,P.wood,x+8+n*4,57+n*3,32,3);R(g,P.light,x+8+n*4,57+n*3,30,1);}R(g,P.dark,x+17,34,28,19);R(g,P.cream,x+18,35,26,17);R(g,P.green,x+21,38,20,1);R(g,P.dark,x+21,43,14,1);R(g,P.dark,x+21,47,18,1);return;
  }
  if(id==='oficina'){
   R(g,P.dark,x+4,y+8,3,48);R(g,P.dark,x+51,y+8,3,48);roof(g,x+2,y,54,P.green);R(g,P.dark,x+5,49,50,6);R(g,P.wood,x+5,49,50,3);R(g,P.light,x+6,49,47,1);R(g,P.dark,x+9,53,4,13);R(g,P.dark,x+45,53,4,13);
   R(g,P.wood,x+11,27,17,21);R(g,P.dark,x+13,29,2,20);R(g,P.dark,x+24,29,2,20);for(let n=0;n<6;n++)R(g,P.cream,x+15+n,31,1,14);R(g,P.clay,x+15,36,10,5);R(g,P.water,x+16,38,8,1);R(g,P.dark,x+34,39,12,8);R(g,P.light,x+35,40,10,2);R(g,P.dark,x+41,29,2,12);R(g,P.light,x+37,29,10,3);
  }else if(id==='cozinha'){
   R(g,P.dark,x+4,y+7,3,50);R(g,P.dark,x+52,y+7,3,50);roof(g,x+2,y,55,P.clay);R(g,P.dark,x+5,49,49,6);R(g,P.wood,x+5,49,49,3);R(g,P.light,x+6,49,47,1);R(g,P.dark,x+10,53,4,13);R(g,P.dark,x+47,53,4,13);
   R(g,'#83877b',x+7,34,19,18);R(g,P.dark,x+9,44,15,6);R(g,P.amber,x+12,46,8,3);R(g,P.dark,x+10,30,13,6);R(g,'#bfc1a7',x+11,30,11,3);R(g,P.cream,x+14,28,6,2);R(g,P.cream,x+34,43,12,5);R(g,P.wood,x+33,40,14,3);R(g,P.clay,x+38,32,7,8);R(g,P.cream,x+39,33,5,1);R(g,P.green,x+42,25,3,7);
  }else if(id==='apiario'){
   for(let n=0;n<2;n++){const xx=x+7+n*27;R(g,P.dark,xx,58,3,10);R(g,P.dark,xx+14,58,3,10);R(g,P.wood,xx-2,36,20,23);for(let row=0;row<3;row++){R(g,P.light,xx-2,37+row*7,19,2);R(g,P.dark,xx-2,43+row*7,20,1);}roof(g,xx-2,25,20,P.green);R(g,P.ink,xx+3,55,10,2);R(g,P.cream,xx+4,38,7,2);}
   for(let n=0;n<7;n++){const xx=x-1+n*10,yy=60+n%2*3;R(g,P.green,xx,yy,1,8);R(g,n%2?P.clay:P.amber,xx-2,yy-2,5,3);R(g,P.cream,xx,yy-1,1,1);}
  }else{
   R(g,P.dark,x+7,28,23,35);R(g,P.wood,x+8,28,21,33);R(g,P.light,x+10,29,3,32);for(let row=0;row<4;row++)R(g,P.dark,x+7,29+row*9,23,2);R(g,P.water,x+10,27,17,3);R(g,P.dark,x+34,38,5,25);R(g,'#abb3a0',x+35,39,3,21);R(g,'#abb3a0',x+35,38,14,3);R(g,P.dark,x+47,37,3,12);R(g,P.water,x+42,60,15,3);R(g,P.cream,x+10,64,43,2);
  }
 }
 function drawProject(o,g){const done=built(o.projectId),c=cached('project:'+o.projectId+':'+done,84,86,c=>paintProject(c,o.projectId,done));g.drawImage(c,Math.round(o.x-41),Math.round(o.y-72));
  if(done&&o.projectId==='apiario'&&state.production.mel.ready>0){R(g,P.cream,o.x-4,o.y-48,9,9);R(g,P.amber,o.x-3,o.y-45,7,5);R(g,P.dark,o.x-3,o.y-49,7,2);}
  if(done&&o.projectId==='irrigacao'&&state.irrigation.charges>0)R(g,P.water,o.x-22,o.y-45,15,3);
  if(done&&maintained(o.projectId)){R(g,P.cream,o.x+21,o.y-33,7,7);R(g,P.green,o.x+22,o.y-31,5,1);R(g,P.green,o.x+24,o.y-33,1,5);}
 }
 function footprint(o){
  if(o?.type!=='farm_life_project'||!project(o.projectId))return null;
  if(!built(o.projectId))return{x:o.x-27,y:o.y-14,w:54,h:14};
  if(o.projectId==='apiario')return{x:o.x-31,y:o.y-47,w:62,h:45};
  if(o.projectId==='irrigacao')return{x:o.x-26,y:o.y-46,w:48,h:42};
  // Toldos são atravessáveis; somente a bancada ocupa o contato no chão.
  return{x:o.x-28,y:o.y-24,w:56,h:23};
 }
 function drawMarker(o,g){
  const key=o.type==='farm_life_clue'?'clue:'+o.clueId:'station:'+o.stationId,c=cached(key,42,54,c=>{
   R(c,'rgba(30,48,36,.2)',4,47,33,4);R(c,P.dark,17,25,3,24);R(c,P.wood,18,25,1,23);
   if(o.type==='farm_life_clue'){R(c,P.dark,7,18,27,18);R(c,P.wood,8,19,25,15);R(c,P.cream,11,21,18,12);for(let n=0;n<3;n++)R(c,P.green,14+n*4,23+n%2,2,6);R(c,P.dark,13,31,14,1);R(c,P.amber,27,29,3,3);}
   else if(o.stationId==='quadro'){R(c,P.dark,2,4,37,33);R(c,P.wood,4,6,33,29);for(let n=0;n<3;n++){R(c,P.cream,7+n*10,11+n%2*6,8,13);R(c,P.clay,9+n*10,13+n%2*6,3,1);R(c,P.dark,9+n*10,17+n%2*6,4,1);}roof(c,4,0,33,P.green);}
   else{R(c,P.dark,4,14,34,15);R(c,P.cream,5,15,32,12);R(c,P.green,9,18,24,2);R(c,P.wood,9,23,17,1);}
  });g.drawImage(c,Math.round(o.x-21),Math.round(o.y-46));if(o.type==='farm_life_clue'&&state.clues[o.clueId]?.found){R(g,P.green,o.x+7,o.y-26,6,6);R(g,P.cream,o.x+8,o.y-24,4,1);}}
 function register(api){
  API=api;api.registerObjectDrawer('farm_life_project',drawProject);api.registerObjectDrawer('farm_life_clue',drawMarker);api.registerObjectDrawer('farm_life_station',drawMarker);
  for(const d of PROJECTS)api.addObjectToMain({type:'farm_life_project',projectId:d.id,x:d.x,y:d.y,_world:true,interactionHint:'trabalhar em '+d.name});
  for(const d of CLUES)api.addObjectToMain({type:'farm_life_clue',clueId:d.id,x:d.x,y:d.y,_world:true,interactionHint:'investigar '+d.title});
  for(const d of [BOARD,CORRAL,{id:'pomar',name:'Pomar',x:856,y:928}])api.addObjectToMain({type:'farm_life_station',stationId:d.id,x:d.x,y:d.y,_world:true,interactionHint:d.id==='quadro'?'ver encomendas':d.id==='curral'?'cuidar e recolher produção':'colher frutas do pomar'});
  const open=(section,id)=>{const p=player();if(!p||p.dead||read().active===false)return false;window.FarmValleyPanels?.openFarm(section,id);return true;};
  api.registerInteraction('farm_life_project',o=>open('projects',o.projectId));
  api.registerInteraction('farm_life_station',o=>open(o.stationId==='quadro'?'orders':'production',o.stationId));
  api.registerInteraction('farm_life_clue',o=>{const result=inspect(o.clueId);if(result.ok){window.FarmValleyPanels?.openFarm('clues',o.clueId);api.playSfx?.('click');}else api.showToast?.(result.message,'info',3600);return true;});
 }
 window.FarmLife=Object.freeze({init(options={}){callbacks=options;return snapshot();},snapshot,serialize,restore,reset,update,build,maintain,craft,collect,deliverOrder,inspect,consume,care,refillIrrigation,footprint,
  navigationVersion:()=>PROJECTS.reduce((mask,d,i)=>mask|(built(d.id)?1<<i:0),0),cacheInfo:()=>({sprites:sprites.size}),catalogue:()=>JSON.parse(JSON.stringify({projects:PROJECTS,recipes:RECIPES,clues:CLUES}))});
 (window.__farmBiomes=window.__farmBiomes||[]).push(register);
})();
