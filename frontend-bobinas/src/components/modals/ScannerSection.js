// src/components/modals/ScannerSection.js

import React from 'react';
import {
  Box,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { QrCodeScanner } from '@mui/icons-material';

const ScannerSection = ({
  formData,
  onInputChange,
  qrError,
  onOpenScannerModal
}) => {
  const isHttps = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

  return (
    <Box sx={{ width: '100%' }}>
      {/* Contenedor Flex para alinear input y botón */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        
        {/* Input HU Refinado */}
        <TextField
          label="HU (9 dígitos)"
          name="hu"
          value={formData.hu}
          onChange={onInputChange}
          fullWidth
          required
          // ✅ Estilos aplicados: Delgado y Bordes Redondeados
          size="small" 
          InputLabelProps={{ shrink: true }}
          sx={{
            bgcolor: 'white',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px'
            }
          }}
          inputProps={{
            maxLength: 9,
            pattern: "^[0-9]{9}$",
            title: "El HU debe tener exactamente 9 dígitos"
          }}
          // Mostrar error solo si existe y es inválido
          error={Boolean(formData.hu && !/^[0-9]{9}$/.test(formData.hu))}
          helperText={formData.hu && !/^[0-9]{9}$/.test(formData.hu) ? 
            "Debe tener 9 dígitos" : ""}
        />

        {/* Botón Escanear alineado y estilizado */}
        <Button
          variant="contained"
          onClick={onOpenScannerModal}
          disabled={!isHttps && !isLocalhost}
          title="Abrir escáner QR"
          startIcon={<QrCodeScanner />}
          sx={{
            height: '40px', // Misma altura que el input small
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            borderRadius: '8px',
            px: 2,
            backgroundColor: '#1976d2',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#1565c0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            },
            '&:disabled': {
              backgroundColor: '#e0e0e0'
            }
          }}
        >
          Escanear
        </Button>
      </Box>

      {/* Alertas */}
      {!isHttps && !isLocalhost && (
        <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
          ⚠️ El escáner requiere HTTPS.
        </Alert>
      )}

      {qrError && (
        <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
          {qrError}
        </Alert>
      )}
    </Box>
  );
};

export default ScannerSection;