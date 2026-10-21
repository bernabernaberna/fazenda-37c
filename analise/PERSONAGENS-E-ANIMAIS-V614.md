# Personagens e animais — V6.14

Esta rodada refina o elenco e o curral em Canvas 2D, preservando a identidade
dos nove moradores, as duas apresentações do protagonista e os equipamentos.
Não há novas dependências, modelos externos ou alteração do formato dos saves.

A passada dos personagens tem dezesseis poses, apoio ligado à distância real,
recuperação do pé e flexão do joelho. As vistas frontal e traseira mostram mais
profundidade, e os braços acompanham a perna oposta. O comprimento do ciclo
passa gradualmente de 24 para 32 pixels ao alternar caminhada e corrida, usando
a mesma mistura visual do quadro. As velocidades e as colisões são mantidas.

Oito atividades têm poses de preparação, contato e retorno: plantar, regar,
colher, coletar, alimentar, acariciar, pescar e tosquiar. A tosquia agora também
anima o protagonista, com uma tesoura curta e uma mão de apoio; a lã, o custo,
a estação exigida e os eventos da história continuam iguais.

Vacas, ovelhas e galinhas têm vinte e quatro poses de locomoção. Os cascos e os
pés compensam o deslocamento durante o apoio; a recuperação desenha joelhos e
jarretes, com o sinal correto ao caminhar de frente ou de costas. As espécies
têm anatomia e materiais próprios, lã em mechas, focinhos, orelhas, penas e
sombras de volume. Pastar, ciscar, descansar e receber cuidados mantêm as
mesmas rotinas, alcance e durações; mastigação e respiração são transitórias.

A âncora dos pés dos personagens continua em `y+10`. Interiores, retratos,
diálogos, cenas, sombras, rotas e ações usam os mesmos renderizadores. Reduzir
movimento estabiliza os elementos decorativos e mostra as poses essenciais.
Sprites, retratos e bancos de fala mantêm limites explícitos de cache.

Os testes desta rodada ficam em `analise/personagens-v614`,
`analise/animais-art-v614`, `analise/atuacao-v614`,
`analise/validacao-v614` e `analise/desempenho-v614`.
As tiras e o comparador animado mostram os quadros efetivamente desenhados;
as sequências do mundo usam o update e o render reais, em cenários preparados.
Os pacotes são abertos offline. Desempenho usa o loop RAF real, separado das
capturas, e descreve o navegador de referência, não todos os aparelhos.

A V6.13 permanece disponível para reversão e foi copiada em backup verificado
antes desta edição. Os testes de save cobrem compatibilidade; não transferem
o armazenamento local entre origens diferentes.
