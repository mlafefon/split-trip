import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDcaRj_iM_Kvo64gRXzeBv3UAghOHHdqug",
  authDomain: "split-trip-a5cba.firebaseapp.com",
  projectId: "split-trip-a5cba",
  storageBucket: "split-trip-a5cba.firebasestorage.app",
  messagingSenderId: "58149400501",
  appId: "1:58149400501:web:4ecc3353d1e6e8ef5d33fc",
  measurementId: "G-LJH58520S1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
