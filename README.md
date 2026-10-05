# Fazenda 37 °C — O Vale dos Três Ventos

Jogo educativo em português, feito com HTML e Canvas 2D. Explore a fazenda,
a montanha e o deserto, converse com seis moradores e cuide dos animais
enquanto aprende sobre a pele e a termorregulação. A história acompanha
a reabertura da Casa das Sementes; a exploração continua depois dela.

Os moradores têm **18 lembranças para descobrir e 36 respostas possíveis**.
Suas escolhas ficam no diário, reaparecem nas conversas e abrem histórias
depois da reabertura. Os NPCs também comentam ações recentes do jogador.

**O que o vento guardou** acompanha o retorno de Alex Vale, uma pessoa de
humor seco e forte lealdade que precisa aprender a pedir ajuda. O mistério
acolhedor tem oito episódios com decisões que alteram os próximos objetivos,
seis arcos pessoais em duas etapas, sete pistas e um diário de consequências.
O **Caderno de Alex** mostra a história, os moradores e a vida na fazenda.

Recupere oficina, cozinha, apiário e irrigação. Prepare seis receitas,
recolha frutas, leite, ovos e mel, cuide do curral e entregue encomendas.
As obras já prontas podem receber manutenção com efeitos reais. A exploração
e os pedidos continuam depois do desfecho, sem um limite de duração da partida.

A **Visão da Pele (H)** apresenta oito estruturas e sua relação com tecidos,
células e termorregulação. Compare calor, frio, esforço e descanso, registre
observações reais e resolva três investigações de Lia. A prática mantém as
43 questões de histologia. O desenho original representa pele fina com pelo;
as referências de consulta estão no painel.

Quatorze cenas animadas acompanham os encontros das duas histórias, com
cenários do próprio vale. Os personagens mexem a boca, piscam e gesticulam
nas cenas e nas conversas. Retratos mostram suas expressões enquanto o texto
aparece. A Jornada do Vale permite assistir ou rever as cenas desbloqueadas.

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
