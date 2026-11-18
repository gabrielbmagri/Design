---
name: editar-reels
description: Edita reels (vídeo vertical 9:16 de pessoas falando, recebidos, publis, parcerias) no estilo do Gabriel. Use sempre que ele disser "editar reels", "faz um reels", "monta o reels", "edita esse vídeo pro Instagram", mandar um vídeo de influenciadores/casal apresentando um produto, ou pedir legendas, cortes e efeitos num vídeo curto.
---

# Editar reels (estilo do Gabriel)

Ele não precisa repetir as preferências: siga tudo abaixo por padrão. O pedido dele
sempre vence; quando ele der um ajuste novo, aplique e ofereça gravar aqui como regra.

## Preferências fixas (pedidas por ele)

1. **Cortar as partes vazias**: começo sem fala, pausas (> ~0,45 s viram ~0,13 s de
   respiro) e silêncios longos. Silêncio longo com AÇÃO (abrir o recebido, mostrar o
   produto) não some: vira um trecho acelerado de ~4–5 s.
2. **Acelerar só um pouquinho**: 1,05–1,10× (padrão 1,08×), sem atrapalhar o entendimento.
3. **Zoom in e zoom out** alternando por trecho: "soco" de zoom out (1,14→1,0) no início
   de um trecho, empurrão lento de zoom in (1,0→1,08) no seguinte.
4. **Legenda estilosa combinando com o ambiente**: palavra a palavra, blocos de até 3
   palavras, maiúsculas, Montserrat ExtraBold, branca com contorno escuro; a palavra
   falada ganha uma pílula escura (charcoal) com texto creme. Fica no terço inferior
   (y≈1300 de 1920), fora da área dos botões do Instagram.
5. **Palavras-chave no fundo, ATRÁS das pessoas**: frases curtas do que está sendo dito
   (Playfair Display itálico, grande, semitransparente; em parede clara usar taupe `#7A6652` ~60%, em fundo escuro usar creme `#F4EEE6`; texto encolhe para caber), recortadas pela
   segmentação de pessoas para ficarem atrás delas. Uma a cada ~5–8 s, nos momentos fortes.
6. **Card do Instagram de quem está sendo divulgado** surgindo atrás deles, meio
   transparente (~80%), quando citam a marca e no final no "segue lá / arroba".
   Montar o card a partir do print do perfil: logo em círculo, nome, @, descrição, cidade.
7. **Muitos efeitos, com bom gosto**: flash suave nos cortes, entradas com easing,
   card com leve escala, palavras subindo ao entrar.
8. **Cores neutras** nos textos e elementos: creme `#F4EEE6`, areia/taupe `#C9B79C`,
   marrom-taupe `#786856`, charcoal `#2E2A27`, branco. Escolher a paleta olhando o
   ambiente do vídeo e a cor da marca divulgada, para não brigar com elas (ex.: marca
   avermelhada + fundo amarronzado → tudo neutro).
9. **Corrigir a cor do vídeo**: contraste +, saturação +, gama levemente menor,
   balanço levemente mais quente, nitidez (unsharp). Áudio: passa-alta 80 Hz e
   loudnorm −14 LUFS.
10. Saída 1080×1920, 30 fps, H.264, pronta para postar.

## Ferramentas (pasta `reels/` do repositório)

- `reels/transcrever.py <video_ou_audio> words.json [medium]`: transcrição palavra a
  palavra local (faster-whisper; `pip install faster-whisper`). Conferir nomes próprios
  e corrigir no config (`correcoes`), ex.: "Dosseria" → "Doceria".
- `reels/editar_reels.py config.json`: faz cortes, base com cor, zoom, palavras-chave e
  card atrás das pessoas (mediapipe `selfie_multiclass_256x256.tflite`, baixar de
  storage.googleapis.com/mediapipe-models), legenda e flash. Fontes Montserrat e
  Playfair Display (google/fonts no GitHub) em `fonts/` ao lado do config.
- Exemplo completo de config: `reels/projetos/doceria-da-eva/config.json`.

## Passo a passo

1. Baixar o vídeo (link do iCloud: abrir com Playwright, capturar as respostas de
   `ckdatabasews` e baixar `resOriginalRes`). Ver orientação, duração e uma folha de quadros.
2. Transcrever e ler a fala inteira; anotar os instantes das palavras fortes.
3. Montar o card da marca a partir do print do perfil (se houver).
4. Escrever o config (palavras-chave curtas e no tom do vídeo, cards, correções) e rodar.
5. Conferir uma folha de quadros do resultado (legenda legível, palavras atrás das
   pessoas, card visível, nada cortado no meio da frase) antes de entregar.
6. Entregar o MP4 com SendUserFile e sugerir uma legenda de post com o @ da marca.

## Referências

- Skills de edição mais completas no repositório (branch main): `short-form-edit`,
  `cut-silences`, `edit-video`, `hyperframes`, `style-library`, `referencias-visuais`.
  Consultar para ideias de ritmo, gancho nos 3 primeiros segundos e estilos.
