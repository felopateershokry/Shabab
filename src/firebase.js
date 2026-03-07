// Firebase config
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4xNceDB8z5xTGjfTEVuX_SZ9IRso-WSQ",
  authDomain: "khedma-shabab-61aa9.firebaseapp.com",
  projectId: "khedma-shabab-61aa9",
  storageBucket: "khedma-shabab-61aa9.appspot.com",
  messagingSenderId: "819466295054",
  appId: "1:819466295054:web:9aa76e6c4d0144e2e3a95f",
  measurementId: "G-9NY6H857MJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
