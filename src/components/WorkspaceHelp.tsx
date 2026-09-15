import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';
import { Modal } from './ui';

const guidance: Record<string, [string, string]> = {
  '/': ['Kezdd a nyitott feladatokkal vagy válassz egy betegutat. Az elakadásokat a „Figyelmet igényel” rész mutatja.', 'Start with open tasks or choose a patient pathway. The attention panel shows blockers.'],
  '/cases': ['Keress név vagy azonosító alapján, majd nyisd meg a betegutat. Ott találod a feladatokat, előfeltételeket és az átadási összefoglalót.', 'Search by name or ID, then open a pathway for tasks, requirements and its handoff brief.'],
  '/board': ['Válassz egy esetet, ellenőrizd az előfeltételeket, majd rögzítsd az onkoteam döntését.', 'Choose a case, review its requirements, then record the board decision.'],
  '/care': ['Válassz esetet, majd rögzíts végrehajtási lépést vagy várt vizsgálatot. A Kész feladat után külön rögzítsd az eredmény ellenőrzését.', 'Choose a case, add a decision step or expected exam, then record a separate result review.'],
  '/compare': ['Nyisd meg a kiinduló és kontrollfelvételt, majd a hozzájuk tartozó maszkokat. Ellenőrizd az anatómiai illesztést a szinkronizálás és változástérkép előtt.', 'Open baseline and follow-up scans and masks. Verify anatomical registration before synchronizing or exporting a difference map.'],
  '/tasks': ['Szűrd a feladatokat, válassz felelőst és állapotot. A módosítások automatikusan mentődnek.', 'Filter tasks, then choose an owner and status. Changes save automatically.'],
  '/imaging': ['Válassz egy felvételt az archívumból. Új fájlt a feltöltéssel adhatsz hozzá; térfogati megtekintéshez nyisd meg a 3D képi munkateret.', 'Select an archived study or upload a file. Open the 3D workspace to inspect a volume.'],
  '/volume-lab': ['Nyiss meg egy térfogati felvételt, vagy válaszd a JPG / PNG szeletekből történő összeállítást. A metszetnézetek és a 3D nézet között a kép felett válthatsz.', 'Open a volume or build one from JPG / PNG slices. Switch between slices and 3D above the viewer.'],
  '/review': ['Először válassz esetet. A füleken sorban ellenőrizheted a forrásokat, követheted a méréseket és rögzítheted az utánkövetést.', 'Choose a case first. Use the tabs to review sources, track measurements and record follow-up.'],
  '/operations': ['Tekintsd át az erőforrásokat és a műtéti előkészítést. Egy lehetséges változás hatását a kapacitástervezőben próbálhatod ki.', 'Review resources and surgery readiness. Explore possible changes in the capacity planner.'],
  '/scenarios': ['Állítsd be a kapacitást és a kiesést. Hasonlítsd össze az eredményt az alaphelyzettel, majd mentsd vagy exportáld a forgatókönyvet.', 'Adjust capacity and downtime, compare with the baseline, then save or export the scenario.'],
  '/team': ['Tekintsd át a csapattagokat és a terhelésüket. Feladatot a Feladatkoordináció oldalon rendelhetsz felelőshöz.', 'Review team members and workload. Assign task owners on the task coordination page.'],
};

export function WorkspaceHelp() {
  const hu = useLanguage() === 'hu';
  const { pathname } = useLocation();
  const [pdfOpen, setPdfOpen] = useState(false);
  const guide = guidance[pathname] ?? ['Itt kezelheted az eset adatait és következő lépéseit. A betegút átadási összefoglalója külön, nyomtatható nézetben is elérhető.', 'Manage this case and its next steps. Its handoff brief also has a dedicated printable view.'];
  return <>
    <div className="workspace-tools">
      <details className="workspace-guide"><summary>{hu ? 'Segítség ehhez az oldalhoz' : 'Help with this page'}</summary><p>{guide[hu ? 0 : 1]}</p></details>
      <button className="button secondary" onClick={() => setPdfOpen(true)}>{hu ? 'PDF / nyomtatás' : 'PDF / print'}</button>
    </div>
    {pathname === '/' && <nav className="daily-shortcuts" aria-label={hu ? 'Gyakori teendők' : 'Common tasks'}>
      {[['/cases', 'Betegút megnyitása', 'Open a pathway'], ['/tasks', 'Feladatok kezelése', 'Manage tasks'], ['/review', 'Leletek és kontrollok', 'Reports & follow-up'], ['/volume-lab', 'Képek megnyitása 3D-ben', 'Open images in 3D']].map(([to, label, en]) => <Link key={to} to={to}>{hu ? label : en}<span aria-hidden="true">→</span></Link>)}
    </nav>}
    {pdfOpen && <Modal title={hu ? 'Mentés PDF-ként vagy nyomtatás' : 'Save as PDF or print'} onClose={() => setPdfOpen(false)}>
      <div className="pdf-export-help"><p>{hu ? 'A jelenlegi oldal kiválasztott nézete és szűrt adatai kerülnek a dokumentumba. Más fülek tartalma és a csatolt eredeti fájlok nem részei ennek az exportnak.' : 'The document contains the current view and filtered data. Other tabs and attached source files are not included.'}</p>
      <p>{hu ? 'A következő ablakban válaszd a „Mentés PDF-ként” célhelyet. A nyomtatási előnézetben ellenőrizheted az oldalakat.' : 'Choose “Save as PDF” in the next window. Review the pages in print preview.'}</p>
      <button className="button primary" onClick={() => { setPdfOpen(false); window.setTimeout(() => window.print(), 100); }}>{hu ? 'Nyomtatási előnézet megnyitása' : 'Open print preview'}</button></div>
    </Modal>}
  </>;
}
