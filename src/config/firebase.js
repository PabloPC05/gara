// src/firebase.js (o .ts)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Importa también los servicios que vayas a usar, por ejemplo:
import { getAuth } from "firebase/auth"; // Para Authentication
import { getFirestore } from "firebase/firestore"; // Para Cloud Firestore

// Tu configuración de Firebase usando las variables de entorno de Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Incluido si usas Analytics
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Inicializa Analytics

// Exporta los servicios para usarlos fácilmente en otras partes de tu app
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app, analytics }; // Exporta también la app y analytics si los necesitas directamente
