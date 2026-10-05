/* Visão da Pele: desenho original e investigações do vale, sem recursos externos.
   Referências de consulta: OpenStax Anatomy and Physiology 2e, seções 5.1–5.3.
   O desenho é esquemático; a resposta é qualitativa, não uma medição clínica. */
(function(){
  'use strict';
  const structures=[
    {id:'epiderme',name:'Epiderme',color:'#e9be9b',tissue:'Epitélio estratificado pavimentoso queratinizado',cells:'Queratinócitos; melanócitos na camada basal.',role:'Forma a barreira de superfície. Não contém vasos: recebe nutrientes por difusão a partir da derme.',look:'Da base à superfície: basal, espinhosa, granulosa e córnea. Este é um esquema de pele fina, com quatro estratos.',relation:'A camada córnea ajuda a limitar a perda de água. Beber água repõe a reserva do personagem; não cria uma nova camada.'},
    {id:'derme',name:'Derme',color:'#df918b',tissue:'Tecido conjuntivo',cells:'Fibroblastos e fibras de colágeno e elastina.',role:'Sustenta a epiderme e abriga vasos, nervos e anexos.',look:'Região papilar junto à epiderme; região reticular mais profunda, rica em feixes de fibras.',relation:'É aqui que a mudança dos vasos participa das trocas de calor.'},
    {id:'hipoderme',name:'Hipoderme',color:'#efcf76',tissue:'Conjuntivo com tecido adiposo',cells:'Adipócitos, representados pelas células amarelas.',role:'Amortece, armazena energia e contribui para o isolamento térmico.',look:'Está abaixo da pele propriamente dita. Não é um terceiro estrato da epiderme.',relation:'O isolamento ajuda a reduzir trocas de calor; a espessura não muda instantaneamente ao vestir o casaco.'},
    {id:'glandula',name:'Glândula écrina',color:'#52bbd5',tissue:'Epitélio glandular tubular enovelado',cells:'Células secretoras e células do ducto.',role:'Produz suor; seu ducto desemboca em um poro na superfície.',look:'A porção secretora está enovelada em profundidade. O ducto azul sobe separado do folículo.',relation:'O resfriamento ocorre quando o suor evapora. Suor acumulado sobre a pele não equivale a calor já perdido.'},
    {id:'vasos',name:'Vasos da derme',color:'#d45864',tissue:'Endotélio; músculo liso nas arteríolas',cells:'Células endoteliais revestem o lúmen.',role:'Transportam sangue; a resposta vascular modifica a transferência de calor para a superfície.',look:'Redes vermelha e azul ficam na derme, abaixo da epiderme avascular.',relation:'Calor favorece dilatação; frio favorece constrição. A estação sozinha não determina a resposta.'},
    {id:'nervos',name:'Nervos sensitivos',color:'#b89de0',tissue:'Tecido nervoso',cells:'Fibras nervosas com terminações na pele.',role:'Detectam estímulos, incluindo temperatura da pele, e enviam informação ao sistema nervoso.',look:'Ramificações violetas representam terminações livres; não são uma glândula.',relation:'A sensação da pele e a temperatura corporal são informações diferentes. O número no painel pertence à simulação corporal.'},
    {id:'foliculo',name:'Folículo e sebo',color:'#896347',tissue:'Invaginação epitelial e glândula sebácea',cells:'Células do folículo; sebócitos no anexo.',role:'O folículo envolve a raiz do pelo. A glândula sebácea libera sebo no folículo.',look:'A pequena bolsa lateral dourada é sebácea; ela não é a glândula écrina azul.',relation:'Sebo e suor têm origens e funções distintas. A glândula écrina deste desenho abre diretamente na superfície.'},
    {id:'eretor',name:'Músculo eretor',color:'#bb6d6a',tissue:'Tecido muscular liso',cells:'Células musculares junto ao folículo.',role:'Sua contração ergue o pelo e produz o arrepio.',look:'Feixe oblíquo rosa entre folículo e derme superficial.',relation:'Arrepio e tremor são respostas distintas. O tremor que produz calor envolve músculos esqueléticos, fora deste corte.'}
  ];
  const studies=[
    {id:'barreira',structure:'epiderme',title:'A manga de trabalho',context:'Rosa remendou a manga de Alex. Lia pergunta: no tecido da pele, qual região constitui a barreira mais externa?',answers:['Camada córnea da epiderme','Vasos da derme','Adipócitos da hipoderme'],correct:0,why:'A camada córnea ocupa a superfície. Os vasos estão abaixo dela; o casaco é uma proteção externa, não tecido da pele.'},
    {id:'evaporacao',structure:'glandula',title:'A pausa no pomar',context:'Depois do trabalho, Alex transpira. O que explica a perda de calor associada ao suor?',answers:['O suor simplesmente estar sobre a pele','A evaporação do suor na superfície','O sebo sair pelo ducto azul'],correct:1,why:'A mudança para vapor retira calor. Produção de suor, água disponível e condições de evaporação não são a mesma coisa.'},
    {id:'vasos',structure:'vasos',title:'A trilha e o abrigo',context:'Inês compara uma pausa no frio com o esforço em um dia quente. Qual resposta ajuda a conservar calor no frio?',answers:['Dilatação das arteríolas da derme','Vasos surgirem dentro da epiderme','Constrição das arteríolas da derme'],correct:2,why:'A constrição reduz a transferência de calor para a superfície. A epiderme continua avascular em ambos os cenários.'}
  ];
  const modes=[['live','Ao vivo'],['heat','Calor'],['cold','Frio'],['effort','Esforço'],['rest','Descanso']];
  let adapter={},selected='glandula',mode='live',studyId='evaporacao',answered=null,learned=new Set(),observations=[],previousFocus=null,opening=null,lastUi='';
  let root,info,question,feedback,summary,sourceList;const W=760,H=430;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(Number(v))?Number(v):lo));
  const byId=id=>structures.find(s=>s.id===id)||structures[0];
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
  const read=()=>adapter.readState?.()||{};
  function context(){
    const raw=read(),p=raw.player||raw;
    let temp=clamp(p.temp??37,32,43),hyd=clamp((p.hyd??100)/100,0,1),effort=!!(opening?.running||opening?.moving||p.running||p.moving),rest=!!p.resting;
    if(mode==='heat'){temp=38.5;hyd=.8;effort=false;rest=false;}
    if(mode==='cold'){temp=35.7;hyd=.8;effort=false;rest=false;}
    if(mode==='effort'){temp=38;hyd=.7;effort=true;rest=false;}
    if(mode==='rest'){temp=37.3;hyd=.85;effort=false;rest=true;}
    const heat=clamp((temp-37.05)/1.8,0,1),cold=clamp((36.9-temp)/1.5,0,1);
    return {temp,hyd,effort,rest,heat,cold,sweat:heat*(hyd>.1?1:.22),vascular:heat>.12?'Dilatação favorecida':cold>.12?'Constrição favorecida':'Próximo ao basal',raw};
  }
  function select(id){selected=byId(id).id;refreshDetail();updateButtons();drawNow();}
  function setMode(id){if(!modes.some(m=>m[0]===id))return false;mode=id;lastUi='';updateButtons();drawNow();return true;}
  function updateButtons(){root?.querySelectorAll('[data-structure]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.structure===selected)));root?.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));}
  function refreshDetail(){
    if(!info)return;const s=byId(selected);info.replaceChildren(el('p','ESTRUTURA EM FOCO','sl-eyebrow'),el('h3',s.name));
    for(const [label,text]of [['Tecido',s.tissue],['Células e matriz',s.cells],['Função',s.role],['Como reconhecer',s.look],['No jogo',s.relation]]){const p=el('p');p.append(el('strong',label+': '),document.createTextNode(text));info.append(p);}
  }
  function refreshStudy(){
    if(!question)return;const s=studies.find(x=>x.id===studyId);question.replaceChildren(el('h3',s.title),el('p',s.context));
    const chooser=root?.querySelector('select[aria-label="Escolher investigação"]');if(chooser)chooser.value=studyId;
    s.answers.forEach((text,index)=>{const b=el('button',text,'sl-answer');b.type='button';b.dataset.answer=String(index);b.onclick=()=>answer(index);question.append(b);});
    feedback.textContent=learned.has(s.id)?'Investigação já registrada. Você pode revisá-la sem receber recompensas repetidas.':'Selecione uma resposta e confira a explicação.';answered=null;
  }
  function answer(index){
    const s=studies.find(x=>x.id===studyId);if(!s||!Number.isInteger(index)||index<0||index>=s.answers.length)return false;
    answered=index;const correct=index===s.correct,review=learned.has(s.id);select(s.structure);
    question?.querySelectorAll('[data-answer]').forEach(b=>{b.classList.toggle('sl-correct',Number(b.dataset.answer)===s.correct&&correct);b.classList.toggle('sl-wrong',Number(b.dataset.answer)===index&&!correct);});
    feedback.textContent=(correct?'Correto. ':'Vamos observar novamente. ')+s.why;
    if(correct){learned.add(s.id);adapter.record?.('study',{studyId:s.id,structureId:s.structure,correct:true,review});adapter.onChange?.();renderJournal();}
    return correct;
  }
  function renderJournal(){
    if(!summary)return;summary.replaceChildren(el('p',`${learned.size}/3 investigações registradas. As revisões ajudam a história sem repetir prêmios.`));
    for(const o of observations.slice(-3).reverse())summary.append(el('p',`${o.label} · ${o.temp.toFixed(1)} °C · água ${Math.round(o.hyd*100)}% · ${o.vascular}`,'sl-observation'));
  }
  function observe(){
    if(mode!=='live'){feedback.textContent='Volte a Ao vivo para registrar o estado real do personagem.';return false;}
    const c=context();const prev=observations.at(-1);
    const label=c.rest?'Durante o descanso':c.effort?'Após esforço':'Observação do vale';
    const o={label,temp:c.temp,hyd:c.hyd,vascular:c.vascular,structureId:selected,region:String(c.raw.region||'farm').slice(0,24)};
    observations.push(o);if(observations.length>12)observations.shift();
    feedback.textContent=prev?`Registrado. Desde a última observação: ${(o.temp-prev.temp)>=0?'+':''}${(o.temp-prev.temp).toFixed(1)} °C; água ${Math.round((o.hyd-prev.hyd)*100)>=0?'+':''}${Math.round((o.hyd-prev.hyd)*100)} pontos percentuais.`:'Primeira observação registrada. Trabalhe, faça uma pausa e volte para comparar.';
    adapter.onChange?.();renderJournal();return true;
  }
  function refreshLive(c){
    const stamp=[mode,c.temp.toFixed(1),Math.round(c.hyd*100),c.vascular,c.effort,c.rest].join('|');if(stamp===lastUi)return;lastUi=stamp;
    const put=(id,v)=>{const n=document.getElementById(id);if(n)n.textContent=v;};
    put('svT',c.temp.toFixed(1)+' °C');put('svBF',c.vascular);put('svGA',c.sweat>.4?'Resposta aumentada':c.sweat>.05?'Resposta discreta':'Resposta baixa');put('svEff',Math.round(c.hyd*100)+'%');
    const cause=c.rest?'Descanso: menor produção de calor pelo movimento.':c.effort?'Esforço: os músculos produzem calor durante o trabalho.':'Ambiente, abrigo e reservas participam do balanço térmico.';
    const response=c.heat>.12?'No estado mostrado, vasos e suor favorecem a dissipação de calor.':c.cold>.12?'No estado mostrado, a constrição favorece a conservação de calor.':'A resposta está próxima do basal; observe a tendência antes de agir.';
    put('svNote',(mode==='live'?'Estado real da simulação. ':'Comparação didática; o personagem permanece igual. ')+cause+' '+response);
    const terms=c.raw.thermal?.termos||[];const n=document.getElementById('sl-cause');if(n)n.textContent=mode==='live'&&terms.length?'Balanço atual: '+terms.slice(0,3).map(t=>String(t.rotulo||'')).filter(Boolean).join(' · '):'Observe no mundo → localize o tecido → explique a resposta → escolha como se cuidar.';
    const status=document.getElementById('sl-mode-status');if(status)status.textContent=mode==='live'?'AO VIVO · mundo em pausa durante a leitura':'COMPARAÇÃO DIDÁTICA · sem alterar o jogo';
  }
  function line(g,color,width,pts){g.beginPath();g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
  function ellipse(g,x,y,rx,ry,fill,stroke){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1.4;g.stroke();}}
  function tag(g,text,x,y,color,align='left'){g.font='600 13px system-ui,sans-serif';g.textAlign=align;g.fillStyle='#303a36';g.fillText(text,x,y);g.textAlign='left';if(color){g.fillStyle=color;g.fillRect(x-11,y-9,6,6);}}
  function draw(g,scale=1){
    if(!root)return false;const c=context();refreshLive(c);g.setTransform(scale,0,0,scale,0,0);g.clearRect(0,0,W,H);
    g.fillStyle='#f7f1e5';g.fillRect(0,0,W,H);g.fillStyle='#657866';g.font='600 12px system-ui,sans-serif';g.fillText('CORTE ESQUEMÁTICO · PELE FINA COM PELO',24,24);
    const left=32,right=572,top=88,bottom=392;
    // Quatro estratos, derme papilar/reticular e subcutâneo. Sem escala real.
    g.fillStyle='#dfaf91';g.fillRect(left,top,right-left,12);g.fillStyle='#b87988';g.fillRect(left,100,right-left,9);g.fillStyle='#e5b8b4';g.fillRect(left,109,right-left,32);g.fillStyle='#c58094';g.fillRect(left,141,right-left,10);
    g.fillStyle='#edc4b6';g.fillRect(left,151,right-left,54);g.fillStyle='#e4a39b';g.fillRect(left,205,right-left,114);g.fillStyle='#f0d990';g.fillRect(left,319,right-left,73);
    line(g,'#775254',2,[[left,151],[64,146],[91,153],[120,145],[151,154],[180,147],[214,154],[245,147],[278,154],[310,147],[343,154],[375,147],[407,154],[442,147],[475,154],[506,148],[540,154],[right,151]]);
    // Células e fibras: símbolos originais, no padrão das cores da camada.
    for(let i=0;i<42;i++){const x=40+(i%21)*25,y=119+Math.floor(i/21)*14;ellipse(g,x,y,9,5,'#efcbc1','#cf999c');ellipse(g,x,y,2,1.7,'#a77a89');}
    for(let i=0;i<24;i++)ellipse(g,42+i*22,146,5,4,'#9c637f');
    for(let i=0;i<34;i++){const x=47+(i*53)%501,y=193+(i*29)%116;line(g,'#d08b87',2,[[x,y],[x+13,y-5],[x+27,y+2]]);if(i%3===0)ellipse(g,x+8,y+8,4,1.7,'#af7379');}
    for(let row=0;row<2;row++)for(let i=0;i<15;i++){const x=48+i*36+(row%2)*8,y=338+row*32;ellipse(g,x,y,17,14,'#f8e7af','#d0ad60');ellipse(g,x+12,y+7,2.5,2,'#ac985c');}
    // Folículo, sebácea e músculo liso em locais distintos do ducto écrino.
    line(g,'#a16a51',29,[[211,94],[229,208],[243,270]]);line(g,'#efd3b0',20,[[211,94],[229,208],[243,270]]);line(g,'#664438',5,[[201,46],[211,94],[229,208],[243,270]]);ellipse(g,244,272,13,16,'#d0a47e','#ad7858');ellipse(g,249,280,6,5,'#765944');
    ellipse(g,256,164,17,13,'#e3bf78','#b98b53');ellipse(g,271,177,13,11,'#e3bf78','#b98b53');line(g,'#c59a54',5,[[252,171],[226,179]]);
    line(g,selected==='eretor'?'#903e4d':'#bb6d6a',10,[[293,157],[228,218]]);line(g,'#dcaaa0',2,[[293,154],[227,215]]);
    // Tubo écrino coiled secretory unit + duct to independent pore.
    line(g,selected==='glandula'?'#158cad':'#52aec6',8,[[419,284],[420,253],[432,229],[432,175],[432,121],[433,89]]);
    const coil=()=>{g.beginPath();for(let t=0;t<Math.PI*6;t+=.10){const x=419+Math.cos(t)*(15+8*Math.sin(t*1.7)),y=287+Math.sin(t)*(12+7*Math.cos(t*1.3));t===0?g.moveTo(x,y):g.lineTo(x,y);}};
    coil();g.strokeStyle=selected==='glandula'?'#168daf':'#3ea4bf';g.lineWidth=9;g.stroke();
    coil();g.strokeStyle='#abdfdf';g.lineWidth=2.5;g.stroke();
    ellipse(g,433,88,6,2,'#268fac');
    // Vascular size derives from temperature, never from map season.
    const vessel=5+c.heat*4-c.cold*2;line(g,'#cb5261',vessel,[[48,300],[112,302],[175,300],[303,303],[354,296],[389,311],[516,300],[558,304]]);line(g,'#627faa',vessel*.85,[[46,312],[133,315],[185,312],[288,317],[357,308],[391,322],[515,312],[559,319]]);
    for(const x of [97,160,318,501]){line(g,'#cc5d68',Math.max(2,vessel*.5),[[x,301],[x,219],[x-9,180],[x-22,172],[x-35,181]]);line(g,'#6887b5',Math.max(2,vessel*.4),[[x-35,181],[x-43,217],[x-43,312]]);}
    // Free sensory endings branching toward the superficial tissue.
    const nc=selected==='nervos'?'#8c5fc4':'#b497d5';line(g,nc,3,[[76,361],[82,268],[122,237],[132,181]]);line(g,nc,2,[[122,237],[99,209],[94,159]]);line(g,nc,2,[[132,181],[144,163],[149,136]]);line(g,nc,2,[[132,181],[119,167],[118,145]]);
    // Sweat is animated schematically. Reduced motion retains static arrows.
    const reduce=adapter.reducedMotion?.()||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tick=reduce?0:performance.now()/1000;
    if(c.sweat>.05){for(let i=0;i<4;i++){const d=((tick*.4+i*.23)%1),y=76-d*29,x=433+(i-1.5)*11;ellipse(g,x,y,2.5,4,'#62bed3');}tag(g,'Evaporação',465,57,'#52bbd5');line(g,'#66b6c4',2,[[450,70],[455,48]]);}
    // Layer brackets and labels occupy a dedicated right column.
    for(const [label,y1,y2,col]of [['Epiderme',88,151,'#d4a082'],['Derme',153,319,'#d38986'],['Hipoderme',321,392,'#d4b463']]){line(g,col,2,[[578,y1],[586,y1],[586,y2],[578,y2]]);tag(g,label,605,(y1+y2)/2+4,col);}
    tag(g,'Pelo',181,47,'#896347');tag(g,'Poro écrino',394,77,'#52bbd5');tag(g,'Basal',44,169,'#c58094');tag(g,'Papilar',610,181);tag(g,'Reticular',610,268);
    tag(g,'Glândula écrina',351,343,'#52bbd5');tag(g,'Vasos da derme',288,378,'#d45864');tag(g,'Sebo',274,148,'#bfa062');tag(g,'Terminações',40,408,'#b89de0');
    // Selection highlight connects buttons to the actual anatomical position.
    const areas={epiderme:[32,88,540,63],derme:[32,151,540,168],hipoderme:[32,319,540,73],glandula:[389,79,66,236],vasos:[284,284,279,42],nervos:[67,132,93,236],foliculo:[187,79,101,213],eretor:[217,147,85,83]};
    const a=areas[selected];g.save();g.strokeStyle='#317e70';g.lineWidth=2;g.setLineDash([6,4]);g.strokeRect(...a);g.restore();
    g.fillStyle='#5f6c60';g.font='11px system-ui,sans-serif';g.fillText('Estruturas ampliadas, sem escala. A hipoderme fica abaixo da pele.',262,416);return true;
  }
  const drawNow=()=>adapter.draw?.();
  function onOpen(){previousFocus=document.activeElement;const p=read().player||read();opening={running:!!p.running,moving:!!p.moving};mode='live';lastUi='';updateButtons();refreshDetail();refreshStudy();renderJournal();root?.setAttribute('aria-hidden','false');if(root?.querySelector('.sv-body'))root.querySelector('.sv-body').scrollTop=0;document.getElementById('skinClose')?.focus({preventScroll:true});}
  function onClose(){root?.setAttribute('aria-hidden','true');opening=null;const target=previousFocus;if(target?.isConnected)target.focus({preventScroll:true});previousFocus=null;}
  function init(value={}){
    adapter=value;root=document.getElementById('skinView');if(!root)return;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-hidden','true');root.setAttribute('aria-labelledby','sl-title');
    const title=root.querySelector('h2');title.id='sl-title';title.textContent='Visão da Pele · Caderno de Lia';document.getElementById('skinClose').setAttribute('aria-label','Fechar Visão da Pele');
    const body=root.querySelector('.sv-body'),canvas=document.getElementById('skinCanvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Esquema de pele fina: epiderme avascular sobre derme com vasos, glândula écrina e folículo; hipoderme abaixo. Use os botões para ler cada estrutura.');
    body.replaceChildren();const main=el('div',null,'sl-main'),aside=el('aside',null,'sv-side');
    const modeBar=el('div',null,'sl-modes');modeBar.setAttribute('role','group');modeBar.setAttribute('aria-label','Estado para observar');for(const[id,name]of modes){const b=el('button',name);b.type='button';b.dataset.mode=id;b.onclick=()=>setMode(id);modeBar.append(b);}main.append(modeBar,el('p',null,'sl-eyebrow'));main.lastChild.id='sl-mode-status';
    const figure=el('figure',null,'sl-figure');figure.append(canvas,el('figcaption','Esquema de pele fina com pelo. Use as estruturas abaixo para relacionar o desenho aos tecidos.'));main.append(figure);
    const buttons=el('div',null,'sl-structures');buttons.setAttribute('role','group');buttons.setAttribute('aria-label','Estruturas da pele');for(const s of structures){const b=el('button',s.name);b.type='button';b.dataset.structure=s.id;b.style.setProperty('--sl-color',s.color);b.onclick=()=>select(s.id);buttons.append(b);}main.append(buttons);
    info=el('section',null,'sl-detail');main.append(info);
    for(const[label,id]of [['Temperatura corporal','svT'],['Resposta dos vasos','svBF'],['Resposta sudorípara','svGA'],['Reserva de água da simulação','svEff']]){const p=el('div',null,'sv-stat');const v=el('strong','—');v.id=id;p.append(el('span',label),v);aside.append(p);}
    const note=el('p',null,'sv-note');note.id='svNote';aside.append(note);const chain=el('p',null,'sl-chain');chain.id='sl-cause';aside.append(chain);
    aside.append(el('h3','Investigue com Lia'));const studySelect=el('select');studySelect.setAttribute('aria-label','Escolher investigação');for(const s of studies){const o=el('option',s.title);o.value=s.id;studySelect.append(o);}studySelect.value=studyId;studySelect.onchange=()=>{studyId=studySelect.value;refreshStudy();select(studies.find(x=>x.id===studyId).structure);};aside.append(studySelect);
    question=el('section',null,'sl-study');feedback=el('p',null,'sl-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');aside.append(question,feedback);
    const actions=el('div',null,'sl-actions');const observation=el('button','Registrar observação');observation.onclick=observe;const practice=el('button','Praticar histologia');practice.onclick=()=>{adapter.close?.();adapter.practice?.();};actions.append(observation,practice);aside.append(actions);summary=el('section',null,'sl-journal');aside.append(summary);
    sourceList=el('details',null,'sl-sources');sourceList.append(el('summary','Referências de histologia'));for(const[title,page]of [['Camadas da pele','5-1-layers-of-the-skin'],['Anexos da pele','5-2-accessory-structures-of-the-skin'],['Funções da pele','5-3-functions-of-the-integumentary-system']]){const a=el('a','OpenStax · '+title);a.href='https://openstax.org/books/anatomy-and-physiology-2e/pages/'+page;a.target='_blank';a.rel='noopener noreferrer';sourceList.append(a);}aside.append(sourceList);body.append(main,aside);
    const style=el('style');style.textContent=`
      #skinView .sv-card{width:min(1180px,96vw)!important;max-height:94dvh!important;height:auto!important;color:#ede7cf!important}
      #skinView .sv-head{height:auto!important;min-height:44px!important;padding:12px 16px!important;flex-shrink:0}
      #skinView .sv-head h2{font:600 18px/1.3 system-ui,sans-serif!important;letter-spacing:0!important;white-space:normal!important}
      #skinView .sv-body{display:grid!important;grid-template-columns:minmax(0,1fr) 310px!important;height:auto!important;max-height:calc(94dvh - 65px)!important;overflow:auto!important;align-items:start;gap:0!important}
      #skinView .sl-main{padding:14px;min-width:0}#skinView .sl-modes{display:flex;gap:6px;flex-wrap:wrap}
      #skinView button,#skinView select{font:500 14px/1.35 system-ui,sans-serif;min-height:36px;border-radius:7px;padding:7px 10px;cursor:pointer;border:1px solid #938f70;background:#3b4a3d;color:#fff6db}
      #skinView button[aria-pressed=true]{background:#ddc789;color:#283e32;border-color:#f3ddaa}#skinView button:focus-visible,#skinView select:focus-visible,#skinView a:focus-visible{outline:3px solid #7ee5d3;outline-offset:2px}
      #skinView .sl-eyebrow{font:600 11px/1.5 system-ui,sans-serif;color:#d3c694;letter-spacing:.9px;margin:8px 0}
      #skinView .sl-figure{margin:0}#skinView #skinCanvas{display:block!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;aspect-ratio:760/430;object-fit:contain!important;border:1px solid #c5b997;border-radius:9px;image-rendering:auto!important}
      #skinView figcaption{font:12px/1.45 system-ui,sans-serif;color:#cdcdb8;margin:6px 0 10px}
      #skinView .sl-structures{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}#skinView .sl-structures button{border-top:3px solid var(--sl-color);font-size:12px}
      #skinView .sl-detail{padding:12px 14px;margin-top:12px;background:#344438;border:1px solid #5b715b;border-radius:9px}#skinView .sl-detail h3{font:600 22px/1.2 system-ui;margin:0 0 10px;color:#f0d39b}#skinView .sl-detail p{font:14px/1.55 system-ui;margin:7px 0}
      #skinView .sv-side{max-height:none!important;padding:16px!important;overflow:visible!important;background:#293a30!important;min-width:0}
      #skinView .sv-stat{font:13px/1.4 system-ui!important;padding:7px 0!important;background:none!important;border:0!important;border-bottom:1px solid #516452!important;display:flex;gap:12px;justify-content:space-between}#skinView .sv-stat strong{max-width:150px;text-align:right}
      #skinView .sv-note{font:13px/1.5 system-ui!important;padding:10px!important;margin:12px 0!important}#skinView h3{font:600 16px/1.3 system-ui;color:#f0d39b;margin:16px 0 8px}#skinView .sl-chain{font:12px/1.5 system-ui;color:#b9cec1}
      #skinView .sl-study p,#skinView .sl-feedback,#skinView .sl-journal p{font:13px/1.5 system-ui;margin:8px 0}#skinView select{width:100%}#skinView .sl-answer{display:block;width:100%;text-align:left;margin:6px 0}#skinView .sl-correct{background:#447a52;border-color:#91cb88}#skinView .sl-wrong{background:#765142;border-color:#dda885}#skinView .sl-feedback{padding:9px;background:#36483d;border-radius:7px}
      #skinView .sl-actions{display:grid;gap:6px;margin:12px 0}#skinView .sl-observation{border-left:2px solid #95b6a0;padding-left:8px}#skinView .sl-sources{font:12px/1.6 system-ui;color:#ccd9cc}#skinView .sl-sources a{display:block;color:#bfe5cf;padding:4px 0}
      @media(max-width:760px){#skinView .sv-body{grid-template-columns:1fr!important}#skinView .sl-structures{grid-template-columns:repeat(2,minmax(0,1fr))}#skinView .sv-head h2{font-size:15px!important}#skinView .sl-main{padding:10px}#skinView .sv-side{padding:12px!important}#skinView .sl-detail p{font-size:14px}}
      @media(prefers-reduced-motion:reduce){#skinView.show{animation:none!important}}
    `;document.head.append(style);
    root.addEventListener('keydown',event=>{if(event.key==='Tab'){const candidates=Array.from(root.querySelectorAll('button,select,a,summary')).filter(n=>!n.disabled&&n.getClientRects().length&&(!n.closest('details:not([open])')||n.tagName==='SUMMARY'));const first=candidates[0],last=candidates.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
    updateButtons();refreshDetail();refreshStudy();renderJournal();
  }
  function serialize(){return {version:1,studies:Array.from(learned),observations:observations.map(o=>({...o}))};}
  function restore(data){learned=new Set(Array.isArray(data?.studies)?data.studies.filter(id=>studies.some(s=>s.id===id)):[]);observations=[];if(Array.isArray(data?.observations))for(const o of data.observations.slice(-12)){if(!o||!Number.isFinite(o.temp)||!Number.isFinite(o.hyd))continue;observations.push({label:['Durante o descanso','Após esforço','Observação do vale'].includes(o.label)?o.label:'Observação do vale',temp:clamp(o.temp,32,43),hyd:clamp(o.hyd,0,1),vascular:['Dilatação favorecida','Constrição favorecida','Próximo ao basal'].includes(o.vascular)?o.vascular:'Próximo ao basal',structureId:byId(o.structureId).id,region:String(o.region||'farm').slice(0,24)});}mode='live';lastUi='';refreshStudy();renderJournal();}
  window.FarmSkinLearning={init,draw,onOpen,onClose,select,setMode,answer,observe,serialize,restore,reset(){restore(null);selected='glandula';studyId='evaporacao';refreshDetail();updateButtons();},snapshot(){const c=context();return {selected,mode,studyId,answered,studies:Array.from(learned),observations:observations.map(o=>({...o})),response:{temp:c.temp,hyd:c.hyd,vascular:c.vascular,heat:c.heat,cold:c.cold,sweat:c.sweat},structures:structures.map(s=>({...s}))};}};
})();
