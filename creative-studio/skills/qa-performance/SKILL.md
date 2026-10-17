---
name: qa-performance
description: Use when entregas web, vídeo ou 3D precisam de verificação técnica, visual ou de desempenho.
---

Não aprovar apenas pela conclusão do processo ou relato de outro agente.

1. Conferir arquivos, versão das ferramentas e comando usado.
2. Rodar teste do fluxo completo e reproduzir falhas em cenários de borda.
3. Web: dimensões, acessibilidade básica, touch, reduced motion, WebGL indisponível/perdido, console, requests e lifecycle. Medir onde possível; registrar o hardware e a janela observada.
4. Vídeo: ffprobe de streams/duração/fps, decodificação, loudness quando houver áudio e quadros relevantes.
5. 3D: inspeção GLB, abrir/renderizar .blend, conferir materiais, câmera, animação e limites da exportação.
6. Inspecionar screenshots/contact sheets; separar artefatos de execução de julgamento estético.
7. Comparar após correções e rodar regressões afetadas. Registrar falha inicial, causa, correção e resultado.
8. Entregar relatório de aprovados, falhas e não testados. Nunca converter ausência de teste em aprovação.
