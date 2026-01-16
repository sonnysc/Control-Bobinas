// src/components/modals/AuthorizationModal.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Box,
  TextField,
  CircularProgress,
  IconButton,
  Avatar,
  InputAdornment
} from '@mui/material';
import { 
    Close, 
    Security,
    Person,
    Lock
} from '@mui/icons-material';

const AuthorizationModal = ({
  open,
  onClose,
  credencialesLider,
  onCredencialesChange,
  onAuthorize,
  autorizando,
  error
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          backgroundColor: '#fff',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{
        backgroundColor: '#2196f3',
        color: 'white',
        textAlign: 'center',
        py: 2,
        fontSize: '1.1rem',
        fontWeight: 700,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        flexShrink: 0,
        pb: 3,
        mb: 1
      }}>
        <Avatar sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            width: 40,
            height: 40,
            marginBottom: 0.5,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <Security sx={{ fontSize: 22, color: 'white' }} />
        </Avatar>
        
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Autorización Requerida
        </Typography>
        
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s ease',
            width: 32,
            height: 32
          }}
        >
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 4,
          py: 2,
          pb: 1,
          overflow: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          gap: 1.5,
          py: 1,
          mt: 2
        }}>
          {/* Se eliminó el error de aquí */}

          <Alert
            severity="info"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#e3f2fd',
              width: '100%',
              textAlign: 'left',
              fontSize: '0.9rem',
              mb: 1,
            }}
          >
            <Typography variant="body2">
              Para reemplazar una bobina existente, se requiere la autorización de un líder.
            </Typography>
          </Alert>

          <Typography variant="subtitle2" color="text.secondary" sx={{ 
            alignSelf: 'flex-start', 
            mt: 0.5,
            fontWeight: 600,
            fontSize: '0.9rem',
            mb: 1
          }}>
            Credenciales del Líder:
          </Typography>

          {/* Input de Usuario con icono */}
          <TextField
            fullWidth
            label="Usuario"
            name="username"
            value={credencialesLider.username}
            onChange={onCredencialesChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ fontSize: 18, color: 'action.active' }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '8px',
                fontSize: '0.9rem'
              }
            }}
            disabled={autorizando}
            size="small"
            sx={{ mb: 1.5 }}
          />
          
          {/* Input de Contraseña con icono */}
          <TextField
            fullWidth
            label="Contraseña"
            name="password"
            type="password"
            value={credencialesLider.password}
            onChange={onCredencialesChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ fontSize: 18, color: 'action.active' }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '8px',
                fontSize: '0.9rem'
              }
            }}
            disabled={autorizando}
            size="small"
            sx={{ mb: 0.5 }} // ✅ REDUCIDO: Menos espacio para que el error esté más cerca
          />

          {/* Mensaje de error compacto debajo de los inputs */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: '8px',
                width: '100%',
                textAlign: 'left',
                mt: 0.5, // ✅ POCO margen superior
                mb: 0.5, // ✅ POCO margen inferior
                py: 0.5, // ✅ COMPACTO: Padding vertical mínimo
                fontSize: '0.8rem', // ✅ MÁS PEQUEÑO
                '& .MuiAlert-icon': {
                  padding: '4px 0', // ✅ Icono compacto
                  fontSize: '16px'
                },
                '& .MuiAlert-message': {
                  padding: '2px 0', // ✅ Contenido compacto
                  lineHeight: 1.2
                }
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                {error}
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 4,
          pb: 3,
          pt: 1,
          justifyContent: 'center',
          gap: 2,
          backgroundColor: '#f8f9fa',
          mt: 0,
          flexShrink: 0
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={autorizando}
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 0.8,
            fontWeight: 600,
            borderColor: '#ddd',
            color: '#666',
            fontSize: '0.9rem',
            '&:hover': {
              backgroundColor: '#f0f0f0',
              borderColor: '#bbb'
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onAuthorize}
          variant="contained"
          disabled={autorizando || !credencialesLider.username || !credencialesLider.password}
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 0.8,
            fontWeight: 600,
            backgroundColor: '#2196f3',
            fontSize: '0.9rem',
            '&:hover': {
              backgroundColor: '#1976d2',
              transform: 'scale(1.03)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {autorizando ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: 'white' }} />
              Verificando...
            </Box>
          ) : (
            'Autorizar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthorizationModal;