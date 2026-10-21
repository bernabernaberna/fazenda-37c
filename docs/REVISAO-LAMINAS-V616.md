# Lâminas do nível acadêmico — V6.16

Banco editorial: `src/data/academic-slides-v616.json`.
São **12 questões visuais novas**, com IDs `academic_slide_01` a
`academic_slide_12`, acrescentadas às 24 questões acadêmicas existentes.
IDs, alternativas e gabaritos das questões anteriores ficam preservados.

## Critérios de conteúdo

- As imagens são fotografias de preparados histológicos reais, com origem e
  licença registradas. Não há micrografia produzida ou reconstruída por IA.
- A pergunta remete ao campo ou ao marcador A. As pistas que identificam a
  resposta são explicitadas em `imageExplanation` somente após a resposta.
- Os marcadores são sobreposições da interface. As coordenadas normalizadas
  referem-se ao **derivado final**, depois dos recortes e da rotação documentados
  no manifesto, não ao arquivo original.
- O texto alternativo descreve posição, cor e organização visível sem dar o nome
  da resposta. Autoria, licença e fonte não constituem evidência de aprovação
  docente.
- Não se solicita distinguir Merkel, Langerhans e melanócitos apenas por halos
  claros em uma coloração de rotina; identificar subtipo de colágeno sem técnica
  adequada; nem ver desmossomos ou hemidesmossomos como placas ultraestruturais
  nestas fotografias.
- Não se exige diagnóstico de doença, medida física de espessura ou aumento
  desconhecido. O campo do vaso exige apenas reconhecer vaso sanguíneo, sem
  classificar artéria, veia ou calibre com base insuficiente.
- As seis fotografias são reutilizadas com alvos distintos, de forma explícita.
  O mesmo campo pode mostrar epitélio, conjuntivo, anexos, vasos e receptores.

## Conferência dos alvos

Os seis WebP finais foram abertos e inspecionados durante esta preparação.
As alternativas têm ordem fixa e justificativas correspondentes. Há três
respostas corretas em cada posição A/B/C/D, sem ciclo simples de quatro.

Uma segunda conferência independente dos seis campos e das 11 posições de
marcador confirmou que cada alvo está dentro da estrutura esperada no banco
SHA-256 `b185bcfa10b513b9c46984f7083da3ee67a4ce4c9dcb04ca3f43a34f99ac11ac`.

| Questão | Imagem | Marcador (x; y) | Identificação esperada e pista do campo |
| --- | --- | --- | --- |
| 01 | `pele-espessa-panorama` | Campo inteiro | Pele espessa: ampla faixa córnea e cristas epidérmicas; origem em polpa digital registrada. |
| 02 | `meissner` | 0,28; 0,20 | Córneo: faixa superficial lamelar acima das camadas nucleadas. |
| 03 | `meissner` | 0,75; 0,46 | Queratinócitos: população predominante da faixa epidérmica celular. |
| 04 | `meissner` | 0,245; 0,48 | Derme papilar: projeção conjuntiva clara contínua com a derme. |
| 05 | `pele-pilosa` | 0,735; 0,745 | Conjuntivo denso não modelado: feixes colágenos grossos em várias direções. |
| 06 | `pacini` | 0,94; 0,28 | Adipócitos uniloculares: grandes espaços claros e limites celulares finos no bordo direito. |
| 07 | `pilosebacea` | 0,67; 0,40 | Folículo piloso: haste alongada e bainhas celulares, no anexo diagonal. |
| 08 | `pilosebacea` | 0,36; 0,63 | Sebácea: lóbulo com células centrais claras e periferia menor e mais escura. |
| 09 | `ductos-sudoriparos` | 0,352; 0,505 | Ducto: pequeno lúmen e revestimento cúbico biestratificado; o ponto não depende da ponteira preta original. |
| 10 | `ductos-sudoriparos` | 0,43; 0,793 | Vaso: hemácias no lúmen e parede mais delgada que a dos perfis epiteliais vizinhos. |
| 11 | `pacini` | 0,50; 0,52 | Pacini: grande estrutura oval com numerosas lamelas concêntricas. |
| 12 | `meissner` | 0,515; 0,42 | Meissner: pequeno corpo oval encapsulado dentro de papila dérmica. |

## Referências científicas

As questões e justificativas são textos originais. As referências servem para
conferir relações morfológicas, sem copiar perguntas dos atlas.

- [University of Leeds — Skin layers](https://histology.leeds.ac.uk/home/skin/skin_layers/):
  organização de epiderme, derme e tecido subcutâneo; pele espessa glabra.
- [University of Leeds — Epidermis](https://histology.leeds.ac.uk/home/skin/epidermis_layers/):
  relação entre posição, camadas epidérmicas e diferenciação.
- [University of Leeds — Cell types in the epidermis](https://histology.leeds.ac.uk/home/skin/epidermis_cells/):
  população epidérmica predominante e células especializadas.
- [University of Leeds — Epithelial glands](https://histology.leeds.ac.uk/home/skin/glands/):
  ducto sudoríparo de epitélio cúbico estratificado e organização sebácea.
- [University of Leeds — Hair](https://histology.leeds.ac.uk/home/skin/hair/):
  haste, bainhas foliculares e relação com a glândula sebácea.
- [University of Leeds — Types of connective tissue](https://histology.leeds.ac.uk/home/tissue_types/connective/connective_tissue_types/):
  matriz e orientação dos feixes no conjuntivo denso não modelado.
- [University of Leeds — Adipocytes](https://histology.leeds.ac.uk/home/tissue_types/connective/connective_adipocyte/):
  aspecto das células adiposas e efeito do preparo no conteúdo lipídico.
- [Histology at Yale — Skin Lab](https://www.medcell.org/histology/skin_lab.php):
  distinção entre derme papilar, reticular e hipoderme.
- [Histology at Yale — Histology of Skin](https://www.medcell.org/tbl/histology_of_skin/reading.php):
  epiderme, matriz dérmica e localização dos receptores.
- [Southern Illinois University — Introduction to Skin Histology](https://histology.siu.edu/intro/skin.htm):
  morfologia de anexos e cápsulas de Meissner/Pacini; limitações da identificação
  de outras células e terminações em preparados usuais.
- [OpenStax — Structure and Function of Blood Vessels](https://openstax.org/books/anatomy-and-physiology-2e/pages/20-1-structure-and-function-of-blood-vessels):
  revestimento endotelial e conteúdo sanguíneo para a questão 10.

## Origem e licença das fotografias utilizadas

A atribuição completa, URLs originais, dimensões, SHA-256, recortes, rotação e
demais alterações de codificação constam em
`assets/histology-v616/manifest.json`. Os originais são mantidos no projeto.

| ID | Autoria e fonte da fotografia | Licença |
| --- | --- | --- |
| `pacini` | [Mikael Häggström — Histology of a Pacinian corpuscle](https://commons.wikimedia.org/wiki/File:Histology_of_a_Pacinian_corpuscle.jpg) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `pele-pilosa` | [Lazar.zenit — Scalp cross section](https://commons.wikimedia.org/wiki/File:Scalp_cross_section_(negro).jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `ductos-sudoriparos` | [Athikhun.suw — Sweat gland histology 2014](https://commons.wikimedia.org/wiki/File:Sweat_gland_histology_2014.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `pilosebacea` | [Kilbad — Insertion of sebaceous glands into hair shaft x10](https://commons.wikimedia.org/wiki/File:Insertion_of_sebaceous_glands_into_hair_shaft_x10.jpg) | Domínio público, segundo declaração do autor na página da obra. |
| `meissner` | [OpenStax Anatomy and Physiology — Light Micrograph of a Meissner Corpuscle](https://commons.wikimedia.org/wiki/File:514_Light_Micrograph_of_a_Meissner_Corpuscle.jpg) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `pele-espessa-panorama` | [Глущенко Арина — Skin of the finger pad, low magnification](https://commons.wikimedia.org/wiki/File:%D0%9A%D0%BE%D0%B6%D0%B0_%D0%BF%D0%BE%D0%B4%D1%83%D1%88%D0%B5%D1%87%D0%BA%D0%B8_%D0%BF%D0%B0%D0%BB%D1%8C%D1%86%D0%B0_(%D0%BC%D0%B0%D0%BB%D0%BE%D0%B5_%D1%83%D0%B2%D0%B5%D0%BB%D0%B8%D1%87%D0%B5%D0%BD%D0%B8%D0%B5).jpg) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

O derivado de ductos remove a legenda inglesa da borda por recorte, sem alterar
o tecido. As ponteiras pretas originais de ductos e Meissner permanecem visíveis.
O panorama de polpa digital foi girado 180° para manter a superfície acima.
Os artefatos do preparo não foram retocados.

Somente dados de coloração e aumento expressamente registrados na fonte devem
aparecer nos créditos. As perguntas não atribuem H&E nem um aumento numérico
às fontes que não os informam. Uma fotografia recortada/redimensionada não
mantém o mesmo aumento aparente em todos os tamanhos de tela.

## Limites da revisão

Conferência editorial de banco, fontes e alvos visíveis concluída nesta etapa.
A inspeção dos marcadores dentro da interface, os testes de navegação, a
persistência dos novos IDs e os testes offline pertencem à integração e devem
ser registrados nas evidências da versão. Esta conferência não substitui uma
revisão docente das questões para uso avaliativo formal.
