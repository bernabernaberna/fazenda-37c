/* ============================================================
   MODO PROFESSOR — Telemetria de desempenho no quiz
   ============================================================
   Coleta cada resposta de quiz (acerto/erro, conceito, dificuldade)
   e a guarda em DOIS lugares:
     1. localStorage  — sempre (histórico local, funciona offline,
                        permite testar o painel sem servidor)
     2. Supabase      — se o professor configurou URL + chave anon
                        (monitoramento central de toda a turma)

   O aluno ativa o monitoramento digitando um CÓDIGO DE TURMA na
   tela inicial (ex: "BIO7A"). Sem código, o jogo roda normal e
   nada é enviado — modo offline 100% preservado.

   Config do Supabase fica em localStorage (farm37_teacher_cfg):
     { url: 'https://xxxx.supabase.co', key: 'anon-key-aqui' }

   Exposto em window.TeacherMode:
     setClassCode(code)         define a turma do aluno
     getClassCode()
     submitQuizEvent(ev)        registra uma resposta de quiz
     fetchEvents(classCode)     lê todos os eventos (Supabase ou local)
     aggregate(events)          calcula ranking / acertos / erros
     setConfig(url, key)        salva config do Supabase
     getConfig()
     isCloudEnabled()
   ============================================================ */
(function(){
  const CFG_KEY    = 'farm37_teacher_cfg';
  const LOCAL_KEY  = 'farm37_quiz_events';
  const CLASS_KEY  = 'farm37_class_code';
  const CONSENT_KEY= 'farm37_consent';
  const OUTBOX_KEY = 'farm37_outbox';   // eventos ainda NÃO confirmados na nuvem

  // Nuvem PRÉ-CONFIGURADA (embutida): o aluno NÃO precisa de URL/chave — só
  // digita o código da turma. A chave 'anon' é pública por design e está
  // protegida pelo RLS (só insere em código de turma REAL; ninguém lê dados).
  const CLOUD_DEFAULT = {
    url: 'https://sgetexmazhmnfwiqsljy.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZXRleG1hemhtbmZ3aXFzbGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjI1OTEsImV4cCI6MjA5Nzc5ODU5MX0.s8hJINf5lVIVkXjF6U-Ku37uqx6SJMwYNsfLbG3-JD8'
  };

  let _classCode = (function(){
    try { return localStorage.getItem(CLASS_KEY) || null; } catch(e){ return null; }
  })();
  // Consentimento LGPD para envio à nuvem (exigido p/ dados de alunos, possíveis menores)
  let _consent = (function(){
    try { return localStorage.getItem(CONSENT_KEY) === '1'; } catch(e){ return false; }
  })();
  function setConsent(v){
    _consent = !!v;
    try {
      if(_consent) localStorage.setItem(CONSENT_KEY, '1');
      else localStorage.removeItem(CONSENT_KEY);
    } catch(e){}
    return _consent;
  }
  function getConsent(){ return _consent; }

  function getConfig(){
    // 1) Override manual (se o professor tiver configurado algo no aparelho)
    try {
      const saved = JSON.parse(localStorage.getItem(CFG_KEY) || 'null');
      if(saved && saved.url && saved.key) return saved;
    } catch(e){}
    // 2) Fallback: config embutida (pré-ligada) → tudo automático para o aluno
    return (CLOUD_DEFAULT.url && CLOUD_DEFAULT.key) ? CLOUD_DEFAULT : null;
  }
  function setConfig(url, key){
    const cfg = { url: (url||'').trim().replace(/\/+$/,''), key: (key||'').trim() };
    try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch(e){}
    return cfg;
  }
  function isCloudEnabled(){
    const c = getConfig();
    return !!(c && c.url && c.key);
  }

  function setClassCode(code){
    _classCode = (code||'').trim().toUpperCase().slice(0, 12) || null;
    try {
      if(_classCode) localStorage.setItem(CLASS_KEY, _classCode);
      else localStorage.removeItem(CLASS_KEY);
    } catch(e){}
    return _classCode;
  }
  function getClassCode(){ return _classCode; }

  // ---- Local storage of events (always on) ----
  function _readLocal(){
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function _writeLocal(arr){
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(arr.slice(-2000))); } catch(e){}
  }

  // ---- Saneamento/whitelist do payload (defesa em profundidade) ----
  // Nunca confiar no que vai para a nuvem: remove caracteres perigosos, limita
  // tamanhos e só aceita valores conhecidos. Evita injeção, payloads gigantes e
  // qualquer dado fora do mínimo necessário.
  const _DIFFS = ['basico','intermediario','avancado'];
  const _CATS  = ['glandulas','vasos','celulas','estrutura','integracao'];
  function _clean(v, max){
    // Sem regex/barra-invertida de propósito: o build (re.sub) interpreta escapes
    // na string de substituição. Filtramos char a char por código.
    var s = String(v == null ? '' : v);
    var bad = '<>&"' + "'" + String.fromCharCode(92);  // perigosos: < > & " ' e \
    var out = '';
    for(var i = 0; i < s.length && out.length < max; i++){
      if(s.charCodeAt(i) < 32) continue;          // remove caracteres de controle
      if(bad.indexOf(s[i]) !== -1) continue;       // remove caracteres perigosos
      out += s[i];
    }
    return out.trim();
  }

  // UID do evento: usa crypto.randomUUID quando existe; senão, tempo + aleatório.
  function _uid(){
    try { if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch(e){}
    return 'e' + Date.now().toString(36) + '-' +
           Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,6);
  }

  // ---- Submit one quiz answer ----
  function submitQuizEvent(ev){
    ev = ev || {};
    // ev: { missionId, concept, category, difficulty, correct, score }
    const record = {
      // Identificador único do evento (gerado no cliente). Torna o reenvio
      // IDEMPOTENTE: se o POST chegou mas a resposta se perdeu, o retry não
      // duplica a linha (o banco ignora conflito em event_uid).
      event_uid: _uid(),
      created_at: new Date().toISOString(),
      class_code: _clean(_classCode || '(sem turma)', 12).toUpperCase(),
      student_name: _clean((typeof player !== 'undefined' && player.name) ? player.name : 'Anônimo', 24) || 'Anônimo',
      mission_id: _clean(ev.missionId, 40) || null,
      concept: _clean(ev.concept, 160) || null,
      category: _CATS.includes(ev.category) ? ev.category : null,
      difficulty: _DIFFS.includes(ev.difficulty) ? ev.difficulty : null,
      correct: !!ev.correct,
      score: Math.max(-100, Math.min(100, parseInt(ev.score, 10) || 0)),
    };
    // 1) Always store locally
    const local = _readLocal();
    local.push(record);
    _writeLocal(local);
    // 2) Push to Supabase SOMENTE com: nuvem configurada + código de turma +
    //    CONSENTIMENTO explícito (LGPD). Sem consentimento, fica só no aparelho.
    //    O envio passa pela OUTBOX: nada se perde se a internet da escola cair.
    if(isCloudEnabled() && _classCode && _consent){
      _enqueue(record);
      flushOutbox();
    }
  }

  /* ================= OUTBOX (resiliência de rede) =================
     A internet de escola cai o tempo todo. Antes, um POST que falhava era
     descartado (.catch(()=>{})) e o desempenho do aluno NUNCA chegava ao
     painel. Agora cada evento entra numa fila persistente e é reenviado —
     em lote — até o servidor confirmar. Sobrevive a recarregar a página. */
  let _flushing = false, _retryMs = 0, _retryTimer = null;
  const OUTBOX_MAX = 500;   // teto p/ não estourar o localStorage
  const BATCH_MAX  = 50;    // Supabase aceita array = insert em lote
  const DEAD_KEY   = 'farm37_outbox_dead';   // lotes que o servidor recusou
  const LEGACY_KEY = 'farm37_legacy_insert'; // banco sem a coluna event_uid

  // Bancos criados ANTES da migração não têm a coluna event_uid: o insert com
  // ?on_conflict=event_uid volta 400 e TODA a telemetria seria perdida. Nesse
  // caso caímos para o formato antigo (sem event_uid) em vez de descartar.
  let _legacy = false;
  try { _legacy = localStorage.getItem(LEGACY_KEY) === '1'; } catch(e){}
  function _setLegacy(v){
    _legacy = !!v;
    try { if(_legacy) localStorage.setItem(LEGACY_KEY,'1'); else localStorage.removeItem(LEGACY_KEY); } catch(e){}
  }
  function _endpoint(cfg){
    return cfg.url + '/rest/v1/quiz_events' + (_legacy ? '' : '?on_conflict=event_uid');
  }
  function _preferHeader(){
    return _legacy ? 'return=minimal' : 'return=minimal,resolution=ignore-duplicates';
  }
  function _payload(batch){
    if(!_legacy) return batch;
    return batch.map(function(r){ var c = {}; for(var k in r){ if(k!=='event_uid') c[k]=r[k]; } return c; });
  }
  // "Carta morta": o que o servidor recusou de vez fica registrado (e VISÍVEL
  // no resumo) em vez de sumir em silêncio.
  function _deadCount(){
    try { var a = JSON.parse(localStorage.getItem(DEAD_KEY) || '[]'); return Array.isArray(a) ? a.length : 0; }
    catch(e){ return 0; }
  }
  function _deadLetter(batch, status){
    try {
      var a = JSON.parse(localStorage.getItem(DEAD_KEY) || '[]');
      if(!Array.isArray(a)) a = [];
      a = a.concat(batch.map(function(r){ return {uid:r.event_uid, at:r.created_at, status:status}; })).slice(-200);
      localStorage.setItem(DEAD_KEY, JSON.stringify(a));
    } catch(e){}
    try { console.warn('[Fazenda37C] '+batch.length+' evento(s) recusados pelo servidor (HTTP '+status+
      '). Rode supabase/schema.sql. Eventos continuam no histórico local.'); } catch(e){}
  }

  function _readOutbox(){
    try { const a = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch(e){ return []; }
  }
  function _writeOutbox(arr){
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(arr.slice(-OUTBOX_MAX))); } catch(e){}
  }
  function _enqueue(record){
    const box = _readOutbox();
    box.push(record);
    _writeOutbox(box);
  }
  function _forClass(record, code){
    return !!record && typeof record.class_code === 'string'
      && record.class_code.trim().toUpperCase() === code;
  }
  function _removeConfirmed(batch){
    // O lote pode estar intercalado com pendências de outras turmas. Remover
    // por posição apagaria eventos que não foram enviados. Um multiconjunto
    // também preserva respostas novas adicionadas enquanto o POST aguardava.
    const confirmed = new Map();
    for(const record of batch){
      const key = JSON.stringify(record);
      confirmed.set(key, (confirmed.get(key) || 0) + 1);
    }
    const rest = _readOutbox().filter(record=>{
      const key = JSON.stringify(record), count = confirmed.get(key) || 0;
      if(!count) return true;
      confirmed.set(key, count - 1);
      return false;
    });
    _writeOutbox(rest);
    return rest;
  }
  function _scheduleRetry(){
    // backoff exponencial: 5s, 10s, 20s… até 5 min (não martela a rede)
    _retryMs = _retryMs ? Math.min(_retryMs * 2, 300000) : 5000;
    clearTimeout(_retryTimer);
    _retryTimer = setTimeout(()=>{ _retryTimer = null; flushOutbox(); }, _retryMs);
  }
  async function flushOutbox(){
    if(_flushing) return;
    if(!isCloudEnabled() || !_consent || !_classCode) return;
    if(typeof navigator !== 'undefined' && navigator.onLine === false){ _scheduleRetry(); return; }
    // Consentimento e turma são as autorizações ATUAIS deste aparelho. Uma
    // turma nova não autoriza drenar respostas antigas de outras turmas.
    // Essas pendências permanecem guardadas para eventual retomada autorizada.
    const batch = _readOutbox().filter(record=>_forClass(record, _classCode)).slice(0, BATCH_MAX);
    if(!batch.length){ _retryMs = 0; return; }
    _flushing = true;
    try {
      const cfg = getConfig();
      // on_conflict + ignore-duplicates ⇒ reenviar o MESMO evento não duplica.
      const res = await fetch(_endpoint(cfg), {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': 'Bearer ' + cfg.key,
          'Content-Type': 'application/json',
          'Prefer': _preferHeader()
        },
        body: JSON.stringify(_payload(batch))
      });
      if(res && res.ok){
        const rest = _removeConfirmed(batch);
        _retryMs = 0;
        if(_consent && _classCode && rest.some(record=>_forClass(record, _classCode))) setTimeout(flushOutbox, 300);
      } else if(res && res.status >= 400 && res.status < 500 && res.status !== 429){
        if(!_legacy){
          // Provável banco sem a coluna event_uid (migração não rodada).
          // NÃO descarta: passa ao formato antigo e tenta de novo. Antes daqui
          // um 400 esvaziava a fila em silêncio e o resumo dizia "0 pendentes".
          _setLegacy(true);
          _retryMs = 0;
          setTimeout(flushOutbox, 200);
        } else {
          // Já no formato antigo e ainda recusado → é payload/policy inválido.
          // Registra como recusado (fica VISÍVEL em dataSummary) e segue, para
          // um lote ruim não travar a fila para sempre.
          _deadLetter(batch, res.status);
          _removeConfirmed(batch);
          _retryMs = 0;
        }
      } else {
        _scheduleRetry();   // 5xx / rede instável
      }
    } catch(e){
      _scheduleRetry();     // offline / DNS / CORS
    } finally {
      _flushing = false;
    }
  }
  function outboxSize(){ return _readOutbox().length; }

  // Reenvia ao voltar a conexão, ao abrir o jogo e periodicamente.
  if(typeof window !== 'undefined'){
    window.addEventListener('online', ()=>{ _retryMs = 0; flushOutbox(); });
    setTimeout(flushOutbox, 3000);
    setInterval(flushOutbox, 60000);
  }

  // ---- Fetch events for a class (teacher dashboard) ----
  // Modelo SEGURO (RLS "só inserir"): a chave anon NÃO lê o banco. Então uma
  // tentativa de leitura volta vazia — e caímos para o histórico LOCAL deste
  // aparelho. A leitura da turma inteira é feita pelo professor LOGADO no
  // painel do Supabase (a chave de leitura nunca é distribuída no jogo).
  async function fetchEvents(classCode){
    const code = (classCode||'').trim().toUpperCase();
    if(isCloudEnabled()){
      const cfg = getConfig();
      try {
        const q = code
          ? `?class_code=eq.${encodeURIComponent(code)}&select=*&order=created_at.desc&limit=5000`
          : `?select=*&order=created_at.desc&limit=5000`;
        const res = await fetch(cfg.url + '/rest/v1/quiz_events' + q, {
          headers: { 'apikey': cfg.key, 'Authorization': 'Bearer ' + cfg.key }
        });
        if(res.ok){
          const rows = await res.json();
          // Se o RLS estiver correto (só inserir), 'rows' vem vazio → usa o local.
          if(Array.isArray(rows) && rows.length) return rows;
        }
      } catch(e){}
    }
    // Fallback: eventos locais deste aparelho
    const local = _readLocal();
    return code ? local.filter(e => (e.class_code||'').toUpperCase() === code) : local;
  }

  // ---- Aggregate into dashboard metrics ----
  function aggregate(events){
    const students = {};      // name -> stats
    const concepts = {};      // concept -> {wrong, total}
    let totalAnswered = 0, totalCorrect = 0;

    for(const e of events){
      totalAnswered++;
      if(e.correct) totalCorrect++;
      // per student
      const s = students[e.student_name] || (students[e.student_name] = {
        name: e.student_name, answered: 0, correct: 0, score: 0,
        byDiff: { basico:{a:0,c:0}, intermediario:{a:0,c:0}, avancado:{a:0,c:0} }
      });
      s.answered++;
      if(e.correct) s.correct++;
      s.score += (e.score || 0);
      const d = e.difficulty || 'basico';
      if(s.byDiff[d]){ s.byDiff[d].a++; if(e.correct) s.byDiff[d].c++; }
      // per concept (track errors)
      const c = concepts[e.concept] || (concepts[e.concept] = { concept: e.concept, wrong: 0, total: 0 });
      c.total++;
      if(!e.correct) c.wrong++;
    }

    // Ranking: by score desc, then accuracy
    const ranking = Object.values(students).map(s => ({
      ...s,
      accuracy: s.answered ? Math.round(s.correct / s.answered * 100) : 0
    })).sort((a,b) => b.score - a.score || b.accuracy - a.accuracy);

    // Concepts most-missed: by wrong count desc
    const missedConcepts = Object.values(concepts)
      .filter(c => c.wrong > 0)
      .map(c => ({ ...c, errorRate: c.total ? Math.round(c.wrong / c.total * 100) : 0 }))
      .sort((a,b) => b.wrong - a.wrong || b.errorRate - a.errorRate);

    return {
      totalAnswered, totalCorrect,
      classAccuracy: totalAnswered ? Math.round(totalCorrect / totalAnswered * 100) : 0,
      studentCount: ranking.length,
      ranking, missedConcepts
    };
  }

  function clearLocalEvents(){ _writeLocal([]); }

  // ---- LGPD: exclusão total dos dados deste aparelho (art. 18) ----
  // Apaga eventos, código de turma e consentimento guardados localmente.
  // (Dados já enviados à nuvem devem ser excluídos pelo controlador/professor.)
  function clearAllData(){
    _writeLocal([]);
    setClassCode(null);
    setConsent(false);
    try { localStorage.removeItem(LOCAL_KEY); } catch(e){}
    // a fila pendente também some (senão dados "excluídos" ainda subiriam depois)
    try { localStorage.removeItem(OUTBOX_KEY); } catch(e){}
    try { localStorage.removeItem(DEAD_KEY); } catch(e){}
    clearTimeout(_retryTimer); _retryTimer = null; _retryMs = 0;
    return true;
  }

  // ---- LGPD: resumo do que está guardado neste aparelho (art. 18 — acesso) ----
  function dataSummary(){
    return {
      eventos: _readLocal().length,
      codigoTurma: _classCode || null,
      consentimento: _consent,
      nuvemConfigurada: isCloudEnabled(),
      pendentesEnvio: outboxSize(),   // ainda não confirmados na nuvem
      recusadosPeloServidor: _deadCount(),  // NUNCA some em silêncio
      modoCompatibilidade: _legacy    // true = banco sem event_uid (rode schema.sql)
    };
  }

  window.TeacherMode = {
    setClassCode, getClassCode,
    setConsent, getConsent,
    submitQuizEvent, fetchEvents, aggregate,
    setConfig, getConfig, isCloudEnabled,
    clearLocalEvents, clearAllData, dataSummary,
    flushOutbox, outboxSize,   // fila de reenvio (resiliência de rede)
    _readLocal,  // exposed for debugging
  };
})();
