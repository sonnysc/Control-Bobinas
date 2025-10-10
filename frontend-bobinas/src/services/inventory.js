// src/services/inventory.js
import api from './api';

export const inventoryService = {
  // Obtener todo el inventario
  getAll: (params) => api.get('/inventario', { params }),
  
  // Buscar por HU
  findByHU: (hu) => api.get(`/inventario/hu${hu}`),
  
  // Procesar escaneo
  processScan: (data) => api.post('/inventario/scan', data),
  
  // Crear nuevo item
  create: (data) => api.post('/inventario', data),
  
  // Actualizar item
  update: (id, data) => api.put(`/inventario/${id}`, data),
  
  // Eliminar item
  delete: (id) => api.delete(`/inventario/${id}`),
  
  // Estadísticas
  getStats: () => api.get('/inventario/stats')
};