import { create } from "zustand";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
	signOut,
	onAuthStateChanged,
	GoogleAuthProvider,
	signInWithPopup,
	type User,
} from "firebase/auth";
import { auth } from "../config/firebase";

interface AuthState {
	user: User | null;
	loading: boolean;
	error: string | null;

	initializeAuth: () => () => void;
	signUp: (email: string, password: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	logOut: () => Promise<void>;
	clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
	user: null,
	loading: true,
	error: null,

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
			set({ loading: false });
		} catch (error) {
			set({ error: (error as Error).message, loading: false });
		}
	},

	signIn: async (email, password) => {
		set({ loading: true, error: null });
		try {
			await signInWithEmailAndPassword(auth, email, password);
			set({ loading: false });
		} catch (error) {
			set({ error: (error as Error).message, loading: false });
		}
	},

	signInWithGoogle: async () => {
		set({ loading: true, error: null });
		const provider = new GoogleAuthProvider();
		try {
			await signInWithPopup(auth, provider);
			set({ loading: false });
		} catch (error) {
			set({ error: (error as Error).message, loading: false });
		}
	},

	resetPassword: async (email) => {
		set({ loading: true, error: null });
		try {
			await sendPasswordResetEmail(auth, email);
			set({ loading: false });
		} catch (error) {
			set({ error: (error as Error).message, loading: false });
			throw error;
		}
	},

	logOut: async () => {
		set({ loading: true, error: null });
		try {
			await signOut(auth);
			set({ loading: false });
		} catch (error) {
			set({ error: (error as Error).message, loading: false });
		}
	},

	clearError: () => set({ error: null }),
}));
