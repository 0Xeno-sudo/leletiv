export const examTransitions: Record<string, readonly string[]> = {
 requested:['scheduled','performed','cancelled'], scheduled:['performed','missed','cancelled'],
 missed:['scheduled','cancelled'], performed:['received'], received:['reviewed'], reviewed:[], cancelled:[],
};
export const examLabels:Record<string,string>={requested:'Vizsgálat kérve',scheduled:'Időpont egyeztetve',performed:'Vizsgálat megtörtént',received:'Eredmény beérkezett',reviewed:'Orvos által áttekintve',missed:'Elmaradt',cancelled:'Visszavonva'};
export function validDate(value:unknown):value is string {return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function requiredText(value:unknown,max=1000):value is string{return typeof value==='string'&&value.trim().length>0&&value.length<=max;}
export interface DecisionStep {id:string;decision_id:string;task_id:string;prerequisite_id:string|null;expected_result:string;result_note:string;reviewed_at:string|null;reviewed_by:string|null;title:string;status:string;owner_name:string;due_at:string;}
export interface ExpectedExam {id:string;case_id:string;title:string;owner_id:string;owner_name:string;due_date:string;appointment_date:string|null;status:string;study_id:string|null;document_id:string|null;note:string;version:number;}
export interface ScanAnalysis {id:string;study_id:string;region_id:string;method:string;source_hash:string;mask_hash:string|null;mask_key:string|null;measurements_json:string;parameters_json:string;note:string;review_status:string;created_at:string;}
