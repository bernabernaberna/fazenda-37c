/* O Vale dos Três Ventos — narrativa e pedidos locais, sem DOM ou backend.
   FarmStoryWorld.init({readState,reward,onChange,onDialogue}). Objetivos contam
   eventos efetivamente realizados DEPOIS do aceite. A conclusão não fecha o mundo.
   Contrato e limites: analise/HISTORIA-DO-VALE.md. */
(function(){
  'use strict';
  const VERSION=1, LIMIT=1000000, MAX_CYCLE=Number.MAX_SAFE_INTEGER;
  const IDS=['rosa','lia','tomas','ines','caio','nico'];
  const EVENTS=['plant','water','harvest','sell','skin','quiz','rest','collect','use','equip','talk','invite','visit'];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const plain=v=>!!v && typeof v==='object' && !Array.isArray(v);
  const text=(v,max=240)=>typeof v==='string'?v.slice(0,max):'';
  const num=(v,max=LIMIT)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
  const season=v=>v==='cold'?'cold':'hot';
  const characters=[
    {id:'rosa',name:'Rosa',role:'Avó e guardiã das sementes',region:'farm',tileX:16,tileY:57,
      appearance:'Avó de cabelos grisalhos, avental de sementes e expressão acolhedora.',
      routine:{day:'Organiza as sementes perto de casa.',night:'Confere seu caderno antes de recolher as caixas.'}},
    {id:'lia',name:'Lia',role:'Bióloga do vale',region:'farm',tileX:22,tileY:47,
      appearance:'Pele escura, cabelos cacheados e roupa teal.',
      routine:{day:'Observa a horta e conversa sobre a Visão da Pele.',night:'Anota perguntas para a próxima visita.'}},
    {id:'tomas',name:'Tomás',role:'Marceneiro da comunidade',region:'farm',tileX:26,tileY:58,
      appearance:'Macacão azul, postura prática e mãos de quem trabalha com madeira.',
      routine:{day:'Inspeciona as caixas e o espaço de trabalho.',night:'Guarda as ferramentas e planeja a bancada de amanhã.'}},
    {id:'ines',name:'Inês',role:'Guia da montanha',region:'mountain',tileX:30,tileY:16,
      appearance:'Casaco vinho e postura firme de guia.',
      routine:{day:'Confere a rota entre a neve e a fazenda.',night:'Espera os últimos viajantes antes de encerrar a ronda.'}},
    {id:'caio',name:'Caio',role:'Agricultor do oásis',region:'desert',tileX:39,tileY:113,
      appearance:'Lenço dourado, roupa leve de trabalho e olhar atento.',
      routine:{day:'Cuida das reservas e recebe quem chega pela areia.',night:'Conta as caixas à sombra e escuta o vento.'}},
    {id:'nico',name:'Nico',role:'Aprendiz curioso',region:'farm',tileX:23,tileY:60,
      appearance:'Roupa verde, gestos inquietos e curiosidade visível.',
      routine:{day:'Tenta descobrir o que mudou na horta.',night:'Anota ideias para testar no dia seguinte.'}}
  ];
  const byId=Object.fromEntries(characters.map(c=>[c.id,c]));
  const letter={title:'A carta de Rosa',text:'Meu bem,\n\nA Casa das Sementes está fechada há tempo demais. Ainda tenho as caixas, mas um vale não vive só de caixas. Lia guarda perguntas, Tomás guarda ferramentas, Inês conhece a montanha, Caio cuida do oásis e Nico não para de imaginar o que podemos fazer.\n\nVenha plantar alguma coisa comigo. Não precisa resolver tudo no primeiro dia. Quero ouvir de novo três ventos na mesma mesa: o da fazenda, o da montanha e o do oásis.\n\nCom carinho,\nRosa'};
  const obj=(id,label,event,goal=1,match={})=>({id,text:label,event,goal,match});
  const chapters=[
    {id:'chegada',title:'1 · Uma carta, três ventos',npcId:'rosa',coins:10,
      description:'Rosa quer reabrir a Casa das Sementes. Antes de qualquer reforma, é preciso voltar a ouvir quem vive no vale.',
      objectives:[obj('lia','Converse com Lia','talk',1,{npcId:'lia'}),obj('tomas','Converse com Tomás','talk',1,{npcId:'tomas'}),obj('nico','Converse com Nico','talk',1,{npcId:'nico'})],
      offer:'Sua carta chegou até aqui, então uma porta já se abriu. Antes de mexer nas caixas, procure Lia, Tomás e Nico. Quero reabrir esta casa com as pessoas, não só com a chave.',
      accepted:'Combinado. Lia anda perto da horta, Tomás está junto ao trabalho do celeiro e Nico costuma aparecer onde existe uma novidade. Depois volte: vou querer saber quem você encontrou.',
      ready:'Tomás já separou as ferramentas e tirou a lona da bancada. Faz tempo que eu não escutava esse barulho por aqui. Procure Nico: ele está quase explodindo de vontade de começar a horta.'},
    {id:'horta',title:'2 · A primeira colheita',npcId:'nico',coins:20,
      description:'Nico quer mostrar que a reabertura pode começar por uma horta cuidada, sem esperar por uma reforma perfeita.',
      objectives:[obj('plant','Plante 3 sementes após combinar com Nico','plant',3),obj('water','Regue 3 plantas novas','water',3),obj('harvest','Colha 2 produtos maduros','harvest',2)],
      offer:'Tenho um projeto! Na verdade, tenho sete. Este é o menor: três plantas, água na hora certa e duas colheitas. Assim a Casa das Sementes ganha algo para mostrar, além de poeira. Topa tentar comigo?',
      accepted:'Vou separar três cantinhos da horta. Você planta e rega; eu prometo não desenterrar tudo amanhã só para ver se cresceu. Quando tivermos duas colheitas, levamos as caixas para a casa.',
      ready:'Olha o peso dessa caixa! Tomás já deixou espaço na bancada da Casa das Sementes. Quero mostrar para Rosa... depois. Lia disse que queria conversar com você primeiro.'},
    {id:'agua',title:'3 · Cuidar de quem cuida',npcId:'lia',coins:20,
      description:'Lia propõe observar a Visão da Pele, fazer uma pausa protegida e responder uma questão do banco já existente.',
      objectives:[obj('skin','Abra a Visão da Pele','skin'),obj('rest','Descanse em sombra ou abrigo por uma pausa completa','rest',1,{safe:true}),obj('quiz','Responda corretamente uma questão de histologia','quiz',1,{correct:true})],
      offer:'A horta começou a funcionar. Agora quero olhar para quem trabalha nela. Abra a Visão da Pele, faça uma pausa à sombra ou em abrigo e responda uma questão. Observação, cuidado e explicação: os três juntos.',
      accepted:'Eu costumo esquecer a hora quando estou observando alguma coisa. Rosa me chama para a sombra. Hoje vamos fazer diferente: olhar com calma, descansar e depois voltar à pergunta.',
      ready:'Vou deixar água e um lugar de descanso junto à casa. As caixas não vão fugir enquanto fazemos uma pausa. Inês passou por aqui cedo: ela quer combinar com você a rota da montanha.'},
    {id:'frio',title:'4 · Um fio entre a neve e a horta',npcId:'ines',coins:25,
      description:'Inês quer preparar uma rota de troca: lã, casaco e gelo da montanha entram no mesmo planejamento.',
      objectives:[obj('wool','Colete 1 lã depois de aceitar','collect',1,{item:'wool'}),obj('coat','Vista um casaco','equip',1,{item:'coat',equipped:true}),obj('ice','Colete 1 gelo na montanha','collect',1,{item:'ice'})],
      offer:'Rosa quer os três ventos na mesma mesa. O da montanha chega com uma pergunta: como você se prepara para o frio? Colete lã, vista o casaco e conheça o ponto de gelo. A rota vale mais que a pressa.',
      accepted:'As ovelhas dão lã na estação fria. O tear e o celeiro ajudam a preparar o casaco; depois vista-o. Se você já tem um, guarde e vista de novo quando estiver pronto: queremos observar uma ação desta etapa.',
      ready:'Vou deixar uma cesta de lã junto à bancada de Tomás. Agora a montanha também tem um canto naquela casa. Falta Caio: procure a sombra das palmeiras, perto da margem do oásis.'},
    {id:'oasis',title:'5 · O caminho da água',npcId:'caio',coins:25,
      description:'Caio convida você a conhecer o ponto de coleta do oásis e usar a reserva quando a hidratação da simulação precisar.',
      objectives:[obj('oasisWater','Colete água na margem do oásis','collect',1,{item:'oasisWater'}),obj('useWater','Use a água do oásis quando precisar','use',1,{item:'oasisWater'})],
      offer:'O vale me chama de longe, mas a água não anda sozinha até a fazenda. Conheça nosso ponto de coleta e use uma reserva quando precisar. Quero que o encontro tenha planejamento, não gente chegando sem fôlego.',
      accepted:'Deixei o ponto de coleta na margem sul, onde dá para chegar sem molhar os pés. Guarde uma reserva na mochila e beba quando precisar. Quero ouvir o que achou do caminho quando voltar.',
      ready:'Vou preparar a placa da trilha do oásis e separar uma caixa para levar. Diga a Rosa que pode contar comigo. Faz tempo que não sento para ouvir uma história da montanha.'},
    {id:'encontro',title:'6 · A mesa dos três ventos',npcId:'rosa',coins:40,
      description:'Convide a comunidade, faça uma nova colheita e uma venda. A reabertura é uma conclusão da história, com a fazenda ainda aberta.',
      objectives:[...['lia','tomas','ines','caio','nico'].map(id=>obj('invite_'+id,'Convide '+byId[id].name,'invite',1,{npcId:id})),
        obj('harvest','Colha 2 produtos para preparar o encontro','harvest',2),obj('sell','Venda a produção para organizar a reabertura','sell')],
      offer:'Já temos sementes, cuidado e caminhos. Falta uma mesa. Convide Lia, Tomás, Inês, Caio e Nico; faça duas novas colheitas e uma venda para organizar nosso encontro. Quando estiver pronto, venha me buscar.',
      accepted:'Cada pessoa precisa receber o convite em conversa. Depois cuide da horta e passe pela caixa de venda. A Casa das Sementes não termina o vale: ela dá um lugar para a gente continuar.',
      ready:'Tomás apertou o último parafuso. Nico já pendurou a placa — um pouco torta, mas eu gostei. A Casa das Sementes está aberta! Quando quiser reunir o pessoal, é só me chamar. Hoje celebramos; amanhã plantamos de novo.'}
  ];
  const chats={
    rosa:{first:'Você veio! Reconheci esse jeito de olhar as caixas antes mesmo de ouvir seus passos. Guardei sua carta aqui. A Casa das Sementes pode voltar a ser ponto de encontro, mas a primeira conversa é nossa.',
      hot:'Nesta estação, escolho trabalho que deixa tempo para a sombra. Semente boa não exige que a gente esqueça de si.',cold:'O frio diminui o barulho lá fora. Aqui eu separo as caixas devagar e espero as visitas com conversa.',
      night:'Eu já ia fechar o caderno. Pode sentar um instante: histórias não precisam de luz forte para crescer.',
      topics:[['seeds','Por que guardar sementes?','Cada caixa tem uma história: quem plantou, o que funcionou e o que tentou de novo. Guardar sementes, para mim, é deixar outra tentativa possível.','Você quis saber o que há por trás das caixas de Rosa.'],
        ['return','Estou com receio de não dar conta.','Então começaremos pequeno. Não mandei a carta porque precisava de alguém perfeito; mandei porque queria construir isso com você.','Rosa lembrou que começar pequeno também é começar.'],
        ['home','Quero que o vale seja minha casa.','Casa também é o lugar em que os outros podem chegar. Vá conhecendo nossa gente; eu vou guardar essa sua vontade.','Você disse a Rosa que quer pertencer ao vale.']]},
    lia:{first:'Você deve ser a pessoa da carta. Eu sou Lia. Rosa falou das sementes; eu trouxe perguntas. Gosto de olhar duas vezes antes de dar nome ao que vejo.',
      hot:'Na fazenda quente eu observo sombra, esforço e hidratação juntos. Uma explicação precisa considerar o contexto, não só a barra de temperatura.',cold:'No frio, volte a observar o contexto. O casaco, o abrigo e o esforço continuam fazendo parte da conversa.',
      night:'Estou fechando as anotações. Uma dúvida bem feita vale ser guardada para amanhã.',
      topics:[['observe','Como posso observar melhor?','Abra a Visão da Pele e compare com o que está acontecendo no mundo. Depois procure uma questão que ajude a explicar. Ver e explicar são dois passos diferentes.','Lia sugeriu comparar a Visão da Pele com a atividade no mundo.'],
        ['mistake','Errei uma questão.','Leia os dois feedbacks, retome a ideia e tente a prática livre. Um erro pode orientar a próxima observação; não precisa virar vergonha.','Lia tratou o erro como uma pergunta para revisar.'],
        ['numbers','O relatório diz que aprendi?','Ele registra suas ações e respostas nesta partida. Para falar de aprendizagem, precisamos de uma avaliação planejada com a professora. Este registro ajuda a conversar sobre o percurso.','Lia distinguiu registro de jogo de avaliação de aprendizagem.']]},
    tomas:{first:'Tomás. Essas caixas ainda aguentam serviço; já as pessoas, a gente precisa escutar. Se Rosa está abrindo a casa, eu ajudo com o que tenho: ferramentas e alguma paciência.',
      hot:'Madeira, caixa e horta podem esperar minha pausa. Pressa dá trabalho dobrado.',cold:'Estou conferindo as caixas perto do celeiro. No frio eu planejo o trajeto antes de sair com as ferramentas.',
      night:'As ferramentas já estão guardadas. Se quiser, ainda posso explicar por que medi esta bancada três vezes.',
      topics:[['bench','O que falta na Casa das Sementes?','Uma bancada útil e gente usando a bancada. Primeiro organizamos a produção e a venda; o resto da reforma ganha sentido quando o lugar já tem vida.','Tomás quer uma bancada usada, não uma reforma só de aparência.'],
        ['rush','Podemos fazer tudo hoje?','Podemos fazer o começo hoje. Para o restante, prefiro um combinado cumprido a dez promessas correndo.','Você combinou com Tomás começar pelo que pode cumprir.'],
        ['help','Quero ajudar com o trabalho.','Ótimo. Tenho uma encomenda para esta estação. Me pergunte sobre ela e combinamos o serviço. Só não me venha com pressa: bancada torta dura muito mais que a economia de cinco minutos.','Tomás convidou você a combinar um serviço com calma.']]},
    ines:{first:'Inês. Se veio pela carta de Rosa, chegou pelo motivo certo. Conheço o caminho, mas ninguém conhece todas as condições de uma vez. Vamos preparar a próxima ida.',
      hot:'Mesmo quando a fazenda está quente, aqui na montanha o vento pede outra preparação. Olhe o lugar em que está.',cold:'É dia de rota curta e equipamento conferido. Se precisar, o abrigo e a fogueira continuam no caminho.',
      night:'Estou esperando os últimos passos da trilha. Amanhã há tempo de ir de novo; hoje também vale voltar.',
      topics:[['route','Como você escolhe uma rota?','Pelo próximo ponto de apoio. Um caminho bonito sem pausa prevista pode virar uma viagem ruim. No jogo, acompanhe os sinais da HUD e use os abrigos.', 'Inês ensinou a pensar no próximo ponto de apoio.'],
        ['coat','Por que a lã entra na história?','Porque conecta o trabalho da fazenda ao preparo para a montanha. Colete, prepare o casaco e observe o que vestir muda na simulação. O banco de questões explica a conservação de calor.', 'Inês ligou lã, casaco e observação da simulação.'],
        ['turn','Voltar significa falhar?','Voltar com cuidado mantém o caminho disponível amanhã. Eu não conto coragem pelo tempo que alguém insiste em ficar mal.','Inês respeita a decisão de voltar e se preparar.']]},
    caio:{first:'Caio. Se encontrou areia nas botas, encontrou nosso caminho. Rosa escreveu que queria escutar o oásis na mesma mesa. Eu topo, desde que a conversa também tenha espaço para água e planejamento.',
      hot:'Faço o trabalho em etapas e observo minhas reservas. O calor não fica menor só porque a gente tem pressa.',cold:'A estação da fazenda mudou; a areia daqui continua tendo seu contexto. Eu confiro o oásis antes de cada trajeto.',
      night:'À noite eu conto as caixas e escuto a areia. É uma hora boa para combinar o trajeto de amanhã.',
      topics:[['water','Onde posso coletar água?','Na margem sul do oásis há um ponto de coleta em chão caminhável. Use E e confira a mochila. A reserva ajuda quando a hidratação da simulação baixar.','Caio mostrou o ponto de água na margem sul do oásis.'],
        ['trade','O que você levará ao encontro?','Histórias de trajetos que deram certo e de trajetos que mudamos. Quero ouvir as colheitas de Nico e os planos de Rosa. Uma troca não precisa ter um vencedor.', 'Caio quer trocar experiências com a comunidade.'],
        ['stay','Posso ficar por aqui um pouco?','Claro. Repare no contraste entre a areia e o oásis, cuide de suas reservas e volte quando quiser. O vale tem mais de um ritmo.','Caio convidou você a conhecer o ritmo do oásis.']]},
    nico:{first:'Você chegou! Eu sou Nico. Tenho uma ideia para a horta, uma para a placa, outra para a mesa... Rosa pediu para eu começar por uma só. Ainda estou escolhendo.',
      hot:'Minha ideia da manhã era colher depressa. A planta discordou. Agora estou observando quando ela realmente fica pronta.',cold:'Hoje anotei o que mudou na estação. Quero testar de novo, sem fingir que o resultado de ontem vale para tudo.',
      night:'Eu prometi guardar o caderno, mas pensei em outra pergunta. Só mais uma página, vai?',
      topics:[['idea','Qual ideia escolhemos primeiro?','A horta! Uma semente, água e tempo. Depois comparamos o que aconteceu. A placa enorme pode esperar até existir algo para apontar.', 'Nico escolheu a horta antes da placa enorme.'],
        ['lost','Minha tentativa não funcionou.','A minha também não, ontem. Podemos olhar o que faltou e fazer uma tentativa nova. Eu anoto o que fizemos, não uma história em que acertamos tudo.', 'Você e Nico combinaram olhar o que faltou antes de tentar novamente.'],
        ['partner','Quero ser seu parceiro nessa ideia.','Fechado! Você cuida de uma parte, eu guardo nossas perguntas. Quando terminar uma etapa, volte para contar. É muito mais interessante do que imaginar sozinho.', 'Nico passou a chamar você de parceiro de experiências.']]}
  };
  const jobDefs={
    rosa:[['Caixas com futuro','Colha novos produtos para Rosa separar as caixas da próxima estação.',[obj('harvest','Colha 2 produtos após aceitar','harvest',2)]],
      ['Sementes para outra tentativa','Abra três novos plantios para a próxima experiência de Rosa.',[obj('plant','Plante 3 sementes após aceitar','plant',3)]]],
    lia:[['Observar e explicar','Compare uma observação na Visão da Pele com uma questão do banco.',[obj('skin','Abra a Visão da Pele','skin'),obj('quiz','Acerte uma questão nova desta encomenda','quiz',1,{correct:true})]],
      ['Uma pausa observada','Faça uma pausa protegida e retome a observação da pele.',[obj('rest','Descanse em sombra ou abrigo','rest',1,{safe:true}),obj('skin','Abra a Visão da Pele','skin')]]],
    tomas:[['Caixas em movimento','Faça uma colheita nova e leve a produção à caixa de venda.',[obj('harvest','Colha 1 produto','harvest'),obj('sell','Venda produção','sell')]],
      ['Reserva de oficina','Reúna lenha para planejar o trabalho da estação.',[obj('wood','Colete 2 lenhas','collect',2,{item:'wood'})]]],
    ines:[['Uma rota com apoio','Colete gelo e faça uma pausa protegida na viagem.',[obj('ice','Colete 1 gelo','collect',1,{item:'ice'}),obj('rest','Descanse em sombra ou abrigo','rest',1,{safe:true})]],
      ['Fio preparado','Reúna uma nova lã e vista seu casaco para conferir o preparo.',[obj('wool','Colete 1 lã','collect',1,{item:'wool'}),obj('coat','Vista o casaco','equip',1,{item:'coat',equipped:true})]]],
    caio:[['Uma reserva para o caminho','Reúna água do oásis e use a reserva quando precisar.',[obj('water','Colete água do oásis','collect',1,{item:'oasisWater'}),obj('use','Use água do oásis','use',1,{item:'oasisWater'})]],
      ['Água na horta','Conheça uma reserva do oásis e cuide de duas plantas da fazenda.',[obj('oasis','Colete água do oásis','collect',1,{item:'oasisWater'}),obj('water','Regue 2 plantas novas','water',2)]]],
    nico:[['Experiência pequena','Plante e regue duas novas plantas para comparar o crescimento.',[obj('plant','Plante 2 sementes','plant',2),obj('water','Regue 2 plantas novas','water',2)]],
      ['Antes da placa','Faça duas colheitas para Nico ter algo real para mostrar.',[obj('harvest','Colha 2 produtos maduros','harvest',2)]]]
  };
  let adapter={}, initialized=false, dialogue=null, state;
  function ctx(value){
    const s=plain(value)?value:(typeof adapter.readState==='function'?adapter.readState():{});
    return {season:season(s?.season),timeOfDay:Number.isFinite(s?.timeOfDay)?Math.max(0,Math.min(24,s.timeOfDay)):12,
      region:['farm','mountain','desert'].includes(s?.region)?s.region:'farm',scene:text(s?.scene,24)||'main',
      playerName:text(s?.playerName,40)||'viajante',activities:plain(s?.activities)?s.activities:{}};
  }
  function recordFor(def){return {status:'offered',counts:Object.fromEntries(def.objectives.map(o=>[o.id,0])),acceptedAt:null,paid:false};}
  function jobDefinition(npcId,which=state.season,cycleId=state.cycleId){
    const index=(Math.floor((cycleId-1)/2)+(which==='cold'?1:0))%jobDefs[npcId].length;
    const [title,description,objectives]=jobDefs[npcId][index];
    return {id:'job:'+cycleId+':'+npcId,npcId,title,description,objectives,coins:8,variant:index};
  }
  function fresh(context){return {version:VERSION,chapterIndex:0,main:chapters.map(recordFor),season:context.season,cycleId:1,
    jobs:{},friendships:Object.fromEntries(IDS.map(id=>[id,0])),memories:[],flags:{},
    sequence:0,events:Object.fromEntries(EVENTS.map(e=>[e,0])),coinsEarned:0,chaptersCompleted:0,jobsCompleted:0,
    lastRegion:context.region,recentEventIds:[],log:[]};}
  function emit(name,payload){if(typeof adapter[name]==='function')try{adapter[name](payload);}catch(e){console.warn('[história] '+name,e);}}
  function friendship(id,points){state.friendships[id]=Math.min(100,state.friendships[id]+points);}
  function remember(id,npcId,message){
    if(state.memories.some(m=>m.id===id)) return;
    state.memories.push({id,npcId,text:message,cycleId:state.cycleId});state.memories=state.memories.slice(-36);
  }
  function log(kind,id){state.log.push({kind,id,cycleId:state.cycleId,sequence:state.sequence});state.log=state.log.slice(-48);}
  function changed(){emit('onChange',snapshot());}
  function show(npcId,message,kind='response',choices=[],title){
    const c=byId[npcId];dialogue={npcId,speaker:c?c.name:'Rosa',role:c?c.role:'A carta que trouxe você ao vale',
      title:title||'Conversa com '+(c?c.name:'Rosa'),text:message,kind,
      choices:choices.map(c=>({id:c.id,label:c.label})),canAdvance:kind==='response'};
    emit('onDialogue',currentDialogue());return currentDialogue();
  }
  function currentDialogue(){return dialogue?clone(dialogue):null;}
  function close(){dialogue=null;emit('onDialogue',null);return null;}
  function chapter(){return chapters[state.chapterIndex]||null;}
  function objectives(def,data){return def.objectives.map(o=>({id:o.id,text:o.text,n:num(data?.counts?.[o.id],o.goal),goal:o.goal}));}
  function complete(def,data){return def.objectives.every(o=>num(data.counts[o.id],o.goal)>=o.goal);}
  function objectiveLine(list){return list.map(o=>o.text+' ('+o.n+'/'+o.goal+')').join(' · ');}
  // Consequências derivadas dos capítulos pagos: carregar não constrói nem paga de novo.
  function worldState(){
    const n=state.chapterIndex,open=n===chapters.length;
    return {seedHouse:{stage:open?'open':n>=2?'supplied':n>=1?'preparing':'closed',
      level:open?3:n>=2?2:n>=1?1:0,open,workbench:n>=1,seedCrates:n>=2,
      shadeAndWater:n>=3,woolAndMountainRoute:n>=4,oasisRoute:n>=5,bunting:open},
      gathering:open&&state.flags.communityGathering===true,
      communityName:'Casa das Sementes',chaptersCompleted:n};
  }
  function snapshot(){
    const def=chapter(), data=state.main[state.chapterIndex];
    const goalList=def?objectives(def,data):[];
    const chapterView=def?{id:def.id,index:state.chapterIndex,title:def.title,description:def.description,
      targetNpc:def.npcId,status:data.status==='offered'?'available':data.status,completed:false,objectives:goalList,objective:objectiveLine(goalList),
      progress:goalList.reduce((n,o)=>n+o.n,0),goal:goalList.reduce((n,o)=>n+o.goal,0)}:
      {id:'aberta',index:6,title:'A Casa das Sementes está aberta',description:'A comunidade se reuniu. A fazenda continua com plantios, explorações e pedidos renováveis.',
        objective:'Converse com a comunidade e escolha seus próximos projetos.',targetNpc:'rosa',status:'completed',completed:true,objectives:[],progress:6,goal:6};
    const quests=IDS.map(npcId=>{
      const d=jobDefinition(npcId),q=state.jobs[npcId]||recordFor(d),list=objectives(d,q);
      return {id:d.id,title:d.title,description:d.description,objective:objectiveLine(list),npcId,cycleId:state.cycleId,
        status:q.status==='offered'?'available':q.status,completed:q.status==='completed',accepted:q.acceptedAt!==null,objectives:list,
        progress:list.reduce((n,o)=>n+o.n,0),goal:list.reduce((n,o)=>n+o.goal,0),coins:d.coins};
    });
    return {version:VERSION,chapter:chapterView,quests,friendships:clone(state.friendships),memories:clone(state.memories),
      season:state.season,cycleId:state.cycleId,completed:state.chapterIndex===6,letter:clone(letter),
      coinsEarned:state.coinsEarned,jobsCompleted:state.jobsCompleted,chaptersCompleted:state.chaptersCompleted,world:worldState()};
  }
  function grant(def,data,kind){
    if(data.paid || data.status!=='ready') return false;
    // Marca antes do callback: reentrância e repetição de escolha não repagam.
    data.paid=true;data.status='completed';
    state.coinsEarned=Math.min(LIMIT,state.coinsEarned+def.coins);
    friendship(def.npcId,kind==='chapter'?5:4);
    if(kind==='chapter'){
      state.chapterIndex++;state.chaptersCompleted=state.chapterIndex;
      remember('chapter:'+def.id,def.npcId,def.title+' — etapa concluída com '+byId[def.npcId].name+'.');
      if(state.chapterIndex===6)state.flags.casaAberta=true;
    }else state.jobsCompleted=Math.min(LIMIT,state.jobsCompleted+1);
    log('reward',kind==='chapter'?'chapter:'+def.id:def.id);
    emit('reward',{id:kind==='chapter'?'story:'+def.id:def.id,coins:def.coins,kind,
      label:def.title,cycleId:state.cycleId,npcId:def.npcId});changed();return true;
  }
  function matches(o,event,payload){return o.event===event && Object.entries(o.match).every(([k,v])=>payload[k]===v);}
  function progress(def,data,event,payload,amount){
    if(data.status!=='active' || data.acceptedAt===null || state.sequence<=data.acceptedAt) return false;
    let dirty=false;
    for(const o of def.objectives){if(matches(o,event,payload)){
      const before=data.counts[o.id];data.counts[o.id]=Math.min(o.goal,before+amount);dirty=dirty||before!==data.counts[o.id];
    }}
    if(dirty && complete(def,data)){data.status='ready';log('ready',def.id);}
    return dirty;
  }
  function newSeason(which,cycleHint){
    if(!['hot','cold'].includes(which))return false;
    const target=season(which),hint=num(cycleHint,MAX_CYCLE);
    if(target===state.season && (!hint || hint<=state.cycleId))return false;
    state.cycleId=Math.min(MAX_CYCLE,Math.max(state.cycleId+1,hint));state.season=target;
    // Pedidos da estação anterior expiram; nunca reaparecem para pagamento.
    state.jobs={};state.flags=Object.fromEntries(Object.entries(state.flags).filter(([k])=>!k.startsWith('greet:')));
    log('season',target);changed();return true;
  }
  function record(event,payload={}){
    if(!plain(payload))return false;
    if(event==='season')return newSeason(payload.season,payload.cycleId);
    if(!EVENTS.includes(event))return false;
    const uid=text(payload.eventId,100);
    if(uid && state.recentEventIds.includes(uid))return false;
    if(uid){state.recentEventIds.push(uid);state.recentEventIds=state.recentEventIds.slice(-64);}
    const amount=payload.amount===undefined?1:num(payload.amount,25);if(!amount)return false;
    // Rebase da sequência conserva a ordem pós-aceite em partidas muito longas.
    if(state.sequence>=LIMIT){
      state.sequence=0;
      for(const data of [...state.main,...Object.values(state.jobs)])if(data.acceptedAt!==null)data.acceptedAt=0;
    }
    state.sequence++;state.events[event]=Math.min(LIMIT,state.events[event]+amount);
    let dirty=false;const c=chapter();if(c)dirty=progress(c,state.main[state.chapterIndex],event,payload,amount);
    for(const npcId of IDS){const job=state.jobs[npcId];if(job)dirty=progress(jobDefinition(npcId),job,event,payload,amount)||dirty;}
    if(dirty)changed();return dirty;
  }
  function menu(npcId,preamble){
    const c=byId[npcId],s=ctx(),ch=chapter(),q=state.jobs[npcId],choices=[];
    let message=preamble||((s.timeOfDay>=19 || s.timeOfDay<6)?chats[npcId].night:chats[npcId][s.season]);
    if(!preamble && state.chapterIndex===6){
      const after={rosa:'Você está ouvindo? Esse barulho de caixa abrindo e gente chegando era o que faltava nesta casa. Sua cadeira fica aqui perto da minha.',
        lia:'Separei uma ponta da mesa para desenhos e amostras. Nico já ocupou metade com perguntas. Acho que combinamos bem.',
        tomas:'A bancada ficou firme. Fiz um teste: apoiei o cotovelo, empurrei com o joelho e deixei Nico subir para pendurar a placa. Passou nos três.',
        ines:'Deixei uma cesta de lã na Casa das Sementes. É bom chegar da trilha e reconhecer as vozes antes de ver a porta.',
        caio:'Na primeira visita eu trouxe uma caixa. Agora sempre volto levando outra. A troca finalmente tem caminho de ida e de volta.',
        nico:'A placa está pronta! Errei uma letra e Tomás me emprestou uma lixa. Ficou uma marca pequena. Rosa pediu para deixar: agora a placa também tem história.'};
      message=after[npcId];
      if((s.timeOfDay>=19||s.timeOfDay<6))message+='\n\n'+chats[npcId].night;
    }
    const activity=text(s.activities[npcId],180);
    if(!preamble && activity)message+='\n\n'+activity;
    if(!preamble && state.friendships[npcId]>=12){
      const familiar={rosa:'Já não preciso explicar onde guardo as caixas: você está ajudando a dar novas histórias a elas.',
        lia:'Nossas conversas já têm perguntas que vale retomar. Gosto de como você volta para observar outra vez.',
        tomas:'Com você eu já posso partir de um combinado anterior. Isso economiza mais trabalho que qualquer ferramenta.',
        ines:'Já conhecemos um pedaço do caminho juntos. Ainda conferimos o próximo passo, mesmo entre conhecidos.',
        caio:'Quem volta para conversar deixa de ser só alguém de passagem. Há um lugar para você nesta troca.',
        nico:'Parceiro de experiências! Tenho outra pergunta, mas desta vez comecei olhando o que já fizemos.'};
      message+='\n\n'+familiar[npcId];
    }
    if(ch && ch.npcId===npcId){
      const main=state.main[state.chapterIndex];
      if(main.status==='offered'){message+='\n\n'+ch.offer;choices.push({id:'main:accept',label:'Aceitar: '+ch.title.slice(4)});}
      else if(main.status==='ready'){message+='\n\nTudo combinado está pronto. Vamos concluir esta etapa?';choices.push({id:'main:claim',label:'Concluir a etapa e contar o resultado'});}
      else{message+='\n\nNosso combinado: '+snapshot().chapter.objective;choices.push({id:'main:hint',label:'Relembrar o combinado'});}
    }
    if(state.chapterIndex===6 && npcId==='rosa')choices.push(state.flags.communityGathering?
      {id:'community:release',label:'Deixar o pessoal voltar às suas tarefas'}:
      {id:'community:gather',label:'Vamos reunir o pessoal na Casa das Sementes?'});
    if(state.chapterIndex===5 && state.main[5].status==='active' && npcId!=='rosa'
      && state.main[5].counts['invite_'+npcId]===0)choices.push({id:'invite',label:'Convidar para a reabertura'});
    if(!q || q.status==='offered')choices.push({id:'job:offer',label:'Há um pedido para esta estação?'});
    else if(q.status==='ready')choices.push({id:'job:claim',label:'Entregar o pedido da estação'});
    else if(q.status==='active')choices.push({id:'job:hint',label:'Relembrar seu pedido'});
    else message+='\n\nSeu pedido desta estação já foi entregue. Na próxima estação combinamos outro.';
    for(const [id,label]of chats[npcId].topics)choices.push({id:'chat:'+id,label});
    choices.push({id:'memory',label:'Você lembra do que já fizemos?'},{id:'close',label:'Até depois'});
    return show(npcId,message,'menu',choices);
  }
  function interact(npcId){
    if(npcId==='letter')return show('rosa',letter.text,'letter',[{id:'close',label:'Guardar a carta'}],letter.title);
    if(!byId[npcId])return null;
    const first=!state.flags['met:'+npcId];
    if(first){state.flags['met:'+npcId]=true;friendship(npcId,2);remember('met:'+npcId,npcId,'Você conheceu '+byId[npcId].name+' no Vale dos Três Ventos.');changed();}
    record('talk',{npcId});
    return menu(npcId,first?chats[npcId].first:undefined);
  }
  function choose(choiceId){
    if(!dialogue || !dialogue.choices.some(c=>c.id===choiceId))return currentDialogue();
    const npcId=dialogue.npcId;if(choiceId==='close')return close();
    if(choiceId==='back')return menu(npcId);
    if(npcId==='rosa' && state.chapterIndex===6 && ['community:gather','community:release'].includes(choiceId)){
      const gathering=choiceId==='community:gather';state.flags.communityGathering=gathering;
      if(gathering)remember('community:first-meeting','rosa','Você chamou os seis moradores para um encontro na Casa das Sementes.');
      changed();return show(npcId,gathering?
        'Vou deixar o aviso no quadro. O pessoal vem caminhando: Inês desce da montanha, Caio atravessa a trilha do oásis. Enquanto chegam, me ajude a escolher um lugar à mesa.':
        'Combinado. Deixamos as cadeiras prontas para a próxima vez. Cada um tem seu caminho de volta, e a casa continua aberta.');
    }
    const ch=chapter(),main=state.main[state.chapterIndex];
    if(choiceId==='main:accept' && ch?.npcId===npcId && main.status==='offered'){
      main.status='active';main.acceptedAt=state.sequence;log('accept','chapter:'+ch.id);changed();
      return show(npcId,ch.accepted);
    }
    if(choiceId==='main:claim' && ch?.npcId===npcId && grant(ch,main,'chapter'))return show(npcId,ch.ready);
    if(choiceId==='main:hint' && ch)return show(npcId,ch.accepted+'\n\n'+snapshot().chapter.objective);
    const def=jobDefinition(npcId);
    if(choiceId==='job:offer')return show(npcId,def.description+'\n\n'+objectiveLine(objectives(def,null)),
      'offer',[{id:'job:accept',label:'Aceitar este pedido'},{id:'back',label:'Prefiro conversar agora'}],'Pedido de '+byId[npcId].name);
    if(choiceId==='job:accept' && (!state.jobs[npcId] || state.jobs[npcId].status==='offered')){
      const q=recordFor(def);q.status='active';q.acceptedAt=state.sequence;state.jobs[npcId]=q;log('accept',def.id);changed();
      const agreed={rosa:'Vou separar uma caixa com seu nome. Quando terminar, venha me contar como foi. Deixo as oito moedas guardadas aqui.',
        lia:'Deixei uma página em branco no caderno. Volte depois da observação: quero ouvir o que você percebeu.',
        tomas:'Fechado. Já vou limpar um canto da bancada. Quando acabar, me procure por aqui e acertamos a entrega.',
        ines:'Combinado. Vou conferir a trilha enquanto você se prepara. A gente se encontra no caminho.',
        caio:'Ótimo. Vou organizar minhas caixas enquanto você cuida dessa parte. Depois passe aqui para conversarmos.',
        nico:'Fechado, parceiro! Vou anotar a ideia antes que eu tenha outras três. Quando terminar, quero saber de tudo.'};
      return show(npcId,agreed[npcId]);
    }
    if(choiceId==='job:hint')return show(npcId,def.description+'\n\n'+objectiveLine(objectives(def,state.jobs[npcId])));
    if(choiceId==='job:claim' && state.jobs[npcId] && grant(def,state.jobs[npcId],'job')){
      const thanks={rosa:'Aqui está sua parte. Essa caixa ganhou mais uma história. Passe depois para me contar a próxima.',
        lia:'Deixe eu anotar isso... Pronto. Uma observação sua ao lado da minha. Obrigada por voltar para conversar.',
        tomas:'Bom trabalho. Gosto de quando alguém combina uma coisa e aparece de novo com ela feita. Aqui estão suas moedas.',
        ines:'Chegou bem. É disso que eu gosto numa viagem: poder planejar a próxima. Aqui está o combinado.',
        caio:'Essa troca fez o caminho valer a pena. Aqui está sua parte; vou organizar o que você trouxe.',
        nico:'Deu certo! Ou melhor: fizemos, e agora sabemos mais do que antes. Preciso de outra página no caderno.'};
      return show(npcId,thanks[npcId]);
    }
    if(choiceId==='invite'){
      record('invite',{npcId});remember('invite:'+npcId,npcId,byId[npcId].name+' aceitou o convite para a Casa das Sementes.');friendship(npcId,3);changed();
      const replies={lia:'Eu vou. Levarei minhas perguntas e ouvirei as experiências de vocês; a mesa também pode ser um lugar de investigar.',
        tomas:'Pode contar comigo. Ferramentas guardadas, caixa organizada e cadeira firme. Quero ver gente usando esse lugar.',
        ines:'Aceito. Vou preparar o caminho de volta e chegar com tempo para ouvir quem veio da areia.',
        caio:'Eu vou. Deixe um espaço para as histórias do oásis; quero escutar as da montanha também.',
        nico:'Sim! Posso levar meu caderno? A placa? Melhor o caderno. Desta vez tenho experiências para contar!'};
      return show(npcId,replies[npcId]);
    }
    if(choiceId==='memory'){
      const memories=state.memories.filter(m=>m.npcId===npcId).slice(-3);
      return show(npcId,memories.length?'Lembro, sim.\n\n'+memories.map(m=>'• '+m.text).join('\n'):'Ainda temos muita coisa para fazer juntos. A primeira conversa já é um começo.');
    }
    if(choiceId.startsWith('chat:')){
      const topic=chats[npcId].topics.find(t=>t[0]===choiceId.slice(5));if(!topic)return currentDialogue();
      const key='topic:'+npcId+':'+topic[0],again=state.flags[key];
      if(!again){state.flags[key]=true;friendship(npcId,2);remember(key,npcId,topic[3]);changed();}
      return show(npcId,(again?'Lembro de termos falado disso. ':'')+topic[2],'response',[{id:'back',label:'Continuar a conversa'},{id:'close',label:'Até depois'}]);
    }
    return currentDialogue();
  }
  function advance(){return dialogue?.canAdvance?menu(dialogue.npcId):currentDialogue();}
  function update(dt,value){
    if(!Number.isFinite(dt) || dt<0)return;
    const s=ctx(value);newSeason(s.season);
    if(s.scene==='main' && s.region!==state.lastRegion){state.lastRegion=s.region;record('visit',{region:s.region});}
  }
  function sanitizeRecord(value,def,seq){
    const r=recordFor(def);if(!plain(value))return r;
    const statuses=['offered','active','ready','completed'];r.status=statuses.includes(value.status)?value.status:'offered';
    for(const o of def.objectives)r.counts[o.id]=num(value.counts?.[o.id],o.goal);
    if(r.status!=='completed' && (!Number.isFinite(value.acceptedAt) || value.acceptedAt<0))r.status='offered';
    r.acceptedAt=r.status==='offered'?null:Math.min(seq,num(value.acceptedAt));
    r.paid=r.status==='completed' || value.paid===true;
    if(r.paid){r.status='completed';for(const o of def.objectives)r.counts[o.id]=o.goal;}
    else if(r.status==='offered')for(const o of def.objectives)r.counts[o.id]=0;
    else if(complete(def,r))r.status='ready';
    else if(r.status==='ready')r.status='active';
    return r;
  }
  function restore(saved,value){
    dialogue=null;const s=ctx(value);state=fresh(s);
    if(!plain(saved) || saved.version!==VERSION){emit('onDialogue',null);changed();return false;}
    state.sequence=num(saved.sequence);state.cycleId=Math.max(1,num(saved.cycleId,MAX_CYCLE));state.season=season(saved.season);
    state.main=chapters.map((def,i)=>sanitizeRecord(saved.main?.[i],def,state.sequence));
    while(state.chapterIndex<6 && state.main[state.chapterIndex].status==='completed')state.chapterIndex++;
    // Só o capítulo atual pode estar ativo; elimina saltos e estados futuros forjados.
    for(let i=state.chapterIndex+1;i<6;i++)state.main[i]=recordFor(chapters[i]);
    for(const npcId of IDS){
      state.friendships[npcId]=num(saved.friendships?.[npcId],100);
      if(plain(saved.jobs?.[npcId]))state.jobs[npcId]=sanitizeRecord(saved.jobs[npcId],jobDefinition(npcId,state.season,state.cycleId),state.sequence);
    }
    const validFlags=new Set(['casaAberta','communityGathering',...IDS.map(id=>'met:'+id),...IDS.map(id=>'greet:'+id),
      ...IDS.flatMap(id=>chats[id].topics.map(t=>'topic:'+id+':'+t[0]))]);
    if(plain(saved.flags))for(const key of validFlags)if(saved.flags[key]===true)state.flags[key]=true;
    state.flags.casaAberta=state.chapterIndex===6;if(!state.flags.casaAberta)delete state.flags.communityGathering;
    const seen=new Set();
    for(const m of (Array.isArray(saved.memories)?saved.memories:[]).slice(-72)){
      if(!plain(m) || !IDS.includes(m.npcId) || !text(m.id,100) || seen.has(text(m.id,100)))continue;
      seen.add(text(m.id,100));state.memories.push({id:text(m.id,100),npcId:m.npcId,text:text(m.text,300),cycleId:Math.max(1,num(m.cycleId))});
    }
    state.memories=state.memories.slice(-36);
    for(const e of EVENTS)state.events[e]=num(saved.events?.[e]);
    state.coinsEarned=num(saved.coinsEarned);state.jobsCompleted=num(saved.jobsCompleted);state.chaptersCompleted=state.chapterIndex;
    state.recentEventIds=[...new Set((Array.isArray(saved.recentEventIds)?saved.recentEventIds:[]).map(v=>text(v,100)).filter(Boolean))].slice(-64);
    for(const entry of (Array.isArray(saved.log)?saved.log:[]).slice(-48))if(plain(entry))state.log.push({kind:text(entry.kind,24),id:text(entry.id,100),cycleId:Math.max(1,num(entry.cycleId)),sequence:num(entry.sequence)});
    state.lastRegion=s.region;
    // Carregar em estação diferente renova só os pedidos; nunca concede recompensa.
    if(s.season!==state.season)newSeason(s.season);emit('onDialogue',null);changed();return true;
  }
  state=fresh(ctx({season:'hot',region:'farm'}));
  window.FarmStoryWorld={
    characters:clone(characters),chapters:clone(chapters),
    init(api={}){adapter=plain(api)?api:{};if(!initialized){state=fresh(ctx());initialized=true;}return snapshot();},
    interact,currentDialogue,choose,advance,close,isOpen:()=>dialogue!==null,update,record,snapshot,worldState,
    serialize:()=>clone(state),restore,
    reset(value){state=fresh(ctx(value));close();changed();return snapshot();}
  };
})();
