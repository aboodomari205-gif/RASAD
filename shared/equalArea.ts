/** Spherical cylindrical equal-area projection. Authalic Earth radius (metres),
 * standard parallel 30 degrees. Equal area on this declared sphere, not a WGS84
 * ellipsoidal distance model; cell labels are exploratory, never burned area.
 */
export const GRID_METHOD={name:'Spherical cylindrical equal area',radiusM:6371007.1809,standardParallel:30,origin:[0,0],units:'metres',earthModel:'authalic sphere',sizesM:[1000,2000,5000]} as const;
export function equalAreaPoint(lon:number,lat:number):[number,number]{
 if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lon)>180||Math.abs(lat)>90)throw new RangeError('Invalid WGS84 coordinate');
 const radians=Math.PI/180,c=Math.cos(Math.PI/6),r=GRID_METHOD.radiusM;
 return [r*lon*radians*c,r*Math.sin(lat*radians)/c];
}
export function equalAreaCell(lon:number,lat:number,sizeM:number){
 if(!GRID_METHOD.sizesM.some(size=>size===sizeM))throw new RangeError('Grid size must be 1000, 2000 or 5000 metres');
 const [x,y]=equalAreaPoint(lon,lat);return `${Math.floor(x/sizeM)}:${Math.floor(y/sizeM)}`;
}
