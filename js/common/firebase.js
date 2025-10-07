import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHgcauGdhslZv1Qj8qwmtZtAIxaPM83hc",
  authDomain: "join-31b2e.firebaseapp.com",
  databaseURL:
    "https://join-31b2e-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "join-31b2e",
  storageBucket: "join-31b2e.firebasestorage.app",
  messagingSenderId: "1016468038165",
  appId: "1:1016468038165:web:f924969f124e648a02641c",
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

export function isUserLoggedIn() {
  return !!auth.currentUser;
}
