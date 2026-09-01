import assert from 'node:assert/strict';
import test from 'node:test';
import {demoWorkspace} from '../src/demo';
import {googleMapsDirections,googleMapsSearch} from '../src/maps';
import {
  balances,calculateSettlements,changeMemberRole,countdownToDate,dateLabel,equalSplitCents,
  expenseShare,expenseSharesCents,localTodayDateOnly,permissionsFor,reconcileTripDateRange,
  removeTripMember,tripDates,validateExpense
} from '../src/model';
import type {Expense,Trip} from '../src/model';
import {parseWorkspace} from '../src/storage';

function cloneTrip(){return structuredClone(demoWorkspace.trips[0])}

function minimalExpense(overrides:Partial<Expense>={}):Expense{
  return {
    id:'expense',description:'Test expense',amount:10,category:'Food',paidBy:'noah',
    participantIds:['noah','maya'],splitMode:'equal',createdAt:'2026-09-01T00:00:00.000Z',...overrides
  };
}

test('date-only helpers survive DST boundaries without shifting calendar days',()=>{
  assert.deepEqual(tripDates('2026-03-07','2026-03-10'),['2026-03-07','2026-03-08','2026-03-09','2026-03-10']);
  assert.equal(dateLabel('2026-09-03',{month:'long',day:'numeric'}),'September 3');
  assert.equal(countdownToDate('2026-09-03','2026-09-01'),2);
  assert.deepEqual(tripDates('2026-09-04','2026-09-03'),[]);
  assert.deepEqual(tripDates('not-a-date','2026-09-03'),[]);
});

test('local today helper preserves the local calendar date',()=>{
  assert.equal(localTodayDateOnly(new Date(2026,8,3,0,5,0)),'2026-09-03');
});

test('equal splits distribute remainder cents deterministically',()=>{
  const shares=equalSplitCents(10,['a','b','c']);
  assert.deepEqual(shares,{a:334,b:333,c:333});
  assert.equal(Object.values(shares).reduce((sum,value)=>sum+value,0),1000);
});

test('personal expense responsibility is independent from who paid',()=>{
  const expense=minimalExpense({paidBy:'noah',participantIds:['maya'],splitMode:'personal'});
  assert.equal(expenseShare(expense,'noah'),0);
  assert.equal(expenseShare(expense,'maya'),10);
  const trip=cloneTrip();
  trip.expenses=[expense];
  const rows=balances(trip);
  assert.equal(rows.find(row=>row.member.id==='noah')?.balance,10);
  assert.equal(rows.find(row=>row.member.id==='maya')?.balance,-10);
});

test('custom shares must balance exactly to the cent',()=>{
  const good=minimalExpense({amount:10,splitMode:'custom',customShares:{noah:3.33,maya:6.67}});
  const bad=minimalExpense({amount:10,splitMode:'custom',customShares:{noah:3.33,maya:6.66}});
  assert.equal(validateExpense(good,['noah','maya']).valid,true);
  assert.equal(validateExpense(bad,['noah','maya']).valid,false);
});

test('settlements use integer cents and terminate without residual value',()=>{
  const trip=cloneTrip();
  trip.members=trip.members.filter(member=>member.status==='active');
  trip.members.push({id:'third',name:'Third',email:'third@example.com',initials:'T',role:'viewer',status:'active'});
  trip.expenses=[minimalExpense({amount:10,paidBy:'noah',participantIds:['noah','maya','third'],splitMode:'equal'})];
  assert.deepEqual(expenseSharesCents(trip.expenses[0]),{noah:334,maya:333,third:333});
  const settlements=calculateSettlements(trip);
  assert.deepEqual(settlements,[{from:'maya',to:'noah',amount:3.33},{from:'third',to:'noah',amount:3.33}]);
  assert.equal(settlements.reduce((sum,item)=>sum+Math.round(item.amount*100),0),666);
});

test('trip date edits move dated resources inside the new range',()=>{
  const trip=cloneTrip();
  trip.activities.push({...trip.activities[0],id:'outside',date:'2026-09-17'});
  trip.reservations.push({...trip.reservations[0],id:'outside-res',date:'2026-09-14'});
  const result=reconcileTripDateRange(trip,'2026-09-15','2026-09-16');
  assert.equal(result.trip.activities.find(item=>item.id==='outside')?.date,'2026-09-16');
  assert.equal(result.trip.activities.find(item=>item.id==='a1')?.date,'2026-09-15');
  assert.equal(result.trip.reservations.find(item=>item.id==='outside-res')?.date,'2026-09-15');
  assert.ok(result.movedActivities>=2);
  assert.ok(result.movedReservations>=1);
});

test('permissions distinguish active viewers from pending or missing members',()=>{
  assert.equal(permissionsFor({id:'v',name:'Viewer',email:'v@example.com',initials:'V',role:'viewer',status:'active'}).canVote,true);
  assert.equal(permissionsFor({id:'v',name:'Viewer',email:'v@example.com',initials:'V',role:'viewer',status:'active'}).canEdit,false);
  assert.equal(permissionsFor({id:'p',name:'Pending',email:'p@example.com',initials:'P',role:'editor',status:'pending'}).canVote,false);
  assert.equal(permissionsFor(undefined).canEdit,false);
});

test('final active owner cannot be downgraded',()=>{
  const trip=cloneTrip();
  const result=changeMemberRole(trip,'noah','viewer');
  assert.ok(result.error);
  assert.equal(result.trip.members.find(member=>member.id==='noah')?.role,'owner');
});

test('traveler removal blocks financial references instead of corrupting the ledger',()=>{
  const trip=cloneTrip();
  const blocked=removeTripMember(trip,'maya');
  assert.match(blocked.error??'',/expense/i);
  assert.equal(blocked.trip.members.find(member=>member.id==='maya')?.status,'active');
});

test('safe traveler removal preserves history identity and scrubs live references',()=>{
  const trip=cloneTrip();
  trip.expenses=[];
  trip.packing=trip.packing.filter(item=>!(item.scope==='shared'&&item.assignedTo==='maya'));
  const result=removeTripMember(trip,'maya');
  assert.equal(result.error,null);
  assert.equal(result.trip.members.find(member=>member.id==='maya')?.status,'removed');
  assert.ok(result.trip.history.some(event=>event.memberId==='maya'));
  assert.equal(result.trip.activities.some(activity=>activity.attendeeIds.includes('maya')),false);
  assert.equal(result.trip.activities.some(activity=>activity.votes.includes('maya')),false);
  assert.equal(result.trip.packing.some(item=>item.scope==='personal'&&item.assignedTo==='maya'),false);
});

test('pending traveler removal is a hard delete because no historical membership exists yet',()=>{
  const trip=cloneTrip();
  const result=removeTripMember(trip,'alex');
  assert.equal(result.error,null);
  assert.equal(result.trip.members.some(member=>member.id==='alex'),false);
});

test('workspace parser migrates valid v3 data and rejects malformed nested resources',()=>{
  const v3={...structuredClone(demoWorkspace),version:3};
  const migrated=parseWorkspace(v3);
  assert.equal(migrated?.version,4);
  const malformed=structuredClone(v3) as unknown as {trips:Array<Record<string,unknown>>};
  malformed.trips[0].expenses=[{id:'bad'}];
  assert.equal(parseWorkspace(malformed),null);
});

test('workspace normalization chooses a usable active trip',()=>{
  const input=structuredClone(demoWorkspace);
  const second=structuredClone(input.trips[0]);
  second.id='second';second.name='Second';second.archived=false;
  input.trips[0].archived=true;
  input.trips.push(second);
  input.activeTripId=input.trips[0].id;
  const parsed=parseWorkspace(input);
  assert.equal(parsed?.activeTripId,'second');
});

test('all-archived persisted workspaces recover one usable trip',()=>{
  const input=structuredClone(demoWorkspace);
  input.trips[0].archived=true;
  const parsed=parseWorkspace(input);
  assert.equal(parsed?.trips[0].archived,false);
  assert.equal(parsed?.activeTripId,input.trips[0].id);
});

test('member-less trips and duplicate resource IDs are rejected as corrupt persistence',()=>{
  const memberless=structuredClone(demoWorkspace);
  memberless.trips[0].members=[];
  assert.equal(parseWorkspace(memberless),null);
  const duplicate=structuredClone(demoWorkspace);
  duplicate.trips[0].activities.push({...duplicate.trips[0].activities[0]});
  assert.equal(parseWorkspace(duplicate),null);
});

test('Google Maps helpers encode special characters and reject blank locations',()=>{
  const search=googleMapsSearch('Sagrada Família, Barcelona');
  assert.match(search,/Sagrada%20Fam%C3%ADlia%2C%20Barcelona/);
  const directions=googleMapsDirections('Musée d’Orsay, Paris','Hôtel du Louvre, Paris');
  assert.match(directions,/destination=Mus%C3%A9e%20d%E2%80%99Orsay%2C%20Paris/);
  assert.match(directions,/origin=H%C3%B4tel%20du%20Louvre%2C%20Paris/);
  assert.equal(googleMapsSearch('   '),'');
});

test('money-domain example preserves total cents across balances',()=>{
  const trip=cloneTrip() as Trip;
  trip.expenses=[
    minimalExpense({id:'one',amount:10.01,paidBy:'noah',participantIds:['noah','maya'],splitMode:'equal'}),
    minimalExpense({id:'two',amount:5.99,paidBy:'maya',participantIds:['noah'],splitMode:'personal'})
  ];
  const rows=balances(trip);
  assert.equal(rows.reduce((sum,row)=>sum+Math.round(row.balance*100),0),0);
});
