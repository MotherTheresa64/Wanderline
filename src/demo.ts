import type {Workspace} from './model';

export const demoWorkspace:Workspace={
  version:3,
  currentUserId:'noah',
  activeTripId:'barcelona',
  trips:[{
    id:'barcelona',
    name:'Barcelona Escape',
    destination:'Barcelona, Spain',
    startDate:'2026-09-14',
    endDate:'2026-09-17',
    description:'Four easygoing days of architecture, food, neighborhoods, and sunset views.',
    budget:1850,
    archived:false,
    members:[
      {id:'noah',name:'Noah',email:'noah@example.com',initials:'N',role:'owner',status:'active'},
      {id:'maya',name:'Maya',email:'maya@example.com',initials:'M',role:'editor',status:'active'},
      {id:'alex',name:'Alex',email:'alex@example.com',initials:'A',role:'viewer',status:'pending'}
    ],
    activities:[
      {id:'a1',date:'2026-09-14',time:'09:30',title:'Coffee at Satan’s Coffee Corner',location:'Carrer de l’Arc de Sant Ramon del Call, Barcelona',category:'food',durationMinutes:60,cost:18,note:'Easy first stop after dropping bags.',status:'confirmed',createdBy:'maya',attendeeIds:['noah','maya'],votes:['noah','maya']},
      {id:'a2',date:'2026-09-14',time:'11:00',title:'Wander the Gothic Quarter',location:'Barri Gòtic, Barcelona',category:'sight',durationMinutes:120,cost:0,note:'Cathedral, hidden courtyards, Plaça Reial, and side streets.',status:'confirmed',createdBy:'noah',attendeeIds:['noah','maya'],votes:['noah','maya']},
      {id:'a3',date:'2026-09-14',time:'14:00',title:'La Boqueria lunch',location:'Mercat de la Boqueria, La Rambla, Barcelona',category:'food',durationMinutes:90,cost:42,note:'Try a few stalls rather than sitting for a long meal.',status:'planned',createdBy:'maya',attendeeIds:['noah','maya'],votes:['maya']},
      {id:'a4',date:'2026-09-14',time:'18:30',title:'Sunset at Bunkers del Carmel',location:'MUHBA Turó de la Rovira, Barcelona',category:'sight',durationMinutes:120,cost:0,note:'Bring water. Sunset is around 8:35 PM.',status:'planned',createdBy:'noah',attendeeIds:['noah','maya'],votes:['noah']},
      {id:'a5',date:'2026-09-15',time:'10:00',title:'Sagrada Família',location:'Basílica de la Sagrada Família, Barcelona',category:'sight',durationMinutes:120,cost:68,note:'Timed entry; arrive 20 minutes early.',status:'confirmed',createdBy:'noah',attendeeIds:['noah','maya'],votes:['noah','maya']},
      {id:'a6',date:'2026-09-15',time:'13:00',title:'Gràcia lunch and plazas',location:'Vila de Gràcia, Barcelona',category:'food',durationMinutes:150,cost:55,note:'Keep this loose and pick a place when hungry.',status:'planned',createdBy:'maya',attendeeIds:['noah','maya'],votes:['maya']},
      {id:'a7',date:'2026-09-15',time:'18:00',title:'Park Güell golden hour',location:'Park Güell, Barcelona',category:'sight',durationMinutes:120,cost:28,note:'Walk the monumental zone before sunset.',status:'planned',createdBy:'noah',attendeeIds:['noah','maya'],votes:['noah','maya']},
      {id:'a8',date:'2026-09-16',time:'10:30',title:'Beach morning at Barceloneta',location:'Barceloneta Beach, Barcelona',category:'sight',durationMinutes:150,cost:0,note:'Slow morning. Grab breakfast on the walk down.',status:'planned',createdBy:'maya',attendeeIds:['noah','maya'],votes:['maya']},
      {id:'a9',date:'2026-09-16',time:'17:00',title:'Montjuïc cable car',location:'Telefèric de Montjuïc, Barcelona',category:'sight',durationMinutes:120,cost:36,note:'Views over the port and city.',status:'planned',createdBy:'noah',attendeeIds:['noah','maya'],votes:['noah']},
      {id:'idea1',date:'2026-09-17',time:'20:00',title:'Flamenco at Tablao Cordobés',location:'La Rambla, Barcelona',category:'event',durationMinutes:90,cost:110,note:'Suggested night-out option if everyone wants a show.',status:'suggested',createdBy:'maya',attendeeIds:['noah','maya'],votes:['maya']},
      {id:'idea2',date:'2026-09-17',time:'12:00',title:'Picasso Museum',location:'Museu Picasso de Barcelona',category:'sight',durationMinutes:120,cost:32,note:'Good indoor option if the afternoon is hot.',status:'suggested',createdBy:'noah',attendeeIds:['noah','maya'],votes:['noah','maya']}
    ],
    places:[
      {id:'p1',name:'Can Culleretes',category:'Restaurant',neighborhood:'Gothic Quarter',note:'Historic Catalan restaurant; good option for a proper dinner.',createdBy:'maya'},
      {id:'p2',name:'Casa Batlló',category:'Architecture',neighborhood:'Eixample',note:'Could fit before dinner if Passeig de Gràcia is already on the route.',createdBy:'noah'},
      {id:'p3',name:'El Xampanyet',category:'Tapas',neighborhood:'El Born',note:'Tiny cava and tapas stop near the Picasso Museum.',createdBy:'maya'},
      {id:'p4',name:'Palau de la Música Catalana',category:'Architecture',neighborhood:'Sant Pere',note:'Beautiful interior; check tour times.',createdBy:'noah'},
      {id:'p5',name:'La Central del Raval',category:'Books',neighborhood:'El Raval',note:'Bookshop and quiet courtyard if we need a slower hour.',createdBy:'maya'},
      {id:'p6',name:'Mirador de Colom',category:'Viewpoint',neighborhood:'Port Vell',note:'Easy add-on if we walk the waterfront.',createdBy:'noah'}
    ],
    expenses:[
      {id:'e1',description:'Hotel deposit',amount:620,category:'Lodging',paidBy:'noah',participantIds:['noah','maya'],splitMode:'equal',createdAt:'2026-08-28T18:00:00.000Z'},
      {id:'e2',description:'Sagrada Família tickets',amount:68,category:'Activities',paidBy:'maya',participantIds:['noah','maya'],splitMode:'equal',createdAt:'2026-08-29T15:00:00.000Z'},
      {id:'e3',description:'Airport transfer',amount:46,category:'Transportation',paidBy:'noah',participantIds:['noah','maya'],splitMode:'equal',createdAt:'2026-08-30T12:00:00.000Z'},
      {id:'e4',description:'Travel eSIM',amount:24,category:'Other',paidBy:'noah',participantIds:['noah'],splitMode:'personal',createdAt:'2026-08-30T14:00:00.000Z'}
    ],
    packing:[
      {id:'pk1',label:'Passports & IDs',scope:'shared',assignedTo:'noah',done:true},
      {id:'pk2',label:'Phone chargers',scope:'shared',assignedTo:'maya',done:true},
      {id:'pk3',label:'Walking shoes',scope:'personal',assignedTo:'noah',done:false},
      {id:'pk4',label:'Sunscreen',scope:'shared',assignedTo:'maya',done:false},
      {id:'pk5',label:'Light rain layer',scope:'personal',assignedTo:'noah',done:false}
    ],
    notes:[
      {id:'n1',title:'Arrival plan',body:'Drop bags, grab coffee, then keep the first day intentionally light. Metro cards can wait until after check-in.',createdBy:'noah',updatedAt:'2026-08-30T18:00:00.000Z'},
      {id:'n2',title:'Dinner timing',body:'Most local dinner spots start later. Aim for 8:30–9 PM unless we specifically reserve earlier.',createdBy:'maya',updatedAt:'2026-08-30T19:00:00.000Z'}
    ],
    reservations:[
      {id:'r1',type:'Hotel',title:'Hotel Barcelona Catedral',date:'2026-09-14',time:'15:00',location:'Avinguda de la Catedral, Barcelona',confirmation:'BCN-4821',note:'Early bag drop requested.'},
      {id:'r2',type:'Event',title:'Sagrada Família timed entry',date:'2026-09-15',time:'10:00',location:'Sagrada Família, Barcelona',confirmation:'SF-20486',note:'Two adult tickets.'}
    ],
    history:[
      {id:'h1',text:'created the Barcelona trip',memberId:'noah',createdAt:'2026-08-27T16:00:00.000Z'},
      {id:'h2',text:'joined the trip',memberId:'maya',createdAt:'2026-08-27T16:30:00.000Z'},
      {id:'h3',text:'added Sagrada Família to the itinerary',memberId:'noah',createdAt:'2026-08-29T15:05:00.000Z'},
      {id:'h4',text:'suggested Flamenco at Tablao Cordobés',memberId:'maya',createdAt:'2026-08-30T20:00:00.000Z'}
    ]
  }]
};

export function freshDemo(){return structuredClone(demoWorkspace)}
