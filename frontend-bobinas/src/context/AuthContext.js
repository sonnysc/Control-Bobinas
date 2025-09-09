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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      // Verificar si el token es válido
      authService.getMe()
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          // Token inválido, limpiar storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
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
      
      // Guardar token y info básica del usuario
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id: user_id, role }));
      
      // Obtener información completa del usuario
      const userResponse = await authService.getMe();
      setUser(userResponse.data);
      
      return { success: true };
    } catch (error) {
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};