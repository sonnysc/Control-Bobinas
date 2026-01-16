// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(null);

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setUser(null);
    setLastActivity(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedActivity = localStorage.getItem('lastActivity');
    
    if (token && savedUser) {
      authService.getMe()
        .then(response => {
          setUser(response.data);
          const activityTime = savedActivity ? parseInt(savedActivity) : Date.now();
          setLastActivity(activityTime);
          localStorage.setItem('lastActivity', Date.now().toString());
        })
        .catch(() => {
          clearSession();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔐 INICIANDO PROCESO DE LOGIN');
      
      // 1. OBTENER COOKIE CSRF (IMPORTANTE PARA SESSION)
      console.log('🔄 Obteniendo cookie CSRF de Sanctum...');
      try {
        await authService.getCsrfCookie();
        console.log('✅ Cookie CSRF obtenida correctamente');
      } catch (csrfError) {
        console.error('❌ Error obteniendo CSRF cookie:', csrfError);
        throw new Error('No se pudo establecer conexión segura con el servidor');
      }
      
      // 2. HACER LOGIN CON CREDENCIALES
      console.log('📤 Enviando credenciales de login...');
      const response = await authService.login(credentials);
      const { token, role, user_id } = response.data;
      
      console.log('✅ LOGIN EXITOSO');
      console.log('👤 Usuario ID:', user_id);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id: user_id, role }));
      localStorage.setItem('lastActivity', Date.now().toString());
      
      const userResponse = await authService.getMe();
      setUser(userResponse.data);
      setLastActivity(Date.now());
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ ERROR EN LOGIN:', error);
      
      let message = 'Error al iniciar sesión';
      
      if (error.response) {
        // El servidor respondió con un error
        console.error('📊 Detalles del error:', error.response.data);
        console.error('📊 Status:', error.response.status);
        
        switch (error.response.status) {
          case 401:
            message = error.response.data?.message || 'Usuario o contraseña incorrectos';
            break;
          case 422:
            message = 'Datos de formulario inválidos';
            break;
          case 404:
            message = 'Ruta no encontrada. Verifica la configuración';
            break;
          case 419:
            message = 'Token CSRF expirado o inválido';
            break;
          case 500:
            message = 'Error interno del servidor';
            break;
          default:
            message = `Error ${error.response.status}: ${error.response.data?.message || 'Error desconocido'}`;
        }
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        console.error('📡 No hay respuesta del servidor');
        message = 'No se pudo conectar con el servidor. Verifica que esté ejecutándose';
        
        // Información adicional para debugging
        console.log('💡 SOLUCIÓN: Asegúrate de que Laravel esté corriendo con:');
        console.log('   php artisan serve --host=0.0.0.0 --port=8001');
        console.log('💡 Si estás en otro equipo, usa la IP correcta:');
        console.log('   http://[IP-DEL-SERVIDOR]:3001');
        
      } else {
        // Error al configurar la petición
        console.error('⚙️ Error de configuración:', error.message);
        message = 'Error de configuración en la aplicación';
      }
      
      clearSession();
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      clearSession();
    }
  };

  const updateActivity = () => {
    const now = Date.now();
    setLastActivity(now);
    localStorage.setItem('lastActivity', now.toString());
  };

  const value = {
    user,
    login,
    logout,
    loading,
    clearSession,
    lastActivity,
    updateActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};