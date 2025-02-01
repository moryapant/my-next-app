import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCF-N0ZvM-W2BqvTPQ8JoqUovCi3MZ3DYE",
  authDomain: "blogs-4db78.firebaseapp.com",
  projectId: "blogs-4db78",
  storageBucket: "blogs-4db78.appspot.com",
  messagingSenderId: "291762758708",
  appId: "1:291762758708:web:a3ebb8779bc8fa27e9d661",
  measurementId: "G-SN1D83EG0X"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 