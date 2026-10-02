/* ============================================================
   Thermal feedback UI — drives the CSS overlay every frame.
   Maps player.temp and player.hyd to:
     --hyper-intensity   red flush (vasodilatação)
     --hypo-intensity    blue pallor (vasoconstrição)
     --critical-pulse    danger heartbeat ring
   Adds body.shivering when vasoconstriction is severe.

   Depends on: `player` global (defined later in main script).
   Exposes:   window.updateThermalUI, window.resetThermalUI
   ============================================================ */
(function(){
  const _thermalUI = { hyper: 0, hypo: 0, pulse: 0, bodyClass: '' };
  function _smooth(prev, target, rate){ return prev + (target - prev) * Math.min(1, rate); }

  function updateThermalUI(){
    if(typeof player === 'undefined' || !player) return;
    const root = document.documentElement;
    const body = document.body;
    // ----- Heat (vasodilation): starts at 38.0, max at 40.5
    const heatTarget = Math.max(0, Math.min(1, (player.temp - 38.0) / 2.5));
    // ----- Cold (vasoconstriction): starts at 36.5, max at 35.0
    const coldTarget = Math.max(0, Math.min(1, (36.5 - player.temp) / 1.5));
    // ----- Critical pulse: hyperthermia >= 39.7 OR hypothermia <= 35.5
    //                       OR severe dehydration (hyd < 15) on hot map
    const hyperCritical = player.temp >= 39.7;
    const hypoCritical  = player.temp <= 35.5;
    const dehydration   = player.hyd  < 15 && typeof isFrio === 'function' && !isFrio();
    const dangerNow     = hyperCritical || hypoCritical || dehydration ? 1 : 0;

    _thermalUI.hyper = _smooth(_thermalUI.hyper, heatTarget, 0.08);
    _thermalUI.hypo  = _smooth(_thermalUI.hypo,  coldTarget, 0.08);
    _thermalUI.pulse = _smooth(_thermalUI.pulse, dangerNow,  0.12);

    const eps = (v)=> v < 0.01 ? 0 : v;
    root.style.setProperty('--hyper-intensity',   eps(_thermalUI.hyper).toFixed(3));
    root.style.setProperty('--hypo-intensity',    eps(_thermalUI.hypo).toFixed(3));
    root.style.setProperty('--critical-pulse',    eps(_thermalUI.pulse).toFixed(3));

    let nextClass = '';
    if(_thermalUI.hypo > 0.55 && !player.resting){
      nextClass = _thermalUI.hypo > 0.85 ? 'shivering-strong' : 'shivering';
    }
    if(nextClass !== _thermalUI.bodyClass){
      body.classList.remove('shivering','shivering-strong');
      if(nextClass) body.classList.add(nextClass);
      _thermalUI.bodyClass = nextClass;
    }
  }

  function resetThermalUI(){
    _thermalUI.hyper = _thermalUI.hypo = _thermalUI.pulse = 0;
    document.documentElement.style.setProperty('--hyper-intensity', '0');
    document.documentElement.style.setProperty('--hypo-intensity',  '0');
    document.documentElement.style.setProperty('--critical-pulse',  '0');
    document.body.classList.remove('shivering','shivering-strong');
    _thermalUI.bodyClass = '';
  }

  window.updateThermalUI = updateThermalUI;
  window.resetThermalUI = resetThermalUI;
})();
