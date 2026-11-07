import sys, shutil
from gradio_client import Client, handle_file
src, out, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
c = Client('black-forest-labs/FLUX.1-Kontext-Dev', verbose=False)
r = c.predict(input_image=handle_file(src), prompt=prompt, seed=7, randomize_seed=False, guidance_scale=2.5, steps=28, api_name='/infer')
p = r[0] if isinstance(r[0], str) else r[0]['path']
shutil.copy(p, out); print('ok', out)
