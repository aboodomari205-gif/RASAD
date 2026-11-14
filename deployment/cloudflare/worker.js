import {registerObservations} from '../../server/observations.js';
const routes=new Map();
registerObservations({get(paths,handler){for(const p of Array.isArray(paths)?paths:[paths])routes.set(p,handler);}});
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(request.method!=='GET')return Response.json({error:'Read-only archive snapshot'},{status:405});
 if(url.pathname==='/api/health')return Response.json({status:'ok',project:'FIREPULSE',schemaVersion:'firepulse.observations/v1',archiveStorage:'immutable-archive-snapshot',live:false});
 if(url.pathname==='/api/hotspots')return Response.json({error:'Live NASA requests are not enabled in this archive snapshot deployment.'},{status:503});
 const handler=routes.get(url.pathname);
 if(!handler)return Response.json({error:'Not found'},{status:404});
 const query={};for(const [k,v]of url.searchParams){if(Object.hasOwn(query,k))return Response.json({error:'Duplicate query parameter'},{status:400});query[k]=v;}
 let status=200;let response;
 const res={status(code){status=code;return this;},json(body){response=Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-FIREPULSE-Data-Mode':'archive-snapshot'}});return response;}};
 try{handler({query},res);return response??Response.json({error:'Invalid response'},{status:500});}catch{return Response.json({error:'Archive request failed'},{status:503});}
}};
