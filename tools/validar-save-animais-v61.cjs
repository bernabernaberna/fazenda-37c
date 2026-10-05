/* Regressão da saciedade: cuidado pago, reload real e saves antigos por stateId.
   Posições e materiais preparados; E, botão de cuidado e Continuar são reais. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const raiz = path.resolve(__dirname, '..');
const pasta = path.join(raiz, 'analise', 'save-animais-v61');
const base = process.env.FARM37_URL || 'http://127.0.0.1:8766';
const origem = new URL(base).origin;
const hash = dados => crypto.createHash('sha256').update(dados).digest('hex');
const copiar = dados => JSON.parse(JSON.stringify(dados));
const relatorio = {
  geradoEm: new Date().toISOString(),
  metodo: 'Playwright/Edge isolado; RAF parado; cuidado por E e botão; page.reload e Continuar; sem backend.',
  testeSHA256: hash(fs.readFileSync(__filename)),
  checagens: [], erros: [], externos: [], capturas: [],
  limites: ['Posições e materiais são preparados para isolar persistência; não representa uma partida humana completa.']
};
let navegador, pagina;
fs.mkdirSync(pasta, { recursive: true });

function conferir(nome, passou, evidencia) {
  relatorio.checagens.push({ nome, passou: !!passou, evidencia });
  assert.ok(passou, nome);
}

async function estado() {
  return pagina.evaluate(() => ({
    animais: keyedObjectStates(scenes.main.objects).filter(({ o }) => o.type === 'animal')
      .map(({ o, key }) => ({ stateId: key, kind: o.kind, well: o.well, shorn: !!o.shorn }))
      .sort((a, b) => a.stateId.localeCompare(b.stateId)),
    feno: player.inv.hay, agua: player.inv.water, moedas: player.coins,
    producao: FarmLife.serialize().production,
    estoque: FarmLife.serialize().stock,
    podeCuidar: FarmLife.snapshot().corral.canCare,
    jogoIniciado: gameStarted
  }));
}

function bemEstar(animais) {
  return Object.fromEntries(animais.map(a => [a.stateId, a.well]));
}

async function salvar() {
  return pagina.evaluate(() => {
    if (!saveGame(true)) throw Error('Salvar o jogo falhou.');
    return JSON.parse(localStorage.getItem(SAVE_KEY));
  });
}

async function recarregarEContinuar(dados) {
  if (dados) await pagina.evaluate(dados => localStorage.setItem(SAVE_KEY, JSON.stringify(dados)), dados);
  const resposta = await pagina.reload();
  assert.equal(hash(await resposta.body()), relatorio.jogoSHA256, 'O build mudou durante a regressão.');
  await pagina.locator('#continueBtn').click();
  await pagina.waitForFunction(() => gameStarted && document.getElementById('startMenu').classList.contains('hide'));
  return estado();
}

async function capturar(nome, canvas = false) {
  const arquivo = path.join(pasta, nome + '.png');
  if (canvas) {
    const pixels = await pagina.evaluate(() => { render(); return document.getElementById('game').toDataURL('image/png').split(',')[1]; });
    fs.writeFileSync(arquivo, Buffer.from(pixels, 'base64'));
  } else await pagina.screenshot({ path: arquivo });
  relatorio.capturas.push({ arquivo, SHA256: hash(fs.readFileSync(arquivo)), canvas });
}

(async () => {
  navegador = await chromium.launch({ channel: 'msedge', headless: true });
  pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
  pagina.on('pageerror', erro => relatorio.erros.push(erro.message));
  await pagina.addInitScript(() => {
    requestAnimationFrame = () => 0;
    localStorage.setItem('farm37_seen_intro', '1');
  });
  await pagina.route('**/*', rota => {
    const url = new URL(rota.request().url());
    if (url.origin === origem) return rota.continue();
    relatorio.externos.push(url.href);
    return rota.abort();
  });
  const resposta = await pagina.goto(base.replace(/\/$/, '') + '/jogo.html?v=save-animais-v61-' + Date.now());
  const html = await resposta.body();
  relatorio.jogoSHA256 = hash(html);
  relatorio.jogoSHA1 = crypto.createHash('sha1').update(html).digest('hex');
  await pagina.evaluate(() => {
    startGame(true); _pendingTutorialAfterCutscene = false; endCutscene(); skipTutorial();
    FarmStoryUI.close(); FarmValleyPanels.close(false); FarmStoryCinematics.reset();
    isPaused = false; histologyMissionOpen = false; histologyMissionQueue.length = 0;
    _lastHistMissionAt = 1e9; A11Y.noDeath = true; currentWeather = null; weatherCooldown = 1e9;
    player.inv.hay = 10; player.inv.water = 5; player.resting = false;
    for (const animal of scenes.main.objects.filter(o => o.type === 'animal')) animal.well = .2;
    const curral = scenes.main.objects.find(o => o.type === 'farm_life_station' && o.stationId === 'curral');
    let ponto = null;
    for (let dy = -24; dy <= 24 && !ponto; dy += 4) for (let dx = -24; dx <= 24; dx += 4) {
      if (Math.hypot(dx, dy) > 24) continue;
      player.x = curral.x + dx; player.y = curral.y + dy;
      if (!FarmWorldDepth.isBlocked(player.x, player.y) && nearObj(Object.keys(INTERACTION_HANDLERS), 26) === curral) {
        ponto = { x: player.x, y: player.y }; break;
      }
    }
    if (!ponto) throw Error('Não foi encontrada uma aproximação livre ao curral.');
    document.getElementById('game').focus(); snapCamera(); render();
  });

  const antes = await estado();
  conferir('Curral tem animais famintos e cuidado disponível', antes.animais.length >= 5 && antes.animais.every(a => a.well === .2) && antes.podeCuidar, antes);
  await pagina.keyboard.press('e');
  conferir('E abre o cuidado na estação física', await pagina.evaluate(() => FarmValleyPanels.isOpen() && FarmValleyPanels.snapshot().farmSection === 'production'));
  await pagina.locator('[data-valley-action="care:curral"]').click();
  const cuidado = await estado();
  conferir('Cuidado real consome dois fenos e uma água sem cobrar moedas', cuidado.feno === antes.feno - 2 && cuidado.agua === antes.agua - 1 && cuidado.moedas === antes.moedas, { antes, cuidado });
  conferir('Cuidado recupera todos os animais e impede consumo desnecessário', cuidado.animais.every(a => a.well === 1) && !cuidado.podeCuidar && await pagina.locator('[data-valley-action="care:curral"]').isDisabled(), cuidado.animais);
  await pagina.locator('[data-valley-action="care:curral"]').evaluate(botao => botao.closest('section').scrollIntoView({ block: 'center' }));
  await capturar('cuidado-curral-interface');
  await pagina.keyboard.press('Escape');
  await capturar('cuidado-curral-canvas', true);
  const salvoCuidado = await salvar();
  const registrosCuidado = salvoCuidado.objects.filter(o => o.type === 'animal');
  conferir('Save grava saciedade e identidade de cada animal', registrosCuidado.length === cuidado.animais.length && registrosCuidado.every(a => typeof a.stateId === 'string' && a.well === 1), registrosCuidado);
  const aposReload = await recarregarEContinuar();
  conferir('Reload real e Continuar preservam cuidado e custos sem novo pagamento', aposReload.jogoIniciado && isDeepStrictEqual(aposReload.animais, cuidado.animais) && aposReload.feno === cuidado.feno && aposReload.agua === cuidado.agua && aposReload.moedas === cuidado.moedas && !aposReload.podeCuidar, aposReload);

  await pagina.evaluate(() => {
    const animais = scenes.main.objects.filter(o => o.type === 'animal');
    animais.forEach((animal, i) => { animal.well = i % 2 ? .2 : 0; });
  });
  const fome = await estado();
  const salvoFome = await salvar();
  const fomeRecarregada = await recarregarEContinuar();
  conferir('Fome zero e 0,2 sobrevivem ao reload sem retornar a 0,85', isDeepStrictEqual(bemEstar(fomeRecarregada.animais), bemEstar(fome.animais)) && fomeRecarregada.animais.some(a => a.well === 0) && fomeRecarregada.animais.some(a => a.well === .2), fomeRecarregada.animais);
  await pagina.evaluate(() => { for (let i = 0; i < 110; i++) FarmLife.update(1); });
  const semProducaoGratuita = await estado();
  conferir('Reload de animais famintos não reativa leite nem ovos', isDeepStrictEqual(semProducaoGratuita.producao.leite, fomeRecarregada.producao.leite) && isDeepStrictEqual(semProducaoGratuita.producao.ovos, fomeRecarregada.producao.ovos), { antes: fomeRecarregada.producao, depois: semProducaoGratuita.producao });

  const ordem = copiar(salvoFome);
  const distintos = ordem.objects.filter(o => o.type === 'animal');
  distintos.forEach((animal, i) => { animal.well = (i + 1) / 10; animal.shorn = i % 2 === 0; });
  const esperadosPorId = Object.fromEntries(distintos.map(a => [a.stateId, { well: a.well, shorn: a.shorn }]));
  ordem.objects.reverse();
  const invertido = await recarregarEContinuar(ordem);
  conferir('Ordem invertida restaura animais por stateId, inclusive espécies repetidas', invertido.animais.every(a => a.well === esperadosPorId[a.stateId].well && a.shorn === esperadosPorId[a.stateId].shorn), { esperadosPorId, restaurados: invertido.animais });

  const antigo = copiar(salvoFome);
  for (const objeto of antigo.objects) if (objeto.type === 'animal') delete objeto.well;
  await pagina.evaluate(antigo => {
    for (const animal of scenes.main.objects.filter(o => o.type === 'animal')) animal.well = 0;
    loadGameFromData(antigo);
  }, antigo);
  const antigoMesmaPagina = await estado();
  conferir('Save antigo sem well usa 0,85 mesmo na mesma página antes faminta', antigoMesmaPagina.animais.every(a => a.well === .85), antigoMesmaPagina.animais);
  const antigoReload = await recarregarEContinuar(antigo);
  conferir('Save antigo também mantém o padrão após reload e Continuar', antigoReload.animais.every(a => a.well === .85), antigoReload.animais);

  const malformado = copiar(salvoFome);
  const valores = [-4, 7, null, '0.2'];
  const saneados = [0, 1, .85, .85];
  const esperadoMalformado = {};
  malformado.objects.filter(o => o.type === 'animal').forEach((animal, i) => {
    if (i < valores.length) animal.well = valores[i]; else delete animal.well;
    esperadoMalformado[animal.stateId] = saneados[i] ?? .85;
  });
  const limiteReload = await recarregarEContinuar(malformado);
  conferir('Load limita negativos/acima de um e usa 0,85 para null, string e ausente', isDeepStrictEqual(bemEstar(limiteReload.animais), esperadoMalformado), { esperadoMalformado, restaurados: limiteReload.animais });
  const escritor = await pagina.evaluate(() => {
    const valores = [-4, 7, null, '0.2', NaN];
    scenes.main.objects.filter(o => o.type === 'animal').forEach((animal, i) => { animal.well = valores[i]; });
    saveGame(true);
    return JSON.parse(localStorage.getItem(SAVE_KEY)).objects.filter(o => o.type === 'animal');
  });
  conferir('Save também limita valores e não grava saciedade inválida', escritor.every((a, i) => a.well === ([0, 1, .85, .85, .85][i] ?? .85)), escritor);
  conferir('Nenhum erro de runtime ou dependência externa', relatorio.erros.length === 0 && relatorio.externos.length === 0, { erros: relatorio.erros, externos: relatorio.externos });
  relatorio.passou = true;
})().catch(async erro => {
  relatorio.passou = false; relatorio.falha = erro.stack; process.exitCode = 1;
  relatorio.estado = await estado().catch(() => null);
  if (pagina) await capturar('falha').catch(() => {});
}).finally(async () => {
  const arquivo = path.join(pasta, 'save-animais-v61.json');
  fs.writeFileSync(arquivo, JSON.stringify(relatorio, null, 2));
  console.log(JSON.stringify({ passou: relatorio.passou, checagens: relatorio.checagens.length, jogoSHA1: relatorio.jogoSHA1, jogoSHA256: relatorio.jogoSHA256, relatorio: arquivo, relatorioSHA256: hash(fs.readFileSync(arquivo)), capturas: relatorio.capturas, falha: relatorio.falha }, null, 2));
  await navegador?.close();
});
