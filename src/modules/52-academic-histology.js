/* Histologia acadêmica V6.15. Banco original, local e independente da simulação. */
(function (root) {
  'use strict';

  const SOURCES = [
    { id: 'leeds_epidermis', title: 'University of Leeds — Epidermis', url: 'https://histology.leeds.ac.uk/home/skin/epidermis_layers/' },
    { id: 'leeds_cells', title: 'University of Leeds — Cell types in the epidermis', url: 'https://histology.leeds.ac.uk/home/skin/epidermis_cells/' },
    { id: 'leeds_junctions', title: 'University of Leeds — Desmosomes and hemidesmosomes', url: 'https://histology.leeds.ac.uk/home/cell/desmosome/' },
    { id: 'leeds_junction_types', title: 'University of Leeds — Junctions', url: 'https://histology.leeds.ac.uk/home/cell/cell_junctions/' },
    { id: 'pnas_focal_adhesion', title: 'Swaminathan et al. — Actin retrograde flow actively aligns and orients ligand-engaged integrins in focal adhesions', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5635867/' },
    { id: 'leeds_layers', title: 'University of Leeds — Skin layers', url: 'https://histology.leeds.ac.uk/home/skin/skin_layers/' },
    { id: 'leeds_fibres', title: 'University of Leeds — Connective tissue fibres', url: 'https://histology.leeds.ac.uk/home/tissue_types/connective/connective_fibres/' },
    { id: 'leeds_glands', title: 'University of Leeds — Epithelial glands', url: 'https://histology.leeds.ac.uk/home/skin/glands/' },
    { id: 'leeds_hair', title: 'University of Leeds — Hair', url: 'https://histology.leeds.ac.uk/home/skin/hair/' },
    { id: 'yale_skin', title: 'Histology at Yale — Skin Lab', url: 'https://www.medcell.org/histology/skin_lab.php' },
    { id: 'yale_sensation', title: 'Histology at Yale — Histology of Skin: sensory structures', url: 'https://www.medcell.org/tbl/histology_of_skin/reading.php' },
    { id: 'siu_skin', title: 'Southern Illinois University — Introduction to Skin Histology', url: 'https://histology.siu.edu/intro/skin.htm' },
    { id: 'digital_granules', title: 'Digital Histology — Stratum granulosum', url: 'https://digitalhistology.org/organs-systems/skin/epidermis/epidermis-16/' },
    { id: 'openstax_layers', title: 'OpenStax — Anatomy and Physiology 2e: Layers of the Skin', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/5-1-layers-of-the-skin' },
    { id: 'openstax_appendages', title: 'OpenStax — Anatomy and Physiology 2e: Accessory Structures of the Skin', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/5-2-accessory-structures-of-the-skin' },
    { id: 'openstax_vessels', title: 'OpenStax — Anatomy and Physiology 2e: Structure and Function of Blood Vessels', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-1-structure-and-function-of-blood-vessels' },
    { id: 'openstax_repair', title: 'OpenStax — Anatomy and Physiology: Tissue Injury and Aging', url: 'https://openstax.org/books/anatomy-and-physiology/pages/4-6-tissue-injury-and-aging' },
    { id: 'openstax_epithelialization', title: 'OpenStax — Cellular Response and Adaptation in Wound Healing', url: 'https://openstax.org/books/medical-surgical-nursing/pages/28-1-cellular-response-and-adaptation-in-wound-healing' }
  ];

  const QUESTIONS = [
    {
      id: 'academic_epiderme_01', topic: 'Epiderme e barreira', category: 'estrutura',
      objective: 'Relacionar morfologia superficial e diferenciação dos queratinócitos.',
      question: 'Em um corte de pele fina normal, a superfície apresenta lâminas celulares achatadas, sem núcleos, acima de uma faixa com grânulos basófilos. Qual interpretação integra os dois achados?',
      options: ['Estrato córneo sobre o granuloso: diferenciação terminal dos queratinócitos.', 'Estrato basal sobre o espinhoso: multiplicação de células superficiais.', 'Derme papilar sobre a reticular: amadurecimento de fibroblastos.', 'Estrato lúcido sobre o córneo: chegada de células nucleadas à superfície.'],
      correctIndex: 0,
      explanationCorrect: 'Corneócitos anucleados ocupam o estrato córneo; abaixo está o granuloso, com grânulos de querato-hialina.',
      explanationWrong: 'Use a presença de núcleo e os grânulos para distinguir estratos, em vez de apenas a espessura.',
      concept: 'A diferenciação epidérmica transforma queratinócitos nucleados em corneócitos.',
      sourceIds: ['leeds_epidermis', 'digital_granules'],
      rationale: ['Correto: relaciona as duas camadas e a diferenciação.', 'A proliferação basal ocorre junto à derme, não na superfície.', 'A derme é conjuntiva e não produz corneócitos.', 'O lúcido fica entre granuloso e córneo; não contém células nucleadas.']
    },
    {
      id: 'academic_epiderme_02', topic: 'Epiderme e barreira', category: 'estrutura',
      objective: 'Distinguir pele espessa pela combinação de estratos e anexos.',
      question: 'Dois cortes têm derme de espessura semelhante. Apenas um mostra córneo muito desenvolvido, faixa lúcida e glândulas sudoríparas, sem folículos pilosos. Que classificação é mais sustentada?',
      options: ['Pele fina, porque a derme não está aumentada.', 'Pele espessa glabra, como a da palma da mão.', 'Pele fina do couro cabeludo em fase de repouso.', 'Mucosa não queratinizada com glândulas sebáceas.'],
      correctIndex: 1,
      explanationCorrect: 'Pele espessa é uma classificação da epiderme. A associação de córneo espesso, lúcido e ausência de pelos é característica.',
      explanationWrong: 'A espessura da derme, isoladamente, não define pele fina ou espessa.',
      concept: 'Pele espessa glabra possui epiderme especializada para atrito e não apresenta folículos pilosos.',
      sourceIds: ['openstax_layers', 'leeds_layers'],
      rationale: ['A classificação depende sobretudo da epiderme, não da derme.', 'Correto: os três critérios concordam com pele palmar.', 'O repouso do pelo não elimina todos os folículos do corte representativo.', 'A descrição inclui queratinização intensa, incompatível com essa mucosa.']
    },
    {
      id: 'academic_epiderme_03', topic: 'Epiderme e barreira', category: 'integracao',
      objective: 'Distinguir corpos lamelares e grânulos de querato-hialina.',
      question: 'Um modelo preserva os filamentos de queratina, mas bloqueia a liberação dos lipídios dos corpos lamelares. Qual consequência estrutural é mais direta?',
      options: ['Redução primária da adesão basal por integrinas.', 'Perda exclusiva da agregação intracelular dos filamentos de queratina.', 'Prejuízo das lamelas lipídicas entre corneócitos e da barreira à água.', 'Ausência exclusiva dos grânulos proteicos de querato-hialina.'],
      correctIndex: 2,
      explanationCorrect: 'Corpos lamelares fornecem lipídios ao espaço extracelular. Querato-hialina participa da organização proteica e não é o mesmo grânulo.',
      explanationWrong: 'Separe barreira lipídica extracelular de organização dos filamentos dentro da célula.',
      concept: 'A barreira epidérmica combina corneócitos e lipídios extracelulares.',
      sourceIds: ['openstax_layers', 'digital_granules'],
      rationale: ['Integrinas participam da ancoragem à matriz, não da secreção lipídica descrita.', 'A agregação proteica associa-se à querato-hialina; bloquear a exocitose lipídica afeta mais diretamente as lamelas extracelulares.', 'Correto: o alvo descrito é a organização lipídica extracelular.', 'São estruturas distintas; bloquear exocitose lipídica não equivale a eliminar querato-hialina.']
    },
    {
      id: 'academic_epiderme_04', topic: 'Epiderme e barreira', category: 'celulas',
      objective: 'Inferir o trajeto de renovação epidérmica sem confundir proliferação e cornificação.',
      question: 'Uma marcação de células em divisão é detectada inicialmente junto à lâmina basal. Ao acompanhar suas descendentes durante a renovação normal, qual trajeto se espera?',
      options: ['Córneo → granuloso → basal, com reaquisição de núcleo.', 'Papila dérmica → lúmen sudoríparo → estrato basal.', 'Basal → derme reticular, com síntese de colágeno.', 'Basal → espinhoso → granuloso → córneo, com diferenciação e descamação.'],
      correctIndex: 3,
      explanationCorrect: 'Descendentes da população proliferativa basal seguem para estratos suprabasais e completam a cornificação antes da descamação.',
      explanationWrong: 'A renovação do epitélio progride da região basal para a superfície.',
      concept: 'Proliferação basal e diferenciação suprabasal sustentam a renovação contínua.',
      sourceIds: ['leeds_epidermis'],
      rationale: ['A sequência está invertida; corneócitos não retomam mitose.', 'Papilas dérmicas são conjuntivas e não constituem essa linhagem.', 'Queratinócitos normais permanecem na linhagem epitelial.', 'Correto: expressa o sentido da renovação na pele fina; na espessa pode haver lúcido.']
    },
    {
      id: 'academic_celulas_01', topic: 'Células e junções', category: 'celulas',
      objective: 'Relacionar o aspecto espinhoso à adesão mecânica entre queratinócitos.',
      question: 'Após o processamento histológico, queratinócitos suprabasais parecem unidos por pequenas pontes. Qual complexo e filamento explicam melhor a resistência dessas conexões?',
      options: ['Desmossomos associados a filamentos intermediários de queratina.', 'Zônulas de adesão associadas a filamentos de actina.', 'Hemidesmossomos associados a queratina na ligação à lâmina basal.', 'Junções oclusivas associadas à vedação da via paracelular.'],
      correctIndex: 0,
      explanationCorrect: 'Desmossomos unem células e se conectam à rede de queratina; a retração do preparo evidencia pontes no estrato espinhoso.',
      explanationWrong: 'Identifique uma junção célula–célula de ancoragem, não uma junção de comunicação ou de ligação à matriz.',
      concept: 'Adesão desmossomal e queratina distribuem forças no epitélio.',
      sourceIds: ['leeds_junctions', 'leeds_junction_types', 'leeds_epidermis'],
      rationale: ['Correto: descreve a ancoragem característica das pontes entre queratinócitos.', 'A associação com actina é válida, mas não explica as pontes desmossomais do espinhoso.', 'A associação é válida, mas liga célula à matriz e não dois queratinócitos suprabasais.', 'Oclusão paracelular não explica as pontes de ancoragem descritas.']
    },
    {
      id: 'academic_celulas_02', topic: 'Células e junções', category: 'celulas',
      objective: 'Diferenciar a ancoragem célula–matriz da adesão célula–célula.',
      question: 'Uma imagem de microscopia eletrônica mostra placa na face basal de um queratinócito, ligada a queratina e voltada para a lâmina basal, sem uma segunda célula do outro lado. Que associação é correta?',
      options: ['Desmossomo e caderinas ligando dois queratinócitos.', 'Hemidesmossomo e integrinas na ligação da queratina à matriz extracelular.', 'Adesão focal e integrinas na ligação da actina à matriz extracelular.', 'Zônula de adesão e caderinas na ligação entre redes de actina de células vizinhas.'],
      correctIndex: 1,
      explanationCorrect: 'O hemidesmossomo ancora a face basal à matriz por integrinas, com ligação intracelular aos filamentos intermediários.',
      explanationWrong: 'A ausência de outra célula e a posição basal apontam para adesão à matriz.',
      concept: 'Hemidesmossomo é uma ligação célula–matriz; desmossomo é célula–célula.',
      sourceIds: ['leeds_junctions', 'leeds_junction_types', 'pnas_focal_adhesion'],
      rationale: ['Essa descrição exige outra célula na face oposta.', 'Correto: combina posição, parceiro extracelular e ligação à queratina.', 'Também é célula–matriz, mas o citoesqueleto associado seria actina, e não queratina.', 'Essa junção é célula–célula e associa actina, em desacordo com as duas pistas.']
    },
    {
      id: 'academic_celulas_03', topic: 'Células e junções', category: 'celulas',
      objective: 'Distinguir apresentação de antígeno e pigmentação na epiderme.',
      question: 'Uma célula dendrítica suprabasal capta material e participa da apresentação de antígenos. Ela não é a principal produtora de queratina nem de melanina. Qual identidade é compatível?',
      options: ['Queratinócito suprabasal em diferenciação.', 'Melanócito produtor de melanossomos.', 'Célula de Langerhans.', 'Célula de Merkel associada ao tato.'],
      correctIndex: 2,
      explanationCorrect: 'Células de Langerhans são células imunes apresentadoras de antígeno encontradas na epiderme, especialmente no espinhoso.',
      explanationWrong: 'Combine localização suprabasal e função imune; prolongamentos, sozinhos, não identificam uma célula.',
      concept: 'A epiderme contém células com funções imunes além dos queratinócitos.',
      sourceIds: ['leeds_cells'],
      rationale: ['Queratinócitos participam da defesa, mas não correspondem à célula dendrítica apresentadora descrita.', 'Melanócitos têm função pigmentária e predominam na região basal.', 'Correto: localização e apresentação de antígenos são compatíveis.', 'Células de Merkel integram complexos mecanossensoriais.']
    },
    {
      id: 'academic_celulas_04', topic: 'Células e junções', category: 'celulas',
      objective: 'Distinguir produção e distribuição da melanina.',
      question: 'Há grânulos pigmentados em muitos queratinócitos ao redor de poucos melanócitos basais. Qual interpretação evita confundir presença de pigmento com sua síntese?',
      options: ['Queratinócitos produzem a melanina que os melanócitos apenas armazenam.', 'Cada queratinócito pigmentado corresponde a um novo melanócito basal.', 'Grânulos de melanina e querato-hialina são a mesma estrutura em fases diferentes.', 'Melanócitos sintetizam melanina e transferem melanossomos aos queratinócitos.'],
      correctIndex: 3,
      explanationCorrect: 'A distribuição por transferência permite encontrar melanina em queratinócitos que não a sintetizaram.',
      explanationWrong: 'O conteúdo recebido por uma célula não demonstra que ela o produziu.',
      concept: 'Produção pelos melanócitos e distribuição aos queratinócitos são processos distintos.',
      sourceIds: ['yale_skin', 'openstax_layers'],
      rationale: ['A relação está invertida: melanócitos sintetizam melanina.', 'Um melanócito pode distribuir melanossomos a vários queratinócitos.', 'Querato-hialina e melanina são estruturas e processos distintos.', 'Correto: distingue a célula produtora da célula receptora.']
    },
    {
      id: 'academic_derme_01', topic: 'Derme e matriz', category: 'estrutura',
      objective: 'Relacionar orientação do colágeno à resistência multidirecional.',
      question: 'Um campo profundo da derme exibe feixes colágenos grossos em várias direções e poucas células entre eles. Por que essa organização difere da de um tendão típico?',
      options: ['Conjuntivo denso não modelado resiste a trações vindas de diferentes direções.', 'Epitélio estratificado usa feixes paralelos para secretar queratina.', 'Conjuntivo frouxo contém mais feixes compactados que um tendão.', 'Músculo liso produz as bandas colágenas por contrações sincronizadas.'],
      correctIndex: 0,
      explanationCorrect: 'A derme reticular tem conjuntivo denso não modelado; no tendão típico predominam feixes paralelos, adequados à tração orientada.',
      explanationWrong: 'Considere quantidade e direção dos feixes, não apenas a cor rosada em H&E.',
      concept: 'A orientação da matriz contribui para a função mecânica do tecido.',
      sourceIds: ['leeds_layers', 'leeds_fibres'],
      rationale: ['Correto: relaciona organização irregular e solicitação multidirecional.', 'Feixes colágenos extracelulares não definem epitélio.', 'Conjuntivo frouxo é menos dominado por feixes compactados.', 'O campo descrito é matriz conjuntiva, não fascículos musculares.']
    },
    {
      id: 'academic_derme_02', topic: 'Derme e matriz', category: 'estrutura',
      objective: 'Identificar a derme papilar por localização e composição.',
      question: 'Logo abaixo da lâmina basal há projeções de conjuntivo delicado, com alças capilares. Mais profundamente surgem feixes espessos. Qual par de regiões explica essa mudança?',
      options: ['Hipoderme superficial e epiderme profunda.', 'Derme papilar frouxa e derme reticular densa não modelada.', 'Estrato granuloso vascularizado e estrato córneo fibroso.', 'Derme reticular superficial e papilar profunda.'],
      correctIndex: 1,
      explanationCorrect: 'A região papilar acompanha a interface epidérmica; a reticular apresenta feixes colágenos mais robustos em profundidade.',
      explanationWrong: 'Acompanhe o eixo superfície–profundidade e lembre que os capilares estão no conjuntivo.',
      concept: 'Derme papilar e reticular são regiões contínuas com organização diferente da matriz.',
      sourceIds: ['leeds_layers', 'yale_skin'],
      rationale: ['A hipoderme fica abaixo da derme, não junto à superfície basal.', 'Correto: posição e composição concordam.', 'A epiderme normal é avascular e não contém esses feixes.', 'A ordem das regiões está invertida.']
    },
    {
      id: 'academic_derme_03', topic: 'Derme e matriz', category: 'integracao',
      objective: 'Distinguir retorno elástico e resistência à tração na matriz dérmica.',
      question: 'Em um ensaio didático, a rede de fibras elásticas dérmicas é reduzida, enquanto os feixes colágenos permanecem. Que propriedade tende a ser comprometida mais diretamente?',
      options: ['Resistência final à tração, atribuída exclusivamente à elastina.', 'Retenção de água pelo estrato córneo, atribuída exclusivamente à elastina.', 'Retorno da pele após deformação, associado à rede elástica.', 'Renovação basal, atribuída à mitose das fibras elásticas.'],
      correctIndex: 2,
      explanationCorrect: 'Fibras elásticas favorecem distensão e retorno; os feixes de colágeno contribuem sobretudo para a resistência à tração.',
      explanationWrong: 'Identifique a função física da matriz alterada antes de escolher uma função de outra célula.',
      concept: 'Colágeno e fibras elásticas têm contribuições mecânicas complementares.',
      sourceIds: ['leeds_fibres'],
      rationale: ['Os feixes colágenos preservados têm papel central na resistência à tração.', 'A barreira à água depende da epiderme, sobretudo de corneócitos e lipídios.', 'Correto: o ensaio altera diretamente o componente de retorno elástico.', 'Fibras são matriz extracelular e não se dividem por mitose.']
    },
    {
      id: 'academic_derme_04', topic: 'Derme e matriz', category: 'estrutura',
      objective: 'Diferenciar hipoderme e derme sem confundir localização de anexos com origem.',
      question: 'Abaixo dos feixes densos aparecem lóbulos de adipócitos separados por septos conjuntivos e perfis de glândulas. Qual leitura topográfica é mais adequada?',
      options: ['É derme reticular; a presença de anexos torna os lóbulos adiposos parte obrigatória da derme.', 'É derme papilar; a vascularização dos septos define essa região superficial.', 'É epiderme profunda; a origem dos anexos define o plano de todo o tecido ao redor.', 'É hipoderme; anexos de origem epidérmica podem alcançar esse plano.'],
      correctIndex: 3,
      explanationCorrect: 'O tecido subcutâneo situa-se sob a derme. A origem epitelial de um anexo não restringe sua localização à epiderme.',
      explanationWrong: 'Diferencie a origem do tecido da posição que ele ocupa no corte.',
      concept: 'A hipoderme é subcutânea e não integra a pele propriamente dita, formada por epiderme e derme.',
      sourceIds: ['openstax_appendages', 'openstax_layers'],
      rationale: ['A presença de anexos não elimina a distinção topográfica com o tecido subcutâneo.', 'Papilas dérmicas são superficiais; o campo descrito é profundo.', 'Origem epidérmica não transforma o conjuntivo ao redor em epiderme.', 'Correto: reconhece tecido adiposo subcutâneo e a extensão dos anexos.']
    },
    {
      id: 'academic_anexos_01', topic: 'Anexos e glândulas', category: 'glandulas',
      objective: 'Distinguir porção secretora e ducto sudoríparo em cortes transversais.',
      question: 'No novelo de uma glândula écrina, alguns perfis são mais claros; outro tem lúmen pequeno e duas camadas de células cúbicas mais escuras. O segundo perfil corresponde melhor a quê?',
      options: ['Ducto excretor, distinto da porção secretora.', 'Porção secretora écrina, definida pelo revestimento cúbico biestratificado escuro.', 'Capilar, porque a parede parece formada por células pequenas.', 'Folículo piloso, porque todos os perfis em novelo produzem queratina.'],
      correctIndex: 0,
      explanationCorrect: 'O ducto écrino apresenta epitélio cúbico estratificado, geralmente com duas camadas, e costuma ser mais escuro que a porção secretora.',
      explanationWrong: 'Compare revestimento e lúmen antes de considerar apenas a proximidade com outros tubos.',
      concept: 'Um mesmo novelo glandular pode apresentar perfis secretores e ductais diferentes.',
      sourceIds: ['leeds_glands'],
      rationale: ['Correto: epitélio biestratificado e lúmen estreito sustentam ducto.', 'Essa combinação é mais característica do ducto que da porção secretora.', 'Capilares têm endotélio simples, não duas camadas cúbicas.', 'O novelo descrito é glandular; sua forma não implica produção de pelo.']
    },
    {
      id: 'academic_anexos_02', topic: 'Anexos e glândulas', category: 'glandulas',
      objective: 'Inferir secreção holócrina pela maturação de todo o sebócito.',
      question: 'Uma glândula ligada ao folículo tem células periféricas pequenas e células centrais cheias de lipídios, com desintegração celular no trajeto para o ducto. Qual mecanismo explica a secreção?',
      options: ['Merócrino: apenas vesículas saem, sem perda celular.', 'Holócrino: o conteúdo da célula desintegrada participa do sebo.', 'Endócrino: a célula inteira entra diretamente no sangue.', 'Apócrino: somente o polo apical é destacado, preservando todo o restante.'],
      correctIndex: 1,
      explanationCorrect: 'Na glândula sebácea, a maturação do sebócito termina em desintegração; o material celular contribui para o produto holócrino.',
      explanationWrong: 'O enunciado descreve perda da célula inteira, não apenas exocitose ou perda apical.',
      concept: 'A secreção sebácea é holócrina e exige renovação celular.',
      sourceIds: ['siu_skin'],
      rationale: ['Exocitose merócrina não explica a desintegração descrita.', 'Correto: relaciona maturação lipídica e perda do sebócito.', 'Há ducto para o folículo; não é uma glândula endócrina.', 'A perda limitada ao ápice não corresponde à perda da célula inteira.']
    },
    {
      id: 'academic_anexos_03', topic: 'Anexos e glândulas', category: 'estrutura',
      objective: 'Distinguir matriz pilosa epitelial e papila pilosa conjuntiva.',
      question: 'Na base de um folículo em crescimento, células com mitoses envolvem uma projeção vascularizada de conjuntivo. Qual associação identifica corretamente essas duas estruturas?',
      options: ['Papila epitelial proliferativa e matriz conjuntiva vascularizada.', 'Haste pilosa viva e estrato córneo vascularizado.', 'Matriz pilosa epitelial e papila dérmica conjuntiva.', 'Glândula sebácea e ducto sudoríparo biestratificado.'],
      correctIndex: 2,
      explanationCorrect: 'A matriz do bulbo gera células do pelo; a papila conjuntiva contém vasos e permanece separada do epitélio por lâmina basal.',
      explanationWrong: 'A região que prolifera é epitelial; os vasos pertencem à papila conjuntiva.',
      concept: 'O crescimento do pelo depende da relação entre epitélio da matriz e mesênquima da papila.',
      sourceIds: ['leeds_hair', 'openstax_appendages'],
      rationale: ['As identidades teciduais foram trocadas.', 'A haste queratinizada e o córneo não possuem vasos.', 'Correto: distingue o compartimento produtor e seu suporte conjuntivo.', 'Esses anexos não explicam a organização do bulbo descrito.']
    },
    {
      id: 'academic_anexos_04', topic: 'Anexos e glândulas', category: 'glandulas',
      objective: 'Relacionar posição e função das células mioepiteliais.',
      question: 'Entre células secretoras écrinas e sua lâmina basal há células alongadas com proteínas contráteis. Sua contração auxilia a saída da secreção. Que interpretação é adequada?',
      options: ['São miofibroblastos no estroma, cuja função é secretar o componente aquoso do suor.', 'São células musculares lisas da túnica média de um ducto.', 'São células ductais responsáveis por liberar sebo por desintegração.', 'São células mioepiteliais; a contração apoia o esvaziamento secretor.'],
      correctIndex: 3,
      explanationCorrect: 'Células mioepiteliais associam posição epitelial basal e capacidade contrátil; não são o mesmo que as células secretoras.',
      explanationWrong: 'A posição junto à lâmina basal e o apoio contrátil à unidade secretora são as pistas decisivas.',
      concept: 'Produção da secreção e auxílio mecânico ao esvaziamento podem caber a células diferentes.',
      sourceIds: ['leeds_glands', 'yale_skin'],
      rationale: ['Miofibroblastos são estromais; o enunciado descreve a posição epitelial junto à lâmina basal.', 'Ductos não têm uma túnica média vascular; a posição descrita é da unidade secretora.', 'Sebo holócrino vem de sebócitos, não dessas células écrinas.', 'Correto: identifica a célula e limita seu papel ao auxílio contrátil.']
    },
    {
      id: 'academic_receptores_01', topic: 'Receptores e vasos', category: 'estrutura',
      objective: 'Identificar um corpúsculo lamelar por arquitetura e profundidade.',
      question: 'No plano profundo da pele, uma estrutura oval tem muitas lamelas concêntricas em torno de uma terminação nervosa. Qual associação morfofuncional é mais consistente?',
      options: ['Corpúsculo de Pacini: receptor encapsulado associado a pressão profunda e vibração.', 'Corpúsculo de Meissner: receptor papilar associado ao tato superficial.', 'Complexo de Merkel: célula basal epidérmica associada a uma terminação nervosa.', 'Terminação livre: axônio sem cápsula especializada de lamelas concêntricas.'],
      correctIndex: 0,
      explanationCorrect: 'A organização lamelar profunda caracteriza Pacini. A cápsula modifica a transmissão mecânica até a terminação nervosa.',
      explanationWrong: 'Compare arquitetura e plano do corte; não identifique um receptor apenas pelo nome de uma sensação.',
      concept: 'Morfologia encapsulada e profundidade ajudam a distinguir receptores cutâneos.',
      sourceIds: ['yale_sensation', 'leeds_cells'],
      rationale: ['Correto: combina lamelas, profundidade e mecanorrecepção.', 'A associação funcional é válida, mas não explica a grande arquitetura lamelar profunda.', 'A localização basal epidérmica não corresponde ao corpúsculo descrito.', 'Terminações livres não possuem essa cápsula lamelar característica.']
    },
    {
      id: 'academic_receptores_02', topic: 'Receptores e vasos', category: 'estrutura',
      objective: 'Distinguir Meissner e Merkel pela localização microanatômica.',
      question: 'Em pele glabra, um pequeno receptor encapsulado ocupa uma papila dérmica, imediatamente abaixo da epiderme. Qual identificação é mais adequada que a de uma célula de Merkel?',
      options: ['Pacini, receptor de grande organização lamelar geralmente mais profundo.', 'Meissner, localizado no conjuntivo papilar.', 'Ruffini, terminação ramificada no conjuntivo dérmico.', 'Merkel, complexo celular e nervoso da região basal epidérmica.'],
      correctIndex: 1,
      explanationCorrect: 'Meissner ocupa papilas dérmicas; o complexo de Merkel está associado a células da região basal da epiderme.',
      explanationWrong: 'Diferencie um corpúsculo no conjuntivo de uma célula sensorial do epitélio basal.',
      concept: 'Localização tecidual evita confundir receptores próximos da superfície.',
      sourceIds: ['yale_sensation', 'leeds_cells', 'siu_skin'],
      rationale: ['A cápsula não basta: grande organização lamelar profunda difere do pequeno corpúsculo papilar.', 'Correto: posição papilar e encapsulamento concordam.', 'Uma terminação dérmica ramificada não corresponde à combinação de pequeno corpúsculo e posição papilar descrita.', 'Merkel está no epitélio basal e não corresponde ao corpúsculo no conjuntivo.']
    },
    {
      id: 'academic_receptores_03', topic: 'Receptores e vasos', category: 'vasos',
      objective: 'Explicar a nutrição de um epitélio avascular e o papel das papilas.',
      question: 'O corte mostra alças capilares nas papilas dérmicas, mas nenhum vaso dentro da epiderme normal. Como os queratinócitos basais recebem nutrientes?',
      options: ['Por perfusão direta de capilares localizados entre as células do estrato basal.', 'Por vasos próprios da lâmina basal, que terminam dentro dos queratinócitos.', 'Por difusão a partir do conjuntivo vascularizado, através da interface basal.', 'Por secreção nutritiva das glândulas sebáceas, substituindo a circulação dérmica.'],
      correctIndex: 2,
      explanationCorrect: 'A epiderme é avascular. A proximidade dos capilares dérmicos favorece a difusão para o epitélio.',
      explanationWrong: 'Não ver vasos no epitélio é esperado; procure sua relação com o conjuntivo subjacente.',
      concept: 'Vascularização dérmica e difusão sustentam metabolicamente a epiderme.',
      sourceIds: ['leeds_layers'],
      rationale: ['A epiderme normal não possui esses capilares intraepiteliais.', 'A lâmina basal é matriz extracelular, não uma rede de vasos intracelulares.', 'Correto: descreve a relação epitélio–conjuntivo.', 'Sebo não substitui o aporte por difusão a partir da derme.']
    },
    {
      id: 'academic_receptores_04', topic: 'Receptores e vasos', category: 'vasos',
      objective: 'Distinguir vaso de resistência e capilar pela parede vascular.',
      question: 'Em um plexo dérmico, um vaso pequeno tem endotélio cercado por uma ou duas camadas de músculo liso. Qual função é mais coerente com essa parede, em comparação a um capilar?',
      options: ['Favorecer trocas por uma parede formada apenas por endotélio e lâmina basal.', 'Coletar fluido intersticial em um capilar linfático de fundo cego.', 'Atuar como vênula pós-capilar, identificada pela ausência de camada muscular contínua.', 'Regular a resistência ao fluxo por contração do músculo liso arteriolar.'],
      correctIndex: 3,
      explanationCorrect: 'Arteríolas têm músculo liso que altera o calibre. Capilares apresentam parede muito mais delgada, especializada em trocas.',
      explanationWrong: 'Compare a camada muscular arteriolar com a parede capilar delgada antes de inferir a função.',
      concept: 'A estrutura da parede vascular se relaciona ao controle de fluxo e às trocas.',
      sourceIds: ['openstax_vessels'],
      rationale: ['Essa parede delgada é capilar e não explica as camadas musculares observadas.', 'Uma parede linfática inicial delgada não corresponde à média muscular descrita.', 'Vênulas pós-capilares não exibem essa organização muscular arteriolar.', 'Correto: associa músculo liso arteriolar e regulação do fluxo.']
    },
    {
      id: 'academic_reparo_01', topic: 'Reparo e integração', category: 'integracao',
      objective: 'Reconhecer tecido de granulação sem confundi-lo com estrato granuloso.',
      question: 'Em uma sequência didática de reparo dérmico, surgem muitos capilares novos, fibroblastos e matriz ainda pouco organizada. Como interpretar esse campo?',
      options: ['Tecido de granulação, com angiogênese e formação de matriz.', 'Estrato granuloso, definido pelo acúmulo de grânulos proteicos em células epiteliais.', 'Cicatriz madura, com feixes colágenos predominantes e menor vascularização.', 'Coágulo inicial, formado principalmente por fibrina e elementos sanguíneos.'],
      correctIndex: 0,
      explanationCorrect: 'Tecido de granulação é conjuntivo de reparo com novos vasos e fibroblastos. Seu nome não o torna um estrato da epiderme.',
      explanationWrong: 'Diferencie granulação, processo de reparo conjuntivo, de granuloso, estrato epidérmico.',
      concept: 'Angiogênese e produção de matriz caracterizam a fase proliferativa do reparo.',
      sourceIds: ['openstax_repair'],
      rationale: ['Correto: integra vasos novos, células e matriz em formação.', 'Esse estrato é epitelial e avascular, diferente do campo conjuntivo observado.', 'A descrição da cicatriz é válida, mas contradiz a abundância de capilares novos do enunciado.', 'Fibrina inicial não explica, sozinha, capilares novos e fibroblastos produzindo matriz.']
    },
    {
      id: 'academic_reparo_02', topic: 'Reparo e integração', category: 'celulas',
      objective: 'Diferenciar reepitelização e reposição da matriz dérmica.',
      question: 'Na recuperação de uma pequena área superficial, uma frente de células epiteliais avança sobre o leito. Qual evento restaura diretamente a cobertura epidérmica?',
      options: ['Contração dos miofibroblastos no conjuntivo, aproximando as margens.', 'Migração e proliferação de queratinócitos viáveis, seguidas de diferenciação.', 'Fibroplasia, com deposição de colágeno no leito conjuntivo.', 'Angiogênese, com brotamento de novos capilares para o leito.'],
      correctIndex: 1,
      explanationCorrect: 'A reepitelização depende de queratinócitos viáveis que migram, proliferam e reconstituem o epitélio. Produzir matriz dérmica é outra tarefa.',
      explanationWrong: 'Separe o fechamento epitelial da produção do tecido conjuntivo que o sustenta.',
      concept: 'Epitélio e conjuntivo participam do reparo por mecanismos celulares diferentes.',
      sourceIds: ['openstax_epithelialization'],
      rationale: ['Contração aproxima margens, mas não forma diretamente as camadas epiteliais.', 'Correto: descreve os processos celulares da reepitelização.', 'Colágeno sustenta o tecido, mas não substitui a cobertura epitelial.', 'Vasos sustentam o reparo, mas não constituem o epitélio de revestimento.']
    },
    {
      id: 'academic_reparo_03', topic: 'Reparo e integração', category: 'integracao',
      objective: 'Comparar tecido de reparo inicial e cicatriz em maturação.',
      question: 'Em campos sucessivos de um modelo de reparo profundo, diminuem os capilares e a celularidade, enquanto a matriz colágena passa a predominar. Qual interpretação é mais adequada?',
      options: ['Há início da formação do tecido de granulação, com pico de brotamento capilar.', 'Predomina a fase inflamatória inicial, definida pelo aumento progressivo de leucócitos.', 'Há maturação do tecido de reparo em uma cicatriz mais fibrosa.', 'Há regeneração integral, comprovada apenas pelo aumento do colágeno.'],
      correctIndex: 2,
      explanationCorrect: 'A maturação do reparo modifica matriz, vasos e células. Uma cicatriz não implica reconstrução completa de todos os anexos originais.',
      explanationWrong: 'Mudanças de matriz e vascularização podem indicar maturação sem equivaler à regeneração perfeita.',
      concept: 'Reparo fibroso e regeneração integral são resultados distintos.',
      sourceIds: ['openstax_repair'],
      rationale: ['O enunciado informa redução capilar e maior predomínio de colágeno, não o brotamento inicial.', 'A queda de celularidade e o predomínio colágeno não sustentam essa leitura inicial.', 'Correto: integra menor vascularização e predomínio de matriz.', 'Colágeno aumentado não comprova restituição dos anexos e da organização original.']
    },
    {
      id: 'academic_reparo_04', topic: 'Reparo e integração', category: 'integracao',
      objective: 'Integrar posição da glândula, trajeto do ducto e perda de calor por evaporação.',
      question: 'Um corte reúne porção secretora écrina profunda e ducto que chega à superfície. Ao relacionar a estrutura ao calor na fazenda, qual sequência é correta?',
      options: ['Porção secretora → ducto → superfície: a secreção por si só garante resfriamento, mesmo sem evaporar.', 'Porção secretora → folículo piloso → superfície: esse trajeto é obrigatório para toda glândula écrina.', 'Plexo dérmico → porção secretora → sangue: a perda evaporativa ocorre dentro do lúmen glandular.', 'Porção secretora → ducto → superfície: a evaporação do suor pode retirar calor.'],
      correctIndex: 3,
      explanationCorrect: 'O trajeto glandular leva suor à superfície; sua evaporação remove calor. Suor presente sem evaporar não garante o mesmo resfriamento.',
      explanationWrong: 'Acompanhe o produto pelo ducto e identifique a mudança física que permite a perda de calor.',
      concept: 'Uma estrutura secretora profunda pode atuar na superfície por meio de um ducto.',
      sourceIds: ['yale_sensation', 'leeds_glands'],
      rationale: ['Produzir e perder suor sem evaporação não garante o mesmo efeito térmico.', 'Écrinas abrem na superfície; conexão folicular não é seu trajeto obrigatório.', 'O suor segue pelo ducto para fora; evaporação relevante ocorre na superfície.', 'Correto: conecta unidade secretora, ducto e mecanismo físico.']
    }
  ].map(function (question, index) {
    // Ordem editorial fixa: sem sorteio em abertura, revisão ou restauração de save.
    // As justificativas acompanham as alternativas; os gabaritos não repetem A/B/C/D por tema.
    const answerSlots = [2, 0, 3, 1, 1, 3, 0, 2, 3, 2, 1, 0, 0, 2, 3, 1, 2, 1, 0, 3, 1, 0, 2, 3];
    const correctIndex = answerSlots[index];
    const options = question.options.slice();
    const rationale = question.rationale.slice();
    const previous = question.correctIndex;
    [options[previous], options[correctIndex]] = [options[correctIndex], options[previous]];
    [rationale[previous], rationale[correctIndex]] = [rationale[correctIndex], rationale[previous]];
    return Object.assign({ title: 'Histologia acadêmica', difficulty: 'academico', academic: true }, question, {
      subtitle: question.topic, options: options, rationale: rationale, correctIndex: correctIndex
    });
  });

  function freezeDeep(value) {
    Object.keys(value).forEach(function (key) {
      if (value[key] && typeof value[key] === 'object') freezeDeep(value[key]);
    });
    return Object.freeze(value);
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  freezeDeep(SOURCES);
  freezeDeep(QUESTIONS);
  root.FarmAcademicHistology = Object.freeze({
    version: '6.15.0',
    questions: function () { return copy(QUESTIONS); },
    sources: function () { return copy(SOURCES); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
