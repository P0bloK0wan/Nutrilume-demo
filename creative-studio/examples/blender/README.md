# D · AURA / Object 01

Uma luminária escultórica original, criada por script Python executado no Blender 4.3.2. A cúpula de porcelana nasce de uma superfície de revolução com quads e UV cilíndrica; Subdivision, Solidify e Bevel permanecem editáveis. Base circular em alumínio, haste, halo estrutural, difusor opalino e pedestal formam o produto. Nenhum asset externo foi usado.

## Entregáveis

Em `../../artifacts/blender/`:

- `hero.png`: render real, 1280 × 720, frame 34.
- `aura-object-01.blend`: cena editável, materiais PBR, texturas procedurais, câmera e animação.
- `aura-object-01.glb`: exportação real de geometria com modificadores avaliados e materiais glTF. A microtextura procedural não foi baked no GLB. O GLB usa fatores PBR e exporta anisotropia por `KHR_materials_anisotropy`, cujo visual depende do suporte do viewer; não leva animação.
- `aura-film.mp4`: filme de 48 frames, 24 fps, 640 × 360, H.264.
- `fundamentals-lab.blend`: quatro exemplos adicionais editáveis, descritos abaixo.
- `verification-summary.json`, `scene-evidence.json`, `lab-evidence.json`, logs e `video-probe.json`: evidências executadas.

## Reprodução local

```bash
blender -b --python examples/blender/build_aura.py -- hero
blender -b --python examples/blender/build_aura.py -- video
ffmpeg -y -framerate 24 -i artifacts/blender/frames/aura-%04d.png -c:v libx264 -crf 21 -pix_fmt yuv420p artifacts/blender/aura-film.mp4
blender -b --python examples/blender/build_lab.py
blender -b --python examples/blender/verify_aura.py
```

Rodar a partir da raiz `creative-studio`; os scripts também resolvem caminhos a partir de sua própria localização. `-- all` produz hero e frames em uma execução. O filme conserva todas as imagens intermediárias. Validação real com FFprobe 7.1.5: codec `h264`, pixel format `yuv420p`, `640×360`, taxa `24/1`, `48` frames, duração `2.000000 s`. A saída completa está em `video-probe.json`.

## Direção e técnica

Paleta de referência: carvão `#11120f`, creme `#f2eee5`, âmbar `#dfb36b`, oliva `#727a5f`. Materiais usam valores aproximados no espaço linear do shader e transformação AgX; não é uma promessa de equivalência hexadecimal no pixel renderizado. A fotografia combina key ampla, rim âmbar, fill frio e luz prática sob a cúpula. Ground infinito e pedestal assentam a composição. Um arco Bezier conduz a câmera; Track To mantém o produto no quadro. Abertura f/7.1 e foco no produto evitam desfoque excessivo.

Nos 48 frames a câmera faz dolly/orbit, a cúpula sobe 13 cm e gira, e o difusor e luz prática crescem em intensidade. A cúpula é radialmente simétrica, portanto o giro isolado é sutil; a elevação torna o movimento de objeto visível. Não há rack focus artificial.

**Render realmente utilizado:** Cycles CPU, duas threads; hero 96 samples; filme 8 samples; 48 frames a 24 fps. O hero final levou 1 min 54 s neste ambiente; foi aberto e inspecionado visualmente. O MP4 foi decodificado integralmente pelo FFmpeg sem erros. Sem GPU. O pacote Blender deste ambiente não contém OpenImageDenoise: a primeira tentativa revelou esse erro, e o script final desativa denoise. Há ruído residual deliberadamente aceito para manter o custo de CPU controlado. Sem plugins instalados, sem Blender MCP, sem scripts externos.

## Laboratório executado

`build_lab.py` cria e avalia todos os frames 1–48, exige que os quatro checks passem e salva `lab-evidence.json`:

1. **Rig com dois bones conectados + IK:** handle animado, chain length 2; mede distância entre ponta resolvida e alvo.
2. **Shape keys:** `Basis` + `Bloom`; compara dimensões avaliadas nos extremos da animação.
3. **Rigid body:** cubo ativo com massa cai sobre plano passivo; mede centro em Z de 2,40 m para aproximadamente 0,34 m. Recomece no frame 1 para recalcular cache ao abrir.
4. **Geometry Nodes:** dispersão determinística com seed 17, instâncias de icosferas realizadas; verifica 1500 polígonos na geometria avaliada.

Não foram demonstrados fluidos, tecido, escultura manual, retopologia de personagens, grooming, mocap ou composição avançada. São caminhos de estudo posteriores, não capacidades verificadas nesta entrega.

## Licença

Geometria, design AURA / Object 01, scripts, materiais, animação e renders desta demo são originais e disponibilizados sob **CC0-1.0**. Nenhuma marca, referência de produto comercial, HDRI, textura, fonte ou modelo externo integra a cena. Blender e FFmpeg são ferramentas com suas próprias licenças; não são redistribuídos nesta pasta.
