# Nutrilume

Plataforma de acompanhamento nutricional com duas contas: paciente e nutricionista. Inclui cadastro assistido do paciente, vínculo autorizado, plano versionado, diário, avaliações, corpo 3D estimado, mensagens, agenda, gestão e busca de atendimento. A demonstração original permanece em **[demo.html](demo.html)** com dados fictícios.

## Executar a plataforma

Requer **Node.js 24 ou superior**. Não há dependências npm de execução.

```bash
cp .env.example .env
npm start
```

Abra `http://localhost:3000`. Em desenvolvimento, e-mails ficam na caixa local `data/mailbox.ndjson`; copie o link correspondente para confirmar a conta. Esse arquivo contém links de acesso: mantenha-o privado. Nenhuma conta de exemplo ou senha padrão é criada.

O nutricionista pode preparar uma conta de paciente com e-mail e senha temporária **do Nutrilume**. Usar Gmail não cria conta Google nem altera a senha Google. A ativação por e-mail cria uma sessão limitada no navegador do paciente; a senha temporária não funciona no login comum. O paciente troca a senha e dá seu consentimento antes do acompanhamento.

Pacientes sem profissional podem criar conta, buscar profissionais cadastrados por cidade/distância, solicitar vínculo e pesquisar outras clínicas no Google Maps. A divulgação de endereço é voluntária. O CRN é informado pelo profissional; não é apresentado como verificado automaticamente.

## Hospedagem

**GitHub Pages não executa o servidor, o login nem o banco.** Ele permite visitar a demonstração estática e a apresentação da plataforma. Para usar contas, rode Node com volume persistente e HTTPS. Veja [OPERAÇÃO.md](docs/OPERACAO.md). Não foi contratado serviço de hospedagem nem ativada integração paga.

Para não gastar agora, a recomendação é testar localmente. [Opções gratuitas pesquisadas e seus limites](docs/HOSPEDAGEM-GRATUITA.md) incluem caminhos futuros com Cloudflare e Supabase; nenhum foi contratado ou provisionado. O Node/SQLite atual precisa de disco persistente. Render Free não preserva este banco; migrar para outro backend exige adaptar e testar o código.

## Melhorias baseadas em avaliações públicas

[Pesquisa de cinco aplicativos](docs/PESQUISA-APPS.md), com fontes e dez ideias. Foram implementados autoria/versão e filtro do plano, download do plano em JSON, compras em texto com origem, agenda em ICS, feedback de envio e preservação de contexto. Os downloads usam somente os dados já autorizados e não são backup integral da conta. [Validação](docs/VALIDACAO.md).

## Testes

```bash
npm test
python3 -m pip install -r requirements-dev.txt
python3 -m playwright install chromium
# Com npm start aberto em outro terminal:
BASE_URL=http://localhost:3000/demo.html python3 tests/seguranca.py
BASE_URL=http://localhost:3000/demo.html python3 tests/comunidade.py
BASE_URL=http://localhost:3000/demo.html python3 tests/alimentos.py
BASE_URL=http://localhost:3000/demo.html python3 tests/regressoes.py
python3 tests/platform/browser.py
```

O teste de navegador só aceita servidor de desenvolvimento com caixa local, sem envio de e-mail real. Os testes da API usam bancos temporários e adaptadores falsos de e-mail/WhatsApp. O workflow em `.github/workflows/tests.yml` automatiza a execução; resultados locais não significam que a execução remota já passou.

## Limites explícitos

- Corpo 3D **estimado por medidas**, com rotação, zoom e comparação de avaliações. Não é escaneamento, reconstrução fotográfica ou avaliação de composição corporal. Requer consentimento próprio; o visualizador aberto revalida a autorização a cada 5 segundos.
- Os 39 alimentos originais são aproximados. Há importador de catálogo revisado, controle de versão, cálculo no servidor e proteção contra troca silenciosa de catálogo. A TACO completa não foi importada sem um arquivo confiável e revisão clínica.
- E-mail de produção exige domínio e credenciais configurados. WhatsApp automático exige canal Business, modelo aprovado e consentimento. Sem configuração, nada é marcado como enviado. Aceito pelo provedor não significa entregue ao telefone.
- A plataforma ainda precisa de escolha de hospedagem, configuração externa, testes em aparelhos físicos e revisão clínica/das regras aplicáveis antes de um piloto com dados reais.

## Acompanhamento

- [Roteiro visual](ROTEIRO.md)
- [Problemas e recomendações](PROXIMOS-PASSOS.md)
- [Segurança e operação](SEGURANCA.md)
- [Especificação](docs/specs/plataforma.md)
- [Evidências de implementação](docs/VALIDACAO.md)
