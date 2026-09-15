/** Authored fictional teaching cases. Never derived from patient records. */
export const demoCases = [
 {id:'demo-leletiv-01',name:'Szalai Borbála',hospitalId:'DEMO-LV-001',birth:'1978-04-12',sex:'Female',city:'Budapest',pathway:'Neuro-onkológiai kivizsgálás',diagnosis:'Bal frontalis térfoglalás – szövettani diagnózis még nincs',status:'board-ready',priority:'high',progress:76,milestone:'Onkoteam-megbeszélés',region:'Bal frontalis régió',values:[24,25],
 summary:'Kitalált eset: első fokális rosszullét után készült koponya-MR. A bal frontalis eltérés részletes neuroradiológiai áttekintése megtörtént. A klinikai kérdés a további diagnosztikus lépés meghatározása; szövettani eredmény még nem áll rendelkezésre.',
 story:'Beutalás → koponya-MR → neuroradiológiai áttekintés → onkoteam. Rögzíts új döntést, majd alakítsd felelőshöz és határidőhöz kötött feladatokká.',
 decision:'Kiegészítő képértékelés és idegsebészeti konzílium előkészítése; ezt követően ismételt onkoteam-megbeszélés.',task:'Idegsebészeti konzílium összefoglalójának bekérése',exam:'Kiegészítő koponya-MR',examStatus:'scheduled',module:'mri'},
 {id:'demo-leletiv-02',name:'Hegedűs András',hospitalId:'DEMO-LV-002',birth:'1963-11-08',sex:'Male',city:'Székesfehérvár',pathway:'Mellkasi onkológiai kivizsgálás',diagnosis:'Jobb felső lebenyi elváltozás – kivizsgálás alatt',status:'incomplete',priority:'urgent',progress:49,milestone:'Szövettani lelet beérkezése',region:'Jobb felső lebenyi régió',values:[32,31],
 summary:'Kitalált eset: elhúzódó köhögés miatt végzett mellkasi CT jobb felső lebenyi eltérést ír le. A mintavétel megtörtént, a végleges szövettani lelet még hiányzik. A képanyag már rendelkezésre áll; a hiányzó eredmény beérkezését külön kell követni.',
 story:'Mellkasi CT → mintavétel → leletvárás → onkoteam-előkészítés. Próbáld ki a hiányzó lelet követését és a beérkezett eredményhez kapcsolást.',
 decision:'A mintavételi lelet és az elérhető képanyag együttes áttekintése után ismételt multidiszciplináris értékelés.',task:'Végleges szövettani lelet bekérése',exam:'Szövettani feldolgozás eredménye',examStatus:'performed',module:'pet'},
 {id:'demo-leletiv-03',name:'Fodor Júlia',hospitalId:'DEMO-LV-003',birth:'1985-06-21',sex:'Female',city:'Vác',pathway:'Neuro-onkológiai utánkövetés',diagnosis:'Korábban kezelt oligodendroglioma – kontroll',status:'monitoring',priority:'routine',progress:100,milestone:'Következő kontroll megszervezése',region:'Bal parietalis követett régió',values:[12,12],
 summary:'Kitalált eset: korábbi műtéti és onkológiai ellátást követő képalkotó utánkövetés. A két bemutatólelet azonos méretű követett régiót ír le. A kontrollt áttekintették; a következő vizsgálat megszervezése nyitott feladat.',
 story:'Korábbi ellátás → kontroll-MR → lelet-összehasonlítás → eredményellenőrzés → következő kontroll. Kövesd végig a lezárt és a még nyitott teendőket.',
 decision:'A kontroll képanyagának és klinikai összefoglalójának rögzítése, majd a következő kontroll időpontjának egyeztetése.',task:'Következő kontroll időpontjának egyeztetése',exam:'Kontroll koponya-MR',examStatus:'reviewed',module:'longitudinal'},
] as const;
export function demoDate(offset:number,anchor=new Date()) { const d=new Date(anchor);d.setUTCHours(12,0,0,0);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString(); }
export const demoGuides:Record<string,{title:string;try:string;next:string}>={
 '/':{title:'A három demóbeteg napi áttekintése',try:'Nézd meg, melyik eset vár onkoteamre, hol hiányzik lelet, és melyiknél esedékes a következő kontroll.',next:'/cases'},
 '/cases':{title:'Válassz egy végigkövethető betegutat',try:'Nyisd meg a DEMO-LV azonosítójú eseteket. Változtass állapotot, nézd meg a felelősöket, előfeltételeket és a történetet.',next:'/board'},
 '/board':{title:'Próbálj ki egy onkoteam-megbeszélést',try:'Borbála esete döntésre előkészített, Andrásnál még hiányzik a szövettani lelet. Rögzíts döntést, majd nyisd meg a végrehajtási tervet.',next:'/care'},
 '/care':{title:'Döntésből feladat, feladatból ellenőrzött eredmény',try:'Az első tervlépés már ellenőrzött. A következőt állítsd Készre, majd külön rögzítsd az eredményét. A várt vizsgálatot léptesd tovább.',next:'/tasks'},
 '/tasks':{title:'Teszteld a felelősöket és az állapotokat',try:'A demóeset kiválasztásával szűrheted a feladatokat. Jelölj ki felelőst, módosíts állapotot, majd ellenőrizd a betegúton is.',next:'/review'},
 '/review':{title:'Lelettől a követhető kontrollig',try:'Két dátumozott magyar bemutatólelet, pontos forrásidézetek és összevethető mérések várnak. Az utánkövetést is módosíthatod.',next:'/imaging'},
 '/imaging':{title:'Megnyitható képanyag a demóesethez',try:'A két szintetikus térfogati próbakép valódi fájlként az archívumban van. Nyisd meg őket 3D-ben. A próbakép nem a szöveges lelet anatómiai mása.',next:'/volume-lab'},
 '/volume-lab':{title:'Forgatható próbakép és mentett régió',try:'A demóesethez tartozó kép és területkijelölés megnyitható. Forgasd el, válts metszetet, és nézd meg a forráshoz kötött mérési naplót.',next:'/compare'},
 '/compare':{title:'Két időpont, két ismert próbarégió',try:'A demóbeteghez kapcsolt kiinduló és kontroll próbakép automatikusan betöltődik. Ellenőrizd az illesztést, majd nézd meg a változástérképet.',next:'/advanced'},
 '/advanced':{title:'Öt kipróbálható kvantitatív munkafolyamat',try:'A minták generált képeken mutatják a méréseket. Válts modult, indíts mintát, majd ments saját ellenőrzést. Ezek nem a szöveges leletekből származó klinikai eredmények.',next:'/care'},
 '/operations':{title:'Kapacitás és előkészítési hiányok',try:'A demóesetek nyitott feladatai és előfeltételei megjelennek a közös működési áttekintésben. Nézd meg a korlátozott MR-kapacitást.',next:'/scenarios'},
 '/scenarios':{title:'Próbáld ki az MR-kiesés hatását',try:'Nyisd meg a mentett demóforgatókönyvet, változtass az MR-kapacitáson, és ments új változatot. A modell szemléltető szimuláció.',next:'/team'},
 '/team':{title:'Ugyanazok a felelősök a teljes betegúton',try:'A kitalált radiológus, onkológus és koordinátor feladatai itt összegeződnek. A felelős módosítása a Feladatkoordinációban kipróbálható.',next:'/cases'},
};
