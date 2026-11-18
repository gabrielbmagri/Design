#!/usr/bin/env python3
"""Editor de reels no estilo do Gabriel.

Uso:  python3 editar_reels.py config.json

O config.json (exemplo em projetos/) define: vídeo, transcrição palavra a palavra
(words.json do transcrever.py), velocidade, correções, palavras-chave de fundo,
cards (holograma), trilha e saída. Tempos sempre no tempo do vídeo ORIGINAL.

Etapas:
 1. Cortes: tira o vazio do início e as pausas; silêncio longo com ação vira acelerado.
 2. Base: corta, acelera ~1.08x, cor de cinema, áudio limpo (um trecho por vez).
 3. Composição: zoom in/out, palavras-chave e card-holograma ATRÁS das pessoas
    (segmentação), legenda de duas fontes, flash nos cortes.
 4. Mixagem: trilha com ducking sob a voz, whoosh na entrada do card, grão de filme,
    esmaecer para preto no fim com a música baixando.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
HERE = os.path.dirname(os.path.abspath(__file__))
cfg = json.load(open(sys.argv[1]))
os.chdir(os.path.dirname(os.path.abspath(sys.argv[1])))
STY = {  # paleta neutra padrão (trocar em "estilo" no config)
    "texto": "#FFFFFF", "texto_serif": "#F4EEE6",
    "fundo_palavra": "#F6EFE4", "fundo_alpha": 0.9, "acento": "#EADFCC",
    "fonte_sans": "fonts/Montserrat[wght].ttf", "fonte_serif": "fonts/PlayfairDisplay-Italic[wght].ttf",
    **cfg.get("estilo", {}),
}
SPEED = cfg.get("velocidade", 1.08)
# cor de cinema: meios-tons quentes, sombras levemente frias e levantadas, altas suaves
COR_CINEMA = ("curves=r='0/0.02 0.25/0.25 0.5/0.55 0.75/0.8 1/0.97':"
              "g='0/0.015 0.25/0.225 0.5/0.49 0.75/0.75 1/0.93':"
              "b='0/0.03 0.25/0.19 0.5/0.41 0.75/0.65 1/0.84',"
              "eq=contrast=1.12:saturation=1.0:gamma=0.97,"
              "vignette=angle=PI/8,unsharp=5:5:0.45")


def font(path, size, weight=None):
    f = ImageFont.truetype(path, size)
    if weight:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def ease(x):
    x = min(max(x, 0), 1)
    return 1 - (1 - x) ** 3


def back(x):  # entrada com leve "passa e volta"
    x = min(max(x, 0), 1)
    c = 1.4
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


# ---------------------------------------------------------------- 1. cortes
words = json.load(open(cfg["palavras"]))["words"]
for w in words:
    for a, b in cfg.get("correcoes", {}).items():
        w["text"] = w["text"].replace(a, b)
GAP, PAD, VIS_GAP = cfg.get("pausa_max", 0.45), 0.13, cfg.get("silencio_visual", 4.0)
segs = []  # [ini, fim, velocidade, tipo, inicio_na_saida]
cur = [max(words[0]["start"] - 0.2, 0), words[0]["end"]]
for a, b in zip(words, words[1:]):
    gap = b["start"] - a["end"]
    if gap > GAP:
        segs.append([cur[0], a["end"] + PAD, SPEED, "fala"])
        if gap > VIS_GAP:
            v0, v1 = a["end"] + PAD, b["start"] - PAD
            segs.append([v0, v1, max((v1 - v0) / cfg.get("acelerado_dur", 4.5), 2.0), "visual"])
        cur = [b["start"] - PAD, b["end"]]
    else:
        cur[1] = b["end"]
segs.append([cur[0], cur[1] + cfg.get("cauda", 1.6), SPEED, "fala"])  # cauda p/ o esmaecer
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


print(f"{len(segs)} trechos, {TOTAL:.1f}s finais", flush=True)

# ---------------------------------------------------------------- 2. base
base = "base.mp4"
if not os.path.exists(base) or cfg.get("refazer_base"):
    grade = cfg.get("cor", COR_CINEMA)
    os.makedirs("trechos", exist_ok=True)
    lst = []
    for i, (s0, s1, sp, kind, _) in enumerate(segs):
        at, r = [], sp
        while r > 2.0:
            at.append("atempo=2.0"); r /= 2.0
        at.append(f"atempo={r:.4f}")
        vol = ",volume=0.15" if kind == "visual" else ""
        dd = (s1 - s0) / sp
        vol += f",afade=t=in:d=0.015,afade=t=out:st={max(dd - 0.02, 0):.3f}:d=0.02"
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
                    "-c:v", "copy", "-af", "highpass=f=80,loudnorm=I=-15:TP=-1.5:LRA=11",
                    "-c:a", "aac", "-b:a", "192k", base], check=True)

# ---------------------------------------------------------------- 3. composição
ow = [dict(w, s=tmap(w["start"]), e=tmap(w["end"])) for w in words]
NB = cfg.get("palavras_por_bloco", 5)
STOP = set("a o as os e é de da do das dos em no na nos nas um uma que pra para por com se me te "
           "lá aí já né eu ele ela a gente você vocês mais muito".split())
chunks, cur = [], []
for w in ow:
    cur.append(w)
    if len(cur) == NB or w["text"][-1:] in ",.!?" and len(cur) >= 2:
        chunks.append(cur); cur = []
if cur:
    chunks.append(cur)
for i in range(len(chunks) - 1):  # palavras fracas no fim do bloco passam para o próximo
    c = chunks[i]
    k = max((j for j, w in enumerate(c) if w["text"].lower().strip(",.!?") not in STOP), default=len(c) - 1)
    if k < len(c) - 1:
        chunks[i + 1] = c[k + 1:] + chunks[i + 1]; chunks[i] = c[:k + 1]
chunks = [c for c in chunks if c]
for i, c in enumerate(chunks):
    nxt = chunks[i + 1][0]["s"] if i + 1 < len(chunks) else c[-1]["e"] + 0.6
    end = min(nxt, c[-1]["e"] + 0.7)
    # palavra de destaque (serifa itálica): a mais "forte" do bloco
    star = c[-1]
    for w in c:
        w["c_start"], w["c_end"], w["star"], w["chunk"] = c[0]["s"], end, w is star, i

F_SANS = font(STY["fonte_sans"], 62, 700)
F_SERIF = font(STY["fonte_serif"], 128, 500)
F_BG = font(STY["fonte_serif"], 150, 700)
F_BG_S = font(STY["fonte_sans"], 40, 600)
kws = [dict(k, s=tmap(k["t"]), e=tmap(k["t"]) + k.get("dur", 2.6)) for k in cfg.get("palavras_chave", [])]


def holo_card(img, glow=True):
    """Card com cara de holograma: vidro, brilho, linhas de varredura, perspectiva."""
    w, h = img.size
    pad = 40
    can = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    can.alpha_composite(img, (pad, pad))
    if glow:
        g = can.copy().filter(ImageFilter.GaussianBlur(18))
        gl = Image.new("RGBA", can.size, (255, 244, 228, 0))
        gl.putalpha(g.getchannel("A").point(lambda v: int(v * 0.55)))
        can = Image.alpha_composite(gl, can)
    sl = Image.new("RGBA", can.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(sl)
    for y in range(0, can.height, 6):
        d.line([(0, y), (can.width, y)], fill=(255, 255, 255, 16))
    sl.putalpha(Image.fromarray(np.minimum(np.asarray(sl.getchannel("A")),
                                           np.asarray(can.getchannel("A")))))
    can = Image.alpha_composite(can, sl)
    # perspectiva: inclinado como painel flutuando (lado direito mais "longe")
    cw, ch = can.size
    sk = 0.07
    src = [(0, 0), (cw, 0), (cw, ch), (0, ch)]
    dst = [(0, 0), (cw, ch * sk), (cw, ch * (1 - sk * 0.6)), (0, ch)]
    A = []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); A.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    B = [c for p in src for c in p]
    coef = np.linalg.solve(np.array(A, float), np.array(B, float))
    return can.transform((cw, ch), Image.PERSPECTIVE, coef, Image.BICUBIC)


cards = []
for c in cfg.get("cards", []):
    img = Image.open(c["imagem"]).convert("RGBA")
    sc = c.get("largura", 980) / img.width
    img = img.resize((int(img.width * sc), int(img.height * sc)), Image.LANCZOS)
    if c.get("holograma", True):
        img = holo_card(img)
    cards.append(dict(c, img=img, s=tmap(c["t"][0]), e=tmap(c["t"][1])))
cuts = [o for *_, o in segs[1:]]


def zoom_at(t):
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


def kw_layout(k, d):
    lines = k["text"].split("\n")
    f = F_BG
    widest = max(d.textlength(ln, font=f) for ln in lines)
    if widest > W - 90:
        f = font(STY["fonte_serif"], int(F_BG.size * (W - 90) / widest), 700)
    chars, i = [], 0
    nchar = sum(len(ln) for ln in lines)
    step = min(0.05, 0.65 / max(nchar, 1))
    for j, ln in enumerate(lines):
        x0 = (W - d.textlength(ln, font=f)) / 2
        for ci, ch in enumerate(ln):
            if ch.strip():
                chars.append((ch, x0 + d.textlength(ln[:ci], font=f), j, k["s"] + i * step))
            i += 1
    return f, lines, chars


def draw_back_layer(t):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    sd = ImageDraw.Draw(shadow)
    col = hexrgb(STY["fundo_palavra"])
    any_kw = False
    for k in kws:
        if k["s"] <= t <= k["e"]:
            any_kw = True
            out_a = 1 - ease((t - k["e"] + 0.35) / 0.35)
            y = k.get("y", cfg.get("palavras_y", 150))
            if "_lay" not in k:
                k["_lay"] = kw_layout(k, d)
            f, lines, chars = k["_lay"]
            for ch, x, j, tc in chars:  # cada letra sobe de baixo para cima
                p = ease((t - tc) / 0.22)
                if p <= 0:
                    continue
                yy = y + j * f.size * 1.02 + 34 * (1 - p)
                al = p * out_a
                sd.text((x + 3, yy + 5), ch, font=f, fill=(25, 18, 12, int(150 * al)))
                d.text((x, yy), ch, font=f, fill=col + (int(255 * STY["fundo_alpha"] * al),))
            if k.get("sub"):
                last = chars[-1][3] if chars else k["s"]
                p = ease((t - last - 0.1) / 0.3) * out_a
                tw = d.textlength(k["sub"], font=F_BG_S)
                yy = y + len(lines) * f.size * 1.02 + 6 + 14 * (1 - p)
                sd.text(((W - tw) / 2 + 2, yy + 3), k["sub"], font=F_BG_S, fill=(25, 18, 12, int(140 * p)))
                d.text(((W - tw) / 2, yy), k["sub"], font=F_BG_S, fill=hexrgb(STY["acento"]) + (int(240 * p),))
    if any_kw:
        layer = Image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(7)), layer)
        d = ImageDraw.Draw(layer)
    for c in cards:
        if c["s"] <= t <= c["e"]:
            p = (t - c["s"]) / c.get("subida", 0.7)
            a = ease(p * 1.6) * (1 - ease((t - c["e"] + 0.45) / 0.45))
            flick = 1.0 if p > 1 else (0.75 + 0.25 * np.sin(p * 40))  # tremulado de holograma
            img = c["img"]
            sc = c.get("escala_final", 1.0) * (0.92 + 0.08 * ease(p))
            im2 = img.resize((int(img.width * sc), int(img.height * sc)), Image.BILINEAR)
            im2.putalpha(im2.getchannel("A").point(lambda v: int(v * c.get("alpha", 0.72) * a * flick)))
            y_final = c.get("y", 230)
            y = y_final + (H - y_final) * (1 - back(p))  # surge de baixo
            layer.alpha_composite(im2, ((W - im2.width) // 2, int(y)))
    return layer


def draw_caption(ov, t):
    act = [w for w in ow if w["c_start"] <= t < w["c_end"]]
    if not act:
        return
    txtl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(txtl)
    star = next((w for w in act if w["star"]), None)
    line1 = [w for w in act if not w["star"]]
    y0 = int(cfg.get("legenda_y", 1180))
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sp = 16

    def word_alpha(w):
        return ease((t - w["s"] + 0.05) / 0.16)  # aparece quando é falada

    # linha 1: sans bold, caixa normal
    txts = [w["text"].strip(",.") for w in line1]
    widths = [d.textlength(x, font=F_SANS) for x in txts]
    total = sum(widths) + sp * max(len(txts) - 1, 0)
    if total > W - 120:  # quebra rara: reduz
        f1 = font(STY["fonte_sans"], int(F_SANS.size * (W - 120) / total), 700)
        widths = [d.textlength(x, font=f1) for x in txts]; total = sum(widths) + sp * (len(txts) - 1)
    else:
        f1 = F_SANS
    x = (W - total) / 2
    for w, txt, tw in zip(line1, txts, widths):
        a = word_alpha(w)
        if a > 0:
            dy = 10 * (1 - a)
            sd.text((x + 2, y0 + 4 + dy), txt, font=f1, fill=(0, 0, 0, int(150 * a)))
            d.text((x, y0 + dy), txt, font=f1, fill=hexrgb(STY["texto"]) + (int(255 * a),))
        x += tw + sp
    # linha 2: palavra-chave em serifa itálica grande
    if star:
        a = word_alpha(star)
        if a > 0:
            txt = star["text"].strip(",.!?").lower()
            f2 = F_SERIF
            tw = d.textlength(txt, font=f2)
            if tw > W - 100:
                f2 = font(STY["fonte_serif"], int(F_SERIF.size * (W - 100) / tw), 500)
                tw = d.textlength(txt, font=f2)
            sc_dy = 18 * (1 - a)
            yy = y0 + (f1.size * 0.62 if line1 else 0) + sc_dy
            sd.text(((W - tw) / 2 + 3, yy + 5), txt, font=f2, fill=(0, 0, 0, int(140 * a)))
            d.text(((W - tw) / 2, yy), txt, font=f2, fill=hexrgb(STY["texto_serif"]) + (int(255 * a),))
    ov.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(6)))
    ov.alpha_composite(txtl)


import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=cfg.get("modelo_seg", "models/selfie_multiclass.tflite")),
    output_confidence_masks=True))

comp = "composicao.mp4"
dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", base, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                        "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "15", "-preset", "medium",
                        "-pix_fmt", "yuv420p", comp], stdin=subprocess.PIPE)
n, prev_mask = 0, None
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
    layer = draw_back_layer(t)
    if layer.getbbox():
        small = np.asarray(fr.resize((384, 683)))
        res = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(small)))
        bgm = np.squeeze(res.confidence_masks[0].numpy_view())
        person = 1 - np.clip(bgm, 0, 1)
        if prev_mask is not None:
            person = 0.6 * person + 0.4 * prev_mask
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
    for c in cuts:
        if 0 <= t - c < 0.12:
            ov.alpha_composite(Image.new("RGBA", (W, H), (255, 246, 232, int(60 * (1 - (t - c) / 0.12)))))
    fr.alpha_composite(ov)
    enc.stdin.write(fr.convert("RGB").tobytes())
    n += 1
    if n % 300 == 0:
        print(f"{n} quadros ({t:.0f}s/{TOTAL:.0f}s)", flush=True)
enc.stdin.close(); enc.wait()

# ---------------------------------------------------------------- 4. mixagem final
mus = cfg.get("musica", {"clima": "aconchego", "volume": 0.22})
ins = ["-i", comp, "-i", base]
fc = ["[1:a]aresample=48000,asplit=2[voz][voz_sc]"]
mix = ["[voz]"]
k = 2
if mus:
    trilha = mus.get("arquivo") or "trilha.wav"
    if not mus.get("arquivo"):
        subprocess.run([sys.executable, "-I", os.path.join(HERE, "musica.py"), "trilha", trilha,
                        f"{TOTAL + 2:.1f}", mus.get("clima", "aconchego")], check=True)
    ins += ["-i", trilha]
    fc.append(f"[{k}:a]aresample=48000,volume={mus.get('volume', 0.22)},"
              f"lowpass=f=9000,aecho=0.8:0.6:60:0.25[m0]")
    fc.append("[m0][voz_sc]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[mus]")
    mix.append("[mus]"); k += 1
sys.path.insert(0, HERE)
import musica  # noqa: E402
_d = ImageDraw.Draw(Image.new("RGBA", (8, 8)))
sfx = np.zeros((int(musica.SR * (TOTAL + 2)), 2))
rng_s = np.random.default_rng(5)
for c in cards:
    w_ = musica.whoosh() * 0.55
    musica.add(sfx[:, 0], int(c["s"] * musica.SR), w_); musica.add(sfx[:, 1], int(c["s"] * musica.SR), w_)
for kw in kws:
    if cfg.get("som_digitacao", True):
        for ch, x, j, tc in kw_layout(kw, _d)[2]:
            tk = musica.tecla(rng_s) * cfg.get("volume_digitacao", 0.32)
            pan = 0.3 + 0.4 * x / W
            musica.add(sfx[:, 0], int(tc * musica.SR), tk * (1 - pan)); musica.add(sfx[:, 1], int(tc * musica.SR), tk * pan)
if np.abs(sfx).max() > 0:
    musica.save_raw("efeitos.wav", sfx)
    ins += ["-i", "efeitos.wav"]
    fc.append(f"[{k}:a]aresample=48000[sfx]")
    mix.append("[sfx]"); k += 1
FADE = cfg.get("esmaecer", 1.8)
fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0:duration=first,"
          f"afade=t=out:st={TOTAL - FADE - 0.6:.2f}:d={FADE + 0.6:.2f},alimiter=limit=0.95[a]")
grao = cfg.get("grao", 5)
fc.append(f"[0:v]noise=alls={grao}:allf=t,fade=t=out:st={TOTAL - FADE:.2f}:d={FADE:.2f}[v]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "[v]",
                "-map", "[a]", "-c:v", "libx264", "-crf", "20", "-maxrate", "7M", "-bufsize", "14M", "-preset", "fast", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL:.3f}", "-movflags", "+faststart", cfg["saida"]],
               check=True)
print("PRONTO", cfg["saida"], flush=True)
