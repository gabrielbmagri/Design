#!/usr/bin/env bash
# Reinstala as ferramentas de vídeo a cada sessão na nuvem (o ambiente é temporário).
# Uso: bash scripts/setup-video-tools.sh [--whisper]
set -euo pipefail

echo "→ yt-dlp (use só para conteúdo seu ou com permissão)"
python3 -m pip install -q yt-dlp

echo "→ HyperFrames e Remotion (CLI)"
npm i -g hyperframes @remotion/cli remotion

echo "→ FFmpeg"
command -v ffmpeg >/dev/null && ffmpeg -version | head -1 || echo "FFmpeg não encontrado (apt-get install -y ffmpeg)"

if [[ "${1:-}" == "--whisper" ]]; then
  echo "→ whisper.cpp (compila do código-fonte e baixa um modelo)"
  mkdir -p "$HOME/tools" && cd "$HOME/tools"
  [[ -d whisper.cpp ]] || git clone --depth 1 https://github.com/ggml-org/whisper.cpp
  cd whisper.cpp
  cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build -j"$(nproc)" --config Release
  bash models/download-ggml-model.sh base
  echo "Transcrever: build/bin/whisper-cli -m models/ggml-base.bin -l pt -f audio.wav -osrt"
fi
echo "Pronto."
