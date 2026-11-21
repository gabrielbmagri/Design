#!/usr/bin/env python3
"""Trilha phonk/trap com grave pesado (808), gerada em código (sem direitos autorais).

  python3 batida.py saida.wav [bpm=130] [compassos_drop=6] [tempos_intro=4]

Gera também saida.json com a grade: bpm, tempo da batida, drop, bumbos, caixas e fim,
para a edição do vídeo cortar e aplicar efeitos exatamente na batida.
Estrutura: intro filtrada com riser -> DROP (impacto + 808 + bumbo + caixa + chimbal +
cowbell de phonk) -> golpe final com cauda.
"""
import json, sys, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(11)


def add(buf, t, x, g=1.0):
    j = int(t * SR)
    if j >= len(buf) or j + len(x) <= 0:
        return
    e = min(j + len(x), len(buf))
    buf[j:e] += x[: e - j] * g


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t * d)


def lp(x, k):  # passa-baixa simples (média móvel)
    return np.convolve(x, np.ones(k) / k, "same")


def kick():
    n = int(SR * 0.35); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * np.sin(ph) * np.exp(-t * 9)) * 0.9


def b808(freq, dur, glide_to=None):
    n = int(SR * dur); t = np.arange(n) / SR
    f = np.full(n, freq)
    if glide_to:
        f = freq + (glide_to - freq) * np.clip((t - dur * 0.55) / (dur * 0.3), 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * (np.minimum(t / 0.005, 1)) * np.exp(-t * 1.6)
    return np.tanh(2.8 * x) * 0.75  # saturação = grave encorpado


def clap():
    n = int(SR * 0.25); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    nz = nz - lp(nz, 9)  # tira o grave do ruído
    e = sum(np.exp(-np.clip(t - d, 0, None) * 40) * (t >= d) for d in (0, 0.011, 0.022))
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    return (nz * e * 0.5 + body) * 0.8


def hat(open_=False):
    n = int(SR * (0.18 if open_ else 0.045)); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    nz = nz - lp(nz, 3)
    return lp(nz, 2) * np.exp(-t * (14 if open_ else 90)) * 0.22


def cowbell(freq, dur=0.2):
    n = int(SR * dur); t = np.arange(n) / SR
    sq = lambda f: np.sign(np.sin(2 * np.pi * f * t))
    x = (sq(freq) + sq(freq * 1.48)) * 0.5
    x = lp(x, 5) - lp(x, 40)  # passa-faixa grosseiro
    return x * env(n, 0.002, 13) * 0.32


def riser(dur):
    n = int(SR * dur); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    out = np.zeros(n); y = 0.0
    for i in range(n):  # filtro que abre
        a = 0.01 + 0.6 * (t[i] / dur) ** 2
        y += a * (nz[i] - y); out[i] = y
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / dur) ** 2) / SR) * 0.25
    return (out * 0.6 + tone) * (t / dur) ** 1.5


def impact():
    n = int(SR * 1.6); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.2)
    nz = rng.standard_normal(n); nz = nz - lp(nz, 6)
    crash = lp(nz, 2) * np.exp(-t * 3.2) * 0.35
    return np.tanh(1.6 * boom) * 0.9 + crash


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def make(bpm=130, bars=6, intro_beats=4):
    b = 60 / bpm
    drop = intro_beats * b
    end = drop + bars * 4 * b
    total = end + 1.6
    L = np.zeros(int(SR * total)); R = np.zeros_like(L)

    # melodia phonk (Fá# menor) em semínimas/colcheias
    mel = [66, 69, 71, 69, 66, 64, 66, 61]
    roots = [42, 42, 38, 40]  # F#  F#  D  E  (uma por compasso)
    kicks, snares = [], []

    # intro: cowbell abafado + riser
    for i in range(intro_beats * 2):
        cb = lp(cowbell(hz(mel[i % 8])), 25)
        add(L, i * b / 2, cb, 0.6); add(R, i * b / 2, cb, 0.6)
    rs = riser(drop)
    add(L, 0, rs, 0.5); add(R, 0, rs, 0.5)
    imp = impact()
    add(L, drop, imp); add(R, drop, imp)

    for bar in range(bars):
        t0 = drop + bar * 4 * b
        last = bar == bars - 1
        # 808: raiz do compasso, desliza no fim de alguns compassos
        r = roots[bar % 4]
        glide = hz(r + 5) if bar % 2 == 1 else None
        x = b808(hz(r), 4 * b * 0.95, glide)
        add(L, t0, x); add(R, t0, x)
        # bumbo: 1, "e" do 2, (3,5 nos compassos pares)
        for kb in ([0, 1.5] + ([2.5] if bar % 2 == 0 else [3.25])):
            add(L, t0 + kb * b, kick()); add(R, t0 + kb * b, kick()); kicks.append(round(t0 + kb * b, 4))
        # caixa (clap) no 2 e no 4
        for sb in (1, 3):
            c = clap()
            add(L, t0 + sb * b, c, 0.9); add(R, t0 + sb * b, c, 0.8); snares.append(round(t0 + sb * b, 4))
        # chimbal em colcheias, com rajada de 1/32 no fim de compassos ímpares
        for k in range(8):
            h = hat(open_=(k == 7 and bar % 2 == 0))
            add(L, t0 + k * b / 2, h, 0.8); add(R, t0 + k * b / 2, h, 1.0)
        if bar % 2 == 1:
            for k in range(8):
                add(L, t0 + 3.5 * b + k * b / 16, hat(), 0.5 + k * 0.05)
                add(R, t0 + 3.5 * b + k * b / 16, hat(), 0.5 + k * 0.05)
        # cowbell phonk
        for k in range(8):
            if last and k > 3:
                break
            cb = cowbell(hz(mel[(bar * 8 + k) % 8] + (12 if bar >= 2 and k in (2, 6) else 0)))
            pan = 0.35 if k % 2 else 0.65
            add(L, t0 + k * b / 2, cb, 1 - pan); add(R, t0 + k * b / 2, cb, pan)
    # golpe final
    add(L, end, imp); add(R, end, imp)
    add(L, end, b808(hz(30), 1.5)); add(R, end, b808(hz(30), 1.5))
    x = np.stack([L, R], 1)
    x = np.tanh(x * 1.1)
    x /= np.max(np.abs(x)) + 1e-9
    fade = np.ones(len(x)); nf = int(SR * 0.6); fade[-nf:] = np.linspace(1, 0, nf)
    x *= fade[:, None] * 0.95
    grid = {"bpm": bpm, "beat": b, "drop": drop, "fim": end, "total": total,
            "bumbos": kicks, "caixas": snares}
    return x, grid


if __name__ == "__main__":
    out = sys.argv[1]
    bpm = float(sys.argv[2]) if len(sys.argv) > 2 else 130
    bars = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    intro = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    x, grid = make(bpm, bars, intro)
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    json.dump(grid, open(out.rsplit(".", 1)[0] + ".json", "w"), indent=1)
    print("ok", out, f"{grid['total']:.2f}s drop={grid['drop']:.2f}s fim={grid['fim']:.2f}s")
