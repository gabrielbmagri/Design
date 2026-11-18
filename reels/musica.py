#!/usr/bin/env python3
"""Gera trilha de fundo e efeitos sonoros em código (sem direitos autorais).

  python3 musica.py trilha saida.wav <segundos> [clima]   clima: aconchego (padrão)
  python3 musica.py whoosh saida.wav                      sobe + brilho (entrada do card)

"aconchego": ~84 BPM, piano de feltro, pad quente, baixo macio, shaker leve,
progressão I-V-vi-IV em Ré. Calma, grata, doce: fica embaixo da voz sem brigar.
"""
import sys, wave
import numpy as np

SR = 44100


def save(path, x):
    x = np.clip(x / (np.max(np.abs(x)) + 1e-9) * 0.89, -1, 1)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def save_raw(path, x):
    """Salva sem normalizar (efeitos já no volume certo)."""
    x = np.clip(x, -1, 1)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def tecla(rng):
    """Toque de tecla suave (digitação), sem chiado agudo."""
    n = int(SR * 0.045)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    nz = np.convolve(nz, np.ones(6) / 6, "same")  # tira o agudo
    click = nz * np.exp(-t * 160) * 0.9
    thump = np.sin(2 * np.pi * (180 + 60 * rng.random()) * t) * np.exp(-t * 90) * 0.6
    return (click + thump) * (0.75 + 0.25 * rng.random())


def hz(n):  # nota MIDI -> Hz
    return 440 * 2 ** ((n - 69) / 12)


def piano(f, dur, vel=1.0):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 2.2) * (1 - np.exp(-t * 300))
    s = sum(a * np.sin(2 * np.pi * f * k * t * (1 + 0.0007 * k)) for k, a in
            [(1, 1), (2, 0.45), (3, 0.18), (4, 0.08), (5, 0.04)])
    s += 0.3 * np.sin(2 * np.pi * f * 1.003 * t)  # leve desafinado = feltro
    return s * env * vel


def pad(fs, dur):
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(t / 1.2, 1) * np.minimum((dur - t) / 1.0, 1)
    s = 0
    for f in fs:
        for d in (0.997, 1.0, 1.004):
            s = s + np.sin(2 * np.pi * f * d * t) + 0.25 * np.sin(2 * np.pi * 2 * f * d * t)
    return s * np.clip(env, 0, 1) / (len(fs) * 3)


def add(buf, j, x):
    if j >= len(buf):
        return
    e = min(j + len(x), len(buf))
    buf[j:e] += x[:e - j]


def trilha(dur, clima="aconchego"):
    bpm = 84
    beat = 60 / bpm
    bar = beat * 4
    # Ré: D A Bm G   (MIDI raízes 50 45 47 43)
    chords = [(62, 66, 69), (57, 61, 64), (59, 62, 66), (55, 59, 62)]
    roots = [38, 33, 35, 31]
    n = int(SR * (dur + 2))
    L = np.zeros(n); R = np.zeros(n)
    rng = np.random.default_rng(7)
    nbars = int(dur / bar) + 2
    for b in range(nbars):
        ci = b % 4
        t0 = b * bar
        i0 = int(t0 * SR)
        # pad
        p = pad([hz(x - 12) for x in chords[ci]], bar + 0.6) * 0.35
        add(L, i0, p); add(R, i0, p)
        # baixo macio
        tb = np.arange(int(SR * bar)) / SR
        bass = np.sin(2 * np.pi * hz(roots[ci]) * tb) * np.exp(-tb * 0.8) * 0.45
        add(L, i0, bass); add(R, i0, bass)
        # piano: arpejo suave (entra depois de 2 compassos)
        if b >= 2:
            pattern = [0, 1, 2, 1, 0, 2, 1, 2]
            for k, idx in enumerate(pattern):
                f = hz(chords[ci][idx] + (12 if k in (2, 5) else 0))
                pn = piano(f, 1.8, 0.22 + 0.06 * rng.random())
                j = int((t0 + k * beat / 2) * SR) + int(rng.integers(0, 200))
                pan = 0.35 + 0.3 * rng.random()
                add(L, j, pn * (1 - pan)); add(R, j, pn * pan)
        # shaker e kick bem leves (a partir do 4º compasso)
        if b >= 4:
            for k in range(8):
                j = int((t0 + k * beat / 2) * SR)
                ln = int(SR * 0.06)
                nz = rng.standard_normal(ln) * np.exp(-np.arange(ln) / SR * 60)
                nz = np.convolve(nz, np.ones(4) / 4, "same")  # macio
                amp = 0.018 if k % 2 else 0.01
                add(L, j, nz * amp); add(R, j, nz * amp * 0.8)
            for k in (0, 2):
                j = int((t0 + k * beat) * SR)
                tk = np.arange(int(SR * 0.25)) / SR
                kick = np.sin(2 * np.pi * (50 + 60 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 14) * 0.35
                add(L, j, kick); add(R, j, kick)
    x = np.stack([L, R], 1)[: int(SR * dur)]
    fade = np.minimum(np.arange(len(x)) / (SR * 2.5), 1)
    return x * fade[:, None]


def whoosh():
    dur = 1.1
    t = np.arange(int(SR * dur)) / SR
    rng = np.random.default_rng(3)
    nz = rng.standard_normal(len(t))
    # varredura: filtro passa-faixa que sobe (aprox. por filtro de 1 polo variável)
    out = np.zeros_like(nz); y = 0
    for i in range(len(nz)):
        a = 0.02 + 0.5 * (t[i] / dur) ** 2
        y = y + a * (nz[i] - y); out[i] = y
    out = out - np.convolve(out, np.ones(30) / 30, "same")
    env = np.sin(np.pi * np.clip(t / 0.75, 0, 1)) ** 2
    w = out * env * 1.2
    # brilho (chime) ao "pousar"
    tc = t - 0.62
    chime = sum(a * np.sin(2 * np.pi * f * tc) for f, a in [(1318, 1), (1976, 0.5), (2637, 0.3)])
    chime *= np.where(tc > 0, np.exp(-tc * 6), 0) * 0.35
    return w + chime


if __name__ == "__main__":
    kind, path = sys.argv[1], sys.argv[2]
    if kind == "trilha":
        save(path, trilha(float(sys.argv[3]), sys.argv[4] if len(sys.argv) > 4 else "aconchego"))
    else:
        save(path, whoosh())
    print("ok", path)
