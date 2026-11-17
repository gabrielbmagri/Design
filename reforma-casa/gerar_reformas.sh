#!/bin/bash
# Gera os quadros reformados que faltam (ren/rN.png) com o FLUX Kontext (Hugging Face).
# Cota grátis: ~5 imagens por dia. Pula as que já existem. Uso: ./gerar_reformas.sh [N...]
cd "$(dirname "$0")"; mkdir -p ren
export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt REQUESTS_CA_BUNDLE=/root/.ccr/ca-bundle.crt
BASE="Renovate this room, modern and affordable. Keep the same camera angle, layout, walls, window and doors. Complete flawless light oak wood-look PVC plank ceiling with recessed LED spots, no hanging bulb. Same beige diagonal ceramic tile floor, complete and clean. Fresh off-white walls. Remove all clutter. Photorealistic, daylight."
P[1]="Light gray sofa on the right, round wooden coffee table, jute rug, plant by the window, white split air conditioner instead of the old one."
P[2]="Keep the white slatted counter, add light oak countertop and two wooden stools, white split air conditioner instead of the old one."
P[3]="Keep the white slatted wall and the doorway, modern white door frame, small wall sconce."
P[4]="Keep the back door, refurbished white; white split air conditioner instead of the old one; white counter with oak top on the left."
P[5]="Kitchen: keep the white counter and shelves on the left, add oak countertops, white cabinets, tidy shelf with plants, white fridge on the right."
P[6]="Keep the white counter island with oak top, two wooden stools, white slatted wall behind, small plant."
for n in ${@:-2 3 4 5 6 1}; do
  [ -f ren/r$n.png ] && [ "$FORCE" != 1 ] && { echo "r$n já existe"; continue; }
  python3 -I kontext.py kf/k$n.jpg ren/r$n.tmp.png "$BASE ${P[$n]}" 11 2>&1 | tail -1 && [ -f ren/r$n.tmp.png ] && mv ren/r$n.tmp.png ren/r$n.png
done
