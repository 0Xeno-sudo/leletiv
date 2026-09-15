"""Create a non-patient, 24-slice geometric DICOM test series."""
from pathlib import Path
import numpy as np
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian, MRImageStorage, generate_uid

root = Path(__file__).resolve().parents[1] / 'public' / 'dicom-demo'
root.mkdir(parents=True, exist_ok=True)
study_uid, series_uid = generate_uid(), generate_uid()
for z in range(24):
    meta = FileMetaDataset()
    meta.MediaStorageSOPClassUID = MRImageStorage
    meta.MediaStorageSOPInstanceUID = generate_uid()
    meta.TransferSyntaxUID = ExplicitVRLittleEndian
    meta.ImplementationClassUID = generate_uid()
    ds = FileDataset(None, {}, file_meta=meta, preamble=b'\0' * 128)
    ds.SOPClassUID = MRImageStorage
    ds.SOPInstanceUID = meta.MediaStorageSOPInstanceUID
    ds.StudyInstanceUID, ds.SeriesInstanceUID = study_uid, series_uid
    ds.PatientName, ds.PatientID = 'SYNTHETIC^PHANTOM', 'NOT-A-PATIENT'
    ds.PatientBirthDate = ''
    ds.StudyDate, ds.StudyTime = '20260914', '000000'
    ds.SeriesDescription, ds.ProtocolName = 'Geometric phantom', 'NeuroFlow smoke test'
    ds.Modality, ds.Manufacturer = 'MR', 'SYNTHETIC'
    ds.SeriesNumber, ds.InstanceNumber = 1, z + 1
    ds.ImageType = ['ORIGINAL', 'PRIMARY', 'OTHER']
    ds.MRAcquisitionType = '3D'
    ds.Rows = ds.Columns = 32
    ds.SamplesPerPixel, ds.PhotometricInterpretation = 1, 'MONOCHROME2'
    ds.BitsAllocated = ds.BitsStored = 16
    ds.HighBit, ds.PixelRepresentation = 15, 0
    ds.PixelSpacing = [1, 1]
    ds.SliceThickness = ds.SpacingBetweenSlices = 1
    ds.ImageOrientationPatient = [1, 0, 0, 0, 1, 0]
    ds.ImagePositionPatient = [0, 0, z]
    ds.RepetitionTime, ds.EchoTime, ds.FlipAngle = 1500, 12, 15
    x, y = np.indices((32, 32))
    r = (x-15.5)**2 + (y-15.5)**2 + (z-11.5)**2
    ds.PixelData = np.where(r < 110, 500 + x*10 + z*5, 0).astype('<u2').tobytes()
    ds.save_as(root / f'slice-{z:03}.dcm', enforce_file_format=True)
print('Created 24 synthetic DICOM slices; no patient data.')
