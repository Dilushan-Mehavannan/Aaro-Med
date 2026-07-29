import { create } from 'zustand';
import { authService } from '../services/api';

export const useAuthStore = create((set) => ({
  currentUser: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  setUser: (user, token) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    set({ currentUser: user, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, token: null });
  },

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.getMe();
      set({ currentUser: response.data.user, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to fetch user', isLoading: false });
    }
  },

  setError: (error) => set({ error }),
}));

export const useDoctorStore = create((set) => ({
  doctors: [],
  selectedDoctor: null,
  isLoading: false,

  setDoctors: (doctors) => set({ doctors }),
  setSelectedDoctor: (doctor) => set({ selectedDoctor: doctor }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export const useTokenStore = create((set) => ({
  myTokens: [],
  queue: null,
  isLoading: false,

  setMyTokens: (tokens) => set({ myTokens: tokens }),
  setQueue: (queue) => set({ queue }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'success') => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3500);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
