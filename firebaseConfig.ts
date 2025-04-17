import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSn8gTK5Wvfl9qxkFFX756QbZ3nwSdYVM",
  authDomain: "taskmanger-8e8ff.firebaseapp.com",
  projectId: "taskmanger-8e8ff",
  storageBucket: "taskmanger-8e8ff.appspot.com",
  messagingSenderId: "38989656430",
  appId: "1:38989656430:web:06cac93687de629935917f",
  measurementId: "G-K12GR02ZWQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
