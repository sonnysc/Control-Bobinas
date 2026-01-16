// src/services/api.js
import axios from 'axios';

// ✅ FUNCIÓN PARA DETECCIÓN AUTOMÁTICA DE LA URL BASE
const getBaseUrl = () => {
  // 1. Si hay una variable de entorno explícita, usarla (prioridad alta)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Detectar el entorno actual
  const isProduction = process.env.NODE_ENV === 'production';
  const hostname = window.location.hostname;
  
  // 3. Si estamos en producción (build)
  if (isProduction) {
    return '/api'; // Ruta relativa cuando está en el mismo servidor
  }
  
  // 4. Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Acceso desde el MISMO equipo donde corre Laravel
    return 'http://localhost:8001/api';
  }
  
  // 5. Acceso desde OTRO equipo en la red
  // Usa el hostname desde donde se está accediendo
  return `http://${hostname}:8001/api`;
};

const API_BASE_URL = getBaseUrl();

console.log('🌐 DETECCIÓN AUTOMÁTICA ACTIVADA');
console.log('📍 Host actual:', window.location.hostname);
console.log('🔗 URL de API:', API_BASE_URL);
console.log('🚀 Entorno:', process.env.NODE_ENV);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// ✅ INTERCEPTOR DE REQUESTS
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

// ✅ INTERCEPTOR DE RESPONSES
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const EXCLUDED_401_ROUTES = [
        '/login',
        '/bobinas/verificar-autorizacion',
        '/bobinas'
      ];
      
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
    
    // ✅ INFORMACIÓN ÚTIL EN ERRORES DE RED
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ ERROR DE CONEXIÓN DETECTADO');
      console.error('   URL intentada:', API_BASE_URL);
      console.log('💡 SOLUCIONES:');
      console.log('   1. Verifica que Laravel esté ejecutándose:');
      console.log('      php artisan serve --host=0.0.0.0 --port=8001');
      console.log('   2. Para acceso desde ESTE equipo:');
      console.log('      http://localhost:3001');
      console.log('   3. Para acceso desde OTROS equipos:');
      console.log('      http://[IP-DE-ESTE-EQUIPO]:3001');
      console.log('   4. Host actual detectado:', window.location.hostname);
    }
    
    return Promise.reject(error);
  }
);

export default api;