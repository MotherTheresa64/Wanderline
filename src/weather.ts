import {useEffect,useState} from 'react';

type WeatherState={temperature:number|null;label:string;loading:boolean;resolvedPlace:string};
type GeoResult={name:string;admin1?:string;country?:string;country_code?:string;latitude:number;longitude:number};
type GeoResponse={results?:GeoResult[]};
type ForecastResponse={current?:{temperature_2m?:number;weather_code?:number}};
type CachedWeather={expires:number;state:WeatherState};

const CACHE_TTL_MS=10*60*1000;
const weatherCache=new Map<string,CachedWeather>();

function weatherLabel(code:number|undefined){
  if(code===0)return 'Clear';
  if(code===1||code===2)return 'Mostly clear';
  if(code===3)return 'Cloudy';
  if(code===45||code===48)return 'Foggy';
  if(code!==undefined&&code>=51&&code<=67)return 'Rain';
  if(code!==undefined&&code>=71&&code<=77)return 'Snow';
  if(code!==undefined&&code>=80&&code<=82)return 'Showers';
  if(code!==undefined&&code>=95)return 'Storms';
  return 'Current weather';
}

function normalize(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,' ')}

function chooseGeocode(destination:string,results:GeoResult[]){
  const target=normalize(destination);
  const terms=target.split(' ').filter(term=>term.length>1);
  return [...results].sort((a,b)=>score(b)-score(a))[0];

  function score(result:GeoResult){
    const haystack=normalize([result.name,result.admin1,result.country,result.country_code].filter(Boolean).join(' '));
    return terms.reduce((total,term)=>total+(haystack.includes(term)?1:0),0)+(target.startsWith(normalize(result.name))?2:0);
  }
}

export function useDestinationWeather(destination:string):WeatherState{
  const key=normalize(destination);
  const [state,setState]=useState<WeatherState>({temperature:null,label:'Weather unavailable',loading:Boolean(key),resolvedPlace:''});

  useEffect(()=>{
    const controller=new AbortController();
    if(!key){setState({temperature:null,label:'Weather unavailable',loading:false,resolvedPlace:''});return()=>controller.abort()}
    const cached=weatherCache.get(key);
    if(cached&&cached.expires>Date.now()){
      setState(cached.state);
      return()=>controller.abort();
    }

    const run=async()=>{
      setState({temperature:null,label:'Loading weather…',loading:true,resolvedPlace:''});
      try{
        const primary=destination.split(',')[0]?.trim()||destination.trim();
        const geoResponse=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(primary)}&count=5&language=en&format=json`,{signal:controller.signal});
        if(!geoResponse.ok)throw new Error('geocoding failed');
        const geo=await geoResponse.json() as GeoResponse;
        const first=chooseGeocode(destination,geo.results??[]);
        if(!first)throw new Error('destination not found');
        const weatherResponse=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${first.latitude}&longitude=${first.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,{signal:controller.signal});
        if(!weatherResponse.ok)throw new Error('weather failed');
        const weather=await weatherResponse.json() as ForecastResponse;
        const temperature=weather.current?.temperature_2m;
        const next:WeatherState={
          temperature:typeof temperature==='number'?Math.round(temperature):null,
          label:weatherLabel(weather.current?.weather_code),
          loading:false,
          resolvedPlace:[first.name,first.admin1,first.country].filter(Boolean).join(', ')
        };
        weatherCache.set(key,{expires:Date.now()+CACHE_TTL_MS,state:next});
        setState(next);
      }catch(error){
        if((error as Error).name==='AbortError')return;
        setState({temperature:null,label:'Weather unavailable',loading:false,resolvedPlace:''});
      }
    };
    void run();
    return()=>controller.abort();
  },[destination,key]);

  return state;
}
