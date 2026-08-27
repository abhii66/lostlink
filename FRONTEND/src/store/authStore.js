import { create } from "zustand";
import api from "./axios.js";

export const useAuthStore = create((set) => ({
  user: null,
  isCheckingAuth: true,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await api.get("/auth/me");
      const u = res.data.user;
      set({ user: { id: u.id ?? u._id, name: u.name, email: u.email }, isCheckingAuth: false });
    } catch {
      set({ user: null, isCheckingAuth: false });
    }
  },

  register: async ({ name, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/register", { name, email, password });
      set({ user: res.data.user, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Registration failed", isLoading: false });
      return false;
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      set({ user: res.data.user, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Login failed", isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null });
  },
}));
