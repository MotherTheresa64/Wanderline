import {useEffect,useMemo,useRef,useState} from 'react';
import {
  Activity as ActivityIcon,ArrowRight,Bell,CalendarDays,Check,CheckCircle2,ChevronDown,
  DollarSign,Lightbulb,ListChecks,Luggage,MapPin,Menu,MoreHorizontal,NotebookTabs,Plus,
  Receipt,RotateCcw,Search,Share2,Sparkles,Users,Wallet
} from 'lucide-react';
import {firebaseReady,signInGoogle} from '../firebase';
import {
  changeMemberRole,countdownToDate,dateLabel,initials,memberName,money,permissionsFor,
  removeTripMember,tripDates
} from '../model';
import type {ActivityStatus,MemberRole,Trip,View,Workspace} from '../model';
import {loadWorkspace,resetWorkspace,saveWorkspace} from '../storage';
import {useDestinationWeather} from '../weather';
import {Modal,BudgetSummary} from './shared';
import {renderModal} from './forms';
import type {ModalState} from './forms';
import {ActivityLog,Budget,Ideas,Itinerary,NotesAndBookings,Overview,Packing,Places,Travelers} from './views';

type SearchHit={id:string;label:string;detail:string;view:View};

const navItems:[View,string,typeof CalendarDays][]=[
  ['overview','Overview',Sparkles],['itinerary','Itinerary',CalendarDays],['ideas','Ideas',Lightbulb],
  ['places','Saved places',MapPin],['budget','Budget',Wallet],['packing','Packing',Luggage],
  ['notes','Notes & bookings',NotebookTabs],['travelers','Travelers',Users],['activity','Activity',ActivityIcon]
];

export default function App(){
  const [workspace,setWorkspace]=useState<Workspace>(loadWorkspace);
  const [view,setView]=useState<View>('overview');
  const [selectedDate,setSelectedDate]=useState('');
  const [menuOpen,setMenuOpen]=useState(false);
  const [tripMenuOpen,setTripMenuOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [modal,setModal]=useState<ModalState>(null);
  const [toast,setToast]=useState('');
  const searchRef=useRef<HTMLInputElement>(null);

  const trip=workspace.trips.find(item=>item.id===workspace.activeTripId&&!item.archived)
    ??workspace.trips.find(item=>!item.archived)
    ??workspace.trips[0];
  const currentMember=trip?.members.find(member=>member.id===workspace.currentUserId);
  const permissions=permissionsFor(currentMember);
  const isOwner=permissions.canManageMembers;
  const weather=useDestinationWeather(trip?.destination??'');
  const dates=trip?tripDates(trip.startDate,trip.endDate):[];

  useEffect(()=>saveWorkspace(workspace),[workspace]);
  useEffect(()=>{
    if(!trip)return;
    const validDates=tripDates(trip.startDate,trip.endDate);
    if(!selectedDate||!validDates.includes(selectedDate))setSelectedDate(validDates[0]??trip.startDate);
  },[trip?.id,trip?.startDate,trip?.endDate,selectedDate]);
  useEffect(()=>{
    if(!toast)return;
    const timer=window.setTimeout(()=>setToast(''),3200);
    return()=>window.clearTimeout(timer);
  },[toast]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){
        event.preventDefault();
        searchRef.current?.focus();
      }
      if(event.key==='Escape'){
        setMenuOpen(false);
        setTripMenuOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[]);

  const updateTrip=(mutate:(current:Trip)=>Trip)=>{
    if(!trip)return;
    setWorkspace(current=>({...current,trips:current.trips.map(item=>item.id===trip.id?mutate(item):item)}));
  };
  const record=(next:Trip,text:string,memberId=workspace.currentUserId):Trip=>({...next,history:[{id:crypto.randomUUID(),text,memberId,createdAt:new Date().toISOString()},...next.history].slice(0,100)});
  const mutateTrip=(text:string,mutate:(current:Trip)=>Trip)=>{
    if(!permissions.canEdit){setToast('Your role cannot edit shared trip resources.');return}
    updateTrip(current=>record(mutate(current),text));
  };
  const chooseView=(next:View)=>{setView(next);setMenuOpen(false);setQuery('')};
  const switchTrip=(id:string)=>{setWorkspace(current=>({...current,activeTripId:id}));setView('overview');setTripMenuOpen(false);setQuery('')};

  const searchHits=useMemo<SearchHit[]>(()=>{
    if(!trip||query.trim().length<2)return [];
    const q=query.trim().toLowerCase();
    const hits:SearchHit[]=[];
    trip.activities.filter(item=>`${item.title} ${item.location} ${item.note}`.toLowerCase().includes(q)).forEach(item=>hits.push({id:item.id,label:item.title,detail:`${item.status} · ${dateLabel(item.date)}`,view:item.status==='suggested'?'ideas':'itinerary'}));
    trip.places.filter(item=>`${item.name} ${item.category} ${item.neighborhood} ${item.note}`.toLowerCase().includes(q)).forEach(item=>hits.push({id:item.id,label:item.name,detail:`Saved place · ${item.neighborhood||trip.destination}`,view:'places'}));
    trip.expenses.filter(item=>`${item.description} ${item.category}`.toLowerCase().includes(q)).forEach(item=>hits.push({id:item.id,label:item.description,detail:`Expense · ${money(item.amount)}`,view:'budget'}));
    trip.notes.filter(item=>`${item.title} ${item.body}`.toLowerCase().includes(q)).forEach(item=>hits.push({id:item.id,label:item.title,detail:'Trip note',view:'notes'}));
    trip.reservations.filter(item=>`${item.title} ${item.location} ${item.confirmation}`.toLowerCase().includes(q)).forEach(item=>hits.push({id:item.id,label:item.title,detail:`${item.type} · ${dateLabel(item.date)}`,view:'notes'}));
    trip.members.filter(item=>item.status!=='removed'&&`${item.name} ${item.email}`.toLowerCase().includes(q)).forEach(item=>hits.push({id:item.id,label:item.name,detail:`${item.role} · ${item.status}`,view:'travelers'}));
    return hits.slice(0,8);
  },[trip,query]);

  if(!trip)return <main className="wl-empty-screen"><h1>No usable trips found</h1><p>Reset the local demo workspace to recover a valid trip.</p><button onClick={()=>setWorkspace(resetWorkspace())}>Restore sample trip</button></main>;

  const activeMembers=trip.members.filter(member=>member.status==='active');
  const pendingMembers=trip.members.filter(member=>member.status==='pending');
  const spent=trip.expenses.reduce((sum,expense)=>sum+expense.amount,0);
  const packed=trip.packing.filter(item=>item.done).length;
  const confirmed=trip.activities.filter(item=>item.status==='confirmed'||item.status==='completed').length;
  const openIdeas=trip.activities.filter(item=>item.status==='suggested').length;
  const countdown=countdownToDate(trip.startDate);

  const shareTrip=async()=>{
    const text=`${trip.name}\n${trip.destination}\n${dateLabel(trip.startDate,{month:'short',day:'numeric'})} – ${dateLabel(trip.endDate,{month:'short',day:'numeric',year:'numeric'})}\n${activeMembers.length} traveler${activeMembers.length===1?'':'s'} · ${trip.activities.filter(item=>item.status!=='suggested').length} itinerary plan${trip.activities.filter(item=>item.status!=='suggested').length===1?'':'s'}\n\nWanderline summary only — this does not grant trip access.`;
    try{
      if(navigator.share){
        await navigator.share({title:trip.name,text});
        setToast('Trip summary shared');
        return;
      }
      await navigator.clipboard.writeText(text);
      setToast('Trip summary copied');
    }catch(error){
      if((error as Error).name==='AbortError')return;
      setToast('Sharing is unavailable in this browser');
    }
  };
  const signIn=async()=>{
    if(!firebaseReady){setToast('Firebase Authentication is not configured. Wanderline remains a browser-local demo.');return}
    try{
      await signInGoogle();
      setToast('Google sign-in succeeded. Trip data is still stored only in this browser.');
    }catch{setToast('Google sign-in was cancelled or unavailable')}
  };
  const doReset=()=>{
    if(!window.confirm('Reset Wanderline to the original Barcelona sample trip? Local trip edits will be replaced.'))return;
    setWorkspace(resetWorkspace());setView('overview');setQuery('');setToast('Sample workspace restored');
  };
  const vote=(id:string)=>{
    if(!permissions.canVote){setToast('Only active trip travelers can vote.');return}
    updateTrip(current=>record({...current,activities:current.activities.map(item=>item.id===id?{...item,votes:item.votes.includes(workspace.currentUserId)?item.votes.filter(voteId=>voteId!==workspace.currentUserId):[...item.votes,workspace.currentUserId]}:item)},'voted on a trip idea'));
  };
  const changeRole=(id:string,role:MemberRole)=>{
    if(!isOwner){setToast('Only the trip owner can change roles.');return}
    const result=changeMemberRole(trip,id,role);
    if(result.error){setToast(result.error);return}
    updateTrip(()=>record(result.trip,`changed ${memberName(trip,id)} to ${role}`));
    setToast('Traveler role updated');
  };
  const removeMember=(id:string)=>{
    if(!isOwner){setToast('Only the trip owner can remove travelers.');return}
    const member=trip.members.find(item=>item.id===id);if(!member)return;
    if(!window.confirm(`Remove ${member.name} from this trip?`))return;
    const result=removeTripMember(trip,id);
    if(result.error){setToast(result.error);return}
    updateTrip(()=>record(result.trip,member.status==='pending'?`removed the pending invite for ${member.name}`:`removed ${member.name} from the trip`));
    setToast(member.status==='pending'?'Pending invite removed':'Traveler removed safely');
  };

  return <div className="wl-app">
    <aside className={menuOpen?'wl-sidebar open':'wl-sidebar'} aria-label="Trip navigation">
      <div className="wl-brand"><span>↗</span><b>wanderline</b></div>
      <div className="wl-trip-switcher">
        <button className="wl-trip-button" onClick={()=>setTripMenuOpen(value=>!value)} aria-expanded={tripMenuOpen} aria-haspopup="menu"><span className="wl-trip-code">{trip.destination.slice(0,3).toUpperCase()}</span><span><b>{trip.name}</b><small>{trip.destination}</small></span><ChevronDown size={16}/></button>
        {tripMenuOpen&&<div className="wl-trip-menu" role="menu">{workspace.trips.filter(item=>!item.archived).map(item=><button role="menuitem" key={item.id} className={item.id===trip.id?'active':''} onClick={()=>switchTrip(item.id)}><span>{item.destination.slice(0,3).toUpperCase()}</span><div><b>{item.name}</b><small>{dateLabel(item.startDate,{month:'short',day:'numeric'})} – {dateLabel(item.endDate,{month:'short',day:'numeric'})}</small></div>{item.id===trip.id&&<Check size={15}/>}</button>)}<button role="menuitem" className="wl-new-trip" onClick={()=>{setModal({type:'trip',newTrip:true});setTripMenuOpen(false)}}><Plus size={16}/> New trip</button></div>}
      </div>
      <nav className="wl-nav">{navItems.map(([id,label,Icon])=><button key={id} className={view===id?'active':''} aria-current={view===id?'page':undefined} onClick={()=>chooseView(id)}><Icon size={17}/><span>{label}</span>{id==='ideas'&&openIdeas>0&&<b>{openIdeas}</b>}{id==='travelers'&&pendingMembers.length>0&&<b>{pendingMembers.length}</b>}</button>)}</nav>
      <div className="wl-sidebar-summary"><span><Users size={15}/>{activeMembers.length} traveler{activeMembers.length===1?'':'s'}</span><span><ListChecks size={15}/>{packed}/{trip.packing.length} packed</span><span><DollarSign size={15}/><BudgetSummary budget={trip.budget} spent={spent}/></span></div>
      <div className="wl-sidebar-bottom"><button className="wl-reset" onClick={doReset}><RotateCcw size={14}/> Reset sample trip</button><button className="wl-profile" onClick={signIn}><span>{initials(currentMember?.name??'Traveler')}</span><div><b>{currentMember?.name??'Traveler'}</b><small>{firebaseReady?'Google Auth available · data remains local':'Browser-local demo mode'}</small></div><MoreHorizontal size={16}/></button></div>
    </aside>
    <main className="wl-main">
      <header className="wl-header"><button className="wl-mobile-menu" onClick={()=>setMenuOpen(value=>!value)} aria-label={menuOpen?'Close navigation':'Open navigation'} aria-expanded={menuOpen}><Menu/></button><div className="wl-search-wrap"><div className="wl-search"><Search size={17}/><input ref={searchRef} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search this trip…" aria-label="Search this trip"/><kbd>⌘ K</kbd></div>{searchHits.length>0&&<div className="wl-search-results" role="listbox" aria-label="Search results">{searchHits.map(hit=><button role="option" aria-selected="false" key={`${hit.view}-${hit.id}`} onClick={()=>{setView(hit.view);setQuery('');setMenuOpen(false)}}><Search size={14}/><span><b>{hit.label}</b><small>{hit.detail}</small></span><ArrowRight size={14}/></button>)}</div>}</div><div className="wl-header-actions"><button className="wl-weather" title={weather.loading?'Loading current weather':weather.resolvedPlace?`${weather.label} in ${weather.resolvedPlace}`:weather.label} aria-label={weather.loading?'Loading current weather':weather.temperature===null?'Weather unavailable':`${weather.temperature} degrees Fahrenheit, ${weather.label}`}><span>{weather.temperature===null?'--':`${weather.temperature}°`}</span><small>{weather.loading?'Loading…':weather.label}</small></button><button className="wl-icon-button" onClick={()=>setToast('No remote notifications yet — this demo is browser-local')} aria-label="Notifications"><Bell size={18}/></button><button className="wl-share" onClick={()=>void shareTrip()}><Share2 size={16}/><span>Share summary</span></button></div></header>
      <div className="wl-local-banner"><span><Receipt size={14}/></span><p><b>Local demo:</b> edits, roles, votes, and pending invites stay in this browser until Firestore is connected.</p></div>
      <div className="wl-page">
        {view==='overview'&&<Overview trip={trip} countdown={countdown} spent={spent} packed={packed} confirmed={confirmed} currentUserId={workspace.currentUserId} canEdit={permissions.canEdit} canManageTrip={permissions.canManageTrip} onNavigate={chooseView} onTripSettings={()=>setModal({type:'trip'})} onAddActivity={()=>setModal({type:'activity',date:selectedDate})}/>} 
        {view==='itinerary'&&<Itinerary trip={trip} selectedDate={selectedDate||dates[0]||trip.startDate} setSelectedDate={setSelectedDate} canEdit={permissions.canEdit} onAdd={date=>setModal({type:'activity',date})} onEdit={id=>setModal({type:'activity',id})} onDelete={id=>{const activity=trip.activities.find(item=>item.id===id);if(activity&&window.confirm(`Delete “${activity.title}”?`))mutateTrip(`deleted ${activity.title}`,current=>({...current,activities:current.activities.filter(item=>item.id!==id)}))}} onStatus={(id,status)=>mutateTrip(`${status==='completed'?'completed':'reopened'} ${trip.activities.find(item=>item.id===id)?.title??'an activity'}`,current=>({...current,activities:current.activities.map(item=>item.id===id?{...item,status}:item)}))}/>} 
        {view==='ideas'&&<Ideas trip={trip} currentUserId={workspace.currentUserId} canEdit={permissions.canEdit} canVote={permissions.canVote} onAdd={()=>setModal({type:'activity',date:selectedDate,initialStatus:'suggested'})} onVote={vote} onPromote={(id,status)=>mutateTrip(`moved ${trip.activities.find(item=>item.id===id)?.title??'an idea'} into the itinerary`,current=>({...current,activities:current.activities.map(item=>item.id===id?{...item,status}:item)}))} onEdit={id=>setModal({type:'activity',id})} onDelete={id=>{const idea=trip.activities.find(item=>item.id===id);if(idea&&window.confirm(`Delete idea “${idea.title}”?`))mutateTrip(`deleted the ${idea.title} idea`,current=>({...current,activities:current.activities.filter(item=>item.id!==id)}))}}/>} 
        {view==='places'&&<Places trip={trip} canEdit={permissions.canEdit} onAdd={()=>setModal({type:'place'})} onEdit={id=>setModal({type:'place',id})} onDelete={id=>{const place=trip.places.find(item=>item.id===id);if(place&&window.confirm(`Remove ${place.name} from saved places?`))mutateTrip(`removed ${place.name} from saved places`,current=>({...current,places:current.places.filter(item=>item.id!==id)}))}} onPlan={id=>setModal({type:'activity',date:selectedDate,sourcePlaceId:id})}/>} 
        {view==='budget'&&<Budget trip={trip} currentUserId={workspace.currentUserId} canEdit={permissions.canEdit} onAdd={()=>setModal({type:'expense'})} onEdit={id=>setModal({type:'expense',id})} onDelete={id=>{const expense=trip.expenses.find(item=>item.id===id);if(expense&&window.confirm(`Delete ${expense.description}?`))mutateTrip(`deleted the ${expense.description} expense`,current=>({...current,expenses:current.expenses.filter(item=>item.id!==id)}))}}/>} 
        {view==='packing'&&<Packing trip={trip} currentUserId={workspace.currentUserId} canEdit={permissions.canEdit} onAdd={()=>setModal({type:'packing'})} onToggle={id=>mutateTrip('updated the packing list',current=>({...current,packing:current.packing.map(item=>item.id===id?{...item,done:!item.done}:item)}))} onDelete={id=>mutateTrip('removed a packing item',current=>({...current,packing:current.packing.filter(item=>item.id!==id)}))}/>} 
        {view==='notes'&&<NotesAndBookings trip={trip} canEdit={permissions.canEdit} onAddNote={()=>setModal({type:'note'})} onEditNote={id=>setModal({type:'note',id})} onDeleteNote={id=>{if(window.confirm('Delete this trip note?'))mutateTrip('deleted a trip note',current=>({...current,notes:current.notes.filter(item=>item.id!==id)}))}} onAddReservation={()=>setModal({type:'reservation'})} onEditReservation={id=>setModal({type:'reservation',id})} onDeleteReservation={id=>{if(window.confirm('Delete this reservation?'))mutateTrip('deleted a reservation',current=>({...current,reservations:current.reservations.filter(item=>item.id!==id)}))}}/>} 
        {view==='travelers'&&<Travelers trip={trip} currentUserId={workspace.currentUserId} isOwner={isOwner} onInvite={()=>setModal({type:'traveler'})} onRole={changeRole} onRemove={removeMember}/>} 
        {view==='activity'&&<ActivityLog trip={trip}/>} 
      </div>
    </main>
    {menuOpen&&<button className="wl-mobile-backdrop" onClick={()=>setMenuOpen(false)} aria-label="Close navigation"/>}
    {modal&&<Modal onClose={()=>setModal(null)} label={`${modal.type} dialog`}>{renderModal(modal,{trip,workspace,setModal,setToast,setWorkspace,mutateTrip,record})}</Modal>}
    {toast&&<div className="wl-toast" role="status" aria-live="polite"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}
