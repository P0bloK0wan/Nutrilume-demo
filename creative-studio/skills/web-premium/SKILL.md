---
name: web-premium
description: Use when uma interface editorial ou experiência web 3D exige composição, interação, acessibilidade ou movimento.
---

Caminhos a partir da raiz do projeto. Consultar docs/pipelines/WEB.md e docs/knowledge/3D-FUNDAMENTALS.md; usar apps/web como exemplo somente se a pasta existir. Antes de adotar código externo, exigir auditoria específica; um arquivo de auditoria ausente é pendência, nunca aprovação.

- Construir primeiro hierarquia, grade, espaçamento e CTA; escolher duas ou três famílias de movimento coerentes.
- Usar GSAP para timeline/scroll e Three.js para a cena. Adicionar R3F/Drei quando a integração React justificar a dependência.
- Movimento: entrada revela estrutura; hover indica interatividade; scroll transforma uma narrativa. Evitar parallax aleatório e scroll hijacking.
- Proteger ciclo de vida: remover listeners/timelines, descartar geometria/textura/material, pausar fora de cena e em aba oculta.
- Limitar DPR e geometria, usar instancing/LOD conforme a cena, carregar modelos sob demanda e fornecer fallback sem WebGL.
- Tratar perda/restauração de contexto. Respeitar prefers-reduced-motion sem esconder conteúdo.
- Controles semânticos, foco visível, ações por teclado e toque, leitura a 200% e viewport estreito.
- Fixar versões, instalar scripts auditados e conferir o bundle produzido.

Aceitação: build real; Playwright desktop/mobile, teclado, toque, reduced motion e fallback; screenshot inspecionado; draw calls/triângulos/tempo de quadro no equipamento testado. Software WebGL não certifica desempenho em celular físico.
