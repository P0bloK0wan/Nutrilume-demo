# Pipeline motion e cinema digital

Análise de referência → storyboard → mapa de beats → composição → frames de prova → áudio → render → ffprobe → contato de quadros → revisão.

O projeto C usa produto e linguagem originais AURA. O hero renderizado em Blender pode entrar como camada, preservando sua procedência. Câmera e movimento 2D sobre um render não devem ser descritos como uma nova cena 3D renderizada por frame.

Preferir render curto 720p,30fps e concurrency1 no ambiente de três CPUs. Depois de validar ritmo e legibilidade, ampliar resolução se o custo justificar. Verificar duração, codec, áudio, quadros de abertura/fecho/transição e decodificação. Um arquivo MP4 existente não comprova a qualidade visual.

Para referência enviada pelo usuário: `python3 workflows/analyze_reference.py VIDEO --output artifacts/reference`. O comando só extrai metadados/quadros; interpretar imagem e som separadamente. Não usar assets sem permissão nem presumir identidade de modelos de IA pela aparência.

Licença Remotion deve ser avaliada conforme equipe/contexto; produção local sem contratar API não equivale a licença comercial irrestrita. Veja docs/audits/motion.md.
