# Fazenda 37 °C — O Vale dos Três Ventos

Jogo educativo em português, feito com HTML e Canvas 2D. Explore um mundo
contínuo de **96 × 124 tiles**, com fazenda, montanha, deserto e dois novos
biomas: **Mata das Nascentes** e **Veredas do Sul**. Converse com nove moradores
e cuide dos animais enquanto aprende sobre a pele e a termorregulação.
A história acompanha a reabertura da Casa das Sementes e os caminhos da água;
a exploração continua depois dos desfechos.

Os seis moradores originais têm **18 lembranças para descobrir e 36 respostas possíveis**.
Suas escolhas ficam no diário, reaparecem nas conversas e abrem histórias
depois da reabertura. Os NPCs também comentam ações recentes do jogador.

**O que o vento guardou** acompanha o retorno de Alex Vale, uma pessoa de
humor seco e forte lealdade que precisa aprender a pedir ajuda. O mistério
acolhedor tem oito episódios com decisões que alteram os próximos objetivos,
seis arcos pessoais em duas etapas, sete pistas e um diário de consequências.
O **Caderno de Alex** mostra a história, os moradores e a vida na fazenda.

Na expansão **Caminhos da água**, Alex reencontra Helena, sua antiga companheira
de estrada, conhece Davi, zelador dos canais, e Bia, cultivadora da clareira.
São **oito novas missões com escolhas e três pedidos renováveis por estação**.
Compare marcas na nascente, acompanhe o nível da vereda e investigue a origem
das sementes. Os novos moradores têm retratos, rotinas, histórias próprias
e respostas que acompanham seus combinados. As escolhas deixam consequências
no diário e nas conversas.

Recupere oficina, cozinha, apiário e irrigação. Prepare seis receitas,
recolha frutas, leite, ovos e mel, cuide do curral e entregue encomendas.
As obras já prontas podem receber manutenção com efeitos reais. A exploração
e os pedidos continuam depois do desfecho, sem um limite de duração da partida.

A **Visão da Pele (H)** apresenta oito estruturas e sua relação com tecidos,
células e termorregulação. Compare calor, frio, esforço e descanso, registre
observações reais e resolva três investigações de Lia. A prática mantém as
43 questões de histologia. O desenho original representa pele fina com pelo;
as referências de consulta estão no painel.

Dezesseis cenas animadas acompanham os encontros das histórias, com
cenários do próprio vale. Os personagens mexem a boca, piscam e gesticulam
nas cenas e nas conversas. Retratos mostram suas expressões enquanto o texto
aparece. A Jornada do Vale permite assistir ou rever as cenas desbloqueadas.

Plantar, regar, colher, recolher lenha, alimentar e pescar têm gestos próprios,
com ferramentas voltadas ao alvo da ação. Água, margens, vegetação, caminhada
e descanso mantêm a pixel art do vale e respeitam a opção de reduzir movimento.

A **mochila (I)** reúne 32 tipos de item com ícones próprios, categorias, busca, quantidades e instruções. Selecione para inspecionar; os botões de usar, equipar e organizar os seis atalhos são explícitos. Ela também mostra o depósito da fazenda sem duplicar seus produtos. O adubo da estufa acelera em 50% o crescimento de uma planta regada. Consumíveis são preservados quando não trazem benefício.

Os **animais do curral** têm nomes e cuidados individuais: aproxime-se e pressione **E** para fazer carinho, alimentar ou tosquiar. Eles olham para o jogador e reagem ao toque; a fome aparece no painel. O cocho distribui até três porções aos mais famintos, sem gastar feno em animais satisfeitos. A lã volta após três minutos ativos com alimentação suficiente. Movimento reduzido e progresso antigo continuam disponíveis.

**Vozes do vale:** seis histórias pessoais com dois caminhos e três encontros por personagem, novos assuntos para os nove moradores e duas cenas de conclusão. As tarefas avançam com ações feitas depois do combinado e ficam registradas no caderno. A ponte ganhou piso e corrimãos em camadas; mata, veredas, gelo e margens têm novos detalhes, com animações discretas e opção de reduzir movimento.

**Além das três margens:** o vale cresceu 50%, para 144×124 tiles. Explore a Serra dos Ecos, os Campos do Vento e a Costa das Conchas: nove lugares, seis passarelas e três expedições com dois caminhos e três encontros cada. Rosa, Lia e Inês iniciam os combinados; os nove moradores participam das descobertas. Os lugares têm observações registradas no caderno, recursos renováveis, destinos no mapa e duas cenas novas. Saves antigos continuam compatíveis.

**Arte dos oito biomas (V6.13):** materiais e vegetação próprios para cada região, neve azulada, campos dourados, mata com musgo e costa turquesa. Copas, pinheiros, cactos e palmeiras ganharam volume; observatório, moinho, abrigos e cais têm mais detalhes. As transições de cor são graduais, com a mesma geometria e compatibilidade de saves.

**Personagens e animais (V6.14):** protagonista e nove moradores com roupas, rostos e poses refinados. Caminhada e corrida têm apoio e recuperação dos pés mais naturais, e a tosquia ganhou um gesto próprio. Vacas, ovelhas e galinhas têm anatomia detalhada e 24 poses de locomoção, mantendo os mesmos cuidados, colisões e saves.

**Jogar online:** [Fazenda 37 °C](https://fazenda-37c.bernaberna.chatgpt.site)

## Jogar

Abra `index.html` para acessar o portal ou `jogo.html` para entrar diretamente
no jogo. Também é possível baixar `release/Fazenda37C-standalone.html` e
abri-lo no navegador sem internet. O progresso é salvo no próprio navegador.

| Controle | Ação |
| --- | --- |
| WASD | Caminhar |
| Shift + movimento | Correr |
| E | Interagir e conversar |
| R | Descansar ou levantar |
| G ou clique no minimapa | Abrir o mapa do vale |
| H | Explorar os tecidos na Visão da Pele |
| I | Abrir a mochila |
| Z | Alternar o zoom |
| M | Ligar ou desligar os sons |
| ESC | Fechar a tela aberta ou acessar o menu |

Perto de uma cama, use E para deitar ou levantar. Começar a se mover também
encerra o descanso. Conversas e o diário pausam a simulação enquanto você lê.
Nas cenas, Enter ou Espaço revela a fala e depois avança; Esc permite pular.
Nas conversas, E revela a fala inteira, Tab escolhe uma resposta e Enter
confirma. A opção de reduzir movimento mantém as poses estáveis e mostra
o texto completo. As cenas funcionam também sem internet.

## Compilar

Requer Python 3. A fonte está em `src/index.template.html` e nos módulos de
`src/modules/`; `jogo.html` é gerado e não deve ser editado diretamente.

```sh
python build.py
python verificar.py
python package.py
```

`package.py` atualiza a versão standalone e gera o pacote web. Para gerar
um único HTML com portal, jogo e painel, execute `python package_completo.py`.
Para testar em um servidor local, execute `python tools/capsrv.py 8766` e
abra `http://127.0.0.1:8766/jogo.html`.

## Arte, privacidade e conteúdo

A arte e o áudio da versão atual são gerados por código, sem gravações
históricas distribuídas. O jogo funciona localmente; o envio de resultados
ao Modo Professor é opcional e depende de código de turma e autorização.
Não há resultados de alunos ou configurações pessoais neste repositório.

O conteúdo é educativo e usa simplificações didáticas. Consulte
`CREDITOS-E-LICENCAS.md`, `POLITICA-DE-PRIVACIDADE-LGPD.md` e o manual
em `release/MANUAL.txt`.

Projeto educativo de histologia.
