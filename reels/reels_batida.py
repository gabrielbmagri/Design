#!/usr/bin/env python3
"""Reels curto "na batida" (sem fala, sem texto): cortes e efeitos sincronizados com a trilha.

Uso:  python3 reels_batida.py config.json

config.json:
  fontes:  {"v1": "video.mov", "f1": "foto.jpg", ...}   (vídeos ou fotos)
  trilha:  {"bpm":130, "compassos":6, "intro":4}        (gerada por batida.py)
  planos:  lista em ordem, cada um com:
     fonte, batidas (duração em batidas), ini (s na fonte), vel (velocidade),
     zoom [ini, fim], transicao: corte|giro|zoom|flash, raio: 0..1 (contorno elétrico),
     sobre: {fonte, ini, alpha} (dupla exposição), vibrar: true
  saida, modelo_seg

Efeitos automáticos: zoom-soco no bumbo, tremida + separação RGB na caixa, flash no
drop e no golpe final, giro com desfoque de movimento entre planos, contorno de raio
(segmentação da pessoa + ruído animado), cor de cinema, grão e esmaecer no fim.
"""
import json, os, subprocess, sys
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
cfg = json.load(open(sys.argv[1]))
os.chdir(os.path.dirname(os.path.abspath(sys.argv[1])))
rng = np.random.default_rng(3)


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


# ------------------------------------------------------------ trilha e grade
tr = cfg.get("trilha", {})
subprocess.run([sys.executable, "-I", os.path.join(HERE, "batida.py"), "trilha.wav",
                str(tr.get("bpm", 130)), str(tr.get("compassos", 6)), str(tr.get("intro", 4))], check=True)
grid = json.load(open("trilha.json"))
B, DROP, FIM, TOTAL = grid["beat"], grid["drop"], grid["fim"], grid["total"]
KICKS = grid["bumbos"] + [FIM]
SNARES = grid["caixas"]

# ------------------------------------------------------------ fontes -> quadros 1080x1920
os.makedirs("quadros", exist_ok=True)
SRC = {}
for name, path in cfg["fontes"].items():
    d = f"quadros/{name}"
    if path.lower().endswith((".jpg", ".jpeg", ".png")):
        img = cv2.imread(path)
        h, w = img.shape[:2]
        sc = max(W * 1.2 / w, H * 1.2 / h)  # folga para zoom/giro
        img = cv2.resize(img, (int(w * sc), int(h * sc)), interpolation=cv2.INTER_LANCZOS4)
        SRC[name] = {"foto": img}
        continue
    os.makedirs(d, exist_ok=True)
    if not os.listdir(d):
        subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf",
                        f"fps={FPS},scale={int(W*1.2)}:{int(H*1.2)}:force_original_aspect_ratio=increase:"
                        f"flags=lanczos,crop={int(W*1.2)}:{int(H*1.2)},unsharp=5:5:0.8",
                        "-q:v", "2", f"{d}/%05d.jpg"], check=True)
    SRC[name] = {"dir": d, "n": len(os.listdir(d))}


def src_frame(name, t):
    s = SRC[name]
    if "foto" in s:
        return s["foto"]
    i = int(np.clip(t * FPS, 0, s["n"] - 1)) + 1
    return cv2.imread(f"{s['dir']}/{i:05d}.jpg")


# ------------------------------------------------------------ linha do tempo
planos, t = [], 0.0
for p in cfg["planos"]:
    d = p["batidas"] * B
    planos.append(dict(p, t0=t, t1=t + d))
    t += d
planos[-1]["t1"] = TOTAL  # último plano segura até o fim da trilha
CUTS = [p["t0"] for p in planos[1:]]


def plano_at(t):
    for p in planos:
        if t < p["t1"]:
            return p
    return planos[-1]


def warp(img, scale, angle, dx, dy):
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, scale)
    M[0, 2] += dx - (w - W) / 2
    M[1, 2] += dy - (h - H) / 2
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def hit(t, times, dur):
    """intensidade 1->0 depois do último golpe (bumbo/caixa)."""
    past = [x for x in times if 0 <= t - x < dur]
    return 1 - (t - max(past)) / dur if past else 0.0


def render_plano(p, t, extra_angle=0.0, extra_scale=1.0):
    lt = t - p["t0"]
    img = src_frame(p["fonte"], p.get("ini", 0) + lt * p.get("vel", 1.0))
    z0, z1 = p.get("zoom", [1.0, 1.08])
    prog = lt / max(p["t1"] - p["t0"], 0.01)
    scale = (z0 + (z1 - z0) * prog) * extra_scale
    scale *= 1 + 0.10 * ease(hit(t, KICKS, 0.22)) if t >= DROP else 1  # soco no bumbo
    sh = hit(t, SNARES, 0.16)
    dx, dy = (rng.uniform(-1, 1, 2) * 26 * sh) if sh > 0 else (0, 0)
    if p.get("vibrar"):
        dx += rng.uniform(-4, 4); dy += rng.uniform(-4, 4)
    out = warp(img, scale, extra_angle, dx, dy).astype(np.float32)
    s = p.get("sobre")
    if s:  # dupla exposição (tela)
        o = warp(src_frame(s["fonte"], s.get("ini", 0) + lt * s.get("vel", 1.0)), 1.05, 0, 0, 0).astype(np.float32)
        a = s.get("alpha", 0.35)
        out = 255 - (255 - out) * (255 - o * a) / 255
    return out


def blur_spin(p, t, ang, sc):
    """giro com desfoque de movimento: média de 3 ângulos."""
    acc = sum(render_plano(p, t, ang + d, sc) for d in (-ang * 0.12, 0, ang * 0.12))
    return acc / 3


# ------------------------------------------------------------ contorno de raio
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=cfg.get("modelo_seg", "models/selfie_multiclass.tflite")),
    output_confidence_masks=True))
noise_small = None


def lightning(frame, t, power):
    global noise_small
    small = cv2.cvtColor(cv2.resize(frame.astype(np.uint8), (384, 683)), cv2.COLOR_BGR2RGB)
    res = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(small)))
    person = 1 - np.clip(np.squeeze(res.confidence_masks[0].numpy_view()), 0, 1)
    m = (person > 0.5).astype(np.uint8) * 255
    m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)
    m = cv2.GaussianBlur(m, (9, 9), 0)
    _, m = cv2.threshold(m, 127, 255, cv2.THRESH_BINARY)
    edge = cv2.dilate(m, np.ones((7, 7), np.uint8)) - m
    # deforma a borda com ruído que muda a cada quadro (efeito elétrico)
    if noise_small is None or int(t * FPS) % 2 == 0:
        noise_small = rng.standard_normal((2, 48, 27)).astype(np.float32)
    nx = cv2.resize(noise_small[0], (W, H), interpolation=cv2.INTER_CUBIC) * 9
    ny = cv2.resize(noise_small[1], (W, H), interpolation=cv2.INTER_CUBIC) * 9
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    edge = cv2.remap(edge, gx + nx, gy + ny, cv2.INTER_LINEAR)
    # faíscas: buracos aleatórios para a linha parecer descarga, não contorno liso
    mask_break = (cv2.resize(rng.random((96, 54)).astype(np.float32), (W, H),
                             interpolation=cv2.INTER_NEAREST) > 0.18).astype(np.float32)
    e = edge.astype(np.float32) / 255 * mask_break
    flick = 0.65 + 0.35 * rng.random()
    I = power * flick * (1 + 0.8 * hit(t, KICKS, 0.25))
    glow = cv2.GaussianBlur(e, (0, 0), 18) * 4.5 + cv2.GaussianBlur(e, (0, 0), 5) * 1.8
    color = np.array([255, 150, 40], np.float32)  # BGR: azul elétrico
    frame = frame + glow[..., None] * color * I + e[..., None] * 255 * 0.9 * I  # núcleo branco
    return frame


# ------------------------------------------------------------ render
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                        "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "fast",
                        "-pix_fmt", "yuv420p", "video_mudo.mp4"], stdin=subprocess.PIPE)
nfr = int(TOTAL * FPS)
for n in range(nfr):
    t = n / FPS
    p = plano_at(t)
    i = planos.index(p)
    nxt = planos[i + 1] if i + 1 < len(planos) else None
    TR_OUT, TR_IN = 0.12, 0.2
    if nxt and nxt.get("transicao") == "giro" and p["t1"] - t < TR_OUT:
        q = 1 - (p["t1"] - t) / TR_OUT
        fr = blur_spin(p, t, 70 * q ** 2, 1 + 0.35 * q)
    elif p.get("transicao") == "giro" and t - p["t0"] < TR_IN:
        q = (t - p["t0"]) / TR_IN
        fr = blur_spin(p, t, -70 * (1 - ease(q)), 1 + 0.35 * (1 - ease(q)))
    elif p.get("transicao") == "zoom" and t - p["t0"] < TR_IN:
        q = ease((t - p["t0"]) / TR_IN)
        fr = sum(render_plano(p, t, 0, (1.7 - 0.7 * q) * k) for k in (0.96, 1.0, 1.04)) / 3
    else:
        fr = render_plano(p, t)
    # escurece a intro e "acende" no drop
    if t < DROP:
        fr *= 0.55 + 0.35 * (t / DROP) ** 2
    if p.get("raio", 0) > 0:
        fr = lightning(fr, t, p["raio"])
    # separação RGB na caixa
    rs = hit(t, SNARES, 0.12)
    if rs > 0 or (p.get("vibrar") and n % 3 == 0):
        dx = int(16 * rs) + (4 if p.get("vibrar") else 0)
        fr[..., 0] = np.roll(fr[..., 0], dx, axis=1)
        fr[..., 2] = np.roll(fr[..., 2], -dx, axis=1)
    # flash: drop, golpe final e transições marcadas
    fl = max(hit(t, [DROP, FIM], 0.25), hit(t, [c for c, pp in zip(CUTS, planos[1:])
                                                if pp.get("transicao") in ("flash", "giro")], 0.12) * 0.6)
    if fl > 0:
        fr = fr + (255 - fr) * fl * 0.85
    enc.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
    if n % 60 == 0:
        print(f"{n}/{nfr}", flush=True)
enc.stdin.close(); enc.wait()

# ------------------------------------------------------------ cor, grão, áudio, esmaecer
grade = ("curves=r='0/0.02 0.5/0.53 1/0.97':g='0/0.02 0.5/0.49 1/0.94':b='0/0.06 0.5/0.47 1/0.88',"
         "eq=contrast=1.14:saturation=1.08,vignette=angle=PI/7,noise=alls=6:allf=t")
fade = cfg.get("esmaecer", 1.0)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "video_mudo.mp4", "-i", "trilha.wav", "-filter_complex",
                f"[0:v]{grade},fade=t=out:st={TOTAL - fade:.2f}:d={fade:.2f}[v];"
                f"[1:a]loudnorm=I=-11:TP=-1:LRA=9,afade=t=out:st={TOTAL - fade:.2f}:d={fade:.2f}[a]",
                "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "19", "-maxrate", "10M",
                "-bufsize", "20M", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                "-shortest", "-movflags", "+faststart", cfg["saida"]], check=True)
print("PRONTO", cfg["saida"], f"{TOTAL:.1f}s")
