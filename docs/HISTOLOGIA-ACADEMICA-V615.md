# Histologia acadêmica — Fazenda 37 °C V6.15

Banco original de 24 questões, organizado em seis temas com quatro questões por tema. Conteúdo e fontes conferidos em 21/10/2026. O nível acrescenta terminologia universitária, identificação por descrições microscópicas e relações entre estrutura e função. Não transforma a ilustração do jogo em uma lâmina histológica real.

Cada questão tem quatro alternativas e uma única melhor resposta. Há uma justificativa específica para cada alternativa, explicação geral, objetivo e referências. O gabarito foi distribuído em seis respostas A, seis B, seis C e seis D; essa distribuição é editorial, sem implicar sorteio ou validação psicométrica. A ordem final é estável e varia por questão, sem repetir A/B/C/D a cada tema. As justificativas são reordenadas junto com as alternativas, e a ordem não muda ao abrir ou restaurar uma partida.

## API e integração

Fonte: `src/modules/52-academic-histology.js`. Não acessa DOM, inventário, relógio, XP, armazenamento nem rede. O carregamento apenas publica a API `FarmAcademicHistology` no escopo global.

- `version`: `6.15.0`.
- `questions()`: cópia profunda editável dos 24 objetos; alterar a cópia não muda o banco.
- `sources()`: cópia profunda editável das referências `{id, title, url}`.

A API, os dados internos e seus arrays estão congelados. Cada questão contém `id`, `title`, `subtitle`, `question`, `options`, `correctIndex`, `explanationCorrect`, `explanationWrong`, `concept`, `category`, `difficulty`, `academic`, `topic`, `objective`, `sourceIds` e `rationale`. Os índices de gabarito são baseados em zero; `rationale[i]` corresponde exatamente a `options[i]`. `difficulty` é `academico` e `academic` é `true` em todos os itens. O integrador é responsável pela apresentação, escolha de nível, registro de respostas e persistência.

## Mapa de objetivos e gabarito

| ID | Tema / objetivo principal | Resposta | Fontes |
|---|---|---|---|
| `academic_epiderme_01` | Reconhecer córneo e granuloso pelo núcleo e pelos grânulos | C | `leeds_epidermis`, `digital_granules` |
| `academic_epiderme_02` | Inferir pele espessa pela combinação de córneo, lúcido e ausência de pelos | A | `openstax_layers`, `leeds_layers` |
| `academic_epiderme_03` | Separar lipídios dos corpos lamelares e grânulos de querato-hialina | D | `openstax_layers`, `digital_granules` |
| `academic_epiderme_04` | Acompanhar descendentes basais durante renovação e diferenciação | B | `leeds_epidermis` |
| `academic_celulas_01` | Relacionar pontes do espinhoso, desmossomos e queratina | B | `leeds_junctions`, `leeds_junction_types`, `leeds_epidermis` |
| `academic_celulas_02` | Distinguir hemidesmossomo, adesão focal e junções célula–célula | D | `leeds_junctions`, `leeds_junction_types`, `pnas_focal_adhesion` |
| `academic_celulas_03` | Identificar Langerhans por apresentação de antígeno e posição suprabasal | A | `leeds_cells` |
| `academic_celulas_04` | Separar síntese de melanina e transferência de melanossomos | C | `yale_skin`, `openstax_layers` |
| `academic_derme_01` | Relacionar colágeno multidirecional e conjuntivo denso não modelado | D | `leeds_layers`, `leeds_fibres` |
| `academic_derme_02` | Distinguir derme papilar frouxa e reticular densa | C | `leeds_layers`, `yale_skin` |
| `academic_derme_03` | Distinguir retorno elástico e resistência à tração | B | `leeds_fibres` |
| `academic_derme_04` | Reconhecer hipoderme sem confundir localização e origem dos anexos | A | `openstax_appendages`, `openstax_layers` |
| `academic_anexos_01` | Distinguir ducto écrino e porção secretora em perfis transversais | A | `leeds_glands` |
| `academic_anexos_02` | Inferir secreção holócrina pela maturação dos sebócitos | C | `siu_skin` |
| `academic_anexos_03` | Separar matriz pilosa epitelial e papila conjuntiva vascularizada | D | `leeds_hair`, `openstax_appendages` |
| `academic_anexos_04` | Identificar posição e função contrátil de células mioepiteliais | B | `leeds_glands`, `yale_skin` |
| `academic_receptores_01` | Identificar Pacini por lamelas concêntricas e profundidade | C | `yale_sensation`, `leeds_cells` |
| `academic_receptores_02` | Distinguir Meissner papilar e complexo de Merkel epidérmico | B | `yale_sensation`, `leeds_cells`, `siu_skin` |
| `academic_receptores_03` | Explicar a difusão de nutrientes da derme para a epiderme avascular | A | `leeds_layers` |
| `academic_receptores_04` | Relacionar músculo liso arteriolar e regulação de resistência | D | `openstax_vessels` |
| `academic_reparo_01` | Identificar tecido de granulação sem confundi-lo com estrato granuloso | B | `openstax_repair` |
| `academic_reparo_02` | Diferenciar reepitelização, contração, fibroplasia e angiogênese | A | `openstax_epithelialization` |
| `academic_reparo_03` | Distinguir maturação fibrosa e regeneração integral | C | `openstax_repair` |
| `academic_reparo_04` | Integrar glândula écrina, ducto, superfície e evaporação | D | `yale_sensation`, `leeds_glands` |

## Referências verificadas

As fontes foram consultadas para conferir os fatos. Os enunciados, alternativas e explicações são originais; não foram importadas imagens, lâminas, quizzes ou trechos dos materiais.

| ID | Referência |
|---|---|
| `leeds_epidermis` | [University of Leeds — Epidermis](https://histology.leeds.ac.uk/home/skin/epidermis_layers/) |
| `leeds_cells` | [University of Leeds — Cell types in the epidermis](https://histology.leeds.ac.uk/home/skin/epidermis_cells/) |
| `leeds_junctions` | [University of Leeds — Desmosomes and Hemidesmosomes](https://histology.leeds.ac.uk/home/cell/desmosome/) |
| `leeds_junction_types` | [University of Leeds — Junctions](https://histology.leeds.ac.uk/home/cell/cell_junctions/) |
| `pnas_focal_adhesion` | [Swaminathan et al. — Actin retrograde flow actively aligns and orients ligand-engaged integrins in focal adhesions](https://pmc.ncbi.nlm.nih.gov/articles/PMC5635867/) |
| `leeds_layers` | [University of Leeds — Skin layers](https://histology.leeds.ac.uk/home/skin/skin_layers/) |
| `leeds_fibres` | [University of Leeds — Connective tissue fibres](https://histology.leeds.ac.uk/home/tissue_types/connective/connective_fibres/) |
| `leeds_glands` | [University of Leeds — Epithelial glands](https://histology.leeds.ac.uk/home/skin/glands/) |
| `leeds_hair` | [University of Leeds — Hair](https://histology.leeds.ac.uk/home/skin/hair/) |
| `yale_skin` | [Histology at Yale — Skin Lab](https://www.medcell.org/histology/skin_lab.php) |
| `yale_sensation` | [Yale Team-Based Learning — Histology of Skin](https://www.medcell.org/tbl/histology_of_skin/reading.php) |
| `siu_skin` | [Southern Illinois University — Introduction to Skin Histology](https://histology.siu.edu/intro/skin.htm) |
| `digital_granules` | [Digital Histology — Stratum granulosum](https://digitalhistology.org/organs-systems/skin/epidermis/epidermis-16/) |
| `openstax_layers` | [OpenStax — Anatomy and Physiology 2e: Layers of the Skin](https://openstax.org/books/anatomy-and-physiology-2e/pages/5-1-layers-of-the-skin) |
| `openstax_appendages` | [OpenStax — Anatomy and Physiology 2e: Accessory Structures of the Skin](https://openstax.org/books/anatomy-and-physiology-2e/pages/5-2-accessory-structures-of-the-skin) |
| `openstax_vessels` | [OpenStax — Anatomy and Physiology 2e: Structure and Function of Blood Vessels](https://openstax.org/books/anatomy-and-physiology-2e/pages/20-1-structure-and-function-of-blood-vessels) |
| `openstax_repair` | [OpenStax — Anatomy and Physiology: Tissue Injury and Aging](https://openstax.org/books/anatomy-and-physiology/pages/4-6-tissue-injury-and-aging) |
| `openstax_epithelialization` | [OpenStax — Cellular Response and Adaptation in Wound Healing](https://openstax.org/books/medical-surgical-nursing/pages/28-1-cellular-response-and-adaptation-in-wound-healing) |

## Auditoria editorial e factual

Foram conferidos 24 enunciados, 96 alternativas e suas 96 justificativas. A primeira versão recebeu refinamento de distratores para exigir comparação entre estruturas, células e etapas próximas. Exemplos: adesão focal versus hemidesmossomo; Meissner versus Pacini, Ruffini e Merkel; reepitelização versus contração, fibroplasia e angiogênese. Os IDs foram preservados. Antes da primeira publicação, alternativas e justificativas receberam uma permutação editorial fixa: gabaritos finais `C A D B / B D A C / D C B A / A C D B / C B A D / B A C D`.

Cuidados incorporados:

- Pele fina/espessa se refere à classificação epidérmica; não se deduz apenas da espessura da derme.
- A questão de córneo sobre granuloso especifica pele fina; o lúcido não é tratado como estrato obrigatório em toda pele.
- Corpos lamelares lipídicos não são confundidos com grânulos proteicos de querato-hialina.
- A queratina é filamento intermediário intracelular; o colágeno é matriz extracelular.
- Hemidesmossomos ligam célula à matriz; desmossomos ligam células. Integrinas isoladas não distinguem hemidesmossomos de adesões focais: o vínculo com queratina ou actina importa.
- A presença de melanina no queratinócito não implica que ele a sintetizou.
- Epiderme avascular recebe nutrientes a partir da derme. A hipoderme é subcutânea; a pele propriamente dita reúne epiderme e derme.
- A posição profunda de uma glândula não muda sua origem epitelial.
- Célula mioepitelial auxilia o esvaziamento; não é apresentada como a produtora do suor.
- “Apócrino” aparece como mecanismo alternativo genérico no item de secreção holócrina; o banco não afirma que o nome da glândula sudorípara apócrina humana prove mecanismo apical exclusivo.
- Receptores são identificados por morfologia e localização. Pacini não é descrito como termorreceptor; Meissner não é confundido com a célula de Merkel.
- Tecido de granulação não é estrato granuloso; fechamento e predomínio de colágeno não provam regeneração completa de todos os anexos.
- Suor só presente na superfície não garante resfriamento evaporativo: a evaporação é a etapa física relevante.

Validação programática do módulo: avaliação isolada sem DOM; 24 IDs únicos; seis temas com quatro itens; quatro alternativas e quatro justificativas por item; referências resolvidas; gabarito `[6, 6, 6, 6]`; cópias não alteram os dados originais; API congelada. Esses testes validam a estrutura do banco, não os fluxos de jogo que o integram.

## Limites pedagógicos

Este é um nível universitário introdutório de histologia cutânea com questões de aplicação e análise, não uma prova de certificação. O desenho da Visão da Pele continua esquemático. As questões não exibem micrografias reais, não ensinam diagnóstico e não substituem observação de lâminas e discussão docente. O banco não abrange todos os tópicos de histologia geral, embriologia, imunohistoquímica ou patologia.

Conferência de fontes e auditoria técnica não equivalem à revisão por professora ou professor, à validação da dificuldade com estudantes ou à comprovação de aprendizagem. Permanecem recomendadas a revisão docente das respostas e um ensaio com estudantes antes de usar o desempenho como avaliação acadêmica formal.
