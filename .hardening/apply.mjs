import fs from 'node:fs';
import path from 'node:path';

const read=(file)=>fs.readFileSync(file,'utf8');
const write=(file,content)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content)};
const replaceRequired=(text,search,replacement,label)=>{
  if(!text.includes(search))throw new Error(`Could not find ${label}`);
  return text.replace(search,replacement);
};
const replaceRegex=(text,regex,replacement,label)=>{
  if(!regex.test(text))throw new Error(`Could not find ${label}`);
  return text.replace(regex,replacement);
};

const model=`export type View='overview'|'itinerary'|'ideas'|'places'|'budget'|'packing'|'notes'|'travelers'|'activity';
export type MemberRole='owner'|'editor'|'viewer';
export type MemberStatus='active'|'pending'|'removed';
export type ActivityStatus='suggested'|'planned'|'confirmed'|'completed';
export type ActivityCategory='food'|'sight'|'transit'|'shopping'|'lodging'|'event'|'other';
export type ExpenseCategory='Lodging'|'Food'|'Transportation'|'Activities'|'Shopping'|'Other';
export type SplitMode='personal'|'equal'|'custom';
export type PackingScope='personal'|'shared';
export type ReservationType='Flight'|'Hotel'|'Rental car'|'Restaurant'|'Event'|'Other';

export type TripMember={
  id:string;
  name:string;
  email:string;
  initials:string;
  role:MemberRole;
  status:MemberStatus;
};

export type Activity={
  id:string;
  date:string;
  time:string;
  title:string;
  location:string;
  category:ActivityCategory;
  durationMinutes:number;
  cost:number;
  note:string;
  status:ActivityStatus;
  createdBy:string;
  attendeeIds:string[];
  votes:string[];
};

export type SavedPlace={
  id:string;
  name:string;
  category:string;
  neighborhood:string;
  note:string;
  createdBy:string;
};

export type Expense={
  id:string;
  description:string;
  amount:number;
  category:ExpenseCategory;
  paidBy:string;
  participantIds:string[];
  splitMode:SplitMode;
  customShares?:Record<string,number>;
  createdAt:string;
};

export type PackingItem={
  id:string;
  label:string;
  scope:PackingScope;
  assignedTo:string;
  done:boolean;
};

export type TripNote={
  id:string;
  title:string;
  body:string;
  createdBy:string;
  updatedAt:string;
};

export type Reservation={
  id:string;
  type:ReservationType;
  title:string;
  date:string;
  time:string;
  location:string;
  confirmation:string;
  note:string;
};

export type HistoryEvent={
  id:string;
  text:string;
  memberId:string;
  createdAt:string;
};

export type Trip={
  id:string;
  name:string;
  destination:string;
  startDate:string;
  endDate:string;
  description:string;
  budget:number;
  archived:boolean;
  members:TripMember[];
  activities:Activity[];
  places:SavedPlace[];
  expenses:Expense[];
  packing:PackingItem[];
  notes:TripNote[];
  reservations:Reservation[];
  history:HistoryEvent[];
};

export type Workspace={
  version:3;
  currentUserId:string;
  activeTripId:string;
  trips:Trip[];
};

const DATE_ONLY=/^\\d{4}-\\d{2}-\\d{2}$/;
const DAY_MS=86_400_000;

export function toCents(value:number){return Number.isFinite(value)?Math.round(value*100):0}
export function fromCents(cents:number){return Math.round(cents)/100}
export function normalizeMoney(value:number){return fromCents(toCents(value))}
export function sumMoney(values:Iterable<number>){let cents=0;for(const value of values)cents+=toCents(value);return fromCents(cents)}
export function totalExpenses(trip:Trip){return sumMoney(trip.expenses.map(expense=>expense.amount))}

export function money(value:number){
  const safe=normalizeMoney(Number.isFinite(value)?value:0);
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:safe%1===0?0:2}).format(safe);
}

export function compactMoney(value:number){
  const safe=normalizeMoney(Number.isFinite(value)?value:0);
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:Math.abs(safe)>=10_000?'compact':'standard',maximumFractionDigits:1}).format(safe);
}

export function initials(name:string){
  const parts=name.trim().split(/\\s+/).filter(Boolean);
  return (parts.length>1?\`\${parts[0][0]}\${parts.at(-1)?.[0]??''}\`:parts[0]?.slice(0,2)??'?').toUpperCase();
}

export function isDateOnly(value:string){
  if(!DATE_ONLY.test(value))return false;
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
}

export function dateOnly(value:string){
  if(!isDateOnly(value))return new Date(Number.NaN);
  const [year,month,day]=value.split('-').map(Number);
  return new Date(Date.UTC(year,month-1,day));
}

export function todayLocalDate(now=new Date()){
  const year=String(now.getFullYear()).padStart(4,'0');
  const month=String(now.getMonth()+1).padStart(2,'0');
  const day=String(now.getDate()).padStart(2,'0');
  return \`\${year}-\${month}-\${day}\`;
}

export function addDaysToDateOnly(value:string,days:number){
  const start=dateOnly(value);
  if(Number.isNaN(start.getTime()))return value;
  return new Date(start.getTime()+Math.trunc(days)*DAY_MS).toISOString().slice(0,10);
}

export function daysUntilDate(target:string,today=todayLocalDate()){
  const targetDate=dateOnly(target);const todayDate=dateOnly(today);
  if(Number.isNaN(targetDate.getTime())||Number.isNaN(todayDate.getTime()))return 0;
  return Math.round((targetDate.getTime()-todayDate.getTime())/DAY_MS);
}

export function daysBetween(start:string,end:string){
  const first=dateOnly(start);const last=dateOnly(end);
  if(Number.isNaN(first.getTime())||Number.isNaN(last.getTime())||last<first)return 0;
  return Math.round((last.getTime()-first.getTime())/DAY_MS)+1;
}

export function tripDates(start:string,end:string){
  const total=daysBetween(start,end);if(total===0)return [];
  return Array.from({length:total},(_,index)=>addDaysToDateOnly(start,index));
}

export function dateLabel(value:string,options:Intl.DateTimeFormatOptions={weekday:'short',month:'short',day:'numeric'}){
  const date=dateOnly(value);if(Number.isNaN(date.getTime()))return 'Invalid date';
  return new Intl.DateTimeFormat('en-US',{timeZone:'UTC',...options}).format(date);
}

export function minutesLabel(minutes:number){
  if(minutes<60)return \`\${minutes} min\`;
  const hours=Math.floor(minutes/60);
  const rest=minutes%60;
  return rest?\`\${hours}h \${rest}m\`:\`\${hours}h\`;
}

export function memberName(trip:Trip,id:string){
  return trip.members.find(member=>member.id===id)?.name??'Traveler';
}

export function tripOwner(trip:Trip){return trip.members.find(member=>member.role==='owner'&&member.status==='active')}

export function tripProgress(trip:Trip){
  const actionable=trip.activities.filter(activity=>activity.status!=='suggested');
  if(!actionable.length)return 0;
  return Math.round(actionable.filter(activity=>activity.status==='completed').length/actionable.length*100);
}

export function expenseShare(expense:Expense,memberId:string){
  const index=expense.participantIds.indexOf(memberId);
  if(index===-1)return 0;
  if(expense.splitMode==='personal')return expense.paidBy===memberId?normalizeMoney(expense.amount):0;
  if(expense.splitMode==='custom')return fromCents(Math.max(0,toCents(expense.customShares?.[memberId]??0)));
  const total=toCents(expense.amount);const count=Math.max(expense.participantIds.length,1);
  const base=Math.floor(total/count);const remainder=total-base*count;
  return fromCents(base+(index<remainder?1:0));
}

export function balances(trip:Trip){
  const active=trip.members.filter(member=>member.status==='active');
  return active.map(member=>{
    const paidCents=trip.expenses.filter(expense=>expense.paidBy===member.id).reduce((sum,expense)=>sum+toCents(expense.amount),0);
    const shareCents=trip.expenses.reduce((sum,expense)=>sum+toCents(expenseShare(expense,member.id)),0);
    return {member,paid:fromCents(paidCents),share:fromCents(shareCents),balance:fromCents(paidCents-shareCents)};
  });
}

export function settlements(trip:Trip){
  const rows=balances(trip).map(row=>({id:row.member.id,balance:toCents(row.balance)}));
  const debtors=rows.filter(row=>row.balance<0).map(row=>({...row,balance:-row.balance}));
  const creditors=rows.filter(row=>row.balance>0).map(row=>({...row}));
  const result:Array<{from:string;to:string;amount:number}>=[];let debtor=0,creditor=0;
  while(debtor<debtors.length&&creditor<creditors.length){
    const amount=Math.min(debtors[debtor].balance,creditors[creditor].balance);
    if(amount>0)result.push({from:debtors[debtor].id,to:creditors[creditor].id,amount:fromCents(amount)});
    debtors[debtor].balance-=amount;creditors[creditor].balance-=amount;
    if(debtors[debtor].balance===0)debtor++;
    if(creditors[creditor].balance===0)creditor++;
  }
  return result;
}
`;
write('src/model.ts',model);

const storage=`import {freshDemo} from './demo';
import {isDateOnly} from './model';
import type {Trip,Workspace} from './model';

export const WORKSPACE_STORAGE_KEY='wanderline-workspace-v3';
export const LEGACY_WORKSPACE_STORAGE_KEY='wanderline-workspace-v2';
const roles=new Set(['owner','editor','viewer']);
const memberStatuses=new Set(['active','pending','removed']);
const activityStatuses=new Set(['suggested','planned','confirmed','completed']);
const activityCategories=new Set(['food','sight','transit','shopping','lodging','event','other']);
const expenseCategories=new Set(['Lodging','Food','Transportation','Activities','Shopping','Other']);
const splitModes=new Set(['personal','equal','custom']);
const reservationTypes=new Set(['Flight','Hotel','Rental car','Restaurant','Event','Other']);

function record(value:unknown):Record<string,unknown>|null{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null}
function text(value:unknown){return typeof value==='string'}
function textArray(value:unknown){return Array.isArray(value)&&value.every(text)}
function finite(value:unknown){return typeof value==='number'&&Number.isFinite(value)}
function nonNegative(value:unknown){return finite(value)&&value>=0}

function looksLikeMember(value:unknown){const item=record(value);return Boolean(item&&text(item.id)&&text(item.name)&&text(item.email)&&text(item.initials)&&roles.has(String(item.role))&&memberStatuses.has(String(item.status)))}
function looksLikeActivity(value:unknown){const item=record(value);return Boolean(item&&text(item.id)&&isDateOnly(String(item.date))&&text(item.time)&&text(item.title)&&text(item.location)&&activityCategories.has(String(item.category))&&nonNegative(item.durationMinutes)&&nonNegative(item.cost)&&text(item.note)&&activityStatuses.has(String(item.status))&&text(item.createdBy)&&textArray(item.attendeeIds)&&textArray(item.votes))}
function looksLikePlace(value:unknown){const item=record(value);return Boolean(item&&text(item.id)&&text(item.name)&&text(item.category)&&text(item.neighborhood)&&text(item.note)&&text(item.createdBy))}
function looksLikeExpense(value:unknown){
  const item=record(value);if(!item||!text(item.id)||!text(item.description)||!nonNegative(item.amount)||!expenseCategories.has(String(item.category))||!text(item.paidBy)||!textArray(item.participantIds)||item.participantIds.length===0||!splitModes.has(String(item.splitMode))||!text(item.createdAt))return false;
  if(item.splitMode==='custom'){const shares=record(item.customShares);if(!shares)return false;for(const share of Object.values(shares))if(!nonNegative(share))return false}
  return true;
}
function looksLikePacking(value:unknown){const item=record(value);return Boolean(item&&text(item.id)&&text(item.label)&&(item.scope==='personal'||item.scope==='shared')&&text(item.assignedTo)&&typeof item.done==='boolean')}
function looksLikeNote(value:unknown){const item=record(value);return Boolean(item&&text(item.id)&&text(item.title)&&text(item.body)&&text(item.createdBy)&&text(item.updatedAt))}
function looksLikeReservation(value:unknown){const item=record(value);return Boolean(item&&text(item.id)&&reservationTypes.has(String(item.type))&&text(item.title)&&isDateOnly(String(item.date))&&text(item.time)&&text(item.location)&&text(item.confirmation)&&text(item.note))}
function looksLikeHistory(value:unknown){const item=record(value);return Boolean(item&&text(item.id)&&text(item.text)&&text(item.memberId)&&text(item.createdAt))}

function looksLikeTrip(value:unknown):value is Trip{
  const trip=record(value);if(!trip||!text(trip.id)||!text(trip.name)||!text(trip.destination)||!isDateOnly(String(trip.startDate))||!isDateOnly(String(trip.endDate))||String(trip.endDate)<String(trip.startDate)||!text(trip.description)||!nonNegative(trip.budget)||typeof trip.archived!=='boolean')return false;
  return Array.isArray(trip.members)&&trip.members.some(member=>looksLikeMember(member)&&record(member)?.role==='owner'&&record(member)?.status==='active')&&trip.members.every(looksLikeMember)&&Array.isArray(trip.activities)&&trip.activities.every(looksLikeActivity)&&Array.isArray(trip.places)&&trip.places.every(looksLikePlace)&&Array.isArray(trip.expenses)&&trip.expenses.every(looksLikeExpense)&&Array.isArray(trip.packing)&&trip.packing.every(looksLikePacking)&&Array.isArray(trip.notes)&&trip.notes.every(looksLikeNote)&&Array.isArray(trip.reservations)&&trip.reservations.every(looksLikeReservation)&&Array.isArray(trip.history)&&trip.history.every(looksLikeHistory);
}

function looksLikeWorkspace(value:unknown):value is Workspace{
  const workspace=record(value);
  return Boolean(workspace&&workspace.version===3&&text(workspace.currentUserId)&&text(workspace.activeTripId)&&Array.isArray(workspace.trips)&&workspace.trips.length>0&&workspace.trips.every(looksLikeTrip));
}

function normalizeWorkspace(workspace:Workspace):Workspace{
  const active=workspace.trips.find(trip=>trip.id===workspace.activeTripId&&!trip.archived)??workspace.trips.find(trip=>!trip.archived)??workspace.trips[0];
  return {...workspace,activeTripId:active.id};
}

function parse(raw:string|null,legacy=false):Workspace|null{
  if(!raw)return null;
  try{
    const parsed=JSON.parse(raw) as unknown;
    const candidate=legacy&&record(parsed)?.version===2?{...record(parsed),version:3}:parsed;
    return looksLikeWorkspace(candidate)?normalizeWorkspace(candidate):null;
  }catch{return null}
}

export function loadWorkspace():Workspace{
  try{
    const current=parse(localStorage.getItem(WORKSPACE_STORAGE_KEY));if(current)return current;
    const migrated=parse(localStorage.getItem(LEGACY_WORKSPACE_STORAGE_KEY),true);
    if(migrated){saveWorkspace(migrated);return migrated}
  }catch{/* Browser storage can be unavailable in privacy modes. */}
  return freshDemo();
}

export function saveWorkspace(workspace:Workspace){
  try{localStorage.setItem(WORKSPACE_STORAGE_KEY,JSON.stringify(normalizeWorkspace(workspace)));localStorage.removeItem(LEGACY_WORKSPACE_STORAGE_KEY)}catch{/* Keep the live session usable without persistence. */}
}

export function resetWorkspace(){
  const next=freshDemo();
  try{localStorage.setItem(WORKSPACE_STORAGE_KEY,JSON.stringify(next));localStorage.removeItem(LEGACY_WORKSPACE_STORAGE_KEY)}catch{/* Keep reset usable in memory. */}
  return next;
}
`;
write('src/storage.ts',storage);

const firebase=`import {initializeApp,getApps} from 'firebase/app';
import {getAuth,GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signOut} from 'firebase/auth';
import type {User} from 'firebase/auth';

const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const firebaseReady=Boolean(config.apiKey&&config.authDomain&&config.projectId&&config.appId);
export function authClient(){if(!firebaseReady)return null;const app=getApps()[0]??initializeApp(config);return getAuth(app)}
export function observeAuth(listener:(user:User|null)=>void){const auth=authClient();if(!auth){listener(null);return()=>{}}return onAuthStateChanged(auth,listener)}
export async function signInGoogle(){const auth=authClient();if(!auth)return null;return signInWithPopup(auth,new GoogleAuthProvider())}
export async function signOutUser(){const auth=authClient();if(auth)await signOut(auth)}
`;
write('src/firebase.ts',firebase);

let app=read('src/App.tsx');
app=replaceRequired(app,"import {firebaseReady,signInGoogle} from './firebase';","import {firebaseReady,observeAuth,signInGoogle,signOutUser} from './firebase';",'Firebase import');
app=replaceRegex(app,/balances,dateLabel,initials,memberName,money,minutesLabel,tripDates,tripProgress\n} from '\.\/model';/,"addDaysToDateOnly,balances,dateLabel,daysUntilDate,initials,memberName,money,minutesLabel,normalizeMoney,\n  settlements,sumMoney,todayLocalDate,toCents,totalExpenses,tripDates,tripProgress\n} from './model';",'model imports');
app=replaceRequired(app,"  const [toast,setToast]=useState('');\n  const searchRef=useRef<HTMLInputElement>(null);","  const [toast,setToast]=useState('');\n  const [authIdentity,setAuthIdentity]=useState('');\n  const searchRef=useRef<HTMLInputElement>(null);",'auth identity state');
app=replaceRequired(app,"  const currentMember=trip?.members.find(member=>member.id===workspace.currentUserId);\n  const canEdit=currentMember?.role!=='viewer';\n  const isOwner=currentMember?.role==='owner';","  const currentMember=trip?.members.find(member=>member.id===workspace.currentUserId&&member.status==='active');\n  const canEdit=Boolean(currentMember&&(currentMember.role==='owner'||currentMember.role==='editor'));\n  const isOwner=Boolean(currentMember?.role==='owner');",'permission derivation');
app=replaceRequired(app,"  useEffect(()=>saveWorkspace(workspace),[workspace]);","  useEffect(()=>saveWorkspace(workspace),[workspace]);\n  useEffect(()=>observeAuth(user=>setAuthIdentity(user?.displayName??user?.email??'')),[]);",'auth observer');
app=replaceRequired(app,"  const updateTrip=(mutate:(current:Trip)=>Trip)=>{\n    if(!trip)return;","  const updateTrip=(mutate:(current:Trip)=>Trip)=>{\n    if(!trip||!canEdit)return;",'mutation permission guard');
app=replaceRequired(app,"    trip.members.filter(item=>`${item.name} ${item.email}`.toLowerCase().includes(q)).forEach(item=>hits.push({id:item.id,label:item.name,detail:`${item.role} · ${item.status}`,view:'travelers'}));","    trip.members.filter(item=>item.status!=='removed'&&`${item.name} ${item.email}`.toLowerCase().includes(q)).forEach(item=>hits.push({id:item.id,label:item.name,detail:`${item.role} · ${item.status}`,view:'travelers'}));",'removed-member search');
app=replaceRequired(app,"  const spent=trip.expenses.reduce((sum,expense)=>sum+expense.amount,0);","  const spent=totalExpenses(trip);",'overview expense total');
app=replaceRequired(app,"  const countdown=Math.ceil((Date.parse(`${trip.startDate}T00:00:00`)-Date.now())/86_400_000);","  const countdown=daysUntilDate(trip.startDate);",'trip countdown');
app=replaceRegex(app,/  const signIn=async\(\)=>\{if\(!firebaseReady\).*?\};\n  const doReset=/s,"  const toggleIdentity=async()=>{if(!firebaseReady){setToast('Firebase is not linked — the portfolio demo remains local to this browser');return}try{if(authIdentity){await signOutUser();setToast('Google identity disconnected');return}await signInGoogle();setToast('Google identity connected — trip data remains local until Firestore is configured')}catch{setToast('Google sign-in was cancelled or unavailable')}};\n  const doReset=",'auth action');
app=replaceRequired(app,'    <aside className={menuOpen?\'wl-sidebar open\':\'wl-sidebar\'}>','    <aside id="wl-sidebar" className={menuOpen?\'wl-sidebar open\':\'wl-sidebar\'}>','sidebar id');
app=replaceRequired(app,'<header className="wl-header"><button className="wl-mobile-menu" onClick={()=>setMenuOpen(value=>!value)} aria-label="Open navigation"><Menu/></button>','<header className="wl-header"><button className="wl-mobile-menu" onClick={()=>setMenuOpen(value=>!value)} aria-label={menuOpen?\'Close navigation\':\'Open navigation\'} aria-expanded={menuOpen} aria-controls="wl-sidebar"><Menu/></button>','mobile navigation semantics');
app=replaceRegex(app,/<button className="wl-profile" onClick=\{signIn\}><span>\{initials\(currentMember\?\.name\?\?'Traveler'\)\}<\/span><div><b>\{currentMember\?\.name\?\?'Traveler'\}<\/b><small>\{firebaseReady\?'Google sign-in ready':'Local demo mode'\}<\/small><\/div><MoreHorizontal size=\{16\}\/\><\/button>/,"<button className=\"wl-profile\" onClick={()=>void toggleIdentity()}><span>{initials(currentMember?.name??'Traveler')}</span><div><b>{currentMember?.name??'Traveler'}</b><small>{authIdentity?'Google identity connected':firebaseReady?'Connect Google identity':'Local demo mode'}</small></div><MoreHorizontal size={16}/></button>",'profile auth button');
app=replaceRequired(app,"{view==='overview'&&<Overview trip={trip} countdown={countdown} spent={spent} packed={packed} confirmed={confirmed} currentUserId={workspace.currentUserId}","{view==='overview'&&<Overview trip={trip} countdown={countdown} spent={spent} packed={packed} confirmed={confirmed} currentUserId={workspace.currentUserId} canEdit={canEdit} isOwner={isOwner}",'overview permissions props');
app=replaceRegex(app,/onRemove=\{id=>\{const member=trip\.members\.find\(item=>item\.id===id\);if\(member&&window\.confirm\(`Remove \$\{member\.name\} from this trip\?`\)\)mutateTrip\(`removed \$\{member\.name\} from the trip`,current=>\(\{\.\.\.current,members:current\.members\.filter\(item=>item\.id!==id\)\}\)\)\}\}/,"onRemove={id=>{const member=trip.members.find(item=>item.id===id);if(!member)return;const hasExpenses=trip.expenses.some(expense=>expense.paidBy===id||expense.participantIds.includes(id));const hasPacking=trip.packing.some(item=>item.assignedTo===id);if(hasExpenses||hasPacking){setToast(`Reassign ${member.name}’s expenses and packing responsibilities before removing them`);return}if(window.confirm(`Remove ${member.name} from this trip?`))mutateTrip(`removed ${member.name} from the trip`,current=>({...current,members:current.members.map(item=>item.id===id?{...item,status:'removed'}:item),activities:current.activities.map(activity=>({...activity,attendeeIds:activity.attendeeIds.filter(memberId=>memberId!==id),votes:activity.votes.filter(memberId=>memberId!==id)}))}))}}",'safe traveler removal');
app=replaceRequired(app,"    {toast&&<div className=\"wl-toast\"><CheckCircle2 size={17}/>{toast}</div>}","    {toast&&<div className=\"wl-toast\" role=\"status\" aria-live=\"polite\"><CheckCircle2 size={17}/>{toast}</div>}",'toast live region');
app=replaceRegex(app,/type OverviewProps=\{trip:Trip;countdown:number;spent:number;packed:number;confirmed:number;currentUserId:string;/,"type OverviewProps={trip:Trip;countdown:number;spent:number;packed:number;confirmed:number;currentUserId:string;canEdit:boolean;isOwner:boolean;",'overview prop type');
app=replaceRequired(app,"function Overview({trip,countdown,spent,packed,confirmed,currentUserId,onNavigate,onTripSettings,onAddActivity}:OverviewProps){","function Overview({trip,countdown,spent,packed,confirmed,currentUserId,canEdit,isOwner,onNavigate,onTripSettings,onAddActivity}:OverviewProps){",'overview signature');
app=replaceRequired(app,'<div className="wl-hero-actions"><button onClick={onAddActivity}><Plus size={16}/> Add plan</button><button className="secondary" onClick={onTripSettings}><Settings2 size={16}/> Trip settings</button></div>','{(canEdit||isOwner)&&<div className="wl-hero-actions">{canEdit&&<button onClick={onAddActivity}><Plus size={16}/> Add plan</button>}{isOwner&&<button className="secondary" onClick={onTripSettings}><Settings2 size={16}/> Trip settings</button>}</div>}','overview action permissions');
app=replaceRequired(app,"<div className=\"wl-idea-actions\"><button className={item.votes.includes(currentUserId)?'voted':''} onClick={()=>onVote(item.id)}><Heart size={15}/>{item.votes.includes(currentUserId)?'Voted':'Vote'}</button>{canEdit&&<>","<div className=\"wl-idea-actions\">{canEdit&&<button className={item.votes.includes(currentUserId)?'voted':''} onClick={()=>onVote(item.id)}><Heart size={15}/>{item.votes.includes(currentUserId)?'Voted':'Vote'}</button>}{canEdit&&<>",'idea vote permissions');
app=replaceRegex(app,/function calculateSettlements\(trip:Trip\).*?return result\}\n/,'','local settlement helper');
app=replaceRequired(app,"const spent=trip.expenses.reduce((sum,item)=>sum+item.amount,0);const categoryTotals=expenseCategories.map(category=>({category,total:trip.expenses.filter(item=>item.category===category).reduce((sum,item)=>sum+item.amount,0)})).filter(item=>item.total>0);const ledger=","const spent=totalExpenses(trip);const categoryTotals=expenseCategories.map(category=>({category,total:sumMoney(trip.expenses.filter(item=>item.category===category).map(item=>item.amount))})).filter(item=>item.total>0);const ledger=",'budget exact totals');
app=replaceRequired(app,"const memberBalances=balances(trip);const settlements=calculateSettlements(trip);return","const memberBalances=balances(trip);const settlementRows=settlements(trip);return",'settlement rows');
app=app.replaceAll('settlements.length>0?settlements.map','settlementRows.length>0?settlementRows.map');
app=replaceRequired(app,"const numericAmount=Math.max(0,Number(amount)||0);const customTotal=participants.reduce((sum,id)=>sum+(Number(shares[id])||0),0);const customValid=mode!=='custom'||Math.abs(customTotal-numericAmount)<.01;","const numericAmount=normalizeMoney(Math.max(0,Number(amount)||0));const customTotal=sumMoney(participants.map(id=>Number(shares[id])||0));const customValid=mode!=='custom'||toCents(customTotal)===toCents(numericAmount);",'expense exact input math');
app=replaceRequired(app,"[memberId,Math.max(0,Number(shares[memberId])||0)]","[memberId,normalizeMoney(Math.max(0,Number(shares[memberId])||0))]",'custom share normalization');
app=replaceRequired(app,'<label>Date<input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label><label>Time<input type="time" value={time}','<label>Date<input type="date" min={trip.startDate} max={trip.endDate} value={date} onChange={event=>setDate(event.target.value)}/></label><label>Time<input type="time" value={time}','reservation date bounds');

const modalReplacement=`function Modal({onClose,children}:{onClose:()=>void;children:ReactNode}){
  const dialogRef=useRef<HTMLDivElement>(null);const closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const focusable=()=>Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')??[]);
    focusable()[0]?.focus();
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();closeRef.current();return}if(event.key!=='Tab')return;const items=focusable();if(!items.length){event.preventDefault();return}const first=items[0],last=items.at(-1)!;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};
    document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=overflow;previous?.focus()};
  },[]);
  return <div className="wl-overlay" onMouseDown={onClose}><div ref={dialogRef} className="wl-modal" role="dialog" aria-modal="true" onMouseDown={event=>event.stopPropagation()}><button className="wl-modal-close" onClick={onClose} aria-label="Close"><X/></button>{children}</div></div>;
}`;
app=replaceRegex(app,/function Modal\(\{onClose,children\}:\{onClose:\(\)=>void;children:ReactNode\}\)\{.*?\}\n\ntype ModalContext/s,`${modalReplacement}\n\ntype ModalContext`,'accessible modal');

const travelerForm=`function TravelerForm({trip,isOwner,setModal,setToast,mutateTrip}:{trip:Trip;isOwner:boolean;setModal:(value:ModalState)=>void;setToast:(text:string)=>void;mutateTrip:(text:string,mutate:(current:Trip)=>Trip)=>void}){const [email,setEmail]=useState('');const [name,setName]=useState('');const [role,setRole]=useState<MemberRole>('editor');const submit=(event:FormEvent)=>{event.preventDefault();if(!isOwner){setToast('Only the trip owner can invite travelers');return}if(!email.trim())return;const cleanEmail=email.trim().toLowerCase();const existing=trip.members.find(member=>member.email.toLowerCase()===cleanEmail);if(existing&&existing.status!=='removed'){setToast('That traveler is already invited');return}const displayName=name.trim()||existing?.name||cleanEmail.split('@')[0];if(existing){mutateTrip(\`reinvited \${displayName} as \${role}\`,current=>({...current,members:current.members.map(member=>member.id===existing.id?{...member,name:displayName,email:cleanEmail,initials:initials(displayName),role,status:'pending'}:member)}));setModal(null);setToast('Invitation restored locally — delivery requires Firebase/Firestore');return}const member:TripMember={id:crypto.randomUUID(),name:displayName,email:cleanEmail,initials:initials(displayName),role,status:'pending'};mutateTrip(\`invited \${member.name} as \${role}\`,current=>({...current,members:[...current.members,member]}));setModal(null);setToast('Invitation saved locally — delivery requires Firebase/Firestore')};return <form onSubmit={submit}><FormTitle icon={<UserPlus/>} title="Invite a traveler" text="The portfolio demo records membership locally. Configure Firebase/Firestore to deliver and accept real invitations."/><label>Email<input type="email" autoFocus required value={email} onChange={event=>setEmail(event.target.value)} placeholder="traveler@example.com"/></label><label>Name (optional)<input value={name} onChange={event=>setName(event.target.value)}/></label><label>Role<select value={role} onChange={event=>setRole(event.target.value as MemberRole)}><option value="editor">Editor — can help plan</option><option value="viewer">Viewer — read only</option></select></label><button className="wl-form-submit">Add invitation</button></form>}`;
app=replaceRegex(app,/function TravelerForm\(.*?\nfunction TripForm/s,`${travelerForm}\nfunction TripForm`,'traveler form');

const tripForm=`function TripForm({trip,workspace,newTrip,isOwner,setModal,setToast,setWorkspace,record}:{trip:Trip;workspace:Workspace;newTrip?:boolean;isOwner:boolean;setModal:(value:ModalState)=>void;setToast:(text:string)=>void;setWorkspace:(value:Workspace|((current:Workspace)=>Workspace))=>void;record:(next:Trip,text:string,memberId?:string)=>Trip}){const currentUser=trip.members.find(member=>member.id===workspace.currentUserId);const today=todayLocalDate();const [name,setName]=useState(newTrip?'':trip.name);const [destination,setDestination]=useState(newTrip?'':trip.destination);const [start,setStart]=useState(newTrip?addDaysToDateOnly(today,30):trip.startDate);const [end,setEnd]=useState(newTrip?addDaysToDateOnly(today,33):trip.endDate);const [description,setDescription]=useState(newTrip?'':trip.description);const [budget,setBudget]=useState(String(newTrip?1500:trip.budget));const submit=(event:FormEvent)=>{event.preventDefault();if(!newTrip&&!isOwner){setToast('Only the trip owner can change trip settings');return}if(!name.trim()||!destination.trim()||end<start)return;const normalizedBudget=normalizeMoney(Math.max(0,Number(budget)||0));if(newTrip){const id=crypto.randomUUID();const owner:TripMember={id:workspace.currentUserId,name:currentUser?.name??'Traveler',email:currentUser?.email??'',initials:currentUser?.initials??'TR',role:'owner',status:'active'};const next:Trip={id,name:name.trim(),destination:destination.trim(),startDate:start,endDate:end,description:description.trim(),budget:normalizedBudget,archived:false,members:[owner],activities:[],places:[],expenses:[],packing:[],notes:[],reservations:[],history:[]};setWorkspace(current=>({...current,activeTripId:id,trips:[...current.trips,record(next,'created this trip')]}));setToast('New trip created')}else setWorkspace(current=>({...current,trips:current.trips.map(item=>item.id===trip.id?record({...item,name:name.trim(),destination:destination.trim(),startDate:start,endDate:end,description:description.trim(),budget:normalizedBudget},'updated the trip details'):item)}));setModal(null)};const nextActive=()=>workspace.trips.find(item=>item.id!==trip.id&&!item.archived);const canLeaveCurrent=Boolean(nextActive());const archive=()=>{if(newTrip||!isOwner||!canLeaveCurrent||!window.confirm('Archive this trip? It will move out of the active trip switcher.'))return;const fallback=nextActive();if(!fallback)return;setWorkspace(current=>({...current,activeTripId:fallback.id,trips:current.trips.map(item=>item.id===trip.id?{...item,archived:true}:item)}));setModal(null);setToast('Trip archived')};const remove=()=>{if(newTrip||!isOwner||!canLeaveCurrent||!window.confirm(\`Delete “\${trip.name}” permanently? This removes its itinerary, collaborators, expenses, notes, and saved places from this browser.\`))return;const fallback=nextActive();if(!fallback)return;setWorkspace(current=>({...current,activeTripId:fallback.id,trips:current.trips.filter(item=>item.id!==trip.id)}));setModal(null);setToast('Trip deleted')};return <form onSubmit={submit}><FormTitle icon={<Map/>} title={newTrip?'Create a trip':'Trip settings'} text={newTrip?'Start solo. Invite collaborators whenever you want.':'Update the shared details everyone sees.'}/><label>Trip name<input autoFocus required value={name} onChange={event=>setName(event.target.value)}/></label><label>Destination<input required value={destination} onChange={event=>setDestination(event.target.value)} placeholder="City, Country"/></label><div className="wl-form-grid"><label>Start date<input type="date" value={start} onChange={event=>{setStart(event.target.value);if(end<event.target.value)setEnd(event.target.value)}}/></label><label>End date<input type="date" min={start} value={end} onChange={event=>setEnd(event.target.value)}/></label></div><label>Trip budget (USD)<input type="number" min="0" step="0.01" value={budget} onChange={event=>setBudget(event.target.value)}/></label><label>Description<textarea value={description} onChange={event=>setDescription(event.target.value)} placeholder="What kind of trip are you planning?"/></label><div className="wl-form-actions">{!newTrip&&isOwner&&canLeaveCurrent&&<button type="button" className="danger" onClick={archive}><Archive size={15}/> Archive</button>}{!newTrip&&isOwner&&canLeaveCurrent&&<button type="button" className="danger" onClick={remove}><Trash2 size={15}/> Delete</button>}<button className="wl-form-submit">{newTrip?'Create trip':'Save trip'}</button></div></form>}`;
app=replaceRegex(app,/function TripForm\(.*?\nfunction FormTitle/s,`${tripForm}\nfunction FormTitle`,'trip form');
app=replaceRequired(app,"{trip.members.map(member=><div key={member.id}","{trip.members.filter(member=>member.status!=='removed').map(member=><div key={member.id}",'hide removed travelers');
write('src/App.tsx',app);

let server=read('server/index.ts');
server=replaceRequired(server,"  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');\n  next();","  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');\n  res.setHeader('Cross-Origin-Opener-Policy','same-origin-allow-popups');\n  res.setHeader('Cross-Origin-Resource-Policy','same-origin');\n  if(process.env.NODE_ENV==='production')res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');\n  next();",'security headers');
write('server/index.ts',server);

const packageJson=JSON.parse(read('package.json'));
packageJson.scripts={...packageJson.scripts,lint:'node scripts/lint-repo.mjs',test:'tsx --test tests/*.test.ts'};
packageJson.scripts.check='npm run lint && npm run typecheck && npm test && npm run build && npm run verify:build';
write('package.json',JSON.stringify(packageJson,null,2)+'\n');

let ci=read('.github/workflows/ci.yml');
ci=replaceRequired(ci,'      - run: npm install --include=dev --no-audit --no-fund','      - run: npm ci --include=dev --no-audit --no-fund','CI install');
write('.github/workflows/ci.yml',ci);

const lint=`import fs from 'node:fs';
import path from 'node:path';
const required=['package-lock.json','.env.example','docs/ARCHITECTURE.md','docs/QA.md'];
const missing=required.filter(file=>!fs.existsSync(file));
if(missing.length)throw new Error(\`Missing required repository files: \${missing.join(', ')}\`);
const gitignore=fs.readFileSync('.gitignore','utf8');if(!/^\\.env$/m.test(gitignore))throw new Error('.gitignore must ignore .env');
const sourceRoots=['src','server','scripts','tests'];const files=[];
const walk=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(/\\.(?:ts|tsx|mjs)$/.test(entry.name))files.push(file)}};
for(const root of sourceRoots)if(fs.existsSync(root))walk(root);
const forbidden=[['dangerouslySetInnerHTML',/dangerouslySetInnerHTML/],['eval()',/\\beval\\s*\\(/],['FIXME',/\\bFIXME\\b/],['TODO',/\\bTODO\\b/]];
const failures=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const [label,pattern] of forbidden)if(pattern.test(text))failures.push(\`\${file}: forbidden \${label}\`);if(file.startsWith('src'+path.sep)&&/console\\.(?:log|debug)\\s*\\(/.test(text))failures.push(\`\${file}: console debugging left in client source\`)}
if(failures.length)throw new Error(failures.join('\\n'));console.log(\`Repository lint passed across \${files.length} source files.\`);
`;
write('scripts/lint-repo.mjs',lint);

const modelTests=`import test from 'node:test';
import assert from 'node:assert/strict';
import {balances,daysBetween,daysUntilDate,expenseShare,memberName,settlements,sumMoney,toCents,tripDates} from '../src/model';
import type {Expense,Trip,TripMember} from '../src/model';

const members:TripMember[]=[
  {id:'a',name:'Avery',email:'a@example.com',initials:'A',role:'owner',status:'active'},
  {id:'b',name:'Blair',email:'b@example.com',initials:'B',role:'editor',status:'active'},
  {id:'c',name:'Casey',email:'c@example.com',initials:'C',role:'viewer',status:'active'}
];
const baseTrip=(expenses:Expense[]=[]):Trip=>({id:'trip',name:'Test',destination:'Test City',startDate:'2026-09-01',endDate:'2026-09-03',description:'',budget:1000,archived:false,members:structuredClone(members),activities:[],places:[],expenses,packing:[],notes:[],reservations:[],history:[]});

test('date-only helpers remain deterministic across calendar boundaries',()=>{assert.equal(daysBetween('2026-09-01','2026-09-03'),3);assert.deepEqual(tripDates('2026-09-01','2026-09-03'),['2026-09-01','2026-09-02','2026-09-03']);assert.equal(daysBetween('2026-09-03','2026-09-01'),0);assert.deepEqual(tripDates('2026-09-03','2026-09-01'),[]);assert.equal(daysUntilDate('2026-09-14','2026-09-01'),13)});
test('currency aggregation is exact at cent precision',()=>{assert.equal(sumMoney([0.1,0.2]),0.3);assert.equal(toCents(sumMoney([19.99,0.01,80])),10000)});
test('equal splits allocate remainder cents without losing money',()=>{const expense:Expense={id:'e',description:'Dinner',amount:10,category:'Food',paidBy:'a',participantIds:['a','b','c'],splitMode:'equal',createdAt:'2026-09-01T00:00:00.000Z'};const shares=members.map(member=>expenseShare(expense,member.id));assert.deepEqual(shares,[3.34,3.33,3.33]);assert.equal(toCents(sumMoney(shares)),1000)});
test('balances and settlement suggestions reconcile exactly',()=>{const expenses:Expense[]=[{id:'e1',description:'Hotel',amount:90,category:'Lodging',paidBy:'a',participantIds:['a','b','c'],splitMode:'equal',createdAt:'2026-09-01T00:00:00.000Z'},{id:'e2',description:'Tickets',amount:30,category:'Activities',paidBy:'b',participantIds:['a','b','c'],splitMode:'equal',createdAt:'2026-09-01T01:00:00.000Z'}];const trip=baseTrip(expenses);assert.deepEqual(balances(trip).map(row=>row.balance),[50,-10,-40]);assert.deepEqual(settlements(trip),[{from:'b',to:'a',amount:10},{from:'c',to:'a',amount:40}])});
test('removed members keep historical identity while leaving active balances',()=>{const trip=baseTrip();trip.members[1].status='removed';assert.equal(memberName(trip,'b'),'Blair');assert.deepEqual(balances(trip).map(row=>row.member.id),['a','c'])});
`;
write('tests/model.test.ts',modelTests);

const storageTests=`import test from 'node:test';
import assert from 'node:assert/strict';
import {freshDemo} from '../src/demo';
import {LEGACY_WORKSPACE_STORAGE_KEY,WORKSPACE_STORAGE_KEY,loadWorkspace,saveWorkspace} from '../src/storage';

class MemoryStorage implements Storage{private data=new Map<string,string>();get length(){return this.data.size}clear(){this.data.clear()}getItem(key:string){return this.data.get(key)??null}key(index:number){return [...this.data.keys()][index]??null}removeItem(key:string){this.data.delete(key)}setItem(key:string,value:string){this.data.set(key,String(value))}}
const storage=new MemoryStorage();Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true});

test.beforeEach(()=>storage.clear());
test('corrupt persisted data fails closed to the safe demo workspace',()=>{storage.setItem(WORKSPACE_STORAGE_KEY,'{"version":3,"trips":[]}');const loaded=loadWorkspace();assert.equal(loaded.version,3);assert.equal(loaded.activeTripId,'barcelona')});
test('v2 browser data migrates to v3 without being discarded',()=>{const legacy={...freshDemo(),version:2};storage.setItem(LEGACY_WORKSPACE_STORAGE_KEY,JSON.stringify(legacy));const loaded=loadWorkspace();assert.equal(loaded.version,3);assert.ok(storage.getItem(WORKSPACE_STORAGE_KEY));assert.equal(storage.getItem(LEGACY_WORKSPACE_STORAGE_KEY),null)});
test('stale active trip ids are normalized to a usable trip',()=>{const workspace=freshDemo();workspace.activeTripId='missing';saveWorkspace(workspace);assert.equal(loadWorkspace().activeTripId,'barcelona')});
`;
write('tests/storage.test.ts',storageTests);

const decisions=`# Wanderline Engineering Decisions

These are intentionally short records for choices that materially affect correctness, security, or the portfolio demo.

## 1. Local-first demo with an explicit cloud boundary

The public demo must be useful without credentials, so trip state is stored in a validated, versioned browser workspace. Google sign-in is a real Firebase identity seam when configured, but Wanderline does **not** claim local role checks provide cross-account security. Private shared trips, invitation delivery/acceptance, and real-time synchronization require Firestore plus membership-enforcing security rules.

## 2. Currency uses integer cents for calculations

Trip expenses are entered and displayed as decimal USD, but aggregation, equal splitting, balances, and settlement matching normalize through integer cents. Equal splits deterministically allocate remainder cents instead of allowing floating-point drift or silently losing a cent.

## 3. Trip dates are date-only values

Trip and itinerary dates use `YYYY-MM-DD` as calendar dates rather than local/UTC timestamps. Arithmetic is performed from UTC-normalized date-only values, while the departure countdown compares calendar dates. This avoids browser-timezone and daylight-saving shifts changing the displayed trip day.

## 4. Removing a traveler preserves historical references

A removed traveler is soft-removed from active membership rather than deleted from the domain. This keeps authorship/history resolvable. Removal is blocked while that traveler owns expense or packing obligations; itinerary attendance/votes are cleaned when removal succeeds.

## 5. Google Maps uses universal links in the credential-free release

Opening places and directions through Google Maps URLs provides a real, familiar integration without embedding a billable Maps SDK or exposing provider credentials. An embedded map should only be introduced when in-app geographic interaction justifies the additional key, billing, and security surface.
`;
write('docs/DECISIONS.md',decisions);

let readme=read('README.md');
readme=readme.replaceAll('wanderline-workspace-v2','wanderline-workspace-v3');
readme=replaceRequired(readme,'**Quality:** strict TypeScript, GitHub Actions, production smoke testing, pinned dependencies','**Quality:** strict TypeScript, targeted repository linting, domain/storage regression tests, GitHub Actions, production smoke testing, lockfile-reproducible installs, pinned direct dependencies','README quality stack');
readme=replaceRequired(readme,'npm run check\nnpm run smoke:server','npm run lint\nnpm test\nnpm run check\nnpm run smoke:server','README verification commands');
readme=replaceRequired(readme,'`npm run check` typechecks both TypeScript targets, builds the Vite client and Express host, and verifies production artifacts. `npm run smoke:server` starts the compiled server on a temporary port and validates its API contract.','`npm run check` runs repository hygiene checks, typechecks both TypeScript targets, executes domain/storage regression tests, builds the Vite client and Express host, and verifies production artifacts. `npm run smoke:server` starts the compiled server on a temporary port and validates its API contract. CI installs from the committed lockfile with `npm ci`.','README check explanation');
readme=replaceRequired(readme,'Firestore security rules must enforce trip membership and owner-only operations. Once cloud persistence is connected, pending local invitations become real invitations, collaborator changes synchronize between devices, and private trip links can resolve against authenticated membership.','Firestore security rules must enforce trip membership and owner-only operations. The current React role checks are defense-in-depth for the local demo, not a substitute for server/database authorization. Once cloud persistence is connected, pending local invitations become real invitations, collaborator changes synchronize between devices, and private trip links can resolve against authenticated membership.');
readme=replaceRequired(readme,'- [`docs/PROJECT_MAP.md`](docs/PROJECT_MAP.md) — current source ownership map','- [`docs/PROJECT_MAP.md`](docs/PROJECT_MAP.md) — current source ownership map\n- [`docs/DECISIONS.md`](docs/DECISIONS.md) — concise records for money, date, membership, map, and cloud-boundary decisions','README decisions link');
write('README.md',readme);

let architecture=read('docs/ARCHITECTURE.md');
architecture=architecture.replaceAll('Workspace v2','Workspace v3').replaceAll('schema version (`2`)','schema version (`3`)').replaceAll('wanderline-workspace-v2','wanderline-workspace-v3');
architecture=replaceRequired(architecture,'Invalid or blocked storage falls back to the built-in sample workspace rather than crashing the app.','Invalid or blocked storage falls back to the built-in sample workspace rather than crashing the app. A valid legacy `wanderline-workspace-v2` workspace is migrated forward to v3 so a schema bump does not silently discard a reviewer’s local edits.');
architecture=replaceRequired(architecture,'Derived balance logic calculates what each traveler paid versus their assigned share. A settlement pass matches debtors and creditors to provide a concise “who owes whom” result.','Derived balance logic calculates what each traveler paid versus their assigned share using integer cents. Equal splits allocate remainder cents deterministically, and a cent-based settlement pass matches debtors and creditors to provide a concise “who owes whom” result without floating-point drift.');
architecture += '\n## Authorization boundary\n\nLocal Owner/Editor/Viewer checks are enforced both when rendering actions and again at the central mutation seam. They prevent accidental or UI-level writes in the portfolio demo. They are **not** presented as a security boundary between real accounts: hosted private collaboration requires Firebase Authentication identity mapped to trip membership plus Firestore security rules that reject unauthorized document access.\n\n## Date-only handling\n\nTrip and itinerary dates remain `YYYY-MM-DD` calendar values. Date arithmetic is normalized independently of the browser timezone, and the departure countdown compares local calendar dates instead of subtracting the current timestamp from local midnight. This avoids DST and UTC conversion errors around travel dates.\n';
write('docs/ARCHITECTURE.md',architecture);

let qa=read('docs/QA.md');
if(!qa.includes('## Automated regression coverage'))qa += `\n## Automated regression coverage\n\nRun:\n\n\`\`\`bash\nnpm run lint\nnpm test\nnpm run check\nnpm run smoke:server\n\`\`\`\n\nAutomated tests protect date-only arithmetic, cent-accurate money aggregation and splitting, balance/settlement reconciliation, removed-member history behavior, corrupted-storage recovery, v2→v3 browser migration, and stale active-trip recovery. CI uses the committed lockfile with \`npm ci\` before running the complete check and compiled-server smoke test.\n\n### Permission regression checklist\n\n- Viewer: may browse all local trip sections but cannot mutate itinerary, ideas/votes, budget, packing, notes, bookings, travelers, or trip settings.\n- Editor: may modify shared planning resources but cannot manage trip settings or traveler roles.\n- Owner: may modify shared planning resources and manage trip/member settings.\n- Direct UI leaks are still contained by the central trip mutation guard; hosted security must additionally be enforced by Firestore rules.\n`;
write('docs/QA.md',qa);

let deployment=read('docs/DEPLOYMENT.md');
if(!deployment.includes('npm ci'))deployment += '\n## Reproducible install\n\nThe repository commits `package-lock.json`. CI and production verification should use `npm ci --include=dev --no-audit --no-fund` so dependency resolution matches the reviewed lockfile.\n';
write('docs/DEPLOYMENT.md',deployment);

let css=read('src/app-v2.css');
css=replaceRequired(css,'.wl-sidebar{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:18px 12px 14px;','.wl-sidebar{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:18px 12px max(14px,env(safe-area-inset-bottom));','sidebar safe area');
css=replaceRequired(css,'.wl-overlay{position:fixed;inset:0;z-index:200;background:#101818a3;backdrop-filter:blur(5px);display:grid;place-items:center;padding:20px;overflow-y:auto}', '.wl-overlay{position:fixed;inset:0;z-index:200;background:#101818a3;backdrop-filter:blur(5px);display:grid;place-items:center;padding:20px;overflow-y:auto;overscroll-behavior:contain}', 'modal overscroll');
css=replaceRequired(css,'@media(max-width:700px){.wl-header{height:62px;gap:6px}', '@media(max-width:700px){.wl-header{height:62px;gap:6px;padding-top:env(safe-area-inset-top)}', 'mobile safe area');
css=replaceRequired(css,'.wl-page-head{align-items:flex-start;flex-direction:column}', '.wl-page-inner{padding-bottom:calc(72px + env(safe-area-inset-bottom))}.wl-page-head{align-items:flex-start;flex-direction:column}', 'mobile content safe area');
write('src/app-v2.css',css);

console.log('Wanderline hardening transformation applied.');
