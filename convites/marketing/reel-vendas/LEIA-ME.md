# Reels de vendas (para mães de festa infantil)

Vídeo vertical 1080x1920, ~47 s, feito em HTML + Playwright + FFmpeg.

Fluxo:
1. Build da demonstração (`npx vite build --mode demo`) e servidor em `dist-demo` (porta 5180).
2. `capture.cjs` e `cap2.cjs`: tiram as capturas reais do produto (conjunto grande de convidados, `convite-demo-reel=1`).
3. `og.mjs`: imagem da prévia do WhatsApp do convite Safari.
4. `reel.html`: linha do tempo em batidas (120,3 BPM). `frames.cjs events|snap|render` extrai os efeitos, tira prévias e renderiza os quadros.
5. `audio.py`: trilha (Digital Lemonade, Kevin MacLeod, CC BY 4.0: creditar na legenda) + efeitos sintetizados.
6. FFmpeg junta tudo com normalização de volume (-14 LUFS).

Os caminhos dos scripts apontam para a pasta de trabalho usada na criação; ajuste `D`/`O` no topo de cada arquivo.
