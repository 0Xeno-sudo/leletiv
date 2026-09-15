# Third-party components

The project's Apache-2.0 licence applies to original NeuroFlow code. It does not replace the terms of dependencies or optional assets. Exact JavaScript versions are recorded in package-lock.json, Python versions in inference/requirements.txt.

- **MONAI BraTS MRI segmentation**: optional separately downloaded weights; pinned revision/checksum in inference/engine.py; upstream terms reproduced in inference/MODEL-LICENSE.txt.
- **MONAI lung nodule CT detection**: optional separately downloaded weights; pinned revision/checksum in inference/lung_engine.py and inference/download_lung_model.py; upstream terms reproduced in inference/LUNG-MODEL-LICENSE.txt.
- **NiiVue**: medical-image viewer. Its own licence accompanies the installed package.
- **dcm2niix WASM**: browser DICOM conversion via @niivue/dcm2niix. Upstream components retain their licences.
- **Switzer**: distributed through @carrot-kpi/switzer-font. The font retains its upstream font licence; it is not relicensed as Apache-2.0. Font binaries are not stored in this repository.
- **MNI152 / ICBM atlas**: optional download; attribution and redistribution notice in public/volumes/ATTRIBUTION.txt. No atlas file is committed.
- React, Hono, Vite, Phosphor icons, PDF.js, nifti-reader-js, Cloudflare tooling, FastAPI, PyTorch and other dependencies retain their package licences.

Synthetic DICOM/NIfTI examples are generated from geometric shapes by the included scripts. They are not clinical scans. Model weights and medical files must not be included in source commits.
