/* MKT301 Arena: the ONE place for the Firebase web config (public, safe to commit).
   CLOUD_ON is the single switch. While it is false the site runs in device-only mode: vendor/firebase.js is never loaded.
   Tests against the Firebase emulators force it on with ?emu=1 on localhost. */
const CLOUD_ON=true;
const CLOUD_CONFIG={
  apiKey:"AIzaSyAkUc8iwch9rogMVvIWlhuZ5CwJJimnBt8",
  authDomain:"mkt301-f8830.firebaseapp.com",
  projectId:"mkt301-f8830",
  storageBucket:"mkt301-f8830.firebasestorage.app",
  messagingSenderId:"372346043261",
  appId:"1:372346043261:web:5e01df4385f46e5a50aa14"
};
/* phone notifications (docs/PUSH.md): off until the lecturer sets them up. PUSH_KEY is the public VAPID key (safe to commit). */
const PUSH_ON=false,PUSH_KEY='';
