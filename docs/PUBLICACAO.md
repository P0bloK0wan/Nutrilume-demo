# Publicação no GitHub

O código completo do Nutrilume está na raiz do repositório. O estúdio AURA, seus editáveis e vídeos ficam em `creative-studio/`. Snapshots de código/documentação de terceiros sem licença clara não são republicados; os manifestos mantêm URLs, SHAs e arquivos consultados.

## Site público

A entrada do Pages é uma apresentação Nutrilume com a demonstração interativa e acesso ao estúdio. O artefato é gerado em `public-site/` por `node scripts/build-pages.mjs`. O código Node da plataforma, banco, arquivos privados, sessões e caixa de e-mails não são copiados.

Endereço esperado após ativação e implantação aprovada: https://p0blok0wan.github.io/Nutrilume-demo/

O Pages não executa o servidor nem oferece login clínico. A apresentação informa essa limitação e pede que não sejam inseridos dados pessoais/saúde na demo. Para contas reais, veja [opções de hospedagem](HOSPEDAGEM-GRATUITA.md).

## Ativação necessária no repositório

A integração desta sessão conseguiu escrever código, mas a API de criação do Pages retornou `403 Resource not accessible by integration`. A permissão de código não inclui ativar Pages nas configurações.

O proprietário pode habilitar em **Settings → Pages → Build and deployment → Source → GitHub Actions**. Depois, se a publicação anterior já tiver falhado, abra **Actions → Publicar GitHub Pages → Run workflow → main**. Não é necessário fornecer tokens neste projeto, contratar hospedagem ou inserir cartão.

O workflow `.github/workflows/pages.yml` usa somente `contents:read` na verificação e `pages:write`/`id-token:write` na implantação. Ele valida API, demo, plataforma e o artefato público antes de tentar publicar. `tests.yml` verifica branches/PRs; main usa o pipeline de publicação, evitando duplicar as verificações em todo push.

## Verificação local do artefato

```bash
node scripts/build-pages.mjs
python3 tests/pages.py
```

O teste serve a pasta como `/Nutrilume-demo/`, verifica landing móvel, demonstração, estúdio, fallback 3D e ausência das rotas privadas. O nome de caminho reproduz o subdiretório do Pages para identificar links absolutos incorretos. Isso não substitui consultar o resultado real da implantação.
