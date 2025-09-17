// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import BobinaList from './components/bobinas/BobinaList';
import BobinaForm from './components/bobinas/BobinaForm';
import UserList from './components/users/UserList';
import ConfigList from './components/config/ConfigList';
import { ROLES } from './utils/constants';
import AutorizacionList from './components/autorizaciones/AutorizacionList';

// Crear tema personalizado
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5c8d',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          },
        },
      },
    },
  },
});

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();

  // Mostrar nada mientras se carga la autenticación
  if (loading) {
    return null;
  }

  // Redirigir al login si no está autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir al home si no tiene los roles requeridos
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente para redirección después del login
const LoginRedirect = () => {
  const { user } = useAuth();

  if (user) {
    // Redirigir basado en el rol del usuario
    switch (user.role) {
      case ROLES.ADMIN:
      case ROLES.INGENIERO:
      case ROLES.LIDER:
        return <Navigate to="/" replace />;
      case ROLES.EMBARCADOR:
        return <Navigate to="/bobinas/nueva" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <Login />;
};

// Componente principal de rutas - MOVER useAuth DENTRO de este componente
const AppRoutes = () => {
  const { user } = useAuth(); // <-- MOVER useAuth AQUÍ

  return (
    <Routes>
      {/* Ruta de login */}
      <Route path="/login" element={<LoginRedirect />} />

      {/* Rutas protegidas */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            {user?.role === ROLES.EMBARCADOR ? (
              <Navigate to="/bobinas/nueva" replace />
            ) : (
              <BobinaList />
            )}
          </Layout>
        </ProtectedRoute>
      } />

      {/* Solo embarcadores pueden crear bobinas */}
      <Route path="/bobinas/nueva" element={
        <ProtectedRoute requiredRoles={[ROLES.EMBARCADOR]}>
          <Layout>
            <BobinaForm />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Solo admin puede editar */}
      <Route path="/bobinas/editar/:id" element={
        <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
          <Layout>
            <BobinaForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/autorizaciones" element={
        <ProtectedRoute requiredRoles={[ROLES.LIDER]}>
          <Layout>
            <AutorizacionList />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/usuarios" element={
        <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
          <Layout>
            <UserList />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/configuraciones" element={
        <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
          <Layout>
            <ConfigList />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Ruta por defecto - redirigir al home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Componente principal de la aplicación
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;