import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../config/firebase';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  // Inicializa el observador de la sesión
  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
    return unsubscribe;
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // El estado del usuario se actualizará automáticamente por onAuthStateChanged
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  logOut: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  clearError: () => set({ error: null })
}));

export default useAuthStore;
