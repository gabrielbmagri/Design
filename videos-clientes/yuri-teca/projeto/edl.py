import json,soundfile as sf,numpy as np
a,sr=sf.read('a16.wav'); h=int(.02*sr); n=len(a)//h
r=20*np.log10(np.sqrt((a[:n*h].reshape(n,h)**2).mean(1))+1e-9)
low=r<-28.4; cuts=[(0,0.58),(17.12,17.70),(40.6,len(a)/sr)]
i=0
while i<n:
    if low[i]:
        j=i
        while j<n and low[j]: j+=1
        s,e=i*.02,j*.02
        if e-s>=0.24 and s>0.7 and e<40.5: cuts.append((s+.08,e-.08))
        i=j
    else: i+=1
cuts.sort(); segs=[]; t=0
for s,e in cuts:
    if s>t: segs.append([t,s])
    t=max(t,e)
segs=[[round(x*30)/30,round(y*30)/30] for x,y in segs if y-x>0.1]
tot=sum(y-x for x,y in segs); print(len(segs),'segs',round(tot,2)); print([(round(x,2),round(y,2)) for x,y in segs])
json.dump({'segs':segs,'dur':tot},open('edl.json','w'))
