"""Narração com voz neural (Microsoft Edge, vozes pt-BR) + tempo exato de cada palavra.
Uso: python3 narrar.py roteiro.json saida_prefixo
Gera <prefixo>.wav (44,1 kHz mono) e <prefixo>_tempos.json (linhas, chunks e palavras com início em segundos).
O roteiro usa {{palavra}} para a palavra-chave em destaque; o texto falado é a junção dos chunks.
Rede: usa a CA do proxy do ambiente (/root/.ccr/ca-bundle.crt) quando existir."""
import asyncio, json, os, re, ssl, subprocess, sys, unicodedata
import edge_tts, edge_tts.communicate as ec
CA = '/root/.ccr/ca-bundle.crt'
if os.path.exists(CA): ec._SSL_CTX = ssl.create_default_context(cafile=CA)
R = json.load(open(sys.argv[1])); OUT = sys.argv[2]
norm = lambda w: unicodedata.normalize('NFKD', re.sub(r"[^\wÀ-ÿ']", '', w.lower())).encode('ascii', 'ignore').decode()
clean = lambda s: s.replace('{{', '').replace('}}', '')
texto = ' '.join(clean(c[0]) for l in R['linhas'] for c in l['chunks'])
async def main():
    c = edge_tts.Communicate(texto, R['voz'], rate=R.get('rate', '+0%'), pitch=R.get('pitch', '+0Hz'), boundary='WordBoundary'); words = []
    with open(OUT + '.mp3', 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary': words.append({'w': ch['text'], 't': round(ch['offset'] / 1e7, 3), 'd': round(ch['duration'] / 1e7, 3)})
    return words
words = asyncio.run(main())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', OUT + '.mp3', '-ar', '44100', '-ac', '1', OUT + '.wav'])
# casa as palavras do roteiro com as palavras faladas
seq = [w for w in words if norm(w['w'])]; k = 0; linhas = []
for l in R['linhas']:
    cs = []
    for txt, pos in l['chunks']:
        toks = [t for t in re.findall(r"\{\{|\}\}|[^\s{}]+", txt)]
        ws = []; kw = False
        for t in toks:
            if t == '{{': kw = True; continue
            if t == '}}': kw = False; continue
            if not norm(t): continue
            if k >= len(seq): raise SystemExit(f'palavras acabaram em: {t}')
            if norm(seq[k]['w']) != norm(t): print('AVISO: roteiro', t, '!= falado', seq[k]['w'])
            ws.append({'w': t, 'kw': kw, 't': seq[k]['t'], 'd': seq[k]['d']}); k += 1
        cs.append({'txt': txt, 'pos': pos, 'words': ws, 't': ws[0]['t'], 'end': ws[-1]['t'] + ws[-1]['d']})
    linhas.append({'id': l['id'], 'cena': l['cena'], 'chunks': cs, 't': cs[0]['t'], 'end': cs[-1]['end']})
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT + '.wav'], capture_output=True, text=True).stdout)
json.dump({'voz': R['voz'], 'dur': round(dur, 3), 'linhas': linhas}, open(OUT + '_tempos.json', 'w'), ensure_ascii=False, indent=1)
print('ok', round(dur, 2), 's,', k, 'palavras de', len(seq))
for l in linhas: print(l['id'], round(l['t'], 2), '→', round(l['end'], 2), [c['txt'][:22] + '@' + str(round(c['t'], 2)) for c in l['chunks']])
