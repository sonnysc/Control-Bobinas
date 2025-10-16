// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Rutas que no deben cerrar sesión al recibir 401
const EXCLUDED_401_ROUTES = [
  '/login', // ← AGREGAR ESTA LÍNEA
  '/bobinas/verificar-autorizacion',
  '/bobinas' // Para el caso de reemplazo con líder
];

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Verificar si la ruta está excluida
      const requestUrl = error.config?.url || '';
      const shouldExclude = EXCLUDED_401_ROUTES.some(route => 
        requestUrl.includes(route)
      );
      
      if (!shouldExclude) {
        // Solo cerrar sesión si no está en la lista de exclusión
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;