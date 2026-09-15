# 3D scan lab: rendering, DICOM conversion and model inference

Updated 14 September 2026: automatic **research segmentation is now implemented**, using actual pretrained MONAI BraTS weights in a loopback Python CPU service. DICOM folder conversion is also implemented with dcm2niix WASM in the browser. Start both services with `npm run dev:full`. Full setup, supported inputs, model provenance and limits are in [inference/README.md](../inference/README.md).

The old procedural brain has been removed from the UI. NiiVue 0.69 renders an actual volumetric dataset in linked slices and 3D. The optionally downloaded MNI152 atlas is a population-average template, not a patient record. Full attribution accompanies the dataset under `public/volumes/ATTRIBUTION.txt`.

## Working now, without API keys

- Open a local, single-file NIfTI-1 `.nii` or `.nii.gz` volume.
- Import a matching integer label mask (0 = background, 1–255 = regions).
- View axial, coronal, sagittal, combined and 3D presentations; rotate, scroll slices, adjust contrast, change overlay opacity, and use a 3D cutaway.
- Calculate per-label voxel counts and volumes using the spatial affine determinant and physical units. Sheared grids are accounted for. A label is not automatically classified as a tumour.
- Export a measurement CSV, notes and a NIfTI region mask.
- Export a provider-neutral segmentation job manifest for a locally opened scan. This manifest contains geometry and the expected mask format, not image data or credentials.

The atlas loader and local import use the same decoding path. The simulated region is serialized to NIfTI, decoded again, grid-checked, and measured before rendering. It is an ellipsoid for testing, explicitly not a clinical finding.

## Input safeguards

64 MB input limit; 160 MB decompressed limit; maximum 32 million voxels; one 3D frame; NIfTI-1 magic, dimensions and payload length checks. Compression is detected from bytes because HTTP delivery can decompress a `.gz` file before application code receives it. Imported masks must match dimensions, spacing, physical units and affine coordinates. Probability maps, unknown physical units, scaled labels and incompatible grids are rejected for measurement.

Simply opened volumes and DICOM conversions remain in the browser tab. Running the model explicitly transfers the four chosen prepared sequences to the local inference service; its jobs and artifacts are temporary. No scan is sent to an external AI vendor. Closing/reloading the tab clears the viewer and unsaved notes, but recent local jobs can be recovered while the service retains them. Archive uploads remain a separate action using local D1/R2. The scan lab never automatically associates an atlas, model prediction or imported file with an archive patient.

## Implemented automatic segmentation and remaining clinical requirements

The installed model accepts four aligned, skull-stripped 1 mm RAS MRI volumes (T1c, T1, T2, FLAIR) and predicts candidate glioma subregions. The service checks geometry, distinct input signals, file sizes, model checksum and output coordinates. It supports progress, cancellation, recent-job recovery, same-grid NIfTI results and provenance export. Generic image generators are not involved. No GPU or API key is required by this CPU implementation.

A future clinically usable release still needs:

1. Evaluation for the intended modality, anatomy, tumour type, hospital and data distribution.
2. A verified preprocessing workflow; DICOM conversion alone does not perform skull stripping, registration or modality identification.
3. Authentication, appropriate access controls, healthcare privacy safeguards, audit review and operational monitoring.
4. Qualified clinical review and an appropriate medical-device/regulatory assessment before patient-care use.

Implemented model: https://huggingface.co/MONAI/brats_mri_segmentation
NiiVue documentation: https://niivue.com/docs/

PACS/DICOMweb integration, automatic image registration and skull stripping, identity/access controls, clinical validation and production healthcare governance remain separate work. This portfolio prototype is not suitable for real patient-care decisions.
