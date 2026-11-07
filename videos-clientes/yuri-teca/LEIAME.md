# Reel Yuri Teca (Bairro da Luz)

Vídeo bruto: álbum compartilhado do iCloud (720p). Etapas, scripts em `projeto/`:
1. `tr.py`: transcrição com tempo por palavra (faster-whisper large-v3).
2. `edl.py`: corta pausas pela energia do áudio e o tropeço "que foram,".
3. Limpeza de voz: ffmpeg highpass + RNNoise (arnndn, modelo sh.rnnn) + afftdn + EQ + compressor.
4. `seg.py`: recorte da pessoa quadro a quadro (MediaPipe selfie multiclass) para as frases atrás dele.
5. `reel.html` + `frames.cjs`: composição (zoom, frases, fotos, legendas, logo) renderizada quadro a quadro.
6. `mix.py`: voz + "Inspired" (Kevin MacLeod, CC BY 4.0) com ducking + efeitos; loudnorm −14 LUFS.
O MP4 final fica fora do git.
