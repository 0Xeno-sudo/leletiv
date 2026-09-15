"""Geometric phantoms only; no patient data or diagnostic reference labels."""
from pathlib import Path
import numpy as np
import nibabel as nib
folder=Path(__file__).resolve().parents[1]/'public'/'imaging-demo';folder.mkdir(exist_ok=True)
x,y,z=np.indices((48,48,48));distance=(x-24)**2+(y-24)**2+(z-24)**2
for name,radius in [('baseline',7),('followup',6)]:
    mask=(distance<=radius**2).astype(np.uint8)
    data=np.full(mask.shape,-900,dtype=np.float32);data[distance<20**2]=30;data[mask>0]=150
    for suffix,array in [('',data),('-mask',mask)]:
        h=nib.Nifti1Header();h.set_xyzt_units('mm');h.set_data_dtype(array.dtype)
        im=nib.Nifti1Image(array,np.diag([1,1,1,1]),h);im.set_sform(im.affine,1)
        nib.save(im,str(folder/(name+suffix+'.nii.gz')))
print('Synthetic paired scans and reference masks written.')
