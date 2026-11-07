import sys,os,numpy as np,cv2,mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
src,dst,model=sys.argv[1],sys.argv[2],sys.argv[3]; a,b=int(sys.argv[4]),int(sys.argv[5])
os.makedirs(dst,exist_ok=True)
opt=vision.ImageSegmenterOptions(base_options=mpp.BaseOptions(model_asset_path=model),running_mode=vision.RunningMode.VIDEO,output_confidence_masks=True)
seg=vision.ImageSegmenter.create_from_options(opt)
fs=sorted(os.listdir(src))[a:b]; prev=None
for i,f in enumerate(fs):
    bgr=cv2.imread(os.path.join(src,f)); rgb=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)
    r=seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,data=rgb),int((a+i)*1000/30))
    bg=r.confidence_masks[0].numpy_view().copy()
    m=1-bg
    m=cv2.resize(m,(bgr.shape[1],bgr.shape[0]),interpolation=cv2.INTER_LINEAR)
    # refine edges with guided filter on the frame
    try:
        m=cv2.ximgproc.guidedFilter(bgr,m.astype(np.float32),8,1e-3)
    except Exception: m=cv2.GaussianBlur(m,(0,0),1.5)
    m=np.clip((m-0.35)/0.3,0,1)
    if prev is not None: m=0.8*m+0.2*prev
    prev=m
    rgba=np.dstack([bgr,(m*255).astype(np.uint8)])
    cv2.imwrite(os.path.join(dst,f.replace('.jpg','.png')),rgba,[cv2.IMWRITE_PNG_COMPRESSION,3])
seg.close(); print("ok",a,b)
