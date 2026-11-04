// Offline evidence audit. No network, source rewriting or telemetry scans.
// node paper/analyze.mjs --catalog /path/manifest.json --snapshots /path/captured-json-dir
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2);
const option=(name)=>args[args.indexOf(name)+1];
if(!args.includes('--catalog')||!args.includes('--snapshots'))throw Error('Provide --catalog and --snapshots paths to the dated cached inputs.');
const inputs=[];
function read(path){const bytes=readFileSync(path);const data=JSON.parse(bytes);inputs.push({file:path.split('/').at(-1),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});return data;}
const catalog=read(option('--catalog'));
const dir=option('--snapshots');
const health=read(resolve(dir,'fd_health.json'));
const sensors=read(resolve(dir,'fd_sensors_health.json'));
const province=read(resolve(dir,'fd_province_stations_code_80.json'));
const sources=read(resolve(dir,'fd_sources.json'));
const terms=['ท่วม','อุทกภัย','สาธารณภัย','ภัยพิบัติ','วาตภัย','ไฟป่า','หมอกควัน','ฝุ่น','PM','ระดับน้ำ','ภัยแล้ง','เผชิญเหตุ','ปริมาณน้ำฝน','น้ำขึ้นน้ำลง'];
const datasets=catalog.datasets;
const selected=datasets.filter(d=>terms.some(t=>(d.titleTh||d.title).toLowerCase().includes(t.toLowerCase())));
const countBy=(rows,key)=>rows.reduce((a,r)=>{const k=key(r);a[k]=(a[k]||0)+1;return a;},{});
const resources=datasets.flatMap(d=>d.resources);
const parse=(t)=>Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(t)?t:t+'Z');
const ages=datasets.map(d=>(parse(catalog.fetchedAt)-parse(d.updated))/86400000).filter(Number.isFinite).sort((a,b)=>a-b);
const median=ages.length%2?ages[(ages.length-1)/2]:(ages[ages.length/2-1]+ages[ages.length/2])/2;
const bounds=[30,90,180,365,730,1095,Infinity];
const bins=bounds.map((max,i)=>ages.filter(a=>a<=(max)&&a>(i?bounds[i-1]:-Infinity)).length);
const publishers=countBy(datasets,d=>d.orgName);
const provincialName=Object.entries(publishers).sort((a,b)=>b[1]-a[1])[0][0];
const provincial=datasets.filter(d=>d.orgName===provincialName);
const recent=(rows,min)=>rows.filter(r=>Number.isFinite(r.age_min)&&r.age_min>=-5&&r.age_min<=min).length;
const cutoff='d862847faa1e9e173200f726db7d80cde8299611';
const deployRuns=read('paper/deployment-runs-2026-11-04.json');
const auditBytes=readFileSync('audits/2026-10-23-operation-audit.md');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const result={
 schemaVersion:1, studyCutoff:'2026-11-04', inputs,
 catalog:{capturedAt:catalog.fetchedAt, timestampConvention:'CKAN timezone-less metadata interpreted as UTC; exact elapsed days at manifest capture',datasets:datasets.length,resources:resources.length,publishers:Object.keys(publishers).length,provincialPublisher:provincialName,provincialRecords:provincial.length,provincialDay24:provincial.filter(d=>d.updated.slice(8,10)==='24').length,retrieval:countBy(resources,r=>r.downloadStatus),medianMetadataAgeDays:median,ageBinUpperDays:bounds.map(n=>Number.isFinite(n)?n:null),ageBinCounts:bins,olderThanYear:ages.filter(a=>a>365).length,hazardTitleTerms:terms,hazardSelection:selected.map(d=>({id:d.id,title:d.titleTh||d.title})),hazardResources:countBy(selected.flatMap(d=>d.resources),r=>r.downloadStatus),limit:'Keyword-selected catalog metadata and partial downloads do not prove absence of services behind failed or skipped resources.'},
 registry:{capturedAt:health.data_as_of,recordCount:health.db.stations,retainedReadingRows:health.db.readings,hourlyRows:health.db.readings_hourly,storedRuleAlertRecords:health.db.alerts,healthCheckedAt:sensors.checked_at,healthServedAt:sensors.data_as_of,healthRecords:sensors.summary.total_stations,staleRecords:sensors.summary.stale,stalePercent:sensors.summary.stale/sensors.summary.total_stations*100,pipelines:sources.pipelines.length,limit:'Registry includes non-Thai/global series; row counts do not establish archive start, uniqueness of physical gauges, warning receipt or field outcomes.'},
 province:{generatedAt:province.generated_at,waterRecords:province.water.length,rainRecords:province.rain.length,waterRecent2h:recent(province.water,120),rainRecent2h:recent(province.rain,120),rainRecent6h:recent(province.rain,360),rainAgencyCodes:countBy(province.rain,r=>r.meta?.agency||'unknown'),limit:'One dated aggregated response; agency code plurality is not evidence of absent interoperability.'},
 auditChecks:{method:'Transcribed from dated operation-audit checks; not independently derived from continuous telemetry or issuance logs',sourceSha256:createHash('sha256').update(auditBytes).digest('hex'),date:'2026-10-26',timezone:'Asia/Bangkok',first:'05:48',later:'08:13',intervalMinutes:145,station:'STN2101',firstLevelM:4.25,alertReferenceM:4,firstObservationAgeMinutes:38,firstStatus:0,laterStatus:1,source:'audits/2026-10-23-operation-audit.md',limit:'Two audit checks do not establish crossing time, continuity, issuance time, other warning channels or human receipt.'},
 repository:{method:'Git ancestors at pinned cutoff plus captured deployment-workflow records',cutoffCommit:cutoff,commits:Number(git('rev-list','--count',cutoff)),distinctCommitDates:new Set(git('log',cutoff,'--format=%ad','--date=short').split('\n')).size,successfulDeploymentWorkflowRuns:deployRuns.filter(r=>r.conclusion==='success').length,firstCommit:git('log',cutoff,'--reverse','--format=%ad','--date=short').split('\n')[0],limit:'Workflow runs are not necessarily unique releases; current automatic gates do not prove all historical/manual releases were test gated.'}
};
const out=resolve('apps/web/public/research/evidence-v1.json');writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output:out,catalog:result.catalog.datasets,hazards:selected.length,median,bins,health:result.registry.healthRecords,province:result.province},null,2));
