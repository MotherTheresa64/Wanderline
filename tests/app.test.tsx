import assert from 'node:assert/strict';
import {after,afterEach,beforeEach,test} from 'node:test';
import globalJsdom from 'global-jsdom';

const restoreDom=globalJsdom(undefined,{url:'http://localhost/'});
(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;

Object.defineProperty(window,'confirm',{configurable:true,value:()=>true});
Object.defineProperty(window,'open',{configurable:true,value:()=>null});
Object.defineProperty(globalThis,'fetch',{configurable:true,writable:true,value:async()=>{throw new Error('offline')}});

const {cleanup,render,screen,waitFor,within}=await import('@testing-library/react');
const userEvent=(await import('@testing-library/user-event')).default;
const App=(await import('../src/app/App')).default;
const {demoWorkspace}=await import('../src/demo');
const {WORKSPACE_KEY}=await import('../src/storage');

beforeEach(()=>{
  localStorage.clear();
  Object.defineProperty(globalThis,'fetch',{configurable:true,writable:true,value:async()=>{throw new Error('offline')}});
  Object.defineProperty(window,'confirm',{configurable:true,value:()=>true});
});

afterEach(()=>cleanup());
after(()=>restoreDom());

function navButton(name:RegExp){return screen.getByRole('button',{name})}

async function renderApp(){
  render(<App/>);
  await screen.findByRole('heading',{name:'Barcelona Escape'});
}

test('weather provider failure degrades without blocking the trip workspace',async()=>{
  await renderApp();
  await screen.findByRole('button',{name:/weather unavailable/i});
  assert.ok(screen.getByText(/Local demo:/));
  assert.ok(screen.getByRole('button',{name:/Share summary/i}));
});

test('idea voting and promotion move one canonical activity into the itinerary',async()=>{
  await renderApp();
  const user=userEvent.setup();
  await user.click(navButton(/^Ideas/));
  const heading=await screen.findByRole('heading',{name:'Flamenco at Tablao Cordobés'});
  const card=heading.closest('article');
  assert.ok(card);
  const idea=within(card);
  await user.click(idea.getByRole('button',{name:'Vote'}));
  assert.ok(idea.getByRole('button',{name:'Voted'}));
  await user.click(idea.getByRole('button',{name:/Confirm/}));
  await waitFor(()=>assert.equal(screen.queryByRole('heading',{name:'Flamenco at Tablao Cordobés'}),null));
  await user.click(navButton(/^Itinerary/));
  await user.click(screen.getByRole('tab',{name:/Day 4/}));
  assert.ok(await screen.findByRole('heading',{name:'Flamenco at Tablao Cordobés'}));
});

test('itinerary activity supports add, edit, complete/reopen, and delete interactions',async()=>{
  await renderApp();
  const user=userEvent.setup();
  await user.click(navButton(/^Itinerary/));
  await user.click(screen.getByRole('button',{name:/Add activity/}));
  let dialog=await screen.findByRole('dialog',{name:'activity dialog'});
  await user.type(within(dialog).getByLabelText('Title'),'Test neighborhood walk');
  await user.type(within(dialog).getByLabelText('Location'),'El Born, Barcelona');
  await user.click(within(dialog).getByRole('button',{name:'Add to trip'}));
  assert.ok(await screen.findByRole('heading',{name:'Test neighborhood walk'}));

  await user.click(screen.getByRole('button',{name:'Edit Test neighborhood walk'}));
  dialog=await screen.findByRole('dialog',{name:'activity dialog'});
  const title=within(dialog).getByLabelText('Title');
  await user.clear(title);
  await user.type(title,'Edited neighborhood walk');
  await user.click(within(dialog).getByRole('button',{name:'Save changes'}));
  assert.ok(await screen.findByRole('heading',{name:'Edited neighborhood walk'}));

  await user.click(screen.getByRole('button',{name:'Mark Edited neighborhood walk complete'}));
  assert.ok(screen.getByRole('button',{name:'Reopen Edited neighborhood walk'}));
  await user.click(screen.getByRole('button',{name:'Reopen Edited neighborhood walk'}));
  assert.ok(screen.getByRole('button',{name:'Mark Edited neighborhood walk complete'}));

  await user.click(screen.getByRole('button',{name:'Delete Edited neighborhood walk'}));
  await waitFor(()=>assert.equal(screen.queryByRole('heading',{name:'Edited neighborhood walk'}),null));
});

test('saved place can create an itinerary activity without removing the saved place',async()=>{
  await renderApp();
  const user=userEvent.setup();
  await user.click(navButton(/^Saved places/));
  const placeHeading=await screen.findByRole('heading',{name:'Can Culleretes'});
  const placeCard=placeHeading.closest('article');
  assert.ok(placeCard);
  await user.click(within(placeCard).getByRole('button',{name:/Add to itinerary/}));
  const dialog=await screen.findByRole('dialog',{name:'activity dialog'});
  assert.equal((within(dialog).getByLabelText('Title') as HTMLInputElement).value,'Can Culleretes');
  await user.click(within(dialog).getByRole('button',{name:'Add to trip'}));
  assert.ok(await screen.findByRole('heading',{name:'Can Culleretes'}));
  await user.click(navButton(/^Itinerary/));
  assert.ok(await screen.findByRole('heading',{name:'Can Culleretes'}));
});

test('expense form records a real ledger expense and updates budget totals',async()=>{
  await renderApp();
  const user=userEvent.setup();
  await user.click(navButton(/^Budget/));
  assert.ok(await screen.findByRole('heading',{name:'Expenses'}));
  await user.click(screen.getByRole('button',{name:/Add expense/}));
  const dialog=await screen.findByRole('dialog',{name:'expense dialog'});
  await user.type(within(dialog).getByLabelText('Description'),'Test dinner');
  await user.type(within(dialog).getByLabelText('Amount (USD)'),'10');
  await user.click(within(dialog).getByRole('button',{name:'Add expense'}));
  assert.ok(await screen.findByText('Test dinner'));
  assert.ok(screen.getAllByText('$758').length>0);
});

test('packing add and completion interaction updates the one-handed checklist',async()=>{
  await renderApp();
  const user=userEvent.setup();
  await user.click(navButton(/^Packing/));
  await user.click(screen.getByRole('button',{name:/Add item/}));
  const dialog=await screen.findByRole('dialog',{name:'packing dialog'});
  await user.type(within(dialog).getByLabelText('Item'),'Travel adapter');
  await user.click(within(dialog).getByRole('button',{name:'Add item'}));
  assert.ok(await screen.findByText('Travel adapter'));
  await user.click(screen.getByRole('button',{name:'Mark packed: Travel adapter'}));
  assert.ok(screen.getByRole('button',{name:'Mark not packed: Travel adapter'}));
});

test('global search routes a matching result into its domain view',async()=>{
  await renderApp();
  const user=userEvent.setup();
  const search=screen.getByRole('textbox',{name:'Search this trip'});
  await user.type(search,'Picasso');
  const result=await screen.findByRole('option',{name:/Picasso Museum/});
  await user.click(result);
  assert.ok(await screen.findByRole('heading',{name:'Ideas'}));
  assert.ok(screen.getByRole('heading',{name:'Picasso Museum'}));
});

test('navigation drawer interaction exposes and closes the trip navigation safely',async()=>{
  await renderApp();
  const user=userEvent.setup();
  const menu=screen.getByRole('button',{name:'Open navigation'});
  assert.equal(menu.getAttribute('aria-expanded'),'false');
  await user.click(menu);
  assert.equal(screen.getByRole('button',{name:'Close navigation'}).getAttribute('aria-expanded'),'true');
  await user.click(screen.getByRole('button',{name:'Close navigation'}));
  assert.equal(screen.getByRole('button',{name:'Open navigation'}).getAttribute('aria-expanded'),'false');
});

test('active viewer can vote but cannot edit or promote ideas',async()=>{
  const viewerWorkspace=structuredClone(demoWorkspace);
  viewerWorkspace.currentUserId='alex';
  const alex=viewerWorkspace.trips[0].members.find(member=>member.id==='alex');
  assert.ok(alex);
  alex.status='active';
  alex.role='viewer';
  localStorage.setItem(WORKSPACE_KEY,JSON.stringify(viewerWorkspace));

  render(<App/>);
  await screen.findByRole('heading',{name:'Barcelona Escape'});
  const user=userEvent.setup();
  await user.click(navButton(/^Ideas/));
  const heading=await screen.findByRole('heading',{name:'Flamenco at Tablao Cordobés'});
  const card=heading.closest('article');
  assert.ok(card);
  assert.ok(within(card).getByRole('button',{name:'Vote'}));
  assert.equal(within(card).queryByRole('button',{name:/Confirm/}),null);
  assert.equal(screen.queryByRole('button',{name:/Suggest something/}),null);
});
