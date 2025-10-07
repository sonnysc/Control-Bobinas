// src/components/config/ConfigForm.js
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
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
      console.error('Error saving config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Cliente"
        name="cliente"
        value={formData.cliente}
        onChange={handleInputChange}
        required
        margin="normal"
        disabled={isEdit}
      />

      <TextField
        fullWidth
        label="Días de Retención"
        name="dias_retencion"
        type="number"
        value={formData.dias_retencion}
        onChange={handleInputChange}
        required
        margin="normal"
        inputProps={{ min: 1 }}
        helperText="Los registros más antiguos se eliminarán automáticamente después de este período"
      />

      <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          fullWidth
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigForm;
