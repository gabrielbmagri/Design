import sys, shutil
from gradio_client import Client, handle_file
src, out, prompt, dur = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
c = Client('zerogpu-aoti/wan2-2-fp8da-aoti-faster', verbose=False)
r = c.predict(input_image=handle_file(src), prompt=prompt, steps=6, duration_seconds=dur, seed=11, randomize_seed=False, api_name='/generate_video')
v = r[0]; p = v if isinstance(v, str) else (v.get('video') or v.get('path'))
if isinstance(p, dict): p = p.get('path')
shutil.copy(p, out); print('ok', out)
