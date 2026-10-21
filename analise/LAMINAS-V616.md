# Fazenda 37 °C — lâminas histológicas V6.16

O nível acadêmico agora tem 36 questões: as 24 anteriores e 12 novas identificações em fotografias microscópicas reais. **Progresso → Identificar lâminas** e **Visão da Pele → Identificar lâminas** abrem a prática visual. A prática geral intercala questões visuais e conceituais.

## Imagens e interação

Seis micrografias distintas mostram pele espessa e pilosa, epiderme, conjuntivo, adipócitos, folículo, glândula sebácea, ductos, vasos, Pacini e Meissner. Há 11 marcadores A e uma identificação panorâmica. Os marcadores foram conferidos sobre os derivados finais por duas leituras independentes.

- Zoom digital de 1× a 4×, com reenquadramento, rolagem e foco no alvo. O valor é relativo à imagem na tela, sem inventar aumento óptico ou barra de escala.
- Imagens proporcionais, descrições iniciais neutras, controle por teclado e botões com área de toque de 44 px. Escape primeiro reenquadra; outro Escape volta ao mundo.
- Nome do alvo e explicação visual aparecem depois de responder. Objetivos editoriais e títulos das imagens não entregam o gabarito antecipadamente.
- Se a imagem falhar, as alternativas e a pontuação ficam bloqueadas; o jogador pode voltar sem registrar erro. A imagem é removida ao fechar ou abrir questão sem foto.
- Créditos por fotografia com autor, fonte, licença e modificações. As seis imagens usadas somam 952.870 bytes antes da incorporação base64. Nenhuma imagem depende de download durante a partida.

As licenças individuais são CC0, domínio público, CC BY 4.0 e CC BY-SA 4.0. Os derivados BY-SA mantêm sua licença. `docs/LAMINAS-FONTES-V616.md`, o manifesto e os metadados de origem registram a proveniência. Nove derivados são preservados nas fontes, mas apenas os seis usados entram no jogo; não são nove espécimes.

## Compatibilidade e progressão

Os IDs, textos, alternativas, gabaritos e justificativas das 24 questões anteriores foram preservados. Regressão do JSON original: SHA256 `66a327a5969a46bcd136cfa14b4849654e27dab0a145d508a5e9ad34811ea45f`.

O save v2 continua compatível. Um currículo anterior completo passa de 24/24 para 24/36, conservando 360 pontos; as novas questões permitem chegar a 540. Cada primeiro domínio vale 15 pontos; revisão não repaga. Moedas, inventário, estado do mundo e progressão escolar permanecem. Uma resposta real continua valendo nos pedidos de Lia. Nenhuma imagem é salva no progresso.

## Validação final

Build `a02a4dbfbc`; SHA256 `64b098518390a04d2817533d339a73c93d814fbd5a91d5440f42b7dd47e9871b`.

- 35/35 suítes de regressão aprovadas no mesmo build.
- Lâminas 53/53 e currículo acadêmico 54/54, incluindo os três pacotes offline.
- Todas as 12 questões visuais e as seis imagens decodificam em standalone, completo e ZIP extraído, sem requisição externa.
- Seis capturas inspecionadas em 1280×800, 1024×640 e 390×844; também verificados 320×640 e 844×390. Onze alvos foram abertos e inspecionados em 4×.
- 32 cenários de desempenho: 40 quadros de aquecimento e 180 amostras por cenário, incluindo a lâmina em 4×. Maior render CPU p95: 1,6 ms no Edge 155.0.4283.62, abaixo do alvo de 4 ms. Caches dentro dos limites, zero erros JavaScript e zero dependências externas nos cenários medidos.

Relatórios locais: `analise/laminas-v616`, `analise/academico-v616`, `analise/validacao-v616` e `analise/desempenho-v616`. As falhas iniciais de preparo do teste foram preservadas; a rodada final corresponde ao hash acima.

## Preservação e limites

A V6.15 foi preservada com manifesto verificado de 57 arquivos em `../backups/antes-laminas-v616-20261021`, além do commit anterior do GitHub, versão 18 do Site e arquivo de publicação anterior.

As imagens não foram geradas por IA. Somente recortes, rotação, redimensionamento proporcional e conversão WebP foram usados, sem reconstruir células ou alterar cores. A compressão é com perdas. Coloração, espécie e aumento só são informados quando documentados; não se identificam células especiais ou ultraestruturas que estas fotos não demonstram.

As conferências de fontes, licenças e alvos não equivalem à aprovação docente ou à validação psicométrica. As fotos são reutilizadas com alvos distintos; não são 12 amostras independentes. Os resultados de CPU se referem a este computador e não medem desempenho universal ou GPU. Nenhuma migração ou política de backend foi alterada.
