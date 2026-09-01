import {useState} from 'react';
import type {FormEvent} from 'react';
import {CalendarCheck2,CalendarDays,Luggage,Map,MapPin,MessageCircle,Receipt,UserPlus} from 'lucide-react';
import {
  dateInTrip,initials,memberName,money,reconcileTripDateRange,toCents,validateExpense
} from '../model';
import type {
  Activity,ActivityCategory,ActivityStatus,Expense,ExpenseCategory,MemberRole,PackingItem,
  Reservation,ReservationType,SavedPlace,SplitMode,Trip,TripMember,TripNote,Workspace
} from '../model';
import {Avatar,FormTitle} from './shared';

export type ModalState=
  |{type:'activity';id?:string;date?:string;sourcePlaceId?:string;initialStatus?:ActivityStatus}
  |{type:'place';id?:string}
  |{type:'expense';id?:string}
  |{type:'packing'}
  |{type:'note';id?:string}
  |{type:'reservation';id?:string}
  |{type:'traveler'}
  |{type:'trip';newTrip?:boolean}
  |null;

const categories:ActivityCategory[]=['food','sight','transit','shopping','lodging','event','other'];
const expenseCategories:ExpenseCategory[]=['Lodging','Food','Transportation','Activities','Shopping','Other'];
const reservationTypes:ReservationType[]=['Flight','Hotel','Rental car','Restaurant','Event','Other'];

type WorkspaceSetter=(value:Workspace|((current:Workspace)=>Workspace))=>void;
type ModalContext={
  trip:Trip;
  workspace:Workspace;
  setModal:(value:ModalState)=>void;
  setToast:(text:string)=>void;
  setWorkspace:WorkspaceSetter;
  mutateTrip:(text:string,mutate:(current:Trip)=>Trip)=>void;
  record:(next:Trip,text:string,memberId?:string)=>Trip;
};

export function renderModal(modal:Exclude<ModalState,null>,context:ModalContext){
  if(modal.type==='activity')return <ActivityForm {...context} modal={modal}/>;
  if(modal.type==='place')return <PlaceForm {...context} id={modal.id}/>;
  if(modal.type==='expense')return <ExpenseForm {...context} id={modal.id}/>;
  if(modal.type==='packing')return <PackingForm {...context}/>;
  if(modal.type==='note')return <NoteForm {...context} id={modal.id}/>;
  if(modal.type==='reservation')return <ReservationForm {...context} id={modal.id}/>;
  if(modal.type==='traveler')return <TravelerForm {...context}/>;
  return <TripForm {...context} newTrip={modal.newTrip}/>;
}

function ActivityForm({trip,workspace,modal,setModal,setToast,mutateTrip}:{trip:Trip;workspace:Workspace;modal:{type:'activity';id?:string;date?:string;sourcePlaceId?:string;initialStatus?:ActivityStatus};setModal:(value:ModalState)=>void;setToast:(text:string)=>void;mutateTrip:(text:string,mutate:(current:Trip)=>Trip)=>void}){
  const existing=modal.id?trip.activities.find(item=>item.id===modal.id):undefined;
  const source=modal.sourcePlaceId?trip.places.find(item=>item.id===modal.sourcePlaceId):undefined;
  const active=trip.members.filter(member=>member.status==='active');
  const [title,setTitle]=useState(existing?.title??source?.name??'');
  const [location,setLocation]=useState(existing?.location??(source?`${source.name}, ${trip.destination}`:''));
  const [date,setDate]=useState(existing?.date??modal.date??trip.startDate);
  const [time,setTime]=useState(existing?.time??'10:00');
  const [category,setCategory]=useState<ActivityCategory>(existing?.category??'sight');
  const [duration,setDuration]=useState(String(existing?.durationMinutes??90));
  const [cost,setCost]=useState(String(existing?.cost??0));
  const [note,setNote]=useState(existing?.note??source?.note??'');
  const [status,setStatus]=useState<ActivityStatus>(existing?.status??modal.initialStatus??'planned');
  const [attendees,setAttendees]=useState<string[]>(existing?.attendeeIds.filter(id=>active.some(member=>member.id===id))??active.map(member=>member.id));
  const [error,setError]=useState('');
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    if(!title.trim()){setError('Add a title for this plan.');return}
    if(!location.trim()){setError('Add a place or address.');return}
    if(!dateInTrip(date,trip.startDate,trip.endDate)){setError('Activity date must stay within the trip dates.');return}
    const item:Activity={
      id:existing?.id??crypto.randomUUID(),title:title.trim(),location:location.trim(),date,time,category,
      durationMinutes:Math.max(15,Math.round(Number(duration)||15)),cost:Math.max(0,Math.round((Number(cost)||0)*100)/100),
      note:note.trim(),status,createdBy:existing?.createdBy??workspace.currentUserId,attendeeIds:attendees,
      votes:existing?.votes.filter(id=>active.some(member=>member.id===id))??[]
    };
    mutateTrip(`${existing?'updated':'added'} ${item.title}`,current=>({...current,activities:existing?current.activities.map(value=>value.id===item.id?item:value):[...current.activities,item]}));
    setModal(null);
    setToast(existing?'Activity updated':status==='suggested'?'Idea suggested':'Activity added');
  };
  return <form onSubmit={submit} noValidate><FormTitle icon={<CalendarDays/>} title={existing?'Edit activity':source?'Plan this place':modal.initialStatus==='suggested'?'Suggest an idea':'Add an activity'} text={modal.initialStatus==='suggested'?'Ideas stay separate from the itinerary until an editor promotes them.':'Date, cost, attendance, and status all live on one canonical plan object.'}/><label>Title<input autoFocus required value={title} onChange={event=>setTitle(event.target.value)}/></label><label>Location<input required value={location} onChange={event=>setLocation(event.target.value)} placeholder="Place or address"/></label><div className="wl-form-grid"><label>Date<input type="date" min={trip.startDate} max={trip.endDate} value={date} onChange={event=>setDate(event.target.value)}/></label><label>Time<input type="time" value={time} onChange={event=>setTime(event.target.value)}/></label></div><div className="wl-form-grid"><label>Category<select value={category} onChange={event=>setCategory(event.target.value as ActivityCategory)}>{categories.map(item=><option key={item} value={item}>{item}</option>)}</select></label><label>Status<select value={status} onChange={event=>setStatus(event.target.value as ActivityStatus)}><option value="suggested">Suggested idea</option><option value="planned">Planned</option><option value="confirmed">Confirmed</option>{existing&&<option value="completed">Completed</option>}</select></label></div><div className="wl-form-grid"><label>Duration (minutes)<input type="number" min="15" step="15" value={duration} onChange={event=>setDuration(event.target.value)}/></label><label>Estimated cost (USD)<input type="number" min="0" step="0.01" value={cost} onChange={event=>setCost(event.target.value)}/></label></div><label>Notes<textarea value={note} onChange={event=>setNote(event.target.value)} placeholder="Timing, tickets, what to bring, or why it matters"/></label><fieldset><legend>Who’s going?</legend><div className="wl-check-grid">{active.map(member=><label className="wl-check-option" key={member.id}><input type="checkbox" checked={attendees.includes(member.id)} onChange={()=>setAttendees(current=>current.includes(member.id)?current.filter(id=>id!==member.id):[...current,member.id])}/><Avatar member={member} small/><span>{member.name}</span></label>)}</div></fieldset>{error&&<p className="wl-form-error" role="alert">{error}</p>}<button className="wl-form-submit">{existing?'Save changes':status==='suggested'?'Add idea':'Add to trip'}</button></form>;
}

function PlaceForm({trip,workspace,id,setModal,setToast,mutateTrip}:{trip:Trip;workspace:Workspace;id?:string;setModal:(value:ModalState)=>void;setToast:(text:string)=>void;mutateTrip:(text:string,mutate:(current:Trip)=>Trip)=>void}){
  const existing=id?trip.places.find(item=>item.id===id):undefined;
  const [name,setName]=useState(existing?.name??'');
  const [category,setCategory]=useState(existing?.category??'Restaurant');
  const [neighborhood,setNeighborhood]=useState(existing?.neighborhood??'');
  const [note,setNote]=useState(existing?.note??'');
  const [error,setError]=useState('');
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    if(!name.trim()){setError('Add a name for the saved place.');return}
    const item:SavedPlace={id:existing?.id??crypto.randomUUID(),name:name.trim(),category:category.trim()||'Place',neighborhood:neighborhood.trim(),note:note.trim(),createdBy:existing?.createdBy??workspace.currentUserId};
    mutateTrip(`${existing?'updated':'saved'} ${item.name}`,current=>({...current,places:existing?current.places.map(value=>value.id===item.id?item:value):[item,...current.places]}));
    setModal(null);setToast(existing?'Saved place updated':'Place saved');
  };
  return <form onSubmit={submit} noValidate><FormTitle icon={<MapPin/>} title={existing?'Edit saved place':'Save a place'} text="Keep discovery separate from committed itinerary plans."/><label>Name<input autoFocus required value={name} onChange={event=>setName(event.target.value)} placeholder="Restaurant, landmark, shop…"/></label><div className="wl-form-grid"><label>Category<input value={category} onChange={event=>setCategory(event.target.value)}/></label><label>Neighborhood<input value={neighborhood} onChange={event=>setNeighborhood(event.target.value)}/></label></div><label>Why save it?<textarea value={note} onChange={event=>setNote(event.target.value)} placeholder="What makes this worth remembering?"/></label>{error&&<p className="wl-form-error" role="alert">{error}</p>}<button className="wl-form-submit">{existing?'Save changes':'Save place'}</button></form>;
}

function ExpenseForm({trip,workspace,id,setModal,setToast,mutateTrip}:{trip:Trip;workspace:Workspace;id?:string;setModal:(value:ModalState)=>void;setToast:(text:string)=>void;mutateTrip:(text:string,mutate:(current:Trip)=>Trip)=>void}){
  const existing=id?trip.expenses.find(item=>item.id===id):undefined;
  const members=trip.members.filter(member=>member.status==='active');
  const fallbackMember=members.find(member=>member.id===workspace.currentUserId)?.id??members[0]?.id??'';
  const [description,setDescription]=useState(existing?.description??'');
  const [amount,setAmount]=useState(String(existing?.amount??''));
  const [category,setCategory]=useState<ExpenseCategory>(existing?.category??'Food');
  const [paidBy,setPaidBy]=useState(existing?.paidBy??fallbackMember);
  const [participants,setParticipants]=useState<string[]>(existing?.participantIds??members.map(member=>member.id));
  const [personalFor,setPersonalFor]=useState(existing?.splitMode==='personal'?existing.participantIds[0]??fallbackMember:fallbackMember);
  const [mode,setMode]=useState<SplitMode>(existing?.splitMode??'equal');
  const [shares,setShares]=useState<Record<string,string>>(()=>Object.fromEntries((existing?.participantIds??members.map(member=>member.id)).map(memberId=>[memberId,String(existing?.customShares?.[memberId]??'')])));
  const [error,setError]=useState('');
  const numericAmount=Math.max(0,Math.round((Number(amount)||0)*100)/100);
  const candidateParticipants=mode==='personal'?[personalFor]:participants;
  const candidate:Expense={
    id:existing?.id??'draft',description:description.trim(),amount:numericAmount,category,paidBy,
    participantIds:candidateParticipants,splitMode:mode,
    customShares:mode==='custom'?Object.fromEntries(candidateParticipants.map(memberId=>[memberId,Math.max(0,Math.round((Number(shares[memberId])||0)*100)/100)])):undefined,
    createdAt:existing?.createdAt??new Date().toISOString()
  };
  const validation=validateExpense(candidate,members.map(member=>member.id));
  const customTotalCents=mode==='custom'?candidateParticipants.reduce((sum,memberId)=>sum+toCents(candidate.customShares?.[memberId]??0),0):0;
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    const checked=validateExpense(candidate,members.map(member=>member.id));
    if(!checked.valid){setError(checked.issues[0]??'Check this expense and try again.');return}
    const item:Expense={...candidate,id:existing?.id??crypto.randomUUID()};
    mutateTrip(`${existing?'updated':'added'} the ${item.description} expense`,current=>({...current,expenses:existing?current.expenses.map(value=>value.id===item.id?item:value):[item,...current.expenses]}));
    setModal(null);setToast(existing?'Expense updated':'Expense added');
  };
  return <form onSubmit={submit} noValidate><FormTitle icon={<Receipt/>} title={existing?'Edit expense':'Add an expense'} text="Who paid and who owes the cost are separate concepts; every split is validated to the cent."/><label>Description<input autoFocus required value={description} onChange={event=>{setDescription(event.target.value);setError('')}}/></label><div className="wl-form-grid"><label>Amount (USD)<input type="number" min="0.01" step="0.01" required value={amount} onChange={event=>{setAmount(event.target.value);setError('')}}/></label><label>Category<select value={category} onChange={event=>setCategory(event.target.value as ExpenseCategory)}>{expenseCategories.map(item=><option key={item}>{item}</option>)}</select></label></div><div className="wl-form-grid"><label>Paid by<select value={paidBy} onChange={event=>setPaidBy(event.target.value)}>{members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label>Split<select value={mode} onChange={event=>{setMode(event.target.value as SplitMode);setError('')}}><option value="personal">Personal expense</option><option value="equal">Split equally</option><option value="custom">Custom amounts</option></select></label></div>{mode==='personal'&&<label>Expense is for<select value={personalFor} onChange={event=>setPersonalFor(event.target.value)}>{members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select><small className="wl-field-help">This can be different from the person who paid.</small></label>}{mode!=='personal'&&<fieldset><legend>Who shares this?</legend><div className="wl-check-grid">{members.map(member=><label className="wl-check-option" key={member.id}><input type="checkbox" checked={participants.includes(member.id)} onChange={()=>{setParticipants(current=>current.includes(member.id)?current.filter(value=>value!==member.id):[...current,member.id]);setError('')}}/><Avatar member={member} small/><span>{member.name}</span></label>)}</div></fieldset>}{mode==='custom'&&<div className="wl-custom-splits"><p>Custom amounts must add up to {money(numericAmount)} exactly to the cent.</p>{candidateParticipants.map(memberId=><label key={memberId}>{memberName(trip,memberId)}<input type="number" min="0" step="0.01" value={shares[memberId]??''} onChange={event=>{setShares(current=>({...current,[memberId]:event.target.value}));setError('')}}/></label>)}<strong className={customTotalCents===toCents(numericAmount)?'valid':'invalid'} aria-live="polite">{money(customTotalCents/100)} / {money(numericAmount)}</strong></div>}{error&&<p className="wl-form-error" role="alert">{error}</p>}<button className="wl-form-submit">{existing?'Save expense':'Add expense'}</button>{!validation.valid&&mode==='custom'&&!error&&<span className="wl-sr-only" aria-live="polite">Custom split is not balanced yet.</span>}</form>;
}

function PackingForm({trip,workspace,setModal,setToast,mutateTrip}:{trip:Trip;workspace:Workspace;setModal:(value:ModalState)=>void;setToast:(text:string)=>void;mutateTrip:(text:string,mutate:(current:Trip)=>Trip)=>void}){
  const members=trip.members.filter(member=>member.status==='active');
  const fallback=members.find(member=>member.id===workspace.currentUserId)?.id??members[0]?.id??'';
  const [label,setLabel]=useState('');
  const [scope,setScope]=useState<'personal'|'shared'>('shared');
  const [assignedTo,setAssignedTo]=useState(fallback);
  const [error,setError]=useState('');
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    if(!label.trim()){setError('Add an item name.');return}
    if(!assignedTo){setError('Choose who is responsible for this item.');return}
    const duplicate=trip.packing.some(item=>item.label.trim().toLowerCase()===label.trim().toLowerCase()&&item.scope===scope&&item.assignedTo===assignedTo);
    if(duplicate){setError('That packing item is already assigned the same way.');return}
    const item:PackingItem={id:crypto.randomUUID(),label:label.trim(),scope,assignedTo,done:false};
    mutateTrip(`added ${item.label} to packing`,current=>({...current,packing:[...current.packing,item]}));
    setModal(null);setToast('Packing item added');
  };
  return <form onSubmit={submit} noValidate><FormTitle icon={<Luggage/>} title="Add packing item" text="Shared items have one responsible traveler so nobody assumes someone else packed it."/><label>Item<input autoFocus required value={label} onChange={event=>{setLabel(event.target.value);setError('')}}/></label><div className="wl-form-grid"><label>Type<select value={scope} onChange={event=>setScope(event.target.value as 'personal'|'shared')}><option value="shared">Shared trip item</option><option value="personal">Personal item</option></select></label><label>Who’s bringing it?<select value={assignedTo} onChange={event=>setAssignedTo(event.target.value)}>{members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div>{error&&<p className="wl-form-error" role="alert">{error}</p>}<button className="wl-form-submit">Add item</button></form>;
}

function NoteForm({trip,workspace,id,setModal,setToast,mutateTrip}:{trip:Trip;workspace:Workspace;id?:string;setModal:(value:ModalState)=>void;setToast:(text:string)=>void;mutateTrip:(text:string,mutate:(current:Trip)=>Trip)=>void}){
  const existing=id?trip.notes.find(item=>item.id===id):undefined;
  const [title,setTitle]=useState(existing?.title??'');
  const [body,setBody]=useState(existing?.body??'');
  const [error,setError]=useState('');
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    if(!title.trim()||!body.trim()){setError('A note needs both a title and text.');return}
    const item:TripNote={id:existing?.id??crypto.randomUUID(),title:title.trim(),body:body.trim(),createdBy:existing?.createdBy??workspace.currentUserId,updatedAt:new Date().toISOString()};
    mutateTrip(`${existing?'updated':'added'} the ${item.title} note`,current=>({...current,notes:existing?current.notes.map(value=>value.id===item.id?item:value):[item,...current.notes]}));
    setModal(null);setToast(existing?'Note updated':'Note added');
  };
  return <form onSubmit={submit} noValidate><FormTitle icon={<MessageCircle/>} title={existing?'Edit note':'Add trip note'} text="Store useful group context that does not belong on a specific activity."/><label>Title<input autoFocus required value={title} onChange={event=>setTitle(event.target.value)}/></label><label>Note<textarea required value={body} onChange={event=>setBody(event.target.value)}/></label>{error&&<p className="wl-form-error" role="alert">{error}</p>}<button className="wl-form-submit">Save note</button></form>;
}

function ReservationForm({trip,id,setModal,setToast,mutateTrip}:{trip:Trip;id?:string;setModal:(value:ModalState)=>void;setToast:(text:string)=>void;mutateTrip:(text:string,mutate:(current:Trip)=>Trip)=>void}){
  const existing=id?trip.reservations.find(item=>item.id===id):undefined;
  const [type,setType]=useState<ReservationType>(existing?.type??'Hotel');
  const [title,setTitle]=useState(existing?.title??'');
  const [date,setDate]=useState(existing?.date??trip.startDate);
  const [time,setTime]=useState(existing?.time??'15:00');
  const [location,setLocation]=useState(existing?.location??'');
  const [confirmation,setConfirmation]=useState(existing?.confirmation??'');
  const [note,setNote]=useState(existing?.note??'');
  const [error,setError]=useState('');
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    if(!title.trim()){setError('Add a title for this booking.');return}
    if(!dateInTrip(date,trip.startDate,trip.endDate)){setError('Booking date must stay within the trip dates.');return}
    const item:Reservation={id:existing?.id??crypto.randomUUID(),type,title:title.trim(),date,time,location:location.trim(),confirmation:confirmation.trim(),note:note.trim()};
    mutateTrip(`${existing?'updated':'added'} the ${item.title} reservation`,current=>({...current,reservations:existing?current.reservations.map(value=>value.id===item.id?item:value):[...current.reservations,item]}));
    setModal(null);setToast(existing?'Reservation updated':'Reservation added');
  };
  return <form onSubmit={submit} noValidate><FormTitle icon={<CalendarCheck2/>} title={existing?'Edit booking':'Add booking'} text="Confirmation/reference values stay in the local workspace and are never included in Share summary."/><div className="wl-form-grid"><label>Type<select value={type} onChange={event=>setType(event.target.value as ReservationType)}>{reservationTypes.map(item=><option key={item}>{item}</option>)}</select></label><label>Title<input autoFocus required value={title} onChange={event=>setTitle(event.target.value)}/></label></div><div className="wl-form-grid"><label>Date<input type="date" min={trip.startDate} max={trip.endDate} value={date} onChange={event=>setDate(event.target.value)}/></label><label>Time<input type="time" value={time} onChange={event=>setTime(event.target.value)}/></label></div><label>Location<input value={location} onChange={event=>setLocation(event.target.value)}/></label><label>Confirmation/reference<input value={confirmation} onChange={event=>setConfirmation(event.target.value)}/></label><label>Notes<textarea value={note} onChange={event=>setNote(event.target.value)}/></label>{error&&<p className="wl-form-error" role="alert">{error}</p>}<button className="wl-form-submit">Save booking</button></form>;
}

function TravelerForm({trip,setModal,setToast,mutateTrip}:{trip:Trip;setModal:(value:ModalState)=>void;setToast:(text:string)=>void;mutateTrip:(text:string,mutate:(current:Trip)=>Trip)=>void}){
  const [email,setEmail]=useState('');
  const [name,setName]=useState('');
  const [role,setRole]=useState<MemberRole>('editor');
  const [error,setError]=useState('');
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    const cleanEmail=email.trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(cleanEmail)){setError('Enter a valid email address.');return}
    const existing=trip.members.find(member=>member.email.toLowerCase()===cleanEmail);
    if(existing&&existing.status!=='removed'){setError('That traveler is already active or pending on this trip.');return}
    const displayName=name.trim()||cleanEmail.split('@')[0];
    if(existing){
      mutateTrip(`added ${displayName} back as a pending ${role}`,current=>({...current,members:current.members.map(member=>member.id===existing.id?{...member,name:displayName,email:cleanEmail,initials:initials(displayName),role,status:'pending'}:member)}));
      setModal(null);setToast('Former traveler added back as a local pending invite');return;
    }
    const member:TripMember={id:crypto.randomUUID(),name:displayName,email:cleanEmail,initials:initials(displayName),role,status:'pending'};
    mutateTrip(`added a pending invite for ${member.name} as ${role}`,current=>({...current,members:[...current.members,member]}));
    setModal(null);setToast('Pending invite saved locally — no email was sent');
  };
  return <form onSubmit={submit} noValidate><FormTitle icon={<UserPlus/>} title="Add pending traveler" text="This records the intended membership locally. Invitation delivery and acceptance require the Firestore phase."/><label>Email<input type="email" autoFocus required value={email} onChange={event=>{setEmail(event.target.value);setError('')}} placeholder="traveler@example.com"/></label><label>Name (optional)<input value={name} onChange={event=>setName(event.target.value)}/></label><label>Role<select value={role} onChange={event=>setRole(event.target.value as MemberRole)}><option value="editor">Editor — can help plan</option><option value="viewer">Viewer — read only except voting</option></select></label>{error&&<p className="wl-form-error" role="alert">{error}</p>}<button className="wl-form-submit">Save pending invite</button></form>;
}

function TripForm({trip,workspace,newTrip,setModal,setToast,setWorkspace,record}:{trip:Trip;workspace:Workspace;newTrip?:boolean;setModal:(value:ModalState)=>void;setToast:(text:string)=>void;setWorkspace:WorkspaceSetter;record:(next:Trip,text:string,memberId?:string)=>Trip}){
  const currentUser=trip.members.find(member=>member.id===workspace.currentUserId);
  const today=new Date();
  const future=(days:number)=>{const value=new Date(today);value.setDate(value.getDate()+days);return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`};
  const [name,setName]=useState(newTrip?'':trip.name);
  const [destination,setDestination]=useState(newTrip?'':trip.destination);
  const [start,setStart]=useState(newTrip?future(30):trip.startDate);
  const [end,setEnd]=useState(newTrip?future(33):trip.endDate);
  const [description,setDescription]=useState(newTrip?'':trip.description);
  const [budget,setBudget]=useState(String(newTrip?1500:trip.budget));
  const [error,setError]=useState('');
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    if(!name.trim()||!destination.trim()){setError('Trip name and destination are required.');return}
    if(!start||!end||end<start){setError('Trip end date must be on or after the start date.');return}
    if(newTrip){
      const id=crypto.randomUUID();
      const owner:TripMember={id:workspace.currentUserId,name:currentUser?.name??'Traveler',email:currentUser?.email??'',initials:currentUser?.initials??'TR',role:'owner',status:'active'};
      const next:Trip={id,name:name.trim(),destination:destination.trim(),startDate:start,endDate:end,description:description.trim(),budget:Math.max(0,Math.round((Number(budget)||0)*100)/100),archived:false,members:[owner],activities:[],places:[],expenses:[],packing:[],notes:[],reservations:[],history:[]};
      setWorkspace(current=>({...current,activeTripId:id,trips:[...current.trips,record(next,'created this trip')]}));
      setToast('New trip created');
    }else{
      const reconciled=reconcileTripDateRange(trip,start,end);
      const moved=reconciled.movedActivities+reconciled.movedReservations;
      setWorkspace(current=>({...current,trips:current.trips.map(item=>item.id===trip.id?record({...reconciled.trip,name:name.trim(),destination:destination.trim(),description:description.trim(),budget:Math.max(0,Math.round((Number(budget)||0)*100)/100)},'updated the trip details'):item)}));
      setToast(moved>0?`Trip updated — ${moved} dated item${moved===1?' was':'s were'} moved inside the new range`:'Trip updated');
    }
    setModal(null);
  };
  const nextActive=()=>workspace.trips.find(item=>item.id!==trip.id&&!item.archived);
  const canLeaveCurrent=Boolean(nextActive());
  const archive=()=>{
    if(newTrip||!canLeaveCurrent||!window.confirm('Archive this trip? It will move out of the active trip switcher.'))return;
    const fallback=nextActive();if(!fallback)return;
    setWorkspace(current=>({...current,activeTripId:fallback.id,trips:current.trips.map(item=>item.id===trip.id?{...item,archived:true}:item)}));
    setModal(null);setToast('Trip archived');
  };
  const remove=()=>{
    if(newTrip||!canLeaveCurrent||!window.confirm(`Delete “${trip.name}” permanently from this browser?`))return;
    const fallback=nextActive();if(!fallback)return;
    setWorkspace(current=>({...current,activeTripId:fallback.id,trips:current.trips.filter(item=>item.id!==trip.id)}));
    setModal(null);setToast('Trip deleted');
  };
  return <form onSubmit={submit} noValidate><FormTitle icon={<Map/>} title={newTrip?'Create a trip':'Trip settings'} text={newTrip?'Start solo and add collaborators later.':'Changing the date range safely moves existing activities and bookings onto the nearest valid trip day.'}/><label>Trip name<input autoFocus required value={name} onChange={event=>setName(event.target.value)}/></label><label>Destination<input required value={destination} onChange={event=>setDestination(event.target.value)} placeholder="City, Region/Country"/></label><div className="wl-form-grid"><label>Start date<input type="date" value={start} onChange={event=>{setStart(event.target.value);if(end<event.target.value)setEnd(event.target.value)}}/></label><label>End date<input type="date" min={start} value={end} onChange={event=>setEnd(event.target.value)}/></label></div><label>Trip budget (USD)<input type="number" min="0" step="0.01" value={budget} onChange={event=>setBudget(event.target.value)}/></label><label>Description<textarea value={description} onChange={event=>setDescription(event.target.value)} placeholder="What kind of trip are you planning?"/></label>{error&&<p className="wl-form-error" role="alert">{error}</p>}<div className="wl-form-actions">{!newTrip&&canLeaveCurrent&&<button type="button" className="danger" onClick={archive}>Archive</button>}{!newTrip&&canLeaveCurrent&&<button type="button" className="danger" onClick={remove}>Delete</button>}<button className="wl-form-submit">{newTrip?'Create trip':'Save trip'}</button></div></form>;
}
