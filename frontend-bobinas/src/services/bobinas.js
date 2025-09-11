// src/services/bobinas.js
import api from './api';

export const bobinaService = {
  getAll: (params) => api.get('/bobinas', { params }),
  getById: (id) => api.get(`/bobinas/${id}`),
  create: (data) => {
    const formData = new FormData();

    formData.append('hu', data.hu);
    formData.append('cliente', data.cliente || '');
    formData.append('estado', data.estado);

    if (data.foto) {
      formData.append('foto', data.foto);
    }

    return api.post('/bobinas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();

    formData.append('hu', data.hu);
    formData.append('cliente', data.cliente || '');
    formData.append('estado', data.estado);
    formData.append('_method', 'PUT'); // Para Laravel

    if (data.foto) {
      formData.append('foto', data.foto);
    }

    return api.post(`/bobinas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/bobinas/${id}`),
  getClientes: () => api.get('/bobinas/clientes'),

  // Nuevo método para buscar por HU exacto
  getByHu: (hu) => api.get(`/bobinas?search=${hu}&exact=true`),
};