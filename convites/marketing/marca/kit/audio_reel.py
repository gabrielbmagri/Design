import json,subprocess,numpy as np
SR=44100
import sys
EVF=sys.argv[1] if len(sys.argv)>1 else 'events.json'; OUT=sys.argv[2] if len(sys.argv)>2 else 'audio.wav'
ev=json.load(open(EVF)); TOTAL=ev['total']
def dec(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-vn','-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2)
m=dec('music/Digital%20Lemonade.mp3')
# fase da batida: dobra a energia de ataque no período de 1 batida e acha o melhor começo
mono=m.mean(1); hop=441; n=len(mono)//hop
e=np.sqrt((mono[:n*hop].reshape(n,hop)**2).mean(1)); d=np.maximum(np.diff(e),0)
BPM=120.3; per=60/BPM; fr=SR/hop
best=(0,0)
for ph in np.arange(0,per,0.01):
    idx=(np.arange(int(ph*fr),min(len(d),int(30*fr)),per*fr)).astype(int)
    sc=d[idx].sum()
    if sc>best[0]: best=(sc,ph)
ph=best[1]; print('fase da batida (s):',round(ph,2))
start=int(ph*SR)
bed=m[start:start+int((TOTAL+1)*SR)].copy()
L=int(TOTAL*SR)
bed=bed[:L]
fi=int(.20*SR); bed[:fi]*=np.linspace(0,1,fi)[:,None]
fo=int(2.0*SR); bed[-fo:]*=np.linspace(1,0,fo)[:,None]
rms=np.sqrt((bed**2).mean()); bed*=0.17/rms   # nível-base da trilha
rng=np.random.default_rng(3)
def env(n,a,r): 
    t=np.arange(n)/SR; return np.minimum(t/max(a,1e-4),1)*np.exp(-t/r)
def lp_sweep(x,f0,f1):
    out=np.zeros_like(x); y=0; n=len(x)
    for i in range(n):
        f=f0*(f1/f0)**(i/n); a=1-np.exp(-2*np.pi*f/SR); y+=a*(x[i]-y); out[i]=y
    return out
def whoosh(dur=.5,f0=300,f1=7000,g=.55):
    n=int(dur*SR); x=rng.standard_normal(n); y=lp_sweep(x,f0,f1)
    t=np.arange(n)/SR; e_=np.sin(np.pi*np.clip(t/dur,0,1))**1.6; y*=e_; y/=np.abs(y).max()+1e-9; return g*y
def pop(g=.5):
    n=int(.16*SR); t=np.arange(n)/SR; f=900*np.exp(-t*14)+250
    y=np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.002,.045); return g*y
def tick(g=.28):
    n=int(.04*SR); t=np.arange(n)/SR; return g*np.sin(2*np.pi*2600*t)*env(n,.0008,.008)
def key(g=.35):
    n=int(.05*SR); x=rng.standard_normal(n); x=x-np.convolve(x,np.ones(8)/8,'same'); return g*x*env(n,.0005,.007)
def chime(g=.4):
    n=int(.9*SR); t=np.arange(n)/SR
    y=sum(a*np.sin(2*np.pi*f*t) for f,a in [(1318.5,1),(1975.5,.7),(2637,.35)])*env(n,.003,.28); return g*y/2
def buzz(g=.33):
    n=int(.22*SR); t=np.arange(n)/SR; y=np.sign(np.sin(2*np.pi*110*t))*.6+np.sin(2*np.pi*55*t)*.5; return g*y*env(n,.002,.07)
def tap(g=.5):
    n=int(.12*SR); t=np.arange(n)/SR; return g*(np.sin(2*np.pi*(160*np.exp(-t*20)+60)*t*1)*env(n,.001,.03)+.3*key(1)[:n] if False else np.sin(2*np.pi*140*t)*env(n,.001,.03))
S={'whoosh':lambda:whoosh(),'swipe':lambda:whoosh(.32,600,9000,.38),'pop':pop,'tick':tick,'key':key,'chime':chime,'buzz':buzz,'tap':tap}
sfx=np.zeros((L+SR,2),np.float32)
for e_ in ev['events']:
    w=S[e_['type']]().astype(np.float32); i=int(e_['t']*SR); pan=.15*np.sin(e_['t']*3)
    if i+len(w)>len(sfx): continue
    sfx[i:i+len(w),0]+=w*(1-pan); sfx[i:i+len(w),1]+=w*(1+pan)
# batida de grave leve nas viradas de cena
for t0 in ev['t0'][1:]:
    n=int(.35*SR); t=np.arange(n)/SR; k=.55*np.sin(2*np.pi*(90*np.exp(-t*9)+45)*t)*np.exp(-t/.12)
    i=int(t0*SR); sfx[i:i+n,:]+=k[:,None].astype(np.float32)
mix=bed+sfx[:L]*0.9
mix=np.tanh(mix*1.15)/1.15
print('pico',round(float(np.abs(mix).max()),2),'rms',round(float(np.sqrt((mix**2).mean())),3))
raw=(np.clip(mix,-1,1)*32767).astype('<i2').tobytes()
subprocess.run(['ffmpeg','-y','-v','error','-f','s16le','-ar',str(SR),'-ac','2','-i','-',OUT],input=raw)
print(OUT,'ok',round(L/SR,2),'s')
