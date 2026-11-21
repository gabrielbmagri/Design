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
4. **Legenda de DUAS FONTES (referência `reel-ref-01` e o print do Tallis Gomes)**:
   blocos de até ~5 palavras; a frase em sans bold (Montserrat 700, caixa normal,
   branca, sombra suave, sem caixa e sem contorno) e a **última palavra forte do bloco**
   embaixo, GRANDE, em serifa itálica (Playfair Display itálico, creme). Cada palavra
   aparece quando é falada (sobe e acende). O bloco sempre termina numa palavra forte,
   para a ordem de leitura bater com a fala. Fica no meio-baixo (y≈1180 de 1920).
5. **Palavras-chave no fundo, ATRÁS das pessoas e ALTAS** (y≈140), para a cabeça não
   tampar tudo: frases curtas do que está sendo dito (Playfair Display itálico, grande,
   creme CLARO `#F6EFE4` ~90% com sombra suave escura, para aparecer mesmo depois da cor quente de cinema; texto encolhe para caber). Entram LETRA POR LETRA subindo de baixo para cima, com som suave de digitação, recortadas pela segmentação de pessoas.
   Uma a cada ~5–8 s, nos momentos fortes.
6. **Card do Instagram como HOLOGRAMA** de quem está sendo divulgado: GRANDE (~1040 px
   de largura), surge DE BAIXO com efeito sonoro (whoosh + brilho), treme como
   holograma ao entrar e fica atrás da cabeça deles, inclinado em perspectiva, com
   brilho, linhas de varredura e ~60% de opacidade, na altura das cabeças (y≈540) (referência: `reels/projetos/ref-card-holograma-lovable.png`, anúncio da lovable.dev
   com painel flutuando atrás da pessoa). Aparece quando citam a marca e no final no
   "segue lá / arroba". Montar o card do print do perfil: logo em círculo, nome, @,
   descrição, cidade.
7. **Muitos efeitos, com bom gosto**: flash suave nos cortes, entradas com easing,
   palavras subindo ao entrar, grão de filme leve.
8. **Cores neutras** nos textos e elementos: creme `#F4EEE6`, areia/taupe `#C9B79C`,
   marrom-taupe `#786856`, charcoal `#2E2A27`, branco. Escolher a paleta olhando o
   ambiente do vídeo e a cor da marca divulgada, para não brigar com elas.
9. **Cor de CINEMA** (referência: `reels/projetos/ref-cor-cinema-tallis.png`):
   meios-tons quentes e encorpados, sombras levemente frias, altas suaves, contraste
   +, vinheta BEM LEVE (`vignette=angle=PI/8`; ele achou a "fumaça preta" das bordas forte demais), nitidez leve e grão. Preset `COR_CINEMA` no `editar_reels.py`.
10. **Música de fundo que dita o tom sem atrapalhar a narração**: trilha gerada em
    código (`reels/musica.py`, sem direitos autorais; clima `aconchego` = piano de
    feltro, pad quente, ritmo leve, ~84 BPM), ~15 dB abaixo da voz e com ducking
    (abaixa quando falam). Escolher o clima pelo sentimento do vídeo.
11. **Final com esmaecer para preto** (~1,8 s) enquanto a música baixa; deixar ~1,6 s
    de cauda depois da última fala.
12. Áudio da voz: passa-alta 80 Hz e loudnorm. Saída comprimida para o celular (~60 MB), enviada como anexo. Micro-fade (15–20 ms) em cada emenda de corte para não dar "tic"; nada de chiado agudo nos efeitos (chocalho e teclas sempre macios). Saída 1080×1920, 30 fps, H.264, comprimida para o celular (~60 MB; ele baixa pelo app). Enviar como anexo (`display: attach`).

## Variante: reels "na batida" (barbearia, corte, produto, sem fala)

Quando ele mandar fotos/vídeos curtos de um resultado (ex.: corte de cabelo) e pedir
"só efeitos e música", SEM narração, SEM legenda e SEM palavras na tela:
- 10–15 s, trilha phonk/trap com grave (808) gerada por `reels/batida.py` (130 BPM,
  intro de 4 batidas com riser → drop com impacto → golpe final).
- `reels/reels_batida.py config.json`: plano a plano na grade da batida, intercalando
  vídeos e fotos para mostrar todos os ângulos; zoom-soco no bumbo, tremida e separação
  RGB na caixa, giro com desfoque entre planos, flash no drop e no fim, vibração,
  dupla exposição (um vídeo "por cima" do outro), CONTORNO DE RAIO elétrico em volta da
  pessoa (núcleo branco + brilho azul), cor de cinema, grão e esmaecer no fim.
- Exemplo: `reels/projetos/barbearia-corte/config.json`.

## Ferramentas (pasta `reels/` do repositório)

- `reels/transcrever.py <video_ou_audio> words.json [medium]`: transcrição palavra a
  palavra local (faster-whisper; `pip install faster-whisper`). Conferir nomes próprios
  e corrigir no config (`correcoes`), ex.: "Dosseria" → "Doceria".
- `reels/editar_reels.py config.json`: faz cortes, base com cor, zoom, palavras-chave e
  card-holograma atrás das pessoas, trilha, whoosh, grão e esmaecer (mediapipe `selfie_multiclass_256x256.tflite`, baixar de
  storage.googleapis.com/mediapipe-models), legenda e flash. Fontes Montserrat e
  Playfair Display (google/fonts no GitHub) em `fonts/` ao lado do config.
- `reels/musica.py trilha saida.wav <seg> [clima]` / `musica.py whoosh saida.wav`: trilha e efeito sonoro.
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
