// src/components/ActivityTracker.js
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const ActivityTracker = () => {
  const { user, logout } = useAuth();
  const activityTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!user) {
      console.log('ActivityTracker: No hay usuario, no se inicia el tracker');
      return;
    }

    console.log('ActivityTracker: Iniciando tracker de inactividad');

    // Función para resetear el timer de inactividad
    const resetInactivityTimer = () => {
      // Actualizar el timestamp de la última actividad
      const now = Date.now();
      lastActivityRef.current = now;
      localStorage.setItem('lastActivity', now.toString());
      
      // Limpiar el timeout anterior
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      // Establecer nuevo timeout para 3 minutos (180000 ms)
      activityTimeoutRef.current = setTimeout(() => {
        console.log('ActivityTracker: Cerrando sesión por inactividad después de 3 minutos');
        handleLogout();
      }, 180000); // 3 minutos = 180,000 ms
    };

    // Función para manejar el logout
    const handleLogout = () => {
      console.log('ActivityTracker: Ejecutando logout por inactividad');
      
      // Limpiar el timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = null;
      }
      
      // Limpiar localStorage completamente
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      
      // Hacer logout en el contexto
      logout();
      
      // Redirigir al login
      window.location.href = '/login?reason=inactivity';
    };

    // Eventos que indican actividad del usuario
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'keydown',
      'scroll', 'touchstart', 'click', 'input',
      'touchmove', 'wheel', 'resize', 'focus'
    ];

    // Agregar event listeners para actividad
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Iniciar el timer de inactividad
    resetInactivityTimer();

    // Cleanup function
    return () => {
      console.log('ActivityTracker: Limpiando tracker');
      
      // Limpiar event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      
      // Limpiar timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = null;
      }
    };
  }, [user, logout]);

  return null;
};

export default ActivityTracker;