import {Component,type ErrorInfo,type ReactNode} from 'react';

type Props={children:ReactNode};
type State={failed:boolean};

const resetLocalData=()=>{
  try{localStorage.removeItem('wanderline-v1')}catch{}
  window.location.reload();
};

export default class ErrorBoundary extends Component<Props,State>{
  state:State={failed:false};
  static getDerivedStateFromError():State{return {failed:true}}
  componentDidCatch(error:Error,info:ErrorInfo){console.error('Wanderline UI error',error,info)}
  render(){
    if(!this.state.failed)return this.props.children;
    return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:'24px',background:'#f2efe6',color:'#272822',fontFamily:'Inter,system-ui,sans-serif'}}><section style={{maxWidth:'540px',textAlign:'center'}}><div style={{fontSize:'40px',marginBottom:'14px'}}>↗</div><h1 style={{margin:'0 0 10px'}}>Wanderline hit a detour.</h1><p style={{opacity:.72,lineHeight:1.6}}>Reload first. If damaged browser data is causing the failure, reset only Wanderline’s local demo trip and reopen a clean itinerary.</p><div style={{display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap',marginTop:'14px'}}><button onClick={()=>window.location.reload()} style={{border:0,borderRadius:'10px',padding:'11px 16px',fontWeight:700,cursor:'pointer',background:'#26352e',color:'#fff'}}>Reload Wanderline</button><button onClick={resetLocalData} style={{border:'1px solid #b9b4a9',borderRadius:'10px',padding:'11px 16px',fontWeight:700,cursor:'pointer',background:'transparent',color:'#272822'}}>Reset local demo data</button></div></section></main>;
  }
}
