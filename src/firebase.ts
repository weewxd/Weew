import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnpTduhwqCO8tYnlWAmTnj8dpZi4iEPRw",
  authDomain: "online-canopy-cdpgw.firebaseapp.com",
  projectId: "online-canopy-cdpgw",
  storageBucket: "online-canopy-cdpgw.firebasestorage.app",
  messagingSenderId: "1088605081739",
  appId: "1:1088605081739:web:c53317206b91d96a73848e",
  databaseId: "ai-studio-weewportal-cd055843-ecae-4d8b-85bb-43d7f31d4840"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom databaseId if specified
export const db = getFirestore(app, firebaseConfig.databaseId);
