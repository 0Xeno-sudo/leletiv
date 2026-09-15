"""Five local quantitative workflows; outputs remain reviewable research results."""
from pathlib import Path
import json, math, time, subprocess, sys, os, signal
import numpy as np
import nibabel as nib
from scipy import ndimage
from scipy.optimize import linear_sum_assignment
from scipy.spatial import ConvexHull, distance
from PIL import Image, ImageDraw
from engine import InputError, Cancelled
from advanced_io import load_volume, load_mask, save_volume, resample, same_grid, digest, finite_number


def check(cancel):
    if cancel.is_set():
        raise Cancelled()


def artifact(name, label, kind='volume', **extra):
    return {'file': name, 'label': label, 'kind': kind, **extra}


def sitk_image(data, affine):
    import SimpleITK as sitk
    image = sitk.GetImageFromArray(data.transpose(2, 1, 0).astype(np.float32))
    spacing = np.linalg.norm(affine[:3, :3], axis=0)
    direction = affine[:3, :3] / spacing
    if not np.allclose(direction.T @ direction, np.eye(3), atol=1e-4):
        raise InputError('A felvétel térbeli torzulása miatt az illesztés nem végezhető el; előzetes képi korrekció szükséges.')
    # Both images use the same RAS physical convention inside this isolated computation.
    image.SetSpacing(spacing.tolist()); image.SetDirection(direction.ravel().tolist()); image.SetOrigin(affine[:3, 3].tolist())
    return image


def register(fixed, fa, moving, ma, cancel, mask=None, mask_order=0):
    import SimpleITK as sitk
    if fixed.std() < 1e-6 or moving.std() < 1e-6:
        raise InputError('Konstans képek nem illeszthetők.')
    f, m = sitk_image(fixed, fa), sitk_image(moving, ma)
    method = sitk.ImageRegistrationMethod()
    method.SetNumberOfThreads(2)
    method.SetMetricAsMattesMutualInformation(40)
    method.SetMetricSamplingStrategy(method.REGULAR); method.SetMetricSamplingPercentage(.3, 1729)
    method.SetInterpolator(sitk.sitkLinear)
    method.SetOptimizerAsRegularStepGradientDescent(1.5, .005, 160, .5)
    method.SetOptimizerScalesFromPhysicalShift()
    method.SetShrinkFactorsPerLevel([4, 2, 1]); method.SetSmoothingSigmasPerLevel([2, 1, 0]); method.SmoothingSigmasAreSpecifiedInPhysicalUnitsOn()
    initial = sitk.CenteredTransformInitializer(f, m, sitk.Euler3DTransform(), sitk.CenteredTransformInitializerFilter.GEOMETRY)
    method.SetInitialTransform(initial, inPlace=False)
    method.AddCommand(sitk.sitkIterationEvent, lambda: method.StopRegistration() if cancel.is_set() else None)
    transform = method.Execute(f, m)
    check(cancel)
    aligned = sitk.GetArrayFromImage(sitk.Resample(m, f, transform, sitk.sitkLinear, 0)).transpose(2, 1, 0)
    coverage = sitk.GetArrayFromImage(sitk.Resample(sitk_image(np.ones(moving.shape), ma), f, transform, sitk.sitkNearestNeighbor, 0)).transpose(2, 1, 0) > .5
    if coverage.mean() < .35:
        raise InputError('Az illesztés után túl kicsi a közös látómező. Nem készült összehasonlítható eredmény.')
    aligned_mask = None
    if mask is not None:
        aligned_mask = sitk.GetArrayFromImage(sitk.Resample(sitk_image(mask, ma), f, transform, sitk.sitkNearestNeighbor if mask_order==0 else sitk.sitkLinear, 0)).transpose(2, 1, 0).astype(np.uint16 if mask_order==0 else np.float32)
    meta = {'method': 'SimpleITK rigid / Mattes mutual information', 'metric': float(method.GetMetricValue()), 'coverageFraction': float(coverage.mean()), 'parameters': list(transform.GetParameters()), 'fixedParameters': list(transform.GetFixedParameters()), 'direction': 'reference RAS mm to moving RAS mm', 'reviewRequired': True}
    return aligned, aligned_mask, meta


def label_stats(mask, affine, diameters=True):
    spacing = np.linalg.norm(affine[:3, :3], axis=0)
    result = []
    labels = np.unique(mask); labels = labels[labels > 0]
    if len(labels) > 500:
        raise InputError('Legfeljebb 500 külön régió támogatott.')
    for label in labels:
        pts = np.argwhere(mask == label)
        longest = 0.
        for z in (np.unique(pts[:, 2]) if diameters else []):
            plane = pts[pts[:, 2] == z, :2] * spacing[:2]
            if len(plane) > 2:
                try:
                    hull = plane[ConvexHull(plane).vertices]
                    longest = max(longest, float(distance.pdist(hull).max()))
                except Exception:
                    longest = max(longest, float(np.ptp(plane, axis=0).max()))
        result.append({'label': int(label), 'voxels': len(pts), 'volumeMl': float(len(pts) * abs(np.linalg.det(affine[:3, :3])) / 1000), 'centerRasMm': (affine @ np.r_[pts.mean(axis=0), 1])[:3].tolist(), 'maxInPlaneDiameterMm': longest})
    return result


def pair_labels(base, follow, affine, max_distance=30):
    a, b = label_stats(base, affine), label_stats(follow, affine)
    pairs = []
    if a and b:
        distances = distance.cdist([x['centerRasMm'] for x in a], [x['centerRasMm'] for x in b])
        # Gated assignment with dummy unmatched columns prevents implausible pairs stealing valid matches.
        costs = np.full((len(a), len(b) + len(a)), max_distance + 1.)
        costs[:, :len(b)] = np.where(distances <= max_distance, distances, 1e6)
        rows, cols = linear_sum_assignment(costs)
        for i, j in zip(rows, cols):
            if j < len(b) and distances[i, j] <= max_distance:
                pairs.append({'baselineLabel': a[i]['label'], 'followupLabel': b[j]['label'], 'distanceMm': float(distances[i,j]), 'status': 'proposed'})
    matched_a = {p['baselineLabel'] for p in pairs}; matched_b = {p['followupLabel'] for p in pairs}
    return {'pairs': pairs, 'unmatchedBaseline': [x['label'] for x in a if x['label'] not in matched_a], 'unmatchedFollowup': [x['label'] for x in b if x['label'] not in matched_b]}


def longitudinal(paths, options, out, progress, cancel):
    base, affine, _ = load_volume(paths['baseline']); mask = load_mask(paths['baseline_mask'], base, affine)
    if not np.any(mask): raise InputError('A kiinduló maszkon legalább egy jelölt régió szükséges.')
    baseline = label_stats(mask, affine)
    artifacts = [artifact(save_volume(out, 'reference', base, affine), 'Kiinduló kép'), artifact(save_volume(out, 'reference-mask', mask, affine), 'Kiinduló régiók', overlay=True)]
    visits = []
    for i in range(1, 5):
        key = f'followup{i}'
        if key not in paths: continue
        check(cancel); progress(10 + i * 17, f'{i}. kontroll automatikus illesztése')
        data, ma, _ = load_volume(paths[key]); mm = load_mask(paths[key + '_mask'], data, ma)
        aligned, aligned_mask, registration = register(base, affine, data, ma, cancel, mm)
        pair = pair_labels(mask, aligned_mask, affine, finite_number(options, 'pairDistanceMm', 1, 100, 30))
        # Measure native masks: resampling must not alter longitudinal volume measurements.
        native_stats = label_stats(mm, ma)
        visits.append({'index': i, 'date': options.get('date'+str(i), ''), 'registration': registration, 'assignment':pair,'matching':pair['pairs']+[{'baselineLabel':label,'followupLabel':None} for label in pair['unmatchedBaseline']], 'regions': native_stats})
        artifacts.extend([artifact(save_volume(out, key, aligned, affine), f'{i}. illesztett kontroll'), artifact(save_volume(out, key+'-mask', aligned_mask, affine), f'{i}. kontrollrégiók', overlay=True)])
        diff = np.where((mask > 0) & (aligned_mask > 0), 1, np.where(aligned_mask > 0, 2, np.where(mask > 0, 3, 0))).astype(np.uint8)
        artifacts.append(artifact(save_volume(out, key+'-change', diff, affine), f'{i}. változástérkép', overlay=True))
    if not visits: raise InputError('Legalább egy kontrollkép és hozzá tartozó maszk szükséges.')
    return {'baseline': baseline, 'visits': visits, 'artifacts': artifacts, 'method': 'Rigid registration + gated spatial assignment; native-grid volumetry', 'limitations': ['A párosítás javaslat; a nem párosított régió nem automatikusan új vagy eltűnt daganat.', 'A vetített átmérő képi mérés, nem automatikusan megfelelő RECIST-mérés.', 'Az illesztést és az elváltozásazonosságot ellenőrizni kell.']}


def recist_assessment(payload):
    rows = payload.get('targets', [])
    if not 1 <= len(rows) <= 5: raise InputError('RECIST: 1–5 kiválasztott célelváltozás szükséges.')
    organs = {}; baseline = []; visits = []
    for row in rows:
        organ = str(row.get('organ', '')).strip()
        if not organ: raise InputError('Minden célelváltozáshoz szervet kell megadni.')
        organs[organ] = organs.get(organ, 0) + 1
        if organs[organ] > 2: raise InputError('Szervenként legfeljebb két célelváltozás választható.')
        node = row.get('lymphNode', False)
        b = finite_number(row, 'baselineMm', 15 if node else 10, 1000)
        vals = row.get('followupMm', [])
        if not isinstance(vals, list) or not 1 <= len(vals) <= 4: raise InputError('Kontrollmérések szükségesek.')
        nums = [finite_number({'v': v}, 'v', 0, 1000) for v in vals]
        if visits and len(nums) != len(visits[0]): raise InputError('Az időpontok száma eltér.')
        baseline.append(b); visits.append(nums)
    statuses = payload.get('nonTarget', []); new = payload.get('newLesions', [])
    count = len(visits[0])
    if len(statuses) != count or len(new) != count or any(x not in ['absent', 'present', 'progression', 'not-assessed'] for x in statuses) or any(x not in ['yes', 'no', 'uncertain'] for x in new):
        raise InputError('Minden időponthoz értékelje a nem célelváltozásokat és az új elváltozásokat.')
    total0 = sum(baseline); nadir = total0; result = []
    for i in range(count):
        vals = [v[i] for v in visits]; total = sum(vals)
        change = (total / total0 - 1) * 100
        nd = (total / nadir - 1) * 100 if nadir > 0 else None
        complete = all(v < 10 if r.get('lymphNode') else v == 0 for r,v in zip(rows,vals))
        target = 'CR' if complete else 'PD' if ((nadir == 0 and total >= 5) or (nadir > 0 and total >= nadir * 1.2 and total - nadir >= 5)) else 'PR' if total <= total0 * .7 + 1e-9 else 'SD'
        overall = 'PD' if new[i] == 'yes' or statuses[i] == 'progression' or target == 'PD' else 'NE' if new[i] == 'uncertain' or statuses[i] == 'not-assessed' else 'CR' if target == 'CR' and statuses[i] == 'absent' else 'PR' if target in ['CR','PR'] else 'SD'
        result.append({'visit':i+1,'sumMm':total,'baselineChangePercent':change,'nadirBeforeMm':nadir,'nadirChangePercent':nd,'targetResponse':target,'overallResponse':overall})
        nadir=min(nadir,total)
    return {'criteria':'RECIST 1.1 worksheet', 'visits':result, 'diagnosticUse':False, 'limitations':'Nem RANO/iRECIST; nem ellenőrzi a modalitás, szeletvastagság, korábban besugárzott régió és vizsgálati protokoll alkalmasságát. Orvosi ellenőrzés kötelező.'}


def run_subprocess(script,source,target,cancel):
    proc=subprocess.Popen([sys.executable,str(Path(__file__).with_name(script)),str(source),str(target)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
    while proc.poll() is None:
        if cancel.wait(.3):
            os.killpg(proc.pid,signal.SIGTERM)
            try: proc.wait(timeout=8)
            except subprocess.TimeoutExpired: os.killpg(proc.pid,signal.SIGKILL);proc.wait()
            raise Cancelled()
    if proc.returncode: raise InputError('A helyi szerv- vagy szövetmodell nem futtatható. Ellenőrizze a telepítést és a modellsúlyokat; saját teljes szövetmaszk is importálható.')


def body(paths, options, out, progress, cancel):
    data, affine, meta = load_volume(paths['ct'])
    native_data,native_affine=data,affine
    canonical=nib.as_closest_canonical(nib.Nifti1Image(data,affine))
    data,affine=canonical.get_fdata(dtype=np.float32),canonical.affine
    if not np.allclose(affine[:3,:3],np.diag(np.diag(affine[:3,:3])),atol=1e-3):
        raise InputError('Az L3-méréshez orthogonalis axialis CT szükséges; oblique sorozatot előbb reformáljon.')
    if meta.get('modality') not in (None, 'CT') or options.get('huConfirmed') is not True:
        raise InputError('HU-kalibrált CT megerősítése szükséges.')
    artifacts = [artifact(save_volume(out, 'reference', data, affine), 'CT-forrás')]
    if 'organs' in paths:
        mask = resample(load_mask(paths['organs'], native_data, native_affine),native_affine,data.shape,affine,0).astype(np.uint16); method = 'Imported TotalSegmentator total label map'
    else:
        progress(15, 'Helyi anatómiai modell futtatása')
        run_subprocess('body_model.py',Path(out)/'reference.nii.gz',Path(out)/'organs.nii.gz',cancel)
        mask = load_mask(Path(out)/'organs.nii.gz', data, affine); method = 'TotalSegmentator total / fast CPU'
    progress(80, 'Anatómiai térfogatok és L3-mérések')
    try:
        from totalsegmentator.map_to_binary import class_map
        names = class_map['total']
    except ImportError:
        raise InputError('A TotalSegmentator címkeszótár telepítése szükséges.')
    regions = label_stats(mask, affine, False)
    for region in regions: region['name'] = names.get(region['label'], f"Régió {region['label']}")
    artifacts.append(artifact(save_volume(out, 'organs', mask, affine), 'Anatómiai címkék', overlay=True))
    # L3 selection follows the actual label dictionary, not a guessed slice number.
    l3id = next((k for k,v in names.items() if v == 'vertebrae_L3'), None)
    pts = np.argwhere(mask == l3id) if l3id is not None else np.empty((0,3))
    composition = None
    if len(pts):
        z = int(np.round(np.median(pts[:,2]))); area = float(np.linalg.norm(np.cross(affine[:3,0],affine[:3,1]))/100)
        muscles = [k for k,v in names.items() if any(x in v for x in ['iliopsoas','autochthon'])]
        muscle = np.isin(mask[:,:,z],muscles) & (data[:,:,z] >= -29) & (data[:,:,z] <= 150)
        muscle_area = float(muscle.sum()*area)
        composition = {'sliceIndex':z,'method':'Selected labelled paraspinal/iliopsoas muscles at L3; not total skeletal muscle index','selectedMuscleAreaCm2':muscle_area,'selectedMuscleMeanHu':float(data[:,:,z][muscle].mean()) if muscle.any() else None,'fatRangeAreaCm2':float(((data[:,:,z]>=-190)&(data[:,:,z]<=-30)).sum()*area)}
        if 'tissue' in paths:
            tissue = resample(load_mask(paths['tissue'],native_data,native_affine),native_affine,data.shape,affine,0).astype(np.uint16)
            if np.any(tissue>4): raise InputError('A szövetmaszk csak 0–4 címkéket tartalmazhat.')
            tissue_method='Importált teljes szövetmaszk'
        else:
            progress(85,'Helyi L3 izom- és zsírszövetmodell')
            lo=max(0,min(z-1,data.shape[2]-3)); slab=data[:,:,lo:lo+3]
            sa=affine.copy();sa[:3,3]=(affine@np.array([0,0,lo,1]))[:3]
            source=Path(out)/save_volume(out,'l3-input',slab,sa);target=Path(out)/'l3-prediction.nii.gz'
            run_subprocess('composition_model.py',source,target,cancel)
            local=load_mask(target,slab,sa);tissue=np.zeros(data.shape,np.uint16);tissue[:,:,lo:lo+3]=local
            tissue_method='Stanford MIMI v0.0.2; automatikus L3 szövetmaszk, ellenőrzendő'
        if tissue is not None:
            # Documented imported tissue schema: 1=all skeletal muscle,2=VAT,3=SAT.
            muscle_labels=tissue==1
            tissue[muscle_labels&(data>=-190)&(data<=-30)]=4
            tissue[muscle_labels&((data < -190)|(data>150))]=0
            m=(tissue[:,:,z]==1)&(data[:,:,z]>=-29)&(data[:,:,z]<=150); h=finite_number(options,'heightCm',80,250)/100
            composition.update(method=tissue_method,muscleMeanHu=float(data[:,:,z][m].mean()) if m.any() else None,intermuscularFatAreaCm2=float((tissue[:,:,z]==4).sum()*area),totalMuscleAreaCm2=float(m.sum()*area), skeletalMuscleIndexCm2M2=float(m.sum()*area/h**2), visceralFatAreaCm2=float((tissue[:,:,z]==2).sum()*area), subcutaneousFatAreaCm2=float((tissue[:,:,z]==3).sum()*area))
            artifacts.append(artifact(save_volume(out,'tissue',tissue,affine),'Testösszetételi maszk',overlay=True))
    return {'method':method,'regions':regions,'composition':composition,'artifacts':artifacts,'limitations':['A szervmaszk nem daganatdetektálás.', 'Az L3 szintjét és a teljes izom-/zsírmaszkot ellenőrizni kell; az index a megadott testmagasságból számolódik.', 'Az izomtömeg és a HU-mérés önmagában nem szarkopéniadiagnózis.']}


def pet(paths, options, out, progress, cancel):
    ct, affine, _ = load_volume(paths['ct']); pet_data, pa, meta = load_volume(paths['pet'])
    mode = options.get('petUnits')
    if mode not in ['SUVbw','BQML']: raise InputError('Adja meg a PET mennyiségi egységét.')
    if meta.get('format') == 'DICOM' and meta.get('units') not in (mode, 'GML' if mode=='SUVbw' else 'BQML'):
        raise InputError('A megadott egység nem egyezik a DICOM Units értékével.')
    if mode=='BQML':
        weight=finite_number(options,'weightKg',1,400); dose=finite_number(options,'injectedMbq',.01,5000)*1e6
        half=finite_number(options,'halfLifeMin',.1,100000); elapsed=finite_number(options,'elapsedMin',0,10000)
        if options.get('decayReference') != 'scan-start': raise InputError('A BQML-értékeknek a vizsgálat kezdetére korrigáltnak kell lenniük.')
        effective=dose*2**(-elapsed/half)
        if effective<1: raise InputError('Érvénytelen bomláskorrigált aktivitás.')
        suv=pet_data*weight*1000/effective
    else: suv=pet_data
    if suv.min()<0 or suv.max()>1000: raise InputError('Érvénytelen SUV-tartomány; ellenőrizze a kalibrációt.')
    if options.get('alignmentConfirmed') is not True: raise InputError('A PET/CT közös térbeli koordinátarendszerét ellenőrizni kell.')
    progress(35,'PET/CT fúzió és régióképzés'); check(cancel)
    coverage=resample(np.ones(pet_data.shape,np.uint8),pa,ct.shape,affine,0)
    if not np.any(coverage): raise InputError('A PET és CT látómezeje nem fedi egymást; ellenőrizze a geometriát.')
    overlay=resample(suv,pa,ct.shape,affine)
    artifacts=[artifact(save_volume(out,'reference',ct,affine),'CT'),artifact(save_volume(out,'pet-suv',overlay.astype(np.float32),affine),'SUVbw aktivitás',overlay=True,colormap='hot')]
    threshold=finite_number(options,'suvThreshold',.1,100,2.5)
    if 'mask' in paths:
        mask=load_mask(paths['mask'],pet_data,pa); method='Imported reviewed-region candidates on native PET grid'
    else:
        labels,n=ndimage.label(suv>=threshold)
        counts=np.bincount(labels.ravel()); minimum=finite_number(options,'minimumMl',.01,1000,.1)*1000/abs(np.linalg.det(pa[:3,:3]))
        keep=np.where(counts>=minimum)[0]; keep=keep[keep>0]
        if len(keep)>500: raise InputError('Túl sok aktivitásrégió. Emelje a küszöböt vagy a minimális térfogatot.')
        mask=np.zeros(labels.shape,np.uint16)
        for i,label in enumerate(keep,1): mask[labels==label]=i
        method='SUV threshold connected components; includes physiological uptake'
    regions=label_stats(mask,pa,False)
    for region in regions:
        values=suv[mask==region['label']]
        region.update(suvMean=float(values.mean()),suvMax=float(values.max()),tlg=float(values.mean()*region['volumeMl']) if options.get('tracer')=='FDG' else None, included=False)
    artifacts.append(artifact(save_volume(out,'pet-regions',resample(mask,pa,ct.shape,affine,0).astype(np.uint16),affine),'Aktivitásrégiók',overlay=True))
    return {'method':method,'tracer':options.get('tracer','unspecified'),'thresholdSuv':threshold,'regions':regions,'artifacts':artifacts,'limitations':['A küszöbölés élettani aktivitást is kijelöl. Csak ellenőrzött régiókból összegezhető tumorterhelés.', 'Nem PERCIST és nem automatikus stádiummeghatározás.', 'SUVbw, nem SUL; a vizsgálatok kalibrációja és protokollja külön ellenőrizendő.']}


def pathology(paths, options, out, progress, cancel):
    from skimage.color import rgb2hed
    from skimage.feature import peak_local_max
    from skimage.segmentation import watershed
    from skimage.measure import regionprops
    path=paths['slide']; suffix=Path(path).suffix.lower()
    mpp=finite_number(options,'micronsPerPixel',.05,20)
    x=int(finite_number(options,'roiX',0,200000,0)); y=int(finite_number(options,'roiY',0,200000,0))
    width=int(finite_number(options,'roiWidth',32,4096,1024)); height=int(finite_number(options,'roiHeight',32,4096,1024))
    cropped=False
    if suffix in ['.svs','.ndpi','.tiff','.tif']:
        import openslide
        try:
            slide=openslide.OpenSlide(str(path))
            try:
                if x+width>slide.dimensions[0] or y+height>slide.dimensions[1]: raise InputError('A kijelölt régió túlnyúlik a metszeten.')
                image=slide.read_region((x,y),0,(width,height)).convert('RGB');cropped=True
            finally: slide.close()
        except openslide.OpenSlideUnsupportedFormatError: pass
    if not cropped:
        with Image.open(path) as source:
            if source.width*source.height>64_000_000: raise InputError('Túl nagy raszterkép. WSI vagy kisebb kivágat szükséges.')
            if x+width>source.width or y+height>source.height: raise InputError('A régió meghaladja a kép méretét.')
            image=source.crop((x,y,x+width,y+height)).convert('RGB')
    if options.get('tumorRoiConfirmed') is not True: raise InputError('A daganatot tartalmazó vizsgálati régiót szakértőnek kell kijelölnie.')
    progress(35,'Festékszétválasztás és sejtmag-szegmentálás'); check(cancel)
    rgb=np.asarray(image); hed=rgb2hed(rgb)
    signal=np.maximum(hed[:,:,0],hed[:,:,2]); threshold=finite_number(options,'nucleusThreshold',.005,2,.035)
    binary=ndimage.binary_fill_holes(ndimage.gaussian_filter(signal,1)>threshold)
    dist=ndimage.distance_transform_edt(binary)
    peaks=peak_local_max(dist,min_distance=max(1,int(3/mpp)),labels=binary)
    markers=np.zeros(binary.shape,np.int32)
    for i,(yy,xx) in enumerate(peaks,1): markers[yy,xx]=i
    labels=watershed(-dist,markers,mask=binary)
    dab=finite_number(options,'dabThreshold',.005,2,.08)
    minimum=finite_number(options,'minNucleusArea',1,500,12); maximum=finite_number(options,'maxNucleusArea',minimum,2000,200)
    overlay=image.copy(); draw=ImageDraw.Draw(overlay); cells=[]
    for prop in regionprops(labels,intensity_image=hed[:,:,2]):
        if not minimum<=prop.area*mpp*mpp<=maximum: continue
        positive=float(prop.mean_intensity)>=dab; yy,xx=prop.centroid
        cells.append({'id':len(cells)+1,'x':float(xx+x),'y':float(yy+y),'areaUm2':float(prop.area*mpp*mpp),'dabOpticalDensity':float(prop.mean_intensity),'positive':positive,'excluded':False})
        draw.ellipse((xx-3,yy-3,xx+3,yy+3),outline='#d83838' if positive else '#1678b8',width=2)
        if len(cells)>25000: raise InputError('Túl sok sejt egy régióban; válasszon kisebb területet.')
    image.save(Path(out)/'slide.png'); overlay.save(Path(out)/'cells.png')
    positive=sum(c['positive'] for c in cells)
    return {'method':'HED colour deconvolution + watershed nuclei + DAB threshold (deterministic, not a trained cancer detector)','cells':cells,'summary':{'cells':len(cells),'positive':positive,'positivePercent':100*positive/len(cells) if cells else None},'roi':{'x':x,'y':y,'width':width,'height':height,'micronsPerPixel':mpp},'artifacts':[artifact('slide.png','Vizsgált régió','image'),artifact('cells.png','Piros: pozitív; kék: negatív sejtmag','image')],'limitations':['Csak kijelölt régió; nem a teljes metszet automatikus daganatkeresése.', 'A festés, küszöbök és sejtbesorolás patológusi ellenőrzést igényelnek.', 'A mért pozitív arány nem automatikusan hitelesített Ki-67-index.']}


def adc_from_dwi(data,bvals):
    b=np.asarray(bvals,float)
    if data.ndim!=4 or len(b)!=data.shape[3] or len(b)<2 or len(np.unique(b))<2 or not np.isfinite(b).all() or b.min()<0 or b.max()>10000:
        raise InputError('A DWI-képkockákhoz azonos számú, legalább két eltérő b-érték kell (s/mm²).')
    valid=(data>0).all(axis=3)
    centered=b-b.mean(); log=np.log(np.maximum(data,1e-8))
    adc=-np.sum(log*centered,axis=3)/np.sum(centered**2)
    valid &= (adc>=0)&(adc<=.01)
    return np.where(valid,adc,0).astype(np.float32),valid


def mri(paths, options, out, progress, cancel):
    if options.get('alignmentConfirmed') is not True: raise InputError('A közös fizikai koordinátarendszer megerősítése szükséges.')
    reference,affine,_=load_volume(paths['reference']); artifacts=[artifact(save_volume(out,'reference',reference,affine),'Anatómiai MR')]; maps={}; quality={}
    if 'dwi' in paths:
        dwi,da,_=load_volume(paths['dwi'],(4,)); bvals=options.get('bValues',[])
        # DWI registration across b-values can bias ADC; require motion-corrected input.
        if options.get('motionCorrected') is not True: raise InputError('A DWI/DSC sorozatok mozgáskorrekcióját előzetesen ellenőrizni kell.')
        adc,valid=adc_from_dwi(dwi,bvals)
        if options.get('registerSequences') is True:
            _,aligned,registration=register(reference,affine,dwi[:,:,:,int(np.argmin(bvals))],da,cancel,adc,1)
            maps['ADC']=aligned;quality['dwiRegistration']=json.dumps(registration)
        else: maps['ADC']=resample(adc,da,reference.shape,affine)
        quality['adcValidFraction']=float(valid.mean()); quality['adcUnits']='mm²/s; monoexponential fit'
    elif 'adc' in paths:
        data,da,_=load_volume(paths['adc']); factor=finite_number(options,'adcScale',1e-9,1,1)
        if np.any(data<0) or np.max(data*factor)>.1: raise InputError('Hibás ADC-egység vagy értéktartomány.')
        maps['ADC']=resample(data*factor,da,reference.shape,affine)
    progress(45,'Diffúziós és perfúziós térképek'); check(cancel)
    if 'dsc' in paths:
        if options.get('motionCorrected') is not True: raise InputError('Mozgáskorrigált DSC-sorozat szükséges.')
        dsc,da,_=load_volume(paths['dsc'],(4,)); te=finite_number(options,'echoTimeMs',1,200)/1000; tr=finite_number(options,'timeStepSec',.01,30)
        n=int(finite_number(options,'baselineFrames',2,dsc.shape[3]-2,5)); start=int(finite_number(options,'bolusStart',n,dsc.shape[3]-2,n)); end=int(finite_number(options,'bolusEnd',start+1,dsc.shape[3]-1,dsc.shape[3]-1))
        baseline=dsc[:,:,:,:n].mean(axis=3); valid=(baseline>0)&(dsc>0).all(axis=3)
        delta=-np.log(np.maximum(dsc,1e-8)/np.maximum(baseline[:,:,:,None],1e-8))/te
        integral=np.trapezoid(np.maximum(delta[:,:,:,start:end+1],0),dx=tr,axis=3)
        raw=np.where(valid,integral,0)
        if options.get('registerSequences') is True:
            _,aligned,registration=register(reference,affine,baseline,da,cancel,raw,1)
            maps['DSC-integrál']=aligned;quality['dscRegistration']=json.dumps(registration)
        else: maps['DSC-integrál']=resample(raw,da,reference.shape,affine).astype(np.float32)
        if 'normal_mask' in paths:
            normal=load_mask(paths['normal_mask'],reference,affine)>0; values=maps['DSC-integrál'][normal]
            values=values[values>0]
            if len(values)<10 or values.mean()<1e-6: raise InputError('Érvénytelen normál referencia-régió az rCBV normalizálásához.')
            maps['rCBV']=maps['DSC-integrál']/values.mean()
        quality['dscMethod']='First-pass ΔR2* integral; no leakage correction, not deconvolved CBF/MTT'
    elif 'perfusion' in paths:
        data,da,_=load_volume(paths['perfusion']); maps['Importált perfúzió']=resample(data,da,reference.shape,affine)
    if not maps: raise InputError('Legalább egy ADC/DWI vagy perfúzió/DSC bemenet szükséges.')
    roi=load_mask(paths['roi'],reference,affine) if 'roi' in paths else np.zeros(reference.shape,np.uint16)
    rows=[]
    for i,(name,data) in enumerate(maps.items()):
        artifacts.append(artifact(save_volume(out,f'map-{i}',data.astype(np.float32),affine),name,overlay=True,colormap='hot'))
        for label in np.unique(roi):
            if label==0: continue
            values=data[(roi==label)&(data>0)]
            rows.append({'map':name,'region':int(label),'validVoxels':len(values),'median':float(np.median(values)) if len(values) else None,'p10':float(np.percentile(values,10)) if len(values) else None,'p90':float(np.percentile(values,90)) if len(values) else None})
    if np.any(roi): artifacts.append(artifact(save_volume(out,'roi',roi,affine),'Vizsgálati régiók',overlay=True))
    return {'method':'Multiparametric map fusion; monoexponential ADC; optional first-pass DSC integral','measurements':rows,'quality':quality,'artifacts':artifacts,'limitations':['A térképek ismert közös fizikai térben legyenek; a rácsra mintavételezés nem mozgáskorrekció.', 'A DSC-integrál szivárgáskorrekció nélküli kutatási becslés.', 'Nem automatikus grádus-, progresszió- vagy sugárnekrózis-diagnózis.']}


WORKFLOWS={'longitudinal':longitudinal,'body':body,'pet':pet,'pathology':pathology,'mri':mri}


def run(kind,paths,options,out,progress,cancel):
    start=time.monotonic(); check(cancel)
    result=WORKFLOWS[kind](paths,options,out,progress,cancel)
    check(cancel)
    result.update(schema='leletiv.advanced.v1',kind=kind,diagnosticUse=False,reviewStatus='unreviewed',elapsedSeconds=round(time.monotonic()-start,2),sources={key:{'sha256':digest(path)} for key,path in paths.items()},parameters=options)
    for item in result['artifacts']: item['sha256']=digest(Path(out)/item['file'])
    return result
