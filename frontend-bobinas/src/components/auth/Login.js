// src/components/auth/Login.js
import React, { useState, useEffect } from 'react';
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
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    password: ''
  });
  
  const { login, clearSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const reason = urlParams.get('reason');
    
    if (reason === 'inactivity') {
      clearSession();
      setError('Su sesión ha expirado por inactividad. Por favor, inicie sesión nuevamente.');
      
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location, clearSession]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setCredentials({
      ...credentials,
      [name]: value
    });
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) {
      setError('');
    }
    
    // Limpiar error específico del campo
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newFieldErrors = {
      username: '',
      password: ''
    };
    
    let hasErrors = false;

    if (!credentials.username.trim()) {
      newFieldErrors.username = 'El usuario es requerido';
      hasErrors = true;
    }

    if (!credentials.password.trim()) {
      newFieldErrors.password = 'La contraseña es requerida';
      hasErrors = true;
    }
    
    setFieldErrors(newFieldErrors);
    
    if (hasErrors) {
      setError('Por favor, complete todos los campos');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({ username: '', password: '' });

    const result = await login(credentials);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
      
      // Manejar errores específicos del backend
      if (result.message.includes('usuario no existe')) {
        setFieldErrors({
          username: 'El usuario no existe',
          password: ''
        });
      } else if (result.message.includes('Contraseña incorrecta')) {
        setFieldErrors({
          username: '',
          password: 'Contraseña incorrecta'
        });
      } else if (result.message.includes('incorrecto') || result.message.includes('incorrecta') || result.message.includes('incorrectos')) {
        // Para mantener compatibilidad con el mensaje anterior
        setFieldErrors({
          username: 'Credenciales inválidas',
          password: 'Credenciales inválidas'
        });
      }
    }
    
    setLoading(false);
  };

  return (
    <Container 
      component="main" 
      maxWidth="sm"
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
          padding: 3,
          width: '100%',
          mx: 2
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2,
            backgroundColor: '#2c3e50',
            borderRadius: 2,
            p: 2,
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
          sx={{ mb: 1 }}
        >
          {APP_NAME}
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }} 
            onClose={() => {
              setError('');
              setFieldErrors({ username: '', password: '' });
            }}
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
            size="small"
            error={!!fieldErrors.username}
            helperText={fieldErrors.username}
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
            size="small"
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 1 }}
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