# Além das três margens — V6.12

O mundo contíguo passa de 96×124 para 144×124 tiles. As 96 colunas anteriores
conservam tiles, objetos, portas, posições de interação e cultivos. Os interiores
continuam separados. A entrada principal segue a trilha da mata para leste.

## Exploração

- Serra dos Ecos: Observatório dos Ventos, Pedras do Eco e Acampamento da Serra.
- Campos do Vento: Moinho do Vento, Pomar das Sementes e Abrigo das Cartas.
- Costa das Conchas: Comporta Antiga, Cais das Correspondências e Pedras da Maré.

Cada local permite comparar registros ou seguir sua autoria. As observações
registram lugar, condição e interpretação; não concedem moedas. A revisão de
um local espera 90 segundos de jogo ativo. Diálogo, mapa, caderno e quiz pausam
esse relógio. Existem frutas e arbustos renováveis nas novas regiões.

## Histórias

- Rosa inicia **A carta que seguiu adiante**, com participação de Caio e Bia.
- Lia inicia **A água entre duas datas**, com participação de Helena e Davi.
- Inês inicia **O último marco também aponta a volta**, com Tomás e Nico.

Cada expedição tem duas escolhas e três etapas sequenciais. As ações contam
depois do combinado e cada etapa continua em uma conversa com sua responsável.
A entrega final paga uma vez. Escolhas, descobertas e observações aparecem no
caderno; o mapa marca destinos sem transportar o personagem ou concluir tarefas.
Duas novas cenas mostram consequências e podem ser revistas sem recompensas.

## Fontes e compatibilidade

`49-expedition-world.js` acrescenta o território após `43-open-world.js`.
`50-expedition-story.js` contém estado narrativo, registros e catálogo das cenas.
O adaptador 16 conecta eventos físicos, diálogos, pausas e persistência.
O save continua v2; `expeditionStory` é opcional e ausente em saves anteriores.
Não há dependências, serviços ou assets externos novos.

As três regiões têm misturas térmicas graduais e ambiências baseadas no banco
procedural original. O cache estático e a redução de movimento permanecem ativos.
Testes e capturas registram o hash da build; resultados técnicos não substituem
avaliação docente ou uma partida humana longa.
