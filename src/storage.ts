import {freshDemo} from './demo';
import {isDateOnly,isValidDateRange} from './model';
import type {Activity,Expense,PackingItem,Reservation,SavedPlace,Trip,TripMember,TripNote,Workspace} from './model';

const KEY='wanderline-workspace-v3';
const MAX_TRIPS=100;
const MAX_COLLECTION=5000;
const isRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const isText=(value:unknown,max=20_000):value is string=>typeof value==='string'&&value.length<=max;
const isId=(value:unknown):value is string=>isText(value,200)&&value.trim().length>0;
const isMoney=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1_000_000_000;
const isList=(value:unknown)=>Array.isArray(value)&&value.length<=MAX_COLLECTION;
const unique=(values:string[])=>new Set(values).size===values.length;

function isMember(value:unknown):value is TripMember{
  if(!isRecord(value))return false;
  return isId(value.id)&&isText(value.name,200)&&isText(value.email,320)&&isText(value.initials,8)&&['owner','editor','viewer'].includes(String(value.role))&&['active','pending'].includes(String(value.status));
}

function isActivity(value:unknown):value is Activity{
  if(!isRecord(value))return false;
  return isId(value.id)&&isDateOnly(String(value.date))&&/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value.time))&&isText(value.title,500)&&isText(value.location,1000)&&['food','sight','transit','shopping','lodging','event','other'].includes(String(value.category))&&typeof value.durationMinutes==='number'&&Number.isFinite(value.durationMinutes)&&value.durationMinutes>=0&&value.durationMinutes<=10080&&isMoney(value.cost)&&isText(value.note)&&['suggested','planned','confirmed','completed'].includes(String(value.status))&&isId(value.createdBy)&&isList(value.attendeeIds)&&value.attendeeIds.every(isId)&&isList(value.votes)&&value.votes.every(isId);
}

function isPlace(value:unknown):value is SavedPlace{
  if(!isRecord(value))return false;
  return isId(value.id)&&isText(value.name,500)&&isText(value.category,200)&&isText(value.neighborhood,500)&&isText(value.note)&&isId(value.createdBy);
}

function isExpense(value:unknown):value is Expense{
  if(!isRecord(value))return false;
  const custom=value.customShares;
  const validCustom=custom===undefined||(isRecord(custom)&&Object.entries(custom).every(([id,amount])=>isId(id)&&isMoney(amount)));
  return isId(value.id)&&isText(value.description,500)&&isMoney(value.amount)&&['Lodging','Food','Transportation','Activities','Shopping','Other'].includes(String(value.category))&&isId(value.paidBy)&&isList(value.participantIds)&&value.participantIds.length>0&&value.participantIds.every(isId)&&unique(value.participantIds)&&['personal','equal','custom'].includes(String(value.splitMode))&&validCustom&&isText(value.createdAt,100);
}

function isPackingItem(value:unknown):value is PackingItem{
  if(!isRecord(value))return false;
  return isId(value.id)&&isText(value.label,500)&&['personal','shared'].includes(String(value.scope))&&isId(value.assignedTo)&&typeof value.done==='boolean';
}

function isNote(value:unknown):value is TripNote{
  if(!isRecord(value))return false;
  return isId(value.id)&&isText(value.title,500)&&isText(value.body)&&isId(value.createdBy)&&isText(value.updatedAt,100);
}

function isReservation(value:unknown):value is Reservation{
  if(!isRecord(value))return false;
  return isId(value.id)&&['Flight','Hotel','Rental car','Restaurant','Event','Other'].includes(String(value.type))&&isText(value.title,500)&&isDateOnly(String(value.date))&&/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value.time))&&isText(value.location,1000)&&isText(value.confirmation,1000)&&isText(value.note);
}

export function looksLikeTrip(value:unknown):value is Trip{
  if(!isRecord(value))return false;
  if(!isId(value.id)||!isText(value.name,500)||!isText(value.destination,1000)||!isText(value.startDate,10)||!isText(value.endDate,10)||!isValidDateRange(value.startDate,value.endDate)||!isText(value.description)||!isMoney(value.budget)||typeof value.archived!=='boolean')return false;
  if(!isList(value.members)||value.members.length===0||!value.members.every(isMember)||!unique(value.members.map(member=>member.id)))return false;
  if(value.members.filter(member=>member.role==='owner'&&member.status==='active').length!==1)return false;
  if(!isList(value.activities)||!value.activities.every(isActivity)||!unique(value.activities.map(item=>item.id)))return false;
  if(!isList(value.places)||!value.places.every(isPlace)||!unique(value.places.map(item=>item.id)))return false;
  if(!isList(value.expenses)||!value.expenses.every(isExpense)||!unique(value.expenses.map(item=>item.id)))return false;
  if(!isList(value.packing)||!value.packing.every(isPackingItem)||!unique(value.packing.map(item=>item.id)))return false;
  if(!isList(value.notes)||!value.notes.every(isNote)||!unique(value.notes.map(item=>item.id)))return false;
  if(!isList(value.reservations)||!value.reservations.every(isReservation)||!unique(value.reservations.map(item=>item.id)))return false;
  if(!isList(value.history)||!value.history.every(item=>isRecord(item)&&isId(item.id)&&isText(item.text,2000)&&isId(item.memberId)&&isText(item.createdAt,100)))return false;
  return true;
}

export function parseWorkspace(value:unknown):Workspace|null{
  if(!isRecord(value)||value.version!==3||!isId(value.currentUserId)||!isId(value.activeTripId)||!Array.isArray(value.trips)||value.trips.length===0||value.trips.length>MAX_TRIPS||!value.trips.every(looksLikeTrip))return null;
  const trips=value.trips as Trip[];
  if(!unique(trips.map(trip=>trip.id)))return null;
  const active=trips.find(trip=>trip.id===value.activeTripId);
  if(!active||!active.members.some(member=>member.id===value.currentUserId&&member.status==='active'))return null;
  return value as Workspace;
}

export function loadWorkspace():Workspace{
  try{
    const parsed=JSON.parse(localStorage.getItem(KEY)||'null') as unknown;
    return parseWorkspace(parsed)??freshDemo();
  }catch{/* Fall back to the polished sample workspace. */}
  return freshDemo();
}

export function saveWorkspace(workspace:Workspace){
  if(!parseWorkspace(workspace))return false;
  try{localStorage.setItem(KEY,JSON.stringify(workspace));return true}catch{/* Private/blocked storage should not break the live session. */return false}
}

export function resetWorkspace(){
  const next=freshDemo();
  try{localStorage.setItem(KEY,JSON.stringify(next))}catch{/* Keep reset usable in memory. */}
  return next;
}
