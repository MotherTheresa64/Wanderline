import {freshDemo} from './demo';
import type {Trip,Workspace} from './model';

const KEY='wanderline-workspace-v2';

function looksLikeTrip(value:unknown):value is Trip{
  if(!value||typeof value!=='object')return false;
  const trip=value as Partial<Trip>;
  return typeof trip.id==='string'&&typeof trip.name==='string'&&typeof trip.destination==='string'&&typeof trip.startDate==='string'&&typeof trip.endDate==='string'&&typeof trip.budget==='number'&&Array.isArray(trip.members)&&Array.isArray(trip.activities)&&Array.isArray(trip.places)&&Array.isArray(trip.expenses)&&Array.isArray(trip.packing)&&Array.isArray(trip.notes)&&Array.isArray(trip.reservations)&&Array.isArray(trip.history);
}

export function loadWorkspace():Workspace{
  try{
    const parsed=JSON.parse(localStorage.getItem(KEY)||'null') as Partial<Workspace>|null;
    if(parsed?.version===2&&typeof parsed.currentUserId==='string'&&typeof parsed.activeTripId==='string'&&Array.isArray(parsed.trips)&&parsed.trips.length>0&&parsed.trips.every(looksLikeTrip))return parsed as Workspace;
  }catch{/* Fall back to the polished sample workspace. */}
  return freshDemo();
}

export function saveWorkspace(workspace:Workspace){
  try{localStorage.setItem(KEY,JSON.stringify(workspace))}catch{/* Private/blocked storage should not break the live session. */}
}

export function resetWorkspace(){
  const next=freshDemo();
  try{localStorage.setItem(KEY,JSON.stringify(next))}catch{/* Keep reset usable in memory. */}
  return next;
}
