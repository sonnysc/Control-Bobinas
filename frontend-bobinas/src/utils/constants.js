// src/utils/constants.js
export const ROLES = {
  ADMIN: 'admin',
  INGENIERO: 'ingeniero',
  EMBARCADOR: 'embarcador'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.INGENIERO]: 'Ingeniero',
  [ROLES.EMBARCADOR]: 'Embarcador'
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: 'error',
  [ROLES.INGENIERO]: 'warning',
  [ROLES.EMBARCADOR]: 'success'
};

export const ESTADOS_BOBINA = {
  BUENO: 'bueno',
  REGULAR: 'regular',
  MALO: 'malo'
};

export const ESTADO_LABELS = {
  [ESTADOS_BOBINA.BUENO]: 'Bueno',
  [ESTADOS_BOBINA.REGULAR]: 'Regular',
  [ESTADOS_BOBINA.MALO]: 'Malo'
};

export const ESTADO_COLORS = {
  [ESTADOS_BOBINA.BUENO]: 'success',
  [ESTADOS_BOBINA.REGULAR]: 'warning',
  [ESTADOS_BOBINA.MALO]: 'error'
};

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const APP_NAME = process.env.REACT_APP_APP_NAME || 'Control de Embarcaciones';

export const MENU_ITEMS = [
  { text: 'Inicio', icon: 'DashboardIcon', path: '/', roles: [ROLES.ADMIN, ROLES.INGENIERO, ROLES.EMBARCADOR] },
  { text: 'Nueva Bobina', icon: 'AddIcon', path: '/bobinas/nueva', roles: [ROLES.ADMIN, ROLES.EMBARCADOR] },
  { text: 'Usuarios', icon: 'PeopleIcon', path: '/usuarios', roles: [ROLES.ADMIN] },
  { text: 'Configuraciones', icon: 'SettingsIcon', path: '/configuraciones', roles: [ROLES.ADMIN] }
];

export const DEFAULT_RETENTION_DAYS = 90;