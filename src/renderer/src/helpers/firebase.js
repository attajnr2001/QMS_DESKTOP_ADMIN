// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkqL3hhKRYlsDAAib9ymCd-d2sbQ28L20",
  authDomain: "ourqms-db48c.firebaseapp.com",
  projectId: "ourqms-db48c",
  storageBucket: "ourqms-db48c.appspot.com",
  messagingSenderId: "549479658062",
  appId: "1:549479658062:web:d25ed2b4ae8f908e8f891f",
  measurementId: "G-Y81DCWTSCJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();
export const storage = getStorage(app);
