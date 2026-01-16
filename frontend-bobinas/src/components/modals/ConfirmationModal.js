// src/components/modals/ConfirmationModal.js
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
  Avatar,
  IconButton
} from '@mui/material';
import { 
    WarningAmber, 
    Replay, 
    Close
} from '@mui/icons-material';

const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  formData
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
          backgroundColor: '#fefefe'
        }
      }}
    >
      {/* Header con más separación del contenido */}
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
        color: 'white',
        textAlign: 'center',
        py: 2,
        fontSize: '1.1rem',
        fontWeight: 700,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        pb: 3, // ✅ AÑADIDO: Más padding bottom
        mb: 1, // ✅ AÑADIDO: Margen bottom adicional
        position: 'relative'
      }}>
        <Avatar sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            width: 40,
            height: 40,
            marginBottom: 0.5,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <WarningAmber sx={{ fontSize: 22, color: 'white' }} />
        </Avatar>
        
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Bobina ya Registrada
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
          py: 3,
          pb: 1.5,
          minHeight: '220px',
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
          gap: 1.5,
          mt: 2 // ✅ AÑADIDO: Más margen superior para separar del header
        }}>
          {/* Alerta de warning con más margen superior */}
          <Alert
            severity="warning"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#fff3e0',
              width: '100%',
              textAlign: 'left',
              fontSize: '0.9rem',
              mb: 1,
              mt: 1 // ✅ AÑADIDO: Margen superior adicional
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              La bobina con <strong>HU {formData.hu}</strong> ya está registrada en el sistema.
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ 
            fontSize: '0.95rem',
            mb: 1
          }}>
            ¿Desea <strong>reemplazar</strong> esta bobina con la nueva información?
          </Typography>

          <Alert
            severity="info"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#e3f2fd',
              width: '100%',
              textAlign: 'left',
              fontSize: '0.9rem'
            }}
          >
            <Typography variant="body2">
              <strong>Nota:</strong> Para reemplazar una bobina existente se requiere autorización de un líder.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 4,
          pb: 3,
          pt: 0.5,
          justifyContent: 'center',
          gap: 2,
          mt: 0
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 0.8,
            fontWeight: 600,
            color: '#555',
            borderColor: '#bbb',
            fontSize: '0.9rem',
            '&:hover': {
              borderColor: '#999',
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          startIcon={<Replay sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 0.8,
            fontWeight: 600,
            backgroundColor: '#ff9800',
            fontSize: '0.9rem',
            '&:hover': {
              backgroundColor: '#fb8c00',
              transform: 'scale(1.03)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Reemplazar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;