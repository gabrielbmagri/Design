# Reels

Ferramentas da skill `editar-reels` (`.claude/skills/editar-reels/SKILL.md`).

- `transcrever.py`: transcrição palavra a palavra (faster-whisper, local).
- `editar_reels.py`: edição completa a partir de um `config.json`.
- `projetos/<nome>/`: config, card e transcrição de cada reels (vídeos não ficam no git).

Dependências: `pip install faster-whisper mediapipe pillow numpy`, `apt-get install -y libegl1 libgles2`,
ffmpeg, fontes Montserrat e Playfair Display em `fonts/` e o modelo
`selfie_multiclass_256x256.tflite` em `models/` (ao lado do config).
