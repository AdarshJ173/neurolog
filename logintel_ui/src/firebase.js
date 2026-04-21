import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD2MdSQYBp7VAFTwT0S-VQzZH1oaPq02hs",
  authDomain: "neurolog-ndm.firebaseapp.com",
  projectId: "neurolog-ndm",
  storageBucket: "neurolog-ndm.firebasestorage.app",
  messagingSenderId: "255582903071",
  appId: "1:255582903071:web:b48ffbace0af08e087ee2a",
  measurementId: "G-6RBK2D5S8N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();