import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDaDyOuI3pF8SlNk1cTiuzntcH1bxatlIs",
  authDomain: "dylan-finance-app.firebaseapp.com",
  projectId: "dylan-finance-app",
  storageBucket: "dylan-finance-app.firebasestorage.app",
  messagingSenderId: "73079896859",
  appId: "1:73079896859:web:176cbb60cabf1d933bb1be",
  measurementId: "G-7PX8QB50TJ"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
