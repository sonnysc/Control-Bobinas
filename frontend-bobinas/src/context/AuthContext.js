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

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      authService.getMe()
        .then(response => {
          setUser(response.data);
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
      const response = await authService.login(credentials);
      const { token, role, user_id } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id: user_id, role }));
      localStorage.setItem('lastActivity', Date.now().toString());
      
      const userResponse = await authService.getMe();
      setUser(userResponse.data);
      
      return { success: true };
    } catch (error) {
      clearSession();
      
      // MEJORA: Manejo específico de errores
      let errorMessage = 'Error de conexión';
      
      if (error.response) {
        // El servidor respondió con un código de error
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = data?.error || 'Usuario o contraseña incorrectos';
        } else if (status === 422) {
          errorMessage = 'Datos de formulario inválidos';
        } else if (status === 500) {
          errorMessage = 'Error interno del servidor';
        } else {
          errorMessage = data?.error || data?.message || 'Error desconocido';
        }
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor';
      } else {
        // Algo pasó al configurar la petición
        errorMessage = error.message || 'Error de configuración';
      }
      
      return { 
        success: false, 
        message: errorMessage 
      };
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

  const value = {
    user,
    login,
    logout,
    loading,
    clearSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};