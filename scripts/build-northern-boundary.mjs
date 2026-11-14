// Build-time geometry tool only. Does not read/import observations or change Ajloun.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(new URL('../.checkpoints/jordan-geometry-tools/package.json',import.meta.url));
const clipping=require('polygon-clipping');
const raw=fs.readFileSync('public/jordan-adm1.geojson');
const collection=JSON.parse(raw);
const names=['Irbid','Ajloun','Jerash','Mafraq'];
const members=names.map(name=>{const found=collection.features.filter(f=>f.properties.shapeName===name);if(found.length!==1||found[0].properties.shapeType!=='ADM1'||found[0].properties.shapeGroup!=='JOR')throw Error('Boundary identity mismatch');return found[0];});
if(collection.crs.properties.name!=='urn:ogc:def:crs:OGC:1.3:CRS84')throw Error('Unexpected CRS');
const polygons=members.map(f=>f.geometry.coordinates);
const coordinates=clipping.union(...polygons);
for(const polygon of coordinates)for(const ring of polygon){if(ring.length<4||JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1))||ring.some(p=>p.length!==2||!p.every(Number.isFinite)))throw Error('Invalid union ring');}
for(const polygon of polygons)if(clipping.difference(polygon,coordinates).length)throw Error('Union omitted member area');
const feature={type:'Feature',properties:{name:'Northern Jordan',members:names,source:'geoBoundaries JOR-ADM1-50493656',sourceURL:'https://www.geoboundaries.org/api/current/gbOpen/JOR/ADM1/',pinnedSource:'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/JOR/ADM1/geoBoundaries-JOR-ADM1.geojson',boundaryYear:2006,license:'CC BY 2.5',sourceSHA256:createHash('sha256').update(raw).digest('hex'),method:'polygon-clipping 0.15.7 union of existing ADM1 coordinates; no simplification',crs:'OGC:CRS84'},geometry:{type:'MultiPolygon',coordinates}};
fs.writeFileSync('public/northern-jordan.geojson',JSON.stringify({type:'FeatureCollection',features:[feature]}));
console.log('Validated union:',coordinates.length,'components; original Ajloun unchanged.');
