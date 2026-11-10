import sys,numpy as np,cv2,mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
src,dst,model=sys.argv[1:4]
bgr=cv2.imread(src)[:1000]          # abaixo disso o "17h" da arte antiga cobre a camisa
h,w=bgr.shape[:2]
seg=vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=mpp.BaseOptions(model_asset_path=model),output_confidence_masks=True))
r=seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)))
m=1-r.confidence_masks[0].numpy_view().copy(); seg.close()
m=cv2.resize(m,(w,h),interpolation=cv2.INTER_LINEAR)
# só a pessoa do centro (tira o ombro de terno azul na borda esquerda)
n,lab=cv2.connectedComponents((m>0.5).astype(np.uint8))
keep=(lab==lab[450,450]).astype(np.uint8)
keep=cv2.dilate(keep,np.ones((15,15),np.uint8))
m=m*keep
m=cv2.ximgproc.guidedFilter(bgr,m.astype(np.float32),10,1e-3)
m=np.clip((m-0.4)/0.25,0,1)
cv2.imwrite(dst,np.dstack([bgr,(m*255).astype(np.uint8)]))
bg=np.zeros_like(bgr); bg[:]=(200,120,20); a=m[...,None]
cv2.imwrite(dst.replace('.png','_chk.jpg'),cv2.resize((bgr*a+bg*(1-a)).astype(np.uint8),(590,500)))
