// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import ActivityTracker from './components/ActivityTracker';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import BobinaList from './components/bobinas/BobinaList';
import BobinaForm from './components/bobinas/BobinaForm';
import UserList from './components/users/UserList';
import ConfigList from './components/config/ConfigList';
import Inventario from './pages/Inventario'; // ✅ NUEVA IMPORTACIÓN
import { ROLES } from './utils/constants';

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

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <ActivityTracker />
      {children}
    </>
  );
};

const LoginRedirect = () => {
  const { user } = useAuth();

  if (user) {
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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <BobinaList />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/bobinas/nueva" element={
        <ProtectedRoute requiredRoles={[ROLES.EMBARCADOR]}>
          <Layout>
            <BobinaForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/bobinas/editar/:id" element={
        <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
          <Layout>
            <BobinaForm />
          </Layout>
        </ProtectedRoute>
      } />

      {/* ✅ NUEVA RUTA - SOLO ADMIN */}
      <Route path="/inventario" element={
        <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
          <Layout>
            <Inventario />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

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