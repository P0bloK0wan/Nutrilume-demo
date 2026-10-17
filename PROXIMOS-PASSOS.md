# Problemas prioritários e recomendações

Análise do ZIP restaurado em 17/10/2026. Os arquivos originais da demonstração foram preservados; os problemas abaixo foram registrados para acompanhamento e ainda não foram corrigidos.

## Principais problemas

| Prioridade | Problema | Acompanhamento |
| --- | --- | --- |
| Alta | Renomear alimento mantém os macros do alimento anterior | [Issue #1](https://github.com/P0bloK0wan/Nutrilume-demo/issues/1) |
| Alta | O plano continua para Marina mesmo selecionando outro paciente | [Issue #2](https://github.com/P0bloK0wan/Nutrilume-demo/issues/2) |
| Alta para uso real | Dados desaparecem ao recarregar; faltam autenticação e autorizações no servidor | [Issue #3](https://github.com/P0bloK0wan/Nutrilume-demo/issues/3) |
| Média | Vários cliques no mesmo dia contam vários dias na meta | [Issue #4](https://github.com/P0bloK0wan/Nutrilume-demo/issues/4) |
| Média | Nome do perfil não atualiza saudações e há pequeno transbordamento no celular | [Issue #5](https://github.com/P0bloK0wan/Nutrilume-demo/issues/5) |

As issues incluem passos de reprodução ou descrição da lacuna e critérios para considerar o trabalho concluído. Persistência e autenticação são uma etapa estrutural ainda ausente; as demais incluem falhas observadas no protótipo.

## O que já existe e o que ainda é exemplo

Já funcionam no navegador: editor e publicação do plano, trocas, banco de 39 alimentos com cálculo, diário, ficha inicial, mensagens na mesma página, perfis, fotos, grupo e comunidade.

Agenda e financeiro exibem dados fixos. WhatsApp abre conversas manualmente. O botão de lembretes pede permissão e mostra uma notificação de teste; não agenda disparos. O cache do app guarda arquivos do site e não os registros do usuário.

## Recomendações para a continuação

1. **Corrigir os vínculos e os cálculos antes de ampliar o atendimento.** Começar pelas issues #1 e #2, usando identificadores de alimento e paciente. Isso evita associar nutrientes ou planos à pessoa errada.
2. **Criar versões do plano alimentar.** Cada publicação deve guardar data, autor e conteúdo, permitindo consultar versões anteriores e recuperar uma publicação equivocada. As trocas escolhidas pelo paciente devem ficar separadas da prescrição original.
3. **Mostrar quando o total nutricional está incompleto.** Identificar quais itens estão sem cálculo e apresentar o total como parcial enquanto faltarem dados. A lista inicial contém itens manuais, por isso começa com zero mesmo com alimentos preenchidos.
4. **Evoluir a base nutricional com rastreabilidade.** Associar alimento, preparo, fonte e versão da tabela; permitir medidas caseiras com conversão revisada pelo nutricionista. Importar a tabela completa só depois de definir como as unidades e os cálculos serão validados.
5. **Construir a agenda em etapas.** Primeiro cadastrar, reagendar e cancelar consultas, verificar conflitos e registrar confirmação. Depois integrar lembretes por WhatsApp com preferência do paciente, fuso, prevenção de duplicidade e status de entrega. Abrir `wa.me` não equivale a enviar automaticamente.
6. **Dar ao nutricionista uma visão útil do acompanhamento.** Resumir registros recentes, ficha pendente e retorno próximo, com acesso ao histórico do paciente. Priorizar o acompanhamento individual antes de ampliar a comunidade.
7. **Automatizar verificações no GitHub.** Fazer os testes encerrarem com erro quando houver FAIL e adicionar verificações dos problemas reproduzidos. Hoje o resultado precisa ser lido pelas contagens impressas; somente o código de saída não é suficiente.

Para demonstrar a experiência, a sequência sugerida é corrigir os erros, melhorar os totais e tornar a agenda interativa. Para começar um piloto com pacientes reais, persistência, autenticação e isolamento dos dados precisam vir antes do piloto. Nenhum provedor de backend ou WhatsApp foi escolhido.

## Evidências

As três suítes foram executadas no Chromium durante a análise e novamente na preparação do envio, com 52 + 36 + 15 verificações aprovadas (103 no total). Além delas, foram reproduzidos o plano fixo para Marina, os macros preservados ao renomear, a contagem duplicada da meta e a saudação desatualizada. Na tela Hoje, um viewport de 390 px produziu documento de 397 px.

Esses testes cobrem os roteiros existentes, sem representar validação clínica dos alimentos ou cobertura completa do produto. Veja também [SEGURANCA.md](SEGURANCA.md) e [DIRETRIZES.md](DIRETRIZES.md).
