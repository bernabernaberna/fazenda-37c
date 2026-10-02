# Créditos e Licenças — Fazenda 37 °C

**Estado da distribuição de 02/10/2026:** o jogo atual usa áudio gerado por
código (`70-synth-sfx.js`, `71-original-audio.js`, `90-ambient-synth.js` e a
trilha `AmbientMusic`). As 20 chaves do banco original usam fórmulas, ruído
com sementes próprias e envelopes, sem gravações externas. O empacotador
inclui apenas arquivos de áudio efetivamente referenciados; nesta versão,
nenhum OGG é distribuído. A pasta histórica `audio/` foi preservada no projeto.
Os registros pendentes abaixo se referem a esses arquivos históricos e não
atestam suas licenças. Não reutilizá-los numa distribuição sem confirmar origem.

> Documento de controle de propriedade intelectual de terceiros usada no jogo.
> Objetivo: garantir que **todo** asset distribuído tenha origem e licença conhecidas
> **antes de um lançamento oficial** — em especial se houver monetização.
>
> ⚠️ **Campos marcados com `[CONFIRMAR]` precisam ser preenchidos por você.**
> A licença de cada som do Freesound varia por upload e **não pode ser presumida** —
> é preciso abrir a página de cada arquivo e copiar a licença exata.

---

## 1. Áudio

### 1.1 Arquivos históricos do Freesound (fora da distribuição atual)

| Som no jogo | Arquivo original | Autor (Freesound) | Página (URL) | Licença | Exige atribuição? | OK p/ uso comercial? |
|---|---|---|---|---|---|---|
| Ambiente da fazenda (`farm_ambience.ogg`) | ambience_farm_05.wav | BenDrain | `[CONFIRMAR: link]` | `[CONFIRMAR]` | `[CONFIRMAR]` | `[CONFIRMAR]` |
| Passos na grama (`dirt_steps.ogg`) | dry-grass-steps.wav | qubodup | `[CONFIRMAR: link]` | `[CONFIRMAR]` | `[CONFIRMAR]` | `[CONFIRMAR]` |
| Respiração ofegante (`heavy_breathing.ogg`) | heavy-breathing-owi.wav | StrayNerd | `[CONFIRMAR: link]` | `[CONFIRMAR]` | `[CONFIRMAR]` | `[CONFIRMAR]` |
| Dentes batendo (`teeth_chatter.ogg`) | 20080103teethchatter02faster.wav | dobroide | `[CONFIRMAR: link]` | `[CONFIRMAR]` | `[CONFIRMAR]` | `[CONFIRMAR]` |
| Vento frio / neve (`cold_wind.ogg`) | cold-snowy-wind.wav | cgifox9 | `[CONFIRMAR: link]` | `[CONFIRMAR]` | `[CONFIRMAR]` | `[CONFIRMAR]` |

**Como preencher:** abra cada arquivo em freesound.org, e na página veja o campo **License**.
As licenças mais comuns e o que cada uma exige:

| Licença | Pode usar comercial? | Atribuição obrigatória? | Observação |
|---|---|---|---|
| **CC0 / Public Domain** | ✅ Sim | Não (mas é educado creditar) | Mais livre possível. |
| **CC BY (Attribution)** | ✅ Sim | ✅ Sim, no formato exigido | Precisa creditar autor + licença + link + dizer se modificou. |
| **CC BY-NC (NonCommercial)** | ❌ **NÃO** | ✅ Sim | **Se for vender/monetizar o jogo, este som tem que ser SUBSTITUÍDO.** |
| **CC Sampling+** | Depende | ✅ Sim | Ler termos específicos. |

**Formato de atribuição recomendado (para CC BY):**
> "[Nome do som]" por [autor] — Freesound ([URL]) — licenciado sob [licença] ([URL da licença]). Modificado (convertido para .ogg / cortado) para uso no jogo.

### 1.2 Banco sintetizado atual
Ambientes, passos, respiração estilizada, dentes batendo, pulsação e as dez
ações são gerados em `71-original-audio.js`. Interface e quiz usam também o
módulo 70; água/grilos, o módulo 90; a trilha é gerada por `AmbientMusic`.
O código não carrega amostras nem gravações de terceiros. A regressão
`tools/validar-audio-original.cjs` verifica 20 sinais, reprodução, volumes,
loops e limpeza. A escuta humana no aparelho da apresentação permanece um
ensaio recomendado; testes de sinal não avaliam a qualidade percebida.

---

## 2. Fontes (tipografia)

| Fonte | Onde é usada | Situação |
|---|---|---|
| **Trebuchet MS** | UI geral (CSS) | Fonte da Microsoft. Usada só como *fallback* que aciona a fonte **instalada no dispositivo do usuário** — o arquivo `.ttf` **não é embutido/distribuído**. ✅ OK enquanto continuar assim. **Não embutir o .ttf.** |
| **JetBrains Mono / ui-monospace** | trechos monoespaçados | Licença aberta (Apache/SIL) e/ou fonte do sistema. ✅ OK. |

🔁 **Recomendação:** se quiser blindar 100%, troque Trebuchet MS por uma fonte de
licença aberta (ex.: do Google Fonts) e embuta você mesmo — aí não depende da fonte
instalada no aparelho de cada aluno.

---

## 3. Dependências externas (runtime)

| Recurso | Uso | Situação |
|---|---|---|
| **Supabase** (opcional) | Modo Professor — nuvem de desempenho dos alunos | Serviço de terceiros. Ver implicações de **dados pessoais** em `POLITICA-DE-PRIVACIDADE-LGPD.md`. Revisar os Termos de Uso do Supabase. |
| Emojis (UI/ícones) | ícones de itens e avisos | Renderizados pela fonte de emoji do sistema operacional. Sem arquivo distribuído. ✅ |

O jogo distribuído (`Fazenda37C-standalone.html` / `jogo.html`) é **autocontido**:
não carrega bibliotecas de terceiros por CDN. ✅

---

## 4. Arte atual e narrativa

Os terrenos, construções, vegetação e animais atuais são desenhados por código
em `27-world-art.js`. O personagem jogável e os seis moradores, suas animações
e retratos são desenhados em `28-character-art.js`. A direção usa uma paleta
rural de verde sálvia, ocre, terracota e azul; não foram importadas folhas de
sprites, modelos ou texturas externas nesta versão.

A história **O Vale dos Três Ventos**, seus personagens e falas são ficção criada
para o projeto em `14-story-world.js`; os diálogos são textos predefinidos e
funcionam offline. O código de desenho anterior permanece como fallback na
fonte. Notas antigas sobre esse desenho não descrevem os sprites da versão atual.
Os detalhes de produção estão em `analise/DIRECAO-ARTE.md`,
`analise/ARTE-PERSONAGENS.md` e `analise/HISTORIA-DO-VALE.md`.

---

## 5. Conteúdo educacional (biologia / fisiologia)

O conteúdo de histologia e termorregulação é didático e simplificado. Antes do
lançamento:
- [x] Fontes das correções atuais estão em `analise/AUDITORIA-PEDAGOGICA.md`
  e no manual. O documento docente inclui todos os 43 itens e seus dois feedbacks.
- [ ] Registrar a revisão humana do banco final e completar a bibliografia do projeto.
- [x] Incluir aviso: *"Conteúdo educativo com simplificações didáticas. Não substitui
      orientação médica."*

---

## 6. Checklist antes do lançamento comercial

- [x] Gravações históricas excluídas do jogo e da distribuição atual; banco procedural documentado.
- [ ] Se algum arquivo histórico voltar à distribuição, confirmar sua licença e atribuição primeiro.
- [ ] Fonte tipográfica: ou só *fallback* de sistema, ou fonte de licença aberta embutida.
- [ ] Arte do personagem revisada quanto à originalidade.
- [ ] Fontes do conteúdo educacional listadas + disclaimer incluído.
- [ ] Termos do Supabase revisados (se a nuvem for usada).

---

*Última atualização: 02/10/2026. Mantenha este arquivo versionado junto ao código.*
