"""Hashes measured from the pinned official downloads, checked before model loading."""
from pathlib import Path
import hashlib
TOTAL='total/nnunet/results/Dataset297_TotalSegmentator_total_3mm_1559subj/nnUNetTrainer_4000epochs_NoMirroring__nnUNetPlans__3d_fullres/'
FILES={
 TOTAL+'dataset.json':'e804e08ad8912e3a6f541741c8c78799d75acbd3f4f3f18ff5f211bbd3da961a',
 TOTAL+'fold_0/checkpoint_final.pth':'1e38e40356adc2706a662e365405a97f862d62a7da65f6bf81d025aee1b979ac',
 TOTAL+'plans.json':'d1cb3c15f53dc36fdb618e0f9082573d1f50b74a9b5fa73094ac8680845839f1',
 'composition/all/model_final_checkpoint.model':'7c4da016353f49a5ee4eb13bffe00f927d733054ccc96c1c3f76cd96f3e34443',
 'composition/all/model_final_checkpoint.model.pkl':'2d07a79a9286ad8fb82e03934ee41c78c4f35404534d8d8f53f7837d159da12d',
 'composition/plans.pkl':'b2821012e4a687a825444e15d39a2038d22db0545b523f3448af7ae7f0ea2028',
}
ARCHIVES={'total.zip':'0baa2c8de2975600eb31801dd5c1825cd2b356f794498659cf3348714c073394','composition.zip':'c49829902a85d300c2f534be8c7dba42e6b2a0cbd663c59c00b1cfcdff635d4d','plans.pkl':'b2821012e4a687a825444e15d39a2038d22db0545b523f3448af7ae7f0ea2028'}

def verify(prefix):
    root=Path(__file__).parent/'models'
    for name,expected in FILES.items():
        if not name.startswith(prefix+'/'):continue
        with (root/name).open('rb') as stream:actual=hashlib.file_digest(stream,'sha256').hexdigest()
        if actual!=expected:raise RuntimeError('Model integrity mismatch. Reinstall the pinned model.')
