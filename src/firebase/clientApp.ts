// src/firebase/clientApp.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore }           from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyA9C8pmAwqx2QodJ12oImi64NVV9ZG8awo",
  authDomain:        "pinot-tambayan.firebaseapp.com",
  projectId:         "pinot-tambayan",
  storageBucket:     "pinot-tambayan.appspot.com",
  messagingSenderId: "257561318071",
  appId:             "1:257561318071:web:8b2f3939f3de17fd55f332",
  measurementId:     "G-EV0QKNFEJ7",
};

if (!getApps().length) {
  console.log("🔥 Initializing Firebase for project:", firebaseConfig.projectId);
  initializeApp(firebaseConfig);
}

export const db = getFirestore();
