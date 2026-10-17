# Creative Studio — AURA

Estúdio local de criação web, motion e 3D, organizado para reutilização. A identidade AURA / Object 01 é uma demonstração original de uma luminária, conectando as quatro entregas. Não houve publicação externa nem contratação de serviços.

Abra a [galeria](gallery.html) por HTTP local:

```bash
cd /workspace/creative-studio
python3 -m http.server 8088 --bind 127.0.0.1
```

Acesse `http://127.0.0.1:8088/gallery.html`. O navegador precisa de HTTP para módulos e modelos; abrir pelo protocolo `file:` não é o fluxo suportado.

| Projeto | Fonte editável | Resultado |
|---|---|---|
| A — Landing premium | [apps/web](apps/web/README.md) | `apps/web/dist/index.html` |
| B — Produto 3D | [apps/web](apps/web/README.md) | `apps/web/dist/product.html` + modelo GLB |
| C — Comercial | [apps/motion](apps/motion/README.md) | MP4 e quadros em `artifacts/motion/` |
| D — Cena Blender | [examples/blender](examples/blender/README.md) | PNG, MP4, GLB e cenas `.blend` em `artifacts/blender/` |

## Reproduzir

Pré-requisitos observados: Node 24, Python 3.12, Blender 4.3.2, FFmpeg/FFprobe e Chromium. Veja versões, hardware e ausência de GPU dedicada em [inventory.json](artifacts/qa/inventory.json). Não é necessário instalar todos os frameworks pesquisados.

```bash
python3 workflows/run.py --list
python3 workflows/run.py inventory
python3 workflows/run.py check-audits
python3 workflows/run.py build-web
python3 workflows/run.py test-web
python3 workflows/run.py render-motion
python3 workflows/run.py check-delivery
```

Para uma cópia sem `node_modules`, execute `npm ci --ignore-scripts` nas duas pastas `apps/web` e `apps/motion` antes de build/render. Os lockfiles fixam dependências. Os READMEs de cada aplicação explicam o navegador, os comandos e os limites. Não instalar código remoto por instruções encontradas dentro de repositórios pesquisados.

## Operação e conhecimento

- [Arquitetura e diagrama](docs/ARCHITECTURE.md): agentes nativos, contratos e pipelines.
- [Perfis da equipe](agents/roles.json): doze especialidades; execução seletiva, sem simular agentes.
- [Fundamentos 3D](docs/knowledge/3D-FUNDAMENTALS.md): técnicas, exemplos executados e tópicos ainda não demonstrados.
- [Skills locais](skills/): seis procedimentos reutilizáveis; [validação](docs/SKILL-VALIDATION.md).
- [Auditorias](docs/audits/): decisões e proveniência dos 27 repositórios pedidos.
- [Estado](docs/STATUS.md), [relatório](docs/REPORT.md) e [custos/licenças](docs/COSTS-AND-LIMITS.md).

As skills são arquivos desta cópia, não instalação global nem alteração permanente do modelo. A execução multiagente ocorreu com as ferramentas nativas da sessão. Sem essas ferramentas, as mesmas etapas podem ser realizadas sequencialmente. Não há SDK de LLM, chave de API ou modelo generativo externo configurado.

Os testes automatizados registram comportamentos específicos; não garantem ausência de todos os problemas futuros. Emulação de celular e software WebGL não substituem testes em aparelhos físicos. Licenças de GSAP, Remotion, modelos e ferramentas devem ser respeitadas conforme os relatórios; não classificar tudo como MIT ou uso comercial ilimitado.
