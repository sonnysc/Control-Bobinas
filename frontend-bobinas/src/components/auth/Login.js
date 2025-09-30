// src/components/auth/Login.js
import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_NAME } from '../../utils/constants';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener la ruta a la que redirigir después del login
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validaciones básicas
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Por favor, complete todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(credentials);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <Container 
      component="main" 
      maxWidth="sm" // Cambiado de "xs" a "sm" para más ancho
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 2
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 3, // Reducido el padding para menos largo
          width: '100%',
          mx: 2
        }}
      >
        {/* Logo de la empresa - más compacto */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2, // Menos margen inferior
            backgroundColor: '#2c3e50',
            borderRadius: 2,
            p: 2, // Menos padding interno
            boxShadow: 2
          }}
        >
          <img 
            src="/Logo-COFICAB.png" 
            alt="Logo COFICAB" 
            style={{ 
              maxWidth: '180px',
              maxHeight: '70px',
              objectFit: 'contain'
            }} 
          />
        </Box>

        <Typography 
          component="h1" 
          variant="h4" 
          align="center" 
          gutterBottom 
          color="primary"
          sx={{ mb: 1 }} // Menos espacio inferior
        >
          {APP_NAME}
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Usuario"
            name="username"
            autoComplete="username"
            autoFocus
            value={credentials.username}
            onChange={handleChange}
            disabled={loading}
            size="small" // Campos más compactos
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={handleChange}
            disabled={loading}
            size="small" // Campos más compactos
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 1 }} // Menos margen superior e inferior
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;