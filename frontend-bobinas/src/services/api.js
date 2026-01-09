// src/services/api.js
import axios from 'axios';

// ✅ FUNCIÓN PARA DETECTAR LA IP AUTOMÁTICAMENTE
const getBaseUrl = () => {
  // 1. Si hay una variable de entorno explícita en el .env, la respetamos (prioridad alta)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Si no, detectamos la IP/Dominio de la barra de direcciones
  const protocol = window.location.protocol;
  const hostname = window.location.hostname; 
  
  
  return `${protocol}//${hostname}/api`;
};

const API_BASE_URL = getBaseUrl();

console.log('🔗 Conectando a API en:', API_BASE_URL); // Log útil para depuración

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Rutas que no deben cerrar sesión al recibir 401
const EXCLUDED_401_ROUTES = [
  '/login',
  '/bobinas/verificar-autorizacion',
  '/bobinas'
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
      const requestUrl = error.config?.url || '';
      const shouldExclude = EXCLUDED_401_ROUTES.some(route => 
        requestUrl.includes(route)
      );
      
      if (!shouldExclude) {
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