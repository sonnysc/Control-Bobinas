// src/components/users/UserForm.js
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { userService } from '../../services/users';

const UserForm = ({ user, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    role: user?.role || 'embarcador'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await userService.update(user.id, formData);
      } else {
        await userService.create(formData);
      }
      
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar el usuario');
      console.error('Error saving user:', error);
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
        label="Nombre de usuario"
        name="username"
        value={formData.username}
        onChange={handleInputChange}
        required
        margin="normal"
      />

      <TextField
        fullWidth
        label="Contraseña"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleInputChange}
        required={!isEdit}
        margin="normal"
        helperText={isEdit ? 'Dejar vacío para mantener la contraseña actual' : ''}
      />

      <FormControl fullWidth margin="normal" required>
        <InputLabel>Rol</InputLabel>
        <Select
          name="role"
          value={formData.role}
          label="Rol"
          onChange={handleInputChange}
        >
          <MenuItem value="admin">Administrador</MenuItem>
          <MenuItem value="ingeniero">Ingeniero</MenuItem>
          <MenuItem value="embarcador">Embarcador</MenuItem>
        </Select>
      </FormControl>

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

export default UserForm;