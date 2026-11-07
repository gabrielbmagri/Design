# Reel teste com IA (Théo, 10 s)

Vídeo gratuito feito com modelos abertos do Hugging Face (cota grátis diária, token do dono):

1. `kontext.py` — FLUX.1 Kontext transforma a foto do bebê em cena estilo animação (cena1-envelope.png, cena2-bolo.png).
2. `wan.py` — Wan 2.2 (imagem → vídeo) anima cada cena (≈5 s e ≈3 s, 624×832).
3. `roteiro.json` — narração com voz neural (skill voz-neural), pausas encurtadas, falas reposicionadas (`tempos_g.js`).
4. `reel.html` + `frames.cjs` — legendas palavra por palavra, faíscas, flash + confete na virada, cartão final rosa com botão do WhatsApp.
5. `audio.py` — trilha (Digital Lemonade, Kevin MacLeod, CC BY 4.0) que abaixa sob a voz + efeitos; loudnorm −14 LUFS.

O MP4 final não vai para o git (pesado); fica fora do repositório.
Conteúdo gerado por IA: marcar como "feito com IA" ao publicar no Instagram.
