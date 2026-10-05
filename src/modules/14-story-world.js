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
  const letter={title:'A carta de Rosa',text:'Meu bem,\n\nEncontrei uma semente no bolso do avental que você usava aqui. Ela ainda estava embrulhada naquele papel com três riscos. Você dizia que eram os três ventos do vale.\n\nA Casa das Sementes fechou depois que uma ventania soltou a placa e apagou nossas marcas da trilha. Consertamos o caminho, mas a mesa continuou vazia. Cada um ficou esperando uma ocasião melhor. Eu também.\n\nLia guarda perguntas, Tomás guarda ferramentas, Inês conhece a montanha, Caio cuida do oásis e Nico desenhou uma placa maior do que ele. Nenhum deles tem sozinho a história inteira.\n\nVenha plantar alguma coisa comigo. Não precisa resolver tudo no primeiro dia. Desta vez, não vamos esperar que a casa esteja perfeita para convidar as pessoas.\n\nGuardei uma cadeira.\nRosa'};
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
  // A saga pode recuperar a Casa antes destes seis projetos didáticos. A
  // apresentação acompanha esse mundo; IDs, objetivos, aceite e moedas continuam
  // no estado legado, sem converter trabalho da saga em conclusão retroativa.
  const ongoingProjects=[
    {title:'1 · Vozes para a próxima rodada',description:'Rosa propõe ouvir Lia, Tomás e Nico antes de combinar novos trabalhos na Casa das Sementes.',
      offer:'Já fizemos a Casa ganhar movimento. Quero cuidar da próxima rodada com as pessoas que a usam: converse com Lia, Tomás e Nico depois deste combinado. O trabalho continua mesmo quando uma etapa termina.',
      accepted:'Combinado. Lia anda perto da horta, Tomás confere o trabalho do celeiro e Nico tem ideias para a próxima experiência. Converse com os três nesta rodada e depois volte para me contar o que ouviram.',
      ready:'Você trouxe as três vozes para este novo combinado. Tomás continua cuidando da bancada; Nico quer preparar outro canteiro para a Casa. Procure-o quando quiser começar essa experiência.'},
    {title:'2 · Um novo canteiro para comparar',description:'Nico propõe uma nova experiência de plantio, rega e colheita para continuar abastecendo e aprendendo com a Casa.',
      offer:'A Casa já tem histórias para mostrar. Quero acrescentar uma experiência nova: três plantas depois do nosso aceite, as primeiras regas e duas colheitas maduras. O canteiro anterior conta como lembrança; este serve para comparar o que fazemos agora.',
      accepted:'Vou anotar esta rodada numa página nova. Você planta e rega três plantas; eu observo sem puxar a raiz. Quando tivermos duas colheitas, levamos os resultados à bancada e comparamos com as tentativas anteriores.',
      ready:'Mais uma caixa da horta e uma página nova no caderno. Não é a primeira tentativa do vale; é a que acabamos de cuidar juntos. Lia quer observar também como ficou quem fez o trabalho. Procure-a para a próxima rodada.'},
    {title:'3 · O cuidado faz parte do trabalho',description:'Lia combina uma nova observação da pele, uma pausa protegida e uma resposta de histologia, mantendo o cuidado na rotina da Casa.',
      offer:'A Casa tem trabalho para amanhã também. Quero incluir quem trabalha no mesmo planejamento: abra a Visão da Pele, faça uma pausa protegida e responda corretamente uma questão nesta etapa. Uma observação nova pode mudar o que pensamos sobre uma rotina antiga.',
      accepted:'Vamos separar esta observação das anteriores. Abra a Visão da Pele, faça uma nova pausa à sombra ou em abrigo e retome uma questão com atenção ao feedback. O cuidado também precisa continuar depois da festa.',
      ready:'Esta rodada registrou observação, pausa e explicação. O espaço de descanso da Casa continua à disposição; não precisa esperar outro projeto para usá-lo. Inês quer combinar um novo preparo para a rota da montanha.'},
    {title:'4 · Preparar a próxima ida à montanha',description:'Inês propõe renovar o preparo da rota: uma coleta de lã, vestir o casaco nesta etapa e uma nova coleta de gelo.',
      offer:'A montanha continua ligada à Casa, mas cada viagem pede preparo próprio. Vamos fazer uma coleta de lã, vestir o casaco e buscar gelo depois deste aceite. Conhecer o caminho não substitui conferir as condições de hoje.',
      accepted:'As ovelhas fornecem lã na estação fria. O tear e o celeiro ajudam a preparar o casaco. Se já possui um, guarde e vista novamente nesta rodada. Depois visite o ponto de gelo: queremos observar ações novas, sem apagar a experiência anterior.',
      ready:'A rota da montanha ganhou mais uma viagem preparada. A cesta de lã continua tendo lugar na bancada; não estamos trazendo a montanha à Casa pela primeira vez. Caio quer combinar a próxima reserva do oásis com você.'},
    {title:'5 · Reservas para uma nova travessia',description:'Caio combina uma nova coleta e uso de água do oásis, para manter as trocas e os trajetos do vale.',
      offer:'A troca entre o oásis e a Casa continua. Quero conferir uma nova reserva com você: colete água depois de aceitar e use-a quando a hidratação da simulação precisar. Ter feito uma viagem boa não prepara sozinho a próxima.',
      accepted:'O ponto de coleta continua na margem sul. Faça uma nova coleta nesta etapa e guarde a reserva. Beba quando precisar; depois volte para contar como foi cuidar do trajeto desta vez.',
      ready:'A reserva foi coletada e usada no momento necessário. Podemos seguir mantendo o caminho de ida e volta. Rosa está organizando outra roda na Casa; diga que vou levar minha parte e deixar tempo para ouvir.'},
    {title:'6 · Outra roda à mesa dos três ventos',description:'Convide os cinco moradores para um novo encontro, colha dois produtos e faça uma venda para apoiar a vida contínua da Casa.',
      offer:'A Casa já tem uma mesa; o que não podemos deixar de preparar são os próximos encontros. Convide Lia, Tomás, Inês, Caio e Nico nesta rodada, faça duas novas colheitas e uma venda para organizar a nossa roda. Depois venha me buscar.',
      accepted:'Cada convite desta rodada precisa de uma conversa. Depois cuide de duas novas colheitas e passe pela caixa de venda. Não estamos começando a Casa de novo: estamos mantendo lugar para as pessoas voltarem.',
      ready:'Mais uma roda preparada! A Casa continua recebendo o vale, com sua placa, suas caixas e suas histórias. Quando quiser chamar o pessoal novamente, fale comigo. O encontro de hoje não apaga o anterior; deixa o de amanhã possível.'}
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
  // As lembranças são opcionais: ouvir não exige entregar itens, não cobra moedas
  // e não fecha nenhum capítulo. Escolhas mudam a conversa, sem resposta "certa".
  const lore={
    rosa:[
      {id:'rosa:caixa',title:'A caixa sem etiqueta',chapter:0,bond:0,
        text:'Esta caixa ficou sem etiqueta de propósito. Antes da ventania, deixávamos aqui sementes de quem ainda não tinha escolhido um lugar para plantar. Você guardou uma e desenhou três riscos no papel.\n\nQuando a casa fechou, eu etiquetei tudo para não perder nada. Só esta escapou. Às vezes acho que foi ela que me lembrou de escrever sua carta.',
        choices:[{label:'Vamos deixar espaço para quem ainda chegar.',reply:'Então a caixa continua sem nome. Não por esquecimento: por convite. Vou deixá-la na frente das outras.',memory:'Você e Rosa reservaram uma caixa para quem ainda chegar.',echo:'Deixei aquela caixa sem nome na frente. Já reparou como um espaço vazio pode parecer um convite?'},
          {label:'Quero começar pela nossa semente.',reply:'Esta eu conheço pelo embrulho. Podemos começar com ela e continuar com as que vierem depois. Uma lembrança também pode criar raiz nova.',memory:'Você quis começar com a semente guardada por Rosa.',echo:'Separei o embrulho dos três riscos. A nossa primeira lembrança ainda cabe na palma da mão.'}]},
      {id:'rosa:chave',title:'Quem guardou a chave',chapter:2,bond:8,
        text:'Eu disse a todo mundo que guardaria a chave até terminarmos os reparos. Os reparos terminaram. Depois quis organizar as caixas. Depois esperei uma colheita melhor.\n\nA chave pesava quase nada, mas eu fui fazendo dela uma desculpa enorme. Não foi a ventania que manteve esta casa fechada por tanto tempo. Foi a vergonha de chamar os outros e descobrir que já não queriam voltar.',
        choices:[{label:'Podemos convidar sem prometer perfeição.',reply:'Posso dizer: há uma mesa, falta um pouco de tudo, venha assim mesmo. É um convite bem mais honesto do que o que eu ensaiava.',memory:'Rosa decidiu convidar as pessoas antes de ter tudo pronto.',echo:'Ensaiando o convite de novo: há uma mesa, falta um pouco de tudo. Ainda gosto dessa versão.'},
          {label:'Eu ficaria aqui enquanto você chama o pessoal.',reply:'Quero essa companhia. Não para você falar por mim; só para eu lembrar que a primeira cadeira já está ocupada.',memory:'Você ofereceu companhia enquanto Rosa recupera a coragem de convidar.',echo:'Quando vejo sua cadeira, fica mais fácil pensar no próximo convite.'}]},
      {id:'rosa:mesa',title:'O lugar que não estava no desenho',chapter:6,bond:16,
        text:'O desenho antigo da casa tinha cinco cadeiras. Quando você era pequeno, arrastava um caixote para a mesa e dizia que faltava uma. Tomás fez a sexta.\n\nAgora Nico quer contar as cadeiras antes de cada encontro. Eu pedi que contasse também quem está chegando pelo caminho. O lugar de alguém às vezes aparece antes no desejo do que no desenho.',
        choices:[{label:'A próxima cadeira fica para uma nova história.',reply:'Vou pedir a Tomás uma cadeira simples. A pessoa que sentar nela é que vai torná-la diferente das outras.',memory:'Você e Rosa deixaram um lugar para uma nova história.',echo:'Ainda temos lugar para uma nova história. As cadeiras não encerram a contagem.'},
          {label:'Quero ouvir o que mudou para cada um.',reply:'É assim que uma casa continua aberta: ouvindo mais de uma versão da mesma mesa. Procure os outros depois do encontro.',memory:'Você decidiu ouvir as versões dos moradores sobre a reabertura.',echo:'Depois me conte o que os outros enxergam nesta mesa. Minha versão já conhecemos.'}]}
    ],
    lia:[
      {id:'lia:caderno',title:'A página que ficou em branco',chapter:0,bond:0,
        text:'No meu primeiro caderno do vale, pulei uma página. Eu queria desenhar o que acontecia dentro da pele, mas só tinha observado o lado de fora. Achei que uma folha vazia parecia falta de trabalho.\n\nRosa escreveu na margem: "Aqui cabe a próxima pergunta." Guardei. Hoje separo o que observei, o que estou tentando explicar e o que ainda preciso conferir.',
        choices:[{label:'Vamos guardar também as perguntas sem resposta.',reply:'Vou dar a elas uma página própria. Uma dúvida bem escrita pode orientar a observação de amanhã.',memory:'Você e Lia reservaram uma página para perguntas abertas.',echo:'Nossa página de perguntas abertas já tem uma dobra no canto. Continua sendo a mais consultada.'},
          {label:'Quero comparar uma observação com outra.',reply:'Boa ideia. Primeiro anotamos em que contexto cada uma aconteceu. Se os contextos mudaram, essa diferença faz parte da comparação.',memory:'Você quis comparar observações com Lia sem esquecer o contexto.',echo:'Separei duas anotações para comparar. Desta vez comecei pelo contexto, como combinamos.'}]},
      {id:'lia:janela',title:'A janela de três desenhos',chapter:3,bond:8,
        text:'Eu ia ficar no vale só uma estação. Desenhei a montanha pela janela, depois a horta, depois a areia. Cada desenho parecia de um lugar diferente.\n\nCaio reconheceu a janela nos três. Disse que eu tinha encontrado um bom ponto para escutar o vale inteiro. Foi a primeira vez que pensei em ficar. Não por já saber tudo daqui, mas porque minhas perguntas finalmente tinham com quem conversar.',
        choices:[{label:'Os três desenhos podem ir para a Casa das Sementes.',reply:'Posso levar cópias. Vou deixar um espaço ao lado para quem enxergar algo que eu não vi.',memory:'Lia levará seus três desenhos para a Casa das Sementes.',echo:'Os três desenhos estão separados. Nico já pediu um quarto: a vista debaixo da mesa.'},
          {label:'O que você ainda quer descobrir por aqui?',reply:'Como as pessoas contam o mesmo caminho de maneiras tão diferentes. Sua próxima volta pode render uma conversa melhor que qualquer desenho meu.',memory:'Lia quer ouvir diferentes versões do mesmo caminho.',echo:'Ainda estou juntando versões do caminho. A sua também faz parte do caderno.'}]},
      {id:'lia:rasura',title:'A rasura que ficou',chapter:6,bond:16,
        text:'Nico pediu para copiar meu caderno para a reabertura. Eu comecei a limpar as rasuras. Ele perguntou: "Se apagar a pergunta antiga, como vou saber por que você mudou de ideia?"\n\nDeixei algumas. Na Casa das Sementes, os desenhos terão legenda e contexto; os rabiscos vão mostrar o percurso. Estudar também é poder explicar uma revisão.',
        choices:[{label:'Vamos mostrar o que nos fez mudar de ideia.',reply:'Vou escrever isso na legenda. O desenho final conta o que penso agora; a rasura conta como cheguei até aqui.',memory:'Você e Lia decidiram mostrar como uma explicação foi revista.',echo:'A legenda das rasuras ficou pronta. É uma parte pequena da folha e grande da conversa.'},
          {label:'Posso acrescentar minhas próprias perguntas?',reply:'Pode. Use outra cor para sabermos de quem veio cada pergunta. Este caderno não precisa ter uma só voz.',memory:'Lia abriu espaço no caderno para suas perguntas.',echo:'Guardei outra cor para suas perguntas. O caderno já não parece tão solitário.'}]}
    ],
    tomas:[
      {id:'tomas:marca',title:'O risco na bancada',chapter:0,bond:0,
        text:'Vê esse risco? Não é rachadura. É a medida da antiga placa. Depois da ventania, fiz uma nova exatamente igual. Guardei antes de pendurar.\n\nRosa ainda esperava as caixas, eu ainda esperava o encaixe perfeito. A placa ficou em cima da bancada tanto tempo que o sol marcou a madeira em volta. Uma peça pronta também pode ficar esperando demais.',
        choices:[{label:'A marca pode ficar à vista.',reply:'Pode. Não enfraquece a tábua. E me poupa de fingir que a oficina sempre teve tudo no prazo.',memory:'Tomás decidiu deixar a marca da placa visível na bancada.',echo:'O risco continua na bancada. Ficou até mais fácil medir a próxima placa.'},
          {label:'Vamos pendurar algo simples para começar.',reply:'Duas letras já dizem "entre" se a porta estiver aberta. Vou conferir os ganchos. O acabamento fazemos com o lugar funcionando.',memory:'Você e Tomás preferiram uma placa simples para começar.',echo:'Ganchos conferidos. A placa simples aguentou mais conversas do que eu tinha previsto.'}]},
      {id:'tomas:cadeira',title:'A cadeira que balançava',chapter:2,bond:8,
        text:'Minha primeira cadeira balançava. Rosa pôs um papel dobrado debaixo do pé e continuou a conversa. Eu queria que todo mundo levantasse para eu consertar.\n\nEla disse que podia esperar até o fim da história de Inês. Consertei depois. Foi a primeira vez que entendi a diferença entre uma coisa precisar de reparo e tudo precisar parar por causa dela.',
        choices:[{label:'O encontro pode começar com o que temos.',reply:'Pode. Eu confiro se está firme. Depois deixo uma lista curta para os próximos reparos. Curta mesmo.',memory:'Tomás fará os reparos em etapas, com o encontro já funcionando.',echo:'Minha lista de reparos tem três linhas. Se aparecer a quarta, decido o que pode esperar.'},
          {label:'Quero ajudar a conferir as cadeiras.',reply:'Empurre de leve, olhe os encaixes e me chame se alguma balançar. Gosto mais de duas pessoas conferindo do que de uma pessoa prometendo.',memory:'Você ofereceu ajuda para conferir as cadeiras com Tomás.',echo:'Conferi as cadeiras outra vez. Ainda tenho espaço para mais um par de olhos.'}]},
      {id:'tomas:encaixe',title:'Uma peça de cada lugar',chapter:6,bond:16,
        text:'A mesa nova tem três tipos de madeira. Uma peça veio das caixas de Rosa, outra do antigo abrigo de Inês, outra chegou na carga de Caio. Nenhuma tinha o tamanho certo sozinha.\n\nSe eu escondesse todas as emendas, ela pareceria ter vindo de um só lugar. Deixei duas aparecendo. Nico achou que era um mapa. Não vou discutir com ele.',
        choices:[{label:'As emendas merecem uma história.',reply:'Então vou anotar de onde vieram. Só não vou escrever "obra de Tomás" por cima de seis pessoas carregando tábua.',memory:'Tomás registrará as origens das peças da mesa.',echo:'Anotei a origem das tábuas. A letra de Nico é maior, mas os nomes couberam.'},
          {label:'Que peça podemos construir depois?',reply:'Uma prateleira baixa para as sementes. Quem é menor precisa alcançar também. Primeiro eu meço; depois vocês me dizem se ficou útil.',memory:'Tomás imaginou uma prateleira que todos possam alcançar.',echo:'Estou medindo aquela prateleira baixa. Se Nico alcança, já estamos no caminho certo.'}]}
    ],
    ines:[
      {id:'ines:fita',title:'A fita da primeira curva',chapter:0,bond:0,
        text:'Eu marcava esta curva com uma fita vermelha. A ventania levou a fita e cobriu duas pegadas. A trilha continuou aqui; a certeza de quem vinha é que sumiu.\n\nDepois eu comecei a andar sozinha para conferir tudo. Ficou tão natural que parei de perguntar quem queria vir junto. Um caminho pode estar inteiro e ainda assim deixar de ligar as pessoas.',
        choices:[{label:'Vamos marcar os pontos de apoio juntos.',reply:'Primeiro a curva, depois o abrigo. Uma marca precisa ser compreendida por quem vai usá-la, não só por quem a desenhou.',memory:'Você e Inês combinaram conferir os pontos de apoio juntos.',echo:'Ainda começo pela curva e pelo abrigo. Agora lembro de perguntar se a marca faz sentido para quem chega.'},
          {label:'Quero conhecer o caminho no meu ritmo.',reply:'Eu espero no próximo apoio. Se mudar de ideia, voltamos. A trilha não exige que duas pessoas deem passos iguais.',memory:'Inês respeitou seu ritmo para conhecer a montanha.',echo:'O próximo apoio continua lá. Seu ritmo não precisa combinar com o meu relógio.'}]},
      {id:'ines:sino',title:'O sino que não era um aviso',chapter:4,bond:8,
        text:'Tomás colocou um sino na Casa das Sementes. Eu pensei que seria para chamar ajuda da trilha. Rosa riu: era para avisar que havia conversa na mesa.\n\nNa última reunião antes da ventania, eu fui a última a chegar. Escutei o sino da curva e acelerei. Quando entrei, ainda estavam guardando uma cadeira. Ninguém tinha começado a contar sem mim.',
        choices:[{label:'Desta vez também guardamos sua cadeira.',reply:'Vou levar uma história que ainda não contei inteira. Saber que há uma cadeira muda bastante o caminho de volta.',memory:'Você prometeu guardar uma cadeira para Inês.',echo:'Trouxe a história da curva. A parte mais bonita continua sendo a cadeira que ficou esperando.'},
          {label:'O sino pode chamar sem apressar ninguém.',reply:'Gosto disso. Um som dizendo "há lugar" em vez de "corra". Vou contar a Tomás que entendi a diferença.',memory:'Inês imaginou o sino como convite, sem pressa.',echo:'Quando ouço o sino, penso no convite. Ficou mais fácil voltar sem transformar tudo em corrida.'}]},
      {id:'ines:mapa',title:'O mapa que ganhou margens',chapter:6,bond:16,
        text:'Meu mapa antigo mostrava as linhas entre os lugares. Seu caminho, o de Caio e o de Nico encheram as margens: uma pausa aqui, uma conversa ali, uma volta que valeu a pena.\n\nAinda preciso das linhas. Mas deixei de cortar as anotações para o mapa parecer limpo. O vale não ficou menor porque passei a caber menos certezas numa folha.',
        choices:[{label:'Quero acrescentar os meus lugares de pausa.',reply:'Marque com uma pequena roda. Depois comparamos os lugares e o que mudou em cada viagem. Não precisa escolher um apoio para sempre.',memory:'Inês deixou espaço no mapa para seus lugares de pausa.',echo:'Reservei rodas pequenas nas margens. Seu próximo lugar de pausa pode entrar no mapa.'},
          {label:'Podemos mostrar o mapa para os outros.',reply:'Deixo uma cópia na casa. Peço que anotem a data das mudanças. Um mapa também precisa poder ser revisto.',memory:'Inês fará uma cópia do mapa para a comunidade.',echo:'A cópia comunitária já tem uma anotação de Caio. Ele desenha palmeiras melhor que eu.'}]}
    ],
    caio:[
      {id:'caio:recipiente',title:'O recipiente de três marcas',chapter:0,bond:0,
        text:'Este recipiente tem três marcas no fundo. A menor é minha. As outras são de Rosa e Inês. Fizemos para reconhecer as reservas quando as caixas se encontravam na mesma mesa.\n\nDepois que a casa fechou, ainda levávamos coisas de um lugar a outro. Só parávamos menos para conversar. As cargas continuaram circulando; as histórias vieram ficando pelo caminho.',
        choices:[{label:'Quero levar uma história junto das caixas.',reply:'Então me conte o que viu na próxima travessia. Deixo um espaço entre os recipientes: histórias não gostam de ser apertadas.',memory:'Você e Caio combinaram trocar histórias além de cargas.',echo:'Deixei um espaço entre as caixas para a história da sua próxima travessia.'},
          {label:'Podemos deixar as marcas mais visíveis.',reply:'Posso contornar as três com tinta. Assim ninguém acha que esta reserva apareceu sozinha. Um recipiente também tem seus caminhos.',memory:'Caio destacará as três marcas no recipiente comunitário.',echo:'As três marcas ficaram visíveis. Agora até Nico pergunta de onde veio cada recipiente.'}]},
      {id:'caio:espera',title:'A entrega que virou visita',chapter:5,bond:8,
        text:'Uma vez a roda da minha carga soltou perto da fazenda. Fui pedir ferramenta a Tomás e fiquei para ouvir Lia. Quando consertamos, já era hora de voltar.\n\nEu disse que tinha perdido a tarde. No caminho, percebi que lembrava de três histórias e mal lembrava da roda. Desde então tento deixar um pouco de tempo sem encomenda. Ainda estou aprendendo.',
        choices:[{label:'Sua próxima visita pode ser só uma visita.',reply:'Posso chegar com uma caixa menor. Ou sem caixa. Rosa vai estranhar primeiro e depois arranjar o que me oferecer.',memory:'Caio decidiu fazer uma visita sem depender de uma entrega.',echo:'Hoje separei tempo sem encomenda. Ainda estranho, mas já não parece tempo perdido.'},
          {label:'Vamos levar as conversas para a trilha também.',reply:'A conversa muda quando a paisagem anda junto. Podemos combinar uma pausa e ouvir o que cada um chama de perto.',memory:'Você e Caio querem conversar também durante as travessias.',echo:'Tenho uma história para a próxima pausa da trilha. Prometo não transformar tudo em entrega.'}]},
      {id:'caio:troca',title:'O que voltou na caixa vazia',chapter:6,bond:16,
        text:'Na reabertura, levei recipientes e voltei com uma caixa quase vazia. Quase: Nico tinha deixado um desenho da mesa no fundo. Rosa pôs uma etiqueta: "para continuar".\n\nA caixa continua leve. Levo para lembrar que nem tudo o que trazemos de uma troca dá para contar na venda. Algumas coisas só aparecem quando a gente abre de novo.',
        choices:[{label:'A próxima troca pode trazer outra lembrança.',reply:'Quero ver o que vem. Vou guardar o desenho sem dobrar por cima das pernas da mesa. Nico trabalhou muito nessas pernas.',memory:'Caio reservou a caixa para novas lembranças do vale.',echo:'A caixa das lembranças continua leve. Já não volto pensando que está vazia.'},
          {label:'Vamos começar um caderno de travessias.',reply:'Uma página por viagem, sem obrigação de grande aventura. Às vezes basta lembrar por que resolvemos parar.',memory:'Você e Caio imaginaram um caderno de travessias.',echo:'Primeira página do caderno de travessias: parei, ouvi, voltei. Parece curta e já conta bastante.'}]}
    ],
    nico:[
      {id:'nico:placa',title:'Sete desenhos para uma placa',chapter:0,bond:0,
        text:'Eu fiz sete placas. A primeira tinha uma árvore. A segunda, três ventos. Na quinta, desenhei um vento, mas Rosa disse que parecia um macarrão fugindo.\n\nTomás perguntou para quem era a placa. Eu disse "para todo mundo". Ele respondeu: "Então começa com uma palavra que quem chega consiga ler." Foi assim que cheguei a "entre". Ainda cabe uma árvore pequena!',
        choices:[{label:'Gostei do convite simples.',reply:'Então "entre" fica grande. O macarrão... quer dizer, o vento fica no canto. Assim cada desenho tem seu trabalho.',memory:'Você ajudou Nico a escolher uma placa com um convite simples.',echo:'A palavra "entre" continua maior que o desenho. O vento não gostou, mas ficou no canto.'},
          {label:'Quero ver também os desenhos que não usamos.',reply:'Todos? Até o macarrão? Fechado! Vou guardar numa pasta chamada "caminhos até a placa". Uma pasta já é meu oitavo projeto.',memory:'Nico guardará também as tentativas que levaram à placa.',echo:'Guardei os sete desenhos. A pasta das tentativas acabou virando a coisa que mais mostro.'}]},
      {id:'nico:semente',title:'A semente que ele puxou',chapter:2,bond:8,
        text:'Posso contar uma coisa sem você rir primeiro? Desenterrei uma semente para ver se ela já tinha acordado. Depois outra, para comparar. No fim eu tinha duas sementes e nenhuma comparação boa.\n\nRosa não me deu outra caixa imediatamente. Sentou comigo para recontar os passos. Foi chato nos primeiros cinco segundos. Depois descobri onde minha pergunta tinha virado pressa.',
        choices:[{label:'Vamos observar sem interromper tudo.',reply:'Combinado! Eu desenho, você observa, a planta cresce. Três atividades que finalmente podem acontecer ao mesmo tempo.',memory:'Você e Nico decidiram observar sem interromper o crescimento.',echo:'Hoje observei sem puxar. O desenho ficou maior, a planta ficou no lugar. Progresso dos dois lados!'},
          {label:'Podemos anotar também o que não funcionou.',reply:'Vou escrever a tentativa com todos os passos. Sem transformar em uma história em que eu já sabia desde o começo.',memory:'Nico registrará as tentativas que não funcionaram.',echo:'Escrevi a tentativa toda. A parte da pressa não ficou bonita, mas ficou útil.'}]},
      {id:'nico:amanha',title:'A página de amanhã',chapter:6,bond:16,
        text:'Quando terminamos a placa, pensei que o meu caderno acabaria também. Só que Tomás falou da prateleira, Inês abriu o mapa e Caio perguntou o que a gente faria na próxima estação.\n\nDeixei uma página vazia. Desta vez não é porque não sei desenhar a coisa pronta. É porque a coisa ainda pode ser mais de uma. Você quer começar pela horta ou pela exploração?',
        choices:[{label:'Vamos continuar as experiências da horta.',reply:'Nova página: horta! Quero comparar tentativas, fazer perguntas e lembrar de esperar. Essa última vai ter letras bem grandes.',memory:'Você e Nico escolheram continuar as experiências da horta.',echo:'A página da horta está aberta. Escrevi "esperar" grande o bastante para Rosa ler de longe.'},
          {label:'Quero descobrir novos detalhes pelo vale.',reply:'Exploração! Vou marcar o que já vimos e deixar espaço para os detalhes pequenos. Não precisa encontrar um lugar novo para enxergar uma coisa nova.',memory:'Você e Nico decidiram procurar novos detalhes no vale.',echo:'Reservei páginas para os detalhes pequenos do vale. Se eu fizer outra seta, você me avisa?'}]}
    ]
  };
  const loreById=Object.fromEntries(IDS.flatMap(id=>lore[id].map(s=>[s.id,{...s,npcId:id}])));
  const knownLore=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(loreById,id);
  const greetings={
    rosa:['A cadeira perto das caixas está livre. Chegue um pouco mais.','Ouvi seus passos antes de ver o chapéu. Quer uma conversa curta ou uma história comprida?','Estava guardando esta caixa, mas ela pode esperar enquanto você me conta do caminho.'],
    lia:['O que mudou desde a nossa última conversa? Pode começar por uma coisa pequena.','Acabei de fechar uma anotação e abrir outra pergunta. Você chegou na hora certa.','Eu estava comparando dois desenhos. Sua volta pode acrescentar um terceiro ponto de vista.'],
    tomas:['Pode chegar. Guardei o serrote; agora consigo escutar.','Bancada firme, ferramenta no lugar. O que temos para combinar?','Esta peça não precisa de minha atenção o tempo inteiro. Fale.'],
    ines:['Chegou. Antes do próximo caminho, podemos parar aqui um instante.','Estou conferindo a curva. Qual parte da sua viagem ficou na memória?','Há tempo para escutar. A próxima ronda começa depois desta conversa.'],
    caio:['Uma visita! Vou afastar a caixa para caber também uma conversa.','A trilha trouxe você de novo. Hoje chegou com alguma história nas botas?','Reservas conferidas. Podemos contar outras coisas além de recipientes.'],
    nico:['Você voltou! Tenho uma pergunta. Hoje escolhi só uma, olha o avanço!','Guardei o desenho para ouvir você primeiro. Mas posso mostrar depois?','Parceiro! Separei uma página. Pode ser para a sua história ou para uma ideia nossa.']
  };
  const actionReactions={
    rosa:{plant:'Vi que você voltou a plantar. Já estou pensando em como guardar as histórias dessas sementes.',harvest:'A colheita chegou! Quero saber qual planta fez você esperar mais.',rest:'Fez uma pausa? Que bom. Também deixei uma caixa para depois; não fugiu.',sell:'Ouvi a tampa da caixa de venda. Um trabalho encerrado deixa espaço para o próximo.'},
    lia:{skin:'Você abriu a Visão da Pele. Que detalhe quis observar desta vez?',quiz:'Você voltou depois de uma questão. Quero ouvir o que o feedback fez você revisar.',rest:'Uma pausa protegida entrou no seu percurso. Podemos comparar o contexto antes e depois.',use:'Você usou uma reserva. Essa ação também faz parte do contexto que observamos.'},
    tomas:{harvest:'Vi caixa chegando da horta. Vou deixar a bancada livre para ela.',sell:'A caixa de venda trabalhou. Agora podemos planejar a próxima entrega sem empilhar promessas.',collect:'Trouxe material do caminho? Tenho um canto da bancada para conferir sem pressa.'},
    ines:{collect:'Você voltou com uma reserva da viagem. O caminho também serve para aprender onde parar.',equip:'Conferiu o casaco. Gosto de ver preparo antes do próximo trecho.',rest:'Uma pausa faz parte da rota. No meu mapa ela ganha uma marca, não uma rasura.',visit:'Você atravessou uma região. O que mudou entre um trecho e outro?'},
    caio:{collect:'Você conheceu um ponto de reserva. Quero ouvir como foi chegar até ele.',use:'Usou uma reserva e seguiu o caminho. A próxima visita pode trazer uma observação diferente.',water:'A água chegou às plantas. É bom ver os dois lados da travessia se encontrando.',visit:'Tem poeira de outro trecho nas botas. O caminho de hoje pareceu com o de ontem?'},
    nico:{plant:'Você plantou! Vou desenhar o cantinho sem puxar a semente para conferir.',water:'Vi a rega. Já anotei esse passo antes de inventar o próximo.',harvest:'Tem colheita nova! Agora minha placa aponta para algo que aconteceu de verdade.',quiz:'Respondeu uma questão? Quero saber qual pergunta ficou depois da resposta.'}
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
  const noticeLines={};
  function ctx(value){
    const s=plain(value)?value:(typeof adapter.readState==='function'?adapter.readState():{});
    return {season:season(s?.season),timeOfDay:Number.isFinite(s?.timeOfDay)?Math.max(0,Math.min(24,s.timeOfDay)):12,
      region:['farm','mountain','desert'].includes(s?.region)?s.region:'farm',scene:text(s?.scene,24)||'main',
      playerName:text(s?.playerName,40)||'viajante',activities:plain(s?.activities)?s.activities:{},
      energy:Number.isFinite(s?.energy)?Math.max(0,Math.min(100,s.energy)):100,resting:s?.resting===true};
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
    lastRegion:context.region,recentEventIds:[],log:[],discoveries:[],decisions:{},
    visits:Object.fromEntries(IDS.map(id=>[id,0])),recentActions:[],spokenActions:Object.fromEntries(IDS.map(id=>[id,0]))};}
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
    // Respostas com escolhas conservam avanço por API; a UI exibe só as respostas
    // explícitas para não duplicar "continuar" ao lado de "continuar a conversa".
    emit('onDialogue',currentDialogue());return currentDialogue();
  }
  function currentDialogue(){return dialogue?clone(dialogue):null;}
  function close(){dialogue=null;window.FarmValleySaga?.close?.({silent:true});emit('onDialogue',null);return null;}
  // O adaptador da saga mantém a mesma UI e barreira de leitura. O estado e o
  // save da nova investigação permanecem separados dos seis capítulos legados.
  function presentSaga(value){dialogue=plain(value)?clone(value):null;emit('onDialogue',currentDialogue());return currentDialogue();}
  function sagaStage(){return num(window.FarmValleySaga?.worldState?.()?.stage,8);}
  function chapter(){const def=chapters[state.chapterIndex];if(!def)return null;const stage=sagaStage();if(!stage)return def;
    const context=ongoingProjects[state.chapterIndex],objectives=def.objectives.map(o=>o.id==='sell'?{...o,text:'Venda a produção para apoiar o novo encontro'}:o);
    if(state.chapterIndex===0&&stage>=7)return{...def,...context,objectives,
      description:'A Casa está aberta. Rosa propõe ouvir Lia, Tomás e Nico para preparar novos projetos, sem repetir a sua recuperação.',
      offer:'A Casa está aberta, e nossa próxima rodada merece tanto cuidado quanto o caminho até aqui. Converse com Lia, Tomás e Nico depois deste combinado. Quero ouvir o que cada um deseja fazer agora, com a bancada e a mesa já em uso.'};
    return{...def,...context,objectives};
  }
  function letterView(){return sagaStage()?{title:'A carta de Rosa · antes do retorno',text:'Esta é a carta que Rosa enviou antes do seu retorno. Ela permanece guardada como memória daquele começo.\n\n'+letter.text}:letter;}
  function currentTopic(npcId,topic){if(sagaStage()<7)return topic;
    if(npcId==='tomas'&&topic[0]==='bench')return['bench','Como manter a Casa em atividade?',
      'A bancada e a mesa já estão em uso. Agora quero manter os encaixes firmes, cumprir os prazos e deixar espaço para quem aprende. Produção, venda e manutenção ajudam a Casa a continuar útil depois da investigação.',
      'Tomás lembrou que manter a Casa em atividade também exige cuidado, prazos e espaço para aprender.'];
    if(npcId==='nico'&&topic[0]==='idea')return['idea','Qual experiência fazemos agora?',
      'Quero um canteiro novo para comparar com o anterior. A placa já aponta para uma Casa viva; meu caderno ainda tem perguntas. Podemos escolher uma pequena e acompanhar os passos sem apagar o que já descobrimos.',
      'Nico escolheu uma nova experiência para continuar aprendendo com a Casa em atividade.'];
    return topic;
  }
  function objectives(def,data){return def.objectives.map(o=>({id:o.id,text:o.text,n:num(data?.counts?.[o.id],o.goal),goal:o.goal}));}
  function complete(def,data){return def.objectives.every(o=>num(data.counts[o.id],o.goal)>=o.goal);}
  function objectiveLine(list){return list.map(o=>o.text+' ('+o.n+'/'+o.goal+')').join(' · ');}
  function unlocked(scene){return scene.chapter===6?state.chapterIndex===6:state.chapterIndex>=scene.chapter||state.friendships[scene.npcId]>=scene.bond;}
  function discoveryViews(){return state.discoveries.map(id=>{
    const scene=loreById[id],choice=scene.choices[state.decisions[id]];
    return {id,npcId:scene.npcId,title:scene.title,text:scene.text,response:choice?.memory||'',answered:!!choice};
  });}
  function nextLore(npcId){return lore[npcId].find(scene=>!state.discoveries.includes(scene.id)&&unlocked({...scene,npcId}));}
  function decisionEcho(npcId){
    for(const scene of [...lore[npcId]].reverse())if(Number.isInteger(state.decisions[scene.id]))return scene.choices[state.decisions[scene.id]].echo;
    return '';
  }
  function noticeActivity(npcId){
    const last=state.recentActions.slice().reverse().find(a=>a.sequence>state.spokenActions[npcId]&&actionReactions[npcId][a.event]);
    noticeLines[npcId]=last?actionReactions[npcId][last.event]:'';
    if(last){state.spokenActions[npcId]=last.sequence;return true;}return false;
  }
  // Consequências derivadas dos capítulos pagos: carregar não constrói nem paga de novo.
  function worldState(){
    const n=state.chapterIndex,legacyOpen=n===chapters.length,saga=num(window.FarmValleySaga?.worldState?.()?.stage,8),open=legacyOpen||saga>=7;
    // Arte compartilhada, progresso separado: as novas entregas deixam marcas
    // visíveis na Casa sem concluir ou remunerar capítulos didáticos legados.
    const legacyLevel=legacyOpen?3:n>=2?2:n>=1?1:0,sagaLevel=saga>=7?3:saga>=2?2:saga>=1?1:0,level=Math.max(legacyLevel,sagaLevel);
    return {seedHouse:{stage:open?'open':level>=2?'supplied':level>=1?'preparing':'closed',
      level,open,workbench:n>=1||saga>=1,seedCrates:n>=2||saga>=2,
      shadeAndWater:n>=3||saga>=3,woolAndMountainRoute:n>=4||saga>=4,oasisRoute:n>=5||saga>=5,bunting:legacyOpen||saga>=8},
      gathering:legacyOpen&&state.flags.communityGathering===true,
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
      season:state.season,cycleId:state.cycleId,completed:state.chapterIndex===6,letter:clone(letterView()),
      coinsEarned:state.coinsEarned,jobsCompleted:state.jobsCompleted,chaptersCompleted:state.chaptersCompleted,world:worldState(),
      discoveries:discoveryViews(),discoveryTotal:Object.keys(loreById).length,
      relationships:IDS.map(id=>({npcId:id,label:state.friendships[id]>=16?'Confiança':state.friendships[id]>=8?'Parceria':state.flags['met:'+id]?'Conhecidos':'Por conhecer',
        discoveries:state.discoveries.filter(k=>loreById[k].npcId===id).length,total:lore[id].length}))};
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
      state.recentActions=[];for(const id of IDS)state.spokenActions[id]=0;
    }
    state.sequence++;state.events[event]=Math.min(LIMIT,state.events[event]+amount);
    const reactive=IDS.some(id=>actionReactions[id][event]);
    if(reactive){state.recentActions.push({event,sequence:state.sequence,item:text(payload.item,32),correct:payload.correct===true});state.recentActions=state.recentActions.slice(-6);}
    let dirty=false;const c=chapter();if(c)dirty=progress(c,state.main[state.chapterIndex],event,payload,amount);
    for(const npcId of IDS){const job=state.jobs[npcId];if(job)dirty=progress(jobDefinition(npcId),job,event,payload,amount)||dirty;}
    if(dirty||reactive)changed();return dirty;
  }
  function menu(npcId,preamble){
    const c=byId[npcId],s=ctx(),ch=chapter(),q=state.jobs[npcId],choices=[];
    const night=s.timeOfDay>=19||s.timeOfDay<6,visit=state.visits[npcId]||1;
    let message=preamble||(night?chats[npcId].night:visit%3===1?chats[npcId][s.season]:greetings[npcId][(visit-1)%greetings[npcId].length]);
    if(!preamble && state.chapterIndex===6){
      const after={rosa:'Você está ouvindo? Esse barulho de caixa abrindo e gente chegando era o que faltava nesta casa. Sua cadeira fica aqui perto da minha.',
        lia:'Separei uma ponta da mesa para desenhos e amostras. Nico já ocupou metade com perguntas. Acho que combinamos bem.',
        tomas:'A bancada ficou firme. Fiz um teste: apoiei o cotovelo, empurrei com o joelho e deixei Nico subir para pendurar a placa. Passou nos três.',
        ines:'Deixei uma cesta de lã na Casa das Sementes. É bom chegar da trilha e reconhecer as vozes antes de ver a porta.',
        caio:'Na primeira visita eu trouxe uma caixa. Agora sempre volto levando outra. A troca finalmente tem caminho de ida e de volta.',
        nico:'A placa está pronta! Errei uma letra e Tomás me emprestou uma lixa. Ficou uma marca pequena. Rosa pediu para deixar: agora a placa também tem história.'};
      message=visit%3===1?after[npcId]:greetings[npcId][(visit-1)%greetings[npcId].length];
      if((s.timeOfDay>=19||s.timeOfDay<6))message+='\n\n'+chats[npcId].night;
    }
    if(!preamble&&window.FarmValleySaga?.greeting)message=window.FarmValleySaga.greeting(npcId);
    const activity=text(s.activities[npcId],180);
    if(!preamble){
      const echo=decisionEcho(npcId),notice=noticeLines[npcId];
      const extra=notice||((visit%3===0&&echo)?echo:activity);
      if(extra)message+='\n\n'+extra;
      if(s.energy<25&&npcId==='rosa')message+='\n\nMinha cadeira está aqui. Se precisar de uma pausa, não tem caixa que valha sua pressa.';
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
      && state.main[5].counts['invite_'+npcId]===0)choices.push({id:'invite',label:sagaStage()?'Convidar para o próximo encontro':'Convidar para a reabertura'});
    if(!q || q.status==='offered')choices.push({id:'job:offer',label:'Há um pedido para esta estação?'});
    else if(q.status==='ready')choices.push({id:'job:claim',label:'Entregar o pedido da estação'});
    else if(q.status==='active')choices.push({id:'job:hint',label:'Relembrar seu pedido'});
    else message+='\n\nSeu pedido desta estação já foi entregue. Na próxima estação combinamos outro.';
    if(window.FarmValleySaga)choices.push({id:'saga:menu',label:window.FarmValleySaga.menuLabel(npcId)});
    const pending=lore[npcId].find(scene=>state.discoveries.includes(scene.id)&&state.decisions[scene.id]===undefined);
    const next=pending||nextLore(npcId);
    if(next)choices.push({id:'lore:'+next.id,label:(pending?'Retomar: ':'Ouvir lembrança: ')+next.title});
    if(state.discoveries.some(id=>loreById[id].npcId===npcId))choices.push({id:'lore:revisit',label:'Revisitar suas histórias'});
    for(const topic of chats[npcId].topics){const [id,label]=currentTopic(npcId,topic);choices.push({id:'chat:'+id,label});}
    choices.push({id:'memory',label:'Você lembra do que já fizemos?'},{id:'close',label:'Até depois'});
    return show(npcId,message,'menu',choices);
  }
  function interact(npcId){
    if(npcId==='letter'){const savedLetter=letterView();return show('rosa',savedLetter.text,'letter',[{id:'close',label:'Guardar a carta'}],savedLetter.title);}
    if(!byId[npcId])return null;
    window.FarmValleySaga?.close?.({silent:true});
    const first=!state.flags['met:'+npcId];
    if(first){state.flags['met:'+npcId]=true;friendship(npcId,2);remember('met:'+npcId,npcId,'Você conheceu '+byId[npcId].name+' no Vale dos Três Ventos.');changed();}
    state.visits[npcId]=Math.min(LIMIT,state.visits[npcId]+1);noticeActivity(npcId);changed();
    record('talk',{npcId});window.FarmValleySaga?.record?.('talk',{npcId});
    return menu(npcId,first?(window.FarmValleySaga?.greeting?.(npcId,{first:true})||chats[npcId].first):undefined);
  }
  function choose(choiceId){
    if(!dialogue || !dialogue.choices.some(c=>c.id===choiceId))return currentDialogue();
    const npcId=dialogue.npcId;if(choiceId==='close')return close();
    if(choiceId==='back')return menu(npcId);
    if(choiceId.startsWith('saga:')){
      if(choiceId==='saga:back'){window.FarmValleySaga?.close?.({silent:true});return menu(npcId);}
      if(choiceId==='saga:menu'&&!window.FarmValleySaga?.isOpen?.())return window.FarmValleySaga?.interact?.(npcId)||currentDialogue();
      return window.FarmValleySaga?.choose?.(choiceId)||currentDialogue();
    }
    if(choiceId==='lore:revisit'){
      const found=state.discoveries.filter(id=>loreById[id].npcId===npcId);
      return show(npcId,'Cada lembrança ganhou um lugar no nosso caminho. Qual você quer ouvir de novo?','lore-list',
        [...found.map(id=>({id:'lore:'+id,label:loreById[id].title})),{id:'back',label:'Voltar à conversa'}],'Histórias de '+byId[npcId].name);
    }
    if(choiceId.startsWith('lore:')){
      const scene=loreById[choiceId.slice(5)];if(!scene||scene.npcId!==npcId||!unlocked(scene))return currentDialogue();
      if(!state.discoveries.includes(scene.id)){state.discoveries.push(scene.id);friendship(npcId,2);log('discovery',scene.id);changed();}
      const previous=state.decisions[scene.id],answered=Number.isInteger(previous);
      return show(npcId,scene.text+(answered?'\n\n'+scene.choices[previous].echo:''),'lore',answered?
        [{id:'back',label:'Voltar à conversa'},{id:'close',label:'Guardar a lembrança'}]:
        [...scene.choices.map((c,i)=>({id:'reply:'+scene.id+':'+i,label:c.label})),{id:'close',label:'Quero pensar nisso; volto depois'}],scene.title);
    }
    if(choiceId.startsWith('reply:')){
      const match=/^reply:(.+):([01])$/.exec(choiceId),scene=match&&loreById[match[1]],which=match?Number(match[2]):-1;
      if(!scene||scene.npcId!==npcId||!state.discoveries.includes(scene.id)||state.decisions[scene.id]!==undefined)return currentDialogue();
      const choice=scene.choices[which];state.decisions[scene.id]=which;friendship(npcId,1);remember('lore:'+scene.id,npcId,choice.memory);log('decision',scene.id);changed();
      return show(npcId,choice.reply,'response',[{id:'back',label:'Continuar a conversa'},{id:'close',label:'Até depois'}],scene.title);
    }
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
      const found=chats[npcId].topics.find(t=>t[0]===choiceId.slice(5));if(!found)return currentDialogue();const topic=currentTopic(npcId,found);
      const key='topic:'+npcId+':'+topic[0],again=state.flags[key];
      if(!again){state.flags[key]=true;friendship(npcId,2);remember(key,npcId,topic[3]);changed();}
      const followUp={rosa:'Lembro da nossa conversa. Desde então, a caixa parece guardar também o que você trouxe para a história.',
        lia:'Lembro da pergunta. Retomá-la depois de observar outra vez pode mudar nossa explicação.',
        tomas:'Lembro do combinado. O que fizemos depois dele vale mais que repetir minha primeira promessa.',
        ines:'Lembro do caminho que discutimos. Hoje eu começaria conferindo o próximo apoio de novo.',
        caio:'Lembro dessa troca. Na próxima travessia, podemos escutar o que ficou faltando desta vez.',
        nico:'Lembro! Anotei nossa ideia. Se tentarmos de novo, quero comparar os passos, não só a última caixa.'};
      return show(npcId,again?followUp[npcId]+'\n\n'+(decisionEcho(npcId)||topic[2]):topic[2],'response',[{id:'back',label:'Continuar a conversa'},{id:'close',label:'Até depois'}]);
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
      state.visits[npcId]=num(saved.visits?.[npcId]);state.spokenActions[npcId]=Math.min(state.sequence,num(saved.spokenActions?.[npcId]));noticeLines[npcId]='';
      if(plain(saved.jobs?.[npcId]))state.jobs[npcId]=sanitizeRecord(saved.jobs[npcId],jobDefinition(npcId,state.season,state.cycleId),state.sequence);
    }
    const validFlags=new Set(['casaAberta','communityGathering',...IDS.map(id=>'met:'+id),...IDS.map(id=>'greet:'+id),
      ...IDS.flatMap(id=>chats[id].topics.map(t=>'topic:'+id+':'+t[0]))]);
    if(plain(saved.flags))for(const key of validFlags)if(saved.flags[key]===true)state.flags[key]=true;
    state.discoveries=[...new Set((Array.isArray(saved.discoveries)?saved.discoveries:[]).filter(knownLore))].slice(0,18);
    if(plain(saved.decisions))for(const id of state.discoveries)if(saved.decisions[id]===0||saved.decisions[id]===1)state.decisions[id]=saved.decisions[id];
    for(const a of (Array.isArray(saved.recentActions)?saved.recentActions:[]).slice(-6))if(plain(a)&&EVENTS.includes(a.event)&&Number.isFinite(a.sequence)&&a.sequence>0&&a.sequence<=state.sequence)
      state.recentActions.push({event:a.event,sequence:num(a.sequence),item:text(a.item,32),correct:a.correct===true});
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
    interact,currentDialogue,choose,advance,close,presentSaga,isOpen:()=>dialogue!==null,update,record,snapshot,worldState,
    serialize:()=>clone(state),restore,
    reset(value){state=fresh(ctx(value));for(const id of IDS)noticeLines[id]='';close();changed();return snapshot();}
  };
})();
