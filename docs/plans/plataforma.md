# Plano de implementação da plataforma

Objetivo: executar o roteiro com a inclusão de cadastro assistido, descoberta e motion. Especificação: ../specs/plataforma.md. Execução direta em branch feat/plataforma-nutrilume.

1. Regressões: escrever e observar falhas dos cenários de renomear alimento, selecionar paciente, meta por data e perfil. Corrigir em app.js/index.html; rodar as suítes originais e regressões.
2. Servidor: tests/platform/api.test.mjs primeiro; implementar server/{app,store,security,mail}.mjs com contas, tokens, sessões e vínculos. Testar expiração, repetição, autorização e persistência.
3. Recursos: server/care.mjs e server/community.mjs; testes de planos, avaliações, consentimentos, arquivos, agenda e financeiro antes da implementação. Não criar credenciais ou dados de teste em repositório.
4. Interface: index.html como entrada, demo.html como exemplo; platform/{app,api,body3d}.js e platform/styles.css. Testes Playwright de fluxo, dimensões e redução de movimento.
5. Integrações: diretório real do cadastro e links externos de mapa. Adaptadores de e-mail e WhatsApp sem disparos nos testes, status explícito e documentação de ativação.
6. Revisão: executar todos os testes, revisão independente da branch, corrigir falhas, atualizar ROTEIRO.md com resultados e dependências reais e publicar os commits no GitHub.

Restrições globais: manter a demo, dados privados fora do Git, nenhuma chave no frontend, sem cadastro fictício apresentado como real, movimento reduzido respeitado, arquivo privado nunca em cache público.

Foco de revisão: vincular conta existente sem takeover; reutilização de verificação/recuperação; revogação de consentimento; consultas de outro profissional; HTML em nomes/mensagens e URLs.
