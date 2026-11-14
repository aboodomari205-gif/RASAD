import{describeObservedPeriods}from'./observedPeriods.ts';
import type{Dataset}from'./model.ts';
import type{historicalSummary}from'./historySummary.ts';
/** Common target is a vector of delivered counts and conditional references, never a sum of equivalent fires. */
export function calendarComparison(summary:ReturnType<typeof historicalSummary>,datasets:readonly Dataset[],period:string,minimumReferenceYears=3){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw new RangeError('Invalid UTC comparison month');
 const history=describeObservedPeriods(summary,datasets,{minimumReferenceYears});
 return {schema:'firepulse.calendar-comparison/v1',region:summary.region,period,target:'Exact-source delivered monthly counts with prior same-calendar-month references',coverage:'unknown',sensorIndependentActivity:null,sensorAttributedChange:null,calibrated:false,parameters:history.parameters,inputSummarySHA256:history.inputSummarySHA256,limitations:history.limitations,
 rows:history.strata.map(s=>{const p=s.periods.find(p=>p.period===period);const years=new Map<string,number>();for(const m of s.periods)years.set(m.period.slice(0,4),(years.get(m.period.slice(0,4))??0)+m.count);const highest=Math.max(...years.values());return {key:s.key,datasetId:s.datasetId,source:s.source,sensor:s.sensor,platform:s.platform,product:s.product,version:s.version,processing:s.processing,confidenceScheme:s.confidenceScheme,count:p?.count??null,status:p?.status??'unknown-period',reference:p?.reference??[],referenceCount:p?.referenceCount??null,referenceMedian:p?.referenceMedian??null,differenceFromReferenceMedian:p?.differenceFromReferenceMedian??null,missingPriorYears:p?.unrepresentedPriorYears??null,peakRank:p?.criticalRank??null,observedMonthDenominator:s.observedMonthCount,peakYears:s.eligible?[...years].filter(([,count])=>count===highest).map(([year,count])=>({year,count})):[],peakPeriods:s.eligible?s.periods.filter(p=>p.criticalRank===1).map(p=>({period:p.period,count:p.count})):[]};})};
}
