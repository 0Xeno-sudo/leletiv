import { describe, it, expect } from 'vitest';
import { baselineInput, simulate, validScenario, csv } from './simulation';
const cases = [{id:'a',patient_name:'Test pathway',priority:'urgent',status:'triage'}] as const;
describe('capacity simulation',()=>{
  it('preserves stage order and prevents overlap on each resource',()=>{
    const r=simulate([...cases],{...baselineInput,cohortCopies:6});
    for(const v of r.visits) { expect(v.segments[0].start).toBeGreaterThanOrEqual(v.arrival); for(let i=1;i<3;i++)expect(v.segments[i].start).toBeGreaterThanOrEqual(v.segments[i-1].end); }
    for(let stage=0;stage<3;stage++) for(let slot=0;slot<2;slot++) { const list=r.visits.flatMap(v=>v.segments.filter(s=>s.stage===stage&&s.slot===slot)).sort((a,b)=>a.start-b.start); for(let i=1;i<list.length;i++)expect(list[i].start).toBeGreaterThanOrEqual(list[i-1].end); }
  });
  it('adds meaningful capacity without inventing throughput',()=>{
    const a=simulate([...cases],{...baselineInput,cohortCopies:6}); const b=simulate([...cases],{...baselineInput,theatres:2,recoveryBays:4,cohortCopies:6});
    expect(b.completed).toBeGreaterThan(a.completed);expect(b.meanWait).toBeLessThan(a.meanWait); expect(b.completed+b.backlog).toBe(6);
  });
  it('models scanner downtime and filters surveillance',()=>{
    const r=simulate([...cases],{...baselineInput,scannerDelay:120});expect(r.visits[0].segments[0].start).toBe(120);
    expect(simulate([{...cases[0],status:'monitoring'}],baselineInput).visits).toHaveLength(0);
  });
  it('rejects impossible inputs and escapes exported cells',()=>{
    expect(validScenario({...baselineInput,theatres:0})).toBe(false);expect(validScenario({...baselineInput,scanners:1.5})).toBe(false);
    expect(csv([['=1+1','A"B']])).toBe('"\'=1+1","A""B"');
  });
});
