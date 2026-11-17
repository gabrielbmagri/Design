# Reforma da casa em vídeo

O vídeo original (`original.mov`, do iCloud) vai tocando e, em 6 pontos do percurso
(sala → bancada → passagem → corredor → cozinha → volta olhando a sala), a reforma
aparece por cima. No fim, tour pela casa pronta.

Reforma: forro de PVC amadeirado com spots, o mesmo piso bege na diagonal completo,
paredes off-white, sem bagunça, móveis simples e modernos. Planta original mantida.

1. `./gerar_reformas.sh` gera os quadros reformados que faltam (`ren/`). Cota grátis do
   Hugging Face: ~5 imagens/dia.
2. `python3 montar_video.py .` monta `reforma_casa.mp4`.

Status: r1 (sala) pronto. r2–r6 pendentes (cota esgotada em 17/11, renova em 18/11 ~21h UTC).
