import {localize as l,useLanguage} from './lib/i18n';
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { apiRequest } from "./lib/api";
import type { BootstrapPayload, NewCaseInput, RequirementStatus, TaskStatus } from "./shared/types";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CasesPage = lazy(() => import("./pages/CasesPage"));
const CaseDetailPage = lazy(() => import("./pages/CaseDetailPage"));
const BoardPage = lazy(() => import("./pages/BoardPage"));
const ImagingPage = lazy(() => import("./pages/ImagingPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const OperationsPage = lazy(() => import("./pages/OperationsPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const ScenarioPage = lazy(() => import('./pages/ScenarioPage'));
const VolumePage = lazy(() => import('./pages/VolumePage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const CarePage = lazy(() => import('./pages/CarePage'));
const BriefPage = lazy(() => import('./pages/BriefPage'));
const AdvancedPage = lazy(() => import('./pages/AdvancedPage'));
const AdvancedReportPage = lazy(() => import('./pages/AdvancedReportPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));

import {DataContext,type DataContextValue} from './lib/workspace';

function PageSkeleton() {
  useLanguage();
  return (
    <div className="page-skeleton" aria-label={l("Loading page")}>
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-subtitle" />
      <div className="skeleton-grid"><div className="skeleton-panel" /><div className="skeleton-panel" /></div>
    </div>
  );
}

export function App() {
  useLanguage();
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const payload = await apiRequest<BootstrapPayload>("/api/bootstrap");
      setData(payload);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load the clinical workspace.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const mutate = useCallback(async (path: string, init: RequestInit, message: string) => {
    try {
      await apiRequest(path, init);
      await reload();
      showToast(message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The update could not be saved.");
      throw requestError;
    }
  }, [reload, showToast]);

  const value = useMemo<DataContextValue>(() => ({
    data,
    loading,
    refreshing,
    error,
    toast,
    reload,
    addCase: async (input) => {
      const result = await apiRequest<{ id: string }>("/api/cases", { method: "POST", body: JSON.stringify(input) });
      await reload();
      showToast("Synthetic case created");
      return result.id;
    },
    setCaseStatus: (id, status) => mutate(`/api/cases/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, "Case status saved"),
    setTaskStatus: (id, status) => mutate(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, "Task status saved"),
    setTaskOwner: (id, owner_id) => mutate(`/api/tasks/${id}/owner`, {method:'PATCH',body:JSON.stringify({owner_id})}, 'Task owner saved'),
    setRequirementStatus: (id, status) => mutate(`/api/requirements/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, "Readiness updated"),
    addTask: (input) => mutate("/api/tasks", { method: "POST", body: JSON.stringify(input) }, "Task added"),
    addDecision: (input) => mutate("/api/decisions", { method: "POST", body: JSON.stringify(input) }, "Board decision recorded"),
    uploadStudy: (form) => mutate("/api/studies/upload", { method: "POST", body: form }, "Study added to archive"),
  }), [data, error, loading, mutate, refreshing, reload, showToast, toast]);

  return (
    <DataContext.Provider value={value}>
      <AppShell>
        {l(error && <div className="error-banner" role="alert"><span>{l(error)}</span><button onClick={() => void reload()}>{l("Try again")}</button></div>)}
        {l(toast && <div className="toast" role="status">{l(toast)}</div>)}
        <Suspense fallback={<PageSkeleton />}>
          {l(loading ? <PageSkeleton /> : <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:caseId" element={<CaseDetailPage />} />
            <Route path="/cases/:caseId/brief" element={<BriefPage />} />
            <Route path="/advanced" element={<AdvancedPage />} />
            <Route path="/advanced/report/:jobId" element={<AdvancedReportPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/care" element={<CarePage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/imaging" element={<ImagingPage />} />
            <Route path="/volume-lab" element={<VolumePage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/scenarios" element={<ScenarioPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>)}
        </Suspense>
      </AppShell>
    </DataContext.Provider>
  );
}
