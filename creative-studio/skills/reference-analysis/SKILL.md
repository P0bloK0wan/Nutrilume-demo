---
name: reference-analysis
description: Use when um arquivo audiovisual local precisa de análise técnica ou uma referência precisa ser traduzida em uma proposta original.
---

Receber arquivo/licença/intenção. A partir da raiz do projeto, executar `python workflows/analyze_reference.py VIDEO_LOCAL --output PASTA_DE_SAIDA` para metadados e quadros; observar vídeo/áudio quando as ferramentas permitirem.

Analisar: composição/enquadramento; câmera; velocidade/ritmo; transições; iluminação; paleta; elementos 3D; VFX; som/sincronização; ferramentas necessárias.

Mapear cada observação a evidência (timestamp/frame), inferência de técnica e proposta original. Distinguir certeza observável de hipótese (ex.: movimento simulado em pós vs câmera 3D). Não atribuir uso de modelo generativo só pela aparência.

Criar storyboard com elementos originais ou fornecidos/licenciados. Sem vídeo anexado, não inventar uma análise específica. Sem modelo externo disponível, propor Blender/Three/Remotion/FFmpeg conforme o efeito; custos e credenciais devem ser explícitos antes de qualquer integração.
