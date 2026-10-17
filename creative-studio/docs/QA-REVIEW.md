# Revisão independente da implementação AURA

Data: 2026-10-17. Escopo: leitura de `AGENTS.md`, arquitetura, fontes web/motion, teste web e evidências JSON/imagens já presentes. Aplicado o checklist local `skills/qa-performance/SKILL.md` dentro do escopo atribuído. Esta revisão não iniciou servidor, instalou pacotes, executou navegador, renderizou vídeo ou testou aparelho físico. Os problemas abaixo são inferidos do fluxo de código; a reprodução no navegador cabe à integração.

## Achados materiais

### P2 — Seleções durante o carregamento do chunk 3D são perdidas

Fontes: `apps/web/src/main.jsx:15`; `apps/web/src/scene.js:11`, `:13`, `:17`.

O efeito inicia `import('./scene.js')`, mas os efeitos que encaminham material/intensidade executam enquanto `state.current` ainda está vazio. Se o usuário escolher oliva/30 antes do import resolver, essas chamadas não fazem nada. Ao concluir, `createScene` inicia seus próprios valores `porcelain`/70 e `addModel` aplica esses valores. As dependências React já não mudam, portanto a seleção exibida permanece oliva/30 enquanto o modelo usa porcelana/70. Isso ocorre na janela de carregamento do chunk; alterações depois de `state.current` existir, mesmo antes do GLB, ficam preservadas.

Reprodução proposta: atrasar a resposta do chunk de cena, escolher material e intensidade, liberar o chunk, comparar UI e `data-material`/`data-intensity`/modelo. Encaminhar os valores atuais após criar a cena, usando uma ref atualizada ou protocolo explícito de inicialização.

### P2 — Modelo carregado depois da perda de contexto oculta o fallback

Fontes: `apps/web/src/scene.js:13`, `:14`, `:17`, `:20`.

`contextLost` marca `lost=true`, retira a classe `loaded` e exibe a imagem. Porém, se a resposta GLB chegar depois, `addModel` verifica somente `disposed`, repõe `loaded`, anuncia `webgl` e informa “3D ativo”. O loop nunca renderiza, pois continua retornando por `lost=true`. A imagem de referência fica escondida atrás do canvas com contexto perdido.

Reprodução proposta: atrasar a resposta GLB, perder o contexto antes de concluí-la, liberar a resposta e conferir imagem/status. O callback não deve anunciar prontidão enquanto o contexto estiver perdido. O teste atual dispara perda somente depois do carregamento e não cobre essa ordem.

### P2 — Canvas invisível mantém captura de gestos no fallback após perda de contexto

Fontes: `apps/web/src/scene.js:8`, `:20`; `apps/web/src/style.css:1` (regras `.scene-host canvas` e `.scene-host.loaded canvas`).

Ao perder o contexto, somente a opacidade muda: o canvas continua posicionado sobre a imagem, focável, com `touch-action:none` e OrbitControls habilitado. Toques sobre a imagem estática continuam bloqueando a rolagem da página; wheel/teclado continuam controlando uma cena invisível. Diferentemente da falha inicial do renderer, o fallback de contexto perdido deixa uma superfície interativa ativa.

Reprodução proposta: perder contexto, tentar rolar por toque ou wheel sobre a imagem, conferir foco por Tab. Desabilitar controles, foco e captura de eventos enquanto o fallback estiver ativo.

## Cobertura e limites

- `apps/web/tests/qa.py` testa seleção por toque, mas não arraste/pinça ou rolagem da página sobre a cena. O teste de material verifica `aria-pressed`, sem demonstrar mudança no material renderizado. O teste de movimento reduzido verifica título visível, sem verificar a ausência do movimento automático.
- A perda de contexto usada pelo teste é um evento DOM sintético; confirma o handler e CSS, mas não invalida o contexto WebGL real. Um cenário com `WEBGL_lose_context` amplia essa cobertura.
- `main.jsx:10` consulta reduced motion apenas na montagem. Uma mudança da preferência durante a visita não reverte animações GSAP existentes; `scene.js:17` consulta `.matches` a cada frame, portanto o comportamento é diferente entre os dois sistemas. Não foi observado em runtime nesta revisão.
- `scene.js:17` mantém a cadeia de requestAnimationFrame mesmo fora da viewport/aba, embora pule atualização/render. Isso atende à pausa de render, mas não significa zero callbacks ou custo de CPU. Não foram medidas FPS, draw calls ou consumo nesta revisão.
- `qa.py` lança exceção na primeira falha e só escreve `qa-report.json` ao final. Falha prematura pode deixar screenshots parciais e nenhum relatório JSON; ausência do arquivo não autoriza declarar aprovação.

## Motion e evidências existentes

`apps/motion/src/index.jsx:37` define 1280×720, 30 fps e 300 frames. Os JSON existentes `artifacts/motion/ffprobe.json` e `verification.json` reportam H.264, 1280×720, 300 frames e AAC estéreo 48 kHz; o container tem 10,005 s. Esses são resultados pré-existentes, não nova execução desta revisão.

Foi inspecionada visualmente a contact sheet existente `artifacts/motion/contact-sheet.png`. Não se percebe texto principal cortado nos quadros amostrados. A fotografia do produto toca/corta a base na borda inferior, sobretudo no encerramento; é enquadramento do fundo, não prova de falha de viewport. A composição usa overflow hidden e transformações explícitas da fotografia, por isso não se deve generalizar a inspeção amostrada para todos os frames ou outros formatos. Não há variante vertical/responsiva declarada; a composição é fixa em 16:9.

## Privacidade, segurança e afirmações documentais

Nas fontes examinadas não foram encontrados URLs externos, analytics, armazenamento local, leitura de cookies, chamadas fetch/WebSocket, `eval` ou inserção HTML arbitrária. Os assets são caminhos locais. Isso descreve as fontes deste escopo e não constitui certificação de segurança do ambiente ou das dependências.

Os arquivos pré-existentes `artifacts/qa/npm-audit-web.json` e `npm-audit-motion.json` reportam zero vulnerabilidades conhecidas naquele inventário. Não foram reexecutados nem usados como prova de ausência universal de vulnerabilidades.

`docs/ARCHITECTURE.md` e os pipelines distinguem execução local, software/GPU, artefato e aprovação visual de forma adequada. `docs/STATUS.md` ainda mantém entregas abertas, coerente com revisão incompleta. `docs/SKILL-VALIDATION.md` é uma fotografia de outra rodada e explicita sua limitação; sua observação de apps ausentes não descreve o checkout atual. Não foi encontrada alegação de treinamento de pesos, teste em hardware físico ou certificação automática nesses documentos.
