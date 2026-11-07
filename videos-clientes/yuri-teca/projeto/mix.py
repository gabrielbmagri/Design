import json,subprocess,sys,numpy as np
SR=48000; W=sys.argv[1]; MUS=sys.argv[2]
ev=json.load(open(W+'/events.json')); TOTAL=ev['total']; L=int(TOTAL*SR)
def dec(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-vn','-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2).copy()
voice=dec(W+'/work/voz_limpa.wav'); v=np.zeros((L,2),np.float32); v[:min(L,len(voice))]=voice[:L]
m=dec(MUS); 
# começa num trecho calmo: procura janela de 41 s com menor variação nos primeiros 60 s
bed=m[:L].copy()
fi=int(.6*SR); bed[:fi]*=np.linspace(0,1,fi)[:,None]
fo=int(1.6*SR); bed[-fo:]*=np.linspace(1,0,fo)[:,None]
bed*=0.16/(np.sqrt((bed**2).mean())+1e-9)
rng=np.random.default_rng(5)
def env(n,a,r): t=np.arange(n)/SR; return np.minimum(t/max(a,1e-4),1)*np.exp(-t/r)
def lp(x,f0,f1):
    out=np.zeros_like(x); y=0; n=len(x)
    for i in range(n):
        f=f0*(f1/f0)**(i/n); a=1-np.exp(-2*np.pi*f/SR); y+=a*(x[i]-y); out[i]=y
    return out
def whoosh(d=.5,f0=300,f1=6000,g=.42):
    n=int(d*SR); y=lp(rng.standard_normal(n),f0,f1); t=np.arange(n)/SR; y*=np.sin(np.pi*np.clip(t/d,0,1))**1.6; return g*y/(np.abs(y).max()+1e-9)
def rise(g=.30):
    n=int(.45*SR); y=lp(rng.standard_normal(n),200,4000); t=np.arange(n)/SR; y*=(t/.45)**2.2; return g*y/(np.abs(y).max()+1e-9)
def pop(g=.32):
    n=int(.16*SR); t=np.arange(n)/SR; f=850*np.exp(-t*14)+240; return g*np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.002,.045)
def chime(g=.32):
    n=int(1.6*SR); t=np.arange(n)/SR
    y=sum(a*np.sin(2*np.pi*f*t) for f,a in [(1046.5,1),(1568,.6),(2093,.35),(2637,.2)])*env(n,.004,.5); return g*y/2
S={'whoosh':whoosh,'swipe':lambda:whoosh(.32,600,8000,.30),'pop':pop,'rise':rise,'chime':chime}
sfx=np.zeros((L+SR*2,2),np.float32)
for e in ev['events']:
    w=S[e['type']]().astype(np.float32); i=int(e['t']*SR)
    if e['type']=='rise': i-=int(.45*SR)   # termina quando a frase aparece
    i=max(0,i); sfx[i:i+len(w)]+=w[:,None]
# ducking pela voz
a=np.abs(v[:,0]); k=int(.15*SR); a=np.convolve(a,np.ones(k)/k,'same'); act=np.clip(a/0.03,0,1)
sm=int(.4*SR); act=np.convolve(act,np.ones(sm)/sm,'same'); duck=1-0.55*act
end=np.clip((np.arange(L)/SR-37.4)/1.0,0,1)  # música sobe no final
bedg=bed*(duck*(1+1.3*end))[:,None]
vn=v*(0.22/(np.sqrt((v**2).sum()/max(1,(act>.5).sum()*2))+1e-9))
mix=bedg+sfx[:L]*0.6+vn
mix=np.tanh(mix*1.1)/1.1
print('pico',round(float(np.abs(mix).max()),2))
raw=(np.clip(mix,-1,1)*32767).astype('<i2').tobytes()
subprocess.run(['ffmpeg','-y','-v','error','-f','s16le','-ar',str(SR),'-ac','2','-i','-',W+'/work/mix_raw.wav'],input=raw,check=True)
