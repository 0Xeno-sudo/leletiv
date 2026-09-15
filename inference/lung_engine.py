"""Apache-2.0 MONAI RetinaNet, local CT nodule candidates. Not malignancy classification."""
from pathlib import Path
import hashlib,gzip,time
import numpy as np
import nibabel as nib
from engine import InputError,Cancelled,MAX_FILE,MAX_EXPANDED,file_hash
MODEL_PATH=Path(__file__).parent/'models'/'lung-retinanet.pt'
MODEL_SHA='b5e79231466adae93a6fe8e8594029e9add142914e223b879aa0343bb2402d01'
REVISION='9d6622fda0e52be0a4155fed2e0afb9c17bcd80b'
SPACING=(.703125,.703125,1.25)

def read_ct(path):
    path=Path(path)
    if path.stat().st_size>MAX_FILE:raise InputError('A CT legfeljebb 64 MB lehet.')
    if path.suffix=='.gz':
        n=0
        with gzip.open(path,'rb') as stream:
            while chunk:=stream.read(1024*1024):
                n+=len(chunk)
                if n>MAX_EXPANDED:raise InputError('Túl nagy tömörítetlen CT.')
    image=nib.load(path)
    if not isinstance(image,nib.Nifti1Image) or len(image.shape)!=3 or min(image.shape)<16 or np.prod(image.shape)>12_000_000:raise InputError('Egyetlen 3D NIfTI-1 CT szükséges, legfeljebb 12 millió voxellel.')
    if image.header.get_xyzt_units()[0]!='mm' or not (int(image.header['qform_code']) or int(image.header['sform_code'])):raise InputError('Ismert térbeli orientáció és milliméteres kalibráció szükséges. Képszeletekből épített térfogat nem alkalmas.')
    if not np.isfinite(image.affine).all() or abs(np.linalg.det(image.affine[:3,:3]))<1e-8:raise InputError('Érvénytelen CT-geometria.')
    data=image.get_fdata(dtype=np.float32)
    if not np.isfinite(data).all() or data.min()>-500 or data.max()<100 or data.min() < -10000 or data.max()>100000:raise InputError('Ellenőrizd a CT Hounsfield-skáláját. Nem megfelelő intenzitástartomány.')
    return image

class LungEngine:
    def __init__(self):self.detector=None
    def load(self):
        if self.detector is not None:return
        if not MODEL_PATH.is_file() or file_hash(MODEL_PATH)!=MODEL_SHA:raise InputError('A hitelesített tüdőmodell hiányzik.')
        import torch
        from monai.networks.nets.resnet import resnet50
        from monai.apps.detection.networks.retinanet_network import RetinaNet,resnet_fpn_feature_extractor
        from monai.apps.detection.networks.retinanet_detector import RetinaNetDetector
        from monai.apps.detection.utils.anchor_utils import AnchorGeneratorWithAnchorShape
        torch.set_num_threads(4)
        backbone=resnet50(spatial_dims=3,n_input_channels=1,conv1_t_stride=[2,2,1],conv1_t_size=[7,7,7])
        net=RetinaNet(3,1,3,resnet_fpn_feature_extractor(backbone,3,False,[1,2],None),[16,16,8],False)
        net.load_state_dict(torch.load(MODEL_PATH,map_location='cpu',weights_only=True));net.eval()
        detector=RetinaNetDetector(net,AnchorGeneratorWithAnchorShape(feature_map_scales=[1,2,4],base_anchor_shapes=[[6,8,4],[8,6,5],[10,10,6]]),spatial_dims=3,num_classes=1,size_divisible=[16,16,8])
        detector.set_target_keys(box_key='box',label_key='label')
        detector.set_box_selector_parameters(score_thresh=.02,topk_candidates_per_level=1000,nms_thresh=.22,detections_per_img=300)
        detector.set_sliding_window_inferer(roi_size=[192,192,80],overlap=.25,sw_batch_size=1,mode='constant',device='cpu')
        self.detector=detector.eval()
    def infer(self,paths,output_dir,progress,cancel,profile='research'):
        from nibabel.processing import resample_to_output
        import torch
        started=time.monotonic();progress(5,'CT-geometria és HU-skála ellenőrzése')
        original=read_ct(paths['ct'])
        # Bound resampling allocation before invoking scipy.
        corners=np.array([[x,y,z,1] for x in [0,original.shape[0]-1] for y in [0,original.shape[1]-1] for z in [0,original.shape[2]-1]])@original.affine.T
        shape=np.ceil(np.ptp(corners[:,:3],axis=0)/SPACING).astype(int)+1
        if np.prod(shape)>16_000_000:raise InputError('Az újramintavételezett CT túl nagy. Legfeljebb 16 millió voxel támogatott a helyi CPU-profilban.')
        image=resample_to_output(original,voxel_sizes=SPACING,order=1,cval=-1024)
        data=image.get_fdata(dtype=np.float32)
        if cancel.is_set():raise Cancelled()
        progress(20,'RetinaNet tüdőgócjelöltek keresése · CPU');self.load()
        tensor=torch.from_numpy(np.clip((data+1024)/1324,0,1)[None].copy()).float()
        with torch.inference_mode():pred=self.detector([tensor],use_inferer=True)[0]
        if cancel.is_set():raise Cancelled()
        boxes=pred['box'].cpu().numpy();scores=pred['label_scores'].cpu().numpy()
        if not np.isfinite(boxes).all() or not np.isfinite(scores).all():raise InputError('Érvénytelen modellkimenet.')
        progress(90,'Jelöltlista és térbeli dobozok összeállítása')
        wire=np.zeros(original.shape,dtype=np.uint8);candidates=[];inverse=np.linalg.inv(original.affine)
        for box,score in sorted(zip(boxes,scores),key=lambda p:-float(p[1]))[:50]:
            if score<.1:continue
            lo=np.minimum(box[:3],box[3:]);hi=np.maximum(box[:3],box[3:])
            corners=np.array([[x,y,z,1] for x in [lo[0],hi[0]] for y in [lo[1],hi[1]] for z in [lo[2],hi[2]]])
            world=corners@image.affine.T;vox=world@inverse.T
            start=np.maximum(0,np.floor(vox[:,:3].min(0)).astype(int));end=np.minimum(np.array(original.shape)-1,np.ceil(vox[:,:3].max(0)).astype(int))
            if np.any(end<=start):continue
            index=len(candidates)+1
            # Wireframe boxes are localization aids, never lesion masks.
            for axis in range(3):
                others=[a for a in range(3) if a!=axis]
                for side1 in [start[others[0]],end[others[0]]]:
                    for side2 in [start[others[1]],end[others[1]]]:
                        slices=[slice(int(start[a]),int(end[a])+1) for a in range(3)];slices[others[0]]=int(side1);slices[others[1]]=int(side2);wire[tuple(slices)]=index
            center=image.affine@np.r_[(lo+hi)/2,1]
            candidates.append({'id':index,'score':float(score),'centerRasMm':center[:3].tolist(),'boxRasMm':[world[:,:3].min(0).tolist(),world[:,:3].max(0).tolist()],'reviewStatus':'unreviewed'})
        h=original.header.copy();h.set_data_dtype(np.uint8);h.set_slope_inter(1,0)
        nib.save(nib.Nifti1Image(wire,original.affine,h),str(Path(output_dir)/'mask.nii.gz'))
        return {'schema':'neuroflow.lung-candidates.v1','model':'MONAI lung_nodule_ct_detection','modelRevision':REVISION,'modelSha256':MODEL_SHA,'sourceSha256':file_hash(paths['ct']),'diagnosticUse':False,'profile':profile,'candidates':candidates,'displayScoreThreshold':.1,'maximumDisplayedCandidates':50,'scoreMeaning':'Detector score, not cancer probability','resamplingMm':list(SPACING),'inferencePatch':[192,192,80],'registration':'RAS resampling only; no inter-study registration','elapsedSeconds':round(time.monotonic()-started,2),'limitations':'Unvalidated local CPU integration. False positives and missed nodules possible. Empty result does not exclude disease. Boxes are not segmentations.'}

def make_lung_phantom(folder):
    xyz=np.indices((48,48,48));body=((xyz[0]-24)/21)**2+((xyz[1]-24)/20)**2<1
    a=np.full((48,48,48),-1024,dtype=np.float32);a[body]=40
    for x in [16,32]:a[((xyz[0]-x)/6)**2+((xyz[1]-25)/12)**2<1]=-800
    a[((xyz[0]-16)**2+(xyz[1]-25)**2+(xyz[2]-24)**2)<9]=150
    h=nib.Nifti1Header();h.set_xyzt_units('mm');im=nib.Nifti1Image(a,np.diag([1,1,1,1]),h);im.set_sform(im.affine,1)
    path=Path(folder)/'ct.nii.gz';nib.save(im,str(path));return {'ct':path}
