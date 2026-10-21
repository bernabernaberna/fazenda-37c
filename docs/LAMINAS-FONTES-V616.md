# Lâminas histológicas reais — V6.16

Seleção e conferência em 21/10/2026. As imagens são fotografias microscópicas reais já publicadas pelos autores, e não imagens geradas por IA. Foram conferidos o arquivo original, a página de descrição e a licença individual. A evidência de licença está também nos metadados preservados em `assets/histology-v616/sources-raw.json`.

O jogo precisa incorporar os derivados como dados locais durante o build. Nenhuma imagem deve depender de conexão, hotlink, CDN ou consulta ao Wikimedia durante a partida. Os originais são material de proveniência para o repositório; não precisam ser duplicados no HTML distribuído.

## Créditos e licenças

| Origem | Autor a creditar | Licença do arquivo consultado | Derivados locais |
| --- | --- | --- | --- |
| [Histology of a Pacinian corpuscle.jpg](https://commons.wikimedia.org/wiki/File:Histology_of_a_Pacinian_corpuscle.jpg) | Mikael Häggström | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `pacini.webp`, `adiposo-pacini.webp` |
| [Scalp cross section](https://commons.wikimedia.org/wiki/File:Scalp_cross_section_(negro).jpg) | Lazar.zenit | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `pele-pilosa.webp` |
| [Sweat gland histology 2014.jpg](https://commons.wikimedia.org/wiki/File:Sweat_gland_histology_2014.jpg) | Athikhun.suw | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `ductos-sudoriparos.webp` |
| [Insertion of sebaceous glands into hair shaft x10.jpg](https://commons.wikimedia.org/wiki/File:Insertion_of_sebaceous_glands_into_hair_shaft_x10.jpg) | Kilbad; ajuste de cor/brilho da versão Commons: Tilifa Ocaufa | [Domínio público por declaração do autor (PD-user)](https://commons.wikimedia.org/wiki/Template:PD-user) | `pilosebacea.webp`, `derme-colagena.webp` |
| [514 Light Micrograph of a Meissner Corpuscle.jpg](https://commons.wikimedia.org/wiki/File:514_Light_Micrograph_of_a_Meissner_Corpuscle.jpg) | OpenStax Anatomy and Physiology | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — versão de 18/05/2016 do arquivo na página Commons | `meissner.webp`, `epiderme-meissner.webp` |
| [Pele da polpa digital — pequeno aumento](https://commons.wikimedia.org/wiki/File:Кожа_подушечки_пальца_(малое_увеличение).jpg) | Глущенко Арина (Arina Glushchenko) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `pele-espessa-panorama.webp` |

Os dois derivados CC BY-SA 4.0 continuam sob essa mesma licença. As demais imagens continuam sob as licenças da tabela; sua presença no jogo não transfere a autoria das imagens nem sugere apoio dos autores ao projeto. A interface deve apresentar o autor, link da imagem original, link da licença e indicação resumida das modificações, inclusive quando o arquivo está incorporado no HTML offline. Os links são referências opcionais de proveniência; a exibição da imagem não depende deles.

O arquivo de couro cabeludo possui um termo histórico inadequado no nome original do Wikimedia. Ele é mantido apenas na URL canônica de proveniência, sem repetir o termo no título ou no texto pedagógico.

## Modificações nos derivados

Todos foram convertidos proporcionalmente para WebP, qualidade 86 e dimensão máxima de 1000 px. Não houve pintura, preenchimento generativo, remoção de células, mudanças de cor, nitidez artificial ou reconstrução de estruturas. A compressão é com perdas. Dimensões, SHA-256 dos originais e dos derivados, caixas de recorte e rotação estão no `manifest.json`. As imagens originais permanecem byte a byte em `originals/`.

| Derivado | Recorte em pixels do original — esquerda, topo, direita, base | Rotação | Motivo |
| --- | --- | --- | --- |
| `pacini.webp` | Campo completo | 0° | Preservar o corpúsculo e o tecido adiposo adjacente |
| `adiposo-pacini.webp` | `[1705,100,2048,1320]` | 0° | Campo opcional de adipócitos, oriundo da mesma micrografia |
| `pele-pilosa.webp` | `[300,550,3490,3500]` | 0° | Reduzir bordas pretas mantendo epiderme, folículo e derme |
| `ductos-sudoriparos.webp` | `[1200,240,3770,2540]` | 0° | Excluir inteiramente a legenda inglesa que revelava a classificação do epitélio; preservar ponteira e tecido |
| `pilosebacea.webp` | Campo completo | 0° | Preservar a relação entre folículo e lóbulos sebáceos |
| `derme-colagena.webp` | `[0,80,640,1040]` | 0° | Campo opcional de feixes conjuntivos da mesma micrografia |
| `meissner.webp` | Campo completo | 0° | Manter a seta original neutra na papila dérmica |
| `epiderme-meissner.webp` | `[0,35,800,430]` | 0° | Campo opcional epidérmico da mesma micrografia |
| `pele-espessa-panorama.webp` | Campo completo | 180° | Orientar a superfície para cima sem mudar a estrutura |

Existem nove derivados de **seis fotografias originais distintas**. Isso não representa nove espécimes. Os seis campos principais somam 952.870 bytes; os nove derivados, 1.203.934 bytes. O banco pode reutilizar uma mesma micrografia com alvos distintos para comparar tecido, célula e estrutura, sem fingir que são amostras independentes.

## Limites de identificação e metadados

- A fonte de Kilbad informa H&E e uma unidade pilossebácea normal em uma amostra que também continha nevo intradérmico benigno. A pergunta não deve converter essa imagem em desafio diagnóstico de nevo.
- A coloração H&E do couro cabeludo de Lazar.zenit está indicada na categoria H&E do arquivo. Para Pacini, Meissner, ductos e polpa digital, o registro não apresenta uma coloração explícita; não rotular como H&E somente pelas cores.
- A espécie é explícita para couro cabeludo e contextual para os campos cutâneos; as descrições exatas estão no manifesto. Não inferir idade, sexo, local anatômico adicional ou origem clínica não documentados.
- Não exibir uma ampliação de microscópio inventada. O redimensionamento em tela e o zoom digital não são ampliação óptica e não permitem deduzir uma barra de escala.
- Os alvos devem depender de estruturas observáveis: estrato córneo, queratinócitos em camadas, papila dérmica, feixes conjuntivos, folículo, lóbulos sebáceos, ductos, hemácias em perfis vasculares, adipócitos e corpúsculos. A imagem não demonstra diretamente função fisiológica.
- A micrografia dos ductos permite comparar perfis tubulares escuros e pequenos lúmens com perfis vasculares contendo hemácias. Não afirmar que se identificam com certeza células mioepiteliais, subtipos glandulares em todos os perfis, Langerhans, Merkel ou melanócitos apenas por H&E.
- A foto ampla da polpa digital tem artefatos e resolução limitada. É adequada para visão geral de pele espessa, não para exigir que o jogador resolva grânulos ou junções celulares.

`pele-espessa-detalhe.jpg`, preservado somente no projeto local em `originals/` como candidato, foi descartado do jogo: apesar do nome do arquivo de origem, o campo fotografado mostra predominantemente tecido conjuntivo profundo e perfis tubulares, sem detalhe epidérmico útil. Não existe derivado desse candidato no manifesto.

## Reprodução e validação

Os auxiliares locais de pesquisa não são necessários ao build ou ao repositório público. `obter.py` registra os URLs e metadados retornados pelo Wikimedia e preserva os originais. Downloads posteriores de candidatos adicionais receberam HTTP 429 e foram interrompidos; esses arquivos não foram usados nem substituídos por imagens artificiais. `obter-openstax.py` é somente registro de tentativa de candidatos não obtidos e não participa do build.

`preparar.py` reproduz os derivados **localmente**, sem acesso à rede, a partir dos originais preservados. A seleção final foi aberta e inspecionada antes da integração. A revisão pedagógica docente continua distinta desta conferência técnica e de fontes.
