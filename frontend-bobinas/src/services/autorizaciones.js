// src/services/autorizaciones.js
import api from './api';

export const autorizacionService = {
  getPendientes: () => api.get('/autorizaciones/pendientes'),
  aprobar: (id) => api.post(`/autorizaciones/${id}/aprobar`),
  rechazar: (id) => api.post(`/autorizaciones/${id}/rechazar`),
  solicitar: (data) => api.post('/autorizaciones/solicitar', data),
};