// Web app's Firebase configuration using environment variables
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC2PiHMYcA3BHDFsw5ZvFaopmHV1O6VecQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ns-coating-ltd-52199987-5c6b9.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ns-coating-ltd-52199987-5c6b9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ns-coating-ltd-52199987-5c6b9.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "730635045209",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:730635045209:web:88aa3585a4ba028f436448"
};