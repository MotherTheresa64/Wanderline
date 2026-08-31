export function googleMapsSearch(query:string){
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapsDirections(destination:string){
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}

export function openGoogleMaps(query:string,mode:'search'|'directions'='search'){
  const url=mode==='directions'?googleMapsDirections(query):googleMapsSearch(query);
  window.open(url,'_blank','noopener,noreferrer');
}
