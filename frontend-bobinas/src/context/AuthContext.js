// src/context/AuthContext.js - Agregar esta función de limpieza
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para limpiar completamente la sesión
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
          // Actualizar última actividad al cargar
          localStorage.setItem('lastActivity', Date.now().toString());
        })
        .catch(() => {
          clearSession(); // Usar la función de limpieza
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
      localStorage.setItem('lastActivity', Date.now().toString()); // Iniciar actividad
      
      const userResponse = await authService.getMe();
      setUser(userResponse.data);
      
      return { success: true };
    } catch (error) {
      clearSession(); // Limpiar en caso de error
      return { 
        success: false, 
        message: error.response?.data?.error || 'Error de conexión' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      clearSession(); // Usar la función de limpieza
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    clearSession // Exportar para uso externo si es necesario
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};