// src/components/modals/ScannerSection.js

import React from 'react';
import {
  Box,
  TextField,
  IconButton,
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
        <TextField
          label="HU (9 dígitos)"
          name="hu"
          value={formData.hu}
          onChange={onInputChange}
          fullWidth
          required
          inputProps={{
            maxLength: 9,
            pattern: "^[0-9]{9}$",
            title: "El HU debe tener exactamente 9 dígitos"
          }}
          error={formData.hu && !/^[0-9]{9}$/.test(formData.hu)}
          helperText={formData.hu && !/^[0-9]{9}$/.test(formData.hu) ? 
            "El HU debe tener exactamente 9 dígitos" : "Ingrese 9 dígitos del HU"}
        />

        <IconButton
          onClick={onOpenScannerModal}
          color="primary"
          disabled={!isHttps && !isLocalhost}
          title="Abrir escáner QR"
          sx={{ 
            mt: 1,
            backgroundColor: '#1976d2',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1565c0',
              transform: 'scale(1.1)'
            },
            '&:disabled': {
              backgroundColor: '#ccc'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <QrCodeScanner />
        </IconButton>
      </Box>

      {!isHttps && !isLocalhost && (
        <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
          ⚠️ El escáner requiere HTTPS. Estás usando: {window.location.protocol}
        </Alert>
      )}

      {qrError && (
        <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
          {qrError}
        </Alert>
      )}
    </Box>
  );
};

export default ScannerSection;