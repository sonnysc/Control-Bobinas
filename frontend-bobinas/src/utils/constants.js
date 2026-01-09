// src/utils/constants.js

export const ROLES = {
  ADMIN: 'admin',
  INGENIERO: 'ingeniero',
  EMBARCADOR: 'embarcador',
  LIDER: 'lider' 
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.INGENIERO]: 'Ingeniero',
  [ROLES.EMBARCADOR]: 'Embarcador',
  [ROLES.LIDER]: 'Líder' 
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: 'error',
  [ROLES.INGENIERO]: 'warning',
  [ROLES.EMBARCADOR]: 'success',
  [ROLES.LIDER]: 'info' 
};

// ✅ Lógica dinámica también aquí para constantes
const getBaseUrl = () => {
  if (typeof window === 'undefined') return ''; // Prevenir error en build time
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  
  const { protocol, hostname } = window.location;
  // Ajusta el puerto aquí si tu backend no está en el puerto 80/443
  return `${protocol}//${hostname}/api`;
};

export const API_BASE_URL = getBaseUrl();
export const APP_NAME = process.env.REACT_APP_APP_NAME || 'Control de Embarcaciones';

export const MENU_ITEMS = [
  { text: 'Inicio', icon: 'DashboardIcon', path: '/', roles: [ROLES.ADMIN, ROLES.INGENIERO, ROLES.EMBARCADOR, ROLES.LIDER] },
  { text: 'Nueva Bobina', icon: 'AddIcon', path: '/bobinas/nueva', roles: [ROLES.EMBARCADOR] },
  { text: 'Inventario', icon: 'InventoryIcon', path: '/inventario', roles: [ROLES.ADMIN] },
  { text: 'Usuarios', icon: 'PeopleIcon', path: '/usuarios', roles: [ROLES.ADMIN] },
  { text: 'Configuraciones', icon: 'SettingsIcon', path: '/configuraciones', roles: [ROLES.ADMIN] }
];

export const DEFAULT_RETENTION_DAYS = 90;