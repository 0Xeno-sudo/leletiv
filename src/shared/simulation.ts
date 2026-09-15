import type { ClinicalCase } from './types';

export const modelVersion = 'capacity-v1';
export interface ScenarioInput { scanners: number; theatres: number; recoveryBays: number; scannerDelay: number; cohortCopies: number }
export const baselineInput: ScenarioInput = { scanners: 1, theatres: 1, recoveryBays: 2, scannerDelay: 0, cohortCopies: 3 };
export const stages = ['Imaging', 'Theatre', 'Recovery'] as const;
export const horizon = 720;
export interface Segment { stage: number; start: number; end: number; wait: number; slot: number }
export interface SimVisit { id: string; caseId: string; label: string; priority: string; arrival: number; segments: Segment[] }
export interface SimulationResult { visits: SimVisit[]; completed: number; backlog: number; meanWait: number; queueMinutes: number[]; utilization: number[]; finish: number; bottleneck: string }

export function validScenario(value: unknown): value is ScenarioInput {
  if (!value || typeof value !== 'object') return false;
  const s = value as ScenarioInput;
  return [['scanners',1,4],['theatres',1,4],['recoveryBays',1,8],['scannerDelay',0,240],['cohortCopies',1,6]].every(([key,min,max]) => Number.isInteger(s[key as keyof ScenarioInput]) && s[key as keyof ScenarioInput] >= Number(min) && s[key as keyof ScenarioInput] <= Number(max));
}

/** Deterministic queue model. Stage slots release at stage end; no blocking or shared staff. */
export function simulate(cases: Pick<ClinicalCase, 'id'|'patient_name'|'priority'|'status'>[], input: ScenarioInput): SimulationResult {
  if (!validScenario(input)) throw new Error('Invalid scenario assumptions');
  const active = cases.filter(c => c.status !== 'monitoring');
  const rank: Record<string, number> = { urgent: 0, high: 1, routine: 2 };
  const visits: SimVisit[] = Array.from({length: input.cohortCopies}, (_, wave) => active.map((c, index) => ({ id: `${c.id}-${wave}`, caseId: c.id, label: `${c.patient_name}${wave ? ` · demand ${wave+1}` : ''}`, priority:c.priority, arrival:wave*60 + index*10, segments:[] }))).flat();
  const counts = [input.scanners, input.theatres, input.recoveryBays];
  const duration = [45,150,180];
  const utilization = [0,0,0];
  const queueMinutes = [0,0,0];
  stages.forEach((_, stage) => {
    const free = Array(counts[stage]).fill(stage === 0 ? input.scannerDelay : 0) as number[];
    const ready = (v: SimVisit) => stage ? v.segments[stage-1].end : v.arrival;
    const queue = [...visits].sort((a,b)=>ready(a)-ready(b) || rank[a.priority]-rank[b.priority] || a.id.localeCompare(b.id));
    for (const visit of queue) {
      const slot = free.indexOf(Math.min(...free));
      const start = Math.max(free[slot],ready(visit));
      const end = start+duration[stage];
      const wait = start-ready(visit);
      visit.segments.push({stage,start,end,wait,slot});
      free[slot] = end;
      queueMinutes[stage] += wait;
      utilization[stage] += Math.max(0,Math.min(end,horizon)-Math.min(start,horizon));
    }
    utilization[stage] = Math.round(utilization[stage]/(counts[stage]*horizon)*100);
  });
  const completed = visits.filter(v=>v.segments[2].end<=horizon).length;
  return {visits,completed,backlog:visits.length-completed,meanWait: visits.length ? Math.round(queueMinutes.reduce((a,b)=>a+b,0)/visits.length) : 0,queueMinutes,utilization,finish:Math.max(0,...visits.map(v=>v.segments[2].end)),bottleneck:visits.length ? stages[queueMinutes.indexOf(Math.max(...queueMinutes))] : 'None'};
}

export function csv(rows: (string|number)[][]): string {
  return rows.map(row=>row.map(value=>`"${String(value).replace(/^[=+@-]/,"'$&").replaceAll('"','""')}"`).join(',')).join('\r\n');
}
