/* Relatório opcional, local e exportável. A exploração continua ao fechá-lo. */
(function(){
  let api={}, panel=null, previousFocus=null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const station=value=>value==='cold'?'Fria':'Quente';
  const number=value=>Number.isFinite(Number(value))?Number(value):0;
  const temp=value=>Number.isFinite(value)?value.toFixed(1)+' °C':'Sem amostras';
  function data(){ return typeof api.read==='function'?api.read():{}; }
  function isOpen(){ return !!panel?.classList.contains('show'); }
  function make(){
    if(panel) return;
    const style=document.createElement('style');
    style.textContent=`
      #activityReport{display:none;position:fixed;inset:0;z-index:10020;background:rgba(10,20,14,.82);align-items:center;justify-content:center;padding:16px;box-sizing:border-box;}
      #activityReport.show{display:flex;}
      #activityReport .ar-card{width:min(880px,100%);max-height:94vh;overflow:auto;box-sizing:border-box;background:#f6edd8;color:#283a2b;border:3px solid #7b5c37;border-radius:12px;padding:22px;box-shadow:0 12px 70px #0008;font:14px/1.5 'Trebuchet MS',sans-serif;}
      #activityReport h2{color:#283a2b;margin:0;font-size:25px;} #activityReport h3{color:#283a2b;margin:20px 0 8px;font-size:16px;}
      #activityReport p{margin:5px 0 12px;} #activityReport small{color:#50634c;} #activityReport .ar-head{display:flex;gap:12px;align-items:start;justify-content:space-between;}
      #activityReport button{background:#345d3b;color:#fff6df;border:1px solid #173b23;border-radius:6px;padding:10px 13px;min-height:40px;font:700 13px 'Trebuchet MS',sans-serif;cursor:pointer;box-shadow:none;}
      #activityReport button:hover{background:#427549;} #activityReport button:focus-visible{outline:3px solid #a97121;outline-offset:3px;}
      #activityReport .ar-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;} #activityReport .ar-secondary{background:#e4d8bd;color:#283a2b;border-color:#9b865e;}
      #activityReport .ar-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:18px 0;}
      #activityReport .ar-metric{border:1px solid #b6b593;background:#fff8e8;border-radius:8px;padding:12px;} #activityReport .ar-metric b{display:block;font-size:23px;color:#315536;} #activityReport .ar-metric span{font-size:12px;}
      #activityReport .ar-strip{padding:10px 12px;background:#dae7c9;border-left:4px solid #497345;border-radius:4px;}
      #activityReport .ar-table-wrap{overflow-x:auto;} #activityReport table{width:100%;border-collapse:collapse;font-size:13px;}
      #activityReport th,#activityReport td{padding:8px;text-align:left;border-bottom:1px solid #d8cfb8;vertical-align:top;} #activityReport th{background:#e5dfc9;color:#314d34;}
      #activityReport .ar-tasks{padding-left:20px;margin:8px 0;} #activityReport .ar-tasks li{margin:3px 0;} #activityReport .ar-done{color:#3e6b39;}
      #activityReport .ar-foot{margin-top:18px;padding-top:12px;border-top:1px solid #c3b493;font-size:12px;color:#596150;}
      #journeyButton{display:block;pointer-events:auto;margin:0;padding:5px 10px;min-height:28px;font-size:11px;box-sizing:border-box;}
      @media(max-width:600px){#activityReport{padding:8px;}#activityReport .ar-card{padding:14px;max-height:96vh;}#activityReport .ar-metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;}#activityReport h2{font-size:21px;}#activityReport .ar-head{flex-wrap:wrap;}}
    `;
    document.head.appendChild(style);
    panel=document.createElement('div'); panel.id='activityReport';
    panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true'); panel.setAttribute('aria-labelledby','activityReportTitle');
    panel.innerHTML='<div class="ar-card"></div>'; document.body.appendChild(panel);
    panel.addEventListener('click',event=>{
      const action=event.target.closest('[data-ar]')?.dataset.ar;
      if(action==='close') close();
      if(action==='json'||action==='csv') download(action);
      if(action==='practice'){ close(); api.practice?.(); }
    });
    panel.addEventListener('keydown',event=>{
      if(event.key!=='Tab') return;
      const buttons=[...panel.querySelectorAll('button:not([disabled])')];
      const first=buttons[0], last=buttons[buttons.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    });
  }
  function render(){
    if(!isOpen()) return;
    const d=data(), j=d.journey||{}, a=j.active||{}, life=j.lifetime||{}, temperature=a.temperature||{};
    const correct=number(life.quizCorrect), wrong=number(life.quizWrong), total=correct+wrong;
    const tasks=Array.isArray(d.tasks)?d.tasks:[], actions=tasks.filter(t=>!['temp','tempFrio'].includes(t.id));
    const done=actions.filter(t=>t.done).length;
    const answers=Array.isArray(a.answers)?a.answers:[];
    const history=(Array.isArray(j.history)?j.history:[]).slice().reverse();
    const contents=`<div class="ar-head"><div><small>FAZENDA 37 °C · SEU MUNDO CONTINUA</small><h2 id="activityReportTitle">Progresso e relatório</h2><p>${esc(d.name||'Jogador')} · Ciclo ${number(a.id)||1} · Estação ${station(d.season)}</p></div><button data-ar="close">Voltar ao mundo</button></div>
      <div class="ar-metrics"><div class="ar-metric"><b>${done}/${actions.length}</b><span>Tarefas deste ciclo</span></div><div class="ar-metric"><b>${correct} / ${wrong}</b><span>Acertos / erros registrados</span></div><div class="ar-metric"><b>${total?Math.round(correct/total*100)+'%':'—'}</b><span>Acerto nas primeiras tentativas por ciclo</span></div><div class="ar-metric"><b>${number(life.coinsEarned)}</b><span>Moedas ganhas com tarefas e quizzes</span></div></div>
      <div class="ar-strip">${j.milestoneReached?'★ Marco alcançado: tarefas no calor e no frio + 3 acertos. Continue explorando e melhorando a fazenda.':'Seu próximo marco: concluir tarefas no calor e no frio e acertar 3 quizzes. Você pode explorar por quanto tempo quiser.'}</div>
      <h3>Agora na fazenda</h3><p>Saldo: <b>${number(d.coins)} moedas</b> · Histologia: <b>${number(d.score)} pontos</b> · Ciclos concluídos: <b>${number(life.seasonsCompleted?.hot)} quentes / ${number(life.seasonsCompleted?.cold)} frios</b>.</p>
      <ul class="ar-tasks">${tasks.map(t=>`<li class="${t.done?'ar-done':''}">${t.done?'✓ ':''}${esc(t.text)} <b>(${number(t.n)}/${number(t.goal)})</b></li>`).join('')}</ul>
      <p><small>Tarefa concluída: +5 moedas. Acerto em quiz: +10 moedas. Cada objetivo paga uma vez por ciclo; a próxima estação renova as tarefas e as questões. Equipamentos que você já possui continuam disponíveis.</small></p>
      <h3>Respostas deste ciclo</h3>${answers.length?`<div class="ar-table-wrap"><table><thead><tr><th>Conceito</th><th>Primeira resposta</th></tr></thead><tbody>${answers.map(q=>`<tr><td>${esc(q.concept||q.id)}</td><td>${q.correct===null?'Registro anterior sem resultado':q.correct?'✓ Acerto':'Rever o conceito'}</td></tr>`).join('')}</tbody></table></div>`:'<p>Ainda sem respostas. Use <b>Praticar histologia</b> ou encontre quizzes durante a exploração.</p>'}
      <h3>Temperatura observada neste ciclo</h3><p>Média amostral: <b>${temp(temperature.samples?temperature.sum/temperature.samples:null)}</b> · Mínima: <b>${temp(temperature.min)}</b> · Máxima: <b>${temp(temperature.max)}</b>.</p>
      <h3>Histórico de estações</h3>${history.length?`<div class="ar-table-wrap"><table><thead><tr><th>Ciclo</th><th>Estação</th><th>Tarefas</th><th>Acertos / erros</th><th>Moedas</th></tr></thead><tbody>${history.map(r=>`<tr><td>${number(r.cycleId)}</td><td>${station(r.season)}</td><td>${r.completed?'Concluídas':'Parciais'}</td><td>${number(r.quizCorrect)} / ${number(r.quizWrong)}</td><td>${number(r.coinsEarned)}</td></tr>`).join('')}</tbody></table></div>`:'<p>O primeiro registro aparece ao concluir as tarefas ou virar a estação.</p>'}
      <div class="ar-actions"><button data-ar="practice">Praticar histologia</button><button data-ar="json" class="ar-secondary">Exportar JSON</button><button data-ar="csv" class="ar-secondary">Exportar CSV</button></div>
      <p class="ar-foot">Este relatório usa os registros locais desta partida. Acertos de jogos antigos sem resultado salvo não são estimados. O histórico guarda até 60 estações e os totais continuam acumulando. Exportar baixa um arquivo neste aparelho; use um apelido para apresentar ou compartilhar. Os registros descrevem o jogo e precisam de interpretação pedagógica.</p>`;
    // Mantém o foco caso um evento de progresso atualize o relatório aberto.
    const focused=document.activeElement?.dataset?.ar;
    panel.querySelector('.ar-card').innerHTML=contents;
    if(focused) panel.querySelector('[data-ar="'+focused+'"]')?.focus();
  }
  function open(){ make(); previousFocus=document.activeElement; panel.classList.add('show'); render(); panel.querySelector('button')?.focus(); }
  function close(){ if(!panel) return; panel.classList.remove('show'); previousFocus?.focus?.({preventScroll:true}); }
  function exportData(){ return {format:'fazenda37-relatorio-v1',exportedAt:new Date().toISOString(),...data()}; }
  function csvCell(value){
    let s=String(value??'');
    if(/^[\s]*[=+\-@\t\r]/.test(s)) s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }
  function csv(d){
    const j=d.journey||{}, a=j.active||{};
    const records=(j.history||[]).filter(r=>r.cycleId!==a.id).concat([{cycleId:a.id,season:a.season,completed:a.completed,quizCorrect:a.quizCorrect,quizWrong:a.quizWrong,coinsEarned:a.coinsEarned,answers:a.answers,tasks:d.tasks}]);
    const rows=[['ciclo','estacao','tipo','item','resultado','moedas_do_ciclo']];
    for(const r of records){
      rows.push([r.cycleId,station(r.season),'resumo','tarefas',r.completed?'concluidas':'parciais',r.coinsEarned]);
      for(const t of r.tasks||[]) rows.push([r.cycleId,station(r.season),'tarefa',t.text||t.id,t.done?'concluida':number(t.n)+'/'+number(t.goal),'']);
      for(const q of r.answers||[]) rows.push([r.cycleId,station(r.season),'quiz',q.concept||q.id,q.correct===null?'legado sem resultado':q.correct?'acerto':'erro','']);
    }
    return '\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');
  }
  function download(type){
    const d=exportData(), content=type==='csv'?csv(d):JSON.stringify(d,null,2);
    const blob=new Blob([content],{type:type==='csv'?'text/csv;charset=utf-8':'application/json'});
    const url=URL.createObjectURL(blob), anchor=document.createElement('a');
    anchor.href=url; anchor.download='fazenda37-progresso-'+new Date().toISOString().slice(0,10)+'.'+type;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  window.FarmActivityReport={init(config){api=config||{};make();},open,close,isOpen,refresh:render,exportData,csv};
})();
