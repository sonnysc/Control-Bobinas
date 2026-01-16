// src/services/auth.js
import api from './api';

export const authService = {
  // Obtener cookie CSRF
  getCsrfCookie: () => {
    return api.get('/sanctum/csrf-cookie', {
      withCredentials: true,
      timeout: 10000
    });
  },

  // Login
  login: (credentials) => {
    return api.post('/login', credentials, {
      withCredentials: true,
      timeout: 15000
    });
  },

  // Logout
  logout: () => {
    return api.post('/logout', {}, {
      withCredentials: true
    });
  },

  // Obtener información del usuario actual
  getMe: () => {
    return api.get('/me', {
      withCredentials: true
    });
  },

  // Verificar si el usuario está autenticado
  checkAuth: () => {
    return api.get('/me');
  }
};