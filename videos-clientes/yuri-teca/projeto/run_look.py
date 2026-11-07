import sys,os,cv2,numpy as np
sys.path.insert(0,os.path.dirname(__file__)); from look import process
W=sys.argv[1]; a,b=int(sys.argv[2]),int(sys.argv[3]); p5,p95=float(sys.argv[4]),float(sys.argv[5])
os.makedirs(W+'/fr2',exist_ok=True); os.makedirs(W+'/mask2',exist_ok=True)
fs=sorted(os.listdir(W+'/fr'))[a:b]
for f in fs:
    bgr=cv2.imread(W+'/fr/'+f); al=cv2.imread(W+'/mask/'+f.replace('jpg','png'),cv2.IMREAD_UNCHANGED)[:,:,3]
    out,_=process(bgr,al.astype(np.float32)/255,pct=(p5,p95))
    cv2.imwrite(W+'/fr2/'+f,out,[cv2.IMWRITE_JPEG_QUALITY,95])
    alu=cv2.resize(al,(1080,1920),interpolation=cv2.INTER_LINEAR)
    cv2.imwrite(W+'/mask2/'+f.replace('jpg','png'),np.dstack([out,alu]),[cv2.IMWRITE_PNG_COMPRESSION,1])
print('ok',a,b)
