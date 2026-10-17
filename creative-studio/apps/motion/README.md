# AURA / Motion C

Comercial editorial original em Remotion + React. 10s / 300frames / 30fps / 1280×720. Tipografia com entrada suave, três cenas e assinatura final. Paleta carvão, creme, âmbar e oliva. Timeline detalhada em [STORYBOARD.md](STORYBOARD.md).

## Reprodução local

Node24 e npm disponíveis nesta execução. Dependências diretas fixadas em Remotion/@remotion/cli4.0.536 e React/react-dom19.3.1. Os manifests foram inspecionados em `../../research/npm-selected` antes de instalar. Não há install/postinstall nos manifests Remotion auditados; todos os lifecycle scripts são bloqueados na instalação.

```bash
cd /workspace/creative-studio/apps/motion
npm ci --ignore-scripts --cache /workspace/.npm-cache
python synthesize.py
npm run render
npm run still
python verify.py
```

O script usa Chromium local em `/workspace/.playwright/chromium-1234/chrome-linux64/chrome`, sem download automático de navegador. Ajuste os caminhos em package.json para outra máquina. Render usa concorrência1, H.264/yuv420p/CRF18. A versão do browser e o sistema de fontes podem alterar rasterização entre máquinas; a animação e o áudio são determinísticos. Studio é ferramenta local de edição, não aplicação publicada. Não houve publicação ou serviço pago.

## Origem e licença

`public/hero.png` é cópia do render Blender original desta missão, de `../../artifacts/blender/hero.png`; a cena editável e a proveniência estão na entrega Blender. O comercial anima/composita esse still3D com React/CSS. Não é vídeo gerado por modelo de IA externo. Não há assets de banco ou samples. `synthesize.py` cria a trilha original local e editável. Texto e gráficos são originais desta missão; fontes de sistema Georgia/Arial (fallback possível no Linux) não são redistribuídas como arquivos.

React/react-dom: MIT. Remotion possui licença específica, `SEE LICENSE IN LICENSE.md`; não assumir MIT. Consulte [REMOTION-LICENSE.md](REMOTION-LICENSE.md), cópia do texto instalado em `node_modules/remotion/LICENSE.md` e a auditoria do estúdio antes de uso organizacional/comercial: certas organizações precisam de licença paga. Esta demonstração local não compra licença nem autoriza uso além dos termos aplicáveis. Código e artefatos originais desta pasta: MIT, conforme LICENSE; direitos dos pacotes permanecem com seus titulares.

## Verificação

`verify.py` lê ffprobe, exige H.2641280×720/30fps/300frames/10s e áudio AAC48kHz; gera stills dos quadros0/150/299 e contact sheet original. Resultados reais registrados em `../../artifacts/motion/verification.json`. O MP4 exportado com áudio está em `../../artifacts/motion/aura-commercial.mp4`. A inspeção visual é julgamento editorial, sem certificação automática de estética. Render CPU/Chromium software; sem GPU medida.

## Ambiente e observações desta execução

Fontconfig resolveu Georgia para Noto Serif e Arial para Liberation Sans. O arquivo Remotion de licença efetivamente instalado está copiado em REMOTION-LICENSE.md: licença gratuita para indivíduos, empresas com até3 funcionários, entidades sem fins lucrativos ou avaliação não comercial; demais casos exigem licença Company. Esta missão é uma avaliação local.

Tentativa no subprocesso isolado falhou ao abrir Chromium (`SIGTRAP`, crashpad `setsockopt: Operation not permitted`), antes de produzir vídeo. O render deve executar no processo local autorizado com Chromium acessível. A falha original não implica problema da timeline. Resultado final é validado separadamente por ffprobe.

Resultado final desta execução: render Remotion real concluído com exit0 pelo processo principal fora do sandbox do subagente; `python verify.py` executou e retornou seis verificações verdadeiras. Extraídos e inspecionados visualmente contact-sheet.png e frame-000/150/299.png. Ver [visual-review.md](../../artifacts/motion/visual-review.md) para julgamento e limites. O WAV original teve pico−13.34dBFS e nenhum sample de clipping; `audio-analysis.json` registra a medição. O script de render foi reproduzido sem fallback FFmpeg/SVG; FFmpeg apenas extraiu QA do MP4.
