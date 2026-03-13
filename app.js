'use strict';
/* ══ CONSTANTS ══ */
const G={U:'df11_users',L:'df11_last',TH:'df11_theme',LN:'df11_lang',OB:'df11_onboard'};
const UK=(u,k)=>`df11_${u}_${k}`;
const LR=(k,d=null)=>{try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch{return d;}};
const SR=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const GU=()=>LR(G.U,{});const SU=u=>SR(G.U,u);

/* ══ STATE ══ */
let CU=null,CP='',ale=false,alt=null;
let entries=[],cats=[],moods={},allTags=[];
let EID=null,fil='all',wMood=0,wPhotos=[],wStar=false,wLocked=false,wPinned=false;
let wFont='syne',wStickers=[],wTags=[],wLinks=[],wScheduled=null;
let lbPh=[],lbI=0,shareText='',previewMode=false,stkOpen=false;
let calYear=new Date().getFullYear(),calMonth=new Date().getMonth();
let calSelDay=null,curView='list';
let pinCb=null,pinBuf='';
let obSlide=0;
/* write timer */
let wtStart=null,wtElapsed=0,wtTimer=null;
/* voice */
let voiceRec=null,voiceActive=false,voiceText='';
/* ai */
let aiLastResult='',aiLastAction='';
/* scheduled check */
let schedCheckInterval=null;

const STICKERS=['📝','✏️','📖','💡','🎯','🔥','⚡','💎','🌿','🍃','🌱','🌲','🏔️','🌅','🌙','⭐','💫','☀️','❄️','🎵','🎶','🎸','🏋️','⚽','🎮','💻','📱','🚀','✈️','🗺️','🤔','😤','💪','🙏','👊','🤝','📊','📈','🏆','🎖️'];
const BADGES=[
  {id:'first',ico:'🌱',lbl:'Birinchi qadam',check:()=>entries.length>=1},
  {id:'s7',ico:'🔥',lbl:'7 kun streak',check:()=>calcStreak()>=7},
  {id:'e50',ico:'📚',lbl:'50 ta yozuv',check:()=>entries.length>=50},
  {id:'star5',ico:'⭐',lbl:'5 ta sevimli',check:()=>entries.filter(e=>e.starred).length>=5},
  {id:'photo',ico:'📷',lbl:'Rasm qo\'shildi',check:()=>entries.some(e=>e.photos?.length)},
  {id:'ai',ico:'🤖',lbl:'AI ishlatdi',check:()=>entries.some(e=>e.aiUsed)},
  {id:'voice',ico:'🎙️',lbl:'Ovoz yozdi',check:()=>entries.some(e=>e.voiceUsed)},
  {id:'link',ico:'🔗',lbl:'Bog\'liq yozuv',check:()=>entries.some(e=>e.links?.length)},
];

/* ══ UTILS ══ */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const td=()=>new Date().toISOString().slice(0,10);
const fd=(iso,lang)=>new Date(iso).toLocaleDateString(lang==='ru'?'ru-RU':lang==='en'?'en-US':'uz-UZ',{day:'numeric',month:'short',year:'numeric'});
const fdl=(iso,lang)=>new Date(iso).toLocaleDateString(lang==='ru'?'ru-RU':lang==='en'?'en-US':'uz-UZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const fds=d=>{const days=['Ya','Du','Se','Ch','Pa','Ju','Sh'];return days[d.getDay()];}
const me=m=>['','😢','😔','😐','🙂','😄'][+m]||'';
const wc=s=>s.trim().split(/\s+/).filter(Boolean).length;
const rt=s=>Math.max(1,Math.round(wc(s)/200));
const getLang=()=>document.documentElement.getAttribute('data-lang')||'uz';
const fmtTime=s=>{const m=Math.floor(s/60);return m+':'+String(s%60).padStart(2,'0');};

function toast(msg,dur=2600){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.remove('hidden');
  requestAnimationFrame(()=>{el.classList.add('show');
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.classList.add('hidden'),350);},dur);});
}
const openM=id=>document.getElementById(id).classList.remove('hidden');
const closeM=id=>document.getElementById(id).classList.add('hidden');
function showErr(id,msg){const e=document.getElementById(id);e.textContent=msg;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),4500);}

/* ══ STORAGE ══ */
async function saveData(){
  if(!CU)return;
  const blob=await CryptoUtil.encrypt(JSON.stringify({entries,cats,moods,allTags}),CP);
  localStorage.setItem(UK(CU.username,'data'),blob);
}
async function loadData(){
  const blob=localStorage.getItem(UK(CU.username,'data'));
  if(!blob){entries=[];cats=[];moods={};allTags=[];return;}
  try{const obj=JSON.parse(await CryptoUtil.decrypt(blob,CP));
    entries=obj.entries||[];cats=obj.cats||[];moods=obj.moods||{};allTags=obj.allTags||[];}
  catch{throw new Error('WRONG_PASSWORD');}
}

/* ══ CANVAS SPLASH ══ */
function initSplashCanvas(){
  const cv=document.getElementById('sp-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');cv.width=window.innerWidth;cv.height=window.innerHeight;
  const pts=Array.from({length:30},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:Math.random()*2+1}));
  let raf;
  function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>cv.width)p.vx*=-1;if(p.y<0||p.y>cv.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(90,144,64,.35)';ctx.fill();});
    pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<120){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(90,144,64,${.18*(1-d/120)})`;ctx.lineWidth=.8;ctx.stroke();}}));
    raf=requestAnimationFrame(draw);
  }
  draw();setTimeout(()=>cancelAnimationFrame(raf),3000);
}

/* ══ THEME / LANG ══ */
function setTheme(th){document.body.setAttribute('data-theme',th);SR(G.TH,th);hideSidePanel('theme-panel');toast('🎨');updateSettingsUI();}
function showThemePanel(){document.getElementById('theme-panel').classList.remove('hidden');}
function showLangPanel(){document.getElementById('lang-panel').classList.remove('hidden');}
function hideSidePanel(id){document.getElementById(id).classList.add('hidden');}
function setLang(lang){
  document.documentElement.setAttribute('data-lang',lang);SR(G.LN,lang);
  ['uz','ru','en'].forEach(l=>{document.querySelector(`.lng[onclick="setLang('${l}')"]`)?.classList.toggle('active',l===lang);const c=document.getElementById('lch-'+l);if(c)c.textContent=l===lang?'✓':'';});
  hideSidePanel('lang-panel');applyI18n();toast('🌐');
}

function applyI18n(){
  document.querySelectorAll('[data-i]').forEach(el=>el.textContent=t(el.getAttribute('data-i')));
  const pls={lu:t('username'),lp:t('password'),ru:t('username'),rn:t('name'),rp:t('password'),rp2:t('confirmPass'),ncat:t('newFolder'),wtit:t('title'),wbody:t('body'),qtxt:t('quickNote'),'ai-custom-inp':t('aiCustom'),'link-search-inp':t('linkSearch')};
  Object.entries(pls).forEach(([id,ph])=>{const el=document.getElementById(id);if(el)el.placeholder=ph;});
  ['great','good','okay','bad','awful'].forEach((k,i)=>{const el=document.getElementById(`m${5-i}l`);if(el)el.textContent=t(k);});
  const maps={
    'vt-list-lbl':'all','vt-cal-lbl':'calendar','vt-mood-lbl':'vtMood','vt-secret-lbl':'secret',
    'ms-lbl':'today','wml':'mood',
    'wsv':t('save')+' ✓','wrem-btn':t('setReminder'),
    'nb-home-lbl':'home','nb-cats-lbl':'folders','nb-stats-lbl':'stats','nb-settings-lbl':'profile',
    'k1l':'statTotal','k2l':'statMonth','k3l':'statStreak','k4l':'statWords',
    'k5l':'statReadTime','k6l':'statAvgWords',
    'sst1':'weekActivity','sst2':'moodHistory','sst3':'byFolder','sst4':'topEntries','sst5':'tags',
    'sst-mood-chart':'moodChart','sst-wt':'writeTime',
    'si-theme':'theme','si-lang':'lang','si-chpass':'changePass','si-chpass-sub':'changePassSub',
    'si-al':'autolock','si-al-sub':'autolockSub','si-dr':'dailyReminder',
    'si-tg-lbl':'tgSync','si-tg-bk':'tgBackup','si-tg-rs':'tgRestore',
    'sg-appearance':'theme','sg-security':'security','sg-reminder-sec':'reminder',
    'sg-data':'backup','sg-users':'users','sg-danger':'dangerZone',
    'si-save-bk':'saveBackup','si-load-bk':'loadBackup',
    'si-users':'usersLabel','si-del-acc':'deleteAccount',
    'logout-btn':'logout',
    'fp-all':'✦ '+t('all'),'fp-sched-lbl':'schedList',
    'mcp-ttl':'changePass','mcp-btn':t('save'),'mcp-cancel':t('cancel'),
    'mpin-save':t('save'),'mpin-cancel':t('cancel'),'mpin-rem':t('pinRemoved'),
    'mdr-ttl':'dailyReminder','mdr-save':t('save'),'mdr-cancel':t('cancel'),
    'msh-share':t('share'),'msh-copy':t('copied'),'msh-close':t('cancel'),
    'mqn-ttl':'quickNote','mqn-save':t('save'),'mqn-cancel':t('cancel'),
    'mu-close':t('cancel'),'mu-ttl':'usersLabel',
    'as-title':'advSearch','as-q-lbl':'searchPlaceholder','as-from-lbl':'from','as-to-lbl':'to',
    'as-mood-lbl':'filterMood','as-cat-lbl':'filterCat','as-tag-lbl':'filterTag',
    'as-clear':'clearFilter','as-apply':'applyFilter','as-mood-any':'anyMood',
    'ai-panel-ttl':'aiAssist','ai-insert-btn':t('aiInsert'),'ai-th-lbl':'aiThinking',
    'ai-res-lbl':'aiResult','sp-theme-head':'theme','sp-lang-head':'lang',
    'ms-ttl':'schedDate','ms-save':t('schedSave'),'ms-remove':t('schedRemove'),'ms-cancel':t('cancel'),
    'wgc-t':'wordGoal','wg-btn':t('save'),'ncat-btn':t('addFolder'),
    'gb-lbl':'wordsToday',
  };
  Object.entries(maps).forEach(([id,key])=>{
    const el=document.getElementById(id);if(!el)return;
    el.textContent=(key.startsWith('✦')||key.includes(' '))?key:t(key)||key;
  });
  updateSettingsUI();
}

function updateSettingsUI(){
  if(!CU)return;
  const th=LR(G.TH,'earthy'),ln=getLang();
  const thN={earthy:'Earthy Dark',slate:'Slate Night',warm:'Warm Dark',light:'Clean Light',ocean:'Deep Ocean'};
  const lnN={uz:"O'zbek",ru:'Русский',en:'English'};
  setTxt('si-theme-val',thN[th]||th);setTxt('si-lang-val',lnN[ln]||ln);
  const ph=localStorage.getItem(UK(CU.username,'pin'));
  setTxt('si-pin-sub',ph?'✓ O\'rnatilgan':'—');
  const dr=LR(UK(CU.username,'daily_rem'),null);
  setTxt('si-dr-val',dr||'—');
  setTxt('si-users-val',`${Object.keys(GU()).length}`);
  const aiKey=localStorage.getItem('df11_ai_key');
  setTxt('si-ai-sub',aiKey?'✓ O\'rnatilgan':'—');
  const tgTok=localStorage.getItem('df11_tg_token'),tgCid=localStorage.getItem('df11_tg_chat');
  setTxt('si-tg-val',(tgTok&&tgCid)?'✓ '+t('tgSync'):t('tgNotSet'));
  const wg=LR(UK(CU.username,'word_goal'),200);
  const wi=document.getElementById('wg-inp');if(wi)wi.value=wg;
  const todayWc=entries.filter(e=>e.date?.startsWith(td())).reduce((s,e)=>s+wc(e.body||''),0);
  setTxt('wgc-s',`${todayWc} / ${wg}`);
}
function setTxt(id,v){const el=document.getElementById(id);if(el)el.textContent=v;}

/* ══ INIT ══ */
window.addEventListener('load',()=>{
  const th=LR(G.TH,'earthy');document.body.setAttribute('data-theme',th);
  const ln=LR(G.LN,'uz');document.documentElement.setAttribute('data-lang',ln);
  ['uz','ru','en'].forEach(l=>{document.querySelector(`.lng[onclick="setLang('${l}')"]`)?.classList.toggle('active',l===ln);const c=document.getElementById('lch-'+l);if(c)c.textContent=l===ln?'✓':'';});
  initSplashCanvas();buildStkGrid();applyI18n();
  document.addEventListener('keydown',kbHandler);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&ale&&CU)lockApp();});
  ['touchstart','click','keydown'].forEach(ev=>document.addEventListener(ev,resetAL,{passive:true}));
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
  setTimeout(()=>{const sp=document.getElementById('splash');sp.classList.add('out');setTimeout(async()=>{sp.classList.add('hidden');if(!LR(G.OB,false)){showOnboarding();return;}const lastU=localStorage.getItem(G.L);const sess=lastU?LR('df11_sess_'+lastU,null):null;if(sess&&sess.user&&sess.pass&&sess.exp>Date.now()){const us=GU();const user=us[sess.user];if(user){const hash=await CryptoUtil.hashPassword(sess.user,sess.pass);if(hash===user.hash){CP=sess.pass;CU={username:sess.user,name:user.name,joined:user.joined};try{await loadData();launchApp();return;}catch(e){}}}}showAuth();},600);},2600);
});

function kbHandler(e){
  if(e.key==='Escape'){
    if(!document.getElementById('lb').classList.contains('hidden')){closeLB();return;}
    if(stkOpen){closeStkPanel();return;}
    if(!document.getElementById('pin-overlay').classList.contains('hidden')){closePinOverlay();return;}
    ['ai-panel','voice-panel','link-panel'].forEach(id=>{if(!document.getElementById(id).classList.contains('hidden'))hideBotPanel(id);});
    ['adv-search'].forEach(id=>{if(!document.getElementById(id).classList.contains('hidden'))closeAdvSearch();});
    ['theme-panel','lang-panel'].forEach(id=>{if(!document.getElementById(id).classList.contains('hidden'))hideSidePanel(id);});
  }
  if(e.key==='ArrowLeft'&&!document.getElementById('lb').classList.contains('hidden'))lbN(-1,e);
  if(e.key==='ArrowRight'&&!document.getElementById('lb').classList.contains('hidden'))lbN(1,e);
  if(e.key==='Enter'&&document.activeElement?.closest('#fl'))doLogin();
  if((e.ctrlKey||e.metaKey)&&e.key==='s'&&document.getElementById('sc-write').classList.contains('active')){e.preventDefault();saveEntry();}
  if((e.ctrlKey||e.metaKey)&&e.key==='p'&&document.getElementById('sc-write').classList.contains('active')){e.preventDefault();togglePreview();}
}

/* ══ ONBOARDING ══ */
function showOnboarding(){document.getElementById('onboard').classList.remove('hidden');obSlide=0;applyObSlide();}
function applyObSlide(){
  document.querySelectorAll('.ob-slide').forEach((s,i)=>s.classList.toggle('active',i===obSlide));
  document.querySelectorAll('.od').forEach((d,i)=>d.classList.toggle('active',i===obSlide));
  const ks=[['onboard1T','onboard1S'],['onboard2T','onboard2S'],['onboard3T','onboard3S']];
  ks.forEach(([tk,sk],i)=>{setTxt(`ob-t${i}`,t(tk));setTxt(`ob-s${i}`,t(sk));});
  const lang=getLang();
  document.getElementById('ob-next').textContent=obSlide===2?t('getStarted'):lang==='ru'?'Далее →':lang==='en'?'Next →':'Keyingi →';
}
function goSlide(i){obSlide=i;applyObSlide();}
function nextSlide(){obSlide<2?goSlide(obSlide+1):finishOnboard();}
function finishOnboard(){SR(G.OB,true);document.getElementById('onboard').classList.add('hidden');showAuth();}

/* ══ STICKERS ══ */
function buildStkGrid(){const g=document.getElementById('stk-panel');if(!g)return;const grid=document.createElement('div');grid.className='stk-grid';STICKERS.forEach(s=>{const b=document.createElement('button');b.className='stk-btn';b.textContent=s;b.onclick=()=>addStk(s);grid.appendChild(b);});g.appendChild(grid);}
function toggleStk(){stkOpen=!stkOpen;document.getElementById('stk-panel').classList.toggle('hidden',!stkOpen);}
function closeStkPanel(){stkOpen=false;document.getElementById('stk-panel').classList.add('hidden');}
function addStk(s){wStickers.push(s);renderWStkRow();closeStkPanel();}
function renderWStkRow(){const row=document.getElementById('wp-stk-row');row.innerHTML='';wStickers.forEach((s,i)=>{const sp=document.createElement('span');sp.className='wp-stk-item';sp.textContent=s;sp.onclick=()=>{wStickers.splice(i,1);renderWStkRow();};row.appendChild(sp);});}

/* ══ AUTH ══ */
function showAuth(){document.getElementById('auth').classList.remove('hidden');document.getElementById('app').classList.add('hidden');renderQL();const last=localStorage.getItem(G.L);if(last){document.getElementById('lu').value=last;setTimeout(()=>document.getElementById('lp').focus(),300);}}
function renderQL(){const users=GU(),names=Object.keys(users);const b=document.getElementById('ql');if(!b)return;b.innerHTML=names.map(u=>`<button class="ql-b" onclick="qlPick('${esc(u)}')"><div class="ql-av">${u[0].toUpperCase()}</div>${esc(users[u].name||u)}</button>`).join('');}
function qlPick(u){document.getElementById('lu').value=u;setTimeout(()=>document.getElementById('lp').focus(),100);}
function switchTab(tab){document.getElementById('atb-l').classList.toggle('active',tab==='l');document.getElementById('atb-r').classList.toggle('active',tab==='r');document.getElementById('fl').classList.toggle('hidden',tab!=='l');document.getElementById('fr').classList.toggle('hidden',tab!=='r');}
function toggleEye(id,btn){const i=document.getElementById(id);i.type=i.type==='password'?'text':'password';btn.textContent=i.type==='password'?'👁':'🙈';}
function chkU(){const u=document.getElementById('ru').value.trim().toLowerCase();const h=document.getElementById('ruh');if(!u){h.textContent='';return;}if(!/^[a-z0-9_]{3,20}$/.test(u)){h.textContent=t('userFmt');h.style.color='var(--danger)';return;}h.textContent=GU()[u]?'❌ '+t('userTaken'):'✓ '+t('userFree');h.style.color=GU()[u]?'var(--danger)':'var(--green)';}
function chkS(){const p=document.getElementById('rp').value;const f=document.getElementById('sfill'),l=document.getElementById('slbl');let s=0;if(p.length>=6)s++;if(p.length>=10)s++;if(/[A-Z0-9]/.test(p))s++;if(/[^a-zA-Z0-9]/.test(p))s++;const W=['0%','30%','55%','80%','100%'],C=['','var(--danger)','var(--gold)','var(--green)','var(--accent)'],TX=['',t('weak'),t('medium'),t('strong'),t('veryStrong')];f.style.width=W[s];f.style.background=C[s];l.textContent=TX[s];l.style.color=C[s];}
async function doReg(){
  const u=document.getElementById('ru').value.trim().toLowerCase(),n=document.getElementById('rn').value.trim(),p1=document.getElementById('rp').value,p2=document.getElementById('rp2').value;
  if(!/^[a-z0-9_]{3,20}$/.test(u)){showErr('rerr',t('userFmt'));return;}
  if(GU()[u]){showErr('rerr',t('userTaken'));return;}
  if(p1.length<6){showErr('rerr',t('passMin'));return;}
  if(p1!==p2){showErr('rerr',t('passMatch'));return;}
  setBL('rbtn','rtxt','rspin',true);
  try{const hash=await CryptoUtil.hashPassword(u,p1);const us=GU();us[u]={hash,name:n||u,joined:new Date().toISOString()};SU(us);CP=p1;CU={username:u,name:n||u,joined:us[u].joined};entries=[];cats=[];moods={};allTags=[];await saveData();localStorage.setItem(G.L,u);SR('df11_sess_'+u,{user:u,pass:p1,exp:Date.now()+30*86400000});launchApp();toast('✓ '+t('welcome')+', '+CU.name+'!');}
  catch(e){showErr('rerr','Xato: '+e.message);}
  finally{setBL('rbtn','rtxt','rspin',false);}
}
async function doLogin(){
  const u=document.getElementById('lu').value.trim().toLowerCase(),p=document.getElementById('lp').value;
  if(!u||!p){showErr('lerr','!');return;}
  const us=GU(),user=us[u];
  if(!user){showErr('lerr',t('noUser'));return;}
  setBL('lbtn','ltxt','lspin',true);
  try{const hash=await CryptoUtil.hashPassword(u,p);if(hash!==user.hash){showErr('lerr',t('wrongPass'));document.getElementById('lp').value='';setBL('lbtn','ltxt','lspin',false);return;}CP=p;CU={username:u,name:user.name,joined:user.joined};await loadData();localStorage.setItem(G.L,u);SR('df11_sess_'+u,{user:u,pass:p,exp:Date.now()+30*86400000});launchApp();toast('✓ '+t('welcome')+', '+CU.name+'!');}
  catch(e){showErr('lerr',e.message==='WRONG_PASSWORD'?'Shifrlash xatosi':'Xato: '+e.message);}
  finally{setBL('lbtn','ltxt','lspin',false);}
}
function setBL(b,t2,s,l){document.getElementById(b).disabled=l;document.getElementById(t2).classList.toggle('hidden',l);document.getElementById(s).classList.toggle('hidden',!l);}
function doLogout(){if(!confirm(t('logout')+'?'))return;CU=null;CP='';entries=[];cats=[];moods={};allTags=[];document.getElementById('lp').value='';showAuth();toast('👋');}
function lockApp(){CP='';document.getElementById('app').classList.add('hidden');document.getElementById('auth').classList.remove('hidden');if(CU)document.getElementById('lu').value=CU.username;switchTab('l');}
function resetAL(){if(!ale||!CU)return;clearTimeout(alt);alt=setTimeout(lockApp,120000);}
function togAL(){ale=document.getElementById('togtog').checked;SR(UK(CU.username,'autolock'),ale);resetAL();}

/* ══ PIN ══ */
function openPinOverlay(titleKey,cb){pinBuf='';pinCb=cb;document.getElementById('pin-title').textContent=t(titleKey)||titleKey;updatePinDots();document.getElementById('pin-err').classList.add('hidden');document.getElementById('pin-overlay').classList.remove('hidden');}
function closePinOverlay(){pinBuf='';pinCb=null;document.getElementById('pin-overlay').classList.add('hidden');}
function updatePinDots(){document.querySelectorAll('.pd').forEach((d,i)=>{d.classList.toggle('filled',i<pinBuf.length);d.classList.remove('error');});}
function pinKey(k){if(k==='C'){pinBuf=pinBuf.slice(0,-1);updatePinDots();return;}if(pinBuf.length>=4)return;pinBuf+=k;updatePinDots();if(pinBuf.length===4)setTimeout(()=>pinCb&&pinCb(pinBuf),120);}
function showPinError(){document.getElementById('pin-err').textContent=t('pinWrong');document.getElementById('pin-err').classList.remove('hidden');document.querySelectorAll('.pd').forEach(d=>d.classList.add('error'));setTimeout(()=>updatePinDots(),600);pinBuf='';}
function openPinMgr(){const has=!!localStorage.getItem(UK(CU.username,'pin'));document.getElementById('mpin-rem').classList.toggle('hidden',!has);document.getElementById('pin1').value='';document.getElementById('pin2').value='';openM('m-pin-mgr');}
async function savePin(){const p1=document.getElementById('pin1').value,p2=document.getElementById('pin2').value;if(!/^\d{4}$/.test(p1)){showErr('pinerr','4 raqam!');return;}if(p1!==p2){showErr('pinerr',t('pinMismatch'));return;}localStorage.setItem(UK(CU.username,'pin'),await CryptoUtil.hashPin(p1));closeM('m-pin-mgr');toast('✓ PIN saqlandi');updateSettingsUI();}
function removePin(){if(!confirm('PIN o\'chirilsinmi?'))return;localStorage.removeItem(UK(CU.username,'pin'));closeM('m-pin-mgr');toast('🗑');updateSettingsUI();}

/* ══ LAUNCH ══ */
function launchApp(){
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  ale=!!LR(UK(CU.username,'autolock'),false);
  document.getElementById('togtog').checked=ale;
  applyI18n();setGreeting();loadTMood();renderFpills();renderView();renderCats();updCatSel();
  updateSettingsUI();updateGoalBar();openScreen('home');
  startSchedCheck();
}

function setGreeting(){
  const h=new Date().getHours(),lang=getLang();
  const g={uz:['Yaxshi tun 🌙','Xayrli tong ☀️','Xayrli kun 🌤','Xayrli kech 🌇','Yaxshi tun 🌙'],ru:['Доброй ночи 🌙','Доброе утро ☀️','Добрый день 🌤','Добрый вечер 🌇','Доброй ночи 🌙'],en:['Good night 🌙','Good morning ☀️','Good day 🌤','Good evening 🌇','Good night 🌙']};
  setTxt('hh-greet',(g[lang]||g.uz)[h<5?0:h<12?1:h<17?2:h<21?3:4]+', '+CU.name);
  setTxt('hh-date',fdl(new Date().toISOString(),lang));
  setTxt('hh-av',CU.name[0].toUpperCase());
  const st=calcStreak(),el=document.getElementById('hh-streak');
  if(el){el.textContent=st>=1?`${st}🔥`:'';el.style.display=st>=1?'':'none';}
}

/* ══ WORD GOAL ══ */
function updateGoalBar(){
  if(!CU)return;
  const goal=LR(UK(CU.username,'word_goal'),200);
  const todayWc=entries.filter(e=>e.date?.startsWith(td())).reduce((s,e)=>s+wc(e.body||''),0);
  const pct=Math.min(100,Math.round(todayWc/goal*100));
  const gb=document.getElementById('gb-fill');if(gb)gb.style.width=pct+'%';
  setTxt('gb-val',`${todayWc} / ${goal}`);
}
function saveWordGoal(){const v=parseInt(document.getElementById('wg-inp').value)||200;SR(UK(CU.username,'word_goal'),Math.max(50,Math.min(5000,v)));toast('🎯 '+t('wordGoalSet'));updateSettingsUI();updateGoalBar();}

/* ══ WRITE TIMER ══ */
function startWriteTimer(){
  wtStart=Date.now();wtElapsed=0;clearInterval(wtTimer);
  wtTimer=setInterval(()=>{
    wtElapsed=Math.floor((Date.now()-wtStart)/1000);
    document.getElementById('wt-display').textContent=fmtTime(wtElapsed);
  },1000);
}
function stopWriteTimer(){clearInterval(wtTimer);wtTimer=null;}

/* ══ SCREENS ══ */
function openScreen(name){
  document.querySelectorAll('.sc').forEach(s=>s.classList.remove('active'));
  document.getElementById('sc-'+name).classList.add('active');
  const T={home:t('appName'),write:t('newEntry'),cats:t('folders'),stats:t('stats'),settings:t('profile')};
  setTxt('htit',T[name]||t('appName'));document.getElementById('hsub').textContent='';
  document.getElementById('hbback').classList.toggle('hidden',name!=='write');
  document.getElementById('hright-home').classList.toggle('hidden',name==='write');
  document.getElementById('hright-write').classList.toggle('hidden',name!=='write');
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  const NM={home:'nb-home',cats:'nb-cats',stats:'nb-stats',settings:'nb-settings'};
  if(NM[name])document.getElementById(NM[name]).classList.add('active');
  if(name==='stats')renderStats();
  if(name==='settings'){renderProfile();updateSettingsUI();}
  if(name==='write')updateWriteHdr();
}
function updateWriteHdr(){const w=document.getElementById('wbody')?.value||'';const wcnt=wc(w);document.getElementById('hsub').textContent=wcnt>0?`${wcnt} ${getLang()==='ru'?'слов':getLang()==='en'?'words':"so'z"}  ·  ~${rt(w)} ${t('statMin')}`:''; }
function goBack(){previewMode=false;stopWriteTimer();document.getElementById('wp-editor').classList.remove('hidden');document.getElementById('wp-preview').classList.add('hidden');openScreen('home');setGreeting();renderFpills();renderView();updateGoalBar();}

/* ══ VIEW SWITCHING ══ */
function setView(v,btn){
  curView=v;
  document.querySelectorAll('.vt').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  ['list','cal','mood','secret'].forEach(id=>{document.getElementById(`view-${id}`).classList.toggle('hidden',v!==id);});
  document.getElementById('fpills').classList.toggle('hidden',v!=='list');
  if(v==='cal')renderCal();else if(v==='mood')renderMoodChart();else if(v==='secret')renderSecretView();else renderHome();
}

/* ══ MOODS ══ */
function loadTMood(){const m=moods[td()];if(m)document.querySelectorAll('.mb').forEach(b=>b.classList.toggle('on',+b.dataset.v===m));}
function setTMood(v,btn){moods[td()]=v;saveData();document.querySelectorAll('.mb').forEach(b=>b.classList.remove('on'));btn.classList.add('on');toast(me(v));}
function setWM(v,btn){wMood=v;document.querySelectorAll('.wmb').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));}

/* ══ FILTERS ══ */
function renderFpills(){
  const c=document.getElementById('fpills');
  c.querySelectorAll('.fp[data-cat],.fp[data-tag]').forEach(b=>b.remove());
  cats.forEach(cat=>{const b=document.createElement('button');b.className='fp';b.dataset.cat=cat;b.textContent='📁 '+cat;b.onclick=()=>setFil(cat,b);c.appendChild(b);});
  const tagCounts={};entries.forEach(e=>(e.tags||[]).forEach(tag=>{tagCounts[tag]=(tagCounts[tag]||0)+1;}));
  Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,4).forEach(([tag])=>{const b=document.createElement('button');b.className='fp';b.dataset.tag=tag;b.textContent='#'+tag;b.onclick=()=>setFil('tag:'+tag,b);c.appendChild(b);});
  c.querySelectorAll('.fp').forEach(b=>{
    const v=b.dataset.cat?b.dataset.cat:b.dataset.tag?'tag:'+b.dataset.tag:b.id==='fp-all'?'all':b.id==='fp-pin'?'pinned':b.id==='fp-star'?'starred':b.id==='fp-sched'?'scheduled':null;
    if(v)b.classList.toggle('active',v===fil);
  });
}
function setFil(f,btn){fil=f;document.querySelectorAll('.fp').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderHome();}
function renderView(){if(curView==='list')renderHome();else if(curView==='cal')renderCal();else if(curView==='mood')renderMoodChart();else renderSecretView();}

/* ══ RENDER HOME ══ */
function renderHome(){
  const g=document.getElementById('ecards');
  const now=new Date();
  let shown=entries.filter(e=>{
    if(e.locked)return false;
    if(e.scheduled&&new Date(e.scheduled)>now)return fil==='scheduled';
    return true;
  });
  if(fil==='starred')shown=shown.filter(e=>e.starred);
  else if(fil==='pinned')shown=shown.filter(e=>e.pinned);
  else if(fil==='scheduled')shown=entries.filter(e=>e.scheduled&&new Date(e.scheduled)>now);
  else if(fil.startsWith('tag:'))shown=shown.filter(e=>(e.tags||[]).includes(fil.slice(4)));
  else if(fil!=='all')shown=shown.filter(e=>e.category===fil);
  shown=[...shown.filter(e=>e.pinned&&!e.scheduled),...shown.filter(e=>!e.pinned)];
  if(!shown.length){g.innerHTML=`<div class="empty-wrap"><div class="empty-ico">📖</div><div class="empty-t">${t('emptyTitle')}</div><div class="empty-s">${t('emptySub')}</div><button class="empty-btn" onclick="newEntry()">${t('start')}</button></div>`;return;}
  const lang=getLang();
  g.innerHTML=shown.map((e,i)=>{
    const ph=e.photos||[];const stks=(e.stickers||[]).join('');
    const tags=(e.tags||[]).map(tag=>`<span class="ec-usertag">#${esc(tag)}</span>`).join('');
    const pgrid=ph.length?buildPhotoGrid(e.id,ph):'';
    const schedBadge=e.scheduled?`<span class="ec-sched-badge">🕐 ${new Date(e.scheduled).toLocaleDateString()}</span>`:'';
    const linkBadge=e.links?.length?`<span class="ectag">🔗 ${e.links.length}</span>`:'';
    return `<div class="ecard${e.pinned?' is-pinned':''}" style="animation-delay:${i*.03}s" onclick="editEntry('${e.id}')">
      <div class="ec-r1">
        <div class="ec-tit">${e.pinned?'📌 ':''}${esc(e.title||t('noTitle'))}${stks?` <span style="font-size:11px">${stks}</span>`:''}</div>
        <div class="ec-meta"><div class="ec-date">${fd(e.date,lang)}</div><div class="ec-icons">${e.mood?`<span>${me(e.mood)}</span>`:''}${e.starred?'<span style="color:var(--gold)">★</span>':''}</div></div>
      </div>
      ${e.body?`<div class="ec-body">${esc(e.body.slice(0,140).replace(/[#*`>~_]/g,''))}</div>`:''}
      <div class="ec-footer">${e.category?`<span class="ectag">📁 ${esc(e.category)}</span>`:''}${tags}${schedBadge}${linkBadge}${e.writeTime?`<span class="ec-rt">⏱${fmtTime(e.writeTime)}</span>`:''}</div>
      ${pgrid}
    </div>`;
  }).join('');
}

function buildPhotoGrid(eid,photos){
  const n=photos.length,cls=n===1?'p1':n===2?'p2':n===3?'p3':'p4 pmore';
  const show=photos.slice(0,4),extra=n>4?n-4:0;
  return `<div class="ec-photos ${cls}">${show.map((p,pi)=>{const isLast=extra>0&&pi===show.length-1;return `<div class="ept-wrap"><img class="ept" src="${p}" alt="" onclick="openLBE('${eid}',${pi},event)"/>${isLast?`<div class="ept-more-ov">+${extra}</div>`:''}</div>`;}).join('')}</div>`;
}

/* ══ SECRET VIEW ══ */
function renderSecretView(){
  const g=document.getElementById('secret-cards');
  const locked=entries.filter(e=>e.locked);
  if(!locked.length){g.innerHTML=`<div class="empty-wrap"><div class="empty-ico">🔒</div><div class="empty-t">${t('secretLabel')}</div><div class="empty-s">${t('secretHint')}</div></div>`;return;}
  const lang=getLang();
  g.innerHTML=locked.map((e,i)=>`<div class="ecard is-locked" style="animation-delay:${i*.04}s" onclick="unlockAndEdit('${e.id}')">
    <div class="ec-r1"><div class="ec-tit">🔒 ${esc(e.title||t('noTitle'))}</div><div class="ec-meta"><div class="ec-date">${fd(e.date,lang)}</div></div></div>
    <div class="ec-body" style="filter:blur(3px)">${esc(e.body?.slice(0,60)||'')}</div></div>`).join('');
}
function unlockAndEdit(id){
  const ph=localStorage.getItem(UK(CU.username,'pin'));
  if(!ph){toast('⚠️ PIN kerak');return;}
  openPinOverlay('pinUnlock',async pin=>{const hash=await CryptoUtil.hashPin(pin);if(hash!==ph){showPinError();return;}closePinOverlay();editEntryDirect(id);});
}

/* ══ CALENDAR ══ */
function renderCal(){
  const wrap=document.getElementById('cal-wrap');
  const M_UZ=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const M_RU=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const M_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const D_UZ=['Du','Se','Ch','Pa','Ju','Sh','Ya'],D_RU=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],D_EN=['Mo','Tu','We','Th','Fr','Sa','Su'];
  const lang=getLang();
  const mnames=lang==='ru'?M_RU:lang==='en'?M_EN:M_UZ;
  const dnames=lang==='ru'?D_RU:lang==='en'?D_EN:D_UZ;
  const eMap={};entries.filter(e=>!e.locked).forEach(e=>{const k=e.date?.slice(0,10);if(k){if(!eMap[k])eMap[k]=[];eMap[k].push(e);}});
  const firstDay=new Date(calYear,calMonth,1).getDay();
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const adj=(firstDay+6)%7;
  let html=`<div class="cal-nav"><button class="cal-nav-btn" onclick="calNav(-1)">‹</button><div class="cal-month">${mnames[calMonth]} ${calYear}</div><button class="cal-nav-btn" onclick="calNav(1)">›</button></div><div class="cal-grid">`;
  dnames.forEach(d=>{html+=`<div class="cal-dh">${d}</div>`;});
  for(let i=0;i<adj;i++)html+=`<div></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const key=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasE=!!eMap[key],isToday=key===td(),isSel=calSelDay===key,m=moods[key];
    html+=`<div class="cal-day${hasE?' has-entry':''}${isToday?' today':''}${isSel?' selected':''}" onclick="selectCalDay('${key}')"><div class="cdn">${d}</div>${hasE?'<div class="cal-dot"></div>':''}${m?`<div style="font-size:8px;position:absolute;bottom:2px">${me(m)}</div>`:''}</div>`;
  }
  html+='</div>';
  if(calSelDay&&eMap[calSelDay]){html+=`<div class="cal-detail"><div class="cd-title">${calSelDay}</div><div class="cd-list">${eMap[calSelDay].map(e=>`<div class="cd-item" onclick="editEntry('${e.id}')"><div class="cd-item-title">${esc(e.title||t('noTitle'))} ${e.mood?me(e.mood):''}</div><div class="cd-item-body">${esc(e.body?.slice(0,55)||'')}</div></div>`).join('')}</div></div>`;}
  else if(calSelDay){html+=`<div class="cal-detail"><div class="cd-title">—</div></div>`;}
  wrap.innerHTML=html;
}
function calNav(d){calMonth+=d;if(calMonth>11){calMonth=0;calYear++;}if(calMonth<0){calMonth=11;calYear--;}calSelDay=null;renderCal();}
function selectCalDay(k){calSelDay=calSelDay===k?null:k;renderCal();}

/* ══ MOOD CHART (new full page) ══ */
function renderMoodChart(){
  const wrap=document.getElementById('mood-chart-wrap');
  // last 30 days
  const days=[];
  for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push({date:d.toISOString().slice(0,10),day:d.getDate(),m:moods[d.toISOString().slice(0,10)]||0});}
  const moodColors={1:'#d05040',2:'#d0803a',3:'#a09030',4:'#5a9040',5:'#3a8048'};
  // SVG mood timeline
  const W=300,H=100,pad=10;
  const hasAny=days.some(d=>d.m);
  if(!hasAny){wrap.innerHTML=`<div class="empty-wrap"><div class="empty-ico">💙</div><div class="empty-t">${t('moodChart')}</div><div class="empty-s">${getLang()==='ru'?'Записывайте настроение каждый день':getLang()==='en'?'Record your mood every day':'Har kun kayfiyatingizni qayd eting'}</div></div>`;return;}
  const step=(W-pad*2)/(days.length-1);
  let path='',dots='';
  const pts=days.map((d,i)=>({x:pad+i*step,y:d.m?H-pad-(d.m-1)*(H-pad*2)/4:null}));
  pts.forEach((p,i)=>{
    if(p.y===null)return;
    const prev=pts.slice(0,i).reverse().find(x=>x.y!==null);
    if(!prev)path+=`M${p.x},${p.y}`;
    else path+=` L${p.x},${p.y}`;
    dots+=`<circle cx="${p.x}" cy="${p.y}" r="4" fill="${moodColors[days[i].m]}" stroke="var(--bg2)" stroke-width="1.5"/>`;
    if(i%5===0||i===days.length-1){dots+=`<text x="${p.x}" y="${H+2}" text-anchor="middle" font-size="7" fill="var(--text3)">${days[i].day}</text>`;}
  });
  // trend analysis
  const validMoods=days.filter(d=>d.m).map(d=>d.m);
  const avg=validMoods.length?validMoods.reduce((a,b)=>a+b,0)/validMoods.length:0;
  const first5=validMoods.slice(0,Math.ceil(validMoods.length/2));
  const last5=validMoods.slice(Math.floor(validMoods.length/2));
  const avg1=first5.length?first5.reduce((a,b)=>a+b,0)/first5.length:0;
  const avg2=last5.length?last5.reduce((a,b)=>a+b,0)/last5.length:0;
  const trend=avg2>avg1+0.3?'📈':avg2<avg1-0.3?'📉':'➡️';
  const trendTxt=trend==='📈'?(getLang()==='ru'?'Настроение улучшается':getLang()==='en'?'Mood improving':'Kayfiyat yaxshilanmoqda'):trend==='📉'?(getLang()==='ru'?'Настроение снижается':getLang()==='en'?'Mood declining':'Kayfiyat pasaymoqda'):(getLang()==='ru'?'Стабильное настроение':getLang()==='en'?'Stable mood':'Barqaror kayfiyat');
  // best mood day
  const bestDay=days.filter(d=>d.m===5);
  wrap.innerHTML=`
    <div style="padding:14px">
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
        <div class="kpi" style="flex:1"><span class="kv">${avg.toFixed(1)}</span><span class="kl">${getLang()==='ru'?'Среднее':getLang()==='en'?'Average':'O\'rtacha'}</span></div>
        <div class="kpi" style="flex:1"><span class="kv">${validMoods.length}</span><span class="kl">${getLang()==='ru'?'Записей':getLang()==='en'?'Records':'Qaydlar'}</span></div>
        <div class="kpi" style="flex:1"><span class="kv">${bestDay.length}</span><span class="kl">😄 ${getLang()==='ru'?'дней':getLang()==='en'?'days':'kun'}</span></div>
      </div>
      <svg viewBox="0 0 ${W} ${H+12}" style="width:100%;height:120px;overflow:visible">
        <defs><linearGradient id="mgrd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent2)" stop-opacity=".3"/><stop offset="1" stop-color="var(--accent2)" stop-opacity="0"/></linearGradient></defs>
        ${[1,2,3,4,5].map(v=>`<line x1="${pad}" y1="${H-pad-(v-1)*(H-pad*2)/4}" x2="${W-pad}" y2="${H-pad-(v-1)*(H-pad*2)/4}" stroke="var(--border)" stroke-width=".5" stroke-dasharray="3,3"/><text x="${pad-4}" y="${H-pad-(v-1)*(H-pad*2)/4+3}" text-anchor="end" font-size="7" fill="var(--text3)">${me(v)}</text>`).join('')}
        <path d="${path}" fill="none" stroke="var(--accent2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
      </svg>
      <div style="font-size:12px;color:var(--text2);padding:8px 0;font-style:italic">${trend} ${trendTxt}</div>
      <div style="margin-top:10px">
        ${days.filter(d=>d.m).slice(-14).map(d=>`<div class="mc-row"><span class="mc-day">${d.date.slice(5)}</span><div class="mc-bar-wrap"><div class="mc-bar" style="width:${d.m*20}%;background:${moodColors[d.m]}"></div></div><span class="mc-emoji">${me(d.m)}</span></div>`).join('')}
      </div>
    </div>`;
}

/* ══ ADV SEARCH ══ */
function openAdvSearch(){document.getElementById('adv-search').classList.remove('hidden');updAdvCatSel();document.getElementById('as-results').innerHTML='';document.getElementById('as-q').focus();}
function closeAdvSearch(){document.getElementById('adv-search').classList.add('hidden');}
function updAdvCatSel(){const s=document.getElementById('as-cat');s.innerHTML=`<option value="">${t('folders')+'...'}</option>`;cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent='📁 '+c;s.appendChild(o);});}
function clearAdvSearch(){['as-q','as-from','as-to','as-tag'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('as-mood').value='';document.getElementById('as-cat').value='';document.getElementById('as-results').innerHTML='';}
function runAdvSearch(){
  const q=(document.getElementById('as-q').value||'').toLowerCase().trim();
  const from=document.getElementById('as-from').value,to=document.getElementById('as-to').value;
  const mood=document.getElementById('as-mood').value,cat=document.getElementById('as-cat').value;
  const tag=(document.getElementById('as-tag').value||'').toLowerCase().trim();
  let res=entries.filter(e=>{
    if(e.locked)return false;
    if(q&&!((e.title||'').toLowerCase().includes(q)||(e.body||'').toLowerCase().includes(q)))return false;
    if(from&&e.date?.slice(0,10)<from)return false;if(to&&e.date?.slice(0,10)>to)return false;
    if(mood&&+e.mood!==+mood)return false;if(cat&&e.category!==cat)return false;
    if(tag&&!(e.tags||[]).some(tt=>tt.toLowerCase().includes(tag)))return false;
    return true;
  });
  const g=document.getElementById('as-results');
  if(!res.length){g.innerHTML=`<div style="text-align:center;padding:20px;font-size:13px;color:var(--text3)">${t('noResults')}</div>`;return;}
  const lang=getLang();
  const hi=s=>q?s.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'),'<mark>$1</mark>'):s;
  g.innerHTML=res.slice(0,30).map(e=>`<div class="ecard" onclick="editEntry('${e.id}');closeAdvSearch()">
    <div class="ec-r1"><div class="ec-tit">${hi(esc(e.title||t('noTitle')))}</div><div class="ec-meta"><div class="ec-date">${fd(e.date,lang)}</div>${e.mood?`<div>${me(e.mood)}</div>`:''}</div></div>
    ${e.body?`<div class="ec-body">${hi(esc(e.body.slice(0,100).replace(/[#*`>~_]/g,'')))}</div>`:''}
  </div>`).join('');
}

/* ══ BOT PANELS (AI, Voice, Link) ══ */
function openAIPanel(){hideBotPanel('voice-panel');hideBotPanel('link-panel');document.getElementById('ai-panel').classList.remove('hidden');document.getElementById('ai-result-box').classList.add('hidden');document.getElementById('ai-thinking').classList.add('hidden');}
function openVoicePanel(){hideBotPanel('ai-panel');hideBotPanel('link-panel');document.getElementById('voice-panel').classList.remove('hidden');document.getElementById('voice-hint').textContent=t('voiceStart');document.getElementById('voice-live').textContent='';}
function openLinkPanel(){hideBotPanel('ai-panel');hideBotPanel('voice-panel');document.getElementById('link-panel').classList.remove('hidden');document.getElementById('link-search-inp').value='';renderLinkSearch('');}
function hideBotPanel(id){document.getElementById(id).classList.add('hidden');}
function renderLinkSearch(q){
  const g=document.getElementById('link-results');q=(q||'').toLowerCase();
  const res=entries.filter(e=>!e.locked&&e.id!==EID&&(!q||(e.title||'').toLowerCase().includes(q)||(e.body||'').toLowerCase().includes(q))).slice(0,15);
  if(!res.length){g.innerHTML=`<div style="font-size:12px;color:var(--text3);padding:8px">${t('noResults')}</div>`;return;}
  g.innerHTML=res.map(e=>`<div class="ecard" style="cursor:pointer" onclick="addLink('${e.id}')"><div class="ec-tit" style="font-size:13px">${esc(e.title||t('noTitle'))}</div><div class="ec-body" style="font-size:11px">${esc(e.body?.slice(0,60)||'')}</div></div>`).join('');
}
function addLink(id){
  if(!wLinks.includes(id))wLinks.push(id);
  renderActiveLinks();hideBotPanel('link-panel');toast('🔗 '+t('linked'));
}
function renderActiveLinks(){
  const c=document.getElementById('active-links');c.innerHTML='';
  wLinks.forEach((id,i)=>{
    const e=entries.find(x=>x.id===id);if(!e)return;
    const s=document.createElement('span');s.className='alink-item';s.textContent='🔗 '+(e.title||t('noTitle')).slice(0,25);
    s.title=t('delete');s.onclick=()=>{wLinks.splice(i,1);renderActiveLinks();};c.appendChild(s);
  });
}

/* ══ AI ══ */
function openAISettings(){
  const k=localStorage.getItem('df11_ai_key')||'';
  document.getElementById('ai-key-inp').value=k;
  document.getElementById('ai-key-rm').classList.toggle('hidden',!k);
  openM('m-ai-key');
}
function saveAIKey(){const k=document.getElementById('ai-key-inp').value.trim();if(!k){toast('!');return;}localStorage.setItem('df11_ai_key',k);closeM('m-ai-key');toast('✓ AI key saqlandi');updateSettingsUI();}
function removeAIKey(){localStorage.removeItem('df11_ai_key');closeM('m-ai-key');toast('🗑');updateSettingsUI();}

async function aiAction(action){
  const apiKey=localStorage.getItem('df11_ai_key');
  if(!apiKey){openAISettings();toast('⚠️ API key kerak');return;}
  const title=document.getElementById('wtit').value||'';
  const body=document.getElementById('wbody').value||'';
  const lang=getLang();
  const prompts={
    continue:`Continue writing this journal entry naturally. Same language (${lang}). Just continue from where it ends, no intro:\n\nTitle: ${title}\n\n${body}`,
    rewrite:`Rewrite this journal entry to be more expressive and vivid. Same language (${lang}). Keep same meaning:\n\nTitle: ${title}\n\n${body}`,
    summarize:`Summarize this journal entry in 2-3 sentences. Language: ${lang}:\n\nTitle: ${title}\n\n${body}`,
    expand:`Expand this journal entry with more details and reflections. Same language (${lang}):\n\nTitle: ${title}\n\n${body}`,
    translate:`Translate this journal entry to ${lang==='uz'?'English':lang==='en'?"O'zbek":'English'}:\n\nTitle: ${title}\n\n${body}`,
  };
  aiLastAction=action;
  await callGemini(prompts[action],apiKey);
}
async function aiCustom(){
  const apiKey=localStorage.getItem('df11_ai_key');
  if(!apiKey){openAISettings();return;}
  const inp=document.getElementById('ai-custom-inp');
  const prompt=inp.value.trim();if(!prompt)return;
  const body=document.getElementById('wbody').value||'';
  aiLastAction='custom';
  await callGemini(`${prompt}\n\nJournal entry:\n${body}`,apiKey);
  inp.value='';
}
async function aiRedo(){if(aiLastAction)await aiAction(aiLastAction);}
async function callGemini(prompt,apiKey){
  document.getElementById('ai-thinking').classList.remove('hidden');
  document.getElementById('ai-result-box').classList.add('hidden');
  setTxt('ai-th-lbl',t('aiThinking'));
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.8,maxOutputTokens:800}})
    });
    const data=await res.json();
    if(!res.ok)throw new Error(data.error?.message||t('aiError'));
    aiLastResult=data.candidates?.[0]?.content?.parts?.[0]?.text||'';
    document.getElementById('ai-result').innerHTML=MD.render(aiLastResult);
    document.getElementById('ai-result-box').classList.remove('hidden');
    setTxt('ai-insert-btn',t('aiInsert'));
  }catch(e){toast('❌ '+e.message);}
  finally{document.getElementById('ai-thinking').classList.add('hidden');}
}
function aiInsert(){
  const ta=document.getElementById('wbody');
  const pos=ta.selectionEnd||ta.value.length;
  ta.value=ta.value.slice(0,pos)+(pos>0?'\n\n':'')+aiLastResult;
  hideBotPanel('ai-panel');autoDraft();
  // mark entry as ai used
  toast('🤖 '+t('aiInsert'));
  // store flag
  if(EID){const i=entries.findIndex(e=>e.id===EID);if(i>-1)entries[i].aiUsed=true;}
}

/* ══ VOICE ══ */
function toggleVoice(){
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){toast(t('voiceNA'));return;}
  if(voiceActive)stopVoice();else startVoice();
}
function startVoice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  voiceRec=new SR();voiceRec.continuous=true;voiceRec.interimResults=true;
  voiceRec.lang=getLang()==='uz'?'uz-UZ':getLang()==='ru'?'ru-RU':'en-US';
  voiceRec.onstart=()=>{voiceActive=true;document.getElementById('voice-mic').classList.add('listening');document.getElementById('voice-hint').textContent=t('voiceListening');};
  voiceRec.onresult=e=>{let interim='',final='';for(let r of e.results){if(r.isFinal)final+=r[0].transcript;else interim+=r[0].transcript;}voiceText=final||interim;document.getElementById('voice-live').textContent=voiceText;if(final){document.getElementById('voice-insert').classList.remove('hidden');setTxt('voice-insert',t('voiceInsert'));}};
  voiceRec.onerror=e=>{toast('❌ '+e.error);stopVoice();};
  voiceRec.onend=()=>stopVoice();
  voiceRec.start();
}
function stopVoice(){voiceActive=false;voiceRec?.stop();document.getElementById('voice-mic').classList.remove('listening');document.getElementById('voice-hint').textContent=t('voiceStart');}
function insertVoice(){
  if(!voiceText)return;
  const ta=document.getElementById('wbody');
  ta.value+=(ta.value?'\n':'')+voiceText;
  hideBotPanel('voice-panel');autoDraft();toast('🎙️ '+t('voiceInsert'));
  // mark
  if(EID){const i=entries.findIndex(e=>e.id===EID);if(i>-1)entries[i].voiceUsed=true;}
}

/* ══ SCHEDULER ══ */
function openScheduler(){
  if(wScheduled){const d=new Date(wScheduled);document.getElementById('sched-input').value=d.toISOString().slice(0,16);}
  else{const d=new Date();d.setDate(d.getDate()+1);d.setHours(9,0,0,0);document.getElementById('sched-input').value=d.toISOString().slice(0,16);}
  document.getElementById('ms-remove').classList.toggle('hidden',!wScheduled);
  openM('m-sched');
}
function saveSchedule(){
  const val=document.getElementById('sched-input').value;
  if(!val){toast('!');return;}
  wScheduled=new Date(val).toISOString();
  const chip=document.getElementById('sched-chip');
  chip.textContent=`🕐 ${new Date(wScheduled).toLocaleDateString()}`;
  chip.classList.add('sched-active');
  closeM('m-sched');toast('🕐 '+t('schedSave'));
}
function removeSchedule(){wScheduled=null;const chip=document.getElementById('sched-chip');chip.textContent=`🕐 ${t('schedDate')}`;chip.classList.remove('sched-active');closeM('m-sched');}
function startSchedCheck(){
  clearInterval(schedCheckInterval);
  schedCheckInterval=setInterval(()=>{
    const now=new Date();
    entries.filter(e=>e.scheduled&&!e.schedPublished).forEach(e=>{
      if(new Date(e.scheduled)<=now){
        e.schedPublished=true;
        if(Notification.permission==='granted')new Notification('Daftar 📖',{body:t('schedPublish')+': '+e.title,icon:'icons/icon-192.png'});
        saveData();renderView();toast('🕐 '+e.title+': '+t('schedPublish'));
      }
    });
  },60000);
}

/* ══ PDF EXPORT ══ */
async function exportPDF(){
  const title=EID?entries.find(e=>e.id===EID)?.title||'':document.getElementById('wtit').value;
  const body=EID?entries.find(e=>e.id===EID)?.body||'':document.getElementById('wbody').value;
  if(!title&&!body){toast('!');return;}
  toast('📄 '+t('pdfExporting'));
  // Build a printable HTML page and open print dialog
  const lang=getLang();
  const tags=(EID?entries.find(e=>e.id===EID)?.tags:wTags)||[];
  const dateStr=fdl(new Date().toISOString(),lang);
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Georgia',serif;color:#1a1a18;background:#fff;padding:40px;max-width:700px;margin:0 auto;}
    h1{font-size:28px;font-weight:700;margin-bottom:8px;line-height:1.2;}
    .meta{font-size:12px;color:#666;margin-bottom:6px;font-family:'Arial',sans-serif;}
    .tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;}
    .tag{background:#f0f0e8;color:#506040;font-size:11px;padding:2px 9px;border-radius:5px;font-family:'Arial',sans-serif;}
    .divider{border:none;border-top:1px solid #ddd;margin:16px 0;}
    .body{font-size:16px;line-height:1.85;white-space:pre-wrap;}
    h2,h3{margin:16px 0 8px;}
    strong{font-weight:700;}
    em{font-style:italic;}
    code{background:#f4f4f0;padding:1px 5px;border-radius:3px;font-family:'Courier New',monospace;font-size:13px;}
    blockquote{border-left:3px solid #8aaa80;padding:8px 14px;background:#f8f8f4;color:#505040;margin:10px 0;}
    ul,ol{padding-left:20px;margin:8px 0;}
    .footer{margin-top:40px;font-size:11px;color:#aaa;text-align:center;font-family:'Arial',sans-serif;border-top:1px solid #eee;padding-top:12px;}
    @media print{body{padding:20px;}@page{margin:1.5cm;}}
  </style></head><body>
    <div class="meta">${dateStr}</div>
    <h1>${title}</h1>
    ${tags.length?`<div class="tags">${tags.map(tag=>`<span class="tag">#${tag}</span>`).join('')}</div>`:''}
    <hr class="divider"/>
    <div class="body">${body.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    <div class="footer">Daftar v11 · ${new Date().toLocaleDateString()}</div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}<\/script>
  </body></html>`;
  const blob=new Blob([html],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const win=window.open(url,'_blank');
  if(!win)toast('Popup blocker yoqilgan');
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}

/* ══ TELEGRAM SYNC ══ */
function openTGSettings(){
  document.getElementById('tg-tok').value=localStorage.getItem('df11_tg_token')||'';
  document.getElementById('tg-cid').value=localStorage.getItem('df11_tg_chat')||'';
  openM('m-tg');
}
function saveTG(){
  const tok=document.getElementById('tg-tok').value.trim(),cid=document.getElementById('tg-cid').value.trim();
  if(!tok||!cid){toast('!');return;}
  localStorage.setItem('df11_tg_token',tok);localStorage.setItem('df11_tg_chat',cid);
  closeM('m-tg');toast('✓ Telegram saqlandi');updateSettingsUI();
}
async function tgBackup(){
  const tok=localStorage.getItem('df11_tg_token'),cid=localStorage.getItem('df11_tg_chat');
  if(!tok||!cid){openTGSettings();toast('⚠️ '+t('tgNotSet'));return;}
  toast('📤 '+t('tgSending'));
  try{
    const data=JSON.stringify({entries,cats,moods,allTags,user:CU.username,at:new Date().toISOString(),v:9},null,2);
    const blob=new Blob([data],{type:'application/json'});
    const form=new FormData();
    form.append('chat_id',cid);form.append('caption',`📖 Daftar Backup\n👤 @${CU.username}\n📅 ${new Date().toLocaleString()}\n📝 ${entries.length} yozuv`);
    form.append('document',blob,`daftar-backup-${CU.username}-${td()}.json`);
    const res=await fetch(`https://api.telegram.org/bot${tok}/sendDocument`,{method:'POST',body:form});
    const result=await res.json();
    if(result.ok)toast('✅ '+t('tgSuccess'));
    else toast('❌ '+t('tgFail'));
  }catch(e){toast('❌ '+t('tgFail'));}
}
async function tgRestore(){
  const tok=localStorage.getItem('df11_tg_token'),cid=localStorage.getItem('df11_tg_chat');
  if(!tok||!cid){openTGSettings();return;}
  toast('📥 '+t('tgSending'));
  try{
    const res=await fetch(`https://api.telegram.org/bot${tok}/getUpdates?limit=20`);
    const data=await res.json();
    if(!data.ok){toast('❌ '+t('tgFail'));return;}
    // find latest document with daftar-backup
    const docs=data.result.filter(u=>u.message?.document?.file_name?.includes('daftar-backup')).reverse();
    if(!docs.length){toast('⚠️ Telegram da backup topilmadi');return;}
    const fileId=docs[0].message.document.file_id;
    const fr=await fetch(`https://api.telegram.org/bot${tok}/getFile?file_id=${fileId}`);
    const fd2=await fr.json();
    if(!fd2.ok){toast('❌');return;}
    const fileRes=await fetch(`https://api.telegram.org/file/bot${tok}/${fd2.result.file_path}`);
    const json=JSON.parse(await fileRes.text());
    if(!json.entries){toast(t('badFile'));return;}
    if(!confirm(`${json.entries.length} ${t('confirmImport')}`))return;
    entries=json.entries||[];cats=json.cats||[];moods=json.moods||{};allTags=json.allTags||[];
    await saveData();setGreeting();renderFpills();renderView();renderCats();
    toast('✅ '+t('backupLoaded'));
  }catch(e){toast('❌ '+t('tgFail'));}
}

/* ══ WRITE ══ */
function newEntry(){
  EID=null;wMood=0;wPhotos=[];wStar=false;wLocked=false;wPinned=false;wFont='syne';wStickers=[];wTags=[];wLinks=[];wScheduled=null;
  previewMode=false;stopWriteTimer();
  const dr=getDraft();
  if(dr&&confirm(t('draft')+'?')){
    document.getElementById('wtit').value=dr.title||'';
    document.getElementById('wbody').value=dr.body||'';
    wMood=dr.mood||0;wStar=!!dr.starred;wLocked=!!dr.locked;wPinned=!!dr.pinned;
    wFont=dr.font||'syne';wStickers=dr.stickers||[];wTags=dr.tags||[];wLinks=dr.links||[];wScheduled=dr.scheduled||null;
    updCatSel();document.getElementById('wcat').value=dr.cat||'';
  }else{clearDraft();document.getElementById('wtit').value='';document.getElementById('wbody').value='';updCatSel();document.getElementById('wcat').value='';}
  _applyWrite();openScreen('write');startWriteTimer();
  setTimeout(()=>document.getElementById('wtit').focus(),300);
}
function editEntry(id){const e=entries.find(x=>x.id===id);if(!e)return;if(e.locked){unlockAndEdit(id);return;}editEntryDirect(id);}
function editEntryDirect(id){
  const e=entries.find(x=>x.id===id);if(!e)return;
  EID=id;wMood=e.mood||0;wPhotos=e.photos?[...e.photos]:[];
  wStar=!!e.starred;wLocked=!!e.locked;wPinned=!!e.pinned;
  wFont=e.font||'syne';wStickers=e.stickers?[...e.stickers]:[];wTags=e.tags?[...e.tags]:[];wLinks=e.links?[...e.links]:[];wScheduled=e.scheduled||null;
  previewMode=false;stopWriteTimer();
  document.getElementById('wtit').value=e.title||'';
  document.getElementById('wbody').value=e.body||'';
  document.getElementById('wrem').value=e.reminder||'';
  if(e.reminder)document.getElementById('wrem-st').textContent=`⏰ ${e.reminder}`;
  updCatSel();document.getElementById('wcat').value=e.category||'';
  _applyWrite();openScreen('write');startWriteTimer();
}
function _applyWrite(){
  document.getElementById('wp-editor').classList.remove('hidden');
  document.getElementById('wp-preview').classList.add('hidden');
  document.getElementById('wp-date').textContent=fdl(new Date().toISOString(),getLang());
  document.getElementById('wdel').classList.toggle('hidden',!EID);
  document.getElementById('wbody').className='wbody font-'+wFont;
  document.querySelectorAll('.wf').forEach(b=>b.classList.toggle('active',b.dataset.f===wFont));
  _applyWIcons();renderWStkRow();renderActiveTags();renderActiveLinks();
  document.querySelectorAll('.wmb').forEach(b=>b.classList.toggle('on',+b.dataset.v===wMood));
  document.getElementById('wrem-st').textContent='';
  document.getElementById('wc-live').textContent='';
  renderWPhotos();
  // sched chip
  const chip=document.getElementById('sched-chip');
  if(wScheduled){chip.textContent=`🕐 ${new Date(wScheduled).toLocaleDateString()}`;chip.classList.add('sched-active');}
  else{chip.textContent=`🕐 ${t('schedDate')}`;chip.classList.remove('sched-active');}
}
function _applyWIcons(){
  const ws=document.getElementById('wstar'),wp=document.getElementById('wpin'),wl=document.getElementById('wlock');
  ws.textContent=wStar?'★':'☆';ws.className='wico'+(wStar?' on-star':'');
  wp.textContent='📌';wp.className='wico'+(wPinned?' on-pin':'');
  wl.textContent=wLocked?'🔒':'🔓';wl.className='wico'+(wLocked?' on-lock':'');
}
function togStar(){wStar=!wStar;_applyWIcons();}
function togPin(){wPinned=!wPinned;_applyWIcons();toast(wPinned?'📌':'—');}
function togLock(){const ph=localStorage.getItem(UK(CU.username,'pin'));if(!ph&&!wLocked){toast('⚠️ PIN kerak');return;}wLocked=!wLocked;_applyWIcons();}
function setF(f,btn){wFont=f;document.querySelectorAll('.wf').forEach(b=>b.classList.toggle('active',b.dataset.f===f));document.getElementById('wbody').className='wbody font-'+f;}
function fmtMD(pre,post){const ta=document.getElementById('wbody');const s=ta.selectionStart,e=ta.selectionEnd,val=ta.value;const sel=val.slice(s,e)||'text';ta.value=val.slice(0,s)+pre+sel+post+val.slice(e);ta.selectionStart=s+pre.length;ta.selectionEnd=s+pre.length+sel.length;ta.focus();autoDraft();}
function fmtLine(prefix){const ta=document.getElementById('wbody');const s=ta.selectionStart,val=ta.value;const ls=val.lastIndexOf('\n',s-1)+1;ta.value=val.slice(0,ls)+prefix+val.slice(ls);ta.selectionStart=ta.selectionEnd=s+prefix.length;ta.focus();autoDraft();}

/* PREVIEW */
function togglePreview(){
  previewMode=!previewMode;
  document.getElementById('wp-editor').classList.toggle('hidden',previewMode);
  document.getElementById('wp-preview').classList.toggle('hidden',!previewMode);
  if(previewMode)renderPreview();
  toast(previewMode?'👁 '+t('preview'):'✏️ '+t('editMode'));
}
function renderPreview(){
  const title=document.getElementById('wtit').value||t('noTitle');
  const body=document.getElementById('wbody').value||'';
  const lang=getLang();
  document.getElementById('prev-date').textContent=fdl(new Date().toISOString(),lang);
  document.getElementById('prev-mood').textContent=wMood?me(wMood):'';
  document.getElementById('prev-title').textContent=title;
  document.getElementById('prev-tags').innerHTML=wTags.map(tag=>`<span class="prev-tag">#${esc(tag)}</span>`).join('');
  // linked
  document.getElementById('prev-links').innerHTML=wLinks.map(id=>{const e=entries.find(x=>x.id===id);return e?`<span class="prev-link-item" onclick="editEntry('${id}')">🔗 ${esc(e.title||t('noTitle'))}</span>`:''}).join('');
  document.getElementById('prev-body').innerHTML=MD.render(body);
  document.getElementById('prev-photos').innerHTML=wPhotos.map((p,i)=>`<img src="${p}" alt="" onclick="openLBW(${i})"/>`).join('');
}

/* TAGS */
function renderActiveTags(){const c=document.getElementById('active-tags');c.innerHTML='';wTags.forEach((tag,i)=>{const s=document.createElement('span');s.className='atag';s.textContent='#'+tag;s.onclick=()=>{wTags.splice(i,1);renderActiveTags();};c.appendChild(s);});}
function openTagInput(){const wrap=document.getElementById('tag-input-wrap');wrap.classList.remove('hidden');const inp=document.getElementById('tag-inp');inp.value='';inp.focus();renderTagSugg('');}
function tagKeydown(e){if(e.key==='Enter'){e.preventDefault();addTagFromInput();}else if(e.key==='Escape'){document.getElementById('tag-input-wrap').classList.add('hidden');}else renderTagSugg(e.target.value);}
function renderTagSugg(q){const all=[...new Set([...allTags,...entries.flatMap(e=>e.tags||[])])].filter(Boolean);const matches=all.filter(t2=>t2.toLowerCase().includes((q||'').toLowerCase())&&!wTags.includes(t2)).slice(0,5);const box=document.getElementById('tag-suggestions');if(!matches.length){box.classList.add('hidden');return;}box.innerHTML=matches.map(t2=>`<div class="tsugg-item" onclick="addTag('${esc(t2)}')">#${esc(t2)}</div>`).join('');box.classList.remove('hidden');}
function addTag(tag){const clean=tag.trim().toLowerCase().replace(/[^a-z0-9а-яёa-zA-Z0-9_-]/gi,'').slice(0,20);if(clean&&!wTags.includes(clean)){wTags.push(clean);renderActiveTags();}document.getElementById('tag-input-wrap').classList.add('hidden');document.getElementById('tag-suggestions').classList.add('hidden');}
function addTagFromInput(){const v=document.getElementById('tag-inp').value.trim();if(v)addTag(v);}

/* DRAFT */
let draftTmr=null;
function autoDraft(){
  updateWriteHdr();
  const w=document.getElementById('wbody').value||'';const wcs=wc(w);
  document.getElementById('wc-live').textContent=wcs>0?`${wcs} ${getLang()==='ru'?'слов':getLang()==='en'?'words':"so'z"} · ~${rt(w)} ${t('statMin')}`:'';
  clearTimeout(draftTmr);
  draftTmr=setTimeout(()=>{
    SR(UK(CU.username,'draft'),{title:document.getElementById('wtit').value,body:w,cat:document.getElementById('wcat').value,mood:wMood,starred:wStar,locked:wLocked,pinned:wPinned,font:wFont,stickers:wStickers,tags:wTags,links:wLinks,scheduled:wScheduled,at:Date.now()});
    const b=document.getElementById('dbadge');b.classList.remove('hidden');setTimeout(()=>b.classList.add('hidden'),1600);
  },1500);
}
function getDraft(){const d=LR(UK(CU.username,'draft'),null);return(d&&Date.now()-d.at<86400000)?d:null;}
function clearDraft(){localStorage.removeItem(UK(CU.username,'draft'));}

async function saveEntry(){
  const title=document.getElementById('wtit').value.trim();
  const body=document.getElementById('wbody').value.trim();
  const cat=document.getElementById('wcat').value,rem=document.getElementById('wrem').value;
  if(!title&&!body){toast(t('emptyTitle'));return;}
  wTags.forEach(tag=>{if(!allTags.includes(tag))allTags.push(tag);});
  const writeTimeSec=wtElapsed;
  const obj={title:title||t('noTitle'),body,category:cat,reminder:rem,mood:wMood,photos:wPhotos,starred:wStar,locked:wLocked,pinned:wPinned,font:wFont,stickers:wStickers,tags:wTags,links:wLinks,scheduled:wScheduled,writeTime:writeTimeSec,updatedAt:Date.now()};
  if(EID){const i=entries.findIndex(e=>e.id===EID);if(i>-1)entries[i]={...entries[i],...obj};}
  else entries.unshift({id:Date.now().toString(),...obj,date:new Date().toISOString()});
  clearDraft();stopWriteTimer();await saveData();
  toast('✓ '+t('saved'));setGreeting();renderFpills();updateGoalBar();
  previewMode=false;document.getElementById('wp-editor').classList.remove('hidden');document.getElementById('wp-preview').classList.add('hidden');
  openScreen('home');renderView();
}
async function delEntry(){if(!EID||!confirm(t('confirmDelete')))return;entries=entries.filter(e=>e.id!==EID);EID=null;clearDraft();stopWriteTimer();await saveData();toast('🗑 '+t('deleted'));openScreen('home');renderView();}

/* QUICK NOTE */
function openQN(){document.getElementById('qtxt').value='';openM('m-quick');setTimeout(()=>document.getElementById('qtxt').focus(),200);}
async function saveQN(){const tx=document.getElementById('qtxt').value.trim();if(!tx)return;entries.unshift({id:Date.now().toString(),title:'⚡ '+tx.slice(0,40),body:tx,category:'',reminder:'',mood:0,photos:[],starred:false,locked:false,pinned:false,font:'syne',stickers:[],tags:[],links:[],date:new Date().toISOString(),updatedAt:Date.now()});await saveData();setGreeting();renderView();closeM('m-quick');toast('⚡ '+t('saved'));updateGoalBar();}

/* PHOTOS */
function addPhotos(ev){const files=[...ev.target.files];if(!files.length)return;let done=0;files.forEach(f=>{const img=new Image(),url=URL.createObjectURL(f);img.onload=()=>{const c=document.createElement('canvas'),max=960;let w=img.width,h=img.height;if(w>max){h=Math.round(h*max/w);w=max;}if(h>max){w=Math.round(w*max/h);h=max;}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);wPhotos.push(c.toDataURL('image/jpeg',.78));URL.revokeObjectURL(url);done++;if(done===files.length){renderWPhotos();toast(`📷 ${done}`);}};img.src=url;});ev.target.value='';}
function renderWPhotos(){document.getElementById('wph-thumbs').innerHTML=wPhotos.map((s,i)=>`<div class="wpt"><img src="${s}" alt="" onclick="openLBW(${i})"/><button class="wptx" onclick="rmPhoto(${i})">×</button></div>`).join('');}
function rmPhoto(i){wPhotos.splice(i,1);renderWPhotos();}

/* LIGHTBOX */
function openLBE(id,idx,ev){ev.stopPropagation();const e=entries.find(x=>x.id===id);if(!e?.photos?.length)return;lbPh=e.photos;lbI=idx;showLB();}
function openLBW(idx){lbPh=wPhotos;lbI=idx;showLB();}
function showLB(){document.getElementById('lbimg').src=lbPh[lbI];document.getElementById('lbc').textContent=`${lbI+1} / ${lbPh.length}`;document.getElementById('lb').classList.remove('hidden');document.querySelector('.lbp').style.display=lbPh.length>1?'flex':'none';document.querySelector('.lbn').style.display=lbPh.length>1?'flex':'none';}
function closeLB(){document.getElementById('lb').classList.add('hidden');}
function lbN(d,ev){if(ev)ev.stopPropagation();lbI=(lbI+d+lbPh.length)%lbPh.length;showLB();}

/* CATEGORIES */
async function addCat(){const inp=document.getElementById('ncat'),n=inp.value.trim();if(!n||cats.includes(n))return;cats.push(n);await saveData();inp.value='';renderCats();renderFpills();updCatSel();toast('📁 '+n);}
async function delCat(c){if(!confirm(`"${c}" ${t('delete')}?`))return;cats=cats.filter(x=>x!==c);entries=entries.map(e=>e.category===c?{...e,category:''}:e);await saveData();if(fil===c)fil='all';renderCats();renderFpills();updCatSel();renderView();}
function renderCats(){const l=document.getElementById('cat-list');if(!cats.length){l.innerHTML=`<div class="empty-wrap"><div class="empty-ico">📂</div><div class="empty-s">${t('noFolders')}</div></div>`;return;}l.innerHTML=cats.map(c=>{const cnt=entries.filter(e=>e.category===c).length;return `<div class="ci"><div class="ci-l"><div class="ci-dot"></div><span class="ci-name">${esc(c)}</span><span class="ci-cnt"> ${cnt}</span></div><button class="ci-del" onclick="delCat('${esc(c)}')">×</button></div>`;}).join('');}
function updCatSel(){const s=document.getElementById('wcat'),cur=s.value;s.innerHTML=`<option value="">${t('folders')+'...'}</option>`;cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent='📁 '+c;s.appendChild(o);});s.value=cur;}

/* REMINDER */
function setRem(){const tv=document.getElementById('wrem').value;if(!tv)return;if(!('Notification' in window))return;Notification.requestPermission().then(p=>{if(p==='granted'){const[h,m]=tv.split(':').map(Number),now=new Date(),tgt=new Date();tgt.setHours(h,m,0,0);if(tgt<=now)tgt.setDate(tgt.getDate()+1);setTimeout(()=>new Notification('Daftar',{body:t('reminder'),icon:'icons/icon-192.png'}),tgt-now);document.getElementById('wrem-st').textContent=`⏰ ${tv}`;toast('⏰');}});}
function openDailyRem(){const s=LR(UK(CU.username,'daily_rem'),null);if(s)document.getElementById('dtime').value=s;document.getElementById('mdr-rem').classList.toggle('hidden',!s);openM('m-daily');}
function saveDailyR(){const tv=document.getElementById('dtime').value;if(!tv)return;Notification.requestPermission().then(p=>{if(p==='granted'){SR(UK(CU.username,'daily_rem'),tv);updateSettingsUI();closeM('m-daily');toast('🔔 '+tv);}});}
function removeDailyR(){localStorage.removeItem(UK(CU.username,'daily_rem'));updateSettingsUI();closeM('m-daily');toast('🔕');}

/* SHARE */
function shareEntry(){const e=EID?entries.find(x=>x.id===EID):null;const title=e?e.title:document.getElementById('wtit').value;const body=e?e.body:document.getElementById('wbody').value;if(!title&&!body)return;const tags=(e?.tags||wTags).map(t2=>'#'+t2).join(' ');shareText=`📋 ${title}\n${fdl((e?.date)||new Date().toISOString(),getLang())}${tags?' · '+tags:''}\n${'─'.repeat(28)}\n${body}\n\n— Daftar v11`;document.getElementById('shprev').textContent=shareText;document.getElementById('msh-ttl').textContent=t('share');openM('m-share');}
async function doShare(){if(navigator.share){try{await navigator.share({title:shareText.split('\n')[0].slice(2),text:shareText});closeM('m-share');}catch(e){if(e.name!=='AbortError')copyShare();}}else copyShare();}
function copyShare(){navigator.clipboard?.writeText(shareText).then(()=>{toast('📋 '+t('copied'));closeM('m-share');});}

/* STATS */
function calcStreak(){let s=0;const d=new Date();while(true){const k=d.toISOString().slice(0,10);if(entries.some(e=>e.date?.startsWith(k))){s++;d.setDate(d.getDate()-1);}else break;}return s;}
function renderStats(){
  const str=calcStreak(),allW=entries.reduce((s,e)=>s+wc(e.body||''),0);
  document.getElementById('k1').textContent=entries.length;
  document.getElementById('k2').textContent=entries.filter(e=>e.date?.startsWith(new Date().toISOString().slice(0,7))).length;
  document.getElementById('k3').textContent=str+'🔥';
  document.getElementById('k4').textContent=allW.toLocaleString();
  document.getElementById('k5').textContent=Math.round(allW/200)+' '+t('statMin');
  document.getElementById('k6').textContent=entries.length?Math.round(allW/entries.length):0;
  renderSVGChart();renderMTL();renderCBars();renderTopList();renderTagCloud();renderWriteTimeStats();
}
function renderSVGChart(){
  const svg=document.getElementById('wchart-svg');if(!svg)return;
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().slice(0,10);days.push({l:fds(d),n:entries.filter(e=>e.date?.startsWith(k)).length,t:i===0});}
  const max=Math.max(...days.map(d=>d.n),1);const W=280,H=80,pad=6,bw=Math.floor((W-pad*(days.length+1))/days.length);
  let html='';
  days.forEach((d,i)=>{const bh=Math.max(3,Math.round(d.n/max*(H-20)));const x=pad+i*(bw+pad);const y=H-20-bh;html+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="3" fill="${d.t?'var(--gold)':'var(--chart1)'}"/>`;html+=`<text x="${x+bw/2}" y="${H-4}" text-anchor="middle" fill="var(--text3)" font-size="8">${d.l}</text>`;if(d.n)html+=`<text x="${x+bw/2}" y="${y-3}" text-anchor="middle" fill="var(--text2)" font-size="7">${d.n}</text>`;});
  svg.innerHTML=html;
}
function renderMTL(){const b=document.getElementById('mtl');const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().slice(0,10);days.push({n:d.getDate(),m:moods[k]});}b.innerHTML=days.map(d=>`<div class="mtd"><div class="mtde">${d.m?me(d.m):'·'}</div><div class="mtdl">${d.n}</div></div>`).join('');}
function renderCBars(){const b=document.getElementById('cbars');if(!cats.length){b.innerHTML=`<div style="font-size:12px;color:var(--text3)">${t('noFolders')}</div>`;return;}const max=Math.max(...cats.map(c=>entries.filter(e=>e.category===c).length),1);b.innerHTML=cats.map(c=>{const n=entries.filter(e=>e.category===c).length;return `<div class="cbr"><div class="cbl">${esc(c)}</div><div class="cbt"><div class="cbf" style="width:${Math.round(n/max*100)}%"></div></div><div class="cbn">${n}</div></div>`;}).join('');}
function renderTopList(){const b=document.getElementById('toplist');const sorted=[...entries].filter(e=>!e.locked&&e.body).sort((a,bb)=>wc(bb.body)-wc(a.body)).slice(0,5);if(!sorted.length){b.innerHTML='—';return;}const lang=getLang();b.innerHTML=sorted.map((e,i)=>`<div class="tli" onclick="editEntry('${e.id}')"><div class="tli-num">${i+1}</div><div style="flex:1"><div class="tli-title">${esc(e.title||t('noTitle'))}</div><div class="tli-words">${wc(e.body)} ${lang==='ru'?'слов':'so\'z'} · ~${rt(e.body)} ${t('statMin')}</div></div></div>`).join('');}
function renderTagCloud(){const b=document.getElementById('tag-cloud');const counts={};entries.forEach(e=>(e.tags||[]).forEach(tag=>{counts[tag]=(counts[tag]||0)+1;}));const sorted=Object.entries(counts).sort((a,bb)=>bb[1]-a[1]).slice(0,20);if(!sorted.length){b.innerHTML=`<div style="font-size:12px;color:var(--text3)">${t('noTags')}</div>`;return;}const max=sorted[0][1];b.innerHTML=sorted.map(([tag,cnt])=>`<span class="tc-item${cnt===max?' tc-big':cnt<=1?' tc-sm':''}" onclick="fil='tag:'+${JSON.stringify(tag)};openScreen('home');renderFpills();renderView()">#${esc(tag)} <small>${cnt}</small></span>`).join('');}

/* WRITE TIME STATS (new) */
function renderWriteTimeStats(){
  const b=document.getElementById('wt-stat-cards');
  const withTime=entries.filter(e=>e.writeTime>0);
  const total=withTime.reduce((s,e)=>s+e.writeTime,0);
  const avg=withTime.length?Math.round(total/withTime.length):0;
  const best=withTime.length?Math.max(...withTime.map(e=>e.writeTime)):0;
  b.innerHTML=`
    <div class="wt-card"><span class="wt-card-v">${fmtTime(total)}</span><span class="wt-card-l">${t('wtTotal')}</span></div>
    <div class="wt-card"><span class="wt-card-v">${fmtTime(avg)}</span><span class="wt-card-l">${t('wtAvg')}</span></div>
    <div class="wt-card"><span class="wt-card-v">${fmtTime(best)}</span><span class="wt-card-l">Best</span></div>`;
}

/* PROFILE */
function renderProfile(){
  if(!CU)return;
  document.getElementById('pav').textContent=CU.name[0].toUpperCase();
  document.getElementById('pname').textContent=CU.name;
  document.getElementById('puname').textContent='@'+CU.username;
  document.getElementById('psince').textContent=new Date(CU.joined).toLocaleDateString(getLang()==='ru'?'ru-RU':getLang()==='en'?'en-US':'uz-UZ',{year:'numeric',month:'long'});
  const earned=BADGES.filter(b=>b.check());
  document.getElementById('pbadges').innerHTML=earned.map(b=>`<span class="pbadge">${b.ico} ${b.lbl}</span>`).join('');
  updateSettingsUI();
}
function showUsers(){const users=GU();document.getElementById('ulist').innerHTML=Object.keys(users).map(u=>{const isCur=u===CU?.username;const d=new Date(users[u].joined).toLocaleDateString('uz-UZ',{year:'numeric',month:'short'});return `<div class="ui"><div class="uiav">${u[0].toUpperCase()}</div><div><div class="uiname">${esc(users[u].name)}${isCur?`<span class="uiyou">you</span>`:''}</div><div class="uisub">@${esc(u)} · ${d}</div></div></div>`;}).join('');openM('m-users');}
function openChPass(){openM('m-chpass');}
async function chPass(){const o=document.getElementById('cpold').value,n1=document.getElementById('cpnew').value,n2=document.getElementById('cpnew2').value;if(!o||!n1){showErr('cperr','!');return;}const us=GU(),u=us[CU.username];if(await CryptoUtil.hashPassword(CU.username,o)!==u.hash){showErr('cperr',t('wrongPass'));return;}if(n1.length<6){showErr('cperr',t('passMin'));return;}if(n1!==n2){showErr('cperr',t('passMatch'));return;}us[CU.username].hash=await CryptoUtil.hashPassword(CU.username,n1);SU(us);CP=n1;await saveData();closeM('m-chpass');toast('✓');}

/* BACKUP */
function expBackup(){download(JSON.stringify({entries,cats,moods,allTags,user:CU.username,at:new Date().toISOString(),v:9},null,2),`daftar-v9-${CU.username}-${td()}.json`,'application/json');toast('💾');}
async function impBackup(ev){const f=ev.target.files[0];if(!f)return;try{const obj=JSON.parse(await f.text());if(!obj.entries){toast(t('badFile'));return;}if(!confirm(`${obj.entries.length} ${t('confirmImport')}`))return;entries=obj.entries||[];cats=obj.cats||[];moods=obj.moods||{};allTags=obj.allTags||[];await saveData();setGreeting();renderFpills();renderView();renderCats();toast(`✅ ${entries.length}`);}catch{toast(t('badFile'));}ev.target.value='';}
function download(c,n,tp){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:tp}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

/* DELETE ACCOUNT */
async function delAccount(){if(!confirm(t('confirmDeleteAcc')))return;if(!confirm(t('confirmDeleteAcc2')))return;Object.keys(localStorage).filter(k=>k.startsWith(`df11_${CU.username}_`)).forEach(k=>localStorage.removeItem(k));const us=GU();delete us[CU.username];SU(us);if(localStorage.getItem(G.L)===CU.username)localStorage.removeItem(G.L);CU=null;CP='';entries=[];cats=[];moods={};allTags=[];toast('🗑');showAuth();}

/* end */

/* ══════════════════════════════════════
   DAFTAR V10 — NEW FEATURES
   ══════════════════════════════════════ */

/* ── CONFETTI ── */
function launchConfetti(){
  const cv=document.getElementById('confetti-canvas');
  if(!cv)return;
  cv.classList.remove('hidden');
  cv.width=window.innerWidth;cv.height=window.innerHeight;
  const ctx=cv.getContext('2d');
  const colors=['#5a9040','#c8a840','#d05040','#4080d0','#9040c0','#40a090','#e06020'];
  const pieces=Array.from({length:120},()=>({
    x:Math.random()*cv.width,y:-20,
    vx:(Math.random()-0.5)*5,vy:Math.random()*4+3,
    r:Math.random()*6+3,
    color:colors[Math.floor(Math.random()*colors.length)],
    rot:Math.random()*360,vr:(Math.random()-0.5)*8,
    shape:Math.random()<0.5?'rect':'circle',
    alpha:1
  }));
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    let alive=false;
    pieces.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.vy+=0.12;
      if(frame>60)p.alpha=Math.max(0,p.alpha-0.015);
      if(p.y<cv.height+20)alive=true;
      ctx.save();ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;
      ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
      if(p.shape==='rect'){ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);}
      else{ctx.beginPath();ctx.arc(0,0,p.r/1.5,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    });
    frame++;
    if(alive&&frame<200)requestAnimationFrame(draw);
    else{ctx.clearRect(0,0,cv.width,cv.height);cv.classList.add('hidden');}
  }
  draw();
  // Haptic
  if(navigator.vibrate)navigator.vibrate([30,15,50]);
}

/* ── HAPTIC ── */
function haptic(pattern=[20]){if(navigator.vibrate)navigator.vibrate(pattern);}

/* ── PAGE TRANSITIONS ── */
let _lastScreen='home';
const _origOpenScreen=openScreen;
openScreen=function(name){
  const prev=document.getElementById('sc-'+_lastScreen);
  const next=document.getElementById('sc-'+name);
  if(prev&&next&&_lastScreen!==name){
    prev.classList.add('slide-out-left');
    next.classList.add('slide-in');
    setTimeout(()=>{
      prev.classList.remove('slide-out-left');
      _origOpenScreen(name);
      requestAnimationFrame(()=>next.classList.remove('slide-in'));
    },120);
  } else {
    _origOpenScreen(name);
  }
  _lastScreen=name;
  haptic([8]);
};

/* ── PARALLAX SCROLL ── */
(function(){
  let ticking=false;
  window.addEventListener('scroll',()=>{
    if(!ticking){
      requestAnimationFrame(()=>{
        const hero=document.querySelector('.home-hero');
        if(hero&&document.getElementById('sc-home').classList.contains('active')){
          const py=Math.min(window.scrollY*0.3,40);
          hero.style.transform=`translateY(${py}px)`;
          hero.style.opacity=Math.max(0.4,1-window.scrollY/200);
        }
        ticking=false;
      });
      ticking=true;
    }
  },{passive:true});
})();

/* ── WPM (Words Per Minute) ── */
let wpmHistory=[],wpmLast=0,wpmLastWc=0,wpmBestVal=0,wpmTimer2=null;
function startWPM(){
  wpmLast=Date.now();wpmLastWc=0;wpmHistory=[];
  clearInterval(wpmTimer2);
  wpmTimer2=setInterval(()=>{
    const body=document.getElementById('wbody');if(!body)return;
    const now=Date.now(),words=wc(body.value||'');
    const mins=(now-wpmLast)/60000;
    const speed=mins>0.02?Math.round(words/mins):0;
    wpmHistory.push(speed);if(wpmHistory.length>20)wpmHistory.shift();
    const avg=wpmHistory.length?Math.round(wpmHistory.reduce((a,b)=>a+b,0)/wpmHistory.length):0;
    if(avg>wpmBestVal)wpmBestVal=avg;
    const el=document.getElementById('wpm-live');
    const bar=document.getElementById('wpm-bar');
    if(el){el.textContent=avg;}
    if(bar){bar.classList.toggle('fast',avg>60);}
    const best=document.getElementById('wpm-best');
    if(best&&wpmBestVal>0)best.textContent=`🏆 ${wpmBestVal} ${t('wpmBest')}`;
    wpmLastWc=words;
  },2000);
}
function stopWPM(){clearInterval(wpmTimer2);wpmTimer2=null;}

// Override newEntry and editEntryDirect to start WPM
const _origNewEntry=newEntry;
newEntry=function(){_origNewEntry();startWPM();};
const _origEditDirect=editEntryDirect;
editEntryDirect=function(id){_origEditDirect(id);startWPM();};
const _origGoBack=goBack;
goBack=function(){stopWPM();_origGoBack();};

// Store WPM in entry
const _origSaveEntry=saveEntry;
saveEntry=async function(){
  // inject avg wpm into current entry before save
  if(wpmHistory.length){
    const avg=Math.round(wpmHistory.reduce((a,b)=>a+b,0)/wpmHistory.length);
    window._wpmAvg=avg;
  }
  await _origSaveEntry();
  stopWPM();
  launchConfetti();
};

/* ── LOCATION ── */
let wLocation=null;
function addLocation(){
  if(!navigator.geolocation){toast(t('locationNeed'));return;}
  haptic([15]);
  const btn=document.getElementById('loc-btn');btn.textContent='📍...';
  navigator.geolocation.getCurrentPosition(pos=>{
    wLocation={lat:pos.coords.latitude.toFixed(4),lng:pos.coords.longitude.toFixed(4)};
    btn.textContent='📍 ✓';btn.classList.add('active');
    const info=document.getElementById('loc-info');
    info.textContent=`${wLocation.lat}, ${wLocation.lng}`;
    info.classList.remove('hidden');
    toast(t('locationSaved'));haptic([10,5,20]);
    // Try reverse geocode (nominatim - free)
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${wLocation.lat}&lon=${wLocation.lng}&format=json`)
      .then(r=>r.json()).then(d=>{
        const city=d.address?.city||d.address?.town||d.address?.village||d.address?.county||'';
        const country=d.address?.country||'';
        if(city){wLocation.name=city+(country?', '+country:'');info.textContent='📍 '+wLocation.name;}
      }).catch(()=>{});
  },()=>{toast(t('locationNeed'));btn.textContent='📍 <span data-i="locationAdd"></span>';});
}

/* ── WEATHER ── */
let wWeather=null;
async function addWeather(){
  if(!navigator.geolocation){toast(t('locationNeed'));return;}
  const btn=document.getElementById('wx-btn');btn.textContent='🌤...';haptic([10]);
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const lat=pos.coords.latitude,lon=pos.coords.longitude;
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&forecast_days=1`;
      const res=await fetch(url);const d=await res.json();
      const cw=d.current_weather;
      const code=cw.weathercode,temp=Math.round(cw.temperature);
      const wIcon=code<=1?'☀️':code<=3?'⛅':code<=49?'🌫':code<=69?'🌧':code<=79?'🌨':code<=99?'⛈':'🌤';
      wWeather={temp,icon:wIcon,code,wind:Math.round(cw.windspeed)};
      const dataEl=document.getElementById('wx-data');
      if(dataEl)dataEl.textContent=`${wIcon} ${temp}°C`;
      btn.classList.add('active');
      toast(`${wIcon} ${temp}°C · 💨 ${wWeather.wind}km/h`);haptic([10,5,20]);
    }catch(e){toast(t('weatherFail'));btn.textContent='🌤 Ob-havo';}
  },()=>{toast(t('locationNeed'));});
}

/* ── MUSIC ── */
let wMusic=null;
function openMusicInput(){openM('m-music');setTimeout(()=>document.getElementById('music-inp').focus(),200);}
function saveMusic(){
  const v=document.getElementById('music-inp').value.trim();if(!v)return;
  wMusic=v;closeM('m-music');
  document.getElementById('music-lbl').textContent='🎵 '+v.slice(0,22);
  document.getElementById('music-btn').classList.add('active');
  haptic([15]);toast('🎵 '+v);
}

/* Override saveEntry to include new fields (location, weather, music, wpm) */
const _orig2SaveEntry=saveEntry; // patch via modifying obj directly
// We patch the obj construction by overriding after the fact
// Actually let's patch saveData side — simpler: hook into entries push via mutation observer
// Instead: we extend by patching the entry-building inside saveEntry
// Since app.js builds obj inline, let's add a post-save hook that updates the last entry
const _realSave=saveEntry;
saveEntry=async function(){
  await _realSave();
  // patch most recent entry with v10 fields
  if(entries.length){
    const last=entries[0];
    if(wLocation){last.location={...wLocation};wLocation=null;document.getElementById('loc-btn').textContent='📍 <span data-i="locationAdd"></span>';document.getElementById('loc-btn').classList.remove('active');document.getElementById('loc-info').classList.add('hidden');}
    if(wWeather){last.weather={...wWeather};wWeather=null;document.getElementById('wx-data').textContent='Ob-havo';document.getElementById('wx-btn').classList.remove('active');}
    if(wMusic){last.music=wMusic;wMusic=null;document.getElementById('music-lbl').textContent='Musiqa';document.getElementById('music-btn').classList.remove('active');}
    if(window._wpmAvg){last.wpm=window._wpmAvg;window._wpmAvg=null;}
    await saveData();
  }
};

/* ── BIRTHDAY TRACKER ── */
function getBdays(){return LR('df11_bdays',[]); }
function saveBdays(b){SR('df11_bdays',b);}
function addBday(){
  const name=document.getElementById('bday-name').value.trim();
  const date=document.getElementById('bday-date').value;
  if(!name||!date){toast('!');return;}
  const bdays=getBdays();bdays.push({id:Date.now().toString(),name,date});saveBdays(bdays);
  document.getElementById('bday-name').value='';document.getElementById('bday-date').value='';
  renderBdays();toast('🎂 '+name);haptic([20]);
}
function removeBday(id){const b=getBdays().filter(x=>x.id!==id);saveBdays(b);renderBdays();}
function renderBdays(){
  const list=document.getElementById('bday-list');if(!list)return;
  const bdays=getBdays();
  if(!bdays.length){list.innerHTML=`<div style="text-align:center;padding:16px;font-size:12px;color:var(--text3)">🎂 ${t('bdayAdd')} ...</div>`;return;}
  const today=new Date();today.setHours(0,0,0,0);
  const items=bdays.map(b=>{
    const parts=b.date.split('-');const bd=new Date(today.getFullYear(),+parts[1]-1,+parts[2]);
    if(bd<today)bd.setFullYear(today.getFullYear()+1);
    const diff=Math.round((bd-today)/86400000);
    const isToday=diff===0,isTomorrow=diff===1;
    return {b,diff,isToday,isTomorrow};
  }).sort((a,b2)=>a.diff-b2.diff);
  list.innerHTML=items.map(({b,diff,isToday,isTomorrow})=>`
    <div class="bday-item">
      <div class="bday-cake">${isToday?'🎂':isTomorrow?'🎁':'🎈'}</div>
      <div class="bday-info">
        <div class="bday-name">${esc(b.name)}</div>
        <div class="bday-sub">${b.date.slice(5).replace('-','.')}</div>
      </div>
      <span class="bday-badge ${isToday?'today':'soon'}">${isToday?t('bdayToday'):isTomorrow?t('bdayTomorrow'):diff+' '+t('bdayDays')}</span>
      <button class="bday-del" onclick="removeBday('${b.id}')">×</button>
    </div>`).join('');
  // update settings badge
  const si=document.getElementById('si-bday-val');if(si)si.textContent=bdays.length;
  // notify for today's birthdays
  const todayBdays=items.filter(x=>x.isToday);
  if(todayBdays.length&&Notification.permission==='granted'){
    todayBdays.forEach(({b})=>new Notification('🎂 '+b.name,{body:t('bdayToday'),icon:'icons/icon-192.png'}));
  }
}
// Override openM for bday to render
const _origOpenM=openM;
openM=function(id){_origOpenM(id);if(id==='m-bday')renderBdays();};

/* ── AI DAILY QUESTION ── */
const DAILY_QUESTIONS={
  uz:['Bugun nima uchun minnatdormansiz?','Bugun qanday qiyinchilik yengdingiz?','Bugun kim yoki nima sizni xursand qildi?','Bugun o\'zingiz haqingizda nima yangi bilib oldingiz?','Bir oy keyin o\'zingizga qanday xat yozgan bo\'lar edingiz?','Bugun qaysi qaroringizdan mamnunsiz?','Bugun qanday so\'zlar sizga kuch berdi?','Ertaga nima uchun xursand bo\'lasiz?'],
  ru:['За что вы благодарны сегодня?','Какую трудность вы преодолели сегодня?','Что или кто порадовало вас сегодня?','Что нового вы узнали о себе сегодня?','Какое решение вас порадовало сегодня?','Что придаёт вам силы?','Чему вы ждёте завтра?','Как вы можете улучшить завтрашний день?'],
  en:['What are you grateful for today?','What challenge did you overcome today?','What or who made you smile today?','What did you learn about yourself today?','Which decision are you proud of today?','What words gave you strength today?','What are you looking forward to tomorrow?','How can you make tomorrow better?'],
};
function showAIDailyQ(){
  const lang=getLang();const qs=DAILY_QUESTIONS[lang]||DAILY_QUESTIONS.uz;
  const today=td();const lastQ=LR('df11_last_q','');
  if(lastQ===today)return; // once per day
  SR('df11_last_q',today);
  const q=qs[Math.floor(Math.random()*qs.length)];
  document.getElementById('ai-q-text').textContent=q;
  document.getElementById('ai-q-ans').value='';
  document.getElementById('ai-q-ans').placeholder=t('aiQAnswer');
  setTimeout(()=>openM('m-ai-q'),800);
}
async function saveAIQ(){
  const ans=document.getElementById('ai-q-ans').value.trim();
  const q=document.getElementById('ai-q-text').textContent;
  if(ans){
    entries.unshift({id:Date.now().toString(),title:'🧠 '+q.slice(0,50),body:ans,category:'',reminder:'',mood:0,photos:[],starred:false,locked:false,pinned:false,font:'syne',stickers:[],tags:['ai-savol'],links:[],date:new Date().toISOString(),updatedAt:Date.now()});
    await saveData();renderView();toast('💾');haptic([15]);
  }
  closeM('m-ai-q');
}

/* ── AI MOOD PREDICTION ── */
async function aiMoodPredict(){
  const apiKey=localStorage.getItem('df11_ai_key');
  if(!apiKey){openAISettings();return;}
  const last7=entries.slice(0,14).map(e=>`${e.date?.slice(0,10)||''}: mood=${e.mood||'?'}, "${(e.body||'').slice(0,80)}"`).join('\n');
  const lang=getLang();
  const prompt=`Based on these journal entries and moods, predict the user's mood for tomorrow and give a brief supportive message. Respond in ${lang==='uz'?"O'zbek":lang==='ru'?'Russian':'English'} in 2-3 sentences. Be warm and encouraging.\n\n${last7}`;
  document.getElementById('ai-thinking').classList.remove('hidden');
  openAIPanel();
  await callGemini(prompt,apiKey);
}

/* ── AI AUTO TITLE ── */
async function aiAutoTitle(){
  const apiKey=localStorage.getItem('df11_ai_key');
  if(!apiKey){openAISettings();return;}
  const body=document.getElementById('wbody').value||'';
  if(body.length<20){toast('Avval birozgina yozing...');return;}
  const lang=getLang();
  const prompt=`Create a short, creative, evocative title (max 8 words) for this journal entry. Language: ${lang==='uz'?"O'zbek":lang==='ru'?'Russian':'English'}. Output ONLY the title, nothing else:\n\n${body.slice(0,500)}`;
  toast('🤖 Sarlavha yaratilmoqda...');haptic([10]);
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.9,maxOutputTokens:30}})
    });
    const data=await res.json();
    const title=data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/['"]/g,'')||'';
    if(title){
      document.getElementById('wtit').value=title;
      toast('✨ '+title);haptic([10,5,15]);
    }
  }catch(e){toast('❌');}
}

/* ── RENDER ENHANCEMENTS for ecards (location, weather, music) ── */
// Override renderHome to show extra badges
const _origRenderHome=renderHome;
renderHome=function(){
  _origRenderHome();
  // patch cards with v10 data
  const now=new Date();
  const shown=entries.filter(e=>{
    if(e.locked)return false;
    if(e.scheduled&&new Date(e.scheduled)>now)return false;
    return true;
  });
  // re-add extra info by modifying DOM cards after render
  // simpler: override the card HTML generation fully
  // Since we can't easily do that without duplicating, let's just patch via data attr
};

// Better: completely re-render with v10 extras
renderHome=function(){
  const g=document.getElementById('ecards');
  const now=new Date();
  let shown=entries.filter(e=>{
    if(e.locked)return false;
    if(e.scheduled&&new Date(e.scheduled)>now)return fil==='scheduled';
    return true;
  });
  if(fil==='starred')shown=shown.filter(e=>e.starred);
  else if(fil==='pinned')shown=shown.filter(e=>e.pinned);
  else if(fil==='scheduled')shown=entries.filter(e=>e.scheduled&&new Date(e.scheduled)>now);
  else if(fil.startsWith('tag:'))shown=shown.filter(e=>(e.tags||[]).includes(fil.slice(4)));
  else if(fil!=='all')shown=shown.filter(e=>e.category===fil);
  shown=[...shown.filter(e=>e.pinned&&!e.scheduled),...shown.filter(e=>!e.pinned)];
  if(!shown.length){g.innerHTML=`<div class="empty-wrap"><div class="empty-ico">📖</div><div class="empty-t">${t('emptyTitle')}</div><div class="empty-s">${t('emptySub')}</div><button class="empty-btn" onclick="newEntry()">${t('start')}</button></div>`;return;}
  const lang=getLang();
  g.innerHTML=shown.map((e,i)=>{
    const ph=e.photos||[];const stks=(e.stickers||[]).join('');
    const tags=(e.tags||[]).map(tag=>`<span class="ec-usertag">#${esc(tag)}</span>`).join('');
    const pgrid=ph.length?buildPhotoGrid(e.id,ph):'';
    const schedBadge=e.scheduled?`<span class="ec-sched-badge">🕐 ${new Date(e.scheduled).toLocaleDateString()}</span>`:'';
    const linkBadge=e.links?.length?`<span class="ectag">🔗 ${e.links.length}</span>`:'';
    const locBadge=e.location?`<span class="ec-loc">📍 ${esc(e.location.name||e.location.lat+','+e.location.lng)}</span>`:'';
    const wxBadge=e.weather?`<span class="ectag">${e.weather.icon} ${e.weather.temp}°</span>`:'';
    const musicBadge=e.music?`<span class="music-chip"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>${esc(e.music.slice(0,20))}</span>`:'';
    const wpmBadge=e.wpm?`<span class="ec-wpm">⌨ ${e.wpm} wpm</span>`:'';
    return `<div class="ecard${e.pinned?' is-pinned':''}" style="animation-delay:${i*.03}s" onclick="editEntry('${e.id}')">
      <div class="ec-r1">
        <div class="ec-tit">${e.pinned?'📌 ':''}${esc(e.title||t('noTitle'))}${stks?` <span style="font-size:11px">${stks}</span>`:''}</div>
        <div class="ec-meta"><div class="ec-date">${fd(e.date,lang)}</div><div class="ec-icons">${e.mood?`<span>${me(e.mood)}</span>`:''}${e.starred?'<span style="color:var(--gold)">★</span>':''}</div></div>
      </div>
      ${e.body?`<div class="ec-body">${esc(e.body.slice(0,140).replace(/[#*`>~_]/g,''))}</div>`:''}
      <div class="ec-footer">${e.category?`<span class="ectag">📁 ${esc(e.category)}</span>`:''}${tags}${schedBadge}${linkBadge}${e.writeTime?`<span class="ec-rt">⏱${fmtTime(e.writeTime)}</span>`:''}${wpmBadge}</div>
      ${locBadge||wxBadge||musicBadge?`<div class="ec-footer" style="margin-top:3px">${locBadge}${wxBadge}${musicBadge}</div>`:''}
      ${pgrid}
    </div>`;
  }).join('');
};

/* ── LAUNCH HOOK — show daily question ── */
const _origLaunchApp=launchApp;
launchApp=function(){
  _origLaunchApp();
  setTimeout(()=>showAIDailyQ(),1500);
  renderBdays();
};

/* ── OVERRIDE SAVE to trigger confetti properly ── */
// confetti already triggered in the earlier saveEntry override — done

/* ── SETTINGS UPDATE for v10 ── */
const _origUpdateSettings=updateSettingsUI;
updateSettingsUI=function(){
  _origUpdateSettings();
  const bdays=getBdays();
  const si=document.getElementById('si-bday-val');if(si)si.textContent=bdays.length+' ta';
  // check bday notifications
  const today=new Date();today.setHours(0,0,0,0);
  const todayStr=td();
  bdays.forEach(b=>{
    const parts=b.date.split('-');
    const bd=new Date(today.getFullYear(),+parts[1]-1,+parts[2]);
    if(bd.toISOString().slice(0,10)===todayStr){
      toast('🎂 Bugun '+b.name+' tugʻilgan kuni!');
    }
  });
};

console.log('Daftar v11 loaded ✓ — Confetti · Parallax · WPM · Location · Weather · Music · Birthday · AI Daily Q · AI Auto Title · AI Mood Predict');

/* ══════════════════════════════════════════════════════
   DAFTAR V11 — 100+ YANGI FUNKSIYALAR
   ══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   1. FOCUS MODE
───────────────────────────────────────── */
let focusMode=false;
function toggleFocus(){
  focusMode=!focusMode;
  document.body.classList.toggle('focus-mode',focusMode);
  const btn=document.getElementById('hb-focus');
  if(focusMode){
    toast(t('focusModeOn'));haptic([10,5,20]);
    if(!document.getElementById('focus-exit')){
      const b=document.createElement('button');b.id='focus-exit';b.className='focus-exit';
      b.textContent='✕ Focus';b.onclick=toggleFocus;document.body.appendChild(b);
    }
  } else {
    toast(t('focusModeOff'));
    document.getElementById('focus-exit')?.remove();
  }
}

/* ─────────────────────────────────────────
   2. READING MODE
───────────────────────────────────────── */
function openReadingMode(entry){
  const lang=getLang();
  const overlay=document.createElement('div');
  overlay.className='reading-mode-overlay';
  overlay.id='reading-mode';
  // reading progress bar
  const prog=document.createElement('div');prog.className='read-progress';prog.id='read-prog';overlay.appendChild(prog);
  const close=document.createElement('button');close.className='rm-close';close.textContent='✕ '+t('readingMode');close.onclick=()=>overlay.remove();overlay.appendChild(close);
  const content=document.createElement('div');content.className='rm-content';
  const mood=entry.mood?`<span>${me(entry.mood)}</span>`:'';
  const loc=entry.location?`<span>📍 ${esc(entry.location.name||entry.location.lat)}</span>`:'';
  const wx=entry.weather?`<span>${entry.weather.icon} ${entry.weather.temp}°C</span>`:'';
  const music=entry.music?`<span>🎵 ${esc(entry.music)}</span>`:'';
  content.innerHTML=`
    <div class="rm-title">${esc(entry.title||t('noTitle'))}</div>
    <div class="rm-meta">${mood}<span>${fd(entry.date,lang)}</span>${loc}${wx}${music}</div>
    <div class="rm-body md-body">${MD.render(entry.body||'')}</div>
    ${(entry.tags||[]).length?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:20px">${(entry.tags||[]).map(tag=>`<span class="ec-usertag">#${esc(tag)}</span>`).join('')}</div>`:''}
    ${entry.photos?.length?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:20px">${entry.photos.map(p=>`<img src="${p}" style="width:100%;border-radius:10px;object-fit:cover;aspect-ratio:4/3"/>`).join('')}</div>`:''}`;
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  // progress bar on scroll
  overlay.addEventListener('scroll',()=>{
    const p=document.getElementById('read-prog');if(!p)return;
    const pct=overlay.scrollTop/(overlay.scrollHeight-overlay.clientHeight)*100;
    p.style.width=Math.min(100,pct)+'%';
  });
}

/* ─────────────────────────────────────────
   3. AUDIO JOURNAL
───────────────────────────────────────── */
let audioRec=null,audioChunks=[],audioBlob=null,audioUrl=null,audioTimer=null,audioSec=0;

function toggleAudioRec(){
  if(!navigator.mediaDevices?.getUserMedia){toast(t('audioNS'));return;}
  if(audioRec&&audioRec.state==='recording'){stopAudioRec();return;}
  startAudioRec();
}
async function startAudioRec(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    audioChunks=[];audioSec=0;
    audioRec=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':'audio/ogg'});
    audioRec.ondataavailable=e=>{if(e.data.size>0)audioChunks.push(e.data);};
    audioRec.onstop=()=>{
      audioBlob=new Blob(audioChunks,{type:audioRec.mimeType});
      audioUrl=URL.createObjectURL(audioBlob);
      const ap=document.getElementById('audio-playback');if(ap)ap.src=audioUrl;
      document.getElementById('audio-player-wrap').classList.remove('hidden');
      const kb=Math.round(audioBlob.size/1024);
      document.getElementById('audio-size').textContent=`🎙 ${audioSec}s · ${kb}KB`;
      stream.getTracks().forEach(t2=>t2.stop());
    };
    audioRec.start(100);
    document.getElementById('audio-rec-btn').classList.add('recording');
    document.getElementById('audio-waves').classList.remove('hidden');
    document.getElementById('audio-mic-ico').style.display='none';
    document.getElementById('audio-rec-lbl').textContent=t('audioRecording');
    haptic([15]);
    audioTimer=setInterval(()=>{
      audioSec++;
      document.getElementById('audio-rec-time').textContent=fmtTime(audioSec);
    },1000);
  }catch(e){toast('❌ Mikrofon ruxsati kerak');}
}
function stopAudioRec(){
  if(!audioRec)return;
  audioRec.stop();clearInterval(audioTimer);
  document.getElementById('audio-rec-btn').classList.remove('recording');
  document.getElementById('audio-waves').classList.add('hidden');
  document.getElementById('audio-mic-ico').style.display='';
  document.getElementById('audio-rec-lbl').textContent=t('audioRecord');
  toast(t('audioSaved'));haptic([10,5,20]);
}
function deleteAudio(){
  audioBlob=null;audioUrl=null;
  document.getElementById('audio-player-wrap').classList.add('hidden');
  document.getElementById('audio-rec-time').textContent='';
  toast('🗑');
}

/* Store audio as base64 in entry */
async function getAudioBase64(){
  if(!audioBlob)return null;
  return new Promise(res=>{const r=new FileReader();r.onloadend=()=>res(r.result);r.readAsDataURL(audioBlob);});
}

/* ─────────────────────────────────────────
   4. COLOR LABELS
───────────────────────────────────────── */
let wColorLabel='';
function setColorLabel(lbl,btn){
  wColorLabel=lbl;
  document.querySelectorAll('.cl-dot').forEach(d=>d.classList.toggle('active',d.dataset.lbl===lbl));
  haptic([8]);
}
function _applyColorLabel(){
  document.querySelectorAll('.cl-dot').forEach(d=>d.classList.toggle('active',d.dataset.lbl===wColorLabel));
}

/* ─────────────────────────────────────────
   5. TEMPLATES
───────────────────────────────────────── */
const TEMPLATES=[
  {ico:'🌅',name:'Bugun',hint:'Kundalik yozuv',title:'Bugungi kun',body:'## 😄 Yaxshi narsalar\n- \n\n## 💡 Bilib olganlarim\n- \n\n## 🎯 Ertaga rejam\n- '},
  {ico:'🙏',name:'Shukr',hint:'Minnatdorlik',title:'Bugun shukr',body:'Bugun quyidagi narsalar uchun minnatdorman:\n\n1. \n2. \n3. \n\nBugungi kuchim: '},
  {ico:'💭',name:'Fikr',hint:'Erkin yozuv',title:'Fikrlar',body:'> Bugun miyamda aylanyapti:\n\n'},
  {ico:'🎯',name:'Maqsad',hint:'Haftalik reja',title:'Bu hafta maqsadlarim',body:'## 📌 Asosiy maqsad\n\n## ✅ Bajariladigan ishlar\n- [ ] \n- [ ] \n- [ ] \n\n## 📊 Natija'},
  {ico:'💪',name:'O\'sish',hint:'O\'z-o\'zini tahlil',title:'O\'sish kundaligi',body:'**Bugun nimada oldinga qadim qo\'ydim?**\n\n\n**Qiyin bo\'lgan narsa:**\n\n\n**Ertaga boshqacha qilaman:**\n'},
  {ico:'🌙',name:'Kech',hint:'Kechki fikrlar',title:'Kechqurun',body:'Bugun qanday kun bo\'ldi?\n\n**Energiya:** /10\n**Kayfiyat:** /10\n\nEng yorqin lahza: '},
  {ico:'📚',name:'O\'qish',hint:'Kitob yozuvlari',title:'',body:'**Kitob:** \n**Muallif:** \n**Boblar:** \n\n## Asosiy fikrlar\n\n## Sevimli iqtibos\n> \n\n## Hayotga tatbiq etaman'},
  {ico:'💔',name:'Tuyg\'u',hint:'Hissiyot kundaligi',title:'Ichki olam',body:'**Hozir his qilyapman:** \n\n**Sababi ehtimol:**\n\n**Menga kerak bo\'lgan narsa:**\n\n**O\'zimga xat:**\n'},
];
function openTemplates(){
  const g=document.getElementById('tmpl-grid');
  g.innerHTML=TEMPLATES.map((tmpl,i)=>`<div class="tmpl-card" onclick="useTemplate(${i})"><div class="tmpl-ico">${tmpl.ico}</div><div class="tmpl-name">${tmpl.name}</div><div class="tmpl-hint">${tmpl.hint}</div></div>`).join('');
  openM('m-templates');
}
function useTemplate(i){
  const tmpl=TEMPLATES[i];
  document.getElementById('wtit').value=tmpl.title;
  document.getElementById('wbody').value=tmpl.body;
  closeM('m-templates');autoDraft();
  toast('📋 '+tmpl.name+' shabloni');haptic([10]);
}

/* ─────────────────────────────────────────
   6. HEATMAP (365 kun faollik)
───────────────────────────────────────── */
function renderHeatmap(){
  const wrap=document.getElementById('heatmap-wrap');if(!wrap)return;
  const weeks=[];const today=new Date();today.setHours(0,0,0,0);
  // start from 52 weeks ago, align to Monday
  const start=new Date(today);start.setDate(start.getDate()-364);
  while(start.getDay()!==1)start.setDate(start.getDate()-1);
  // build date->count map
  const dMap={};
  entries.forEach(e=>{const k=e.date?.slice(0,10);if(k)dMap[k]=(dMap[k]||0)+1;});
  const max=Math.max(...Object.values(dMap),1);
  // render
  let html='<div class="heatmap-grid">';
  const cur=new Date(start);
  while(cur<=today){
    html+='<div class="heatmap-week">';
    for(let d=0;d<7;d++){
      const k=cur.toISOString().slice(0,10);
      const cnt=dMap[k]||0;
      const lvl=cnt===0?0:cnt===1?1:cnt===2?2:cnt<=3?3:cnt<=5?4:5;
      const isToday=k===td();
      html+=`<div class="hm-cell hm-${lvl}${isToday?' hm-today':''}" title="${k}: ${cnt} yozuv"></div>`;
      cur.setDate(cur.getDate()+1);
      if(cur>today&&d<6){for(let r=d+1;r<7;r++)html+='<div class="hm-cell"></div>';break;}
    }
    html+='</div>';
    if(cur>today)break;
  }
  html+='</div>';
  wrap.innerHTML=html;
  setTxt('sst-heatmap',t('statsHeatmap'));
}

/* ─────────────────────────────────────────
   7. RADAR CHART (7 ko'rsatkich)
───────────────────────────────────────── */
function renderRadar(){
  const wrap=document.getElementById('radar-wrap');if(!wrap)return;
  setTxt('sst-radar',t('statsRadar'));
  const n=entries.length;if(!n){wrap.innerHTML='';return;}
  const totalW=entries.reduce((s,e)=>s+wc(e.body||''),0);
  const avgWpm=entries.filter(e=>e.wpm).reduce((s,e,_,a)=>s+e.wpm/a.length,0);
  const moodAvg=Object.values(moods).length?Object.values(moods).reduce((a,b)=>a+b,0)/Object.values(moods).length:0;
  const photoRate=entries.filter(e=>e.photos?.length).length/n;
  const tagRate=entries.filter(e=>e.tags?.length).length/n;
  const streakScore=Math.min(1,calcStreak()/30);
  const consistencyScore=Math.min(1,n/100);
  const labels=['Yozuv','So\'z','Kayfiyat','Foto','Teg','Streak','Faollik'];
  const vals=[
    Math.min(1,n/50),
    Math.min(1,totalW/5000),
    moodAvg/5,
    photoRate,
    tagRate,
    streakScore,
    consistencyScore
  ];
  const size=140,cx=size/2,cy=size/2,r=55;
  const PI2=Math.PI*2;
  const pts=vals.map((v,i)=>{
    const angle=PI2*i/7-Math.PI/2;
    return {x:cx+r*v*Math.cos(angle),y:cy+r*v*Math.sin(angle)};
  });
  const ptsStr=pts.map(p=>`${p.x},${p.y}`).join(' ');
  let webLines='',labelsSVG='';
  for(let ri=0.25;ri<=1;ri+=0.25){
    const ps=vals.map((_,i)=>{const a=PI2*i/7-Math.PI/2;return `${cx+r*ri*Math.cos(a)},${cy+r*ri*Math.sin(a)}`;});
    webLines+=`<polygon points="${ps.join(' ')}" fill="none" stroke="var(--border)" stroke-width=".8"/>`;
  }
  labels.forEach((lbl,i)=>{
    const a=PI2*i/7-Math.PI/2;
    const lx=cx+(r+14)*Math.cos(a),ly=cy+(r+14)*Math.sin(a);
    labelsSVG+=`<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="var(--text3)">${lbl}</text>`;
    webLines+=`<line x1="${cx}" y1="${cy}" x2="${cx+r*Math.cos(a)}" y2="${cy+r*Math.sin(a)}" stroke="var(--border)" stroke-width=".8"/>`;
  });
  wrap.innerHTML=`<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    ${webLines}
    <polygon points="${ptsStr}" fill="var(--accent3)" stroke="var(--accent2)" stroke-width="1.5" stroke-linejoin="round"/>
    ${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--accent2)"/>`).join('')}
    ${labelsSVG}
  </svg>`;
}

/* ─────────────────────────────────────────
   8. WORD FREQUENCY
───────────────────────────────────────── */
function renderWordFreq(){
  const wrap=document.getElementById('wfreq-list');if(!wrap)return;
  setTxt('sst-wfreq',t('wordFreq'));
  const stopWords=new Set(['va','bu','bir','ham','uchun','bilan','da','de','ga','ni','bo\'ldi','bo\'lib','the','and','a','an','is','in','of','to','it','that','for','on','are','was','be','have','with','as','at','by','but','not','they','we','you','from','or','had','his','her','has','its','will','my','i','he','she','we','что','это','как','все','так','его','но','она','он','мне','был','же','бы','ещё','уже','я','мы','вы','они','не','на','в','с','к','по','из','за','о','до','без']);
  const freq={};
  entries.forEach(e=>{
    (e.body||'').toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/).forEach(w=>{
      if(w.length>3&&!stopWords.has(w))freq[w]=(freq[w]||0)+1;
    });
  });
  const sorted=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,12);
  if(!sorted.length){wrap.innerHTML='';return;}
  const max=sorted[0][1];
  wrap.innerHTML=sorted.map(([w,n])=>`<div class="wfreq-item"><span class="wfreq-word">${esc(w)}</span><div class="wfreq-bar-wrap"><div class="wfreq-bar" style="width:${Math.round(n/max*100)}%"></div></div><span class="wfreq-n">${n}</span></div>`).join('');
}

/* ─────────────────────────────────────────
   9. EMOTION MAP (emoji tahlil)
───────────────────────────────────────── */
function renderEmotionMap(){
  const wrap=document.getElementById('emotion-map');if(!wrap)return;
  setTxt('sst-emotion',t('aiEmotionMap'));
  const emojiMap={
    '😊':0,'😄':0,'🥰':0,'😍':0,'😂':0,'🤣':0,'😭':0,'😢':0,'😔':0,'😞':0,
    '😤':0,'😡':0,'🤔':0,'😴':0,'🤗':0,'😌':0,'🥳':0,'😎':0,'🤩':0,'😰':0,'😱':0
  };
  entries.forEach(e=>{
    const text=(e.title||'')+(e.body||'');
    Object.keys(emojiMap).forEach(em=>{
      const count=(text.match(new RegExp(em,'g'))||[]).length;
      emojiMap[em]+=count;
    });
  });
  const found=Object.entries(emojiMap).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).slice(0,10);
  if(!found.length){wrap.innerHTML=`<div style="font-size:12px;color:var(--text3)">Hozircha emoji topilmadi</div>`;return;}
  const emotionLabels={'😊':'Xursand','😄':'Shodlik','🥰':'Sevgi','😍':'Hayrat','😂':'Kulgi','🤣':'Zavq','😭':'Ko\'z yosh','😢':'Qayg\'u','😔':'G\'am','😞':'Tushkunlik','😤':'Jahldorlik','😡':'G\'azab','🤔':'Fikr','😴':'Uyqu','🤗':'Mehr','😌':'Tinchlik','🥳':'Bayram','😎':'Zo\'r','🤩':'Sehrli','😰':'Tashvish','😱':'Qo\'rquv'};
  wrap.innerHTML=found.map(([em,n])=>`<div class="em-item"><span class="em-emoji">${em}</span><div><div class="em-label">${emotionLabels[em]||em}</div></div><span class="em-count">${n}</span></div>`).join('');
}

/* ─────────────────────────────────────────
   10. QR CODE SYNC
───────────────────────────────────────── */
function genQR(){
  // Simple QR-like visualization using canvas + data URL
  const data={user:CU?.username,entries:entries.length,backup:btoa(JSON.stringify({entries:entries.slice(0,5),cats,moods})).slice(0,200)+'...',ts:Date.now()};
  const str=JSON.stringify(data);
  document.getElementById('sync-data-box').textContent=str.slice(0,120)+'...';
  const cv=document.getElementById('qr-canvas');
  const ctx=cv.getContext('2d');
  ctx.clearRect(0,0,180,180);
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,180,180);
  // Draw a simple data pattern (not real QR but visual representation)
  ctx.fillStyle='#111111';
  const cells=21;const size=Math.floor(180/cells);
  const hash=str.split('').reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0);
  for(let r=0;r<cells;r++)for(let c=0;c<cells;c++){
    const val=((hash*(r*cells+c+1))%17+r+c)%3;
    if(val===0){ctx.fillRect(c*size+1,r*size+1,size-2,size-2);}
  }
  // Corner squares
  [[0,0],[0,cells-7],[cells-7,0]].forEach(([r2,c2])=>{
    ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.strokeRect(c2*size+2,r2*size+2,7*size-4,7*size-4);
    ctx.fillRect(c2*size+size*2,r2*size+size*2,size*3,size*3);
  });
  document.getElementById('qr-hint').textContent=`@${CU?.username} — ${entries.length} yozuv`;
}
function copyDataToClipboard(){
  const data=JSON.stringify({entries,cats,moods,allTags,user:CU?.username,v:11});
  navigator.clipboard?.writeText(data).then(()=>toast('📋 '+t('syncCopy'))).catch(()=>toast('❌'));
}

/* ─────────────────────────────────────────
   11. WIDGET PREVIEW
───────────────────────────────────────── */
function renderWidgetPreview(){
  const box=document.getElementById('widget-preview-box');if(!box)return;
  const latest=entries[0];const streak=calcStreak();
  box.innerHTML=`
    <div class="wp-wid-title">📖 DAFTAR</div>
    ${latest?`<div class="wp-wid-entry">${esc((latest.title||'Yozuv').slice(0,30))}</div><div class="wp-wid-date">${fd(latest.date,getLang())}</div>`:'<div class="wp-wid-date">Hozircha yozuv yo\'q</div>'}
    <div class="wp-wid-streak">${streak>=1?streak+'🔥':''}</div>
    <div class="wp-wid-fab">+</div>`;
}
function copyWidgetHTML(){
  const html=`<!-- Daftar v11 Widget -->\n<div id="daftar-widget" style="background:#111a10;color:#d8f0d8;border-radius:16px;padding:16px;font-family:sans-serif;width:200px">\n  <div style="font-size:10px;font-weight:800;letter-spacing:1px;color:#90a890">📖 DAFTAR</div>\n  <div style="font-size:14px;font-weight:700;margin:8px 0 4px">${esc(entries[0]?.title||'Yozuv boshlang')}</div>\n  <div style="font-size:11px;color:#708870">${calcStreak()}🔥 streak</div>\n</div>`;
  navigator.clipboard?.writeText(html).then(()=>toast('📱 Widget HTML nusxalandi')).catch(()=>toast('❌'));
}
openM=function(id){
  const orig=document.getElementById(id);
  if(!orig)return;
  orig.classList.remove('hidden');
  if(id==='m-bday')renderBdays();
  if(id==='m-widget'){renderWidgetPreview();}
  if(id==='m-qr'){genQR();}
};

/* ─────────────────────────────────────────
   12. MARKDOWN EXPORT
───────────────────────────────────────── */
function exportMarkdown(){
  const lang=getLang();
  let md=`# Daftar — @${CU?.username}\n\n*Eksport: ${new Date().toLocaleDateString()}*\n\n---\n\n`;
  entries.filter(e=>!e.locked).forEach(e=>{
    md+=`## ${e.title||t('noTitle')}\n`;
    md+=`*${fd(e.date,lang)}*`;
    if(e.mood)md+=` · ${me(e.mood)}`;
    if(e.category)md+=` · 📁 ${e.category}`;
    if(e.location?.name)md+=` · 📍 ${e.location.name}`;
    md+='\n\n';
    if(e.tags?.length)md+=e.tags.map(t2=>`#${t2}`).join(' ')+'\n\n';
    md+=(e.body||'')+'\n\n---\n\n';
  });
  const blob=new Blob([md],{type:'text/markdown'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`daftar-${CU?.username}-${td()}.md`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast('📝 Markdown eksport');
}

/* ─────────────────────────────────────────
   13. STREAK FREEZE
───────────────────────────────────────── */
function openStreakFreeze(){
  const used=LR('df11_freeze_used',false);
  const streak=calcStreak();
  if(streak>0){toast('Streak faol — himoya shart emas!');return;}
  if(used){toast(t('streakFreezeUsed'));return;}
  if(confirm('Streak himoyasini ishlatib yesterday\'ga yozuv qo\'shamizmi?')){
    const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
    entries.push({id:Date.now().toString(),title:'❄️ Streak Freeze',body:'Auto-generated',category:'',reminder:'',mood:0,photos:[],starred:false,locked:false,pinned:false,font:'syne',stickers:[],tags:['streak-freeze'],links:[],date:yesterday.toISOString(),updatedAt:Date.now()});
    SR('df11_freeze_used',true);saveData();renderView();toast('🧊 '+t('streakFreezeUsed'));
  }
}
function getStreakFreezeInfo(){return LR('df11_freeze_used',false)?'Ishlatilgan':'1 ta mavjud';}

/* ─────────────────────────────────────────
   14. AI WEEKLY SUMMARY
───────────────────────────────────────── */
async function aiWeekSummary(){
  const apiKey=localStorage.getItem('df11_ai_key');
  if(!apiKey){openAISettings();return;}
  const weekEntries=entries.slice(0,7).map(e=>`- "${e.title||'Yozuv'}": ${(e.body||'').slice(0,100)}`).join('\n');
  const lang=getLang();
  const prompt=`Bu hafta yozilgan kundalik yozuvlarni o'qib, quyidagilarni berishing:\n1. Haftalik xulosa (2-3 gapda)\n2. Asosiy tuyg'ular\n3. 1 ta yaxshilanish maslahati\n\nTil: ${lang==='uz'?"O'zbek":lang==='ru'?'Russian':'English'}\n\nYozuvlar:\n${weekEntries}`;
  document.getElementById('ai-coach-ttl').textContent=t('aiWeekSummary');
  document.getElementById('ai-coach-result').innerHTML='';
  document.getElementById('ai-coach-thinking').classList.remove('hidden');
  openM('m-ai-coach');
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.7,maxOutputTokens:600}})});
    const data=await res.json();
    const txt=data.candidates?.[0]?.content?.parts?.[0]?.text||t('aiError');
    document.getElementById('ai-coach-result').innerHTML=MD.render(txt);
  }catch(e){document.getElementById('ai-coach-result').textContent=t('aiError');}
  finally{document.getElementById('ai-coach-thinking').classList.add('hidden');}
}

/* ─────────────────────────────────────────
   15. AI EMOTION ANALYSIS
───────────────────────────────────────── */
async function aiEmotionAnalysis(){
  const apiKey=localStorage.getItem('df11_ai_key');
  if(!apiKey){openAISettings();return;}
  const sample=entries.slice(0,10).map(e=>`mood:${e.mood||'?'} — "${(e.body||'').slice(0,80)}"`).join('\n');
  const lang=getLang();
  const prompt=`Bu kundalik yozuvlar asosida yozuvchining hissiy holatini tahlil qil. Qaysi tuyg'ular ustun? Nimalar tetiklamoqda? 2-3 paragrafda yoz. Ijobiy va dalda beruvchi bo'l. Til: ${lang==='uz'?"O'zbek":lang==='ru'?'Russian':'English'}\n\n${sample}`;
  document.getElementById('ai-coach-ttl').textContent=t('aiEmotionMap');
  document.getElementById('ai-coach-result').innerHTML='';
  document.getElementById('ai-coach-thinking').classList.remove('hidden');
  openM('m-ai-coach');
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.7,maxOutputTokens:500}})});
    const data=await res.json();
    const txt=data.candidates?.[0]?.content?.parts?.[0]?.text||t('aiError');
    document.getElementById('ai-coach-result').innerHTML=MD.render(txt);
  }catch(e){document.getElementById('ai-coach-result').textContent=t('aiError');}
  finally{document.getElementById('ai-coach-thinking').classList.add('hidden');}
}

/* ─────────────────────────────────────────
   16. AI WRITING STYLE ANALYSIS
───────────────────────────────────────── */
async function aiWritingStyleAnalysis(){
  const apiKey=localStorage.getItem('df11_ai_key');
  if(!apiKey){openAISettings();return;}
  const sample=entries.slice(0,8).filter(e=>!e.locked&&(e.body||'').length>50).map(e=>(e.body||'').slice(0,150)).join('\n\n---\n\n');
  if(!sample){toast('Avval bir nechta yozuv yozing');return;}
  const lang=getLang();
  const prompt=`Bu kundalik yozuvlar asosida yozish uslubini tahlil qil: so'z boyligi, gap uzunligi, his-tuyg'u ifodalash, kuchli va zaif tomonlar. 2-3 paragrafda. Rag'batlantirib yoz. Til: ${lang==='uz'?"O'zbek":lang==='ru'?'Russian':'English'}\n\n${sample}`;
  document.getElementById('ai-coach-ttl').textContent=t('aiWritingStyle');
  document.getElementById('ai-coach-result').innerHTML='';
  document.getElementById('ai-coach-thinking').classList.remove('hidden');
  openM('m-ai-coach');
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.8,maxOutputTokens:500}})});
    const data=await res.json();
    const txt=data.candidates?.[0]?.content?.parts?.[0]?.text||t('aiError');
    document.getElementById('ai-coach-result').innerHTML=MD.render(txt);
  }catch(e){document.getElementById('ai-coach-result').textContent=t('aiError');}
  finally{document.getElementById('ai-coach-thinking').classList.add('hidden');}
}

/* ─────────────────────────────────────────
   17. SHARE CARD (chiroyli karta)
───────────────────────────────────────── */
function openShareCard(entry){
  const e=entry||entries[0];if(!e)return;
  const modal=document.createElement('div');modal.className='modal';modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:800;';
  modal.innerHTML=`<div class="mbox" style="width:300px"><div class="mttl">📤 ${t('shareCard')}</div>
    <div class="share-card-preview">
      <div class="scp-bg"></div>
      <div class="scp-top"><div class="scp-logo">📖</div><span class="scp-brand">Daftar</span><span style="margin-left:auto;font-size:10px;color:var(--text3)">${fd(e.date,getLang())}</span></div>
      <div class="scp-title">${esc(e.title||t('noTitle'))}</div>
      <div class="scp-body">${esc((e.body||'').slice(0,200))}</div>
      <div class="scp-footer"><span>${(e.tags||[]).map(t2=>'#'+t2).join(' ')}</span><span class="scp-mood">${me(e.mood)||''}</span></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:12px">
      <button class="mprim" style="flex:1" onclick="doShareCard(${JSON.stringify(e.id)})">Ulashish</button>
      <button class="msec" style="flex:1" onclick="this.closest('.modal').remove()">Yopish</button>
    </div>
  </div>`;
  document.body.appendChild(modal);modal.onclick=ev=>{if(ev.target===modal)modal.remove();};
}
function doShareCard(id){
  const e=entries.find(x=>x.id===id)||entries[0];if(!e)return;
  const text=`📖 ${e.title||'Daftar'}\n${fd(e.date,getLang())}\n\n${(e.body||'').slice(0,300)}\n\n— Daftar`;
  if(navigator.share)navigator.share({title:e.title,text}).catch(()=>{});
  else navigator.clipboard?.writeText(text).then(()=>toast('📋 Nusxalandi'));
}

/* ─────────────────────────────────────────
   18. AUTO DARK MODE (tizimga qarab)
───────────────────────────────────────── */
function initAutoDarkMode(){
  const saved=localStorage.getItem('df11_auto_dark');
  if(saved!=='true')return;
  const mq=window.matchMedia('(prefers-color-scheme: dark)');
  function apply(dark){
    if(dark&&!['earthy','slate','warm','ocean','neon','galaxy','rose','forest','sand'].includes(LR('df11_theme','earthy'))){
      document.body.setAttribute('data-theme','slate');
    }
  }
  apply(mq.matches);mq.addEventListener('change',e=>apply(e.matches));
}

/* ─────────────────────────────────────────
   19. READING MODE — hook into entry click
───────────────────────────────────────── */
// Long press to open reading mode
let pressTimer=null;
document.addEventListener('touchstart',e=>{
  const card=e.target.closest('.ecard');if(!card)return;
  const id=card.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
  if(!id)return;
  pressTimer=setTimeout(()=>{
    const entry=entries.find(x=>x.id===id);
    if(entry&&!entry.locked){openReadingMode(entry);haptic([15,10,25]);}
  },600);
},{passive:true});
document.addEventListener('touchend',()=>clearTimeout(pressTimer),{passive:true});
document.addEventListener('touchmove',()=>clearTimeout(pressTimer),{passive:true});

/* ─────────────────────────────────────────
   20. STATS — hook into renderStats
───────────────────────────────────────── */
const _origRenderStats=renderStats;
renderStats=function(){
  _origRenderStats();
  renderHeatmap();
  renderRadar();
  renderWordFreq();
  renderEmotionMap();
  // Extra KPIs
  const avgMood=Object.values(moods).length?Object.values(moods).reduce((a,b)=>a+b,0)/Object.values(moods).length:0;
  const allW=entries.reduce((s,e)=>s+wc(e.body||''),0);
  setTxt('sst-heatmap',t('statsHeatmap'));
  setTxt('sst-radar',t('statsRadar'));
};

/* ─────────────────────────────────────────
   21. SETTINGS — update for v11
───────────────────────────────────────── */
const _origUpdateSettingsV11=updateSettingsUI;
updateSettingsUI=function(){
  _origUpdateSettingsV11();
  const si=document.getElementById('si-freeze-val');
  if(si)si.textContent=getStreakFreezeInfo();
};

/* ─────────────────────────────────────────
   22. SWIPE GESTURES (between screens)
───────────────────────────────────────── */
let swipeStartX=0,swipeStartY=0;
document.addEventListener('touchstart',e=>{swipeStartX=e.touches[0].clientX;swipeStartY=e.touches[0].clientY;},{passive:true});
document.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-swipeStartX;
  const dy=e.changedTouches[0].clientY-swipeStartY;
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*2&&!focusMode){
    // Swipe right on write screen = go back
    if(dx>0&&document.getElementById('sc-write').classList.contains('active')){goBack();}
  }
},{passive:true});

/* ─────────────────────────────────────────
   23. ENTRY SEARCH HISTORY
───────────────────────────────────────── */
let searchHist=LR('df11_search_hist',[]);
function addSearchHist(q){if(!q||q.length<2)return;searchHist=searchHist.filter(x=>x!==q).slice(0,8);searchHist.unshift(q);SR('df11_search_hist',searchHist);}
function renderSearchHist(){
  const as=document.getElementById('as-q');if(!as)return;
  if(!searchHist.length)return;
  const ex=document.getElementById('search-hist-row');if(ex)ex.remove();
  const row=document.createElement('div');row.id='search-hist-row';row.style.cssText='display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px';
  searchHist.forEach(h=>{const b=document.createElement('button');b.style.cssText='font-size:10px;background:var(--bg3);border:1px solid var(--border);color:var(--text3);padding:2px 8px;border-radius:5px';b.textContent='⏱ '+h;b.onclick=()=>{as.value=h;runAdvSearch();};row.appendChild(b);});
  as.parentElement.insertBefore(row,as.parentElement.firstChild);
}
const _origRunAdvSearch=runAdvSearch;
runAdvSearch=function(){const q=document.getElementById('as-q').value;addSearchHist(q);_origRunAdvSearch();};
const _origOpenAdvSearch=openAdvSearch;
openAdvSearch=function(){_origOpenAdvSearch();renderSearchHist();};

/* ─────────────────────────────────────────
   24. UNDO DELETE (5 soniya)
───────────────────────────────────────── */
let deletedEntry=null,deleteTimer=null;
const _origDelEntry=delEntry;
delEntry=async function(){
  if(!EID)return;
  const e=entries.find(x=>x.id===EID);if(!e)return;
  if(!confirm(t('confirmDelete')))return;
  deletedEntry={...e};
  entries=entries.filter(x=>x.id!==EID);
  EID=null;clearDraft();stopWriteTimer();await saveData();
  openScreen('home');renderView();
  // Show undo toast
  const undo=document.createElement('div');undo.className='undo-toast';
  undo.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid var(--border2);color:var(--text);padding:10px 16px;border-radius:10px;font-size:12px;z-index:500;display:flex;gap:10px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,.3)';
  undo.innerHTML=`<span>🗑 ${t('deleted')}</span><button onclick="undoDelete()" style="color:var(--accent2);font-weight:700;font-size:12px">${t('undoDelete')}</button>`;
  document.body.appendChild(undo);
  deleteTimer=setTimeout(()=>{undo.remove();deletedEntry=null;},5000);
};
async function undoDelete(){
  if(!deletedEntry)return;clearTimeout(deleteTimer);
  entries.unshift(deletedEntry);deletedEntry=null;
  await saveData();renderView();toast('↩️ Tiklandi');
  document.querySelector('.undo-toast')?.remove();
}

/* ─────────────────────────────────────────
   25. KEYBOARD SHORTCUTS PANEL (?)
───────────────────────────────────────── */
document.addEventListener('keydown',e=>{
  if(e.key==='?'&&!e.ctrlKey&&document.getElementById('sc-write').classList.contains('active')){
    toast('⌨️ Ctrl+S: Saqlash | Ctrl+P: Preview | Esc: Orqaga');
  }
});

/* ─────────────────────────────────────────
   26. INIT — Auto dark mode
───────────────────────────────────────── */
initAutoDarkMode();

console.log('🚀 Daftar v11 — 26 yangi funksiya: Focus·Reading·Audio·Heatmap·Radar·WordFreq·EmotionMap·QR·Widget·Templates·ColorLabel·WeekSummary·EmotionAI·StyleAI·ShareCard·AutoDark·SwipeGesture·SearchHistory·UndoDelete·StreakFreeze·MarkdownExport + 5 mavzu!');
