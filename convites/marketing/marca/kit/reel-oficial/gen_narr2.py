import json,subprocess,sys
VOICE=sys.argv[1] if len(sys.argv)>1 else 'pf_dora'; SPEED=sys.argv[2] if len(sys.argv)>2 else '0.88'
L=[
 {"id":"l1","text":"Imagina um convite que conta a história do seu bebê.","marks":{"kw1":"Imagina um convite que conta a"}},
 {"id":"l2","text":"Com as fotos dele, emojis caindo na tela, e um: você está convidado.","marks":{"kw1":"Com as fotos dele,","kw2":"Com as fotos dele, emojis caindo na tela, e um:"}},
 {"id":"l3","text":"E ele chega lindinho no WhatsApp, com imagem grande e mensagem pronta.","marks":{"pre":"E ele","kw1":"E ele chega lindinho no","kw2":"E ele chega lindinho no WhatsApp, com"}},
 {"id":"l4","text":"Os convidados só digitam o nome, e respondem pela família toda.","marks":{"kw1":"Os convidados","kw2":"Os convidados só digitam o nome, e respondem pela"}},
 {"id":"l5","text":"Sem app. Sem cadastro.","marks":{"kw2":"Sem app."}},
 {"id":"l6","text":"Você vê tudo ao vivo. Quem confirmou, as vagas do pai e da mãe, e o controle de gratuidades.","marks":{"kw1":"Você vê tudo","c1":"Você vê tudo ao vivo. Quem","c2":"Você vê tudo ao vivo. Quem confirmou, as","c3":"Você vê tudo ao vivo. Quem confirmou, as vagas do pai e da mãe, e o controle de"}},
 {"id":"l7","text":"Quem não respondeu? Um toque, e o lembrete vai.","marks":{"kw1":"Quem não respondeu?"}},
 {"id":"l8","text":"Quer um desses na sua festa? Chama no WhatsApp. Link na bio.","marks":{"kw1":"Quer um desses na sua festa?","bio":"Quer um desses na sua festa? Chama no WhatsApp."}},
]
CHAIN="highpass=f=90,equalizer=f=220:t=q:w=1.2:g=2.5,equalizer=f=5500:t=q:w=1.5:g=-5,equalizer=f=9000:t=q:w=1:g=-6,asetrate=24000*1.035,aresample=44100,atempo=0.966,acompressor=threshold=-22dB:ratio=2.2:attack=15:release=160,aecho=0.85:0.75:55|90:0.14|0.08"
TRIM="silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse"
def tts(text,out): subprocess.run(['hyperframes','tts',text,'--voice',VOICE,'--lang','pt-br','--speed',SPEED,'-o',out],capture_output=True)
def proc(src,dst): subprocess.run(['ffmpeg','-y','-v','error','-i',src,'-af',CHAIN+','+TRIM,dst])
def dur(f): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
out=[]
for l in L:
    tts(l['text'],f"{l['id']}_raw.wav"); proc(f"{l['id']}_raw.wav",f"{l['id']}_t.wav"); d=dur(f"{l['id']}_t.wav"); offs={}
    for k,pre in l['marks'].items():
        t=pre.strip(); t=t[:-1] if t[-1] in ',:' else t
        tts(t,f"{l['id']}_{k}.wav"); proc(f"{l['id']}_{k}.wav",f"{l['id']}_{k}_t.wav"); offs[k]=round(dur(f"{l['id']}_{k}_t.wav"),3)
    out.append({**{k:v for k,v in l.items() if k!='marks'},'dur':round(d,3),'offs':offs}); print(l['id'],round(d,2),offs)
GAP,LEAD=.15,.3; t=LEAD; tl=[]
for l in out: tl.append({**l,'start':round(t,3)}); t+=l['dur']+GAP
total=round(t-GAP+0.8,3); json.dump({'lines':tl,'total':total,'voice':VOICE,'speed':SPEED},open('timeline2.json','w'),ensure_ascii=False,indent=1)
ins=[];fl=[]
for i,x in enumerate(tl): ins+=['-i',f"{x['id']}_t.wav"]; ms=int(x['start']*1000); fl.append(f"[{i}:a]adelay={ms}|{ms},apad[a{i}]")
mix=''.join(f'[a{i}]' for i in range(len(tl)))+f"amix=inputs={len(tl)}:normalize=0:duration=longest[o]"
subprocess.run(['ffmpeg','-y','-v','error',*ins,'-filter_complex',';'.join(fl)+';'+mix,'-map','[o]','-t',str(total),'-ar','44100','-ac','1','narr2.wav'])
print('total',total)
