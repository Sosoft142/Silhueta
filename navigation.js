/* Same-document history for Silhueta. Form values and credentials stay in the DOM. */
(()=>{'use strict';
const OWNER='silhueta.navigation.v1',LAYERS=new Set(['drawer','sync','editor']);
const id=()=>crypto.randomUUID();
window.createSilhuetaNavigation=function({captureScreen,normalizeScreen,applyRoute,mayLeave}){
 let current=null,moving=null,queued=null,applying=false,scrollTimer=0;const entries=new Map();
 const point=()=>({x:Math.max(0,scrollX),y:Math.max(0,scrollY)});
 function read(raw){
  if(raw?.owner!==OWNER||typeof raw.session!=='string'||typeof raw.key!=='string'||!Number.isInteger(raw.index)||raw.index<0)return null;
  return {owner:OWNER,session:raw.session,key:raw.key,index:raw.index,screen:normalizeScreen(raw.screen),layer:LAYERS.has(raw.layer)?raw.layer:null,scroll:{x:Math.max(0,Number(raw.scroll?.x)||0),y:Math.max(0,Number(raw.scroll?.y)||0)}};
 }
 function remember(){
  if(!current||applying||moving)return;
  current={...current,screen:normalizeScreen(captureScreen()),scroll:point()};entries.set(current.index,current);history.replaceState(current,'');
 }
 function display(route,options={}){
  current=route;applying=true;
  try{applyRoute(route,options);}finally{applying=false;}
  remember();
 }
 function flush(){const action=queued;queued=null;action?.();}
 function preview(route){applying=true;try{applyRoute(route,{preview:true});}finally{applying=false;}}
 function navigate(screen,{layer=null,replace=false,guard=true}={}){
  screen=normalizeScreen(screen);
  const next={...current,screen,layer};
  if(moving){queued=()=>navigate(screen,{layer,replace,guard});if(moving.kind==='close')preview({...next,scroll:layer?point():{x:0,y:0}});return;}
  if(current.layer&&!layer){close({skipGuard:!guard,after:()=>navigate(screen,{layer,replace,guard}),previewRoute:{...next,scroll:{x:0,y:0}}});return;}
  if(guard&&!mayLeave(current,next))return;
  if(current.layer===layer&&JSON.stringify(current.screen)===JSON.stringify(screen)){remember();return;}
  next.key=replace?current.key:id();next.index=current.index+(replace?0:1);next.scroll=layer?point():{x:0,y:0};
  if(!replace)for(const index of entries.keys())if(index>current.index)entries.delete(index);
  history[replace?'replaceState':'pushState'](next,'');display(next,{navigating:true});
 }
 function close({skipGuard=false,after=null,previewRoute=null}={}){
  if(moving){if(after)queued=after;return;}
  if(!current.layer){after?.();return;}
  if(current.index===0){const next={...current,layer:null};if(!skipGuard&&!mayLeave(current,next))return;history.replaceState(next,'');display(next);after?.();return;}
  const parent=entries.get(current.index-1)||{...current,layer:null};
  if(!skipGuard&&!mayLeave(current,parent))return;
  moving={kind:'close',from:current,skipGuard:true,after};preview(previewRoute||parent);history.back();
 }
 function pop(event){
  const target=read(event.state);if(!target||target.session!==current.session)return;
  if(moving?.kind==='restore'){
   if(target.key!==moving.from.key)return;
   current=moving.from;moving=null;flush();return;
  }
  const operation=moving,previous=current;moving=null;
  if(!operation?.skipGuard&&!mayLeave(previous,target)){
   queued=null;moving={kind:'restore',from:previous};history.go(previous.index-target.index);return;
  }
  if(operation?.kind==='close'&&(queued||operation.after))current=target;else display(target,{traversing:true});
  operation?.after?.();if(!moving)flush();
 }
 function start(){
  history.scrollRestoration='manual';
  const restored=read(history.state);
  current=restored||{owner:OWNER,session:id(),key:id(),index:0,screen:normalizeScreen(captureScreen()),layer:null,scroll:{x:0,y:0}};
  history.replaceState(current,'');window.addEventListener('popstate',pop);
  window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(remember,80);},{passive:true});
  display(current,{initial:true});
 }
 return {start,remember,navigate,open:(layer,screen=captureScreen())=>navigate(screen,{layer}),close,get layer(){return current?.layer;},get applying(){return applying;},get moving(){return !!moving;}};
};
})();
