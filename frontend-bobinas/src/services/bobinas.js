// src/services/bobinas.js

import api from './api';

export const bobinaService = {
  getAll: (params) => api.get('/bobinas', { params }),
  getById: (id) => api.get(`/bobinas/${id}`),
  create: (formData) => {
    return api.post('/bobinas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    formData.append('hu', data.hu);
    formData.append('cliente', data.cliente || '');
    formData.append('_method', 'PUT');
    
    if (data.foto) {
      formData.append('foto', data.foto);
    }
    
    if (data.autorizacion_lider) {
      formData.append('autorizacion_lider', data.autorizacion_lider);
    }
    
    if (data.lider_id) {
      formData.append('lider_id', data.lider_id);
    }

    return api.post(`/bobinas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/bobinas/${id}`),
  getClientes: () => api.get('/bobinas/clientes'),
  verificarAutorizacionLider: (credenciales) => api.post('/bobinas/verificar-autorizacion', credenciales),
};
