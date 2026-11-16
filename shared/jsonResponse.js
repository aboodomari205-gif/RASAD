/** Reject an HTML SPA fallback before any JSON parsing or checksum processing. */
export function requireJSONResponse(response,label='JSON data'){
 const type=response.headers.get('content-type')??'missing';
 if(!response.ok)throw Error(`${label}: HTTP ${response.status} (${type})`);
 if(!/^application\/(?:[\w.-]+\+)?json$/i.test(type.split(';')[0].trim()))throw Error(`${label}: expected application/json, received ${type} (HTTP ${response.status})`);
 return response;
}
export function readJSONResponse(response,label){return requireJSONResponse(response,label).json();}
