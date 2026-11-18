const store=new Map<string,string>();
(globalThis as any).localStorage={
  getItem:(k:string)=>store.has(k)?store.get(k)!:null,
  setItem:(k:string,v:string)=>{store.set(k,v)},
  removeItem:(k:string)=>{store.delete(k)},
  clear:()=>store.clear(),
  key:()=>null,
  length:0
};
import {beforeEach,describe,expect,it} from 'vitest';
import {DEFAULT_THEME,STORAGE_KEY,themes} from './theme';
import {loadWorkspace,resetWorkspace,saveWorkspace} from './storage';
import {freshDemo} from './demo';

describe('Wanderline theme',()=>{
  beforeEach(()=>store.clear());
  it('defines the four themes in order',()=>{
    expect(themes.map(t=>t.id)).toEqual(['coast','sunset','terracotta','night']);
    expect(DEFAULT_THEME).toBe('coast');
  });
  it('has a stable storage key',()=>{
    expect(STORAGE_KEY).toBe('wanderline-theme-v2');
  });
});

describe('Wanderline workspace storage',()=>{
  beforeEach(()=>store.clear());
  it('creates a fresh demo workspace on first load',()=>{
    const w=loadWorkspace();
    expect(w.version).toBe(3);
    expect(w.currentUserId).toBe('noah');
    expect(w.trips).toHaveLength(1);
    expect(w.trips[0].id).toBe('barcelona');
  });
  it('round-trips a saved workspace',()=>{
    const w=loadWorkspace();
    saveWorkspace(w);
    const loaded=loadWorkspace();
    expect(loaded.trips[0].name).toBe(w.trips[0].name);
    expect(loaded.activeTripId).toBe('barcelona');
  });
  it('resets back to a fresh demo',()=>{
    loadWorkspace();
    const reset=resetWorkspace();
    expect(reset.trips[0].id).toBe('barcelona');
    expect(loadWorkspace().trips).toHaveLength(1);
  });
});