# Fazenda 37 °C — Histologia acadêmica V6.15

A escolha **Acadêmico**, na criação do personagem, nas configurações e em **Progresso → Nível de estudo**, abre 24 questões de histologia cutânea. As 43 perguntas escolares permanecem nos níveis Fundamental e Médio.

## Conteúdo e progressão

- Seis temas com quatro questões: epiderme e barreira; células e junções; derme e matriz; anexos e glândulas; receptores e vasos; reparo e integração.
- Enunciados originais de reconhecimento por descrição e relação entre estrutura e função, 96 justificativas específicas e 18 referências verificadas. Alternativas em ordem fixa, sem gabarito repetitivo, preservando os índices dos saves.
- Primeiro acerto de cada questão: 15 pontos acadêmicos, até 360. Erros podem ser revistos; revisões não repetem pontos nem moedas. O domínio permanece entre estações e níveis.
- Uma resposta acadêmica real vale nas missões de Lia que pedem quiz. Erros e cliques duplicados não cumprem esse objetivo. O estado puro de estudo não fabrica eventos narrativos.
- Atlas e relatório exibem o currículo escolhido; JSON/CSV incluem o progresso acadêmico. Questões e justificativas funcionam offline; os links de referência precisam de internet.
- Save v2 mantém os campos existentes e acrescenta nível e progresso acadêmico opcionais. Saves antigos iniciam o currículo vazio, preservando fazenda, inventário e progresso escolar. Novo jogo limpa ambos os currículos.
- Leitura pausa corpo, relógios, clima, animais e produção. O diálogo mantém foco e Tab contido; Escape permite sair. Explicações extensas usam rolagem no celular.

## Validação final

Build `90f7d4076b`; SHA256 `6d8b5e0a3b80f4e8fed14d0041042ef28a249e709b2e0844e9d7b6dbc0578c4a`.

- 34/34 suítes aprovadas no mesmo build: mapa, portas, cultivos, inventário, animais, personagens, história, saves e currículo acadêmico.
- 54/54 verificações acadêmicas e offline aprovadas: pedido real de Lia, respostas, revisão, prêmio único, currículo completo, troca de nível/estação, save antigo, recarga real e exportações.
- Standalone, completo e ZIP extraído abertos com a rede do navegador desativada.
- Seis capturas abertas em 1280×800, 1024×640 e 390×844, mostrando topo da pergunta e fim das explicações.
- 31 cenários de desempenho, incluindo o quiz acadêmico aberto e em pausa: 40 quadros de aquecimento e 180 amostras por cenário. Todos abaixo do alvo de render CPU p95 de 4 ms no Edge de referência; caches dentro dos limites.
- Zero erros JavaScript ou dependências externas nos cenários medidos. Permanece o aviso histórico sobre dois módulos opcionais ausentes.

Relatórios locais: `analise/academico-v615/resultado.json`, `analise/validacao-v615/suite.json` e `analise/desempenho-v615/render-final-v615.json`. As tentativas anteriores foram preservadas separadamente. A rodada final corresponde ao hash acima.

## Preservação e limites

A V6.14 foi copiada com manifesto verificado em `../backups/antes-academico-v615-20261021`, além do commit anterior no GitHub e da versão 17 do Site. O currículo preserva mapa, biomas, coordenadas, IDs existentes e formato base do save.

A telemetria mantém consentimento e esquema existentes: currículo identificado no conceito/ID, com enum remoto avançado. Nenhuma migração ou política do servidor foi alterada. Os testes não comprovam comportamento de contas autenticadas ou entrega em nuvem.

O nível cobre histologia cutânea universitária introdutória com aplicação, sem micrografias reais. Fontes e gabaritos foram conferidos tecnicamente, sem revisão docente, ensaio com estudantes ou validação psicométrica. O desempenho deste computador não garante o de outros aparelhos; testes preparados não substituem uma partida humana longa.
