# Caminhos sem contratação agora

Consulta às fontes oficiais em **17/10/2026**. Nenhuma conta de hospedagem, cartão, trial, domínio, assinatura ou API paga foi ativada. Os limites podem mudar; conferir novamente antes de uma publicação. Recomendação imediata: continuar os testes locais com dados fictícios e preservar o banco em disco.

| Opção | Uso sem nova compra | Limite e adequação ao código atual |
|---|---|---|
| Computador já disponível + Node 24 | Executar `npm start`, usar SQLite persistente e caixa de e-mails de desenvolvimento | Funciona no ambiente local. Depende do computador ligado, backup e acesso restrito; não é hospedagem pública pronta. |
| Cloudflare: arquivos estáticos | Apresentação/demonstração em subdomínio fornecido pelo serviço, dentro do Free | Não executa automaticamente o servidor Node/SQLite deste projeto. Não confundir página publicada com contas e dados persistidos. |
| Cloudflare Workers Free + D1 | Alternativa futura de backend dentro das cotas gratuitas | Workers:100 mil requisições/dia,10 ms CPU/execução e128 MB. D1:5 milhões de linhas lidas/dia,100 mil escritas/dia e5 GB total. Exige adaptar rotas, autenticação, armazenamento e testes; não basta copiar o arquivo SQLite. Hashes de senha atuais não devem ser enfraquecidos para caber no limite de CPU. |
| Supabase Free | Alternativa futura para Postgres, Auth e arquivos com regras de acesso | Página consultada informa500 MB de banco,1 GB de arquivos,5 GB de saída,50 mil usuários ativos/mês e até 2 projetos ativos. Projetos pouco ativos podem pausar após uma semana. Não inclui backup automático. Exige migração e políticas de acesso; não foi provisionado. |

Fontes: [Workers — limites](https://developers.cloudflare.com/workers/platform/limits/), [D1 — cotas e preços](https://developers.cloudflare.com/d1/platform/pricing/), [Supabase — Free](https://supabase.com/pricing), [pausa de projetos](https://supabase.com/docs/guides/platform/free-project-pausing). São opções condicionadas a limites, não promessa de produção ilimitada ou certificação para prontuários. Não verificamos exigência de cartão no cadastro porque nenhuma conta foi aberta; não autorizar contratação para contornar uma cota.

## Opções que não preservam esta plataforma

O [Render Free](https://render.com/docs/free) descarta alterações no disco em reinícios, redeploys e suspensão por inatividade; não permite disco persistente no serviço web gratuito. Por isso não é recomendado para o SQLite/anexos atuais sem migração de armazenamento. Uma demonstração que perde os cadastros não atende ao objetivo.

[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) é estático e tem restrições para SaaS comercial/transações sensíveis. Pode manter a demonstração educativa identificada, sem coleta de dados reais; não hospeda este backend ou login de pacientes. Não publicar `data/`, caixas de e-mail ou cópias de banco no repositório.

## Agenda e comunicação sem API paga

A agenda funciona localmente; o botão **Baixar calendário (.ics)** permite importação manual em um calendário que a pessoa já usa. O arquivo usa horários UTC e título genérico, omite nomes/observações e pode conter cancelamentos com identificador estável. O comportamento de reimportação depende do aplicativo; não há sincronização automática. A pessoa decide se quer compartilhar os horários com outro serviço.

O envio automático pelo WhatsApp Business não foi ativado nem vendido como gratuito. A integração continua opcional e desligada. A importação de calendário é uma alternativa gratuita para organização; não é disparo de WhatsApp.

Confirmação/recuperação por e-mail usam somente caixa local nos testes. O adaptador externo existente exige configuração de remetente/domínio e conferência das condições do fornecedor; não pressupor que domínio e envio de produção serão gratuitos. Um endereço Gmail no cadastro é o e-mail de contato do paciente, não autenticação Google implementada nem acesso à senha Google.

## Antes de uma migração escolhida

Preservar as mesmas regras de titular/vínculo/consentimento, testar revogação e recuperação e restaurar um backup fictício. Em Supabase, usar políticas RLS e armazenamento privado; credenciais privilegiadas nunca vão ao navegador. A skill oficial Supabase foi consultada para essa avaliação, sem instalação, projeto remoto ou SQL externo executado.
