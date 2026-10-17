# Revisão independente das melhorias locais

Data: 17/10/2026. Base: checkpoint `1909409`, diff de `index.html`, `platform/app.js`, `api.js`, `styles.css`, módulo novo `exports.js` e testes relacionados. Lidos `docs/PESQUISA-APPS.md`, `EM-ANDAMENTO.md` e os trechos de backend usados pelos novos fluxos. Não há `AGENTS.md` na raiz deste projeto. Revisão estática, sem rede, servidor ou navegador; o integrador executa a validação. Não alterei código ou testes.

## Achados iniciais e rechecagem

### P2 resolvido no código — Resposta de envio anterior apagava rascunho do paciente atual

Referências da primeira leitura: `platform/app.js:850`, `:1083`, `:1088`. Nessa versão, submit capturava paciente, mas não geração/conta, e anunciava sucesso/renderizava sem verificar mudança de contexto.

Sequência inicial: profissional enviava mensagem do paciente A; a resposta demorava; mudava para B e começava a digitar; resposta A concluía; o `render()` tardio reconstruía a tela B e eliminava seu texto ainda não enviado. A requisição usava o paciente A capturado: era perda de rascunho e retorno de estado no contexto errado, sem evidência de gravação no paciente errado.

Rechecagem estática: `submit` agora captura geração/conta/paciente e define `sameScreen()`. O retorno comum, publicação e retornos específicos de senha/perfil/consentimentos/cadastro de paciente verificam esse contexto antes de render/toast. O catch não anuncia erro de formulário removido na nova tela. A causa dos cenários A→B descritos está corrigida no código. O integrador informou ter observado a regressão browser falhar antes da correção, com textarea B apagada; o teste novo foi lido nesta revisão.

### P2 resolvido no código — Origem da lista era inferida de outra leitura

Referências: função `shopping` em `platform/app.js`; ramo de geração de compras em `server/care.mjs:155`–`:175`.

Na primeira leitura, compras e plano eram consultados em paralelo; publicação entre as leituras podia mostrar lista do plano A com rótulo de origem B.

Rechecagem estática: a consulta SQL passou a selecionar `id,created,data` da mesma linha de plano. A resposta de compras agora inclui `planVersion: {id, created}` obtida dessa linha e usa `data` dela para somar as quantidades. O frontend removeu a consulta paralela ao plano e usa `list.items[0].planVersion`. Isso elimina a atribuição a outra versão por corrida entre os GETs. A ampliação do contrato é pequena e explícita: id/data de plano já autorizado. O teste novo verifica versão e quantidades antes/depois de publicação; o integrador informou ter observado RED com planVersion ausente e, após corrigir, 57/57 testes aprovados.

### Limitação encontrada e corrigida na integração — Digitação durante envio

O guard de contexto não detecta edição do próprio formulário: os campos continuam editáveis enquanto o botão de envio fica desabilitado. Texto acrescentado após submit não pertence ao snapshot de FormData enviado e pode sumir quando o sucesso reconstrói a tela. Isso já existia na base e é distinto da regressão A→B corrigida. A garantia confirmável desta rodada é retenção após falha no mesmo formulário, não preservação de qualquer edição concorrente. O integrador posteriormente bloqueou os campos do formulário enquanto a requisição está pendente e preservou alterações posteriores nos rascunhos de plano/receita por comparação com o snapshot enviado; a regressão de publicação falhou antes do ajuste e passou depois. Não houve reprodução runtime desse caso por este revisor.

## Constatações favoráveis no escopo

- `planDocument` usa allowlist de campos em dois níveis, aceita apenas strings e números finitos e cria objetos novos. Não carrega ids de paciente/profissional, e-mail, senha ou campos adicionais por spread. Textos livres permitidos ainda podem conter dados pessoais; o arquivo não é anônimo nem arquivo completo da conta.
- Autoria UI/export deriva de `authorId` retornado e de vínculo já conhecido; ausência de correspondência é indicada na UI e fica vazia no JSON. Não é inventado nome de profissional.
- O filtro de refeições altera somente `hidden` nas seções. Não muda o plano, suas quantidades ou a exportação completa.
- `shoppingText` preserva gramas que o backend já multiplicou pelo período; não multiplica novamente. Porções manuais são identificadas como diárias e sem conversão. O formato é texto simples; não há inclusão do conteúdo via innerHTML.
- `calendarText` inclui resumo genérico, horários UTC com Z, UID estável, DTSTAMP e estado CANCELLED quando aplicável. Não inclui nome, observação, telefone, e-mail, attendee ou description. Escape/folding UTF-8 e rejeição de datas inválidas estão implementados. Horários ainda são pessoais, conforme aviso de compartilhamento da UI.
- O calendário é importação manual: UID estável não garante que todos os aplicativos externos substituam ou removam eventos ao reimportar. Nenhuma sincronização ou envio automático é implementado ou prometido.
- Download captura geração, conta e paciente, consulta endpoints existentes com AbortSignal e verifica o contexto antes de criar/clicar o arquivo. Não identifiquei caminho de download tardio para a conta/paciente que substituiu o contexto original. Um retorno antigo ainda pode lançar erro durante construção, mas o guard impede baixar o conteúdo naquele contexto.
- No mesmo formulário conectado, erro de rede conserva os valores no DOM e reabilita o botão; estado pending e aria-busy são definidos antes do envio. Não existe persistência offline nova nem armazenamento clínico em localStorage/service worker. A indicação navigator.onLine é um aviso, não prova de disponibilidade da API.
- Não foram adicionados pacote, integração paga, trial ou canal externo. O contrato existente de compras recebeu somente `planVersion` para identificar o plano autorizado usado no cálculo; o backend continua sendo a autoridade de acesso e serializers não concedem permissão.

## Evidências e limites

Foram lidos nove testes unitários novos de exportação, o teste API de proveniência e os cenários adicionados no browser, inclusive falha offline e retorno tardio A→B. A leitura dos testes não é sua execução. Nesta rechecagem, o integrador confirmou 57/57 testes unitários/API aprovados e informou que a rodada de 27 cenários browser ainda estava em andamento. Esses resultados são atribuídos ao integrador; este revisor não executou comandos de teste. Também não se declara conformidade completa de acessibilidade, aprovação clínica ou segurança universal.

As rodadas antigas da API e da demonstração permanecem evidências históricas dos respectivos códigos. Elas não substituem os testes atuais da plataforma autenticada. `docs/EM-ANDAMENTO.md` preserva a condição de demonstração sem liberação para dados clínicos reais; a pesquisa de apps é descoberta anedótica e não prova eficácia clínica ou prevalência de problemas.

Os dois P2 iniciais foram corrigidos e rechecados estaticamente. O integrador confirmou posteriormente 66 testes API/serializers e 29 fluxos de navegador aprovados, com relatórios em docs/evidencias. Isso é execução do integrador, não execução deste revisor.

## Integração posterior confirmada pelo orquestrador

Além dos ajustes acima, mensagens novas receberam vínculo determinado no servidor; a troca de profissional não expõe a conversa anterior. Rascunhos são filtrados e removidos somente pelo autor. Nove testes de relacionamento verificam o novo vínculo, mensagens legadas sem atribuição, rascunhos e continuidade do histórico de planos publicados autorizado. Mensagens legadas sem linkId ficam preservadas no banco, mas não são associadas por suposição ao chat atual; uma migração exige identificar o vínculo correto.

Validação final executada pelo integrador:66/66 em npm test, 29/29 fluxos de navegador,109 verificações da demo, zero falhas. O teste de backup com base fictícia aberta também passou. Evidências: [VALIDACAO.md](VALIDACAO.md).
