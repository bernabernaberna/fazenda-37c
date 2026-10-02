/* Progressão do sandbox: recompensas por ciclo, revisão e histórico local.
   Não altera tarefas, questões, moedas ou DOM diretamente. O template fornece
   contexto e recebe eventos pela API; a fazenda continua sem um final forçado.

   init({reward, changed, milestone}): reward recebe
   {coins,kind,id,label,cycleId,season}; os outros recebem snapshot().
   Contexto: {season,tasks:[{id,text,goal,n,done}],histologyCompleted:[id],stats}.
   taskCompleted/quizAnswered retornam moedas concedidas (0, 5 ou 10).
   completeSeason/seasonEnded/startSeason retornam true só em transição nova.
   history tem uma entrada por ciclo; ended indica o encerramento do período.
   completion guarda o retrato imutável da conclusão antecipada, se houver.
   O módulo deve ser restaurado DEPOIS de tarefas/estatísticas/quiz no load.
*/
(function(){
  const VERSION=1, HISTORY_LIMIT=60, TASK_COINS=5, QUIZ_COINS=10;
  const PASSIVE=new Set(['temp','tempFrio']);
  const STAT_KEYS=['waterDrunk','shadeRests','overheatWarnings','coldWarnings','skinOpened','deathsHyper','deathsHypo'];
  let callbacks={}, state;
  const copy=value=>JSON.parse(JSON.stringify(value));
  const natural=value=>Number.isFinite(Number(value)) ? Math.max(0,Math.floor(Number(value))) : 0;
  const season=value=>value==='cold' ? 'cold' : 'hot';
  const id=value=>typeof value==='string' ? value.trim().slice(0,120) : '';
  const unique=values=>[...new Set((Array.isArray(values)?values:[]).map(id).filter(Boolean))];
  function counters(){
    return {cyclesStarted:1,cyclesEnded:0,seasonsCompleted:{hot:0,cold:0},
      taskRewards:0,quizCorrect:0,quizWrong:0,coinsEarned:0};
  }
  function statSnapshot(stats){
    return Object.fromEntries(STAT_KEYS.map(key=>[key,natural(stats?.[key])]));
  }
  function contextTasks(context){ return Array.isArray(context?.tasks)?context.tasks:[]; }
  function activeCycle(context, cycleId){
    const tasks=contextTasks(context);
    return {id:cycleId,season:season(context?.season),startedAt:Date.now(),
      taskIds:unique(tasks.filter(t=>!PASSIVE.has(t.id)).map(t=>t.id)),
      // Objetivos já satisfeitos no início (ex.: casaco existente) não pagam.
      paidTasks:unique(tasks.filter(t=>t.done && !PASSIVE.has(t.id)).map(t=>t.id)),
      answers:[],completed:false,ended:false,completionReport:null,taskRewards:0,quizCorrect:0,
      quizWrong:0,coinsEarned:0,baselineStats:statSnapshot(context?.stats),
      temperature:{samples:0,sum:0,min:null,max:null}};
  }
  function fresh(context){
    return {version:VERSION,active:activeCycle(context,1),history:[],lifetime:counters(),milestoneReached:false};
  }
  function emit(name, payload){
    if(typeof callbacks[name]!=='function') return;
    try{ callbacks[name](payload); }
    catch(error){ console.warn('[jornada] Falha no aviso de '+name,error); }
  }
  function snapshot(){ return copy(state); }
  function changed(){ emit('changed',snapshot()); }
  function checkMilestone(){
    if(state.milestoneReached || !state.lifetime.seasonsCompleted.hot
      || !state.lifetime.seasonsCompleted.cold || state.lifetime.quizCorrect<3) return;
    state.milestoneReached=true;
    // É um marco opcional de aprendizado; o sandbox permanece disponível.
    emit('milestone',snapshot());
  }
  function grant(coins, kind, itemId, label){
    state.active.coinsEarned+=coins;
    state.lifetime.coinsEarned+=coins;
    emit('reward',{coins,kind,id:itemId,label,cycleId:state.active.id,season:state.active.season});
    checkMilestone(); changed();
    return coins;
  }
  function report(context, completed, ended){
    const a=state.active, stats=statSnapshot(context?.stats), temp=a.temperature;
    return {cycleId:a.id,season:a.season,completed,ended,startedAt:a.startedAt,
      recordedAt:Date.now(),tasks:contextTasks(context).map(t=>({id:id(t.id),
        text:typeof t.text==='string'?t.text:'',goal:natural(t.goal),n:natural(t.n),done:!!t.done})),
      taskRewards:a.taskRewards,quizCorrect:a.quizCorrect,quizWrong:a.quizWrong,
      coinsEarned:a.coinsEarned,answers:copy(a.answers),
      stats:Object.fromEntries(STAT_KEYS.map(key=>[key,Math.max(0,stats[key]-a.baselineStats[key])])),
      temperature:{samples:temp.samples,average:temp.samples?temp.sum/temp.samples:null,min:temp.min,max:temp.max}};
  }
  function archive(context, completed, ended){
    const a=state.active;
    const entry={...report(context,completed,ended),completion:a.completionReport?copy(a.completionReport):null};
    // Concluir tarefas não encerra a estação. Na virada substituímos a entrada
    // pelo período inteiro, preservando o primeiro retrato dentro de completion.
    const index=state.history.findIndex(r=>r.cycleId===a.id);
    if(index>=0) state.history[index]=entry;
    else state.history.push(entry);
    if(state.history.length>HISTORY_LIMIT) state.history.splice(0,state.history.length-HISTORY_LIMIT);
  }
  function normalizeAnswers(values){
    const seen=new Set();
    return (Array.isArray(values)?values:[]).filter(a=>{
      const key=id(a?.id);
      if(!key || seen.has(key)) return false;
      seen.add(key); return true;
    }).map(a=>({id:id(a.id),correct:typeof a.correct==='boolean'?a.correct:null,
      concept:typeof a.concept==='string'?a.concept.slice(0,250):'',legacy:!!a.legacy}));
  }
  function completionCopy(value){
    if(!value || typeof value!=='object') return null;
    const result=copy(value);
    // Retratos não contêm retratos: evita recursão e crescimento a cada save.
    delete result.completion;
    return result;
  }
  function restoreHistory(values, activeId, activeEnded){
    const byCycle=new Map();
    for(const value of Array.isArray(values)?values:[]){
      if(!value || typeof value!=='object' || !natural(value.cycleId)) continue;
      const entry=copy(value), cycleId=natural(entry.cycleId);
      const previous=byCycle.get(cycleId);
      entry.cycleId=cycleId;
      entry.completion=completionCopy(entry.completion)
        || completionCopy(previous?.completion)
        || (entry.completed && !entry.ended ? completionCopy(entry) : null);
      // Em saves anteriores, a entrada já era um retrato de conclusão; a
      // marcação ended não existia. Esse retrato também continua disponível.
      entry.ended=typeof entry.ended==='boolean' ? entry.ended
        : (cycleId<activeId || (cycleId===activeId && activeEnded) || !entry.completed);
      byCycle.delete(cycleId); byCycle.set(cycleId,entry);
    }
    return [...byCycle.values()].slice(-HISTORY_LIMIT);
  }
  function restore(saved, context){
    if(!saved || saved.version!==VERSION || !saved.active){
      state=fresh(context);
      // Saves anteriores não identificam acertos: respostas legadas bloqueiam
      // pagamento neste ciclo, sem converter XP/conceitos em moedas ou acertos.
      state.active.answers=unique(context?.histologyCompleted).map(key=>({id:key,correct:null,concept:'',legacy:true}));
      for(const s of ['hot','cold']) state.lifetime.seasonsCompleted[s]=context?.stats?.seasonsCompleted?.[s]?1:0;
      const actions=contextTasks(context).filter(t=>!PASSIVE.has(t.id));
      state.active.completed=!!context?.stats?.seasonsCompleted?.[state.active.season]
        && actions.length>0 && actions.every(t=>t.done);
      changed(); return false;
    }
    state=fresh(context);
    const old=saved.active, a=state.active;
    a.id=Math.max(1,natural(old.id));
    a.season=season(context?.season);
    a.startedAt=natural(old.startedAt)||Date.now();
    a.paidTasks=unique([...unique(old.paidTasks),...contextTasks(context).filter(t=>t.done).map(t=>t.id)])
      .filter(key=>a.taskIds.includes(key));
    a.answers=normalizeAnswers(old.answers);
    // Uma missão já concluída no save não vira moeda ao migrar uma resposta
    // que o histórico antigo não identificava como acerto/erro.
    for(const key of unique(context?.histologyCompleted)){
      if(!a.answers.some(answer=>answer.id===key)) a.answers.push({id:key,correct:null,concept:'',legacy:true});
    }
    a.completed=!!old.completed; a.ended=!!old.ended;
    a.taskRewards=Math.min(natural(old.taskRewards),a.paidTasks.length);
    a.quizCorrect=a.answers.filter(answer=>answer.correct===true).length;
    a.quizWrong=a.answers.filter(answer=>answer.correct===false).length;
    a.coinsEarned=a.taskRewards*TASK_COINS+a.quizCorrect*QUIZ_COINS;
    a.baselineStats=statSnapshot(old.baselineStats||context?.stats);
    const temp=old.temperature||{};
    const samples=natural(temp.samples), average=samples?temp.sum/samples:NaN;
    if(samples && Number.isFinite(temp.sum) && Number.isFinite(temp.min)
      && Number.isFinite(temp.max) && temp.min<=temp.max
      && average>=temp.min-1e-7 && average<=temp.max+1e-7){
      a.temperature={samples,sum:temp.sum,min:temp.min,max:temp.max};
    }
    const life=saved.lifetime||{};
    for(const key of ['cyclesStarted','cyclesEnded','taskRewards','quizCorrect','quizWrong','coinsEarned']) state.lifetime[key]=natural(life[key]);
    state.lifetime.cyclesStarted=Math.max(a.id,state.lifetime.cyclesStarted);
    for(const s of ['hot','cold']) state.lifetime.seasonsCompleted[s]=natural(life.seasonsCompleted?.[s]);
    state.history=restoreHistory(saved.history,a.id,a.ended);
    const current=state.history.find(entry=>entry.cycleId===a.id);
    a.completionReport=completionCopy(old.completionReport)
      || (a.completed ? completionCopy(current?.completion||current) : null);
    for(const key of ['taskRewards','quizCorrect','quizWrong','coinsEarned']){
      state.lifetime[key]=Math.max(state.lifetime[key],a[key]);
    }
    state.milestoneReached=!!saved.milestoneReached || (!!state.lifetime.seasonsCompleted.hot
      && !!state.lifetime.seasonsCompleted.cold && state.lifetime.quizCorrect>=3);
    // Restaurar não dispara pagamentos, marco ou conquista novamente.
    changed(); return true;
  }
  state=fresh({season:'hot',tasks:[],stats:{}});
  window.FarmLearningJourney={
    init(api={}){ callbacks=api; return snapshot(); },
    reset(context={}){ state=fresh(context); changed(); return snapshot(); },
    restore,serialize:snapshot,snapshot,
    taskCompleted({season:which,id:taskId,text}={}){
      const a=state.active, key=id(taskId);
      if(a.ended || season(which)!==a.season || !key || PASSIVE.has(key)
        || !a.taskIds.includes(key) || a.paidTasks.includes(key)) return 0;
      a.paidTasks.push(key); a.taskRewards++; state.lifetime.taskRewards++;
      return grant(TASK_COINS,'task',key,typeof text==='string'?text:key);
    },
    quizAnswered({id:missionId,correct,concept}={}){
      const a=state.active, key=id(missionId);
      if(a.ended || !key || typeof correct!=='boolean' || a.answers.some(answer=>answer.id===key)) return 0;
      a.answers.push({id:key,correct,concept:typeof concept==='string'?concept:'',legacy:false});
      if(!correct){ a.quizWrong++; state.lifetime.quizWrong++; changed(); return 0; }
      a.quizCorrect++; state.lifetime.quizCorrect++;
      return grant(QUIZ_COINS,'quiz',key,typeof concept==='string'?concept:key);
    },
    completeSeason(context={}){
      const a=state.active, tasks=contextTasks(context), actions=tasks.filter(t=>!PASSIVE.has(t.id));
      if(a.ended || a.completed || season(context.season)!==a.season || !actions.length
        || actions.length!==a.taskIds.length || !a.taskIds.every(key=>actions.some(t=>t.id===key && t.done))
        || !tasks.filter(t=>PASSIVE.has(t.id)).every(t=>Number(t.n)>0)) return false;
      a.completed=true; state.lifetime.seasonsCompleted[a.season]++;
      a.completionReport=report(context,true,false);
      archive(context,true,false); checkMilestone(); changed(); return true;
    },
    seasonEnded(context={}){
      const a=state.active;
      if(a.ended || season(context.season)!==a.season) return false;
      // O histórico final inclui respostas e observações feitas depois da
      // conclusão das tarefas; completion mantém o retrato anterior intacto.
      archive(context,a.completed,true);
      a.ended=true; state.lifetime.cyclesEnded++; changed(); return true;
    },
    startSeason(context={}){
      // O template encerra o ciclo ANTES de trocar as listas globais. Não usamos
      // a lista da estação nova para montar o relatório da estação anterior.
      if(!state.active.ended) return false;
      state.active=activeCycle(context,state.active.id+1);
      state.lifetime.cyclesStarted++; changed(); return true;
    },
    observe(temp){
      if(state.active.ended || !Number.isFinite(temp)) return;
      const t=state.active.temperature;
      t.samples++; t.sum+=temp;
      t.min=t.min===null?temp:Math.min(t.min,temp);
      t.max=t.max===null?temp:Math.max(t.max,temp);
    }
  };
})();
