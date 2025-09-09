// src/services/bobinas.js
import api from './api';

export const bobinaService = {
  getAll: (params) => api.get('/bobinas', { params }),
  getById: (id) => api.get(`/bobinas/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    return api.post('/bobinas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.post(`/bobinas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/bobinas/${id}`),
  getClientes: () => api.get('/bobinas/clientes'),
};