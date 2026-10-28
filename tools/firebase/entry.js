/* Entry for the vendored Firebase SDK (vendor/firebase.js). Only what the portal uses, so the bundle stays small.
   Rebuild: see tools/firebase/build.sh */
export {initializeApp} from 'firebase/app';
export {initializeAuth,browserLocalPersistence,indexedDBLocalPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,
  sendPasswordResetEmail,onAuthStateChanged,signOut,connectAuthEmulator,verifyPasswordResetCode,confirmPasswordReset,applyActionCode,checkActionCode} from 'firebase/auth';
export {initializeFirestore,doc,getDoc,setDoc,onSnapshot,collection,query,orderBy,limit,serverTimestamp,connectFirestoreEmulator,
  addDoc,deleteDoc,updateDoc,getDocs,where,runTransaction,writeBatch,increment,deleteField,Timestamp} from 'firebase/firestore';
