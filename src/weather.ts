import {useEffect,useState} from 'react';

type WeatherState={temperature:number|null;label:string;loading:boolean};

type GeoResponse={results?:Array<{latitude:number;longitude:number}>};
type ForecastResponse={current?:{temperature_2m?:number;weather_code?:number}};

function weatherLabel(code:number|undefined){
  if(code===0)return 'Clear';
  if(code===1||code===2)return 'Mostly clear';
  if(code===3)return 'Cloudy';
  if(code===45||code===48)return 'Foggy';
  if(code!==undefined&&code>=51&&code<=67)return 'Rain';
  if(code!==undefined&&code>=71&&code<=77)return 'Snow';
  if(code!==undefined&&code>=80&&code<=82)return 'Showers';
  if(code!==undefined&&code>=95)return 'Storms';
  return 'Forecast';
}

export function useDestinationWeather(destination:string):WeatherState{
  const [state,setState]=useState<WeatherState>({temperature:null,label:'Weather unavailable',loading:true});
  useEffect(()=>{
    const controller=new AbortController();
    const run=async()=>{
      setState(current=>({...current,loading:true}));
      try{
        const place=destination.split(',')[0].trim();
        const geoResponse=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`,{signal:controller.signal});
        if(!geoResponse.ok)throw new Error('geocoding failed');
        const geo=await geoResponse.json() as GeoResponse;
        const first=geo.results?.[0];
        if(!first)throw new Error('destination not found');
        const weatherResponse=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${first.latitude}&longitude=${first.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,{signal:controller.signal});
        if(!weatherResponse.ok)throw new Error('weather failed');
        const weather=await weatherResponse.json() as ForecastResponse;
        const temperature=weather.current?.temperature_2m;
        setState({temperature:typeof temperature==='number'?Math.round(temperature):null,label:weatherLabel(weather.current?.weather_code),loading:false});
      }catch(error){
        if((error as Error).name==='AbortError')return;
        setState({temperature:null,label:'Weather unavailable',loading:false});
      }
    };
    void run();
    return()=>controller.abort();
  },[destination]);
  return state;
}
