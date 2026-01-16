// src/components/config/ConfigForm.js
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Business as BusinessIcon,
  DateRange as DateRangeIcon
  // ✅ Eliminados SaveIcon y CancelIcon
} from '@mui/icons-material';
import { configService } from '../../services/config';

const ConfigForm = ({ config, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    cliente: config?.cliente || '',
    dias_retencion: config?.dias_retencion || 90
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(config);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await configService.update(config.id, formData);
      } else {
        await configService.create(formData);
      }
      
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
        pt: 3,
        px: 0.5
      }}
    >
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: '8px',
            border: '1px solid #f44336',
            bgcolor: '#ffebee',
            mb: 1,
            mt: 0
          }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ 
        mt: 2,
      }}>
        <TextField
          fullWidth
          label="Cliente"
          name="cliente"
          value={formData.cliente}
          onChange={handleInputChange}
          required
          disabled={isEdit}
          size="small"
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BusinessIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            sx: { 
              borderRadius: '8px', 
              bgcolor: '#f8f9fa',
              '& .MuiInputBase-input': {
                paddingTop: '10px',
                paddingBottom: '10px',
              },
              '& fieldset': {
                borderColor: '#bdbdbd !important',
                borderWidth: '1px !important'
              }
            }
          }}
          InputLabelProps={{
            sx: {
              color: '#555',
              fontWeight: 500,
              fontSize: '0.95rem',
              transform: 'translate(14px, 14px) scale(1)',
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -9px) scale(0.85)',
                backgroundColor: 'white',
                padding: '0 6px',
                marginLeft: '-6px'
              }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#1976d2',
                borderWidth: '1px'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
                borderWidth: '2px'
              },
              '& fieldset': {
                borderColor: '#bdbdbd',
                borderWidth: '1px'
              }
            }
          }}
          placeholder="Ej: Sumitomo"
        />
      </Box>

      <Box sx={{ mt: 0.5 }}>
        <TextField
          fullWidth
          label="Días de Retención"
          name="dias_retencion"
          type="number"
          value={formData.dias_retencion}
          onChange={handleInputChange}
          required
          size="small"
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <DateRangeIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            sx: { 
              borderRadius: '8px', 
              bgcolor: '#f8f9fa',
              '& .MuiInputBase-input': {
                paddingTop: '10px',
                paddingBottom: '10px',
                '&[type=number]': {
                  MozAppearance: 'textfield',
                },
                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              },
              '& fieldset': {
                borderColor: '#bdbdbd !important',
                borderWidth: '1px !important'
              }
            }
          }}
          InputLabelProps={{
            sx: {
              color: '#555',
              fontWeight: 500,
              fontSize: '0.95rem',
              transform: 'translate(14px, 14px) scale(1)',
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -9px) scale(0.85)',
                backgroundColor: 'white',
                padding: '0 6px',
                marginLeft: '-6px'
              }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#1976d2',
                borderWidth: '1px'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
                borderWidth: '2px'
              },
              '& fieldset': {
                borderColor: '#bdbdbd',
                borderWidth: '1px'
              }
            }
          }}
          inputProps={{ 
            min: 1,
            step: 1
          }}
          helperText="Período antes de la eliminación automática"
          FormHelperTextProps={{
            sx: {
              marginLeft: 0,
              fontSize: '0.75rem',
              color: '#666',
              marginTop: '4px'
            }
          }}
        />
      </Box>

      <Box sx={{ 
        display: 'flex', 
        gap: 1,
        mt: 1,
        pt: 1.5,
        borderTop: '1px solid #eef0f2'
      }}>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          fullWidth
          sx={{ 
            borderRadius: '8px', 
            height: '40px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            fontSize: '0.95rem',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
              boxShadow: '0 2px 8px rgba(21, 101, 192, 0.25)'
            },
            '&.Mui-disabled': {
              background: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={onCancel}
          fullWidth
          sx={{ 
            borderRadius: '8px',
            height: '40px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#ddd',
            color: '#555',
            fontSize: '0.95rem',
            '&:hover': {
              borderColor: '#1976d2',
              bgcolor: 'rgba(25, 118, 210, 0.04)',
              color: '#1976d2'
            }
          }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigForm;