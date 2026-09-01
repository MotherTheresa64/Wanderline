export type View='overview'|'itinerary'|'ideas'|'places'|'budget'|'packing'|'notes'|'travelers'|'activity';
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
  version:4;
  currentUserId:string;
  activeTripId:string;
  trips:Trip[];
};

export type TripPermissions={
  canRead:boolean;
  canVote:boolean;
  canEdit:boolean;
  canManageMembers:boolean;
  canManageTrip:boolean;
};

const DAY_MS=86_400_000;
const DATE_ONLY=/^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_ONLY=/^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function finiteNumber(value:number,fallback=0){
  return Number.isFinite(value)?value:fallback;
}

export function toCents(value:number){
  return Math.round(finiteNumber(value)*100);
}

export function fromCents(value:number){
  return Math.round(finiteNumber(value))/100;
}

export function money(value:number){
  const safe=fromCents(toCents(value));
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:Number.isInteger(safe)?0:2}).format(safe);
}

export function compactMoney(value:number){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:Math.abs(value)>=10_000?'compact':'standard',maximumFractionDigits:1}).format(finiteNumber(value));
}

export function initials(name:string){
  const parts=name.trim().split(/\s+/).filter(Boolean);
  return (parts.length>1?`${parts[0][0]}${parts.at(-1)?.[0]??''}`:parts[0]?.slice(0,2)??'?').toUpperCase();
}

export function isValidDateOnly(value:string){
  const match=DATE_ONLY.exec(value);
  if(!match)return false;
  const year=Number(match[1]);
  const month=Number(match[2]);
  const day=Number(match[3]);
  const parsed=new Date(Date.UTC(year,month-1,day));
  return parsed.getUTCFullYear()===year&&parsed.getUTCMonth()===month-1&&parsed.getUTCDate()===day;
}

export function dateOnly(value:string){
  if(!isValidDateOnly(value))return new Date(Number.NaN);
  const [year,month,day]=value.split('-').map(Number);
  return new Date(Date.UTC(year,month-1,day));
}

export function daysBetween(start:string,end:string){
  if(!isValidDateOnly(start)||!isValidDateOnly(end)||end<start)return 0;
  return Math.round((dateOnly(end).getTime()-dateOnly(start).getTime())/DAY_MS)+1;
}

export function tripDates(start:string,end:string){
  const result:string[]=[];
  const total=daysBetween(start,end);
  if(total<=0)return result;
  const first=dateOnly(start).getTime();
  for(let index=0;index<total;index++)result.push(new Date(first+index*DAY_MS).toISOString().slice(0,10));
  return result;
}

export function dateInTrip(date:string,start:string,end:string){
  return isValidDateOnly(date)&&isValidDateOnly(start)&&isValidDateOnly(end)&&start<=end&&date>=start&&date<=end;
}

export function clampDateToTrip(date:string,start:string,end:string){
  if(!isValidDateOnly(start)||!isValidDateOnly(end)||end<start)return start;
  if(!isValidDateOnly(date)||date<start)return start;
  if(date>end)return end;
  return date;
}

export function localTodayDateOnly(now=new Date()){
  const year=now.getFullYear();
  const month=String(now.getMonth()+1).padStart(2,'0');
  const day=String(now.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

export function countdownToDate(target:string,today=localTodayDateOnly()){
  if(!isValidDateOnly(target)||!isValidDateOnly(today))return 0;
  return Math.round((dateOnly(target).getTime()-dateOnly(today).getTime())/DAY_MS);
}

export function dateLabel(value:string,options:Intl.DateTimeFormatOptions={weekday:'short',month:'short',day:'numeric'}){
  if(!isValidDateOnly(value))return 'Invalid date';
  return new Intl.DateTimeFormat('en-US',{timeZone:'UTC',...options}).format(dateOnly(value));
}

export function minutesLabel(minutes:number){
  const safe=Math.max(0,Math.round(finiteNumber(minutes)));
  if(safe<60)return `${safe} min`;
  const hours=Math.floor(safe/60);
  const rest=safe%60;
  return rest?`${hours}h ${rest}m`:`${hours}h`;
}

export function memberName(trip:Trip,id:string){
  return trip.members.find(member=>member.id===id)?.name??'Former traveler';
}

export function tripOwner(trip:Trip){
  return trip.members.find(member=>member.status==='active'&&member.role==='owner');
}

export function activeMembers(trip:Trip){
  return trip.members.filter(member=>member.status==='active');
}

export function permissionsFor(member:TripMember|undefined):TripPermissions{
  const active=member?.status==='active';
  const owner=active&&member?.role==='owner';
  const editor=active&&(member?.role==='owner'||member?.role==='editor');
  return {canRead:Boolean(active),canVote:Boolean(active),canEdit:Boolean(editor),canManageMembers:Boolean(owner),canManageTrip:Boolean(owner)};
}

export function tripProgress(trip:Trip){
  const actionable=trip.activities.filter(activity=>activity.status!=='suggested');
  if(!actionable.length)return 0;
  return Math.round(actionable.filter(activity=>activity.status==='completed').length/actionable.length*100);
}

export function sortActivitiesChronologically(items:Activity[]){
  return [...items].sort((a,b)=>{
    const date=a.date.localeCompare(b.date);
    if(date)return date;
    const time=(TIME_ONLY.test(a.time)?a.time:'23:59').localeCompare(TIME_ONLY.test(b.time)?b.time:'23:59');
    if(time)return time;
    const title=a.title.localeCompare(b.title);
    return title||a.id.localeCompare(b.id);
  });
}

function uniqueIds(ids:string[]){
  return [...new Set(ids.filter(Boolean))];
}

export function equalSplitCents(amount:number,participantIds:string[]){
  const ids=uniqueIds(participantIds);
  const result:Record<string,number>={};
  if(!ids.length)return result;
  const cents=Math.max(0,toCents(amount));
  const base=Math.floor(cents/ids.length);
  let remainder=cents-base*ids.length;
  for(const id of ids){
    result[id]=base+(remainder>0?1:0);
    if(remainder>0)remainder--;
  }
  return result;
}

export function expenseSharesCents(expense:Expense){
  const participants=uniqueIds(expense.participantIds);
  const result:Record<string,number>={};
  if(!participants.length)return result;
  if(expense.splitMode==='personal'){
    result[participants[0]]=Math.max(0,toCents(expense.amount));
    return result;
  }
  if(expense.splitMode==='equal')return equalSplitCents(expense.amount,participants);
  for(const id of participants)result[id]=Math.max(0,toCents(expense.customShares?.[id]??0));
  return result;
}

export function expenseShares(expense:Expense){
  return Object.fromEntries(Object.entries(expenseSharesCents(expense)).map(([id,cents])=>[id,fromCents(cents)]));
}

export function expenseShare(expense:Expense,memberId:string){
  return fromCents(expenseSharesCents(expense)[memberId]??0);
}

export function validateExpense(expense:Expense,validMemberIds?:Iterable<string>){
  const issues:string[]=[];
  const amountCents=toCents(expense.amount);
  const participants=uniqueIds(expense.participantIds);
  const valid=validMemberIds?new Set(validMemberIds):null;
  if(amountCents<=0)issues.push('Expense amount must be greater than zero.');
  if(!expense.description.trim())issues.push('Expense description is required.');
  if(!expense.paidBy)issues.push('A payer is required.');
  if(valid&&!valid.has(expense.paidBy))issues.push('The payer must be an active traveler.');
  if(!participants.length)issues.push('At least one responsible traveler is required.');
  if(valid&&participants.some(id=>!valid.has(id)))issues.push('Every participant must be an active traveler.');
  if(expense.splitMode==='personal'&&participants.length!==1)issues.push('A personal expense must have exactly one responsible traveler.');
  if(expense.splitMode==='custom'){
    const custom=expense.customShares??{};
    let total=0;
    for(const id of participants){
      const share=custom[id];
      if(!Number.isFinite(share)||share<0)issues.push('Custom shares must be nonnegative numbers.');
      total+=Math.max(0,toCents(Number.isFinite(share)?share:0));
    }
    if(total!==amountCents)issues.push('Custom shares must add up to the expense total exactly to the cent.');
  }
  return {valid:issues.length===0,issues};
}

export function balances(trip:Trip){
  const active=activeMembers(trip);
  const rows=new Map(active.map(member=>[member.id,{member,paidCents:0,shareCents:0}]));
  for(const expense of trip.expenses){
    const payer=rows.get(expense.paidBy);
    if(payer)payer.paidCents+=Math.max(0,toCents(expense.amount));
    for(const [memberId,share] of Object.entries(expenseSharesCents(expense))){
      const row=rows.get(memberId);
      if(row)row.shareCents+=share;
    }
  }
  return [...rows.values()].map(({member,paidCents,shareCents})=>({member,paid:fromCents(paidCents),share:fromCents(shareCents),balance:fromCents(paidCents-shareCents)}));
}

export function calculateSettlements(trip:Trip){
  const rows=balances(trip).map(row=>({id:row.member.id,cents:toCents(row.balance)}));
  const debtors=rows.filter(row=>row.cents<0).map(row=>({id:row.id,cents:-row.cents}));
  const creditors=rows.filter(row=>row.cents>0).map(row=>({...row}));
  const result:Array<{from:string;to:string;amount:number}>=[];
  let debtorIndex=0;
  let creditorIndex=0;
  while(debtorIndex<debtors.length&&creditorIndex<creditors.length){
    const debtor=debtors[debtorIndex];
    const creditor=creditors[creditorIndex];
    const cents=Math.min(debtor.cents,creditor.cents);
    if(cents>0)result.push({from:debtor.id,to:creditor.id,amount:fromCents(cents)});
    debtor.cents-=cents;
    creditor.cents-=cents;
    if(debtor.cents===0)debtorIndex++;
    if(creditor.cents===0)creditorIndex++;
  }
  return result;
}

export function reconcileTripDateRange(trip:Trip,startDate:string,endDate:string){
  if(!isValidDateOnly(startDate)||!isValidDateOnly(endDate)||endDate<startDate)return {trip,movedActivities:0,movedReservations:0};
  let movedActivities=0;
  let movedReservations=0;
  const activities=trip.activities.map(activity=>{
    const date=clampDateToTrip(activity.date,startDate,endDate);
    if(date!==activity.date)movedActivities++;
    return date===activity.date?activity:{...activity,date};
  });
  const reservations=trip.reservations.map(reservation=>{
    const date=clampDateToTrip(reservation.date,startDate,endDate);
    if(date!==reservation.date)movedReservations++;
    return date===reservation.date?reservation:{...reservation,date};
  });
  return {trip:{...trip,startDate,endDate,activities,reservations},movedActivities,movedReservations};
}

export function changeMemberRole(trip:Trip,memberId:string,role:MemberRole):{trip:Trip;error:string|null}{
  const member=trip.members.find(item=>item.id===memberId);
  if(!member)return {trip,error:'Traveler not found.'};
  if(member.status!=='active')return {trip,error:'Only active travelers can have their role changed.'};
  if(member.role==='owner'&&role!=='owner'){
    const owners=trip.members.filter(item=>item.status==='active'&&item.role==='owner');
    if(owners.length<=1)return {trip,error:'A trip must always have at least one active owner.'};
  }
  return {trip:{...trip,members:trip.members.map(item=>item.id===memberId?{...item,role}:item)},error:null};
}

export function removeTripMember(trip:Trip,memberId:string):{trip:Trip;error:string|null}{
  const member=trip.members.find(item=>item.id===memberId);
  if(!member)return {trip,error:'Traveler not found.'};
  if(member.status==='removed')return {trip,error:'That traveler has already been removed.'};
  if(member.status==='pending')return {trip:{...trip,members:trip.members.filter(item=>item.id!==memberId)},error:null};
  if(member.role==='owner'){
    const owners=trip.members.filter(item=>item.status==='active'&&item.role==='owner');
    if(owners.length<=1)return {trip,error:'Assign another owner before removing the final active owner.'};
  }
  const expenseRefs=trip.expenses.filter(expense=>expense.paidBy===memberId||expense.participantIds.includes(memberId));
  if(expenseRefs.length)return {trip,error:`Reassign or remove ${expenseRefs.length} expense${expenseRefs.length===1?'':'s'} involving ${member.name} before removing them.`};
  const sharedPacking=trip.packing.filter(item=>item.scope==='shared'&&item.assignedTo===memberId);
  if(sharedPacking.length)return {trip,error:`Reassign ${sharedPacking.length} shared packing item${sharedPacking.length===1?'':'s'} from ${member.name} before removing them.`};
  return {
    trip:{
      ...trip,
      members:trip.members.map(item=>item.id===memberId?{...item,status:'removed'}:item),
      activities:trip.activities.map(activity=>({...activity,attendeeIds:activity.attendeeIds.filter(id=>id!==memberId),votes:activity.votes.filter(id=>id!==memberId)})),
      packing:trip.packing.filter(item=>!(item.scope==='personal'&&item.assignedTo===memberId))
    },
    error:null
  };
}

function normalizeTime(value:string,fallback='10:00'){
  return TIME_ONLY.test(value)?value:fallback;
}

export function normalizeTrip(trip:Trip):Trip{
  const start=isValidDateOnly(trip.startDate)?trip.startDate:localTodayDateOnly();
  const end=isValidDateOnly(trip.endDate)&&trip.endDate>=start?trip.endDate:start;
  let members=trip.members.map(member=>({...member,email:member.email.trim().toLowerCase(),initials:member.initials||initials(member.name)}));
  let active=members.filter(member=>member.status==='active');
  if(!active.length&&members.length){
    const first=members[0];
    members=members.map(member=>member.id===first.id?{...member,status:'active',role:'owner'}:member);
    active=members.filter(member=>member.status==='active');
  }
  if(active.length&&!active.some(member=>member.role==='owner')){
    const first=active[0];
    members=members.map(member=>member.id===first.id?{...member,role:'owner'}:member);
  }
  const activeIds=new Set(members.filter(member=>member.status==='active').map(member=>member.id));
  const allIds=new Set(members.map(member=>member.id));
  const ownerId=members.find(member=>member.status==='active'&&member.role==='owner')?.id??members[0]?.id??'';
  const activities=sortActivitiesChronologically(trip.activities.map(activity=>({
    ...activity,
    date:clampDateToTrip(activity.date,start,end),
    time:normalizeTime(activity.time),
    durationMinutes:Math.max(15,Math.round(finiteNumber(activity.durationMinutes,15))),
    cost:Math.max(0,fromCents(toCents(activity.cost))),
    createdBy:allIds.has(activity.createdBy)?activity.createdBy:ownerId,
    attendeeIds:uniqueIds(activity.attendeeIds).filter(id=>activeIds.has(id)),
    votes:uniqueIds(activity.votes).filter(id=>activeIds.has(id))
  })));
  const expenses=trip.expenses.map(expense=>{
    const participantIds=uniqueIds(expense.participantIds).filter(id=>activeIds.has(id));
    const paidBy=activeIds.has(expense.paidBy)?expense.paidBy:ownerId;
    let splitMode=expense.splitMode;
    let customShares=expense.customShares;
    let participants=participantIds;
    if(!participants.length&&paidBy)participants=[paidBy];
    if(splitMode==='personal')participants=participants.slice(0,1);
    const candidate:Expense={...expense,description:expense.description.trim(),amount:Math.max(0,fromCents(toCents(expense.amount))),paidBy,participantIds:participants,splitMode,customShares};
    if(splitMode==='custom'&&!validateExpense(candidate,activeIds).valid){splitMode='equal';customShares=undefined}
    return {...candidate,splitMode,customShares};
  });
  return {
    ...trip,
    name:trip.name.trim()||'Untitled trip',
    destination:trip.destination.trim()||'Destination',
    startDate:start,
    endDate:end,
    budget:Math.max(0,fromCents(toCents(trip.budget))),
    members,
    activities,
    places:trip.places.map(place=>({...place,createdBy:allIds.has(place.createdBy)?place.createdBy:ownerId})),
    expenses,
    packing:trip.packing.filter(item=>item.scope==='shared'||activeIds.has(item.assignedTo)).map(item=>({...item,assignedTo:activeIds.has(item.assignedTo)?item.assignedTo:ownerId})),
    notes:trip.notes.map(note=>({...note,createdBy:allIds.has(note.createdBy)?note.createdBy:ownerId})),
    reservations:trip.reservations.map(reservation=>({...reservation,date:clampDateToTrip(reservation.date,start,end),time:normalizeTime(reservation.time,'15:00')})),
    history:trip.history.map(event=>({...event,memberId:allIds.has(event.memberId)?event.memberId:ownerId})).slice(0,100)
  };
}

export function normalizeWorkspace(workspace:Workspace):Workspace{
  const trips=workspace.trips.map(normalizeTrip);
  if(!trips.length)return workspace;
  const candidate=trips.find(trip=>trip.id===workspace.activeTripId&&!trip.archived)
    ??trips.find(trip=>!trip.archived)
    ??trips[0];
  const currentTrip=candidate;
  let currentUserId=workspace.currentUserId;
  if(!currentTrip.members.some(member=>member.id===currentUserId&&member.status==='active')){
    currentUserId=tripOwner(currentTrip)?.id??currentTrip.members.find(member=>member.status==='active')?.id??currentUserId;
  }
  return {version:4,currentUserId,activeTripId:candidate.id,trips};
}
