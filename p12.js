'use strict';
function download(name,text,mime){const b=new Blob([text],{type:mime}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast('تم تجهيز الملف: '+name)}
const stamp=()=>new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
const icsEsc=s=>String(s).replace(/[\\,;]/g,'\\$&');
function exportICS(){const t=(state.settings.notif.train.t||'17:00').split(':'),BY=['MO','TU','WE','TH','FR','SA','SU'];let s='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//RECOMP PRO//AR\r\nCALSCALE:GREGORIAN\r\n',n=0;state.schedule.forEach((tid,i)=>{if(!tid)return;let d=today();while((parseD(d).getDay()+6)%7!==i)d=addDays(d,1);n++;s+=`BEGIN:VEVENT\r\nUID:recomp-${tid}-${i}-${Date.now()}@recomp.pro\r\nDTSTAMP:${stamp()}\r\nDTSTART:${d.replace(/-/g,'')}T${t[0]}${t[1]}00\r\nDURATION:PT1H15M\r\nRRULE:FREQ=WEEKLY;BYDAY=${BY[i]}\r\nSUMMARY:${icsEsc(state.tpl[tid].name)} - RECOMP PRO\r\nBEGIN:VALARM\r\nTRIGGER:-PT30M\r\nACTION:DISPLAY\r\nDESCRIPTION:Training reminder\r\nEND:VALARM\r\nEND:VEVENT\r\n`});s+='END:VCALENDAR\r\n';if(!n)return toast('لا توجد أيام تدريب في الجدول','err');download('recomp-pro-training.ics',s,'text/calendar')}
const csvCell=v=>{v=String(v??'');return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
function exportCSV(m){const inM=d=>!m||d.startsWith(m),rows=[],add=(...a)=>rows.push(a.map(csvCell).join(','));
add('RECOMP PRO',m||'all data',new Date().toISOString());add();
add('SESSIONS');add('slot_date','workout','status','completed_at','duration_min','exercise','set','weight_kg','load_type','reps_or_sec','set_done','note');
state.sessions.filter(s=>inM(s.slot)).sort((a,b)=>a.slot<b.slot?-1:1).forEach(s=>{const dur=s.finishedAt?Math.round((new Date(s.finishedAt)-new Date(s.startedAt))/6e4):'';s.items.forEach(it=>{const e=state.ex[it.ex]||{};it.sets.forEach((x,j)=>add(s.slot,s.name,s.status,s.finishedAt||'',dur,e.en||it.ex,j+1,x.w,e.load||'',x.r,x.d?1:0,j===0?it.note:''))})});
add();add('WEEKLY ADHERENCE');add('week_start','scheduled','completed','missed','adherence_pct');allWeeks().filter(w=>!m||w.slice(0,7)===m||addDays(w,6).slice(0,7)===m).map(weekStats).forEach(w=>add(w.ws,w.scheduled,w.done,w.missed,w.pct));
add();add('BODY');add('date','weight_kg','waist_cm','chest_cm','arm_cm','thigh_cm');state.body.filter(b=>inM(b.d)).sort(byD).forEach(b=>add(b.d,b.w??'',b.waist??'',b.chest??'',b.arm??'',b.thigh??''));
add();add('NUTRITION DAILY');add('date','kcal','protein_g','fat_g','carbs_g','entries');Object.keys(state.food).filter(inM).sort().forEach(d=>{const t=dayTotals(d);if(t.n)add(d,Math.round(t.k),r1(t.p),r1(t.f),r1(t.c),t.n)});
download(`recomp-pro-${m||'all'}.csv`,'\ufeff'+rows.join('\r\n'),'text/csv;charset=utf-8')}
async function exportBackup(){let files={};try{files=await idb.all()}catch(e){}state.lastBackup=today();save();download(`recomp-pro-backup-${today()}.json`,JSON.stringify({app:'recomp_pro',v:1,exportedAt:new Date().toISOString(),state,files}),'application/json');render()}
function importBackup(inp){const f=inp.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{let o;try{o=JSON.parse(rd.result)}catch(e){return toast('ملف غير صالح','err')}if(o.app!=='recomp_pro'||!o.state)return toast('هذا ليس ملف نسخة احتياطية من RECOMP PRO','err');ask('الاستيراد سيستبدل كل البيانات الحالية على هذا الجهاز. متابعة؟','استيراد',async()=>{state=mergeDefaults(o.state);closeWeeks();save();try{await idb.clear();for(const k in(o.files||{}))await idb.set(k,o.files[k])}catch(e){toast('تم استيراد البيانات، لكن تعذر استيراد الصور','err')}toast('تم الاستيراد');render()},false)};rd.readAsText(f)}
function resetAll(){ask('حذف كل البيانات نهائياً؟ يُنصح بتصدير نسخة احتياطية أولاً.','متابعة',()=>ask('تأكيد أخير: لا يمكن التراجع عن الحذف.','حذف نهائي',async()=>{try{localStorage.removeItem(KEY)}catch(e){}await idb.clear().catch(()=>{});state=defState();save();toast('تمت إعادة الضبط');go('home')}))}
function runTests(){const S=state,TO=TODAY_OVERRIDE,R=[],ok=(n,c)=>R.push([n,!!c]);
try{TODAY_OVERRIDE='2026-11-12';state=defState();state.profile.startDate='2026-11-02';
const mk=(slot,st,fin)=>{const s={id:uid(),slot,tpl:schedFor(slot),name:'',status:st,startedAt:slot+'T10:00:00',finishedAt:st==='done'?(fin||slot+'T11:00:00'):null,items:[]};state.sessions.push(s);return s};
ok('بداية الأسبوع يوم الاثنين',weekStart('2026-11-08')==='2026-11-02'&&weekStart('2026-11-02')==='2026-11-02');
['2026-11-02','2026-11-03','2026-11-05','2026-11-06'].forEach(d=>mk(d,'done'));
let w=weekStats('2026-11-02');ok('4 مكتملة = 100%، و4 مجدولة فقط (أيام الراحة لا تُحتسب)',w.pct===100&&w.scheduled===4&&w.missed===0);
state.sessions.pop();w=weekStats('2026-11-02');ok('3 مكتملة = 75% مع حصة فائتة واحدة',w.pct===75&&w.missed===1);
state.sessions.pop();w=weekStats('2026-11-02');ok('2 مكتملتان = 50%',w.pct===50);
mk('2026-11-09','done');w=weekStats('2026-11-09');
ok('يوم تدريب ماضٍ بلا حصة = فائتة',slotStatus('2026-11-10')==='missed');
ok('يوم الراحة = راحة',slotStatus('2026-11-11')==='rest');
ok('حصة اليوم دون تسجيل = قادمة وليست فائتة',slotStatus('2026-11-12')==='up');
ok('الأسبوع الجاري 1 من 4 = 25%',w.pct===25&&w.done===1&&w.missed===1);
const pr=mk('2026-11-10','progress');ok('حصة مفتوحة لم تُنهَ في يوم ماضٍ = فائتة',slotStatus('2026-11-10')==='missed');
pr.status='done';pr.finishedAt='2026-11-12T19:00:00';w=weekStats('2026-11-09');
ok('الاستدراك يُحتسب مكتملاً مع حفظ تاريخ الإنجاز الحقيقي',slotStatus('2026-11-10')==='done'&&w.pct===50&&pr.finishedAt.startsWith('2026-11-12'));
mk('2026-11-12','progress');ok('حصة اليوم المفتوحة = قيد التنفيذ',slotStatus('2026-11-12')==='progress');
closeWeeks();state.schedule=[null,null,null,null,null,null,null];ok('الأسبوع المغلق يحتفظ بجدوله بعد تغيير الجدول',weekStats('2026-11-02').scheduled===4);
state.schedule=SCHED0.slice();state.archive={};state.profile.startDate='2026-11-04';ok('الأيام قبل تاريخ البداية لا تُحتسب',weekStats('2026-11-02').scheduled===2);
state=defState();state.profile.startDate='2026-11-02';const it=r=>({ex:'bench',min:8,max:10,sets:[{w:'50',r,d:true},{w:'50',r,d:true},{w:'50',r:'10',d:true}],note:''});
state.sessions=[{id:'a',slot:'2026-11-02',tpl:'UA',name:'',status:'done',startedAt:'2026-11-02T10:00:00',finishedAt:'2026-11-02T11:00:00',items:[it('10')]}];
ok('اقتراح زيادة الوزن عند بلوغ الحد الأعلى في كل المجموعات',!!overload('bench'));
state.sessions[0].items[0].sets[1].r='9';ok('لا اقتراح إن لم تبلغ كل المجموعات الحد الأعلى',!overload('bench'));
ok('المغذيات الافتراضية = 2600 kcal',180*4+80*9+290*4===2600);
ok('1RM تقديري (Epley) لـ 100 × 10 = 133.3',e1rm({w:'100',r:'10'})===133.3);
}catch(e){R.push(['خطأ غير متوقع: '+e.message,false])}finally{state=S;TODAY_OVERRIDE=TO}
const pass=R.filter(x=>x[1]).length;openModal(`<h3>نتائج الفحص: ${pass}/${R.length} ${pass===R.length?'✓':''}</h3>${R.map(([n,c])=>`<div class="row" style="padding:6px 0;align-items:flex-start"><b class="${c?'acc':'red'}">${c?'✓':'✗'}</b><span class="sm">${esc(n)}</span></div>`).join('')}<div class="sm mut" style="margin-top:8px">الفحص يعمل على بيانات تجريبية معزولة ولا يغيّر بياناتك.</div><button class="btn blk" style="margin-top:12px" onclick="closeModal()">إغلاق</button>`)}
let lastRoute='';
function go(h){if(location.hash==='#'+h)render();else location.hash=h}
function render(){if(!state)return;const h=decodeURIComponent(location.hash.slice(1))||'home',[r,a,b]=h.split('/'),same=h===lastRoute,y=window.scrollY;lastRoute=h;
const V={home:vHome,workouts:vWorkouts,calendar:()=>vCalendar(a),progress:()=>vProgress(a,b),profile:vProfile,session:()=>vSession(a),ex:()=>vEx(a),tpl:()=>vTpl(a),report:()=>vReport(a)};
let html;try{html=(V[r]||vHome)()}catch(e){console.error(e);html=`<div class="card"><b class="red">حدث خطأ أثناء عرض الصفحة</b><div class="sm mut ltr">${esc(e.message)}</div><button class="btn" style="margin-top:10px" onclick="go('home')">الرئيسية</button></div>`}
const v=$('#view');v.innerHTML=html;if(!same){v.style.animation='none';void v.offsetHeight;v.style.animation='';window.scrollTo(0,0)}else window.scrollTo(0,y);
const tab={session:'workouts',ex:'workouts',tpl:'workouts',report:'progress'}[r]||(V[r]?r:'home');document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.t===tab));$('#hdrSub').textContent=fmtDL(today());hydrate();if($('#pa'))cmpPhotos()}
const ICONS={home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',workouts:'<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',progress:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'};
function drawNav(){$('#nav').innerHTML=[['home','الرئيسية'],['workouts','التمارين'],['calendar','التقويم'],['progress','التقدم'],['profile','الملف']].map(([k,l])=>`<button data-t="${k}" onclick="go('${k}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>${l}</button>`).join('')}
let lastDay='';
function dayCheck(){const d=today();if(d===lastDay)return;lastDay=d;closeWeeks();save();weeklyReportCheck();if(!document.querySelector('input:focus,textarea:focus'))render()}
window.addEventListener('hashchange',render);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state){dayCheck();if($('#timer').classList.contains('show'))tickRest()}});
(async function init(){try{await idb.open()}catch(e){console.warn('IndexedDB unavailable',e)}state=load();lastDay=today();closeWeeks();save();drawNav();render();weeklyReportCheck();setInterval(checkNotifs,30000);setInterval(dayCheck,60000);if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}})();
