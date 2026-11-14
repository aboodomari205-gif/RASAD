// Read-only native-file prescreen. Never imports observations or enables science.
import fs from'node:fs/promises';import{createReadStream}from'node:fs';import path from'node:path';import{createHash}from'node:crypto';import{fileURLToPath}from'node:url';
export async function verifyOpportunityFiles(directory,manifest){
 const root=path.resolve(directory);const files=[];
 for(const item of manifest.files){
  if(path.basename(item.filename)!==item.filename||!/^\w[\w.-]*\.(hdf|nc)$/.test(item.filename)||!['HDF4','HDF5'].includes(item.format))throw new RangeError('Unsafe or unsupported candidate filename/format');
  const target=path.join(root,item.filename);
  try{const info=await fs.lstat(target);if(!info.isFile()||info.isSymbolicLink())throw Error('Not a regular native file');const realRoot=await fs.realpath(root),real=await fs.realpath(target);if(!real.startsWith(realRoot+path.sep))throw Error('Outside input directory');
   const handle=await fs.open(target,'r');const header=Buffer.alloc(8);try{await handle.read(header,0,8,0);}finally{await handle.close();}
   const magic=item.format==='HDF4'?header.subarray(0,4).toString('hex')==='0e031301':header.toString('hex')==='894844460d0a1a0a';
   if(!magic){files.push({filename:item.filename,status:'rejected-native-signature',bytes:info.size,scientificallyValidated:false});continue;}
   const hash=createHash('sha256');for await(const chunk of createReadStream(target))hash.update(chunk);const sha256=hash.digest('hex');
   files.push({filename:item.filename,status:item.expectedSHA256&&item.expectedSHA256!==sha256?'rejected-checksum':'format-prescreen-only',bytes:info.size,sha256,providerChecksumVerified:typeof item.expectedSHA256==='string'&&item.expectedSHA256===sha256,scientificallyValidated:false});
  }catch(error){files.push({filename:item.filename,status:error.code==='ENOENT'?'missing':'rejected-read',scientificallyValidated:false});}
 }
 return{schema:'firepulse.opportunity-prescreen/v1',files,allPresentWithNativeSignature:files.length>0&&files.every(f=>f.status==='format-prescreen-only'),decoded:false,lineageVerified:false,polygonCoverage:null,sensitivityCalibration:null,anomaly:null,meaning:'Native signature and file hash are not product decoding, provider authentication or scientific acceptance.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const manifest=JSON.parse(await fs.readFile(new URL('../docs/OPPORTUNITY_INPUT_MANIFEST.json',import.meta.url),'utf8'));
 const result=await verifyOpportunityFiles(process.argv[2]??'.checkpoints/opportunity-inputs',manifest);console.log(JSON.stringify(result,null,2));if(!result.allPresentWithNativeSignature)process.exitCode=2;
}
