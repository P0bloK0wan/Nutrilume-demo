# AURA — demos A e B

Experiências locais originais para uma luminária conceitual. Sem loja real, pagamento, conta, backend ou publicação.

- **A — editorial**: `index.html`, direção tipográfica, hero Blender original, narrativa de matéria e GSAP. Âncoras, menu móvel, foco visível e conteúdo acessível com movimento reduzido.
- **B — objeto interativo**: `product.html`, GLB original exportado do Blender, PBR com iluminação e ambiente sintético, orbit por mouse/toque, zoom e teclado. Acabamentos e intensidade alteram a cena. Scroll orienta a rotação até a primeira interação; `prefers-reduced-motion` desativa esta direção automática.

## Execução

Node 24.19.0 usado; Vite requer Node ^20.19 ou >=22.12. Instalação fixada por `package-lock.json`, com scripts de instalação desativados:

```sh
npm ci --ignore-scripts --cache /workspace/.npm-cache
npm run dev
npm run build
npm run preview
npm test
```

`npm test` usa Playwright **Python** pré-instalado e Chromium de `/workspace/.playwright`; não instala outro runtime. Inicia servidor HTTP temporário em 127.0.0.1:4177 e grava screenshots e relatório em `../../artifacts/web`. É necessário permitir loopback e criação de processo Chromium. Testes usam o build em `dist/`.

## Dependências e decisão técnica

| Pacote | Versão fixada | Licença / uso |
| --- | --- | --- |
| React / React DOM | 19.3.1 | MIT / componentes e controles |
| Three.js | 0.186.1 | MIT / renderização, GLTFLoader, OrbitControls, RoomEnvironment |
| GSAP | 3.15.0 | Standard no-charge / animação editorial e ScrollTrigger |
| Vite | 8.3.4 | MIT / build e servidor local |

Metadados e scripts upstream foram revisados em `../../research/npm-selected/`. Scripts de autores em manifests publicados não são executados pelo `--ignore-scripts`. GSAP tem licença própria: revisar termos atuais antes de redistribuir um produto com requisitos diferentes. Não há fontes, fotos ou CDN externos. Assets `public/hero.png` e `public/aura-object-01.glb` são cópias dos originais em `../../artifacts/blender`; ver sua licença adjacente.

Three direto evita acrescentar React Three Fiber/Drei a uma cena pequena. GSAP é a única biblioteca de animação. A cena Three é importada apenas em B; hero A usa imagem estática original. HTMLs distintos têm `base: './'` para preview dedicado ou galeria local aninhada.

## Limites e degradação

DPR limitado a1.5; malha procedural alternativa usa32segmentos no celular e64 no desktop. Renderização pausa fora da viewport e com documento oculto. Malhas e materiais são descartados na desmontagem. Falha do GLB carrega modelo procedural próprio; falha ao criar WebGL mantém referência original visível e texto explícito. Perda de contexto também retorna à imagem e pede recarga. `product.html?noWebGL=1` permite verificar esse caminho sem alegar renderização.

Teclado no canvas: setas horizontais giram, `+`/`−` e setas verticais controlam distância; botão restaura vista. Pinça e orbit são atendidos por OrbitControls, sem captura de gestos fora do canvas. Slider e acabamentos são controles HTML com nomes acessíveis.

O ambiente sem GPU física pode renderizar por SwiftShader; isso não demonstra aceleração por hardware. Testes fazem leitura real do framebuffer e registram o renderer. Recursos de contexto perdido e ausência de WebGL são testados separadamente. Nenhum fps ou compatibilidade universal é prometido.
