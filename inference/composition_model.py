"""Pinned Stanford MIMI model, CPU inference on the L3 slab only."""
from pathlib import Path
import sys, os, socket

def main():
    from advanced_models import verify
    verify('composition')
    root=Path(__file__).parent/'models'/'composition'
    os.environ['nnUNet_raw_data_base']=str(root)
    os.environ['nnUNet_preprocessed']=str(root)
    os.environ['RESULTS_FOLDER']=str(root)
    import torch, numpy as np, nibabel as nib
    torch.set_num_threads(4)
    # nnU-Net v1 predates NumPy 2 and PyTorch 2.6. Only the pinned local model is loaded.
    np.float=float;np.int=int
    original=torch.load
    def load(path,*args,**kwargs):
        if not Path(path).resolve().is_relative_to(root.resolve()): raise RuntimeError('Unexpected checkpoint path.')
        kwargs['weights_only']=False
        return original(path,*args,**kwargs)
    torch.load=load
    def offline(*args,**kwargs): raise RuntimeError('Network is disabled during inference.')
    socket.create_connection=offline;original_connect=socket.socket.connect
    def local_connect(sock,address):
        if sock.family==socket.AF_UNIX: return original_connect(sock,address)
        return offline()
    socket.socket.connect=local_connect
    from nnunet.training.model_restore import load_model_and_checkpoint_files
    from nnunet.inference.segmentation_export import save_segmentation_nifti_from_softmax
    trainer,states=load_model_and_checkpoint_files(str(root),folds='all',mixed_precision=False,checkpoint_name='model_final_checkpoint')
    trainer.load_checkpoint_ram(states[0],False)
    data,_,properties=trainer.preprocess_patient([sys.argv[1]])
    _,probabilities=trainer.predict_preprocessed_data_return_seg_and_softmax(data,do_mirroring=False,mirror_axes=(),use_sliding_window=True,use_gaussian=True,all_in_gpu=False,mixed_precision=False,verbose=False)
    backward=trainer.plans.get('transpose_backward')
    if backward is not None: probabilities=probabilities.transpose([0]+[i+1 for i in backward])
    save_segmentation_nifti_from_softmax(probabilities,sys.argv[2],properties,order=1,verbose=False)

    img=nib.load(sys.argv[2]);old=img.get_fdata();new=np.zeros(old.shape,np.uint8)
    # Stanford v0.0.2: 4 muscle, 2 VAT, 1 SAT, 3 IMAT -> Leletiv documented schema.
    for source,target in [(4,1),(2,2),(1,3),(3,4)]: new[old==source]=target
    out=nib.Nifti1Image(new,img.affine);out.header.set_xyzt_units('mm');nib.save(out,sys.argv[2])

if __name__=='__main__': main()
