// src/services/auth.js
import api from './api';

export const authService = {
  login: (credentials) => api.post('/login', credentials),
  logout: () => api.post('/logout'),
  getMe: () => api.get('/me'),
};