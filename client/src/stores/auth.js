import { defineStore } from 'pinia';
import api from '../api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('mindmap_token') || '',
    user: JSON.parse(localStorage.getItem('mindmap_user') || 'null'),
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(username, password) {
      this.loading = true;
      try {
        const res = await api.post('/auth/login', { username, password });
        this.token = res.data.token;
        this.user = res.data.user;
        localStorage.setItem('mindmap_token', this.token);
        localStorage.setItem('mindmap_user', JSON.stringify(this.user));
        return res.data;
      } finally {
        this.loading = false;
      }
    },
    async register(username, password) {
      this.loading = true;
      try {
        const res = await api.post('/auth/register', { username, password });
        this.token = res.data.token;
        this.user = res.data.user;
        localStorage.setItem('mindmap_token', this.token);
        localStorage.setItem('mindmap_user', JSON.stringify(this.user));
        return res.data;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('mindmap_token');
      localStorage.removeItem('mindmap_user');
    },
    async checkAuth() {
      if (!this.token) return false;
      try {
        const res = await api.get('/auth/me');
        this.user = res.data.user;
        localStorage.setItem('mindmap_user', JSON.stringify(this.user));
        return true;
      } catch {
        this.logout();
        return false;
      }
    }
  }
});
