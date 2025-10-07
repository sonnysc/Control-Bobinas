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
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';

const AuthorizationModal = ({
  open,
  onClose,
  credencialesLider,
  onCredencialesChange,
  onAuthorize,
  autorizando,
  error // Nueva prop para errores
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          backgroundColor: '#fff'
        }
      }}
    >
      <DialogTitle sx={{
        backgroundColor: '#2196f3',
        color: 'white',
        textAlign: 'center',
        py: 3,
        fontSize: '1.3rem',
        fontWeight: 700,
        position: 'relative'
      }}>
        🔐 Autorización Requerida
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
            transition: 'all 0.2s ease'
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 4,
          py: 2,
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          height: '100%',
          gap: 1.5
        }}>
          {/* Mostrar error dentro del modal */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: '12px',
                width: '100%',
                textAlign: 'left',
                mb: 2
              }}
              onClose={() => {}} // No permitir cerrar el error aquí
            >
              {error}
            </Alert>
          )}

          <Alert
            severity="info"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#e3f2fd',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <Typography variant="body1">
              Para reemplazar una bobina existente, se requiere la autorización de un líder.
            </Typography>
          </Alert>

          <Typography variant="subtitle2" color="text.secondary" sx={{ alignSelf: 'flex-start', mt: 2 }}>
            Credenciales del Líder:
          </Typography>

          <TextField
            fullWidth
            label="Usuario"
            name="username"
            value={credencialesLider.username}
            onChange={onCredencialesChange}
            required
            InputProps={{
              sx: { borderRadius: '8px' }
            }}
            disabled={autorizando}
          />
          <TextField
            fullWidth
            label="Contraseña"
            name="password"
            type="password"
            value={credencialesLider.password}
            onChange={onCredencialesChange}
            required
            InputProps={{
              sx: { borderRadius: '8px' }
            }}
            disabled={autorizando}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 4,
          pb: 3,
          pt: 1,
          justifyContent: 'center',
          gap: 2,
          backgroundColor: '#f8f9fa'
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={autorizando}
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 1,
            fontWeight: 600,
            borderColor: '#ddd',
            color: '#666',
            '&:hover': {
              backgroundColor: '#f0f0f0',
              borderColor: '#bbb'
            }
          }}
        >
          ✕ Cancelar
        </Button>
        <Button
          onClick={onAuthorize}
          variant="contained"
          disabled={autorizando || !credencialesLider.username || !credencialesLider.password}
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 1,
            fontWeight: 600,
            backgroundColor: '#2196f3',
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
            '🔓 Autorizar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthorizationModal;