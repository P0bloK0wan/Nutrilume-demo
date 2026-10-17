# Pipeline web

Brief → direção editorial → wireframe e orçamento gráfico → assets originais → componentes → animação → build → navegador → revisão.

1. Auditar manifesto e licença de pacotes antes da instalação. Fixar versões; manter lockfile.
2. Definir grade, escalas de tipo e cores. Garantir leitura e CTA sem depender de animação.
3. Criar cena procedural ou carregar GLB otimizado sob demanda. Registrar asset, licença e custo geométrico.
4. Usar timeline/scroll motivados. Entradas e microinterações devem ter duração curta e feedback claro.
5. Limitar DPR no mobile, pausar render fora de viewport/aba, descartar recursos ao desmontar.
6. Testar WebGL real do ambiente, fallback sem WebGL, touch, teclado e prefers-reduced-motion.
7. Build de produção e medições no equipamento observado. Registrar bundle/draw calls/triângulos/fps quando coletados.
8. Inspecionar screenshots desktop/mobile. Não declarar teste em aparelho físico quando só houve emulação.

Referência: apps/web. Three.js direto é a implementação escolhida; R3F/Drei são alternativas documentadas, sem instalação redundante nesta produção.
