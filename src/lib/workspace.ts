import {createContext,useContext} from 'react';
import type {BootstrapPayload,NewCaseInput,RequirementStatus,TaskStatus} from '../shared/types';
export interface DataContextValue {
  data: BootstrapPayload | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  toast: string | null;
  reload: () => Promise<void>;
  addCase: (input: NewCaseInput) => Promise<string>;
  setCaseStatus: (id: string, status: string) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  setTaskOwner: (id: string, owner: string) => Promise<void>;
  setRequirementStatus: (id: string, status: RequirementStatus) => Promise<void>;
  addTask: (input: Record<string, string>) => Promise<void>;
  addDecision: (input: Record<string, string>) => Promise<void>;
  uploadStudy: (form: FormData) => Promise<void>;
}

export const DataContext = createContext<DataContextValue | null>(null);

export function useAppData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useAppData must be used inside App");
  return value;
}
