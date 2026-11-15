export function printEvidence(target:'research'|'pilot') {
 const previous=document.body.dataset.rasadPrint;
 document.body.dataset.rasadPrint=target;
 try{window.print();}finally{if(previous===undefined)delete document.body.dataset.rasadPrint;else document.body.dataset.rasadPrint=previous;}
}
