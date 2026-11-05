"""Encurta as pausas longas da narração (mantém a voz natural) e reajusta o tempo das palavras.
Uso: python3 compactar.py narr  -> narr_c.wav e narr_c_tempos.json"""
import json, sys, wave, numpy as np
P = sys.argv[1]; T = json.load(open(P + '_tempos.json'))
w = wave.open(P + '.wav'); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16); w.close()
W = [wd for l in T['linhas'] for c in l['chunks'] for wd in c['words']]
MAXG, KEEP = 0.26, 0.20          # pausa acima de 0,26 s vira 0,20 s
cuts = []                         # (início, fim) em segundos a remover
for a, b in zip(W, W[1:]):
    g0 = a['t'] + a['d'] + 0.04; g1 = b['t'] - 0.04; g = g1 - g0
    if g > MAXG - .08: cuts.append((g0 + KEEP / 2, g1 - KEEP / 2 + .08)) if g1 - g0 > KEEP else None
cuts = [(s, e) for s, e in cuts if e > s]
def shift(t): return t - sum(min(e, t) - s for s, e in cuts if t > s)
keep = []; last = 0
for s, e in cuts: keep.append(x[int(last * sr):int(s * sr)]); last = e
keep.append(x[int(last * sr):]); fade = int(.006 * sr)
for i in range(1, len(keep)):
    if len(keep[i]) > fade and len(keep[i-1]) > fade:
        keep[i] = keep[i].astype(np.float32); keep[i][:fade] *= np.linspace(0, 1, fade); keep[i] = keep[i].astype(np.int16)
y = np.concatenate(keep)
o = wave.open(P + '_c.wav', 'wb'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes(y.tobytes()); o.close()
for l in T['linhas']:
    for c in l['chunks']:
        for wd in c['words']: wd['t'] = round(shift(wd['t']), 3)
        c['t'] = c['words'][0]['t']; c['end'] = round(c['words'][-1]['t'] + c['words'][-1]['d'], 3)
    l['t'] = l['chunks'][0]['t']; l['end'] = l['chunks'][-1]['end']
T['dur'] = round(len(y) / sr, 3); json.dump(T, open(P + '_c_tempos.json', 'w'), ensure_ascii=False, indent=1)
print('cortes', len(cuts), 'removido', round(sum(e - s for s, e in cuts), 2), 's; nova duração', T['dur'])
for l in T['linhas']: print(l['id'], round(l['t'], 2), '→', round(l['end'], 2))
