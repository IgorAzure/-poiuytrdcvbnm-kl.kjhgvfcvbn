import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase
// IMPORTANTE: Substitua estas configurações pelas suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD9Q0SrIGIZVFkezhXbnLDn1oddY-7l9Vw",
  authDomain: "ifood2-b1e70.firebaseapp.com",
  projectId: "ifood2-b1e70",
  storageBucket: "ifood2-b1e70.firebasestorage.app",
  messagingSenderId: "948803436895",
  appId: "1:948803436895:web:faf73afd08348f6da6f6ea"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Authentication
export const auth = getAuth(app);

export default app;
