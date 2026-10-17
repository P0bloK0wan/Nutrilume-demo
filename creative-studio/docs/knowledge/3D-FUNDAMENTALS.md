# Fundamentos 3D e estado prático

Este documento é um mapa operacional, não uma declaração de domínio completo. A evidência executada fica em artifacts/blender e os scripts em examples/blender. Referências primárias e licenças são listadas em docs/audits/3d.md.

## Geometria e modelagem

| Tema | Regra prática | Demonstração/limite |
| --- | --- | --- |
| Coordenadas e transforms | Distinguir local/world/view; aplicar escala antes de operações dependentes de distância | Cena procedural e export GLB |
| Vértices/arestas/faces | Normais, winding e continuidade afetam sombra e culling | Malhas da luminária e reimportação |
| Topologia | Organizar loops e densidade segundo curvatura/deformação | Cúpula procedural; não é personagem humano retopologizado |
| Hard surface | Usar bevels físicos para highlights e modificadores editáveis | Base/haste/aro e cúpula |
| Orgânica/escultura | Forma primária→secundária→detalhe; retopologia antes de deformação final | Não demonstrada como escultura manual |
| Procedural/modificadores | Parâmetros claros e operações não destrutivas | SUBSURF, SOLIDIFY e BEVEL da cúpula |
| Geometry Nodes | Separar geometria, campos e instâncias; realizar instâncias só quando necessário | Laboratório com scatter e 1500 polígonos avaliados |
| UV | Seams coerentes, escala de texel e ausência de sobreposição acidental | Camada UV verificada na cúpula |
| Low/high-poly | Distribuir detalhe entre malha, normal map e material | GLB de 7756 triângulos no primeiro export; métricas finais no JSON |
| Retopologia | Preservar silhueta e loops de deformação ao simplificar | Referenciada, não apresentada como trabalho manual realizado |
| Arquitetura/personagens/cenários | Escala, orientação e organização de coleções antes de detalhar | Set de produto executado; personagem completo não produzido |

## PBR, texturas e luz

Base color representa albedo; metallic descreve natureza metálica, não intensidade arbitrária de brilho. Roughness controla a distribuição do reflexo. Normal map altera a normal de shading; displacement modifica superfície e exige tesselação. Não usar mapas de dados como se fossem cor sRGB.

Porcelana e alumínio da cena usam materiais próprios. Metal escovado depende de anisotropia e orientação; o GLB declara KHR_materials_anisotropy. A compatibilidade da extensão precisa ser conferida no runtime web. Textura procedural precisa ser assada ou aproximada quando o formato de exportação não suporta os nós Blender.

Iluminação de produto: key define forma, fill regula contraste e rim separa silhueta. A cena demonstra quatro luzes e fundo de estúdio. HDRI licenciado pode substituir/reforçar o ambiente, mas não foi necessário baixar um asset. AO aproxima oclusão local; não substitui GI. Volumetria, vidro, água e tecido exigem testes próprios para serem chamados de validados.

Gerenciamento de cor: definir transform de visualização e exposição; comparar sob a mesma transformação. Bloom, flare e grade devem servir à legibilidade. Neste ambiente o Blender não tem OpenImageDenoise compilado; não marcar denoise como executado.

## Animação e simulação

- Keyframes definem poses/valores, curvas definem interpolação. Easing e aceleração devem respeitar massa e intenção.
- Antecipação prepara leitura; timing estabelece duração; spacing distribui posições; overshoot/follow-through precisam de acomodação; arcos evitam trajetórias mecânicas sem intenção.
- Rig: bones têm hierarquia e transformações locais; skinning distribui pesos. IK resolve posição de extremidade com limites, não substitui boas poses.
- Shape keys/morph targets interpolam posições compatíveis de vértices. A topologia deve permanecer consistente.
- Rigid body depende de forma de colisão, massa, escala e substeps. Assar cache quando necessário para reprodutibilidade.
- Tecidos/fluidos/partículas avançados não devem ser chamados de demonstrados apenas porque existe um nó ou documentação.

Laboratório executado: IK de dois bones com erro de ponta 0.00008; shape key muda dimensões de aproximadamente 2×2×2 para 3.2×3.2×1.1; corpo rígido cai de 2.40 para0.34m após48frames; scatter Geometry Nodes avaliado. Valores são evidências desse cenário, não garantia para qualquer rig/simulação.

## Câmera e cinematografia

| Movimento | Intenção e implementação |
| --- | --- |
| Dolly in/out | Transladar câmera para aproximar/revelar relação espacial |
| Truck/pedestal | Transladar lateral/vertical preservando o motivo visual |
| Orbit | Mover ao redor de alvo para revelar volume/material |
| Crane/tracking | Combinar altura/deslocamento ou acompanhar sujeito com motivação |
| Dolly zoom | Compensar focal e distância para manter tamanho do sujeito e mudar perspectiva do fundo |
| Rack focus/DOF | Transferir foco entre distâncias, com focal/abertura coerentes |
| Parallax | Explorar diferença de deslocamento entre planos, não apenas deslocar tudo igual |
| Camera shake | Frequência/amplitude limitadas e motivadas; evitar ruído randômico sem intenção |
| Match cut | Associar forma, movimento ou composição entre dois planos |
| Bézier | Controlar trajeto e velocidade; verificar tangentes e alvo da câmera |

A cena AURA demonstra caminho de câmera Bézier, deslocamento e objeto animado. O laboratório não comprova todas as técnicas da tabela. Elas são procedimentos de referência para próximas produções.

## Render e escolha de técnica

| Técnica | Força | Custo/limite |
| --- | --- | --- |
| Cycles path tracing CPU | Luz/reflexo fisicamente motivados, imagem offline | Ruído/amostras e tempo; no ambiente atual sem OIDN |
| Eevee | Preview e animação rápida | Recursos/qualidade dependem de GPU e aproximações; testar headless |
| Three WebGL | Interação imediata e integração UI | Orçamento de shaders/draw calls/texturas; software não representa celular real |
| WebGPU | Compute e recursos modernos em runtimes compatíveis | Não presumir disponibilidade nem equivalência entre navegadores |
| Remotion | Composição/timing determinísticos e render de vídeo | Não é um path tracer nem um modelo generativo |
| Pós-processamento | DOF, bloom, AO e grade orientados à narrativa | Passes e buffers custam memória e tempo |

O hero/curta e os relatórios identificam resolução, samples, engine e hardware usados. Passes de composição, fluidos, escultura e animação facial completa permanecem estudos para tarefas futuras, sem alegação de produção nesta entrega.
