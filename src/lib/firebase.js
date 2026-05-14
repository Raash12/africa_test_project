// Import functions
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCMeNDesnMkZusNOPcGGjjsHRTY9HP8WDo",
  authDomain: "africa-e809d.firebaseapp.com",
  projectId: "africa-e809d",
  storageBucket: "africa-e809d.firebasestorage.app",
  messagingSenderId: "787452360625",
  appId: "1:787452360625:web:6276557c3270adbaeb6f90",
  measurementId: "G-81CJ4F2RLT"
};

// XALKA: Hubi haddii App-ku horey u jiray ka hor intaanad initialize samayn
// Tani waxay ka hortagaysaa in React uu crash noqdo markaad code-ka update garayso
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;