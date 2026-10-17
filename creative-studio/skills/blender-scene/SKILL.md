---
name: blender-scene
description: Use when uma tarefa envolve modelagem, iluminação, animação, render ou exportação de cenas Blender.
---

Referência executável: examples/blender. Preferir CLI e scripts próprios; Blender MCP só depois de revisão de permissões e necessidade.

- Cena limpa, unidades e eixos definidos. Modelar por primitivas/curvas/malhas, aplicar escala e conferir normais e topologia.
- Preservar modificadores editáveis. Separar high-poly de export web; criar UV e materiais com nomes significativos.
- Materiais PBR: metallic só em superfícies metálicas; roughness controla distribuição do reflexo; normal altera orientação aparente e displacement altera geometria.
- Usar iluminação key/fill/rim com razão/intenção e exposição consistente. Definir gerenciamento de cor; não confundir cor linear de shader com saída sRGB.
- Câmera: posição, focal, DOF/foco e curvas suaves. Animar objeto e câmera em conjunto, conferir interseções e legibilidade.
- Rig: verificar hierarquia de bones, pesos, IK e deformação; shape keys para alterações coerentes de forma.
- Simulações: fixar frames/substeps/semente, assar quando necessário e verificar colisões. Não chamar sistema de fluidos/tecido de validado sem simular/renderizar.
- Preview de baixa amostra, render hero, inspeção visual e depois sequência limitada. Registrar Cycles/Eevee, CPU/GPU, samples, denoise e duração.
- Salvar .blend, script e export GLB; inspecionar arquivo exportado separadamente da cena fonte.

Aceitação: arquivo abre, cena contém câmera/luzes/materiais/animação, render não vazio, GLB estruturalmente válido e laboratório executado. Fundamentação estudada e técnica demonstrada devem ficar separadas.
