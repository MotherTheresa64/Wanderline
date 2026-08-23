import {useEffect,useMemo,useState} from 'react';
import {
  MapPin,CalendarDays,WalletCards,Bookmark,Search,Plus,Plane,ChevronDown,
  CloudSun,Navigation,Clock3,Euro,Check,MoreHorizontal,Menu,X,Camera,
  Utensils,Landmark,TrainFront,ShoppingBag,Send,ArrowUpRight,Luggage,
  Heart,Sun,CloudRain
} from 'lucide-react';
import {firebaseReady,signInGoogle} from './firebase';

type Activity={
  id:string;day:number;time:string;title:string;place:string;
  kind:'food'|'sight'|'transit'|'shop';cost:number;done:boolean;note:string
};
type Expense={id:string;label:string;category:string;amount:number};
type Pack={id:string;label:string;done:boolean};
type Persisted={activities:Activity[];expenses:Expense[];packing:Pack[]};

const STORE='wanderline-v1';
const TRIP_START=new Date('2026-09-14T09:00:00');
const BUDGET=1850;

const initial:Activity[]=[
  {id:'a1',day:1,time:'09:30',title:'Coffee & xuixo at Granja M. Viader',place:'El Raval',kind:'food',cost:18,done:true,note:'Start slowly after the overnight flight.'},
  {id:'a2',day:1,time:'11:00',title:'Wander the Gothic Quarter',place:'Barri Gòtic',kind:'sight',cost:0,done:true,note:'Cathedral, hidden courtyards, Plaça Reial.'},
  {id:'a3',day:1,time:'14:00',title:'Mercat de la Boqueria lunch',place:'La Rambla',kind:'food',cost:32,done:false,note:'Try pintxos and fresh juice.'},
  {id:'a4',day:1,time:'17:00',title:'Golden hour at Bunkers del Carmel',place:'El Carmel',kind:'sight',cost:0,done:false,note:'Bring water. Sunset around 8:35 PM.'},
  {id:'a5',day:2,time:'09:00',title:'Sagrada Família',place:'Eixample',kind:'sight',cost:58,done:false,note:'Tower entry booked. Arrive 20 minutes early.'},
  {id:'a6',day:2,time:'12:30',title:'Lunch at Casa Lolea',place:'Sant Pere',kind:'food',cost:45,done:false,note:'Reservation under Noah.'},
  {id:'a7',day:2,time:'15:00',title:'Park Güell & Gràcia walk',place:'Gràcia',kind:'sight',cost:26,done:false,note:'Take L3 then bus 24.'},
  {id:'a8',day:3,time:'08:40',title:'Train to Montserrat',place:'Plaça d’Espanya',kind:'transit',cost:48,done:false,note:'R5 toward Manresa, then cable car.'},
  {id:'a9',day:3,time:'10:30',title:'Montserrat monastery & trails',place:'Montserrat',kind:'sight',cost:0,done:false,note:'Choose Sant Miquel trail if weather is clear.'},
  {id:'a10',day:4,time:'10:00',title:'Beach morning',place:'Barceloneta',kind:'sight',cost:0,done:false,note:'Easy final morning before checkout.'},
  {id:'a11',day:4,time:'13:00',title:'Souvenirs & late lunch',place:'El Born',kind:'shop',cost:60,done:false,note:'Pick up ceramics and snacks for home.'}
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

function loadSaved():Persisted|null{
  try{
    const value=JSON.parse(localStorage.getItem(STORE)||'null');
    if(!value||!Array.isArray(value.activities)||!Array.isArray(value.expenses)||!Array.isArray(value.packing))return null;
    return value as Persisted;
  }catch{return null}
}

function countdownLabel(){
  const diff=Math.ceil((TRIP_START.getTime()-Date.now())/86_400_000);
  if(diff>1)return `Upcoming trip · ${diff} days`;
  if(diff===1)return 'Upcoming trip · tomorrow';
  if(diff===0)return 'Trip starts today';
  return 'Trip archive';
}

export default function App(){
  const cache=loadSaved();
  const [activities,setActivities]=useState<Activity[]>(cache?.activities||initial);
  const [expenses,setExpenses]=useState<Expense[]>(cache?.expenses||initialExpenses);
  const [packing,setPacking]=useState<Pack[]>(cache?.packing||initialPack);
  const [day,setDay]=useState(1);
  const [tab,setTab]=useState<'itinerary'|'budget'|'saved'>('itinerary');
  const [modal,setModal]=useState<'activity'|'expense'|null>(null);
  const [menu,setMenu]=useState(false);
  const [query,setQuery]=useState('');
  const [toast,setToast]=useState('');

  useEffect(()=>localStorage.setItem(STORE,JSON.stringify({activities,expenses,packing})),[activities,expenses,packing]);
  useEffect(()=>{
    if(!toast)return;
    const timer=setTimeout(()=>setToast(''),2400);
    return()=>clearTimeout(timer);
  },[toast]);

  const dayItems=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return activities.filter(a=>a.day===day&&(!q||`${a.title} ${a.place} ${a.note} ${a.kind}`.toLowerCase().includes(q)));
  },[activities,day,query]);

  const spent=expenses.reduce((sum,e)=>sum+e.amount,0);
  const done=activities.filter(a=>a.done).length;
  const progress=activities.length?Math.round(done/activities.length*100):0;
  const packed=packing.filter(p=>p.done).length;
  const packedPct=packing.length?packed/packing.length*100:0;
  const days=[['Mon','Sep 14'],['Tue','Sep 15'],['Wed','Sep 16'],['Thu','Sep 17']];

  const toggle=(id:string)=>setActivities(v=>v.map(a=>a.id===id?{...a,done:!a.done}:a));

  const signIn=async()=>{
    if(!firebaseReady){setToast('Demo mode — add Firebase keys to enable Google sign-in');return}
    try{await signInGoogle();setToast('Signed in with Google')}
    catch{setToast('Google sign-in was cancelled or unavailable')}
  };

  const shareTrip=async()=>{
    const payload={title:'Wanderline · Barcelona',text:'Barcelona itinerary · Sep 14–18, 2026',url:window.location.href};
    try{
      if(navigator.share){await navigator.share(payload);return}
      await navigator.clipboard.writeText(window.location.href);
      setToast('Trip link copied');
    }catch{setToast('Sharing was cancelled or blocked')}
  };

  return <div className="app">
    <aside className={menu?'sidebar open':'sidebar'}>
      <div className="logo"><span><Navigation/></span>wanderline</div>
      <button className="trip-switch" onClick={()=>setToast('Barcelona is the active demo trip')}>
        <span className="trip-thumb">BCN</span><span><b>Barcelona</b><small>Sep 14–18 · 4 nights</small></span><ChevronDown/>
      </button>
      <nav>
        <button className={tab==='itinerary'?'active':''} onClick={()=>{setTab('itinerary');setMenu(false)}}><CalendarDays/>Itinerary</button>
        <button className={tab==='budget'?'active':''} onClick={()=>{setTab('budget');setMenu(false)}}><WalletCards/>Budget</button>
        <button className={tab==='saved'?'active':''} onClick={()=>{setTab('saved');setMenu(false)}}><Bookmark/>Saved places <b>12</b></button>
      </nav>
      <div className="sidebar-title">Trip checklist</div>
      <div className="packing">{packing.map(p=><button key={p.id} onClick={()=>setPacking(v=>v.map(x=>x.id===p.id?{...x,done:!x.done}:x))}><span className={p.done?'check done':'check'}>{p.done&&<Check/>}</span><span className={p.done?'strike':''}>{p.label}</span></button>)}</div>
      <div className="trip-card"><div><Luggage/><span><b>{packed}/{packing.length} packed</b><small>{packed===packing.length?'Ready to go':'A few things left'}</small></span></div><div className="mini-progress"><i style={{width:`${packedPct}%`}}/></div></div>
      <div className="profile" role="button" tabIndex={0} onClick={signIn} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')signIn()}} title={firebaseReady?'Sign in with Google':'Running in demo mode'}><span className="avatar">NR</span><span><b>Noah</b><small>{firebaseReady?'Google sign-in ready':'Trip owner · demo mode'}</small></span><MoreHorizontal/></div>
    </aside>

    <main>
      <header>
        <button className="mobile" onClick={()=>setMenu(v=>!v)} aria-label="Toggle trip navigation"><Menu/></button>
        <div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search this day’s places and notes…" aria-label="Search itinerary"/></div>
        <div className="weather"><CloudSun/><span><b>77°</b><small>Barcelona · Sunny</small></span></div>
        <button className="share" onClick={shareTrip}><Send/>Share trip</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="kicker"><Plane/>{countdownLabel()}</span>
          <h1>Barcelona,<br/><em>slowly.</em></h1>
          <p>Four days of architecture, tiny streets, long lunches, mountain air, and nowhere to rush.</p>
          <div className="hero-meta"><span><CalendarDays/>Sep 14–18, 2026</span><span><MapPin/>Barcelona, Spain</span><span><Euro/>€{(BUDGET-spent).toLocaleString()} left</span></div>
        </div>
        <div className="postcard one"><span>41.3851° N</span><b>BARCELONA</b><small>Mediterranean coast</small></div>
        <div className="postcard two"><Camera/><b>4 days</b><small>{activities.length} moments planned</small></div>
      </section>

      <div className="top-stats">
        <div><span>Trip progress</span><b>{progress}%</b><div><i style={{width:`${progress}%`}}/></div></div>
        <div><span>Budget used</span><b>€{spent.toLocaleString()}</b><small>of €{BUDGET.toLocaleString()}</small></div>
        <div><span>Places saved</span><b>12</b><small>across 6 neighborhoods</small></div>
        <div><span>Trip pace</span><b>Relaxed</b><small>{(activities.length/4).toFixed(1)} plans / day</small></div>
      </div>

      <section className="content">
        {tab==='itinerary'&&<>
          <div className="section-head"><div><span className="eyebrow">Your route</span><h2>Day by day</h2></div><button className="add" onClick={()=>setModal('activity')}><Plus/>Add activity</button></div>
          <div className="day-tabs">{days.map((d,i)=><button key={i} className={day===i+1?'active':''} onClick={()=>setDay(i+1)}><span>{d[0]}</span><b>{d[1]}</b><small>{activities.filter(a=>a.day===i+1).length} plans</small></button>)}</div>
          <div className="itinerary-grid">
            <div className="timeline">
              {dayItems.length===0&&<div className="empty">No activities match this search on day {day}.</div>}
              {dayItems.map((a,i)=><article key={a.id} className={a.done?'activity complete':'activity'}>
                <div className="time">{a.time}<span/></div>
                <button className="complete" aria-label={a.done?'Reopen activity':'Mark activity complete'} onClick={()=>{toggle(a.id);setToast(a.done?'Activity reopened':'Marked complete')}}>{a.done&&<Check/>}</button>
                <div className="activity-card"><div className={`kind ${a.kind}`}>{icon(a.kind)}</div><div className="activity-main"><div><h3>{a.title}</h3><button aria-label="More activity options" onClick={()=>setToast('Activity editing will sync once the database is connected')}><MoreHorizontal/></button></div><p><MapPin/>{a.place}</p><small>{a.note}</small><div className="activity-foot"><span><Clock3/>~{i%2?90:120} min</span><span>{a.cost?`€${a.cost}`:'Free'}</span></div></div></div>
              </article>)}
            </div>
            <RightPanel day={day} onToast={setToast}/>
          </div>
        </>}
        {tab==='budget'&&<Budget expenses={expenses} budget={BUDGET} onAdd={()=>setModal('expense')}/>} 
        {tab==='saved'&&<Saved onToast={setToast}/>} 
      </section>
    </main>

    {modal==='activity'&&<ActivityModal day={day} onClose={()=>setModal(null)} onSave={a=>{setActivities(v=>[...v,a]);setModal(null);setToast('Added to itinerary')}}/>}
    {modal==='expense'&&<ExpenseModal onClose={()=>setModal(null)} onSave={e=>{setExpenses(v=>[...v,e]);setModal(null);setToast('Expense added')}}/>}
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
  return <aside className="right">
    <div className="map"><div className="map-grid"/><span className="pin p1">1</span><span className="pin p2">2</span><span className="pin p3">3</span><div className="map-label"><MapPin/><span><b>Day {day} route</b><small>7.4 km · mostly walkable</small></span></div></div>
    <div className="weather-card"><div>{weather.icon}<span><b>{weather.temp}</b><small>{weather.label}</small></span></div><p>Great walking weather. UV is high after noon, so bring sunscreen and water.</p></div>
    <div className="note-card"><span className="eyebrow">Local note</span><h3>Dinner starts late.</h3><p>Most locals won’t sit down until 9 PM. Build in a vermouth or snack around 6:30 and enjoy the slower rhythm.</p><button onClick={()=>onToast('Tip saved for your trip')}>More Barcelona tips <ArrowUpRight/></button></div>
  </aside>
}

function Budget({expenses,budget,onAdd}:{expenses:Expense[];budget:number;onAdd:()=>void}){
  const spent=expenses.reduce((sum,e)=>sum+e.amount,0);
  const pct=budget?Math.min(spent/budget*100,100):0;
  const categories=Object.entries(expenses.reduce<Record<string,number>>((map,e)=>({...map,[e.category]:(map[e.category]||0)+e.amount}),{}));
  return <>
    <div className="section-head"><div><span className="eyebrow">Money map</span><h2>Trip budget</h2></div><button className="add" onClick={onAdd}><Plus/>Add expense</button></div>
    <div className="budget-hero"><div><span>Remaining</span><strong>€{Math.max(budget-spent,0).toLocaleString()}</strong><p>of €{budget.toLocaleString()} total budget</p></div><div className="ring" style={{background:`conic-gradient(#e36f4f 0 ${pct}%,#e7e1d6 ${pct}% 100%)`}}><span>{Math.round(spent/budget*100)}%</span></div></div>
    <div className="budget-grid"><div className="ledger"><div className="ledger-head"><h3>Expenses</h3><span>{expenses.length} items</span></div>{expenses.map(e=><div className="expense" key={e.id}><span className="expense-icon">€</span><div><b>{e.label}</b><small>{e.category}</small></div><strong>€{e.amount.toLocaleString()}</strong></div>)}</div><div className="breakdown"><h3>By category</h3>{categories.map(([category,value])=><div key={category}><span>{category}</span><div><i style={{width:`${spent?value/spent*100:0}%`}}/></div><b>€{value.toLocaleString()}</b></div>)}</div></div>
  </>
}

function Saved({onToast}:{onToast:(message:string)=>void}){
  const places=[
    ['Can Culleretes','Catalan · Barri Gòtic','Loved by locals since 1786'],
    ['Casa Batlló','Architecture · Eixample','Gaudí at his most surreal'],
    ['Paradiso','Cocktails · El Born','Hidden behind a pastrami shop'],
    ['La Manual Alpargatera','Shopping · Gothic Quarter','Handmade espadrilles since 1940'],
    ['Café Cometa','Coffee · Sant Antoni','Bright, quiet, excellent brunch'],
    ['Jardins de Mossèn Costa','Garden · Montjuïc','Cacti with harbor views']
  ];
  return <>
    <div className="section-head"><div><span className="eyebrow">Pocket list</span><h2>Saved places</h2></div><button className="add" onClick={()=>onToast('Place search will sync once the database is connected')}><Plus/>Save place</button></div>
    <div className="saved-grid">{places.map((place,i)=><article key={place[0]}><div className={`saved-img s${i+1}`}><Heart/><span>0{i+1}</span></div><small>{place[1]}</small><h3>{place[0]}</h3><p>{place[2]}</p><button onClick={()=>onToast(`${place[0]} opened in demo mode`)}>View details <ArrowUpRight/></button></article>)}</div>
  </>
}

function ActivityModal({day,onClose,onSave}:{day:number;onClose:()=>void;onSave:(activity:Activity)=>void}){
  const [title,setTitle]=useState('');
  const [place,setPlace]=useState('');
  const [time,setTime]=useState('12:00');
  const [kind,setKind]=useState<Activity['kind']>('sight');
  const [cost,setCost]=useState('0');
  const [note,setNote]=useState('');
  return <div className="overlay" onMouseDown={onClose}>
    <form className="modal" onMouseDown={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();if(title.trim())onSave({id:crypto.randomUUID(),day,time,title:title.trim(),place:place.trim()||'Barcelona',kind,cost:Math.max(Number(cost)||0,0),done:false,note:note.trim()||'Added to your trip.'})}}>
      <button type="button" className="close" onClick={onClose} aria-label="Close activity form"><X/></button>
      <h2>Add to day {day}</h2><p>Keep the plan useful, not overpacked.</p>
      <label>Activity<input autoFocus required value={title} onChange={e=>setTitle(e.target.value)} placeholder="What do you want to do?"/></label>
      <label>Place<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Neighborhood or venue"/></label>
      <div className="form-row"><label>Time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><label>Type<select value={kind} onChange={e=>setKind(e.target.value as Activity['kind'])}><option value="sight">Sight</option><option value="food">Food</option><option value="transit">Transit</option><option value="shop">Shopping</option></select></label></div>
      <label>Estimated cost (€)<input type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(e.target.value)}/></label>
      <label>Note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Reservation, route, or reminder"/></label>
      <button className="modal-action">Add activity</button>
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
