import numpy as np
import nibabel as nib
import pytest
from engine import validate_inputs, normalize_channels, labels_from_logits, provenance_for, Engine, Cancelled
import threading


def inputs(tmp_path, affine=None):
    result = {}
    for i, name in enumerate(('t1c', 't1', 't2', 'flair')):
        image = nib.Nifti1Image(np.random.default_rng(i).normal(size=(24, 24, 24)).astype('float32'), np.eye(4) if affine is None else affine)
        image.header.set_xyzt_units('mm')
        path = tmp_path / f'{name}.nii'
        nib.save(image, path)
        result[name] = path
    return result


def test_requires_all_four_sequences(tmp_path):
    paths = inputs(tmp_path)
    del paths['flair']
    with pytest.raises(ValueError, match='four'):
        validate_inputs(paths)


def test_rejects_shifted_grid_and_non_mm_spacing(tmp_path):
    paths = inputs(tmp_path)
    other = nib.load(paths['t2'])
    shifted = other.affine.copy()
    shifted[0, 3] = 3
    image = nib.Nifti1Image(other.get_fdata(), shifted, other.header)
    nib.save(image, paths['t2'])
    with pytest.raises(ValueError, match='grid'):
        validate_inputs(paths)
    with pytest.raises(ValueError, match='1 mm'):
        validate_inputs(inputs(tmp_path, np.diag([2, 2, 2, 1])))


def test_order_and_nonzero_normalization(tmp_path):
    data, _, _ = validate_inputs(inputs(tmp_path))
    normalized = normalize_channels(data)
    assert normalized.shape == (4, 24, 24, 24)
    np.testing.assert_allclose(normalized.mean(axis=(1, 2, 3)), 0, atol=1e-6)
    np.testing.assert_allclose(normalized.std(axis=(1, 2, 3)), 1, atol=1e-6)
    constant = np.zeros((4, 24, 24, 24), dtype='float32')
    with pytest.raises(ValueError, match='signal'):
        normalize_channels(constant)


def test_nested_output_priority_matches_bundle():
    logits = np.array([[1, -1, 1, -1], [-1, 1, 1, -1], [1, -1, -1, -1]])
    assert labels_from_logits(logits).tolist() == [4, 2, 1, 0]


def test_provenance_keeps_hashes_not_paths(tmp_path):
    report = provenance_for(inputs(tmp_path), 'research')
    assert report['channelOrder'] == ['t1c', 't1', 't2', 'flair']
    assert len(report['inputs']['t1c']['sha256']) == 64
    assert str(tmp_path) not in str(report)
    assert report['reviewStatus'] == 'unreviewed'


def test_rejects_duplicate_sequences_and_nonfinite_intensities(tmp_path):
    paths = inputs(tmp_path)
    paths['flair'] = paths['t1']
    with pytest.raises(ValueError, match='distinct'):
        validate_inputs(paths)
    paths = inputs(tmp_path)
    image = nib.load(paths['t2'])
    data = image.get_fdata()
    data[0, 0, 0] = np.nan
    nib.save(nib.Nifti1Image(data, image.affine, image.header), paths['t2'])
    with pytest.raises(ValueError, match='finite'):
        validate_inputs(paths)


def test_cancelled_job_never_loads_weights(tmp_path):
    event = threading.Event()
    event.set()
    with pytest.raises(Cancelled):
        Engine().infer(inputs(tmp_path), tmp_path, lambda *_: None, event)


def test_invalid_model_output_never_becomes_negative_finding():
    for value in [np.nan, np.inf, -np.inf]:
        logits = np.zeros((3, 4, 4, 4))
        logits[0, 0, 0, 0] = value
        with pytest.raises(ValueError, match='non-finite'):
            labels_from_logits(logits)


def test_large_finite_signal_normalizes_without_overflow():
    data = np.random.default_rng(1).uniform(-1e30, 1e30, size=(4, 24, 24, 24)).astype('float32')
    normalized = normalize_channels(data)
    assert np.isfinite(normalized).all()
    np.testing.assert_allclose(normalized.std(axis=(1, 2, 3)), 1, atol=1e-5)
