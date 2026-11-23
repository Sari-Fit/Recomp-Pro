'use strict';
function defState(){return{v:1,
profile:{sex:'ذكر',age:25,height:182,startWeight:110,targetMin:90,targetMax:95,goal:'Body Recomposition',level:'مبتدئ إلى متوسط',kcal:2600,protein:180,fat:80,carbs:290,startDate:today(),lang:'ar'},
settings:{restSec:90,restAuto:true,notif:{on:false,train:{on:true,t:'17:00'},weight:{on:true,t:'08:00'},food:{on:true,t:'21:00'},sleep:{on:false,t:'23:00'},weekly:{on:true,t:'20:00'}}},
ex:Object.fromEntries(EX0.map(e=>[e.id,{...e,steps:[...e.steps],errs:[...e.errs]}])),
tpl:JSON.parse(JSON.stringify(TPL0)),schedule:SCHED0.slice(),archive:{},sessions:[],body:[],photos:[],
foods:FOODS0.map(f=>({...f})),food:{},fired:{},lastReport:null,lastBackup:null}}
function mergeDefaults(s){const d=defState();for(const k in d)if(s[k]===undefined)s[k]=d[k];s.profile={...d.profile,...s.profile};const n0=d.settings.notif,n1=(s.settings&&s.settings.notif)||{};s.settings={...d.settings,...s.settings};const n={on:!!n1.on};for(const k in n0)if(k!=='on')n[k]={...n0[k],...(n1[k]||{})};s.settings.notif=n;for(const id in d.ex)if(!s.ex[id])s.ex[id]=d.ex[id];return s}
function load(){let raw=null;try{raw=localStorage.getItem(KEY)}catch(e){}if(!raw)return defState();try{return mergeDefaults(JSON.parse(raw))}catch(e){try{localStorage.setItem(KEY+'_corrupt_'+Date.now(),raw)}catch(_){}setTimeout(()=>toast('تعذرت قراءة البيانات؛ حُفظت نسخة منها وبدأ التطبيق من جديد','err'),600);return defState()}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){toast('تعذر الحفظ: مساحة التخزين ممتلئة. صدّر نسخة احتياطية.','err');return false}}
let state;
const idb={db:null,
open(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('no idb'));const r=indexedDB.open('recomp_pro',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>{this.db=r.result;res()};r.onerror=()=>rej(r.error)})},
tx(mode,fn){return new Promise((res,rej)=>{if(!this.db)return rej(new Error('storage unavailable'));const t=this.db.transaction('files',mode);const q=fn(t.objectStore('files'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})},
get(k){return this.tx('readonly',s=>s.get(k))},set(k,v){return this.tx('readwrite',s=>s.put(v,k))},del(k){return this.tx('readwrite',s=>s.delete(k))},clear(){return this.tx('readwrite',s=>s.clear())},
async all(){const keys=await this.tx('readonly',s=>s.getAllKeys());const o={};for(const k of keys)o[k]=await this.get(k);return o}};
const sessFor=slot=>state.sessions.find(s=>s.slot===slot);
function schedFor(date){const a=state.archive[weekStart(date)];const sch=(a&&a.schedule)||state.schedule;return sch[(parseD(date).getDay()+6)%7]||null}
function slotStatus(date){const t=schedFor(date);if(!t)return'rest';if(date<state.profile.startDate)return'pre';const s=sessFor(date);if(s&&s.status==='done')return'done';if(date<today())return'missed';if(s&&s.status==='progress')return'progress';return'up'}
function closeWeeks(){const cur=weekStart(today());let w=weekStart(state.profile.startDate),n=0;while(w<cur&&n<1000){if(!state.archive[w])state.archive[w]={schedule:state.schedule.slice(),closedAt:new Date().toISOString()};w=addDays(w,7);n++}}
function weekStats(ws){let scheduled=0,done=0,missed=0;const days=[];for(let i=0;i<7;i++){const d=addDays(ws,i),t=schedFor(d),st=slotStatus(d);if(t&&st!=='pre'){scheduled++;if(st==='done')done++;if(st==='missed')missed++}days.push({d,t,st})}return{ws,days,scheduled,done,missed,pct:scheduled?Math.round(done/scheduled*100):0}}
function allWeeks(){const out=[];let w=weekStart(state.profile.startDate),n=0;const cur=weekStart(today());while(w<=cur&&n<1000){out.push(w);w=addDays(w,7);n++}return out}
function totals(){const weeks=allWeeks().map(weekStats);let missed=0,best=null,run=0,longest=0;weeks.forEach((w,i)=>{missed+=w.missed;if(!w.scheduled)return;if(!best||w.pct>=best.pct)best=w;if(w.pct===100){run++;longest=Math.max(longest,run)}else if(i!==weeks.length-1)run=0});const D=state.sessions.filter(s=>s.status==='done');return{done:D.length,missed,best,cur:run,longest,days:new Set(D.map(s=>ymd(new Date(s.finishedAt)))).size}}
function monthStats(){const out={};let d=state.profile.startDate,n=0;const t=parseD(today());const end=ymd(new Date(t.getFullYear(),t.getMonth()+1,0));while(d<=end&&n<5000){const st=slotStatus(d);if(st!=='rest'&&st!=='pre'){const m=d.slice(0,7);out[m]=out[m]||{m,sch:0,done:0,missed:0};out[m].sch++;if(st==='done')out[m].done++;if(st==='missed')out[m].missed++}d=addDays(d,1);n++}return Object.values(out)}
function nextSession(){const t=today();for(let i=0;i<14;i++){const d=addDays(t,i),st=slotStatus(d);if(st==='up'||st==='progress')return{d,st,name:state.tpl[schedFor(d)].name}}return null}
