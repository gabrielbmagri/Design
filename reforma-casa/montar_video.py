#!/usr/bin/env python3
"""Monta o vídeo "reforma acontecendo": o vídeo original vai tocando e, em cada
ponto-chave, a reforma aparece por cima (cortina de cima para baixo, começando
pelo forro). No fim, um tour pela casa pronta, terminando olhando para a sala.

Uso: python3 montar_video.py <pasta_trabalho>
A pasta precisa ter: original.mov, kf/full1..6.jpg (quadros originais 1080x1920)
e ren/r1..6.png (quadros reformados). Quadros sem versão reformada são pulados.
"""
import os, subprocess, sys

W, H, FPS = 1080, 1920, 30
T = [0.4, 3.6, 6.4, 11.6, 16.4, 18.6]   # instantes dos quadros-chave no vídeo
XF = 0.4                                  # duração das transições entre trechos
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

work = sys.argv[1]
os.chdir(work)
os.makedirs("pecas", exist_ok=True)
ENC = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(FPS), "-preset", "medium", "-crf", "18", "-an"]


def run(args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def cover(label):
    return f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1{label}"


def zoom(src_label, dur, out, z0=1.0, z1=1.06):
    n = int(dur * FPS)
    return (f"{src_label}scale={W*2}:{H*2},zoompan=z='{z0}+({z1}-{z0})*on/{n}':"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}{out}")


def label(text):
    if not os.path.exists(FONT):
        return ""
    return (f",drawtext=fontfile={FONT}:text='{text}':fontcolor=white:fontsize=54:"
            f"box=1:boxcolor=black@0.45:boxborderw=22:x=(w-text_w)/2:y=h*0.08")


pieces = []  # (arquivo, duração)
start = 0.0
for i, t in enumerate(T, 1):
    # trecho original até o quadro-chave
    dur = max(t - start, 0.5)
    out = f"pecas/orig{i}.mp4"
    run(["-ss", str(max(t - dur, 0)), "-t", str(dur), "-i", "original.mov",
         "-vf", cover(f",fps={FPS}") + label("ANTES"), *ENC, out])
    pieces.append((out, dur))
    start = t
    ren = f"ren/r{i}.png"
    if not os.path.exists(ren):
        continue
    # a reforma acontecendo: cortina de cima para baixo sobre o mesmo enquadramento
    d = 4.0
    out = f"pecas/reforma{i}.mp4"
    fc = (f"[0]{cover('[a0]')};[1]{cover('[b0]')};"
          f"{zoom('[a0]', d, '[a]')};{zoom('[b0]', d, '[b]')};"
          f"[a][b]xfade=transition=wipedown:duration=1.4:offset=0.5{label('DEPOIS')}[v]")
    run(["-loop", "1", "-t", str(d), "-i", f"kf/full{i}.jpg",
         "-loop", "1", "-t", str(d), "-i", ren,
         "-filter_complex", fc, "-map", "[v]", "-t", str(d), *ENC, out])
    pieces.append((out, d))

# tour final pela casa pronta
rens = [f"ren/r{i}.png" for i in range(1, 7) if os.path.exists(f"ren/r{i}.png")]
for j, r in enumerate(rens, 1):
    d = 3.0 if r != rens[-1] else 4.5
    out = f"pecas/tour{j}.mp4"
    txt = label("A CASA PRONTA") if j == 1 else ""
    run(["-loop", "1", "-t", str(d), "-i", r, "-filter_complex",
         f"[0]{cover('[a0]')};{zoom('[a0]', d, '[v0]', 1.0, 1.08)};[v0]null{txt}[v]",
         "-map", "[v]", "-t", str(d), *ENC, out])
    pieces.append((out, d))

# junta tudo com transições suaves
inputs, fc, prev, acc = [], [], "[0:v]", pieces[0][1]
for k, (f, d) in enumerate(pieces):
    inputs += ["-i", f]
for k in range(1, len(pieces)):
    off = acc - XF
    lab = f"[x{k}]"
    fc.append(f"{prev}[{k}:v]xfade=transition=fade:duration={XF}:offset={off:.3f}{lab}")
    prev, acc = lab, acc + pieces[k][1] - XF
run([*inputs, "-filter_complex", ";".join(fc), "-map", prev, *ENC, "reforma_casa.mp4"])
print(f"PRONTO reforma_casa.mp4 ({acc:.1f}s, {len(rens)} ambientes reformados)")
