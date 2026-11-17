import sys, shutil
from gradio_client import Client, handle_file
src, out, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
seed = float(sys.argv[4]) if len(sys.argv) > 4 else 7
c = Client("https://black-forest-labs-flux-1-kontext-dev.hf.space/", verbose=False)
r = c.predict(input_image=handle_file(src), prompt=prompt, seed=seed, randomize_seed=False, guidance_scale=2.5, steps=28, api_name="/infer")
img = r[0] if isinstance(r, (list, tuple)) else r
path = img if isinstance(img, str) else (img.get("path") or img.get("url"))
shutil.copy(path, out); print("SALVO", out)
