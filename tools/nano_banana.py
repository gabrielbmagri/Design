#!/usr/bin/env python3
import argparse, base64, json, os, sys, mimetypes, urllib.request, urllib.error
p = argparse.ArgumentParser()
p.add_argument("prompt")
p.add_argument("-o", "--out", default="imagem.png")
p.add_argument("-m", "--model", default="gemini-3.1-flash-image")
p.add_argument("-a", "--aspect")
p.add_argument("-s", "--size")
p.add_argument("-i", "--input", action="append", default=[])
a = p.parse_args()
key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not key:
    sys.exit("ERRO: GEMINI_API_KEY não definida")
parts = []
for f in a.input:
    mt = mimetypes.guess_type(f)[0] or "image/png"
    parts.append({"inline_data": {"mime_type": mt, "data": base64.b64encode(open(f, "rb").read()).decode()}})
parts.append({"text": a.prompt})
gc = {"responseModalities": ["TEXT", "IMAGE"]}
ic = {}
if a.aspect: ic["aspectRatio"] = a.aspect
if a.size: ic["imageSize"] = a.size
if ic: gc["imageConfig"] = ic
body = json.dumps({"contents": [{"parts": parts}], "generationConfig": gc}).encode()
url = f"https://generativelanguage.googleapis.com/v1beta/models/{a.model}:generateContent"
req = urllib.request.Request(url, data=body, headers={"x-goog-api-key": key, "Content-Type": "application/json"})
try:
    r = json.load(urllib.request.urlopen(req, timeout=300))
except urllib.error.HTTPError as e:
    sys.exit(f"ERRO HTTP {e.code}: {e.read().decode()[:800]}")
except urllib.error.URLError as e:
    sys.exit(f"ERRO DE REDE: {e.reason}")
n = 0
base, ext = os.path.splitext(a.out)
for c in r.get("candidates", []):
    for pt in c.get("content", {}).get("parts", []):
        d = pt.get("inlineData") or pt.get("inline_data")
        if d:
            path = a.out if n == 0 else f"{base}_{n}{ext}"
            open(path, "wb").write(base64.b64decode(d["data"]))
            print("SALVO:", path); n += 1
        elif "text" in pt:
            print("TEXTO:", pt["text"])
if not n:
    sys.exit("ERRO: nenhuma imagem retornada: " + json.dumps(r)[:800])
