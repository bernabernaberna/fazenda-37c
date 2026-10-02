/* Diagnóstico do balanço térmico: usa os efeitos realmente aplicados pelo jogo.
   Transitório (não vai no save); a simulação continua sendo a fonte de verdade. */
(function(){
  const estado = { inicio:37, dt:0, termos:[], taxa:0, sentido:0, pronto:false };
  let linha, tendencia, causa;
  function texto(el, valor){ if(el && el.textContent!==valor) el.textContent=valor; }
  window.FarmThermalFeedback = {
    reset(){ estado.dt=0; estado.termos=[]; estado.taxa=0; estado.sentido=0; estado.pronto=false; },
    begin(temp, dt){ estado.inicio=temp; estado.dt=dt; estado.termos=[]; },
    add(rotulo, taxa){ if(Number.isFinite(taxa) && Math.abs(taxa)>0.00001) estado.termos.push({rotulo, taxa}); },
    reconcile(temp, rotulo){
      if(estado.dt>0){
        const soma=estado.termos.reduce((total,t)=>total+t.taxa,0);
        this.add(rotulo,(temp-estado.inicio)/estado.dt-soma);
      }
    },
    finish(temp){
      if(estado.dt<=0) return;
      estado.taxa=(temp-estado.inicio)/estado.dt;
      const modulo=Math.abs(estado.taxa);
      // Histerese apenas perto de zero; uma inversão clara aparece imediatamente.
      estado.sentido = modulo < (estado.sentido ? 0.0015 : 0.003) ? 0 : Math.sign(estado.taxa);
      estado.pronto=true;
    },
    snapshot(){ return {...estado, termos:estado.termos.map(t=>({...t}))}; },
    draw({ativo, suspenso, morto}){
      if(!linha){
        linha=document.getElementById('thermalFeedback');
        tendencia=document.getElementById('thermalTrend');
        causa=document.getElementById('thermalCause');
      }
      if(!linha) return;
      let titulo, motivo, direcao='stable';
      if(morto){ titulo='Simulação encerrada'; motivo='Renasça para continuar'; }
      else if(suspenso && ativo){ titulo='Ⅱ Simulação pausada'; motivo='A temperatura fica em pausa'; }
      else if(!ativo || !estado.pronto){ titulo='→ Observe a temperatura'; motivo='Sol, abrigo e esforço mudam o equilíbrio'; }
      else if(!estado.sentido){ titulo='→ Estável'; motivo='Efeitos térmicos em equilíbrio'; }
      else {
        const porRotulo=new Map();
        for(const t of estado.termos) porRotulo.set(t.rotulo,(porRotulo.get(t.rotulo)||0)+t.taxa);
        const principais=[...porRotulo].filter(([,taxa])=>Math.sign(taxa)===estado.sentido)
          .sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
        titulo=estado.sentido>0 ? '↑ Subindo' : '↓ Caindo';
        direcao=estado.sentido>0 ? 'warming' : 'cooling';
        motivo=principais.length ? principais[0][0] : 'Balanço térmico do corpo';
        if(principais[1] && Math.abs(principais[1][1])>=Math.abs(principais[0][1])*0.6){
          motivo+=' · '+principais[1][0];
        }
      }
      texto(tendencia,titulo); texto(causa,motivo);
      if(linha.dataset.direction!==direcao) linha.dataset.direction=direcao;
      const detalhes=(!ativo || suspenso || morto || !estado.pronto) ? titulo :
        'Efeitos agora: '+estado.termos.map(t=>(t.taxa>0?'↑ ':'↓ ')+t.rotulo).join('; ');
      if(linha.title!==detalhes) linha.title=detalhes;
    }
  };
})();
