import threading
import numpy as np
import nibabel as nib
import pytest
from lung_engine import read_ct,make_lung_phantom,LungEngine
from engine import InputError,Cancelled

def test_rejects_unknown_orientation_and_non_hu(tmp_path):
    path=make_lung_phantom(tmp_path)['ct'];im=nib.load(path)
    data=im.get_fdata().astype(np.float32);data[:]=1
    nib.save(nib.Nifti1Image(data,im.affine,im.header),path)
    with pytest.raises(InputError,match='Hounsfield'):read_ct(path)
    path=make_lung_phantom(tmp_path)['ct'];im=nib.load(path);im.set_sform(im.affine,0);im.set_qform(im.affine,0);nib.save(im,path)
    with pytest.raises(InputError,match='orientáció'):read_ct(path)

def test_cancellation_before_model_load(tmp_path):
    cancel=threading.Event();cancel.set()
    with pytest.raises(Cancelled):LungEngine().infer(make_lung_phantom(tmp_path),tmp_path,lambda *args:None,cancel)

def test_nonfinite_ct_rejected(tmp_path):
    path=make_lung_phantom(tmp_path)['ct'];im=nib.load(path);data=im.get_fdata().astype(np.float32);data[1,1,1]=np.nan;nib.save(nib.Nifti1Image(data,im.affine,im.header),path)
    with pytest.raises(InputError):read_ct(path)
