'use strict';
/* ========== أدوات عامة ========== */
const KEY='recomp_pro_v1',DAY=864e5;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:null};
const r1=n=>Math.round(n*10)/10;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
let TODAY_OVERRIDE=null;
const today=()=>TODAY_OVERRIDE||ymd(new Date());
const parseD=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return ymd(d)};
const weekStart=s=>{const d=parseD(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return ymd(d)};
const DAYS=['الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد'];
const SD=['ن','ث','ر','خ','ج','س','ح'];
const fmtD=s=>{const d=parseD(s);return d.getDate()+'/'+(d.getMonth()+1)};
const fmtDL=s=>DAYS[(parseD(s).getDay()+6)%7]+' '+fmtD(s);
const fmtT=iso=>{const d=new Date(iso);return pad(d.getHours())+':'+pad(d.getMinutes())};
const fmtDT=iso=>fmtD(ymd(new Date(iso)))+' '+fmtT(iso);
const byD=(a,b)=>a.d<b.d?-1:a.d>b.d?1:0;
const signed=n=>(n>0?'+':'')+n;
const LOAD={total:'إجمالي',perHand:'لكل يد',perSide:'لكل جانب',bw:'وزن الجسم'};
const ST={done:['مكتملة','st-done'],missed:['فائتة','st-missed'],up:['قادمة','st-up'],progress:['قيد التنفيذ','st-progress'],rest:['راحة','st-rest'],pre:['قبل البداية','st-rest']};
const chip=s=>`<span class="chip ${ST[s][1]}">${ST[s][0]}</span>`;

/* ========== مكتبة التمارين الافتراضية ========== */
function X(id,ar,en,pri,sec,load,steps,errs,type){return{id,ar,en,pri,sec,load,steps:steps.split('|'),errs:errs.split('|'),type:type||'reps',video:'',custom:false}}
const EX0=[
X('bench','ضغط البنش بالبار','Barbell Bench Press','الصدر','الكتف الأمامي، الترايسبس','total','استلقِ على البنش والعينان تحت البار والقدمان ثابتتان على الأرض|أمسك البار بقبضة أعرض قليلاً من الكتفين واسحب لوحي الكتف للخلف وللأسفل|أنزل البار بتحكم إلى أسفل الصدر والمرفقان بزاوية 45–70° تقريباً عن الجسم|ادفع البار للأعلى حتى تمتد الذراعان دون قفل عنيف','ارتداد البار عن الصدر|فتح المرفقين 90° بشكل كامل|رفع الحوض عن البنش'),
X('incline_db','ضغط دمبل على بنش مائل','Incline Dumbbell Press','الصدر العلوي','الكتف الأمامي، الترايسبس','perHand','اضبط البنش على ميل 30° تقريباً|اجلس والدمبل على فخذيك ثم استلقِ وارفعهما فوق الصدر|أنزل الدمبل بتحكم إلى جانبي الصدر العلوي مع ثبات لوحي الكتف|ادفع للأعلى حتى تمتد الذراعان','ميل البنش أكثر من اللازم فينتقل الحمل للكتف|إنزال الدمبل بسرعة دون تحكم|تقويس أسفل الظهر بشكل مفرط'),
X('lat_pd','سحب أمامي على الجهاز','Lat Pulldown','الظهر العريض (اللاتس)','البايسبس، الظهر الأوسط','total','اضبط وسادة الفخذ لتثبيت جسمك|أمسك البار بقبضة أعرض من الكتفين|اسحب البار إلى أعلى الصدر بقيادة المرفقين للأسفل|ارجع ببطء حتى تمتد الذراعان بالكامل','السحب خلف الرقبة|الميل للخلف كثيراً واستخدام الزخم|عدم مد الذراعين بالكامل في الأعلى'),
X('cable_row','تجديف كابل جالس','Seated Cable Row','الظهر الأوسط','اللاتس، البايسبس، الكتف الخلفي','total','اجلس والقدمان على المساند والركبتان مثنيتان قليلاً|حافظ على صدر مرفوع وظهر مستقيم|اسحب المقبض نحو البطن مع ضم لوحي الكتف|ارجع ببطء مع مد الذراعين دون تقويس الظهر','التأرجح بالجذع للأمام والخلف|رفع الكتفين نحو الأذنين|تقوس أسفل الظهر'),
X('lat_raise','رفرفة جانبية بالدمبل','Dumbbell Lateral Raise','الكتف الجانبي','الترابيس العلوي','perHand','قف والدمبل بجانبيك مع ثني خفيف في المرفقين|ارفع الذراعين جانباً حتى مستوى الكتفين تقريباً|أنزل ببطء وتحكم','أوزان ثقيلة مع أرجحة الجسم|رفع الكتفين نحو الأذنين|رفع الذراعين أعلى من الكتف بكثير'),
X('tri_pd','دفع ترايسبس بالكابل','Triceps Pushdown','الترايسبس','—','total','قف أمام الكابل وأمسك المقبض أو الحبل|ثبّت المرفقين بجانب الجسم|ادفع للأسفل حتى تمتد الذراعان بالكامل|ارجع ببطء حتى زاوية 90° تقريباً','تحريك المرفقين للأمام والخلف|الانحناء فوق المقبض لدفع الوزن بالجسم|إرجاع سريع بلا تحكم'),
X('db_curl','ثني بايسبس بالدمبل','Dumbbell Biceps Curl','البايسبس','البراكياليس، الساعد','perHand','قف والدمبل بجانبيك وراحة اليد للأمام|اثنِ المرفقين لرفع الدمبل دون تحريك الكتفين|اضغط في الأعلى ثم أنزل ببطء حتى المد الكامل','أرجحة الجذع|تقديم المرفقين للأمام|عدم النزول للمد الكامل'),
X('leg_press','ضغط الأرجل','Leg Press','الفخذ الأمامي (الكوادز)','الألوية، الفخذ الخلفي','total','اجلس والظهر ملتصق بالمقعد والقدمان بعرض الكتفين على المنصة|فك الأمان وأنزل المنصة بثني الركبتين بتحكم|انزل لأعمق مدى دون أن يرتفع الحوض عن المقعد|ادفع بكامل القدم دون قفل الركبتين بعنف','ارتفاع الحوض وانثناء أسفل الظهر في القاع|انهيار الركبتين للداخل|قفل الركبتين بقوة في الأعلى'),
X('rdl','ديدلفت روماني','Romanian Deadlift','الفخذ الخلفي','الألوية، أسفل الظهر','total','قف والبار أمام الفخذين والقدمان بعرض الوركين|ادفع الوركين للخلف مع ثني خفيف ثابت في الركبتين|أنزل البار قريباً من الساقين بظهر مستقيم حتى تشعر بشد في الفخذ الخلفي|عد للأعلى بدفع الوركين للأمام','تقوس الظهر|ثني الركبتين كثيراً فتتحول الحركة إلى سكوات|إبعاد البار عن الجسم'),
X('leg_ext','تمديد الأرجل','Leg Extension','الكوادز','—','total','اضبط المقعد لتكون الركبة مقابل محور الجهاز|ضع الوسادة فوق الكاحل|مد الركبتين حتى الاستقامة واضغط لحظة|أنزل ببطء','رفع الحوض عن المقعد|الركل السريع بالزخم|إنزال الوزن بسرعة'),
X('seated_curl','ثني الأرجل جالساً','Seated Leg Curl','الفخذ الخلفي','السمانة','total','اضبط المقعد ووسادة الفخذ بإحكام|ضع الوسادة السفلية خلف الكاحل|اثنِ الركبتين لسحب الوسادة للأسفل|ارجع ببطء حتى المد','عدم تثبيت الفخذين|مدى حركي قصير|الإرجاع السريع'),
X('stand_calf','رفع السمانة واقفاً','Standing Calf Raise','السمانة (الغاستروكنيميوس)','—','total','قف ومقدمة القدمين على حافة المنصة والركبتان مستقيمتان|أنزل الكعبين لأسفل مدى مريح|ارتفع على أطراف الأصابع لأعلى نقطة واثبت لحظة|انزل ببطء','الارتداد السريع في القاع|ثني الركبتين|مدى حركي قصير'),
X('plank','البلانك','Plank','عضلات البطن العميقة (الكور)','الكتفان، الألوية','bw','ضع الساعدين على الأرض والمرفقان تحت الكتفين|مد الساقين وارفع الجسم في خط مستقيم من الرأس إلى الكعبين|شد البطن والألوية وتنفس بانتظام|احتفظ بالوضعية للمدة المطلوبة','هبوط الحوض|رفع الحوض عالياً|حبس النفس','time'),
X('chest_press','ضغط الصدر على الجهاز','Chest Press Machine','الصدر','الكتف الأمامي، الترايسبس','total','اضبط المقعد لتكون المقابض في مستوى منتصف الصدر|ثبّت الظهر ولوحي الكتف على المسند|ادفع المقابض للأمام حتى تمتد الذراعان دون قفل|ارجع ببطء حتى شد مريح في الصدر','مقعد منخفض أو مرتفع جداً|إبعاد الظهر عن المسند|الإرجاع السريع'),
X('cable_fly','تفتيح صدر بالكابل','Cable Chest Fly','الصدر','الكتف الأمامي','perHand','اضبط البكرتين على مستوى الكتف تقريباً وتقدم خطوة|اثنِ المرفقين قليلاً وثبّتهما|اجمع المقبضين أمام الصدر بحركة قوسية|ارجع ببطء حتى شد مريح','تحويل الحركة إلى ضغط بثني المرفقين كثيراً|فتح الذراعين أبعد من المدى المريح|استخدام الزخم'),
X('cs_row','تجديف بمسند صدر','Chest Supported Row','الظهر الأوسط','اللاتس، الكتف الخلفي، البايسبس','total','اسند صدرك على الوسادة|أمسك المقابض والذراعان ممتدتان|اسحب بقيادة المرفقين للخلف مع ضم لوحي الكتف|أنزل ببطء','رفع الصدر عن الوسادة|هز الكتفين بدلاً من السحب|مدى حركي قصير'),
X('rev_pec','رفرفة عكسية على الجهاز','Reverse Pec Deck','الكتف الخلفي','الظهر الأوسط (الرومبويد)','total','اجلس مواجهاً للجهاز والصدر على المسند|أمسك المقابض والذراعان ممتدتان بمستوى الكتف|افتح الذراعين للخلف بقوس واسع|ارجع ببطء','وزن ثقيل مع الزخم|ثني المرفقين كثيراً|رفع الكتفين'),
X('hammer','ثني مطرقة بالدمبل','Dumbbell Hammer Curl','البراكياليس والساعد','البايسبس','perHand','قف والدمبل بجانبيك وراحتا اليدين متقابلتان|اثنِ المرفقين مع الحفاظ على القبضة المحايدة|أنزل ببطء','أرجحة الجسم|تحريك المرفقين للأمام|نزول غير كامل'),
X('oh_tri','تمديد ترايسبس فوق الرأس','Overhead Triceps Extension','الترايسبس (الرأس الطويل)','—','total','أمسك الدمبل أو حبل الكابل فوق الرأس|ثبّت المرفقين متجهين للأعلى قريبين من الرأس|أنزل الوزن خلف الرأس بثني المرفقين|مد الذراعين للأعلى','فتح المرفقين للخارج|تقوس أسفل الظهر|مدى حركي قصير'),
X('squat','سكوات (أو ضغط أرجل)','Squat or Leg Press','الكوادز والألوية','الفخذ الخلفي، الكور','total','ضع البار على أعلى الظهر والقدمان بعرض الكتفين تقريباً|خذ نفساً وشد البطن|انزل بدفع الوركين للخلف والركبتان باتجاه أصابع القدم|انزل لأعمق مدى بظهر محايد ثم ادفع للأعلى|بديل: نفّذ Leg Press بنفس المجموعات','انهيار الركبتين للداخل|رفع الكعبين|انحناء الظهر في القاع'),
X('hip_thrust','دفع الورك','Hip Thrust','الألوية','الفخذ الخلفي','total','اسند أعلى الظهر على البنش والبار فوق الوركين مع وسادة|ضع القدمين بحيث تكون الساق عمودية في الأعلى|ادفع الوركين للأعلى حتى يستقيم الجسم من الكتفين للركبتين|اضغط الألوية لحظة ثم انزل','تقوس أسفل الظهر في الأعلى|وضع القدمين بعيداً جداً|عدم الوصول للمد الكامل'),
X('leg_curl','ثني الأرجل','Leg Curl','الفخذ الخلفي','السمانة','total','استلقِ على بطنك أو اجلس حسب الجهاز والوسادة فوق الكعب|اثنِ الركبتين لسحب الوسادة|اضغط لحظة ثم أنزل ببطء','رفع الحوض|استخدام الزخم|الإرجاع السريع'),
X('seated_calf','رفع السمانة جالساً','Seated Calf Raise','السمانة (السوليوس)','—','total','اجلس ووسادة الجهاز فوق الركبتين ومقدمة القدمين على المنصة|أنزل الكعبين لأسفل مدى|ارتفع لأعلى نقطة واثبت لحظة|انزل ببطء','الارتداد السريع|مدى حركي قصير'),
X('cable_crunch','كرانش بالكابل','Cable Crunch','عضلات البطن','—','total','اركع أمام الكابل وأمسك الحبل بجانب الرأس|ثبّت الوركين|اثنِ الجذع للأسفل بتقريب الأضلاع من الحوض|ارجع ببطء','السحب بالذراعين بدلاً من البطن|تحريك الوركين للخلف والأمام|الحركة السريعة')];
const T=(ex,sets,min,max)=>({ex,sets,min,max});
const TPL0={
UA:{name:'Upper A',items:[T('bench',3,8,10),T('incline_db',2,10,12),T('lat_pd',3,8,12),T('cable_row',2,10,12),T('lat_raise',3,12,15),T('tri_pd',2,10,15),T('db_curl',2,10,12)]},
LA:{name:'Lower A',items:[T('leg_press',3,10,12),T('rdl',3,8,12),T('leg_ext',2,12,15),T('seated_curl',2,10,15),T('stand_calf',3,12,15),T('plank',3,30,45)]},
UB:{name:'Upper B',items:[T('chest_press',2,10,12),T('cable_fly',2,12,15),T('cs_row',3,8,12),T('lat_pd',2,10,12),T('rev_pec',3,12,15),T('hammer',2,10,12),T('oh_tri',2,10,12)]},
LB:{name:'Lower B',items:[T('squat',3,8,12),T('hip_thrust',2,10,12),T('leg_curl',3,10,12),T('leg_ext',2,12,15),T('seated_calf',3,12,15),T('cable_crunch',3,12,15)]}};
const SCHED0=['UA','LA',null,'UB','LB',null,null];
const F=(id,name,k,p,f,c)=>({id,name,k,p,f,c,custom:false});
const FOODS0=[F('chk','صدر دجاج مطبوخ',165,31,3.6,0),F('rice','أرز أبيض مطبوخ',130,2.7,0.3,28),F('cous','كسكسي مطبوخ',112,3.8,0.2,23),F('egg','بيض كامل',143,12.6,9.5,0.7),F('oats','شوفان',389,16.9,6.9,66),F('tuna','تونة معلبة بالماء',116,25.5,0.8,0),F('beef','لحم بقري قليل الدهن مطبوخ',217,26,12,0),F('lentil','عدس مطبوخ',116,9,0.4,20),F('pot','بطاطس مسلوقة',87,1.9,0.1,20),F('bread','خبز أبيض',265,9,3.2,49),F('yog','زبادي يوناني خالي الدسم',59,10,0.4,3.6),F('milk','حليب كامل الدسم',61,3.2,3.3,4.8),F('oil','زيت زيتون',884,0,100,0),F('alm','لوز',579,21,50,22),F('ban','موز',89,1.1,0.3,23),F('apple','تفاح',52,0.3,0.2,14),F('dates','تمر',282,2.5,0.4,75),F('whey','واي بروتين (راجع العبوة)',400,78,7,8)];

/* ========== الحالة والتخزين ========== */
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

/* ========== منطق التقويم والالتزام ========== */
const sessFor=slot=>state.sessions.find(s=>s.slot===slot);
function schedFor(date){const a=state.archive[weekStart(date)];const sch=(a&&a.schedule)||state.schedule;return sch[(parseD(date).getDay()+6)%7]||null}
function slotStatus(date){const t=schedFor(date);if(!t)return'rest';if(date<state.profile.startDate)return'pre';const s=sessFor(date);if(s&&s.status==='done')return'done';if(date<today())return'missed';if(s&&s.status==='progress')return'progress';return'up'}
function closeWeeks(){const cur=weekStart(today());let w=weekStart(state.profile.startDate),n=0;while(w<cur&&n<1000){if(!state.archive[w])state.archive[w]={schedule:state.schedule.slice(),closedAt:new Date().toISOString()};w=addDays(w,7);n++}}
function weekStats(ws){let scheduled=0,done=0,missed=0;const days=[];for(let i=0;i<7;i++){const d=addDays(ws,i),t=schedFor(d),st=slotStatus(d);if(t&&st!=='pre'){scheduled++;if(st==='done')done++;if(st==='missed')missed++}days.push({d,t,st})}return{ws,days,scheduled,done,missed,pct:scheduled?Math.round(done/scheduled*100):0}}
function allWeeks(){const out=[];let w=weekStart(state.profile.startDate),n=0;const cur=weekStart(today());while(w<=cur&&n<1000){out.push(w);w=addDays(w,7);n++}return out}
function totals(){const weeks=allWeeks().map(weekStats);let missed=0,best=null,run=0,longest=0;weeks.forEach((w,i)=>{missed+=w.missed;if(!w.scheduled)return;if(!best||w.pct>=best.pct)best=w;if(w.pct===100){run++;longest=Math.max(longest,run)}else if(i!==weeks.length-1)run=0});const D=state.sessions.filter(s=>s.status==='done');return{done:D.length,missed,best,cur:run,longest,days:new Set(D.map(s=>ymd(new Date(s.finishedAt)))).size}}
function monthStats(){const out={};let d=state.profile.startDate,n=0;const t=parseD(today());const end=ymd(new Date(t.getFullYear(),t.getMonth()+1,0));while(d<=end&&n<5000){const st=slotStatus(d);if(st!=='rest'&&st!=='pre'){const m=d.slice(0,7);out[m]=out[m]||{m,sch:0,done:0,missed:0};out[m].sch++;if(st==='done')out[m].done++;if(st==='missed')out[m].missed++}d=addDays(d,1);n++}return Object.values(out)}
function nextSession(){const t=today();for(let i=0;i<14;i++){const d=addDays(t,i),st=slotStatus(d);if(st==='up'||st==='progress')return{d,st,name:state.tpl[schedFor(d)].name}}return null}

/* ========== منطق القوة ========== */
const exName=id=>(state.ex[id]&&state.ex[id].en)||id;
const e1rm=s=>{const w=num(s.w)||0,r=num(s.r)||0;return r>0?r1(w*(1+r/30)):0};
const vol=sets=>sets.reduce((a,s)=>a+(num(s.w)||0)*(num(s.r)||0),0);
function perfHistory(id){return state.sessions.filter(s=>s.status==='done'&&s.finishedAt).sort((a,b)=>a.finishedAt<b.finishedAt?-1:1).flatMap(s=>s.items.filter(it=>it.ex===id).map(it=>({sid:s.id,date:ymd(new Date(s.finishedAt)),item:it,sets:it.sets.filter(x=>x.d&&num(x.r)!=null)}))).filter(h=>h.sets.length)}
function lastPerf(id,exSid){const h=perfHistory(id).filter(x=>x.sid!==exSid);return h.length?h[h.length-1]:null}
function bestSet(sets,tm){return sets.reduce((b,s)=>(tm?(num(s.r)||0)>(num(b.r)||0):e1rm(s)>e1rm(b))?s:b,sets[0])}
function overload(id,exSid){const lp=lastPerf(id,exSid);if(!lp)return null;const it=lp.item,e=state.ex[id];if(!e||!it.sets.length||!it.sets.every(x=>x.d&&num(x.r)>=it.max))return null;if(e.type==='time')return`أنجزت ${it.max} ثانية في كل المجموعات آخر مرة. جرّب زيادة 5–10 ثوانٍ.`;const inc={total:'2.5 كغ',perHand:'1–2 كغ لكل يد',perSide:'1.25 كغ لكل جانب',bw:'وزناً إضافياً بسيطاً'}[e.load]||'زيادة صغيرة';return`وصلت إلى ${it.max} تكرارات في كل المجموعات آخر مرة. يمكنك تجربة زيادة ${inc}. لن يتغير الوزن تلقائياً.`}
function weekVolume(ws){const we=addDays(ws,6);return state.sessions.filter(s=>s.status==='done'&&s.slot>=ws&&s.slot<=we).reduce((a,s)=>a+s.items.reduce((b,it)=>b+((state.ex[it.ex]||{}).type==='time'?0:vol(it.sets.filter(x=>x.d))),0),0)}
const weekNo=d=>Math.round((parseD(weekStart(d))-parseD(weekStart(state.profile.startDate)))/DAY/7)+1;

/* ========== الجسم والتغذية ========== */
function curWeight(){const W=state.body.filter(b=>b.w!=null).sort(byD);if(!W.length)return{w:state.profile.startWeight,none:true};const l=W[W.length-1],from=addDays(l.d,-6),r=W.filter(b=>b.d>=from);return{w:l.w,d:l.d,avg:r.length>1?r1(r.reduce((a,b)=>a+b.w,0)/r.length):null}}
function weeklyAvg(W){const m={};W.forEach(b=>{const k=weekStart(b.d);(m[k]=m[k]||[]).push(b.w)});return Object.keys(m).sort().map(k=>({ws:k,avg:r1(m[k].reduce((a,b)=>a+b,0)/m[k].length),n:m[k].length}))}
function entryVals(e){if(e.manual)return{k:e.k,p:e.p,f:e.f,c:e.c};const m=e.g/100;return{k:e.k*m,p:e.p*m,f:e.f*m,c:e.c*m}}
function dayTotals(d){const L=state.food[d]||[];const t={k:0,p:0,f:0,c:0,n:L.length};L.forEach(e=>{const v=entryVals(e);t.k+=v.k;t.p+=v.p;t.f+=v.f;t.c+=v.c});return t}
function nutAvg(n){const t=today();let k=0,p=0,c=0;for(let i=0;i<n;i++){const x=dayTotals(addDays(t,-i));if(x.n){k+=x.k;p+=x.p;c++}}return c?{k:Math.round(k/c),p:Math.round(p/c),n:c}:null}
function dailyTasks(t){const a=[];if(schedFor(t)&&t>=state.profile.startDate)a.push({t:'حصة التدريب',ok:slotStatus(t)==='done'});a.push({t:'الوزن',ok:state.body.some(b=>b.d===t&&b.w!=null)});const n=dayTotals(t);a.push({t:'الطعام',ok:n.n>0});a.push({t:'البروتين',ok:n.p>=state.profile.protein*.9});return a}
function motivation(ws){const st=slotStatus(today());if(!state.sessions.length&&!state.body.length)return'البداية: سجّل وزنك اليوم وأكمل أول حصة. التقدم يُبنى على بيانات حقيقية.';if(st==='progress')return'لديك حصة قيد التنفيذ. أكملها وسجّل مجموعاتك.';if(st==='done')return'حصة اليوم مكتملة. التعافي والبروتين والنوم جزء من التدريب.';if(ws.missed>0)return`فاتتك ${ws.missed} حصة هذا الأسبوع. يمكنك استدراكها من التقويم، فالاستمرارية أهم من الكمال.`;if(ws.done>0&&ws.done===ws.scheduled)return'أكملت كل حصص هذا الأسبوع. التزام كامل.';if(st==='up')return'اليوم يوم تدريب. حصة واحدة منجزة تحافظ على الإيقاع.';return'يوم راحة. سجّل وزنك وطعامك ونم جيداً.'}

/* ========== مكونات واجهة ========== */
const stat=(l,v,s,c)=>`<div class="stat"><div class="l">${l}</div><div class="v ${c||''}">${v}</div>${s?`<div class="sm mut">${s}</div>`:''}</div>`;
const empty=(t,s)=>`<div class="empty"><b>${t}</b>${s||''}</div>`;
const back=r=>`<button class="btn sm noprint" style="margin-bottom:12px" onclick="go('${r}')">→ رجوع</button>`;
const notFound=()=>empty('الصفحة غير موجودة')+`<button class="btn blk" onclick="go('home')">الرئيسية</button>`;
function macroBar(l,v,g,u){const pc=g?Math.min(100,v/g*100):0,over=v>g*1.05;return`<div style="margin-bottom:10
