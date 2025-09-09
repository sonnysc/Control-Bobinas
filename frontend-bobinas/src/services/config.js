// src/services/config.js
import api from './api';

export const configService = {
  getAll: () => api.get('/configuraciones'),
  create: (data) => api.post('/configuraciones', data),
  update: (id, data) => api.put(`/configuraciones/${id}`, data),
  delete: (id) => api.delete(`/configuraciones/${id}`),
};