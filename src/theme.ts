type ThemeId='sunset'|'coast'|'terracotta'|'night';
type ThemeOption={id:ThemeId;label:string;description:string;colors:[string,string];browserColor:string};

const STORAGE_KEY='wanderline-theme-v1';
const DEFAULT_THEME:ThemeId='sunset';
const themes:ThemeOption[]=[
  {id:'sunset',label:'Sunset',description:'Dark Mediterranean green with coral warmth',colors:['#101817','#e17a59'],browserColor:'#101817'},
  {id:'coast',label:'Coast',description:'Deep ocean blue with sea-glass accents',colors:['#0f181c','#62aeb8'],browserColor:'#0f181c'},
  {id:'terracotta',label:'Terracotta',description:'Dark clay and olive with warm copper accents',colors:['#171411','#d9795d'],browserColor:'#171411'},
  {id:'night',label:'Night train',description:'Ink blue with warm station light',colors:['#11191e','#e5a76f'],browserColor:'#11191e'}
];

function isTheme(value:string|null):value is ThemeId{return themes.some(theme=>theme.id===value)}
function readTheme():ThemeId{try{const saved=localStorage.getItem(STORAGE_KEY);return isTheme(saved)?saved:DEFAULT_THEME}catch{return DEFAULT_THEME}}
function persistTheme(theme:ThemeId){try{localStorage.setItem(STORAGE_KEY,theme)}catch{/* Appearance still works for this session when storage is blocked. */}}
function setBrowserColor(color:string){let meta=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.append(meta)}meta.content=color}

function applyTheme(theme:ThemeId){
  const option=themes.find(item=>item.id===theme)??themes[0];
  document.documentElement.dataset.theme=option.id;
  document.documentElement.style.colorScheme='dark';
  setBrowserColor(option.browserColor);
  persistTheme(option.id);
  document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]').forEach(button=>{
    const active=button.dataset.themeChoice===option.id;
    button.setAttribute('aria-pressed',String(active));
    button.classList.toggle('active',active);
  });
  const label=document.querySelector<HTMLElement>('[data-current-theme]');
  if(label)label.textContent=option.label;
}

function createThemeControl(){
  if(document.querySelector('.theme-control'))return;
  const host=document.createElement('div');
  host.className='theme-control';
  host.innerHTML=`<button class="theme-toggle" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Choose appearance"><span class="theme-toggle-icon" aria-hidden="true">☼</span><span class="theme-toggle-copy"><b>Trip style</b><small data-current-theme></small></span><span aria-hidden="true">⌃</span></button><div class="theme-panel" role="dialog" aria-modal="true" aria-label="Choose Wanderline theme" hidden><div class="theme-panel-head"><div><b>Set the mood</b><small>Your trip style is saved on this device.</small></div><button class="theme-close" type="button" aria-label="Close theme picker">×</button></div><div class="theme-options"></div></div>`;
  const options=host.querySelector<HTMLElement>('.theme-options')!;
  const toggle=host.querySelector<HTMLButtonElement>('.theme-toggle')!;
  const panel=host.querySelector<HTMLElement>('.theme-panel')!;
  const closeButton=host.querySelector<HTMLButtonElement>('.theme-close')!;
  let returnFocus:HTMLElement|null=null;
  let hideTimer=0;

  const focusables=()=>[...panel.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
  const open=()=>{
    window.clearTimeout(hideTimer);
    returnFocus=document.activeElement instanceof HTMLElement?document.activeElement:toggle;
    panel.hidden=false;
    toggle.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>{
      panel.classList.add('open');
      panel.querySelector<HTMLButtonElement>('.theme-option.active')?.focus()??focusables()[0]?.focus();
    });
  };
  const close=(restore=true)=>{
    if(panel.hidden)return;
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    hideTimer=window.setTimeout(()=>{panel.hidden=true},160);
    if(restore)window.setTimeout(()=>returnFocus?.focus(),0);
  };

  themes.forEach(theme=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='theme-option';
    button.dataset.themeChoice=theme.id;
    button.setAttribute('aria-pressed','false');
    button.innerHTML=`<span class="theme-swatch" style="--swatch-a:${theme.colors[0]};--swatch-b:${theme.colors[1]}"></span><span><b>${theme.label}</b><small>${theme.description}</small></span><span class="theme-check" aria-hidden="true">✓</span>`;
    button.addEventListener('click',()=>{applyTheme(theme.id);close()});
    options.append(button);
  });

  toggle.addEventListener('click',()=>panel.hidden?open():close());
  closeButton.addEventListener('click',()=>close());
  document.addEventListener('keydown',event=>{
    if(panel.hidden)return;
    if(event.key==='Escape'){event.preventDefault();close();return}
    if(event.key!=='Tab')return;
    const items=focusables();
    if(!items.length){event.preventDefault();return}
    const index=items.indexOf(document.activeElement as HTMLButtonElement);
    if(event.shiftKey&&index<=0){event.preventDefault();items.at(-1)?.focus()}
    else if(!event.shiftKey&&(index===items.length-1||index===-1)){event.preventDefault();items[0].focus()}
  });
  document.addEventListener('pointerdown',event=>{if(!panel.hidden&&!host.contains(event.target as Node))close(false)});
  document.body.append(host);
  applyTheme(readTheme());
}

export function initializeThemes(){
  applyTheme(readTheme());
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createThemeControl,{once:true});
  else queueMicrotask(createThemeControl);
}
