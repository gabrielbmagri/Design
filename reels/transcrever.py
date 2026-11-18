import sys, json
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[3] if len(sys.argv)>3 else "medium", device="cpu", compute_type="int8")
import numpy as np, subprocess
audio = np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-f","s16le","-ac","1","-ar","16000","-"],capture_output=True,check=True).stdout, np.int16).astype(np.float32)/32768
segs, info = m.transcribe(audio, language="pt", word_timestamps=True, vad_filter=False)
words = []
for s in segs:
    for w in s.words:
        words.append({"text": w.word.strip(), "start": round(w.start,3), "end": round(w.end,3), "p": round(w.probability,3)})
json.dump({"words": words, "duration": info.duration}, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
print(len(words), "palavras")
