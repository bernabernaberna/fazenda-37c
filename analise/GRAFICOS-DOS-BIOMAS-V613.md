# Fazenda 37 °C — materiais dos oito biomas

A V6.13 refina a pixel art do mundo existente. O mapa continua com 144×124
tiles, os mesmos objetos, missões e posições de interação. A interface e o
formato de save v2 são preservados.

| Região | Direção visual |
|---|---|
| Fazenda | Sálvia quente, solo fértil, árvores com copas em camadas e raízes |
| Montanha | Neve azulada, gelo frio, pinheiros com neve recortada |
| Deserto | Areia ocre, cactos com nervuras e flores, palmeiras arqueadas |
| Mata das Nascentes | Musgo escuro, folhiço discreto, vegetação mais profunda |
| Veredas do Sul | Terra úmida, verdes oliva, água e vegetação menos saturadas |
| Serra dos Ecos | Cinza azulado, líquens, observatório e pedras estratificadas |
| Campos do Vento | Palha dourada, flores esparsas, madeira do moinho trabalhada |
| Costa das Conchas | Areia clara, água turquesa, conchas e margens fragmentadas |

As cores seguem os pesos regionais contínuos já usados pelo jogo. Os detalhes
do chão são determinísticos e entram no cache estático. As projeções do sol,
as sombras térmicas e a geometria das passagens continuam compartilhadas com
a simulação. O brilho considera também a posição horizontal da câmera.

O módulo `51-biome-art.js` concentra os perfis e materiais. Ele atende os
drawers do terreno, a vegetação, os reflexos da água e a cartografia, sem
introduzir imagens externas, dependências ou requisições. Os interiores
continuam usando seus próprios pisos.

Limites explícitos: 4.096 perfis de cor, 256 paletas de reflexo, 64 âncoras de
água, 96 grupos de cristas e 40 grupos de vegetação visíveis. A redução de
movimento estabiliza os elementos animados.

Os testes específicos e os relatórios desta rodada ficam em
`analise/biome-art-v613`, `analise/vegetacao-art-v613`,
`analise/lugares-art-v613`, `analise/biomas-v613`,
`analise/validacao-v613` e `analise/desempenho-v613`.

As capturas comparativas identificam o HTML testado e usam o mesmo relógio,
horário e enquadramento. A medição de desempenho usa o loop RAF real em
contextos novos, sem capturar pixels durante as amostras. Os resultados
descrevem o navegador de referência; não representam todos os aparelhos.

A publicação conserva a versão V6.12 para reversão e os fontes anteriores em
backup local. O teste de saves verifica compatibilidade; não transfere o
localStorage entre origens diferentes.
