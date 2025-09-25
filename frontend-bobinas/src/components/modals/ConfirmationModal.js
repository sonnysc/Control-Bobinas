import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Box
} from '@mui/material';
import { WarningAmber, Replay } from '@mui/icons-material';

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
      <DialogTitle sx={{
        background: 'linear-gradient(90deg, #ff9800 0%, #ffa726 100%)',
        color: 'white',
        textAlign: 'center',
        py: 3,
        fontSize: '1.3rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1
      }}>
        <WarningAmber sx={{ fontSize: '1.8rem' }} />
        Bobina ya Registrada
      </DialogTitle>

      <DialogContent
        sx={{
          px: 4,
          py: 3,
          minHeight: '250px',
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
          gap: 2
        }}>
          <Alert
            severity="warning"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#fff3e0',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              La bobina con <strong>HU {formData.hu}</strong> ya está registrada en el sistema.
            </Typography>
          </Alert>

          <Typography variant="body1" sx={{ fontSize: '1rem' }}>
            ¿Desea <strong>reemplazar</strong> esta bobina con la nueva información?
          </Typography>

          <Alert
            severity="info"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#e3f2fd',
              width: '100%',
              textAlign: 'left'
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
          pt: 1,
          justifyContent: 'center',
          gap: 2
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 1,
            fontWeight: 500,
            color: '#555',
            borderColor: '#bbb',
            '&:hover': {
              borderColor: '#999',
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          ✕ Cancelar
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          startIcon={<Replay />}
          sx={{
            borderRadius: '8px',
            px: 3,
            py: 1,
            fontWeight: 600,
            backgroundColor: '#ff9800',
            '&:hover': {
              backgroundColor: '#fb8c00',
              transform: 'scale(1.03)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Sí, Reemplazar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;