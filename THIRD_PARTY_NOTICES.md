# Third-party components and optional assets

Original Leletív code is Apache-2.0 licensed. That licence does **not** replace the terms of dependencies, model weights, fonts or data. Copyright remains with each component's respective authors. No upstream supplier's endorsement or warranty of this integration is claimed.

This repository distributes source and documentation. It does not vendor node_modules, a Python environment, font binaries, model weights or medical images. Package installation retrieves dependencies separately. Their original licence texts, copyright notices and applicable NOTICE files remain authoritative.

## Direct JavaScript dependencies

Snapshot of the resolved versions and declared licence identifiers in [package-lock.json](package-lock.json). The table includes direct development tools to distinguish source development from runtime distribution. It is a metadata inventory, not a legal certification or a complete inventory of embedded codecs and transitive dependencies. Each package can be inspected through its corresponding page on [the npm registry](https://www.npmjs.com/) and its upstream repository.

| Package | Resolved version | Declared licence | Role |
| --- | --- | --- | --- |
| `@niivue/dcm2niix` | 1.3.20260724 | BSD-2-Clause | Runtime |
| `@niivue/niivue` | 0.69.0 | BSD-2-Clause | Runtime |
| `@phosphor-icons/react` | 2.1.10 | MIT | Runtime |
| `hono` | 4.13.7 | MIT | Runtime |
| `nifti-reader-js` | 0.8.0 | MIT | Runtime |
| `pdfjs-dist` | 6.3.289 | Apache-2.0 | Runtime |
| `react` | 19.3.0 | MIT | Runtime |
| `react-dom` | 19.3.0 | MIT | Runtime |
| `react-router-dom` | 7.18.3 | MIT | Runtime |
| `@babel/parser` | 8.0.5 | MIT | Development/build/test |
| `@cloudflare/vite-plugin` | 1.54.8 | MIT | Development/build/test |
| `@types/node` | 26.5.1 | MIT | Development/build/test |
| `@types/react` | 19.3.0 | MIT | Development/build/test |
| `@types/react-dom` | 19.3.0 | MIT | Development/build/test |
| `@vitejs/plugin-react` | 6.1.1 | MIT | Development/build/test |
| `miniflare` | 5.20260911.0-alpha | MIT | Development/build/test |
| `typescript` | 7.0.2 | Apache-2.0 | Development/build/test |
| `vite` | 8.3.0 | MIT | Development/build/test |
| `vitest` | 5.0.0 | MIT | Development/build/test |
| `wrangler` | 4.131.1 | MIT OR Apache-2.0 | Development/build/test |

In particular, NiiVue and the dcm2niix WASM package declare BSD-2-Clause; PDF.js declares Apache-2.0. Their inclusion does not make the entire application a clinically validated medical product. Preserve component-specific notices when redistributing their code or compiled assets; dcm2niix and PDF.js may also contain separately licensed embedded components.

## Optional Python service

Direct versions are pinned in [inference/requirements.txt](inference/requirements.txt). The following identifies the top-level licences, based on package metadata. Binary wheels may bundle additional libraries with their own notices; these must be checked for the actual platform and distribution.

| Package | Version | Licence information |
| --- | --- | --- |
| torch | 2.8.0 | BSD-3-Clause; bundled component notices also apply |
| monai | 1.5.1 | Apache-2.0 |
| nibabel | 5.3.2 | MIT |
| numpy | 2.5.3 | Declared expression: BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0 |
| fastapi | 0.141.1 | MIT |
| uvicorn | 0.53.0 | BSD-3-Clause |
| python-multipart | 0.0.32 | Apache-2.0 |
| pydicom | 3.0.1 | MIT |
| scipy | 1.16.3 | BSD licence and bundled component notices; see the installed distribution's licence text |
| torchvision | 0.23.0 | BSD licence and bundled component notices |
| pillow | 11.3.0 | MIT-CMU; bundled image libraries retain their own terms |
| httpx | 0.28.1 | BSD-3-Clause |
| pytest | 8.4.2 | MIT; test tool |

## Model weights and atlas

- **MONAI BraTS MRI segmentation**: optional separately downloaded weights. The pinned source revision/checksum is in [inference/engine.py](inference/engine.py); the upstream Apache-2.0 text is reproduced in [inference/MODEL-LICENSE.txt](inference/MODEL-LICENSE.txt).
- **MONAI lung nodule CT detection**: optional separately downloaded weights. The pinned source revision/checksum is in [inference/lung_engine.py](inference/lung_engine.py) and [inference/download_lung_model.py](inference/download_lung_model.py); the upstream Apache-2.0 text is reproduced in [inference/LUNG-MODEL-LICENSE.txt](inference/LUNG-MODEL-LICENSE.txt).
- **MNI152 / ICBM atlas**: optional separate download. The source, attribution and redistribution notice are in [public/volumes/ATTRIBUTION.txt](public/volumes/ATTRIBUTION.txt). No atlas file is committed.

Model and dataset licences are separate from the framework licence. Retain model cards and applicable upstream notices for the exact downloaded revision. Permission to use software or weights does not establish rights to patient data, clinical suitability, or regulatory approval.

Synthetic DICOM/NIfTI examples are generated from geometric shapes by the included scripts. They are not clinical scans. Model weights and medical files must not be included in source commits.

## Switzer: separately licensed, not redistributed

**Switzer**, by Indian Type Foundry, is offered through [Fontshare](https://www.fontshare.com/fonts/switzer) under the [ITF Free Font License](https://www.fontshare.com/licenses/itf-ffl). Free use is not the same as open-source redistribution permission. The font must not be treated as Apache-2.0 or MIT merely because a third-party package declares such a licence.

The earlier npm font repackaging has been removed from the current source dependencies. No Switzer files are included in this repository or generated by the build. The stylesheet names the locally installed Switzer family, with Arial/sans-serif fallbacks. Users who want Switzer should obtain and install it directly from the rights holder under its terms. There is no automatic remote font request. Web hosting or redistribution requires checking the rights holder's applicable permissions separately.

## Distribution responsibilities

Before distributing a built web client, container or installer, identify **all actually included files** (including transitive dependencies, WASM, native libraries and optional assets), and include the original licence and attribution material their terms require. A package.json licence field and this inventory alone are not substitutes for those texts. Recheck the inventory whenever dependencies change. This source-only release does not claim to be a complete compliance assessment of every possible downstream build.

For the project's warranty and clinical-scope information, see [LEGAL.md](LEGAL.md). No notice here alters third-party terms or overrides mandatory law.

## Quantitative workspace additions

See [the additional component inventory](docs/ADVANCED-THIRD-PARTY.md) for SimpleITK, scikit-image, OpenSlide, nnU-Net, TotalSegmentator, Stanford MIMI weights and the GPL/LGPL obligations of separately installed dependencies. The new model weights and runtime binaries are not bundled.
