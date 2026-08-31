export type View='overview'|'itinerary'|'ideas'|'places'|'budget'|'packing'|'notes'|'travelers'|'activity';
export type MemberRole='owner'|'editor'|'viewer';
export type MemberStatus='active'|'pending';
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

export function money(value:number){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:value%1===0?0:2}).format(value);
}

export function compactMoney(value:number){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:value>=10_000?'compact':'standard',maximumFractionDigits:1}).format(value);
}

export function initials(name:string){
  const parts=name.trim().split(/\s+/).filter(Boolean);
  return (parts.length>1?`${parts[0][0]}${parts.at(-1)?.[0]??''}`:parts[0]?.slice(0,2)??'?').toUpperCase();
}

export function dateOnly(value:string){
  const [year,month,day]=value.split('-').map(Number);
  return new Date(Date.UTC(year,month-1,day));
}

export function daysBetween(start:string,end:string){
  return Math.max(1,Math.round((dateOnly(end).getTime()-dateOnly(start).getTime())/86_400_000)+1);
}

export function tripDates(start:string,end:string){
  const result:string[]=[];
  const first=dateOnly(start);
  const total=daysBetween(start,end);
  for(let index=0;index<total;index++){
    const next=new Date(first.getTime()+index*86_400_000);
    result.push(next.toISOString().slice(0,10));
  }
  return result;
}

export function dateLabel(value:string,options:Intl.DateTimeFormatOptions={weekday:'short',month:'short',day:'numeric'}){
  return new Intl.DateTimeFormat('en-US',{timeZone:'UTC',...options}).format(dateOnly(value));
}

export function minutesLabel(minutes:number){
  if(minutes<60)return `${minutes} min`;
  const hours=Math.floor(minutes/60);
  const rest=minutes%60;
  return rest?`${hours}h ${rest}m`:`${hours}h`;
}

export function memberName(trip:Trip,id:string){
  return trip.members.find(member=>member.id===id)?.name??'Traveler';
}

export function tripOwner(trip:Trip){
  return trip.members.find(member=>member.role==='owner');
}

export function tripProgress(trip:Trip){
  const actionable=trip.activities.filter(activity=>activity.status!=='suggested');
  if(!actionable.length)return 0;
  return Math.round(actionable.filter(activity=>activity.status==='completed').length/actionable.length*100);
}

export function expenseShare(expense:Expense,memberId:string){
  if(!expense.participantIds.includes(memberId))return 0;
  if(expense.splitMode==='personal')return expense.paidBy===memberId?expense.amount:0;
  if(expense.splitMode==='custom')return Math.max(0,expense.customShares?.[memberId]??0);
  return expense.amount/Math.max(expense.participantIds.length,1);
}

export function balances(trip:Trip){
  const active=trip.members.filter(member=>member.status==='active');
  return active.map(member=>{
    const paid=trip.expenses.filter(expense=>expense.paidBy===member.id).reduce((sum,expense)=>sum+expense.amount,0);
    const share=trip.expenses.reduce((sum,expense)=>sum+expenseShare(expense,member.id),0);
    return {member,paid,share,balance:paid-share};
  });
}
