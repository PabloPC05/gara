import { create } from 'zustand';
import { getUserJobs } from '../lib/firebaseStorage';

export const useHistoryStore = create((set) => ({
  jobs: [],
  isLoading: false,
  error: null,

  fetchUserJobs: async (userId) => {
    if (!userId) return;
    set({ isLoading: true, error: null });
    try {
      const jobs = await getUserJobs(userId);
      set({ jobs, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addJob: (job) => {
    set((state) => ({
      jobs: [job, ...state.jobs],
    }));
  },

  clearHistory: () => {
    set({ jobs: [], error: null });
  },
}));
