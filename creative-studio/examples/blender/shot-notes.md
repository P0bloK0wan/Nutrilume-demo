# AURA · shot notes

| Tempo | Produto | Câmera/luz |
|---|---|---|
| 0.00 s · frame 1 | Cúpula na posição baixa; difusor discreto | Início do arco Bezier; luz prática 8 W |
| 1.00 s · frame 25 | Abertura da cúpula e luz em transição | Dolly lateral contínuo; alvo fixo |
| 1.375 s · frame 34 | Instante usado no hero | Modelo completo, margem à esquerda, foco na peça |
| 1.958 s · frame 48 | Elevação total de 13 cm; emissão 3× | Final do arco; luz prática 75 W |

Os valores da luz são parâmetros Blender, não medições fotométricas de um produto físico. A animação constitui uma apresentação conceitual; não simula engenharia de um mecanismo de produção.

O aro é uma malha toroidal com 96 segmentos, a base e haste são cilindros com 96 vértices e a cúpula possui 8 anéis × 96 vértices em quads antes dos modificadores. As superfícies são intencionalmente regulares para operações não destrutivas. A UV de revolução é explícita no mesh da cúpula; a microtextura usa coordenadas Generated para continuar procedural.
