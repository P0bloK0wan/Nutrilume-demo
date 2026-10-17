# Pesquisa pública de aplicativos — oportunidades para Nutrilume

Consulta: **17/10/2026 UTC**. Pesquisa de avaliações públicas de **Dietbox, WebDiet, Tecnonutri, MyFitnessPal e Cronometer**. Documento de descoberta; não altera código, plano alimentar, porções, medicamentos ou decisões de nutricionista. Nenhuma assinatura, API paga, trial ou publicação foi ativada.

## Método e limites

Buscas na internet localizaram páginas de avaliações; em seguida foram abertas as páginas originais do Google Play, App Store e fórum oficial do Cronometer. Os relatos abaixo são de usuários identificados publicamente pela loja/fórum. Sua identidade, condição de cliente e veracidade material não foram verificadas por nós. A seleção é pequena, intencional e anedótica, sem representatividade estatística, cálculo de prevalência ou ranking de qualidade. A ordem/destaque das lojas, país, idioma, cache e versões influenciam o que aparece. Relato antigo inspira hipótese de produto, não prova falha atual.

As páginas acessadas devolveram conteúdo textual das avaliações, sem bloqueio nesta coleta. Não fizemos login, compra, scraping integral ou teste dos apps. O ano de algumas datas não aparece na página: nesses casos ele fica desconhecido. Algumas lojas repetem a mesma avaliação em blocos da página; foi contada uma vez. Respostas de desenvolvedores e descrições comerciais são separadas de opinião de usuário. Citações literais somam no máximo25palavras por página; o restante é síntese breve própria.

Contexto local lido: `docs/EM-ANDAMENTO.md` e `docs/specs/plataforma.md`. Nutrilume continua uma demonstração em revisão, sem liberação para dados clínicos reais/pacientes; há planos versionados, vínculos, consentimentos, receitas/compras, sessões HttpOnly e redução de movimento previstos ou implementados. As ideias devem melhorar e verificar esses fluxos existentes, não anunciar recursos duplicados nem afirmar que defeitos dos concorrentes existem aqui.

## Relatos observados e sua utilidade

### S1 — Dietbox: bom produto, mas acesso e controles podem impedir uso

Fonte: [Google Play — Dietbox, seção de avaliações](https://play.google.com/store/apps/details?hl=pt_BR&id=com.craftbox.dietbox), consultada em17/10/2026. Alessandra Aires,06/08/2026, elogia evolução mas relata novo login a cada abertura. Gustavo Espose,13/08/2026, descreve autenticação problemática, botões sobrepostos à navegação Android e plano desaparecido. Márcio Antony,22/08/2026, relata refeição aparentemente já registrada sem conseguir editar. São três experiências individuais; não verificamos causa ou reprodução. Trecho: “Aplicativo é bom e percebo evolução sempre.”

Hipótese para Nutrilume: sessão estável com expiração clara, safe area móvel e estados de registro editáveis merecem prioridade maior que novos gráficos. Não salvar senha em texto nem prolongar sessão indefinidamente para resolver conveniência. A ficha de segurança da loja é declaração do fornecedor; não usamos suas etiquetas como auditoria de privacidade.

### S2 — WebDiet: clareza exige reduzir navegação dentro da prescrição

Fonte: [Google Play — WebDiet para pacientes](https://play.google.com/store/apps/details?hl=pt_BR&id=br.com.webdiet.webdiet), consultada em17/10/2026. Tâmara Marinho,18/08/2026, considera o app bom, mas relata rolagem longa entre alternativas e pede visualizar opções escolhidas para a semana. Ana Luisa Deguer Funke,04/08/2026, pede atalho da refeição à receita. Alessandra Reis,04/08/2026, elogia a praticidade e sugere registros adicionais. Trecho: “Ademais, bem prático e intuitivo!”

Hipótese: permitir recolher/favoritar visualmente alternativas já prescritas e abrir a receita vinculada, mantendo todas as opções acessíveis. Isso organiza a leitura; não libera substituições novas ou recalcula prescrição. Pedidos clínicos adicionais não entram automaticamente no escopo.

### S3 — WebDiet: vínculo profissional e lista de compras precisam ficar explícitos

Fonte: [App Store — WebDiet, avaliações públicas](https://apps.apple.com/us/app/webdiet-para-pacientes/id1195115431?see-all=reviews), consultada em17/10/2026. VHPJ,20/01/2024, relata não visualizar dieta com novo nutricionista;32424577**,15/09/2022, relata continuar vendo a antiga. cmellosoares,10/09/2020, elogia e pede lista derivada da dieta. A resposta do desenvolvedor diz que a habilitação depende do profissional: a experiência relatada não demonstra ausência absoluta do recurso. Trecho: “Não consigo ver minha nova dieta com outro nutricionista”.

A página também mostra reclamação de Liliani C.,data exibida13Mar sem ano, sobre valores atribuídos a foto e total que não refletiria edição. Não tratamos esse cálculo como medido ou validado. Hipótese: mostrar profissional/vínculo/versão do plano e explicar estados sem publicação; compras devem apontar qual plano/receita as originou. Não propor cálculo por foto ou IA clínica.

### S4 — Tecnonutri: flexibilidade agrada; conveniência e preço precisam ser compreensíveis

Fonte: [App Store BR — Tecnonutri, avaliações](https://apps.apple.com/br/app/tecnonutri-encontre-sua-dieta/id574794938?platform=iphone&see-all=reviews), consultada em17/10/2026. Isadora K.,03/07/2024, elogia nomes/opções de refeições e sente falta de código de barras. Sousza,08/01/2019, reclama de expectativa de gratuidade. DGR87XPTO,19/10/2020, elogia o controle anterior mas critica cobrança posterior. São relatos históricos; não estabelecem condições comerciais atuais. Trecho: “Adorei, porém senti falta do leitor de código de barras”.

Hipótese: nomes familiares, lista simples e funções disponíveis claramente identificadas ajudam mais agora que scanner dependente de base externa. Em Nutrilume, não anunciar grátis algo que exija serviço pago nem usar trial sem clareza. Scanner e catálogo nutricional amplo ficam fora do trabalho de hoje.

### S5 — MyFitnessPal: fluxo interrompido e publicidade atrapalham o registro

Fonte: [Google Play — MyFitnessPal, avaliações](https://play.google.com/store/apps/details?id=com.myfitnesspal.android), consultada em17/10/2026. Kaisle,28/04/2026, prefere o app a alternativas, mas relata ordem confusa no diário e retorno inesperado à tela inicial durante busca. Jackie Wirtjes,14/04/2026, relata erros ao salvar receitas e atualiza a própria avaliação dizendo que finalmente funcionam. Rhonda Allen,03/03/2025, elogia acompanhamento de entradas, mas critica anúncios e código de barras pago. Trecho: “Updated rating as recipes now work finally.”

Hipótese: preservar dados já digitados durante erro da mesma sessão, manter ordenação previsível e distinguir salvando/salvo/falhou. A correção mencionada pela própria usuária impede apresentar o erro de receitas como falha atual confirmada. Não adicionar anúncios ou barreiras comerciais ao registro essencial da demo.

### S6 — Cronometer: exportação e repetição de tarefas são vantagens percebidas

Fonte: [App Store — Cronometer, loja da Polônia](https://apps.apple.com/pl/app/cronometer-calorie-counter/id1145935738?platform=ipad), consultada em17/10/2026. Renatka19860101,data exibida23May sem ano, elogia registro rápido, cópia de refeições anteriores e download CSV pelo browser na versão gratuita. Jul3850,12/08/2025 conforme exibido na loja, elogia visualização de nutrientes e cadastro ágil. A data numérica segue apresentação da página; não inferimos outra localidade. Trecho: “Adding foods or meals is easy and quick.”

Hipótese: acesso fácil aos próprios dados e repetição de registros sem redigitação trazem valor. Portabilidade não é apenas existir endpoint; precisa ser encontrada e compreendida. Reutilizar registro nunca deve copiar automaticamente uma prescrição antiga como se fosse a atual. O relato não é garantia de todos os campos/formatos exportados atualmente.

### S7 — Cronometer: teclado e foco também são facilidade de uso

Fonte: [fórum oficial — Keyboard Accessibility Improvements/Efforts](https://forums.cronometer.com/discussion/5194/keyboard-accessibility-improvements-efforts), consultada em17/10/2026. davidxc,junho/2022, elogia app web e funcionalidades, mas relata dificuldade para tabular, selecionar busca e controlar foco. Afirma não usar leitor de tela; sua especulação sobre leitores não é teste de acessibilidade. Trecho: “Very little of the site is accessible via the Tab key.”

Hipótese: formulário semântico, foco visível e sequência de teclado valem para todas as pessoas. Este relato histórico não prova estado atual do Cronometer nem conformidade/inconformidade jurídica. Nutrilume precisa de teste próprio com teclado, zoom e leitor de tela antes de alegar acessibilidade completa.

### S8 — Cronometer: função disponível pode continuar difícil de descobrir

Fonte: [fórum oficial — Sharing data with doctor](https://forums.cronometer.com/discussion/2547/sharing-data-with-doctor), consultada em17/10/2026. davo e RalphD73,agosto/2019, perguntam como compartilhar/exportar/imprimir; davo elogia o app mas não entende o mecanismo. Uma resposta identificada da equipe explica CSV para usuários sem Gold e relatório para Gold naquela época. Trecho: “I would also like to know how to export in csv format.”

Hipótese: uma central dos meus dados precisa explicar formato, período e destino; não pressupor que exportação só serve para usuários técnicos. A fala da equipe é contexto histórico de funcionalidade, não avaliação independente nem promessa comercial atual.

## Dez oportunidades priorizadas

Ordem por redução de fricção/risco e esforço provável, não por frequência estatística. P0 vem antes de expansão funcional; P1 agrega uso diário; P2 exige trabalho de dados/autorização maior. Estimativas pressupõem revisão do que já existe e não são compromisso de prazo. Todas podem usar código local e componentes nativos, sem contratação ou APIs externas.

| Ordem | Prioridade e ideia | Evidência | Recorte concreto / critério de aceite | Esforço provável |
|---|---|---|---|---|
|1|P0 — Cabeçalho inequívoco do plano|S1,S3|Exibir profissional, versão/data publicada, paciente e estado de vínculo; ausência de publicação é explicada. Troca de paciente/vínculo não conserva plano anterior visível.|Pequeno para apresentação; segurança exige regressões existentes.|
|2|P0 — Salvamento com retorno claro|S1,S5|Botão mostra salvando/salvo/erro, evita duplicação, mantém texto após erro recuperável na sessão e oferece tentar novamente. Não afirmar sucesso antes da API.|Médio; revisar API e UI.|
|3|P0 — Sessão e expiração compreensíveis|S1,S3|Acesso permanece durante validade permitida; expiração explica novo login e não apaga silenciosamente formulário. Logout/revogação continuam imediatos.|Médio; testar cookies/isolamento.|
|4|P0 — Controles móveis e teclado|S1,S7|Nenhum botão atrás da navegação/teclado; foco visível, labels reais, ordem de Tab e modal com retorno de foco; zoom200% sem perda essencial.|Pequeno/médio, por fluxo.|
|5|P1 — Receita ao alcance da refeição|S2|Link ou botão abre receita já vinculada à refeição e retorna ao mesmo ponto do plano; receita ausente/inacessível tem estado claro.|Pequeno se vínculo já existe.|
|6|P1 — Minhas opções da semana|S2|Favorito/recolhimento de alternativas prescritas, com Mostrar todas e rótulo preferência de visualização. Não editar ingredientes, doses ou publicação.|Médio; preferência por paciente/versão.|
|7|P1 — Compras com origem e formato simples|S3|Melhorar lista existente: mostrar plano/período/receita, check de comprado e copiar/imprimir texto. Agregar somente unidades compatíveis; itens sem conversão ficam separados.|Pequeno para saída textual; médio para agregação.|
|8|P1 — Centro de dados exportáveis|S6,S8|Exportação do titular por período em JSON/CSV legível com cabeçalhos, unidades, timezone e versão de esquema; explicar conteúdos e ausências. Não incluir terceiros, senhas ou segredos.|Médio/grande; autorização e campos exigem testes.|
|9|P1 — Ajuda contextual e disponibilidade honesta|S3,S4,S5|Explicar plano não publicado, vínculo pendente e recurso indisponível com próxima ação. Manter demo identificada, mostrar integrações sem configuração como indisponíveis; sem upsell enganoso.|Pequeno.|
|10|P2 — Repetir registro com confirmação|S4,S6|Reutilizar descrição de refeição anterior como rascunho editável, com data explícita; paciente confirma antes de salvar. Não confundir consumido com prescrito nem recalcular meta automaticamente.|Médio; conferir deduplicação e permissões.|

## Três recortes que cabem hoje

São propostas para a próxima implementação autorizada; esta pesquisa não mudou o app. Fazer primeiro um inventário rápido para verificar se o recurso já existe e aproveitar os módulos atuais.

1. **Origem do plano visível (ideia1, somente UI):** usar dados já retornados para mostrar profissional, versão e publicação, com texto claro quando vazio. Aceite: dois planos/pacientes fictícios não se confundem; se a API não expuser o dado, registrar dependência, sem inventar valor ou ampliar endpoint às pressas.
2. **Atalho de receita existente (ideia5):** ligar refeição à receita já cadastrada/autorizada e preservar o retorno à seção. Aceite: uma receita existente abre em um passo; ausência, vínculo revogado e paciente diferente não expõem conteúdo. Se não houver associação estável, escolher o recorte3 em vez de criar identificação pelo nome.
3. **Higiene de acesso no fluxo principal (ideia4):** revisar plano/compras em viewport móvel e zoom200%, ajustar safe area, labels e foco de botões/modais existentes. Aceite: completar o fluxo só com teclado e alcançar a ação final sem sobreposição. Não declarar acessibilidade total por esses checks limitados.

Alternativa pequena, se algum recorte depender de backend: melhorar mensagens de indisponibilidade/estado já existentes (ideia9). Exportação ampla, fila offline e scanner ficam para etapa posterior; não armazenar dados clínicos no service worker/localStorage para simplificar o prazo. Preservação de rascunho pode ficar em memória da sessão e deve limpar na troca de conta/paciente.

## Como validar antes de adotar

Usar apenas pacientes e profissionais fictícios. Tarefas curtas: localizar plano atual, achar receita, marcar compra, recuperar erro sem duplicar registro e sair da conta. Registrar conclusão, cliques, erros e comentários de participantes voluntários; não alegar redução percentual com amostra mínima. Conferir isolamento entre pacientes, vínculos revogados e ausência de vazamento na troca de contexto. O nutricionista mantém autoria/publicação de prescrição; a pessoa usuária organiza visualização e registra o que consumiu. Não inferir diagnóstico, composição corporal ou adequação da dieta a partir de avaliações de loja.

A pesquisa sugere concentrar a próxima rodada em clareza, continuidade do registro e acesso aos dados. Não sustenta promessa clínica, necessidade de copiar concorrentes ou contratação de infraestrutura agora.

## Aplicação posterior à pesquisa — verificada localmente

Implementados: cabeçalho do plano com autoria/versão, filtro de refeições sem alterar prescrição, origem da lista na mesma resposta do cálculo, download de compras em texto, download do plano completo em JSON, agenda em ICS com dados mínimos, retorno de envio/erro, proteção de edição durante envio e preservação de rascunhos posteriores/entre pacientes. Safe area e foco receberam ajustes; não há certificação de acessibilidade em aparelho físico.

A oportunidade8 teve recorte restrito ao plano publicado: não é exportação integral da conta. A oportunidade6 teve recorte de leitura por refeição: favoritos/opções semanais não foram implementados. Atalho de receita depende de associação estável, portanto não foi inferido pelo nome; repetição de diário e scanner permanecem propostas. Sessões já existiam e foram revalidadas, sem prolongamento ilimitado. [Resultados finais](VALIDACAO.md).
