# Scan-anchored location pin

The volume viewer supports one yellow location marker per source scan. Select a point in a 2D slice, choose **Pin selected point**, then **View pin in 3D**. Return to pin restores the corresponding crosshairs; Move pin replaces it and Remove pin removes the locally saved marker. All controls have English and Hungarian copy.

## Coordinates and data integrity

- Store a copy of the viewer's normalized volume position, not a canvas pixel or a camera coordinate. The loaded volume's NiiVue affine conversion places the mesh at the corresponding world position. Rotating the camera does not move the saved point.
- A SHA-256 fingerprint of the decompressed source file binds local storage to that exact scan. Same filename or same dimensions do not constitute the same scan. Reopen an uploaded source to restore its pin; the uploaded source bytes themselves are not saved by this feature.
- The marker is an independent yellow mesh. It never modifies source voxels, segmentation labels, masks, region counts or exported segmentation measurements. Its display size is a visual symbol, not a measured lesion size.
- Through-anatomy mode deliberately shows an occluded point. Switch it off for normal depth occlusion; use the slice crosshairs and cutaway for depth context. It is not a tumour-detection or navigation-guidance feature.
- Pins stay on this browser/device. Storage failures produce an explicit warning. Corrupt, unsupported or mismatched saved records are ignored. No external API or keys are involved.

## Implementation references

The installed NiiVue 0.69 interfaces and source were checked alongside [NiiVue's loading documentation](https://niivue.com/docs/loading/) and [viewer API](https://niivue.com/docs/api/niivue/classes/Niivue/). A native mesh is added without using the convenience connectome loader that replaces all meshes.

## Verification (14 September 2026)

- Four focused regression tests cover copied coordinates, fingerprint isolation, corrupt/out-of-range records and marker world coordinates. Full suite: 38 tests in 9 files; TypeScript and production build passed. Existing imaging chunk/externalized-module warnings remain.
- Browser checks: selected a point on the atlas slice, placed the pin at X 26.8 / Y 21.2 / Z 7.1 mm, rotated the 3D brain, returned to slices and reloaded with those coordinates unchanged.
- Verified the internal pin is hidden with through-anatomy disabled. Opened a different synthetic NIfTI through the actual file chooser: no pin; restored the atlas: its pin reappeared.
- Pin removal persisted across reload. A simultaneous demo segmentation remained at 8.85 mL before and after removing the pin. English controls, moving the selected pin, Hungarian controls and the 390-pixel mobile layout were checked; no horizontal page overflow. Test markers were removed after verification.

These are software behavior checks, not clinical accuracy validation.
