# Revisão visual obrigatória — guia anatômico do Silhueta

Esta lista complementa a execução automática de `qa/check_anatomy.py`. **Não existe teste de pixels que comprove sozinho a posição anatomicamente correta de uma fita.**

## Padrão único

- [ ] Cada uma das 12 imagens mostra uma fita métrica rosa **realmente envolvendo a circunferência**, sem substituir a fita por círculos, alvos, setas ou linhas artificiais.
- [ ] A região do corpo é humana, reconhecível e sem deformações; vista frontal, lateral ou posterior quando necessária.
- [ ] A fita aparece no lugar descrito no texto e não sobre outra estrutura.
- [ ] A fita está nivelada nos contornos de tronco, quando aplicável; em braços e pernas acompanha o plano transversal do membro.
- [ ] O enquadramento é legível em 320 e 390 pixels de largura.
- [ ] Os 12 desenhos usam a mesma estética, tons e tipo de fita.
- [ ] Cada botão seleciona a ilustração correspondente sem deslocar a página nem apagar o formulário.
- [ ] Os registros pessoais, o ícone Opção A, o PWA e a sincronização Gist continuam intactos.

## Auditoria por região

| Chave | Posição que deve aparecer |
|---|---|
| bust | Maior circunferência do busto; fita paralela ao chão |
| underbust | Imediatamente sob o busto |
| shoulders | Circunferência ao redor dos ombros e dorso superior |
| neck | Base do pescoço |
| waist | Ponto médio entre última costela e crista ilíaca |
| abdomen | Nível do umbigo; diferente da cintura |
| hip | Maior circunferência dos glúteos |
| arm | Braço relaxado no ponto médio ombro–cotovelo |
| biceps | Maior circunferência do bíceps contraído |
| forearm | Ponto mais largo do antebraço, não o punho |
| thigh | Posição definida e repetível na coxa |
| calf | Ponto mais largo da panturrilha |

## Portão automático

O workflow `.github/workflows/anatomy-qa.yml` executa em pushes e pull requests: verifica SHA-256 dos 12 WebP aprovados, dimensões mínimas, faixa rosa em posição aproximada, mapeamento dos nomes, ausência de sobreposições extras, preservação da integração Gist/ícone e sintaxe JavaScript.

**Qualquer mudança nas imagens deve ser reavaliada visualmente antes de atualizar os hashes em `qa/anatomy-manifest.json`.** O workflow pode marcar uma alteração como falha; para impedir merges, a proteção da branch deve exigir o check no GitHub Settings.

As imagens são ilustrações educativas geradas com auxílio de IA e ampliadas para os arquivos PNG de 2048 px; não são material clínico certificado. O aplicativo incorpora WebP de 1280 px para carregamento eficiente.
