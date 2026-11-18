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
import {loadWorkspace,resetWorkspace,saveWorkspace} from './storage';
import {demoWorkspace,freshDemo} from './demo';

beforeEach(()=>store.clear());

describe('loadWorkspace',()=>{
  it('returns the fresh demo when storage is empty',()=>{
    const w=loadWorkspace();
    expect(w.version).toBe(3);
    expect(w.trips).toHaveLength(1);
    expect(w).not.toBe(freshDemo()); // fresh clone each call
  });
  it('falls back to the demo when the stored JSON is malformed',()=>{
    store.set('wanderline-workspace-v3','{not json');
    const w=loadWorkspace();
    expect(w.trips[0].id).toBe('barcelona');
  });
  it('ignores a valid object of the wrong version',()=>{
    store.set('wanderline-workspace-v3',JSON.stringify({...freshDemo(),version:2}));
    expect(loadWorkspace().version).toBe(3);
  });
  it('restores a previously saved workspace',()=>{
    const w=loadWorkspace();
    saveWorkspace(w);
    expect(loadWorkspace().trips[0].destination).toBe(demoWorkspace.trips[0].destination);
  });
});

describe('saveWorkspace / resetWorkspace',()=>{
  it('persists the workspace under its key',()=>{
    const w=loadWorkspace();
    saveWorkspace(w);
    expect(store.has('wanderline-workspace-v3')).toBe(true);
  });
  it('resetWorkspace returns a fresh demo',()=>{
    loadWorkspace();
    saveWorkspace(loadWorkspace());
    const reset=resetWorkspace();
    expect(reset.trips[0].id).toBe('barcelona');
    expect(loadWorkspace().trips).toHaveLength(1);
  });
});