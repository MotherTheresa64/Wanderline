import {useEffect,useRef} from 'react';
import type {ReactNode} from 'react';
import {CalendarCheck2,Sparkles,X} from 'lucide-react';
import {dateLabel,memberName,money} from '../model';
import type {ActivityCategory,ActivityStatus,Expense,ReservationType,Trip,TripMember} from '../model';

export function Page({title,eyebrow,description,action,children}:{title:string;eyebrow:string;description:string;action?:ReactNode;children:ReactNode}){
  return <div className="wl-page-inner"><div className="wl-page-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>{children}</div>;
}

export function Empty({title,text,action}:{title:string;text:string;action?:ReactNode}){
  return <div className="wl-empty"><Sparkles size={20}/><b>{title}</b><p>{text}</p>{action}</div>;
}

export function PanelHead({eyebrow,title,action}:{eyebrow:string;title:string;action?:ReactNode}){
  return <div className="wl-panel-head"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}

export function Avatar({member,small=false}:{member:TripMember;small?:boolean}){
  return <span className={`${small?'wl-avatar small':'wl-avatar'}${member.status==='removed'?' removed':''}`} title={member.status==='removed'?`${member.name} (former traveler)`:member.name}>{member.initials}</span>;
}

export function StatusBadge({status}:{status:ActivityStatus}){
  return <span className={`wl-status ${status}`}>{status}</span>;
}

export function categoryIcon(category:ActivityCategory){
  const glyph:Record<ActivityCategory,string>={food:'☕',sight:'◇',transit:'↗',shopping:'◌',lodging:'⌂',event:'✦',other:'•'};
  return glyph[category];
}

export function reservationIcon(type:ReservationType){
  if(type==='Hotel')return <span aria-hidden="true">⌂</span>;
  if(type==='Flight')return <span aria-hidden="true">✈</span>;
  return <CalendarCheck2 size={17} aria-hidden="true"/>;
}

export function displayTime(value:string){
  const [hour,minute]=value.split(':').map(Number);
  if(!Number.isInteger(hour)||!Number.isInteger(minute)||hour<0||hour>23||minute<0||minute>59)return 'Time TBD';
  return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:'UTC'}).format(new Date(Date.UTC(2026,0,1,hour,minute)));
}

export function relativeDate(value:string){
  const timestamp=Date.parse(value);
  if(!Number.isFinite(timestamp))return 'recently';
  const days=Math.floor((Date.now()-timestamp)/86_400_000);
  if(days<=0)return 'today';
  if(days===1)return 'yesterday';
  if(days<7)return `${days} days ago`;
  return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(timestamp));
}

export function splitLabel(expense:Expense,trip:Trip){
  if(expense.splitMode==='personal')return `Personal · ${memberName(trip,expense.participantIds[0]??'')}`;
  if(expense.splitMode==='custom')return `Custom split · ${expense.participantIds.length} traveler${expense.participantIds.length===1?'':'s'}`;
  return `Split equally · ${expense.participantIds.length} traveler${expense.participantIds.length===1?'':'s'}`;
}

export function safeDateRange(trip:Trip){
  return `${dateLabel(trip.startDate,{month:'short',day:'numeric'})} – ${dateLabel(trip.endDate,{month:'short',day:'numeric',year:'numeric'})}`;
}

export function Modal({onClose,children,label='Wanderline dialog'}:{onClose:()=>void;children:ReactNode;label?:string}){
  const dialogRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const dialog=dialogRef.current;
    if(!dialog)return;
    const focusables=()=>[...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(element=>!element.hasAttribute('hidden'));
    const first=focusables()[0];
    window.setTimeout(()=>first?.focus(),0);
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onClose();return}
      if(event.key!=='Tab')return;
      const items=focusables();
      if(items.length===0){event.preventDefault();return}
      const active=document.activeElement;
      const index=items.indexOf(active as HTMLElement);
      if(event.shiftKey&&(index<=0)){event.preventDefault();items.at(-1)?.focus()}
      else if(!event.shiftKey&&(index===items.length-1||index===-1)){event.preventDefault();items[0].focus()}
    };
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('keydown',onKey);previous?.focus()};
  },[onClose]);

  return <div className="wl-overlay" onMouseDown={onClose}><div ref={dialogRef} className="wl-modal" role="dialog" aria-modal="true" aria-label={label} onMouseDown={event=>event.stopPropagation()}><button className="wl-modal-close" onClick={onClose} aria-label="Close dialog"><X/></button>{children}</div></div>;
}

export function FormTitle({icon,title,text}:{icon:ReactNode;title:string;text:string}){
  return <div className="wl-form-title"><span>{icon}</span><div><h2>{title}</h2><p>{text}</p></div></div>;
}

export function BudgetSummary({budget,spent}:{budget:number;spent:number}){
  const remaining=budget-spent;
  return <span className={remaining<0?'wl-over-budget':''}>{remaining<0?`${money(Math.abs(remaining))} over`:`${money(remaining)} left`}</span>;
}
