// Import functions ka aad u baahan tahay
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Xogtaada cusub ee Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCMeNDesnMkZusNOPcGGjjsHRTY9HP8WDo",
  authDomain: "africa-e809d.firebaseapp.com",
  projectId: "africa-e809d",
  storageBucket: "africa-e809d.firebasestorage.app",
  messagingSenderId: "787452360625",
  appId: "1:787452360625:web:6276557c3270adbaeb6f90",
  measurementId: "G-81CJ4F2RLT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services si loogu isticmaalo components-ka kale
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);