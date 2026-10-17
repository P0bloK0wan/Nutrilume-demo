# Nutrilume · demonstração

Página única que roda sem instalar nada. Paciente: Hoje, Plano com trocas, Diário, Evolução (silhueta genérica e fotos antes/depois) e Mensagens. Nutricionista: Pacientes com convite e termo de consentimento, Montar plano (publica para o paciente), Mensagens, Agenda e Financeiro. Também tem WhatsApp (com aviso de privacidade), grupo do consultório com moderação, lista de compras, receitas, ficha de primeira consulta, metas e lembretes. Os dados são de exemplo e ficam só na memória da página: ao recarregar, tudo volta ao início.

## Ver no computador
Abra `index.html` no navegador.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub e envie estes arquivos na raiz.
2. Em **Settings > Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Abra o endereço que o GitHub mostrar (algo como `https://SEU-USUARIO.github.io/NOME-DO-REPO/`).

## Usar como app no iPhone
Abra o endereço no **Safari**, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.

Veja `DIRETRIZES.md` para o visual, as animações e as regras de privacidade.

## Segurança
Veja `SEGURANCA.md` (testes feitos e o que ainda depende do servidor). Os testes ficam em `tests/seguranca.py`.

## Novidades
- Planta da constância (5 estágios) em Hoje, Evolução e Grupo.
- Sua logo é o ícone do app e a foto de perfil padrão; paciente e nutricionista podem trocar a foto e editar bio e dados.
- Aba Comunidade (salas com nutricionista anfitrião, apelido, regras de segurança).
- Testes: `python3 -m http.server 8765` e, em outro terminal, `python3 tests/seguranca.py` e `python3 tests/comunidade.py`.
- Banco de alimentos com cálculo de calorias e macros no editor de plano do nutricionista (valores de exemplo; `tests/alimentos.py`).
