import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveActivation, clearObservationFilters } from '../shared/activation.ts';
import type { ObservationCollection } from '../shared/model.ts';
const collection: ObservationCollection={type:'FeatureCollection',metadata:{mode:'ajloun',datasets:[{id:'archive',title:'SYNTHETIC ONLY',source:'SYNTHETIC',regionId:'ajloun',kind:'archive'}]},features:[{type:'Feature',geometry:{type:'Point',coordinates:[35.7,32.3]},properties:{date:'2025-10-18'}},{type:'Feature',geometry:{type:'Point',coordinates:[35.7,32.3]},properties:{date:'2020-08-02'}}]};
test('archive activation migrates stale dates and hidden filters once, without overriding intentional subsequent scopes',()=>{
 const patch=archiveActivation(collection,{region:'ajloun',startDate:'2012-12-21',endDate:'2012-12-21',frpMin:999,sensor:'MODIS'});
 assert.ok(patch);assert.equal(patch.startDate,'2020-08-02');assert.equal(patch.endDate,'2025-10-18');assert.equal(patch.frpMin,undefined);assert.equal(patch.sensor,'all');assert.equal(patch.calendarMonth,'2025-10');
 assert.equal(archiveActivation(collection,{region:'ajloun',...patch,startDate:'2024-01-01'}),null);
 assert.equal(archiveActivation(collection,{region:'northern-jordan'}),null);
 assert.equal(archiveActivation({...collection,features:[]},{region:'ajloun'}),null);
 assert.equal(clearObservationFilters.frpMax,undefined);assert.equal(clearObservationFilters.datasetIds,undefined);
});
