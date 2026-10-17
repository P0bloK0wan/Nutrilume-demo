# Plataforma Nutrilume — escopo de implementação

O paciente acompanha alimentação, medidas e consultas; o nutricionista prepara e publica o atendimento individual. Preservar a identidade verde e as animações com redução de movimento. Manter a demonstração em demo.html, identificada como exemplo.

## Arquitetura
Servidor Node.js 24 com SQLite, API de mesma origem e sessões HttpOnly. Interface sem dependências de execução no navegador. Aplicação executável localmente e hospedável em servidor com volume persistente; GitHub Pages só executa a demonstração. Dados, banco, anexos e segredos nunca entram no Git. Endpoints autenticados não podem ser armazenados no service worker.

## Identidade
Somente papéis patient e nutritionist. Ambos podem criar uma conta própria. Nutricionista pode preparar nova conta patient com e-mail e senha temporária do Nutrilume; não cria conta Google nem conhece a senha Google. Confirmar o e-mail, trocar a senha temporária e aceitar o vínculo antes de acesso clínico. Conta existente nunca é sobrescrita: o vínculo deve ser solicitado pelo paciente e aceito pelo profissional. E-mail via adaptador configurável; em desenvolvimento, caixa local fora da raiz pública. Nenhuma mensagem será enviada a terceiros durante os testes.

## Descoberta
Diretório de nutricionistas com e-mail confirmado e divulgação voluntária. Busca por cidade ou coordenadas informadas mediante ação do usuário, ordenação por distância e pesquisa externa em mapas para ampliar a cobertura. Não inventar clínicas ou afirmar verificação de CRN. Localização de busca não é gravada no perfil automaticamente.

## Atendimento e autorização
Cada recurso clínico tem patientId. O paciente acessa apenas o seu; profissional acessa pacientes com vínculo ativo e consentimento de saúde. Sem consentimento não há leitura de registros clínicos. Consentimentos de fotos, grupo e corpo 3D são independentes e revogáveis. Arquivos são privados. Conta e registros podem ser excluídos, com histórico de acesso sem conteúdo clínico.

Planos publicados têm versões; itens calculados têm identidade e gramas. Receitas e medidas caseiras indicam suas fontes e limites. Metas usam datas, não contagem de cliques. Avaliações são datadas. Mensagens são de contas vinculadas. Agenda permite criação, reagendamento, cancelamento e confirmação; conflitos são recusados. Financeiro deriva de lançamentos.

## Corpo 3D
Primeira implementação: modelo paramétrico estimado pelas medidas, com rotação, zoom e comparação de avaliações. Nunca chamar de reconstrução exata ou escaneamento. Sem inferir composição corporal. Somente paciente e profissional com vínculo ativo, consentimentos de saúde e body3d. Ao revogar, negar o endpoint e limpar o visualizador. Reconstrução real por fotos/escaneamento exige avaliação técnica posterior.

## Limites de serviços externos
E-mail de produção e WhatsApp automático exigem configuração e teste real com o titular. Sem configuração, mostrar indisponibilidade e permitir operação manual identificada; não marcar entregue. Base nutricional original aproximada continua marcada. Importação de tabela oficial usa arquivo fornecido/revisado pelo profissional; não atribuir valores inventados à TACO.

## Aceitação
Testes de regressão do protótipo; testes da API com duas contas de cada papel e conta não confirmada; persistência após reinício; CSRF, XSS, senhas temporárias, expiração de token, isolamento de arquivos/3D, consentimento revogado, conflito de consulta e duplicidade de hábitos; teste de navegador de cadastro, vínculo, publicação, medidas e localização negada. Sem promessa de infalibilidade, conformidade legal automática ou validação clínica.
