import{validUTCDate}from'./observations.ts';
/** Finite observed-date sequence. Never interpolates missing days or loops. */
export function nextObservedDate(dates:readonly string[],selected:string):string|null{
 if(dates.some((d,i)=>!validUTCDate(d)||(i>0&&d<=dates[i-1])))throw new RangeError('Observed dates must be unique sorted UTC dates');
 if(!dates.length)return null;
 const index=dates.indexOf(selected);return index<0?dates[0]:dates[index+1]??null;
}
