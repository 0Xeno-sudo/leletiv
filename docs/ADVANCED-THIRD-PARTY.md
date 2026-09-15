# Additional components used by the quantitative workspace

The application source does not replace upstream licences. These dependencies and weights are installed separately; this source repository does not bundle their environments, binaries or models. No upstream endorsement, clinical certification or accuracy guarantee is implied.

| Component | Pinned version / revision | Upstream licence / role |
| --- | --- | --- |
| SimpleITK | 2.5.3 | Apache-2.0; rigid image registration |
| scikit-image | 0.25.2 | Primarily BSD-3-Clause, with component-specific notices; colour deconvolution, watershed and region measurements |
| openslide-python | 1.4.3 | LGPL-2.1-only AND BSD-3-Clause AND MIT AND LicenseRef-Public-Domain, according to package metadata |
| openslide-bin | 4.0.0.8 | LGPL-2.1; bundled native component notices also apply |
| TotalSegmentator | 2.12.0 | Apache-2.0 code; only the openly licensed `total` model is used |
| nnU-Net v2 | 2.8.1 | Apache-2.0; TotalSegmentator execution |
| nnU-Net v1 | 1.7.1 | Apache-2.0; Stanford MIMI model execution |
| MedPy, a transitive nnU-Net dependency | 0.5.2 | GPL, as declared by the installed package; consult its complete licence text when distributing an environment |
| TotalSegmentator total, 3 mm | Official v2.0.0-weights, Dataset297 | Apache-2.0 model, separately downloaded |
| Stanford MIMI multilevel muscle/adipose tissue | v0.0.2; `8263e675956f871f37dbe0a4f698069efa8cf38e` | Apache-2.0 according to the model repository metadata; separately downloaded |

The model source URLs and measured SHA-256 values are pinned in `inference/download_advanced_models.py` and `inference/advanced_models.py`. The local integration adds HTTP job handling, bounded inputs, in-memory configuration, disabled telemetry, offline model adapters, an L3 slab workflow, display labels, measurements and versioned human review. The nnU-Net v1 adapter uses its public preprocessing, prediction and export methods in a single process for macOS compatibility; no upstream source file is overwritten.

The Stanford model label schema is remapped to the documented Leletív tissue schema. Muscle voxels in the adipose HU range are counted as intermuscular adipose tissue; muscle area is restricted to −29…150 HU. These integration choices require independent clinical validation.

TotalSegmentator's separately licensed commercial tasks, including its `tissue_types` and `tissue_4_types` models, are not used. Paid Siemens, FUJIFILM, MIM, Aiforia and Olea products were feature references only; their code, models and proprietary assets are not included.

Redistribution of a packaged Python/native environment has additional obligations, including the applicable GPL/LGPL notices and source availability requirements. The source repository's Apache-2.0 licence does not relicense those components. This inventory is not a complete transitive licence audit or a guarantee against legal claims.

Sources: [TotalSegmentator](https://github.com/wasserth/TotalSegmentator), [nnU-Net](https://github.com/MIC-DKFZ/nnUNet), [Stanford MIMI Comp2Comp](https://github.com/StanfordMIMI/Comp2Comp), [model repository](https://huggingface.co/stanfordmimi/multilevel_muscle_adipose_tissue), [OpenSlide](https://openslide.org/), [SimpleITK](https://simpleitk.org/), [scikit-image](https://scikit-image.org/).
