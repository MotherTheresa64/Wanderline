function replaceText(node:Node){
  if(node.nodeType===Node.TEXT_NODE){
    if(node.nodeValue?.includes('€'))node.nodeValue=node.nodeValue.replaceAll('€','$');
    return;
  }
  if(!(node instanceof Element))return;
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
  let current=walker.nextNode();
  while(current){if(current.nodeValue?.includes('€'))current.nodeValue=current.nodeValue.replaceAll('€','$');current=walker.nextNode()}
  for(const attribute of ['aria-label','title','placeholder']){
    if(node.hasAttribute(attribute)){const value=node.getAttribute(attribute);if(value?.includes('€'))node.setAttribute(attribute,value.replaceAll('€','$'))}
    node.querySelectorAll<HTMLElement>(`[${attribute}*="€"]`).forEach(element=>{const value=element.getAttribute(attribute);if(value)element.setAttribute(attribute,value.replaceAll('€','$'))});
  }
  node.querySelectorAll<SVGElement>('svg.lucide-euro').forEach(svg=>{
    const replacement=document.createElement('span');replacement.className='currency-icon';replacement.textContent='$';replacement.setAttribute('aria-hidden','true');svg.replaceWith(replacement);
  });
}

export function initializeUsdDisplay(){
  const normalize=()=>replaceText(document.body);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',normalize,{once:true});else queueMicrotask(normalize);
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='characterData'){replaceText(record.target);continue}
      record.addedNodes.forEach(replaceText);
    }
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}
