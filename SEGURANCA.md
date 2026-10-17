# Segurança da demonstração

Resultado dos testes automáticos (`tests/seguranca.py`, Playwright + Chromium): **52 verificações, 52 aprovadas**.
Rodar: `python3 -m http.server 8765` nesta pasta e, em outro terminal, `python3 tests/seguranca.py` (precisa de `pip install playwright`).

## O que foi testado
- **Injeção de código (XSS):** 4 cargas maliciosas digitadas em todos os campos de texto (diário, mensagens, grupo, aviso, lista de compras, ficha, convite, busca, editor de plano, meta, WhatsApp) e depois exibidas em todas as telas. Nenhum script executou, nada foi injetado e o navegador não registrou violação da política de segurança (CSP). O texto aparece como texto.
- **O teste enxerga falhas:** numa cópia com a proteção desligada de propósito, a mesma carga executou. Na versão entregue, não.
- **WhatsApp:** o link só pode apontar para `https://wa.me/`, o número é reduzido a dígitos e validado (DDD + número), o texto é codificado, o link abre em nova aba com `noopener noreferrer` e há aviso de privacidade antes de abrir.
- **Upload de foto:** só JPG, PNG, WEBP e HEIC até 8 MB. HTML, SVG e arquivo grande são recusados.
- **Grupo:** bloqueia peso, links e orientação de dose; palavras de alerta bloqueiam a mensagem, mostram acolhimento e avisam o nutricionista sem guardar o texto; limite de uma mensagem a cada 3 s; denúncia e ocultar mensagem funcionam; só um voto na enquete.
- **Metas:** meta de peso é recusada (só hábitos).
- **Navegador:** sem scripts nem atributos `on*` no HTML, sem `javascript:` em links, nada gravado em localStorage, sessionStorage ou cookies, e a página só fala com o próprio site e o Google Fonts.

## O que a demonstração NÃO garante
Isto é uma página sem servidor. Os pontos abaixo só existem de verdade na versão com banco de dados e precisam ser implementados e testados lá:
- **Login e separação de papéis.** Aqui qualquer pessoa troca entre Paciente e Nutricionista com um botão. Na versão completa, cada paciente só pode ver os próprios dados e cada nutricionista só os pacientes dele (regras de acesso no banco, testadas com contas diferentes).
- **Termo de consentimento.** O bloqueio do botão é só visual. O consentimento precisa ser registrado e exigido no servidor antes de gravar dado de saúde.
- **Moderação do grupo.** O filtro de palavras roda no navegador e pode ser contornado. A validação tem de se repetir no servidor, com revisão humana.
- **Limite de mensagens, armazenamento privado de fotos, convites de uso único com validade, lembretes (push) e apagamento de conta.**
- **Cabeçalhos HTTP.** O GitHub Pages não deixa configurar cabeçalhos. A política de segurança está em `<meta>`, que não cobre proteção contra a página ser embutida em outro site (clickjacking). Para isso, hospede onde dê para definir `Content-Security-Policy: frame-ancestors 'none'`.
- **WhatsApp** é um serviço de terceiros fora do termo de consentimento: por isso o aviso para não mandar dados de saúde.

Antes de usar com pacientes reais, vale uma revisão de segurança por um profissional e a análise de um advogado sobre LGPD e as regras do CFN.

## Perfil, avatar e Comunidade (adicionado)
- Foto de perfil: só JPG/PNG/WEBP/HEIC até 8 MB, recortada e reencodada em canvas (remove EXIF/localização). Sem foto, aparece a logo.
- Bio, nome e campos do perfil passam por esc() em todo innerHTML (testado com payload XSS).
- Comunidade: aceite de 4 itens, apelido validado (sem nome real, telefone, link), sem foto/bio/cidade, sem mensagem privada, filtros de peso/link/dose, palavras de alerta com acolhimento (CVV 188) sem guardar o texto, limite de 3 s, denunciar, bloquear, apagar, sair.
- O nutricionista vê apenas a própria sala (apelidos) e não vê a atividade dos pacientes em outras salas.
- **Limites da demonstração:** sem servidor, não há verificação real de CRN, de idade, nem moderação no servidor; tudo é só do navegador e some ao recarregar. Em produção isso exige backend (RLS, moderação server-side, verificação de CRN) e revisão de advogado (LGPD, Marco Civil, CFN 599/2018).
- Testes: `tests/seguranca.py` (52) e `tests/comunidade.py` (36).
