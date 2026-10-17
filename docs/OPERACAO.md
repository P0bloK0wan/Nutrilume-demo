# Operação e hospedagem

## Desenvolvimento

Node 24+, `npm start`, uma instância. `.env.example` lista as variáveis. O banco, os anexos e a caixa de e-mails locais ficam em `data/`, fora das rotas públicas e ignorados pelo Git. O usuário do processo precisa ter acesso exclusivo ao diretório. Contas de teste não devem ser usadas em produção.

Para abrir o fluxo local, consulte o link do e-mail específico em `data/mailbox.ndjson`. Nunca publique a caixa, o banco ou os arquivos `.env`.

## Publicação futura

O usuário optou por receber recomendação sem contratar agora. Veja a [comparação gratuita com fontes oficiais](HOSPEDAGEM-GRATUITA.md). Para esta etapa, o caminho recomendado é local, sem ativar serviços externos. Recomenda-se inicialmente um servidor Node com disco persistente (por exemplo, um serviço web com volume persistente ou uma VPS), HTTPS e backup externo. Planos gratuitos com disco temporário não preservam este banco. Compare custos atuais antes de contratar; nenhum preço foi assumido.

O Dockerfile é uma opção de empacotamento; não foi implantado em um provedor. Monte `/app/data` em volume persistente com permissão para o usuário `node`. Defina `NODE_ENV=production`, `APP_URL=https://seu-dominio`, `HOST=0.0.0.0`, `RESEND_API_KEY` e `MAIL_FROM` com domínio validado. O processo recusa iniciar em produção sem HTTPS/e-mail configurados. Use segredos da hospedagem, nunca valores no Git ou no navegador.

Execute **uma instância** com SQLite. Para réplicas/múltiplos servidores, planeje migração para Postgres e uma fila compartilhada. Mantenha o volume criptografado pelo provedor, monitore espaço livre e ajuste limites de entrada no proxy. O controle de arquivos limita cada acompanhamento a 100 arquivos e 100 MB; rever limites exige planejamento de capacidade.

## E-mail e WhatsApp

O adaptador de e-mail usa Resend quando configurado; em desenvolvimento sem chave ele grava somente na caixa local. Configure domínio/remetente, reputação e entrega de e-mail e teste confirmação e recuperação antes de abrir inscrições públicas. Nunca mostre a caixa local em um endpoint público.

WhatsApp requer `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` e `WHATSAPP_TEMPLATE`. O modelo aprovado deve aceitar um parâmetro de texto para data/hora. `CLINIC_TIMEZONE` define o fuso do texto (padrão America/Recife). O paciente fornece telefone com país e DDD no perfil e autoriza lembretes na privacidade.

Com o canal configurado, o servidor verifica a fila a cada 30 segundos. O estado `accepted` registra aceitação pelo provedor; **não representa entrega**. Em falha ou resultado incerto, não há repetição automática: verifique no provedor antes de qualquer reenvio para evitar duplicidade. Ao reagendar/cancelar, lembretes pendentes antigos são cancelados. Uma mensagem já em trânsito não pode ser recolhida.

Não foram feitos disparos reais nesta implementação. Os testes usam adaptadores falsos. Rastreamento de entrega por webhook é uma melhoria separada antes de prometer estados de entregue/lido.

## Backup e recuperação

```bash
node scripts/backup.mjs data/nutrilume.sqlite backups/nutrilume-2026-10-17.sqlite
```

O backup usa snapshot consistente do SQLite, verifica integridade, não sobrescreve destino existente e remove sessões/tokens da cópia. O arquivo continua contendo dados privados e exige criptografia, controle de acesso e cópia fora do servidor. Copiar apenas o arquivo `.sqlite` em uso ignorando WAL não substitui esse procedimento.

Para restaurar: pare o servidor, preserve a base atual, escolha uma cópia validada, restaure-a em um diretório novo e configure `DATABASE_PATH` para ela. Confira permissões, integridade e os fluxos de teste antes de reabrir. Sessões antigas não devem ser restauradas. Teste regularmente recuperação; retenção clínica e exclusões precisam de política própria revisada.

## Catálogo nutricional

Formato do importador: objeto JSON com `source: {name,version,reviewedBy}` e `items: [[nome,kcal,proteina,carboidrato,gordura], ...]`, sempre por 100 g, números JSON. `reviewedBy` identifica o responsável declarado pela revisão; o programa não certifica a revisão clínica.

```bash
node scripts/import-foods.mjs tabela-revisada.json data/catalog.json
```

Defina `FOOD_CATALOG=./data/catalog.json` e reinicie. O importador valida estrutura e valores, não inventa conversões nem importa a TACO automaticamente de PDFs. Os planos publicados mantêm snapshots; itens de um catálogo antigo não podem ser recalculados silenciosamente por um catálogo diferente. Reabra e selecione o alimento correto ao editar um item antigo.

## Antes do piloto

Validar domínio, HTTPS, armazenamento privado, restauração, envio real de e-mail, custos, monitoramento e procedimento de incidentes. Fazer revisão profissional da base nutricional e da utilidade do modelo 3D, verificação dos registros profissionais e revisão das regras aplicáveis. Testes locais e automáticos não substituem essas verificações.
