import {localize as l,useLanguage,setLanguage} from '../lib/i18n';
import { Brain, CaretDown, ChartDonut, CirclesFour, FirstAidKit, FolderUser, Heartbeat, ListChecks, MagnifyingGlass, SidebarSimple, UsersThree, X } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {DemoGuide} from './DemoGuide';
import { WorkspaceHelp } from './WorkspaceHelp';
import { useAppData } from '../lib/workspace';

const navigation = [
  { label: "Kvantitatív munkatér", to: "/advanced", icon: Brain },
  { label: "Vizsgálatok összehasonlítása", to: "/compare", icon: Brain },
  { label: "Döntéstől az eredményig", to: "/care", icon: ListChecks },
  { label: "Overview", to: "/", icon: CirclesFour },
  { label: "Patient pathways", to: "/cases", icon: FolderUser },
  { label: "Tumour board", to: "/board", icon: UsersThree },
  { label: "Imaging workspace", to: "/imaging", icon: Brain },
  { label: "Task coordination", to: "/tasks", icon: ListChecks },
  { label: "Evidence & follow-up", to: "/review", icon: FolderUser },
  { label: "Operations", to: "/operations", icon: ChartDonut },
  { label: "Capacity lab", to: "/scenarios", icon: CirclesFour },
  { label: '3D scan lab', to: '/volume-lab', icon: Brain },
  { label: "Clinical team", to: "/team", icon: FirstAidKit },
] as const;

const routeLabels: Record<string, string> = {
  advanced: "Kvantitatív munkatér", compare: "Vizsgálatok összehasonlítása", care: "Döntéstől az eredményig", cases: "Patient pathways", board: "Tumour board", imaging: "Imaging workspace",
  tasks: "Task coordination", operations: "Operations", team: "Clinical team", scenarios:'Capacity lab', 'volume-lab':'3D scan lab', review:'Evidence & follow-up',
};

export function AppShell({ children }: { children: ReactNode }) {
  const language=useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { data, refreshing, error, reload } = useAppData();
  useEffect(() => { setMobileOpen(false); window.scrollTo({top:0,left:0,behavior:'instant'}); }, [location.pathname]);
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const modifier = event.getModifierState("Meta") || event.getModifierState("Control");
      if (modifier && event.code === "KeyK") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.code === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  useEffect(() => { document.title = `${l(location.pathname === '/' ? 'Overview' : routeLabels[location.pathname.split('/')[1]] ?? 'Case workspace')} · Leletív`; }, [location.pathname, language]);
  const breadcrumb = location.pathname === "/" ? "Operational overview" : routeLabels[location.pathname.split("/")[1]] ?? "Case workspace";
  const results = useMemo(() => {
    if (!data || !query.trim()) return [];
    const needle = query.toLowerCase();
    return data.cases.filter((item) => l(`${item.patient_name} ${item.hospital_id} ${item.working_diagnosis}`).toLowerCase().includes(needle)).slice(0, 6);
  }, [data, query, language]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{l("Skip to content")}</a>
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="navigation-close-row mobile-only">
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label={l("Close navigation")}><X size={20} /></button>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-icon"><Brain size={18} /></span>
          <span><strong>{"Leletív"}</strong><small>{l("Demo workspace")}</small></span>
        </div>
        <button className="command-button" onClick={() => setSearchOpen(true)}>
          <MagnifyingGlass size={18} /><span>{l("Quick search")}</span><kbd>{l("⌘ K")}</kbd>
        </button>
        <nav className="primary-nav" aria-label={l("Primary navigation")}>
          <p className="nav-label">{language === "hu" ? "Napi munka" : "Daily work"}</p>
          {l(navigation.filter(item => ['/', '/cases', '/tasks', '/board', '/care'].includes(item.to)).map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Icon size={20} /><span>{l(label)}</span>
              {l(label === "Task coordination" && data && <em>{l(data.tasks.filter((task) => task.status !== "done").length)}</em>)}
            </NavLink>
          )))}
          <p className="nav-label nav-section">{language === "hu" ? "Képek és leletek" : "Images & reports"}</p>
          {l(navigation.filter(item => ['/imaging', '/volume-lab', '/review', '/compare', '/advanced'].includes(item.to)).map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Icon size={20} /><span>{l(label)}</span>
            </NavLink>
          )))}
          <p className="nav-label nav-section">{language === 'hu' ? 'Szervezés és kapacitás' : 'Team & capacity'}</p>
          {navigation.filter(item => ['/operations', '/scenarios', '/team'].includes(item.to)).map(({label,to,icon:Icon}) => <NavLink key={to} to={to} className={({isActive})=>isActive?'nav-link active':'nav-link'}><Icon size={20}/><span>{l(label)}</span></NavLink>)}
        </nav>
        <div className="sidebar-footer">
          <div className="data-status"><span />{l(error?'Connection needs attention':refreshing?'Refreshing workspace':'Local workspace')}</div>
          <div className="profile-row"><div className="avatar">{l("K")}</div><div><strong>{l("Research user")}</strong><span>{l("Workspace owner")}</span></div></div>
        </div>
      </aside>
      {l(mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label={l("Close navigation")} />)}
      <div className="app-main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label={l("Open navigation")}><SidebarSimple size={21} /></button>
          <strong>{l(breadcrumb)}</strong>
          <div className="topbar-spacer" /><div className="language-switch" role="group" aria-label={language==="hu"?"Felület nyelve":"Interface language"}><button aria-pressed={language==="hu"} onClick={()=>setLanguage("hu")}>HU</button><button aria-pressed={language==="en"} onClick={()=>setLanguage("en")}>EN</button></div><span className="synthetic-badge">{l("Demo workspace")}</span><button className="text-button refresh-button" disabled={refreshing} onClick={()=>void reload()}>{l(refreshing?'Refreshing…':'Refresh')}</button>
        </header>
        <main id="main-content" className="page-content"><WorkspaceHelp key={location.pathname}/><DemoGuide/>{l(children)}</main>
      </div>
      {l(searchOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSearchOpen(false)}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label={l("Quick search")} onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-input">
              <MagnifyingGlass size={21} />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={l("Search patient, ID, or diagnosis")} />
              <kbd>{l("Esc")}</kbd>
            </div>
            <div className="command-results">
              {l(!query && <p className="command-hint">{l("Search across every active synthetic pathway.")}</p>)}
              {l(query && results.length === 0 && <p className="command-hint">{l("No matching cases found.")}</p>)}
              {l(results.map((item) => (
                <button key={item.id} onClick={() => { navigate(`/cases/${item.id}`); setSearchOpen(false); setQuery(""); }}>
                  <span className="result-icon"><FolderUser size={18} /></span>
                  <span><strong>{l(item.patient_name)}</strong><small>{l(item.hospital_id)}{l(" · ")}{l(item.working_diagnosis)}</small></span>
                  <span className="result-arrow">{l("Open")}</span>
                </button>
              )))}
            </div>
          </section>
        </div>
      ))}
    </div>
  );
}
