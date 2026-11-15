"""Delivery-date diagnostics from parsed acquisition columns, never filenames."""
import datetime as dt
import re

def delivery_gaps(raw):
    names=('MOIDS.zip','viirs.zip','viirs1.zip')
    all_dates=sorted({date for row in raw['members'] if row['file'] in names for date in row['availableDates']})
    first,last=map(dt.date.fromisoformat,(all_dates[0],all_dates[-1]))
    span=[(first+dt.timedelta(days=i)).isoformat() for i in range((last-first).days+1)]
    result={}
    for name in names:
        rows=[row for row in raw['members'] if row['file']==name]
        available=sorted({date for row in rows for date in row['availableDates']})
        mismatches=[]
        for row in rows:
            match=re.search(r'_(20\d{5})(?:\s*\(\d+\))?\.(?:txt|csv)$',row['member'],re.I)
            if match:
                encoded=dt.datetime.strptime(match.group(1),'%Y%j').date().isoformat()
                if row['availableDates']!=[encoded]:mismatches.append({'member':row['member'],'filenameDate':encoded,'actualAcquisitionDates':row['availableDates']})
        result[name]={'comparisonSpanUTC':[span[0],span[-1]],'availableAcquisitionDates':available,'datesWithoutSuppliedRecords':[day for day in span if day not in available],'filenameDateMismatches':mismatches,'meaning':'Dates are parsed from actual acquisition columns across supplied members. An absent positive-record date is not verified zero, a missing swath or proof of a missing physical file. The comparison span is the union of supplied daily-ZIP dates, not an assumed delivery contract.'}
    return result
