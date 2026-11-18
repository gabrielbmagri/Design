#!/usr/bin/env python3
"""Editor de reels no estilo do Gabriel.

Uso:
  python3 editar_reels.py config.json

O config.json (ver exemplo em projetos/) define: vídeo, transcrição palavra a palavra
(words.json do transcrever.py), velocidade, correções de texto, palavras-chave de
fundo, card do Instagram e saída. Tempos sempre no tempo do vídeo ORIGINAL.

Etapas:
 1. Cortes: tira o vazio do início/fim e as pausas; trechos longos sem fala viram
    um "acelerado" (ex.: abrindo o recebido).
 2. Base: corta, acelera ~1.08x, corrige cor (contraste, saturação, nitidez) e áudio.
 3. Composição quadro a quadro: zoom in/out, palavras-chave e card ATRÁS das pessoas
    (recorte por segmentação), legenda palavra a palavra por cima, flash nos cortes.
"""
import json, math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
cfg = json.load(open(sys.argv[1]))
os.chdir(os.path.dirname(os.path.abspath(sys.argv[1])))
STY = {  # paleta neutra padrão (pode ser trocada no config em "estilo")
    "texto": "#FFFFFF", "destaque_txt": "#F4EEE6", "destaque_bg": "#2E2A27",
    "fundo_palavra": "#7A6652", "fundo_alpha": 0.62, "acento": "#5E4E40",
    "fonte_legenda": "fonts/Montserrat[wght].ttf", "peso_legenda": 800,
    "fonte_fundo": "fonts/PlayfairDisplay-Italic[wght].ttf", "peso_fundo": 700,
    **cfg.get("estilo", {}),
}
SPEED = cfg.get("velocidade", 1.08)


def font(path, size, weight):
    f = ImageFont.truetype(path, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ---------------------------------------------------------------- 1. cortes
words = json.load(open(cfg["palavras"]))["words"]
for w in words:
    for a, b in cfg.get("correcoes", {}).items():
        w["text"] = w["text"].replace(a, b)
GAP, PAD, VIS_GAP = cfg.get("pausa_max", 0.45), 0.13, cfg.get("silencio_visual", 4.0)
segs = []  # (ini, fim, velocidade, tipo)
cur = [max(words[0]["start"] - 0.2, 0), words[0]["end"]]
for a, b in zip(words, words[1:]):
    gap = b["start"] - a["end"]
    if gap > GAP:
        segs.append([cur[0], a["end"] + PAD, SPEED, "fala"])
        if gap > VIS_GAP:  # muito tempo sem fala: mostra acelerado (ação visual)
            v0, v1 = a["end"] + PAD, b["start"] - PAD
            segs.append([v0, v1, max((v1 - v0) / cfg.get("acelerado_dur", 4.5), 2.0), "visual"])
        cur = [b["start"] - PAD, b["end"]]
    else:
        cur[1] = b["end"]
segs.append([cur[0], cur[1] + 0.35, SPEED, "fala"])
out = 0.0
for s in segs:
    s.append(out)
    out += (s[1] - s[0]) / s[2]
TOTAL = out


def tmap(t):
    for s0, s1, sp, _, o in segs:
        if t <= s1:
            return o + max(t - s0, 0) / sp
    return TOTAL


print(f"{len(segs)} trechos, {TOTAL:.1f}s finais")

# ---------------------------------------------------------------- 2. base
base = "base.mp4"
if not os.path.exists(base) or cfg.get("refazer_base"):
    # um trecho por vez (vídeo de celular em HEVC 4K estoura a memória se for tudo junto)
    grade = cfg.get("cor", "eq=contrast=1.08:saturation=1.12:gamma=0.97:brightness=0.01,"
                    "colorbalance=rm=0.02:bm=-0.02,unsharp=5:5:0.55")
    os.makedirs("trechos", exist_ok=True)
    lst = []
    for i, (s0, s1, sp, kind, _) in enumerate(segs):
        at, r = [], sp
        while r > 2.0:
            at.append("atempo=2.0"); r /= 2.0
        at.append(f"atempo={r:.4f}")
        vol = ",volume=0.15" if kind == "visual" else ""
        f = f"trechos/t{i:02d}.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s0:.3f}", "-t", f"{s1 - s0:.3f}",
                        "-i", cfg["video"], "-map", "0:v:0", "-map", "0:a:0",
                        "-vf", f"setpts=PTS/{sp:.4f},fps={FPS},scale={W}:{H}:force_original_aspect_ratio="
                               f"increase,crop={W}:{H},{grade}",
                        "-af", ",".join(at) + vol, "-c:v", "libx264", "-crf", "16", "-preset", "fast",
                        "-threads", "2", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", "192k", f],
                       check=True)
        lst.append(f"file '{os.path.abspath(f)}'")
    open("trechos/lista.txt", "w").write("\n".join(lst))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "trechos/lista.txt",
                    "-c:v", "copy", "-af", "highpass=f=80,loudnorm=I=-14:TP=-1.5:LRA=11",
                    "-c:a", "aac", "-b:a", "192k", base], check=True)

# ---------------------------------------------------------------- 3. composição
# legendas: blocos de até 3 palavras, quebra em pontuação
ow = [dict(w, s=tmap(w["start"]), e=tmap(w["end"])) for w in words]
chunks, cur = [], []
for w in ow:
    cur.append(w)
    if len(cur) == cfg.get("palavras_por_bloco", 3) or w["text"][-1:] in ",.!?":
        chunks.append(cur); cur = []
if cur:
    chunks.append(cur)
for i, c in enumerate(chunks):
    c_end = chunks[i + 1][0]["s"] if i + 1 < len(chunks) else c[-1]["e"] + 0.5
    for w in c:
        w["c_start"], w["c_end"] = c[0]["s"], min(c_end, c[-1]["e"] + 0.6)

F_CAP = font(STY["fonte_legenda"], 74, STY["peso_legenda"])
F_BG = font(STY["fonte_fundo"], 150, STY["peso_fundo"])
F_BG_S = font(STY["fonte_legenda"], 44, 600)
kws = [dict(k, s=tmap(k["t"]), e=tmap(k["t"]) + k.get("dur", 2.6)) for k in cfg.get("palavras_chave", [])]
cards = []
for c in cfg.get("cards", []):
    img = Image.open(c["imagem"]).convert("RGBA")
    sc = c.get("largura", 760) / img.width
    img = img.resize((int(img.width * sc), int(img.height * sc)), Image.LANCZOS)
    cards.append(dict(c, img=img, s=tmap(c["t"][0]), e=tmap(c["t"][1])))
cuts = [o for *_, o in segs[1:]]


def ease(x):
    x = min(max(x, 0), 1)
    return 1 - (1 - x) ** 3


def zoom_at(t):
    # cada trecho alterna: "soco" de zoom out (1.14->1.0) ou empurrão lento in (1.0->1.08)
    for i, (s0, s1, sp, kind, o) in enumerate(segs):
        d = (s1 - s0) / sp
        if t < o + d or i == len(segs) - 1:
            x = (t - o) / max(d, 0.01)
            if kind == "visual":
                return 1.0 + 0.10 * x
            if i % 2 == 0:
                return 1.14 - 0.14 * ease((t - o) / 0.45)
            return 1.0 + 0.08 * x
    return 1.0


def draw_text_layer(t):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    col = hexrgb(STY["fundo_palavra"])
    for k in kws:
        if k["s"] <= t <= k["e"]:
            a = ease((t - k["s"]) / 0.35) * (1 - ease((t - k["e"] + 0.35) / 0.35))
            y = k.get("y", 330) - 40 * (1 - ease((t - k["s"]) / 0.5))
            lines = k["text"].split("\n")
            f = F_BG
            widest = max(d.textlength(ln, font=f) for ln in lines)
            if widest > W - 90:  # encolhe para caber na largura
                f = font(STY["fonte_fundo"], int(F_BG.size * (W - 90) / widest), STY["peso_fundo"])
            for j, ln in enumerate(lines):
                tw = d.textlength(ln, font=f)
                d.text(((W - tw) / 2, y + j * f.size * 1.05), ln, font=f,
                       fill=col + (int(255 * STY["fundo_alpha"] * a),))
            if k.get("sub"):
                tw = d.textlength(k["sub"], font=F_BG_S)
                d.text(((W - tw) / 2, y + len(lines) * f.size * 1.05 + 10), k["sub"], font=F_BG_S,
                       fill=hexrgb(STY["acento"]) + (int(255 * a),))
    for c in cards:
        if c["s"] <= t <= c["e"]:
            a = ease((t - c["s"]) / 0.4) * (1 - ease((t - c["e"] + 0.4) / 0.4))
            img = c["img"].copy()
            img.putalpha(img.getchannel("A").point(lambda v: int(v * c.get("alpha", 0.78) * a)))
            sc = 0.9 + 0.1 * ease((t - c["s"]) / 0.5)
            im2 = img.resize((int(img.width * sc), int(img.height * sc)), Image.LANCZOS)
            layer.alpha_composite(im2, ((W - im2.width) // 2, int(c.get("y", 300))))
    return layer


def draw_caption(img, t):
    act = [w for w in ow if w["c_start"] <= t < w["c_end"]]
    if not act:
        return
    d = ImageDraw.Draw(img)
    words_ = [w["text"].upper().strip(",.") for w in act]
    sp = 22
    widths = [d.textlength(x, font=F_CAP) for x in words_]
    total = sum(widths) + sp * (len(words_) - 1)
    pop = 0.86 + 0.14 * ease((t - act[0]["c_start"]) / 0.18)
    y = int(cfg.get("legenda_y", 1290))
    x = (W - total) / 2
    for w, txt, tw in zip(act, words_, widths):
        on = w["s"] <= t < max(w["e"], w["s"] + 0.12)
        if on:
            pad = 16
            d.rounded_rectangle([x - pad, y - 8, x + tw + pad, y + F_CAP.size + 14], radius=18,
                                fill=hexrgb(STY["destaque_bg"]) + (225,))
        fill = hexrgb(STY["destaque_txt"] if on else STY["texto"])
        d.text((x, y), txt, font=F_CAP, fill=fill, stroke_width=0 if on else 5,
               stroke_fill=(30, 26, 23))
        x += tw + sp
    _ = pop


# segmentação de pessoas (para colocar palavras/cards ATRÁS delas)
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=cfg.get("modelo_seg", "models/selfie_multiclass.tflite")),
    output_confidence_masks=True))

dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", base, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                        "-r", str(FPS), "-i", "-", "-i", base, "-map", "0:v", "-map", "1:a", "-c:v", "libx264",
                        "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy",
                        "-movflags", "+faststart", cfg["saida"]], stdin=subprocess.PIPE)
n = 0
prev_mask = None
while True:
    raw = dec.stdout.read(W * H * 3)
    if len(raw) < W * H * 3:
        break
    t = n / FPS
    fr = Image.frombuffer("RGB", (W, H), raw)
    z = zoom_at(t)
    if z > 1.001:
        cw, ch = W / z, H / z
        box = ((W - cw) / 2, (H - ch) * 0.42, (W + cw) / 2, (H - ch) * 0.42 + ch)
        fr = fr.resize((W, H), Image.BICUBIC, box=box)
    layer = draw_text_layer(t)
    if layer.getbbox():
        small = np.asarray(fr.resize((384, 683)))
        res = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(small)))
        cm = res.confidence_masks
        bgm = cm[0].numpy_view() if len(cm) > 1 else 1 - cm[0].numpy_view()
        person = 1 - np.clip(np.squeeze(bgm), 0, 1)
        if prev_mask is not None and prev_mask.shape == person.shape:
            person = 0.6 * person + 0.4 * prev_mask  # suaviza tremedeira entre quadros
        prev_mask = person
        m = Image.fromarray((person * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)
        m = m.filter(ImageFilter.GaussianBlur(3))
        la = np.asarray(layer).astype(np.float32)
        a = la[..., 3:4] / 255 * (1 - np.asarray(m, np.float32)[..., None] / 255)
        f = np.asarray(fr).astype(np.float32)
        fr = Image.fromarray((f * (1 - a) + la[..., :3] * a).astype(np.uint8))
    else:
        prev_mask = None
    fr = fr.convert("RGBA")
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_caption(ov, t)
    # flash suave nos cortes
    for c in cuts:
        if 0 <= t - c < 0.12:
            ov.alpha_composite(Image.new("RGBA", (W, H), (255, 250, 242, int(70 * (1 - (t - c) / 0.12)))))
    # vinheta leve
    fr.alpha_composite(ov)
    enc.stdin.write(fr.convert("RGB").tobytes())
    n += 1
    if n % 300 == 0:
        print(f"{n} quadros ({t:.0f}s/{TOTAL:.0f}s)", flush=True)
enc.stdin.close()
enc.wait()
print("PRONTO", cfg["saida"])
