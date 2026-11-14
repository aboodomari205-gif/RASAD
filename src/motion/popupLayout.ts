import type {Map,Popup}from'maplibre-gl';
/** Native popup remains linked to the same observation; when it cannot fit,
 * pin its readable box inside the actual workspace and hide the displaced tip. */
export function constrainObservationPopup(map:Map,popup:Popup){
 const root=map.getContainer().closest('.atlas-screen');if(!root)return;
 let frame=0,closed=false,pinned=false;
 const sync=()=>{frame=0;if(closed)return;const element=popup.getElement(),content=element.querySelector<HTMLElement>('.maplibregl-popup-content');if(!content)return;
  const header=root.querySelector('.atlas-masthead')?.getBoundingClientRect(),timeline=root.querySelector('.atlas-timeline')?.getBoundingClientRect(),style=root.querySelector('.atlas-imagery')?.getBoundingClientRect(),tools=root.querySelector('.atlas-tool-spine')?.getBoundingClientRect(),bounds=root.getBoundingClientRect(),container=map.getContainer().getBoundingClientRect();
  const left=Math.max(bounds.left+8,(tools?.right??bounds.left)+8),right=bounds.right-8,top=(header?.bottom??bounds.top)+8,bottom=Math.min(timeline?.top??bounds.bottom,style?.top??bounds.bottom)-8;
  element.style.width=Math.max(120,Math.min(300,right-left))+'px';content.style.boxSizing='border-box';content.style.maxHeight=Math.max(60,bottom-top)+'px';content.style.overflowY='auto';
  const r=content.getBoundingClientRect();if(r.left<left||r.right>right||r.top<top||r.bottom>bottom)pinned=true;
  if(pinned){element.dataset.viewportPinned='true';element.style.setProperty('--fp-popup-left',Math.max(left,Math.min(r.left,right-r.width))-container.left+'px');element.style.setProperty('--fp-popup-top',Math.max(top,Math.min(r.top,bottom-r.height))-container.top+'px');}
 };
 const schedule=()=>{if(!closed&&!frame)frame=requestAnimationFrame(sync);};
 const resize=new ResizeObserver(schedule);for(const element of [root,root.querySelector('.atlas-masthead'),root.querySelector('.atlas-timeline'),root.querySelector('.atlas-imagery')])if(element)resize.observe(element);
 const mutation=new MutationObserver(schedule);mutation.observe(popup.getElement(),{childList:true,subtree:true});map.on('moveend',schedule);map.on('resize',schedule);schedule();
 popup.on('close',()=>{closed=true;if(frame)cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();map.off('moveend',schedule);map.off('resize',schedule);});
}
