// src/services/bobinas.js
import api from './api';

export const bobinaService = {
  getAll: (params) => api.get('/bobinas', { params }),
  getById: (id) => api.get(`/bobinas/${id}`),
  create: (formData) => {
    // formData debe ser instancia de FormData
    return api.post('/bobinas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    // data puede ser FormData o objeto plano
    if (data instanceof FormData) {
      return api.post(`/bobinas/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    const formData = new FormData();
    formData.append('hu', data.hu);
    formData.append('cliente', data.cliente || '');
    if (data.autorizacion_lider) {
      formData.append('autorizacion_lider', data.autorizacion_lider);
    }
    formData.append('_method', 'PUT');
    if (data.foto) {
      formData.append('foto', data.foto);
    }
    return api.post(`/bobinas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/bobinas/${id}`),
  getClientes: () => api.get('/bobinas/clientes'),
  getByHu: (hu) => api.get(`/bobinas?search=${hu}&exact=true`),
};