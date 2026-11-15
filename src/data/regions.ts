import type {FeatureCollection} from 'geojson';
import type {RegionId} from '../../shared/model';
import {ACTIVE_REGIONS} from '../../shared/regions';
export async function regionBoundary(region:RegionId):Promise<FeatureCollection>{
 const response=await fetch('/south-america-countries.geojson');if(!response.ok)throw Error('Boundary unavailable');
 const collection:FeatureCollection=await response.json();
 const config=ACTIVE_REGIONS.find(r=>r.id===region);if(!config)throw Error('Unsupported region');
 return {...collection,features:collection.features.filter(f=>!config.country||f.properties?.id===config.country)};
}
