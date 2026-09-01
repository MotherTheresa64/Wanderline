import {freshDemo} from './demo';
import {normalizeWorkspace} from './model';
import type {Activity,Expense,HistoryEvent,PackingItem,Reservation,SavedPlace,Trip,TripMember,TripNote,Workspace} from './model';

export const WORKSPACE_KEY='wanderline-workspace-v4';
export const LEGACY_WORKSPACE_KEY='wanderline-workspace-v3';

const roles=new Set(['owner','editor','viewer']);
const statuses=new Set(['active','pending','removed']);
const activityStatuses=new Set(['suggested','planned','confirmed','completed']);
const activityCategories=new Set(['food','sight','transit','shopping','lodging','event','other']);
const expenseCategories=new Set(['Lodging','Food','Transportation','Activities','Shopping','Other']);
const splitModes=new Set(['personal','equal','custom']);
const packingScopes=new Set(['personal','shared']);
const reservationTypes=new Set(['Flight','Hotel','Rental car','Restaurant','Event','Other']);

function object(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==='object'&&!Array.isArray(value)}
function string(value:unknown):value is string{return typeof value==='string'}
function number(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)}
function stringArray(value:unknown):value is string[]{return Array.isArray(value)&&value.every(string)}
function enumValue<T extends string>(value:unknown,values:Set<string>):value is T{return string(value)&&values.has(value)}

function isMember(value:unknown):value is TripMember{
  if(!object(value))return false;
  return string(value.id)&&string(value.name)&&string(value.email)&&string(value.initials)&&enumValue(value.role,roles)&&enumValue(value.status,statuses);
}

function isActivity(value:unknown):value is Activity{
  if(!object(value))return false;
  return string(value.id)&&string(value.date)&&string(value.time)&&string(value.title)&&string(value.location)&&enumValue(value.category,activityCategories)&&number(value.durationMinutes)&&number(value.cost)&&string(value.note)&&enumValue(value.status,activityStatuses)&&string(value.createdBy)&&stringArray(value.attendeeIds)&&stringArray(value.votes);
}

function isPlace(value:unknown):value is SavedPlace{
  if(!object(value))return false;
  return string(value.id)&&string(value.name)&&string(value.category)&&string(value.neighborhood)&&string(value.note)&&string(value.createdBy);
}

function isExpense(value:unknown):value is Expense{
  if(!object(value))return false;
  const custom=value.customShares;
  const customValid=custom===undefined||(object(custom)&&Object.values(custom).every(number));
  return string(value.id)&&string(value.description)&&number(value.amount)&&enumValue(value.category,expenseCategories)&&string(value.paidBy)&&stringArray(value.participantIds)&&enumValue(value.splitMode,splitModes)&&customValid&&string(value.createdAt);
}

function isPacking(value:unknown):value is PackingItem{
  if(!object(value))return false;
  return string(value.id)&&string(value.label)&&enumValue(value.scope,packingScopes)&&string(value.assignedTo)&&typeof value.done==='boolean';
}

function isNote(value:unknown):value is TripNote{
  if(!object(value))return false;
  return string(value.id)&&string(value.title)&&string(value.body)&&string(value.createdBy)&&string(value.updatedAt);
}

function isReservation(value:unknown):value is Reservation{
  if(!object(value))return false;
  return string(value.id)&&enumValue(value.type,reservationTypes)&&string(value.title)&&string(value.date)&&string(value.time)&&string(value.location)&&string(value.confirmation)&&string(value.note);
}

function isHistory(value:unknown):value is HistoryEvent{
  if(!object(value))return false;
  return string(value.id)&&string(value.text)&&string(value.memberId)&&string(value.createdAt);
}

function arrayOf<T>(value:unknown,guard:(item:unknown)=>item is T):value is T[]{return Array.isArray(value)&&value.every(guard)}

function isTrip(value:unknown):value is Trip{
  if(!object(value))return false;
  return string(value.id)&&string(value.name)&&string(value.destination)&&string(value.startDate)&&string(value.endDate)&&string(value.description)&&number(value.budget)&&typeof value.archived==='boolean'&&arrayOf(value.members,isMember)&&arrayOf(value.activities,isActivity)&&arrayOf(value.places,isPlace)&&arrayOf(value.expenses,isExpense)&&arrayOf(value.packing,isPacking)&&arrayOf(value.notes,isNote)&&arrayOf(value.reservations,isReservation)&&arrayOf(value.history,isHistory);
}

export function parseWorkspace(value:unknown):Workspace|null{
  if(!object(value))return null;
  if(value.version!==3&&value.version!==4)return null;
  if(!string(value.currentUserId)||!string(value.activeTripId)||!arrayOf(value.trips,isTrip)||value.trips.length===0)return null;
  const trips=value.trips.some(trip=>!trip.archived)?value.trips:value.trips.map((trip,index)=>index===0?{...trip,archived:false}:trip);
  const workspace={version:4,currentUserId:value.currentUserId,activeTripId:value.activeTripId,trips} satisfies Workspace;
  return normalizeWorkspace(workspace);
}

function read(key:string){
  try{return JSON.parse(localStorage.getItem(key)||'null') as unknown}catch{return null}
}

export function loadWorkspace():Workspace{
  const current=parseWorkspace(read(WORKSPACE_KEY));
  if(current)return current;
  const legacy=parseWorkspace(read(LEGACY_WORKSPACE_KEY));
  if(legacy){
    saveWorkspace(legacy);
    try{localStorage.removeItem(LEGACY_WORKSPACE_KEY)}catch{}
    return legacy;
  }
  return normalizeWorkspace(freshDemo());
}

export function saveWorkspace(workspace:Workspace){
  const normalized=normalizeWorkspace(workspace);
  try{localStorage.setItem(WORKSPACE_KEY,JSON.stringify(normalized))}catch{/* Private/blocked storage should not break the live session. */}
}

export function resetWorkspace(){
  const next=normalizeWorkspace(freshDemo());
  try{
    localStorage.setItem(WORKSPACE_KEY,JSON.stringify(next));
    localStorage.removeItem(LEGACY_WORKSPACE_KEY);
  }catch{/* Keep reset usable in memory. */}
  return next;
}
