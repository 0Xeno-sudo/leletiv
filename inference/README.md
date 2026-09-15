# Local medical-model inference

The installed service runs the actual **MONAI BraTS MRI SegResNet 0.5.4** weights on CPU. It is a research example for glioma subregions, not a clinically validated diagnostic product. No OpenAI, Gemini or OpenRouter key is needed. No scan goes to a remote vendor.

## Start

After installing the Python environment and downloading the verified weights, start the entire app with:

```sh
npm run dev:full
```

This starts Vite/Cloudflare at `127.0.0.1:5173` and the Python inference service at `127.0.0.1:8789`. Stop with Ctrl-C. `npm run dev` alone still runs the clinical app without inference. Do not start a second copy while either port is in use.

For a fresh machine, install Python 3.12 and uv, then run from the project root:

```sh
uv venv --python 3.12 .venv-inference
uv pip install --python .venv-inference/bin/python -r inference/requirements.txt
npm run inference:model
npm run inference:lung-model
npm run dev:full
```

The launch script currently targets macOS/Linux. The Python code is portable; on Windows create a venv and run its `Scripts/python.exe inference/server.py` separately from the frontend.

## Model input contract

Four **distinct** prepared NIfTI-1 volumes, in explicit order **T1c, T1, T2, FLAIR**. Required: skull-stripped, co-registered, RAS-oriented, axis-aligned, 1 mm isotropic images with matching shape and affine. Geometry is validated; skull stripping, correct modality assignment and biological suitability require knowledgeable human confirmation. Arbitrary photographs, an atlas, duplicated modalities and unprepared DICOM are not valid model inputs.

Limits: 64 MB per uploaded file, 160 MB decompressed per file, 12 million voxels per sequence, and all dimensions at least 16. Non-finite signals, constant signals, duplicate sequences, unsupported geometry and unknown physical units are rejected. This is not an exhaustive NIfTI security review.

The research inference profile follows the bundle's nonzero channel-wise z-score normalization, 240 × 240 × 160 sliding window, 0.5 overlap, constant blending and 0.5 sigmoid threshold. No resampling or registration is silently performed. Output is kept on the original grid.

The optional synthetic check uses the same weights on a generated 32³ geometric phantom with a smaller 32³ processing window. It demonstrates execution only; it is not a benchmark, validation cohort or realistic disease example. The full multipart verification separately exercises the official processing window on synthetic input.

Output labels follow the official bundle priority: enhancing tumour = 4, other tumour core = 1, edema-only region = 2, background = 0. The learned channels are overlapping TC/WT/ET; exported labels are mutually exclusive. Their measured volumes must not be interpreted as independently validated clinical quantities.

## Workflow and privacy

1. Convert a DICOM folder in-browser using dcm2niix WASM. Inspect individual converted series; conversion does **not** perform registration or skull stripping.
2. Select/assign all four prepared sequences and explicitly acknowledge the research conditions.
3. Run segmentation. The service handles one job at a time and exposes processing stages, cancellation, and recent jobs.
4. Open the returned source and label mask in the linked slice/3D viewer. Inspect the overlay; the research-review checkbox is not clinical approval.
5. Export the mask and provenance JSON. The report includes model revision/checksum, input checksums, label volumes, CPU/runtime, window settings and review status.

The service binds only to loopback. Host and Origin checks reject other hosts/websites; mutation requests require an explicit research header. These controls are not user authentication. Do not expose this service through a tunnel or public port. This local prototype does not provide hospital-grade access control or encrypted storage.

Input/result files live in generated temporary directories. Clear them from the UI; completed/failed/cancelled jobs expire after one hour on the next service request. At most five jobs are retained. Cancellation is checked between inference windows; a current CPU window must finish. Jobs and files are cleaned up on a normal service exit; a forced OS/process crash may leave temporary files behind. No automatic patient-archive association or remote upload happens.

Job status is ephemeral service state, not a second database. All persistent clinical records, scenario snapshots and archived uploads still use the existing local Cloudflare D1/R2 runtime. Python/Torch inference is intentionally outside the Worker runtime. A future hosted version would need an explicitly provisioned medical inference compute service and an authenticated, reviewed data-transfer boundary.

## Provenance and licensing

Model: [MONAI/brats_mri_segmentation](https://huggingface.co/MONAI/brats_mri_segmentation/blob/main/docs/README.md), Apache 2.0, Copyright (c) MONAI Consortium. License included in `MODEL-LICENSE.txt`.

Pinned revision: `370f7f9d062745fbac445e7fe6d6616d35df04ec`.
Weights SHA-256: `860ccb3f1c21c99d0410ad8a1ac4ef6b8fab60cec0a503b0ba42675741a750ae`.
Download size: 18,840,620 bytes. The installer checks the hash; model load checks it again and uses `torch.load(weights_only=True)`. The service does not execute remote bundle expressions or download inference code at runtime.

The network configuration and output-channel ordering are adapted from the [official bundle inference configuration](https://huggingface.co/MONAI/brats_mri_segmentation/blob/370f7f9d062745fbac445e7fe6d6616d35df04ec/configs/inference.json). Local additions include validation, cancellation, HTTP orchestration, provenance, and UI integration.

DICOM conversion: [`@niivue/dcm2niix`](https://github.com/rordenlab/dcm2niix), BSD-2-Clause. This build includes JPEG-LS/JPEG2000 codecs. Unsupported or invalid series can still fail conversion; not every scanner/export format is verified.

## Verification

```sh
npm run inference:test
npm run check
# With both services running:
.venv-inference/bin/python inference/verify_pipeline.py
```

The integration script sends generated MRI inputs through multipart upload, runs actual weights using the published window, downloads source/mask, verifies hashes, original-grid preservation and allowed labels, then clears its own test job. It does not establish diagnostic accuracy.


## CT lung nodule candidates (new)

The 3D workspace also runs the actual Apache-2.0 MONAI lung_nodule_ct_detection RetinaNet weights locally. Setup: `npm run inference:lung-model`. See [the implementation and input contract](../docs/CONNECTED-IMAGING.md) for pinned model provenance, HU/geometry requirements, CPU limits and the deviation from the published window size. `LUNG-MODEL-LICENSE.txt` preserves the model license.

POST `/lung/jobs` accepts one `ct` NIfTI file and `prepared=yes`; `/lung/smoke` generates a geometric CT phantom. Both use the existing bounded job lifecycle. Lung reports provide detector scores, RAS centers and boxes. Their wireframe artifact is a localization overlay, not a segmented lesion. Cancellation is observed before and after the detector call; a running detector operation must finish before it can stop. The MRI panel filters out lung jobs so results cannot be mixed.

The local development runtime stores new D1/R2 data under `.wrangler/state/connected-care`. Startup applies schema migrations to an empty database. No previous workspace, record or file is imported.

With both local services running, `.venv-inference/bin/python inference/verify_lung_pipeline.py` checks an actual multipart CT upload, pretrained inference, exact source bytes/checksum and source-aligned box output, then clears only its own temporary test job.
