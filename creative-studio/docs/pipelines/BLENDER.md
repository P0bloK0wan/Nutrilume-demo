# Pipeline Blender → web/vídeo

Conceito → modelagem procedural → UV/modificadores → PBR → set de luz → câmera → animação → preview → hero → sequência → GLB → validação.

CLI Blender headless evita depender de uma integração de execução remota. Scripts próprios ficam em examples/blender. O laboratório demonstra operações adicionais e produz JSON de verificação.

A cena editável retém modificadores e animação; a exportação GLB pode simplificar materiais e não necessariamente contém a animação da cena. Conferir o GLB como um produto separado. `tests/check_glb.py` faz inspeção estrutural básica; Blender reimport e visualizador web complementam a verificação.

Otimização: medir primeiro. Um GLB de cerca de200KB sem texturas grandes não justifica adicionar decodificadores pesados indiscriminadamente. Para assets maiores, avaliar glTF Transform, Meshopt/Draco, KTX2/Basis, LOD, instancing e limites de textura, com teste de qualidade e compatibilidade. Não confundir gzip de transferência com redução de polígonos ou compressão de texturas.

HDRI, fontes e texturas externas precisam de licença específica. A cena AURA usa modelagem e materiais próprios. Não ativar Blender MCP sem necessidade, revisão de bind/autenticação e isolamento da execução Python.
