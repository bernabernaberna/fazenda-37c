# Política de Privacidade — Fazenda 37 °C

> Modelo (rascunho) adequado ao fluxo de dados real do jogo. Preencha os campos
> `[PREENCHER: ...]` e submeta a revisão jurídica antes do lançamento oficial.
> Base legal: **Lei nº 13.709/2018 (LGPD)**.
>
> ⚠️ Atenção especial: o jogo é usado por **alunos, possivelmente menores de idade**.
> A LGPD dá **proteção reforçada** a dados de crianças e adolescentes (art. 14).

*Última atualização: [PREENCHER: data].*

---

## 1. Quem é o responsável (Controlador)

- **Responsável pelo tratamento dos dados:** [PREENCHER: nome da pessoa, grupo, escola ou empresa]
- **Contato / Encarregado (DPO):** [PREENCHER: e-mail de contato para assuntos de privacidade]

> Se o jogo for usado dentro de uma escola, normalmente a **escola** também atua como
> controladora. Recomenda-se um **acordo por escrito** definindo papéis.

## 2. Quais dados são coletados

O jogo guarda a partida e os registros de atividade **localmente**, mesmo sem
código de turma. O **Modo Professor** permite enviar somente os registros de
quiz descritos abaixo, com turma ativa e autorização de envio.
**Sem código de turma ou sem autorização, nenhum registro é enviado para a nuvem.**

| Dado | Como é coletado | Para quê |
|---|---|---|
| **Nome ou apelido** do aluno | Digitado na tela inicial | Identificar a partida local e, quando autorizado, o desempenho para a professora |
| **Código da turma** | Digitado (opcional) | Agrupar os resultados de uma turma |
| **Registros dos quizzes** (acerto/erro, conceito, categoria, dificuldade, pontuação, data/hora) | Gerados ao jogar | Histórico local e acompanhamento de atividade pela professora, quando autorizado |
| **Estado da partida** (personagem escolhido, posição no mapa, itens, tarefas, medidores e conceitos vistos) | Gerado durante o jogo e salvo no navegador | Continuar a mesma partida; não representa posição ou saúde reais do aluno |
| **Jornada e relatório local** (ciclos, primeiras respostas, recompensas e observações da simulação) | Gerados durante a partida | Consultar o progresso e exportar um relatório por escolha do jogador |
| **História do Vale** (capítulos, pedidos aceitos, escolhas predefinidas de diálogo, amizade e memórias dos personagens fictícios) | Gerados durante a partida e salvos no navegador | Retomar a narrativa; estes registros não são enviados ao Modo Professor e são apagados ao excluir a partida local |
| **Preferências de som, interface e acessibilidade** | Configuradas no aparelho | Manter as opções escolhidas para jogar |

**Não são coletados:** e-mail, telefone, localização, contatos, dados de pagamento,
nem qualquer dado sensível (saúde, biometria etc.).

## 3. Onde os dados ficam

- **Sempre:** uma cópia fica **apenas no aparelho** do aluno (armazenamento local do navegador).
- **Somente se houver código de turma E a nuvem estiver configurada:** os registros são
  enviados para o **Supabase** (serviço de banco de dados em nuvem) configurado pela
  professora. Servidores podem estar **fora do Brasil** → verificar a região do projeto
  Supabase e as regras de **transferência internacional** (LGPD, art. 33).

## 4. Por que podemos tratar esses dados (base legal)

- **Consentimento** do responsável legal (para menores) e/ou do próprio aluno maior de idade (art. 7º, I).
- Finalidade **estritamente pedagógica**, no melhor interesse do estudante (art. 14, §3º).

## 5. Crianças e adolescentes (proteção reforçada)

- Para **crianças** (até 12 anos incompletos), o tratamento exige **consentimento específico
  de pelo menos um dos pais ou responsável legal** (art. 14, §1º).
- **Medidas já implementadas no jogo:**
  - **Portão de consentimento:** ao digitar um código de turma, o aluno só consegue iniciar
    após marcar *"Tenho autorização do meu responsável para enviar meu apelido e desempenho…"*.
    **Sem essa marcação, nada é enviado à nuvem** (verificado em código: o envio só ocorre com
    nuvem configurada **+** código de turma **+** consentimento).
  - **Minimização:** o campo agora é "Seu nome ou apelido" e sugere apelido em vez do nome
    completo. O envio ao Modo Professor fica limitado aos registros de quiz;
    estado da partida, jornada e preferências permanecem locais.
  - **Acesso e exclusão (art. 18):** link "Meus dados / privacidade" mostra o que está guardado
    no aparelho. Após confirmação, apaga telemetria local, filas pendentes,
    código de turma, autorização, jogo salvo e jornada da partida atual;
    reinicia o personagem e retorna ao menu. Preferências de som, interface
    e acessibilidade continuam disponíveis, conforme o aviso exibido.
  - O código de turma é **opcional** e sinalizado como uso a pedido da professora.

## 6. Compartilhamento

Os dados **não são vendidos** nem usados para publicidade. São acessíveis:
- À **professora** responsável pela turma (via painel do Modo Professor).
- Ao **Supabase**, como **operador** (apenas para armazenar/servir os dados). Recomenda-se
  registrar um acordo de tratamento de dados com o provedor.

## 7. Por quanto tempo guardamos / como excluir

- **Retenção:** [PREENCHER: ex.: “até o fim do período letivo” ou “X meses”].
- **Partida local:** o save permanece no navegador para continuar o jogo. O
  relatório guarda até **60 estações** no histórico; os totais acumulados da
  partida continuam disponíveis após esse limite. Esses limites técnicos não
  constituem um prazo de retenção institucional.
- **Exclusão local:** “Meus dados / privacidade” permite apagar os registros e
  o jogo salvo após confirmação, incluindo a jornada da partida atual. As
  preferências permanecem; para apagar também todas as opções, é possível
  limpar os dados deste site/arquivo no navegador.
- **Exportações:** JSON e CSV são baixados somente por ação do jogador. Esses
  arquivos ficam fora do armazenamento controlado pelo jogo; a exclusão local
  não apaga cópias já baixadas, compartilhadas ou guardadas em outro aparelho.
  Quem exportou precisa excluir essas cópias separadamente.
- **Dados enviados à professora:** o titular (ou responsável) pode solicitar
  exclusão pelo contato do item 1. Apagar no aparelho não exclui registros
  já recebidos na nuvem.

## 8. Direitos do titular (LGPD, art. 18)

O aluno (ou seu responsável) pode, a qualquer tempo: confirmar a existência de tratamento;
acessar os dados; corrigir; solicitar **anonimização ou exclusão**; revogar o consentimento.
Para exercer, contatar: [PREENCHER: e-mail].

## 9. Segurança (Supabase / RLS) — IMPORTANTE

**O risco:** para os alunos enviarem dados, a **chave anon** do Supabase precisa estar no
jogo deles. Se a tabela não tiver proteção, qualquer aluno com essa chave poderia **ler os
dados dos colegas**. Por isso, configure o Supabase com **RLS (Row Level Security)**.

**Configuração reproduzível:** execute o arquivo completo
[`supabase/schema.sql`](supabase/schema.sql) no SQL Editor do Supabase. Ele cria
as tabelas e funções, remove policies antigas conhecidas e define as regras
vigentes em conjunto:

- Aluno com chave `anon`: somente INSERT para uma turma **existente e aberta**,
  verificada por `public.class_is_open(class_code)`, com limites no payload.
- Chave `anon`: nenhuma policy de SELECT para respostas dos alunos.
- Professor autenticado: SELECT e DELETE somente para suas próprias turmas.

Não acrescente uma policy permissiva de INSERT com `WITH CHECK (true)`: ela
permitiria gravar fora da restrição de turma aberta e enfraqueceria o conjunto.
A presença do script no projeto não comprova que o banco publicado já recebeu
essas regras; a instalação e os testes de RLS precisam ser confirmados no
ambiente utilizado antes de ativar o Modo Professor.

**Como a professora vê os resultados (escolha um):**
- **Recomendado:** abrir o **painel do Supabase** (logada) e ver/exportar a tabela `quiz_events`.
  É o caminho mais seguro: a leitura exige login, não a chave anon.
- Se quiser usar o painel **dentro do jogo**, será preciso uma leitura protegida (ex.: função
  RPC/Edge Function autenticada). **Nunca** embuta a `service_role` key no jogo distribuído.

**Outras medidas:**
- Não publicar a chave anon em repositórios públicos sem RLS ativo.
- Definir retenção e excluir os dados ao fim do período letivo (item 7).
- [PREENCHER: medidas adicionais específicas do seu ambiente].

## 10. Alterações

Esta política pode ser atualizada. A data no topo indica a última revisão.

---

# Termo de Consentimento (texto curto para autorização)

> Use este texto no comunicado/autorização enviado aos responsáveis **antes** de o aluno
> usar o Modo Professor com código de turma.

**Autorização de uso de dados — atividade educativa “Fazenda 37 °C”**

A atividade “Fazenda 37 °C” é um jogo educativo sobre o corpo humano (termorregulação e
pele). Quando usado com um **código de turma**, o jogo registra um **apelido** escolhido
pelo aluno e o seu **desempenho nos quizzes** (acertos, erros e pontuação), para que a
professora acompanhe a aprendizagem. **Não são coletados nome completo, e-mail, telefone,
localização ou dados sensíveis.** Os dados são usados **somente para fins pedagógicos**,
podem ser **excluídos a pedido** e não são compartilhados para publicidade.

☐ Eu, responsável pelo(a) aluno(a) **[nome]**, **autorizo** o uso descrito acima, conforme
a LGPD (Lei nº 13.709/2018).

Responsável: __________________________  Data: ____/____/______  Assinatura: __________

---

# Aviso curto exibido dentro do jogo (microcopy)

> Texto sugerido para aparecer na tela inicial quando o aluno digita um código de turma:

“Ao usar um código de turma, seu **apelido** e seu **desempenho nos quizzes** serão enviados
à sua professora. Use um apelido, não seu nome completo. Saiba mais na Política de
Privacidade.”
