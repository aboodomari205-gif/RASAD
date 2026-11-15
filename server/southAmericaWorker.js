import {parentPort,workerData} from 'node:worker_threads';
import {southGrid,southPilot,southHarmonization} from './southAmerica.js';
try{parentPort.postMessage({value:workerData.query.task==='harmonization'?southHarmonization(workerData.query):workerData.query.task==='pilot'?southPilot(workerData.query):southGrid(workerData.query)});}
catch(error){parentPort.postMessage({error:error instanceof RangeError?error.message:'Grid evidence unavailable',invalid:error instanceof RangeError});}
