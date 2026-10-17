# Diretrizes do Nutrilume

Nome, logo e cores são provisórios e originais (não copiam nenhuma plataforma existente).

## Visual
- Fundo `#F3F6F4`, cartões brancos com borda `#DFE6E1` e raio 20 px, texto `#13201B`, secundário `#56635C`.
- Cor principal `#0B7A62`; atenção `#E8732C` (só para o que pede ação).
- Títulos em Bricolage Grotesque, texto em Figtree. Alvos de toque de pelo menos 44 px.
- Dados fictícios sempre com a etiqueta "Dados de exemplo".

## Animação (poucas, e cada uma explica algo)
1. Entrada de tela: sobe 12 px e aparece (mostra que a tela mudou).
2. Gráfico de evolução: a linha se desenha na primeira vez (mostra a direção do progresso).
3. Copo de água: enche ao tocar (mostra o quanto falta).
4. Anel do dia e check de refeição: preenchem ao marcar (mostra o dia andando).
5. Números do financeiro: sobem uma vez.
Regras: nada em loop além da onda da água; duração entre 0,25 e 0,9 s; respeitar "reduzir movimento" do aparelho (já implementado); animação nunca esconde informação.

## Evolução do paciente
- Medidas em gráfico e fotos de antes e depois com controle deslizante.
- Fotos só no aparelho nesta demonstração. Na versão completa: armazenamento privado, visível só para o paciente e o nutricionista dele, e o paciente decide mostrar ou apagar.
- Sem modelo 3D do corpo.

## Comunidade e conteúdo
- Sem ranking de peso nem comparação de corpos; desafios medem constância.
- Ninguém prescreve dieta em espaço aberto; dúvida clínica vai para o nutricionista do paciente.

## Privacidade (LGPD e CFN)
- Consentimento antes de coletar dado de saúde ou foto; apagar conta apaga os dados.
- Sem gravação de teleconsulta com dado sensível.
- Confirmar com o CFN e um advogado as regras de publicidade (Resolução CFN 599/2018) antes de lançar.

## WhatsApp
- Botão opcional, ligado e desligado pelo nutricionista. Sempre com aviso: não enviar exames, fotos do corpo nem dados de saúde por lá.
- Conversas no WhatsApp ficam fora da plataforma e do termo de consentimento.

## Grupo do consultório
- Sem pesos, links ou orientação de dose; palavras de alerta geram acolhimento e aviso ao nutricionista, sem guardar o texto.
- Denúncia em toda mensagem; o nutricionista pode ocultar.
