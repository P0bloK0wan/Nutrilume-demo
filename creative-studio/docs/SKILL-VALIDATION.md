# Validação operacional dos skills locais

Rodada local de QA em 2026-10-17, com Blender 4.3.2 e FFmpeg/FFprobe 7.1.5. Foram lidos os seis `skills/*/SKILL.md` e executados três cenários sobre a demo AURA existente. Isto valida aplicação operacional nesta rodada; **não houve baseline RED sem skill anterior** e não há evidência de melhora causal, treinamento de pesos ou domínio universal.

## Inspeção estática e correções

Os seis frontmatters contêm `name` e `description`, nomes compatíveis com letras/números/hífens, menos de 1024 caracteres e delimitadores válidos. Não foi usado parser YAML externo: são frontmatters simples de dois campos, conferidos por regex e leitura humana. As seis descrições descreviam a função; foram reescritas como condições de ativação com `Use when`.

Falhas adicionais encontradas antes de editar:

- `web-premium` dependia de `docs/audits/orchestration-web.md` e `docs/audits/3d.md`, inexistentes nesta rodada. Foram indicados os documentos existentes `docs/pipelines/WEB.md` e `docs/knowledge/3D-FUNDAMENTALS.md`; a auditoria específica continua obrigatória antes de adotar código externo. Ausência de auditoria não equivale a aprovação.
- `creative-brief` mandava delegar sem condicionar à autorização da sessão. Agora essa condição é explícita.
- `reference-analysis` citava um script sem intérprete ou argumentos obrigatórios. Agora fornece `python workflows/analyze_reference.py VIDEO_LOCAL --output PASTA_DE_SAIDA`, executado da raiz.

Na checagem final, `apps/motion` e `apps/web` também estavam ausentes neste checkout. Os skills agora condicionam esses exemplos à existência e usam os pipelines existentes como referência; isso não afirma que as demos de outros agentes falharam. Referências restantes verificadas: `agents/roles.json`, `examples/blender`, `workflows/analyze_reference.py`, `docs/pipelines/MOTION.md`, `docs/pipelines/WEB.md` e `docs/knowledge/3D-FUNDAMENTALS.md` existem. Não há links Markdown locais quebrados no conteúdo atual. Não foram encontrados payloads de download seguido de shell, sudo, apagamento recursivo, instalação global ou exfiltração. A revisão humana também confirmou limites para serviços pagos, credenciais, modelos externos e Blender MCP. Esta inspeção não é uma prova formal de segurança.

## Três cenários executados

| Cenário | Instruções aplicadas | Evidência e resultado |
|---|---|---|
| Reabrir fonte Blender | `blender-scene`: abrir fonte, conferir câmera, luzes, UV e modificadores; `qa-performance`: medir em vez de aceitar relato | `artifacts/qa/skill-scenarios/blender-open.log`: abriu `.blend`; Cycles 96 samples; câmera 48 mm; quatro luzes; UV; Subdivision/Solidify/Bevel; animação presente. |
| Analisar referência local real | `reference-analysis`: executar extração; `motion-film`: fps/frames e início/meio/fim; `qa-performance`: inspeção visual | `artifacts/qa/skill-scenarios/reference/`: FFprobe e contact sheet de 12 quadros. Inspeção via view_image confirma dolly/orbit, elevação da cúpula e mudança de luz; 48 frames, 24 fps, 2 s; nenhum stream de áudio. Grão visível na renderização de oito samples. |
| Verificar export e entrega | `qa-performance`: GLB estrutural, decode integral e limites da exportação; `blender-scene`: conferir arquivo além da fonte | `artifacts/qa/skill-scenarios/glb.json`: 211420 bytes, 8 meshes, 5 materiais, 7756 triângulos, zero animações, `KHR_materials_anisotropy`; decode FFmpeg completo com saída zero e log sem erros. |

A contact sheet foi examinada como evidência de enquadramento e movimento; sua existência isolada não foi usada como aprovação estética. O script `tests/check_glb.py` faz verificações estruturais próprias e não substitui o Khronos glTF Validator. A extensão de anisotropia está presente; o visual depende de suporte do viewer. Microtextura procedural não está baked no GLB e a animação permanece na fonte Blender.

## O que foi somente lido

`creative-brief` e `web-premium` receberam revisão estática, sem uma nova entrega completa baseada neles nesta rodada. Não foram executados novo render pesado, modelagem, rig, simulação, construção web, testes de acessibilidade, Remotion, sincronização de áudio ou IA externa. As quatro demonstrações do laboratório Blender pertencem à rodada anterior e não contam como novos testes desta rodada.

Sem instalações globais, mudanças de pesos, acessos de rede ou alteração de apps/artefatos de outros agentes. Apenas a pasta de QA e este relatório foram criados, além das correções pontuais dos skills autorizadas e da correção do README Blender: a extensão KHR de anisotropia está de fato no GLB. JSON completo: `artifacts/qa/skills-validation.json`.

Próximo nível de confiança exigiria cenários frescos com e sem instruções, múltiplas repetições e avaliador independente. Esta rodada não inventa esses resultados nem os chama de RED/GREEN.
