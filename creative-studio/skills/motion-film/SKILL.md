---
name: motion-film
description: Use when uma tarefa envolve storyboard, animação audiovisual, timelines ou renderização de vídeo.
---

Referência de processo: docs/pipelines/MOTION.md, a partir da raiz do projeto. Uma implementação em apps/motion só pode ser citada como exemplo depois de conferir sua existência. Auditar a licença Remotion para o contexto de uso; não generalizar gratuidade comercial.

1. Storyboard: intenção por plano, assunto, lente/câmera, luz, texto, duração e transição.
2. Fixar resolução, fps, frames totais e zonas seguras. Compilar timings em frames, não depender de relógio real ou aleatoriedade não semeada.
3. Animar por useCurrentFrame/interpolate/spring ou curvas explícitas. Determinar antecipação, movimento principal e acomodação.
4. Câmera motivada: dolly aproxima detalhes; orbit revela volume; rack focus transfere atenção. Dolly zoom exige compensação real entre distância e focal.
5. Sincronizar áudio original/licenciado e testar clipping e loudness. Separar render programático de vídeo gerado por IA.
6. Render inicial curto e baixa concorrência; conferir quadros no início/meio/fim e em cada transição.
7. Render final, ffprobe, amostra decodificada e contact sheet. Verificar áudio, resolução, duração e frames vazios.

Saídas: fonte editável, storyboard, MP4, stills, metadados e instruções. Falta de credenciais para IA externa deve ser declarada, sem simular uso.
