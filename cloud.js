/* MKT301 Arena: Firebase connection (accounts, progress sync, live leaderboard, lecturer dashboard).
   Uses the bundled SDK in vendor/firebase.js (global FBSDK). If it is missing or fails, CLOUD.ok is false
   and the portal keeps working in device-only mode.
   On localhost the cloud is off unless the URL has ?emu=1 (local emulators, for tests) or ?cloud=1 (the real project). */
const CLOUD=(()=>{
  const CFG={apiKey:'AIzaSyAkUc8iwch9rogMVvIWlhuZ5CwJJimnBt8',authDomain:'mkt301-f8830.firebaseapp.com',projectId:'mkt301-f8830',
    storageBucket:'mkt301-f8830.firebasestorage.app',messagingSenderId:'372346043261',appId:'1:372346043261:web:5e01df4385f46e5a50aa14'};
  const DOMAIN='student.mnu.edu.mv',local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname),q=location.search;
  const emu=local&&/[?&]emu=1\b/.test(q),off=local&&!emu&&!/[?&]cloud=1\b/.test(q);
  let F,auth,db,user=null,authReady,state='off',synced=null,timer=null,busy=false,again=false,boardX,unsubs=[],getState=null,own=null;
  const subs=new Set(),set=s=>{state=s;subs.forEach(f=>{try{f(s)}catch(e){}})};
  const C={ok:false,emu,
    email:sid=>String(sid).toLowerCase()+'@'+DOMAIN,
    get state(){return state},onStatus(f){subs.add(f);return()=>subs.delete(f)},
    get user(){return user}};

  C.init=()=>{if(off||typeof FBSDK==='undefined')return false;
    try{F=FBSDK;const app=F.initializeApp(emu?Object.assign({},CFG,{projectId:'demo-mkt301'}):CFG);
      auth=F.initializeAuth(app,{persistence:[F.indexedDBLocalPersistence,F.browserLocalPersistence]});
      if(emu)F.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
      db=F.initializeFirestore(app,{ignoreUndefinedProperties:true});
      if(emu)F.connectFirestoreEmulator(db,'127.0.0.1',8085);
      authReady=new Promise(r=>F.onAuthStateChanged(auth,u=>{user=u;r(u)}));
      addEventListener('online',()=>{if(synced)C.flush()});addEventListener('offline',()=>{if(synced)set('offline')});
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')C.flush()});
      C.ok=true}catch(e){console.warn('Cloud unavailable',e);C.ok=false}
    return C.ok};

  /* signed-in user, waiting briefly for the saved session to load */
  C.current=async()=>{if(!C.ok)return null;await Promise.race([authReady,new Promise(r=>setTimeout(r,6000))]);return user};
  C.signIn=(sid,pin)=>F.signInWithEmailAndPassword(auth,C.email(sid),pin);
  C.create=(sid,pin)=>F.createUserWithEmailAndPassword(auth,C.email(sid),pin);
  C.reset=sid=>F.sendPasswordResetEmail(auth,C.email(sid));
  /* links from Firebase emails (PIN reset etc.) open the site with ?mode=...&oobCode=... */
  C.verifyReset=code=>F.verifyPasswordResetCode(auth,code);
  C.confirmReset=(code,pin)=>F.confirmPasswordReset(auth,code,pin);
  C.checkCode=code=>F.checkActionCode(auth,code);
  C.applyCode=code=>F.applyActionCode(auth,code);
  C.signOut=async()=>{C.unwatch();if(C.unwatchLatestSession)C.unwatchLatestSession();C.unwatchMine();synced=null;clearTimeout(timer);set('off');if(C.ok&&auth)try{await F.signOut(auth)}catch(e){}};
  C.mine=sid=>!!(user&&user.email===C.email(sid));

  /* friendly text for Firebase error codes */
  C.say=e=>{const c=(e&&e.code)||'';
    if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c))return 'That PIN doesn\'t match this ID. Try again, tap "First time?" if you haven\'t made a PIN yet, or use Forgot PIN.';
    if(/email-already-in-use/.test(c))return 'This ID already has a PIN. Sign in instead, or tap Forgot PIN.';
    if(/weak-password|password-does-not-meet/.test(c))return 'Your PIN must be 6 digits.';
    if(/too-many-requests/.test(c))return 'Too many tries. Wait a few minutes, or reset your PIN with Forgot PIN.';
    if(/network-request-failed|unavailable|offline/.test(c))return 'Can\'t reach the server. Check your internet connection and try again.';
    if(/permission-denied/.test(c))return 'This ID is not allowed to save online. Ask your lecturer to check the class list.';
    if(/expired-action-code|invalid-action-code/.test(c))return 'This link has expired or has already been used. Ask for a new one with Forgot PIN on the sign-in screen.';
    if(/user-disabled/.test(c))return 'This account has been turned off. Ask your lecturer.';
    return 'Something went wrong ('+(c||'unknown')+'). Try again.'};
  C.isNetwork=e=>/network-request-failed|unavailable/.test((e&&e.code)||'');

  /* first sync after sign-in: returns the cloud copy of U (or null) and remembers the leaderboard XP */
  C.pull=async sid=>{set('syncing');const [u,b]=await Promise.all([F.getDoc(F.doc(db,'users',sid)),F.getDoc(F.doc(db,'board',sid))]);
    boardX=b.exists()?b.data().x:null;
    if(!u.exists())return null;const d=u.data();let parsed=null;try{parsed=JSON.parse(d.u)}catch(e){}
    return {name:d.name,u:parsed}};
  /* after pull: allow saving, with a getter for {sid,name,U,row} */
  C.ready=(sid,fn)=>{synced=sid;getState=fn;set(navigator.onLine?'synced':'offline')};
  C.push=()=>{if(!synced)return;clearTimeout(timer);set(navigator.onLine?'saving':'offline');timer=setTimeout(C.flush,2000)};
  C.flush=async()=>{if(!synced||!getState)return;clearTimeout(timer);if(busy){again=true;return}busy=true;
    try{const s=getState();if(!s||s.sid!==synced)return;set(navigator.onLine?'saving':'offline');
      await F.setDoc(F.doc(db,'users',s.sid),{name:String(s.name||'').slice(0,80),u:JSON.stringify(s.U),xp:Math.round(s.U.xp)|0,ts:F.serverTimestamp()});
      if(s.row){const r=s.row,x=Math.max(0,Math.round(r.x)|0);
        /* the rules cap a new row at 5,000 XP and each update at +3,000, so big jumps (restores) go up in steps */
        let cur=boardX;do{const nx=cur==null?Math.min(x,5000):x>cur?Math.min(x,cur+3000):x;
          await F.setDoc(F.doc(db,'board',s.sid),{n:String(r.n||'').slice(0,24),x:nx,l:r.l|0,b:r.b|0,s:r.s|0,t:F.serverTimestamp()});cur=boardX=nx}while(cur<x)}
      set('synced')}
    catch(e){console.warn('Sync failed',e);set(C.isNetwork(e)||!navigator.onLine?'offline':'error')}
    finally{busy=false;if(again){again=false;C.flush()}}};

  /* live listeners (stopped on every page change) */
  C.unwatch=()=>{unsubs.forEach(f=>{try{f()}catch(e){}});unsubs=[]};
  C.watchBoard=(cb,err)=>{unsubs.push(F.onSnapshot(F.query(F.collection(db,'board'),F.orderBy('x','desc'),F.limit(100)),
    s=>cb(s.docs.map(d=>Object.assign({id:d.id},d.data()))),e=>err&&err(e)))};
  C.watchUsers=(cb,err)=>{unsubs.push(F.onSnapshot(F.collection(db,'users'),
    s=>cb(s.docs.map(d=>{const x=d.data();let u=null;try{u=JSON.parse(x.u)}catch(e){}return {id:d.id,name:x.name,xp:x.xp,ts:x.ts&&x.ts.toDate?x.ts.toDate():null,u}})),e=>err&&err(e)))};
  /* marks from the lecturer (or Claude marking): reviews/{SID} = {m:{key:{q,band,xp,fb,at,by}}}.
     The student's own listener stays on across page changes; the lecturer's listeners are page-scoped. */
  C.watchMine=(sid,cb)=>{C.unwatchMine();own=F.onSnapshot(F.doc(db,'reviews',sid),d=>cb(d.exists()?(d.data().m||{}):{}),e=>console.warn('Marks unavailable',e))};
  C.unwatchMine=()=>{if(own){try{own()}catch(e){}own=null}};
  C.watchReviews=(cb,err)=>{unsubs.push(F.onSnapshot(F.collection(db,'reviews'),s=>{const o={};s.docs.forEach(d=>o[d.id]=d.data().m||{});cb(o)},e=>err&&err(e)))};
  /* lecturer: one student's progress and marks, live (page-scoped) */
  C.watchStudent=(sid,cb,err)=>{unsubs.push(F.onSnapshot(F.doc(db,'users',sid),d=>{if(!d.exists())return cb(null);const x=d.data();let u=null;try{u=JSON.parse(x.u)}catch(e){}
    cb({id:sid,name:x.name,xp:x.xp,ts:x.ts&&x.ts.toDate?x.ts.toDate():null,u})},e=>err&&err(e)))};
  C.watchReview=(sid,cb,err)=>{unsubs.push(F.onSnapshot(F.doc(db,'reviews',sid),d=>cb(d.exists()?(d.data().m||{}):{}),e=>err&&err(e)))};
  C.saveReview=(sid,key,v)=>F.setDoc(F.doc(db,'reviews',sid),{m:{[key]:v}},{merge:true});
  const ms=v=>v&&v.toDate?v.toDate().getTime():v instanceof Date?v.getTime():null;
  const sessObj=d=>{const x=d.data();return {id:d.id,name:x.name||'',active:!!x.active,startedAt:ms(x.startedAt),endsAt:ms(x.endsAt),endedAt:ms(x.endedAt),rep:x.rep||null}};
  const presObj=d=>{const x=d.data();return Object.assign({id:d.id},x,{joinedAt:ms(x.joinedAt),t:ms(x.t)})};
  let latest=null;
  C.watchLatestSession=(cb,err)=>{C.unwatchLatestSession();latest=F.onSnapshot(F.query(F.collection(db,'sessions'),F.orderBy('startedAt','desc'),F.limit(1)),
    s=>{const d=s.docs[0];cb(d?sessObj(d):null)},e=>err&&err(e))};
  C.unwatchLatestSession=()=>{if(latest){try{latest()}catch(e){}latest=null}};
  C.watchSessions=(cb,err)=>{unsubs.push(F.onSnapshot(F.query(F.collection(db,'sessions'),F.orderBy('startedAt','desc'),F.limit(30)),s=>cb(s.docs.map(sessObj)),e=>err&&err(e)))};
  C.watchSessionDoc=(id,cb,err)=>{unsubs.push(F.onSnapshot(F.doc(db,'sessions',id),d=>cb(d.exists()?sessObj(d):null),e=>err&&err(e)))};
  C.getSession=async id=>{const d=await F.getDoc(F.doc(db,'sessions',id));return d.exists()?sessObj(d):null};
  C.watchPresence=(id,cb,err)=>{unsubs.push(F.onSnapshot(F.collection(db,'sessions',id,'p'),s=>cb(s.docs.map(presObj)),e=>err&&err(e)))};
  C.presenceOnce=id=>new Promise((res,rej)=>{let u=null,done=false;u=F.onSnapshot(F.collection(db,'sessions',id,'p'),s=>{if(done)return;done=true;res(s.docs.map(presObj));setTimeout(()=>u&&u(),0)},e=>{if(!done){done=true;rej(e)}})});
  C.startSession=(name,hours)=>F.setDoc(F.doc(F.collection(db,'sessions')),{name:String(name).slice(0,80),startedAt:F.serverTimestamp(),endsAt:new Date(Date.now()+hours*3600e3),active:true});
  C.endSession=(id,rep)=>F.setDoc(F.doc(db,'sessions',id),{active:false,endedAt:F.serverTimestamp(),rep},{merge:true});
  C.putPresence=(id,sid,p)=>F.setDoc(F.doc(db,'sessions',id,'p',sid),Object.assign({},p,{t:F.serverTimestamp()}));
  return C})();
CLOUD.init();
