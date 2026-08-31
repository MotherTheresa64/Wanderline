import {useEffect,useMemo,useState} from 'react';
import {
  MapPin,CalendarDays,WalletCards,Bookmark,Search,Plus,Plane,ChevronDown,
  CloudSun,Navigation,Clock3,Euro,Check,MoreHorizontal,Menu,X,Camera,
  Utensils,Landmark,TrainFront,ShoppingBag,Send,ArrowUpRight,Luggage,
  Heart,Sun,CloudRain,Trash2,RotateCcw,Pencil,ExternalLink
} from 'lucide-react';
import {firebaseReady,signInGoogle} from './firebase';

type Activity={
  id:string;day:number;time:string;title:string;place:string;
  kind:'food'|'sight'|'transit'|'shop';cost:number;done:boolean;note:string;duration?:number
};
type Expense={id:string;label:string;category:string;amount:number};
type Pack={id:string;label:string;done:boolean};
type Place={id:string;name:string;category:string;neighborhood:string;note:string};
type Persisted={activities:Activity[];expenses:Expense[];packing:Pack[];places?:Place[]};
type WeatherState={temp:number;label:string};

const STORE='wanderline-v1';
const TRIP_START=new Date('2026-09-14T09:00:00');
const BUDGET=1850;

const initial:Activity[]=[
  {id:'a1',day:1,time:'09:30',title:'Coffee & xuixo at Granja M. Viader',place:'El Raval',kind:'food',cost:18,done:true,note:'Start slowly after the overnight flight.',duration:75},
  {id:'a2',day:1,time:'11:00',title:'Wander the Gothic Quarter',place:'Barri Gòtic',kind:'sight',cost:0,done:true,note:'Cathedral, hidden courtyards, Plaça Reial.',duration:120},
  {id:'a3',day:1,time:'14:00',title:'Mercat de la Boqueria lunch',place:'La Rambla',kind:'food',cost:32,done:false,note:'Try pintxos and fresh juice.',duration:90},
  {id:'a4',day:1,time:'17:00',title:'Golden hour at Bunkers del Carmel',place:'El Carmel',kind:'sight',cost:0,done:false,note:'Bring water. Sunset around 8:35 PM.',duration:120},
  {id:'a5',day:2,time:'09:00',title:'Sagrada Família',place:'Eixample',kind:'sight',cost:58,done:false,note:'Tower entry booked. Arrive 20 minutes early.',duration:120},
  {id:'a6',day:2,time:'12:30',title:'Lunch at Casa Lolea',place:'Sant Pere',kind:'food',cost:45,done:false,note:'Reservation under Noah.',duration:90},
  {id:'a7',day:2,time:'15:00',title:'Park Güell & Gràcia walk',place:'Gràcia',kind:'sight',cost:26,done:false,note:'Take L3 then bus 24.',duration:150},
  {id:'a8',day:3,time:'08:40',title:'Train to Montserrat',place:'Plaça d’Espanya',kind:'transit',cost:48,done:false,note:'R5 toward Manresa, then cable car.',duration:75},
  {id:'a9',day:3,time:'10:30',title:'Montserrat monastery & trails',place:'Montserrat',kind:'sight',cost:0,done:false,note:'Choose Sant Miquel trail if weather is clear.',duration:240},
  {id:'a10',day:4,time:'10:00',title:'Beach morning',place:'Barceloneta',kind:'sight',cost:0,done:false,note:'Easy final morning before checkout.',duration:120},
  {id:'a11',day:4,time:'13:00',title:'Souvenirs & late lunch',place:'El Born',kind:'shop',cost:60,done:false,note:'Pick up ceramics and snacks for home.',duration:120}
];

const initialExpenses:Expense[]=[
  {id:'e1',label:'Flights',category:'Transport',amount:620},
  {id:'e2',label:'Hotel · 4 nights',category:'Stay',amount:548},
  {id:'e3',label:'Sagrada Família',category:'Activities',amount:58},
  {id:'e4',label:'Montserrat tickets',category:'Transport',amount:48},
  {id:'e5',label:'Food allowance',category:'Food',amount:280}
];

const initialPack:Pack[]=[
  {id:'p1',label:'Passports & IDs',done:true},
  {id:'p2',label:'Phone chargers',done:true},
  {id:'p3',label:'Walking shoes',done:false},
  {id:'p4',label:'Sunscreen',done:false},
  {id:'p5',label:'Light rain layer',done:false}
];

const initialPlaces:Place[]=[
  {id:'s1',name:'Can Culleretes',category:'Catalan',neighborhood:'Barri Gòtic',note:'Loved by locals since 1786.'},
  {id:'s2',name:'Casa Batlló',category:'Architecture',neighborhood:'Eixample',note:'Gaudí at his most surreal.'},
  {id:'s3',name:'Paradiso',category:'Cocktails',neighborhood:'El Born',note:'Hidden behind a pastrami shop.'},
  {id:'s4',name:'La Manual Alpargatera',category:'Shopping',neighborhood:'Gothic Quarter',note:'Handmade espadrilles since 1940.'},
  {id:'s5',name:'Café Cometa',category:'Coffee',neighborhood:'Sant Antoni',note:'Bright, quiet, excellent brunch.'},
  {id:'s6',name:'Jardins de Mossèn Costa',category:'Garden',neighborhood:'Montjuïc',note:'Cacti with harbor views.'}
];

function cloneInitial<T>(value:T):T{return structuredClone(value)}
function loadSaved():Persisted|null{
  try{
    const value=JSON.parse(localStorage.getItem(STORE)||'null') as Persisted|null;
    if(!value||!Array.isArray(value.activities)||!Array.isArray(value.expenses)||!Array.isArray(value.packing))return null;
    return value;
  }catch{return null}
}
function saveState(value:Persisted){try{localStorage.setItem(STORE,JSON.stringify(value))}catch{/* Keep the in-memory trip usable when browser storage is unavailable. */}}
function countdownLabel(){
  const diff=Math.ceil((TRIP_START.getTime()-Date.now())/86_400_000);
  if(diff>1)return `Upcoming trip · ${diff} days`;
  if(diff===1)return 'Upcoming trip · tomorrow';
  if(diff===0)return 'Trip starts today';
  return 'Trip archive';
}
function weatherLabel(code:number){
  if(code===0)return 'Clear';
  if(code<=3)return 'Partly cloudy';
  if(code<=67)return 'Rain';
  if(code<=77)return 'Snow';
  if(code<=82)return 'Showers';
  return 'Storms nearby';
}

export default function App(){
  const cache=loadSaved();
  const [activities,setActivities]=useState<Activity[]>(cache?.activities||cloneInitial(initial));
  const [expenses,setExpenses]=useState<Expense[]>(cache?.expenses||cloneInitial(initialExpenses));
  const [packing,setPacking]=useState<Pack[]>(cache?.packing||cloneInitial(initialPack));
  const [places,setPlaces]=useState<Place[]>(cache?.places||cloneInitial(initialPlaces));
  const [day,setDay]=useState(1);
  const [tab,setTab]=useState<'itinerary'|'budget'|'saved'>('itinerary');
  const [modal,setModal]=useState<'activity'|'expense'|'place'|null>(null);
  const [editingActivity,setEditingActivity]=useState<Activity|null>(null);
  const [selectedPlace,setSelectedPlace]=useState<Place|null>(null);
  const [menu,setMenu]=useState(false);
  const [query,setQuery]=useState('');
  const [toast,setToast]=useState('');
  const [weather,setWeather]=useState<WeatherState>({temp:77,label:'Sunny'});

  useEffect(()=>saveState({activities,expenses,packing,places}),[activities,expenses,packing,places]);
  useEffect(()=>{
    if(!toast)return;
    const timer=setTimeout(()=>setToast(''),2400);
    return()=>clearTimeout(timer);
  },[toast]);
  useEffect(()=>{
    let cancelled=false;
    fetch('https://api.open-meteo.com/v1/forecast?latitude=41.3874&longitude=2.1686&current=temperature_2m,weather_code&temperature_unit=fahrenheit')
      .then(response=>response.ok?response.json():Promise.reject(new Error('weather unavailable')))
      .then(data=>{if(!cancelled&&data?.current)setWeather({temp:Math.round(data.current.temperature_2m),label:weatherLabel(Number(data.current.weather_code))})})
      .catch(()=>{/* Keep the polished fallback weather when the provider is unavailable. */});
    return()=>{cancelled=true};
  },[]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){
        if(selectedPlace)setSelectedPlace(null);
        else if(modal){setModal(null);setEditingActivity(null)}
        else if(menu)setMenu(false);
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[menu,modal,selectedPlace]);

  const q=query.trim().toLowerCase();
  const dayItems=useMemo(()=>activities.filter(a=>a.day===day&&(!q||`${a.title} ${a.place} ${a.note} ${a.kind}`.toLowerCase().includes(q))).sort((a,b)=>a.time.localeCompare(b.time)),[activities,day,q]);
  const visibleExpenses=useMemo(()=>expenses.filter(item=>!q||`${item.label} ${item.category}`.toLowerCase().includes(q)),[expenses,q]);
  const visiblePlaces=useMemo(()=>places.filter(place=>!q||`${place.name} ${place.category} ${place.neighborhood} ${place.note}`.toLowerCase().includes(q)),[places,q]);

  const spent=expenses.reduce((sum,e)=>sum+e.amount,0);
  const done=activities.filter(a=>a.done).length;
  const progress=activities.length?Math.round(done/activities.length*100):0;
  const packed=packing.filter(p=>p.done).length;
  const packedPct=packing.length?packed/packing.length*100:0;
  const days=[['Mon','Sep 14'],['Tue','Sep 15'],['Wed','Sep 16'],['Thu','Sep 17']];

  const toggle=(id:string)=>setActivities(value=>value.map(a=>a.id===id?{...a,done:!a.done}:a));
  const upsertActivity=(activity:Activity)=>{
    setActivities(current=>current.some(item=>item.id===activity.id)?current.map(item=>item.id===activity.id?activity:item):[...current,activity]);
    setModal(null);setEditingActivity(null);setToast(editingActivity?'Activity updated':'Added to itinerary');
  };
  const deleteActivity=(id:string)=>{
    if(!window.confirm('Delete this activity from the itinerary?'))return;
    setActivities(current=>current.filter(item=>item.id!==id));setModal(null);setEditingActivity(null);setToast('Activity deleted');
  };
  const deleteExpense=(id:string)=>{setExpenses(current=>current.filter(item=>item.id!==id));setToast('Expense removed')};
  const deletePlace=(id:string)=>{
    setPlaces(current=>current.filter(item=>item.id!==id));setSelectedPlace(null);setToast('Place removed');
  };
  const resetTrip=()=>{
    if(!window.confirm('Reset Wanderline to the original Barcelona sample trip?'))return;
    setActivities(cloneInitial(initial));setExpenses(cloneInitial(initialExpenses));setPacking(cloneInitial(initialPack));setPlaces(cloneInitial(initialPlaces));setDay(1);setTab('itinerary');setQuery('');setMenu(false);setToast('Trip reset');
  };
  const signIn=async()=>{
    if(!firebaseReady){setToast('Demo mode — add Firebase keys to enable Google sign-in');return}
    try{await signInGoogle();setToast('Signed in with Google')}
    catch{setToast('Google sign-in was cancelled or unavailable')}
  };
  const shareTrip=async()=>{
    const payload={title:'Wanderline · Barcelona',text:'Barcelona itinerary · Sep 14–18, 2026',url:window.location.href};
    try{
      if(navigator.share){await navigator.share(payload);setToast('Trip shared');return}
      await navigator.clipboard.writeText(window.location.href);setToast('Trip link copied');
    }catch{setToast('Sharing was cancelled or blocked')}
  };
  const setActiveTab=(next:'itinerary'|'budget'|'saved')=>{setTab(next);setQuery('');setMenu(false)};
  const searchPlaceholder=tab==='itinerary'?'Search this day’s places and notes…':tab==='budget'?'Search expenses and categories…':'Search saved places…';

  return <div className="app">
    <aside className={menu?'sidebar open':'sidebar'}>
      <div className="logo"><span><Navigation/></span>wanderline</div>
      <button className="trip-switch" onClick={()=>setToast('Barcelona · Sep 14–18, 2026')}>
        <span className="trip-thumb">BCN</span><span><b>Barcelona</b><small>Sep 14–18 · 4 nights</small></span><ChevronDown/>
      </button>
      <nav>
        <button className={tab==='itinerary'?'active':''} onClick={()=>setActiveTab('itinerary')}><CalendarDays/>Itinerary</button>
        <button className={tab==='budget'?'active':''} onClick={()=>setActiveTab('budget')}><WalletCards/>Budget</button>
        <button className={tab==='saved'?'active':''} onClick={()=>setActiveTab('saved')}><Bookmark/>Saved places <b>{places.length}</b></button>
      </nav>
      <div className="sidebar-title">Trip checklist</div>
      <div className="packing">{packing.map(p=><button key={p.id} onClick={()=>setPacking(v=>v.map(x=>x.id===p.id?{...x,done:!x.done}:x))}><span className={p.done?'check done':'check'}>{p.done&&<Check/>}</span><span className={p.done?'strike':''}>{p.label}</span></button>)}</div>
      <div className="trip-card"><div><Luggage/><span><b>{packed}/{packing.length} packed</b><small>{packed===packing.length?'Ready to go':'A few things left'}</small></span></div><div className="mini-progress"><i style={{width:`${packedPct}%`}}/></div></div>
      <button className="reset-demo" onClick={resetTrip}><RotateCcw/>Reset sample trip</button>
      <div className="profile" role="button" tabIndex={0} onClick={signIn} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')signIn()}} title={firebaseReady?'Sign in with Google':'Running in demo mode'}><span className="avatar">NR</span><span><b>Noah</b><small>{firebaseReady?'Google sign-in ready':'Trip owner · demo mode'}</small></span><MoreHorizontal/></div>
    </aside>

    <main>
      <header>
        <button className="mobile" onClick={()=>setMenu(value=>!value)} aria-label="Toggle trip navigation"><Menu/></button>
        <div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={searchPlaceholder} aria-label={`Search ${tab}`}/></div>
        <div className="weather"><CloudSun/><span><b>{weather.temp}°</b><small>Barcelona · {weather.label}</small></span></div>
        <button className="share" onClick={shareTrip}><Send/>Share trip</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="kicker"><Plane/>{countdownLabel()}</span>
          <h1>Barcelona,<br/><em>slowly.</em></h1>
          <p>Four days of architecture, tiny streets, long lunches, mountain air, and nowhere to rush.</p>
          <div className="hero-meta"><span><CalendarDays/>Sep 14–18, 2026</span><span><MapPin/>Barcelona, Spain</span><span><Euro/>€{Math.max(BUDGET-spent,0).toLocaleString()} left</span></div>
        </div>
        <div className="postcard one"><span>41.3851° N</span><b>BARCELONA</b><small>Mediterranean coast</small></div>
        <div className="postcard two"><Camera/><b>4 days</b><small>{activities.length} moments planned</small></div>
      </section>

      <div className="top-stats">
        <div><span>Trip progress</span><b>{progress}%</b><div><i style={{width:`${progress}%`}}/></div></div>
        <div><span>Budget used</span><b>€{spent.toLocaleString()}</b><small>of €{BUDGET.toLocaleString()}</small></div>
        <div><span>Places saved</span><b>{places.length}</b><small>across Barcelona</small></div>
        <div><span>Trip pace</span><b>Relaxed</b><small>{(activities.length/4).toFixed(1)} plans / day</small></div>
      </div>

      <section className="content">
        {tab==='itinerary'&&<>
          <div className="section-head"><div><span className="eyebrow">Your route</span><h2>Day by day</h2></div><button className="add" onClick={()=>{setEditingActivity(null);setModal('activity')}}><Plus/>Add activity</button></div>
          <div className="day-tabs">{days.map((item,index)=><button key={index} className={day===index+1?'active':''} onClick={()=>setDay(index+1)}><span>{item[0]}</span><b>{item[1]}</b><small>{activities.filter(a=>a.day===index+1).length} plans</small></button>)}</div>
          <div className="itinerary-grid">
            <div className="timeline">
              {dayItems.length===0&&<div className="empty">No activities match this search on day {day}.</div>}
              {dayItems.map(a=><article key={a.id} className={a.done?'activity complete':'activity'}>
                <div className="time">{a.time}<span/></div>
                <button className="complete" aria-label={a.done?'Reopen activity':'Mark activity complete'} onClick={()=>{toggle(a.id);setToast(a.done?'Activity reopened':'Marked complete')}}>{a.done&&<Check/>}</button>
                <div className="activity-card"><div className={`kind ${a.kind}`}>{icon(a.kind)}</div><div className="activity-main"><div><h3>{a.title}</h3><button aria-label={`Edit ${a.title}`} onClick={()=>{setEditingActivity(a);setModal('activity')}}><Pencil/></button></div><p><MapPin/>{a.place}</p><small>{a.note}</small><div className="activity-foot"><span><Clock3/>~{a.duration??90} min</span><span>{a.cost?`€${a.cost}`:'Free'}</span></div></div></div>
              </article>)}
            </div>
            <RightPanel day={day} onToast={setToast}/>
          </div>
        </>}
        {tab==='budget'&&<Budget expenses={expenses} visibleExpenses={visibleExpenses} budget={BUDGET} onAdd={()=>setModal('expense')} onDelete={deleteExpense}/>} 
        {tab==='saved'&&<Saved places={visiblePlaces} total={places.length} onAdd={()=>setModal('place')} onOpen={setSelectedPlace}/>} 
      </section>
    </main>

    {modal==='activity'&&<ActivityModal day={day} initial={editingActivity} onClose={()=>{setModal(null);setEditingActivity(null)}} onSave={upsertActivity} onDelete={editingActivity?()=>deleteActivity(editingActivity.id):undefined}/>} 
    {modal==='expense'&&<ExpenseModal onClose={()=>setModal(null)} onSave={expense=>{setExpenses(value=>[...value,expense]);setModal(null);setToast('Expense added')}}/>}
    {modal==='place'&&<PlaceModal onClose={()=>setModal(null)} onSave={place=>{setPlaces(value=>[place,...value]);setModal(null);setToast('Place saved')}}/>}
    {selectedPlace&&<PlaceDetails place={selectedPlace} onClose={()=>setSelectedPlace(null)} onDelete={()=>deletePlace(selectedPlace.id)}/>} 
    {toast&&<div className="toast"><Check/>{toast}</div>}
  </div>
}

function icon(kind:Activity['kind']){
  return kind==='food'?<Utensils/>:kind==='transit'?<TrainFront/>:kind==='shop'?<ShoppingBag/>:<Landmark/>;
}

function RightPanel({day,onToast}:{day:number;onToast:(message:string)=>void}){
  const weather=[
    {icon:<Sun/>,temp:'78°',label:'Sunny'},
    {icon:<CloudSun/>,temp:'76°',label:'Partly cloudy'},
    {icon:<CloudRain/>,temp:'71°',label:'Light rain'},
    {icon:<Sun/>,temp:'80°',label:'Clear'}
  ][day-1];
  const openMap=()=>window.open('https://www.openstreetmap.org/#map=13/41.3874/2.1686','_blank','noopener,noreferrer');
  return <aside className="right">
    <button className="map" onClick={openMap} aria-label="Open Barcelona map in OpenStreetMap"><div className="map-grid"/><span className="pin p1">1</span><span className="pin p2">2</span><span className="pin p3">3</span><div className="map-label"><MapPin/><span><b>Day {day} route</b><small>Open interactive Barcelona map</small></span><ExternalLink/></div></button>
    <div className="weather-card"><div>{weather.icon}<span><b>{weather.temp}</b><small>{weather.label}</small></span></div><p>Walking-friendly forecast for this sample itinerary. Check the live header before heading out.</p></div>
    <div className="note-card"><span className="eyebrow">Local note</span><h3>Dinner starts late.</h3><p>Most locals won’t sit down until 9 PM. Build in a vermouth or snack around 6:30 and enjoy the slower rhythm.</p><button onClick={()=>onToast('Barcelona tip saved mentally — enjoy the slower pace')}>More Barcelona tips <ArrowUpRight/></button></div>
  </aside>
}

function Budget({expenses,visibleExpenses,budget,onAdd,onDelete}:{expenses:Expense[];visibleExpenses:Expense[];budget:number;onAdd:()=>void;onDelete:(id:string)=>void}){
  const spent=expenses.reduce((sum,e)=>sum+e.amount,0);
  const pct=budget?Math.min(spent/budget*100,100):0;
  const categories=Object.entries(expenses.reduce<Record<string,number>>((map,e)=>({...map,[e.category]:(map[e.category]||0)+e.amount}),{}));
  return <>
    <div className="section-head"><div><span className="eyebrow">Money map</span><h2>Trip budget</h2></div><button className="add" onClick={onAdd}><Plus/>Add expense</button></div>
    <div className="budget-hero"><div><span>Remaining</span><strong>€{Math.max(budget-spent,0).toLocaleString()}</strong><p>of €{budget.toLocaleString()} total budget</p></div><div className="ring" style={{background:`conic-gradient(#e36f4f 0 ${pct}%,#e7e1d6 ${pct}% 100%)`}}><span>{Math.round(pct)}%</span></div></div>
    <div className="budget-grid"><div className="ledger"><div className="ledger-head"><h3>Expenses</h3><span>{visibleExpenses.length} shown · {expenses.length} total</span></div>{visibleExpenses.map(e=><div className="expense" key={e.id}><span className="expense-icon">€</span><div><b>{e.label}</b><small>{e.category}</small></div><strong>€{e.amount.toLocaleString()}</strong><button className="expense-delete" onClick={()=>onDelete(e.id)} aria-label={`Remove ${e.label}`}><Trash2/></button></div>)}{visibleExpenses.length===0&&<div className="empty">No expenses match this search.</div>}</div><div className="breakdown"><h3>By category</h3>{categories.map(([category,value])=><div key={category}><span>{category}</span><div><i style={{width:`${spent?value/spent*100:0}%`}}/></div><b>€{value.toLocaleString()}</b></div>)}</div></div>
  </>
}

function Saved({places,total,onAdd,onOpen}:{places:Place[];total:number;onAdd:()=>void;onOpen:(place:Place)=>void}){
  return <>
    <div className="section-head"><div><span className="eyebrow">Pocket list</span><h2>Saved places</h2><p className="section-sub">{total} places ready for the trip.</p></div><button className="add" onClick={onAdd}><Plus/>Save place</button></div>
    {places.length===0&&<div className="empty">No saved places match this search.</div>}
    <div className="saved-grid">{places.map((place,index)=><article key={place.id}><div className={`saved-img s${index%6+1}`}><Heart/><span>{String(index+1).padStart(2,'0')}</span></div><small>{place.category} · {place.neighborhood}</small><h3>{place.name}</h3><p>{place.note}</p><button onClick={()=>onOpen(place)}>View details <ArrowUpRight/></button></article>)}</div>
  </>
}

function ActivityModal({day,initial,onClose,onSave,onDelete}:{day:number;initial:Activity|null;onClose:()=>void;onSave:(activity:Activity)=>void;onDelete?:()=>void}){
  const [title,setTitle]=useState(initial?.title??'');
  const [place,setPlace]=useState(initial?.place??'');
  const [time,setTime]=useState(initial?.time??'12:00');
  const [kind,setKind]=useState<Activity['kind']>(initial?.kind??'sight');
  const [cost,setCost]=useState(String(initial?.cost??0));
  const [duration,setDuration]=useState(String(initial?.duration??90));
  const [note,setNote]=useState(initial?.note??'');
  return <div className="overlay" onMouseDown={onClose}>
    <form className="modal" onMouseDown={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();if(title.trim())onSave({id:initial?.id??crypto.randomUUID(),day:initial?.day??day,time,title:title.trim(),place:place.trim()||'Barcelona',kind,cost:Math.max(Number(cost)||0,0),done:initial?.done??false,note:note.trim()||'Added to your trip.',duration:Math.max(Number(duration)||30,15)})}}>
      <button type="button" className="close" onClick={onClose} aria-label="Close activity form"><X/></button>
      <h2>{initial?'Edit activity':`Add to day ${day}`}</h2><p>{initial?'Update the plan without losing its completion state.':'Keep the plan useful, not overpacked.'}</p>
      <label>Activity<input autoFocus required value={title} onChange={e=>setTitle(e.target.value)} placeholder="What do you want to do?"/></label>
      <label>Place<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Neighborhood or venue"/></label>
      <div className="form-row"><label>Time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><label>Type<select value={kind} onChange={e=>setKind(e.target.value as Activity['kind'])}><option value="sight">Sight</option><option value="food">Food</option><option value="transit">Transit</option><option value="shop">Shopping</option></select></label></div>
      <div className="form-row"><label>Estimated cost (€)<input type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(e.target.value)}/></label><label>Duration (min)<input type="number" min="15" step="15" value={duration} onChange={e=>setDuration(e.target.value)}/></label></div>
      <label>Note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Reservation, route, or reminder"/></label>
      <div className="modal-actions">{onDelete&&<button type="button" className="modal-delete" onClick={onDelete}><Trash2/>Delete</button>}<button className="modal-action">{initial?'Save changes':'Add activity'}</button></div>
    </form>
  </div>
}

function ExpenseModal({onClose,onSave}:{onClose:()=>void;onSave:(expense:Expense)=>void}){
  const [label,setLabel]=useState('');
  const [amount,setAmount]=useState('');
  const [category,setCategory]=useState('Food');
  return <div className="overlay" onMouseDown={onClose}>
    <form className="modal" onMouseDown={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();const value=Number(amount);if(label.trim()&&value>0)onSave({id:crypto.randomUUID(),label:label.trim(),category,amount:value})}}>
      <button type="button" className="close" onClick={onClose} aria-label="Close expense form"><X/></button>
      <h2>Add an expense</h2><p>Keep the trip budget honest without turning it into accounting.</p>
      <label>Description<input autoFocus required value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Tapas dinner"/></label>
      <div className="form-row"><label>Amount (€)<input type="number" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>Food</option><option>Stay</option><option>Transport</option><option>Activities</option><option>Shopping</option></select></label></div>
      <button className="modal-action">Add expense</button>
    </form>
  </div>
}

function PlaceModal({onClose,onSave}:{onClose:()=>void;onSave:(place:Place)=>void}){
  const [name,setName]=useState('');
  const [category,setCategory]=useState('Food');
  const [neighborhood,setNeighborhood]=useState('');
  const [note,setNote]=useState('');
  return <div className="overlay" onMouseDown={onClose}><form className="modal" onMouseDown={event=>event.stopPropagation()} onSubmit={event=>{event.preventDefault();if(name.trim())onSave({id:crypto.randomUUID(),name:name.trim(),category,neighborhood:neighborhood.trim()||'Barcelona',note:note.trim()||'Saved for later.'})}}>
    <button type="button" className="close" onClick={onClose} aria-label="Close place form"><X/></button><h2>Save a place</h2><p>Keep restaurants, landmarks, shops, and quiet finds together.</p>
    <label>Place name<input autoFocus required value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. Museu Picasso"/></label>
    <div className="form-row"><label>Category<input value={category} onChange={event=>setCategory(event.target.value)} placeholder="Museum"/></label><label>Neighborhood<input value={neighborhood} onChange={event=>setNeighborhood(event.target.value)} placeholder="El Born"/></label></div>
    <label>Why save it?<input value={note} onChange={event=>setNote(event.target.value)} placeholder="What makes it worth remembering?"/></label>
    <button className="modal-action">Save place</button>
  </form></div>
}

function PlaceDetails({place,onClose,onDelete}:{place:Place;onClose:()=>void;onDelete:()=>void}){
  const openMap=()=>window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${place.name}, Barcelona`)}`,'_blank','noopener,noreferrer');
  return <div className="overlay" onMouseDown={onClose}><section className="modal place-details" onMouseDown={event=>event.stopPropagation()}>
    <button type="button" className="close" onClick={onClose} aria-label="Close place details"><X/></button><span className="detail-heart"><Heart/></span><small>{place.category} · {place.neighborhood}</small><h2>{place.name}</h2><p>{place.note}</p><div className="modal-actions"><button className="modal-delete" onClick={onDelete}><Trash2/>Remove</button><button className="modal-action" onClick={openMap}><MapPin/>Open map</button></div>
  </section></div>
}
