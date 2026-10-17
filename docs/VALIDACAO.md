# Validação local — 17/10/2026

Os comandos abaixo foram executados e seus resultados lidos; não são previsões. Ambiente Linux, Node 24.19.0, Python 3.12.14 e Chromium/Playwright. Somente contas, pacientes e informações fictícias. Nenhum e-mail ou WhatsApp real foi enviado.

| Verificação | Resultado | Evidência |
|---|---|---|
| `npm test` |66 aprovados, 0 falhas|[API e serializers](evidencias/api.txt)|
| `python3 tests/platform/browser.py` |29 fluxos aprovados, sem erro JavaScript|[Navegador](evidencias/navegador.txt)|
| Demo: segurança |52/52|[Log](evidencias/demo-seguranca.txt)|
| Demo: comunidade |36/36|[Log](evidencias/demo-comunidade.txt)|
| Demo: alimentos |15/15|[Log](evidencias/demo-alimentos.txt)|
| Demo: regressões |6/6|[Log](evidencias/demo-regressoes.txt)|
| Backup/recuperação com fonte fictícia aberta/WAL |Registro preservado; sessões/tokens removidos só da cópia; integridade OK|[Resumo estruturado](evidencias/resultados.json)|

Também passaram `node --check` nos módulos alterados, compilação Python do teste browser e `git diff --check`. Os testes da demo usaram `BASE_URL=http://localhost:3000/demo.html`; os do navegador usaram o servidor local de desenvolvimento com caixa de e-mails em arquivo, sem provedor externo.

## Cenários relevantes

Contas dos dois papéis; confirmação/recuperação e token de uso único; impossibilidade de autenticar com a temporária do paciente no login comum; troca obrigatória e aceite no navegador do paciente; paciente sem vínculo; isolamento profissional; revogação de saúde/fotos/3D; arquivo privado e tipo/tamanho; persistência; planos publicados/rascunhos e catálogo versionado; cálculo de receitas/compras; agenda, estados/cancelamento/conflito; finanças; comunidade e fila de lembretes sem envios duplicados ou incertos repetidos automaticamente.

A rodada nova verificou autoria/versão e filtro do plano, exportação completa mesmo com uma refeição filtrada, compras com porções manuais sem conversão inventada, calendário UTC sem nome/observação, falha offline com texto retido e reenvio explícito, resposta antiga após troca de paciente e alterações feitas depois do envio de publicação. O formulário fica bloqueado durante envio, e ações fora dele não apagam alterações posteriores do rascunho.

A troca de nutricionista foi testada com contas distintas: nova conversa recebe o vínculo definido no servidor, não o enviado pelo cliente; não revela a conversa encerrada; rascunho anterior não aparece nem é apagado ao salvar/publicar outro. Planos publicados do histórico autorizado continuam disponíveis. Mensagens legadas sem vínculo são preservadas, mas não atribuídas automaticamente ao chat novo.

## Falhas observadas antes das correções

O teste novo de UI falhou quando o cabeçalho de autoria não existia. A regressão de origem falhou com `planVersion` ausente. A resposta atrasada apagou texto do outro paciente antes do guard de contexto; uma publicação também apagava edição posterior do rascunho antes do controle de snapshot. Os testes de relacionamento falharam por falta de vínculo na mensagem e exposição/remoção de rascunho anterior. Após correção, os comandos completos passaram. Testes somente escritos ou lidos não foram contados como execução.

## Limites

Os números descrevem cenários específicos, não garantia contra todos os riscos futuros. Viewports móveis, toque e movimento reduzido foram verificados em Chromium; faltam aparelhos físicos, Safari e avaliação com leitores de tela. Não foram executados deploy, CI remoto, entrega real por e-mail/WhatsApp ou validação clínica dos alimentos/modelo corporal.

O 3D é uma estimativa pelas medidas e não escaneamento/composição corporal. JSON de plano não é backup/exportação integral da conta. ICS depende de importação manual, sem promessa de sincronização entre calendários. Uma falha de rede após recebimento no servidor pode deixar resultado incerto: o app não reenvia automaticamente; conferir histórico antes de repetir uma operação.

O serviço público continua pendente de hospedagem persistente, HTTPS, recuperação por e-mail configurada e verificações operacionais descritas em [OPERACAO.md](OPERACAO.md). Alternativas sem contratação estão em [HOSPEDAGEM-GRATUITA.md](HOSPEDAGEM-GRATUITA.md).
