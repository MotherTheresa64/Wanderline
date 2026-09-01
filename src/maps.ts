function cleanQuery(value:string){return value.trim()}

export function googleMapsSearch(query:string){
  const clean=cleanQuery(query);
  return clean?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean)}`:'';
}

export function googleMapsDirections(destination:string,origin?:string){
  const cleanDestination=cleanQuery(destination);
  if(!cleanDestination)return '';
  const cleanOrigin=cleanQuery(origin??'');
  const originPart=cleanOrigin?`&origin=${encodeURIComponent(cleanOrigin)}`:'';
  return `https://www.google.com/maps/dir/?api=1${originPart}&destination=${encodeURIComponent(cleanDestination)}&travelmode=walking`;
}

export function openGoogleMaps(query:string,mode:'search'|'directions'='search',origin?:string){
  const url=mode==='directions'?googleMapsDirections(query,origin):googleMapsSearch(query);
  if(!url)return false;
  window.open(url,'_blank','noopener,noreferrer');
  return true;
}
