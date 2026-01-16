// src/components/auth/Login.js
import React, { useState, useEffect } from 'react';
import { 
  Paper, TextField, Button, Typography, Box, 
  Alert, CircularProgress, InputAdornment, IconButton, Fade, Grow
} from '@mui/material';
import { 
  PersonOutline, 
  LockOutlined, 
  Visibility, 
  VisibilityOff,
  Login as LoginIcon
} from '@mui/icons-material';
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
  const [showPassword, setShowPassword] = useState(false);
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
      setError('Su sesión ha expirado por inactividad.');
      
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location, clearSession]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
    
    if (error) setError('');
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: '' });
  };

  const validateForm = () => {
    const newFieldErrors = { username: '', password: '' };
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
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setFieldErrors({ username: '', password: '' });

    try {
      const result = await login(credentials);
      
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message);
        if (result.message.toLowerCase().includes('usuario')) {
          setFieldErrors(prev => ({ ...prev, username: 'Verifique el usuario' }));
        } else if (result.message.toLowerCase().includes('contraseña')) {
          setFieldErrors(prev => ({ ...prev, password: 'Verifique la contraseña' }));
        }
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{
        width: '100vw', // Asegura ancho completo del viewport
        height: '100vh', // Asegura alto completo del viewport
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center', // Centrado Vertical
        justifyContent: 'center', // Centrado Horizontal
        background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        margin: 0,
        padding: 2,
        overflow: 'hidden' // Evita scrolls innecesarios si no se desborda
      }}
    >
      <Grow in={true} timeout={800}>
        <Paper 
          elevation={24} 
          sx={{ 
            width: '100%',
            maxWidth: 400,
            padding: 4,
            borderRadius: '24px',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', // Centra el contenido (Logo, Textos) horizontalmente dentro de la tarjeta
            textAlign: 'center' // Asegura que el texto multilínea también se centre
          }}
        >
          {/* Logo Container */}
          <Box 
            sx={{ 
              mb: 3,
              p: 2,
              borderRadius: '50%',
              bgcolor: 'white',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 140, 
              height: 140
            }}
          >
            <img 
              src="/Logo-COFICAB.png" 
              alt="Logo" 
              style={{ 
                maxWidth: '90%', 
                maxHeight: '90%', 
                objectFit: 'contain' 
              }} 
            />
          </Box>

          <Typography 
            component="h1" 
            variant="h5" 
            fontWeight="bold" 
            color="primary.main" 
            gutterBottom
            align="center" // Centrado explícito del texto
          >
            {APP_NAME}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mb: 2 }}
            align="center" // Centrado explícito del texto
          >
            Ingrese sus credenciales para continuar
          </Typography>

          <Fade in={!!error}>
            <Box sx={{ width: '100%', mb: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ borderRadius: '12px' }} onClose={() => setError('')}>
                    {error}
                    </Alert>
                )}
            </Box>
          </Fade>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="dense"
              fullWidth
              id="username"
              label="Usuario"
              name="username"
              autoComplete="username"
              autoFocus
              value={credentials.username}
              onChange={handleChange}
              disabled={loading}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline fontSize="small" color={fieldErrors.username ? "error" : "action"} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '10px', fontSize: '0.9rem' }
              }}
              InputLabelProps={{ sx: { fontSize: '0.9rem' } }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              disabled={loading}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined fontSize="small" color={fieldErrors.password ? "error" : "action"} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: '10px', fontSize: '0.9rem' }
              }}
              InputLabelProps={{ sx: { fontSize: '0.9rem' } }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                py: 1, 
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LoginIcon fontSize="small" /> Iniciar Sesión
                </Box>
              )}
            </Button>
          </Box>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="caption" color="text.disabled" align="center">
              © {new Date().getFullYear()} COFICAB - Gestión de Embarcaciones.
            </Typography>
          </Box>
        </Paper>
      </Grow>
    </Box>
  );
};

export default Login;