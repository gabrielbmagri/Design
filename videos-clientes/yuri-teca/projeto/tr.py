import sys,json
from faster_whisper import WhisperModel
m=WhisperModel('large-v3',device='cpu',compute_type='int8',cpu_threads=4)
import soundfile as sf
aud,_=sf.read(sys.argv[1],dtype='float32')
segs,info=m.transcribe(aud,language='pt',word_timestamps=True,vad_filter=False,beam_size=5)
out=[]
for s in segs:
    print(f'[{s.start:.2f}-{s.end:.2f}] {s.text}',flush=True)
    for w in s.words: out.append({'w':w.word.strip(),'s':round(w.start,3),'e':round(w.end,3),'p':round(w.probability,2)})
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False)
