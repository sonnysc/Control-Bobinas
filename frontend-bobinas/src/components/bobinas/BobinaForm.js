// src/components/bobinas/BobinaForm.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { bobinaService } from '../../services/bobinas';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const BobinaForm = () => {
  const [formData, setFormData] = useState({
    hu: '',
    cliente: '',
    foto: null
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clientes, setClientes] = useState([]);
  const [existingBobina, setExistingBobina] = useState(null);
  const [autorizacionDialog, setAutorizacionDialog] = useState(false);
  const [credencialesLider, setCredencialesLider] = useState({
    username: '',
    password: ''
  });
  const [autorizando, setAutorizando] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();

  const loadBobina = useCallback(async () => {
    try {
      const response = await bobinaService.getById(id);
      const bobina = response.data;
      setFormData({
        hu: bobina.hu,
        cliente: bobina.cliente || '',
        foto: null
      });
      setPreview(`http://localhost:8000/storage/${bobina.foto_path}`);
    } catch (error) {
      setError('Error al cargar la bobina');
    }
  }, [id]);

  useEffect(() => {
    if (user?.role === ROLES.ADMIN || user?.role === ROLES.INGENIERO) {
      loadClientes();
    }
    if (isEdit && user?.role === ROLES.ADMIN) {
      loadBobina();
    }
  }, [isEdit, id, user?.role, loadBobina]);

  const loadClientes = async () => {
    try {
      const response = await bobinaService.getClientes();
      setClientes(response.data);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, foto: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const verificarLider = async () => {
    setAutorizando(true);
    setError('');
    try {
      await ejecutarReemplazo();
    } finally {
      setAutorizando(false);
    }
  };

  const ejecutarReemplazo = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('hu', formData.hu);
      formDataToSend.append('cliente', formData.cliente || '');
      formDataToSend.append('lider_username', credencialesLider.username);
      formDataToSend.append('lider_password', credencialesLider.password);
      formDataToSend.append('reemplazado_por', user?.id);

      if (formData.foto) {
        formDataToSend.append('foto', formData.foto);
      }

      await bobinaService.create(formDataToSend);

      setSuccess('Bobina reemplazada correctamente con autorización de líder');
      setAutorizacionDialog(false);
      setExistingBobina(null);

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      setError('Error al reemplazar la bobina: ' + (error.response?.data?.message || 'Error del servidor'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEdit) {
        if (user?.role === ROLES.ADMIN) {
          const formDataToSend = new FormData();
          formDataToSend.append('hu', formData.hu);
          formDataToSend.append('cliente', formData.cliente || '');
          formDataToSend.append('_method', 'PUT');

          if (formData.foto) {
            formDataToSend.append('foto', formData.foto);
          }

          await bobinaService.update(id, formDataToSend);
          setSuccess('Bobina actualizada correctamente');
        }
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append('hu', formData.hu);
        formDataToSend.append('cliente', formData.cliente || '');
        if (formData.foto) {
          formDataToSend.append('foto', formData.foto);
        }

        try {
          await bobinaService.create(formDataToSend);
          setSuccess('Bobina registrada correctamente');
          setTimeout(() => navigate('/'), 1500);
        } catch (error) {
          if (error.response?.status === 422 || error.response?.status === 409) {
            console.log("Error detectado:", error.response.data);

            const errorData = error.response.data;

            if (
              errorData.errors?.hu ||
              errorData.exists ||
              (errorData.message && (
                errorData.message.includes('already been taken') ||
                errorData.message.includes('fotografía registrada')
              ))
            ) {
              try {
                const response = await bobinaService.getAll({ search: formData.hu });
                if (response.data.data.length > 0) {
                  const bobinaExistente = response.data.data[0];
                  setExistingBobina(bobinaExistente);
                  console.log("✅ Abriendo modal de líder...", bobinaExistente);
                  setAutorizacionDialog(true);
                } else {
                  setError('Bobina encontrada pero no se pudo obtener información completa');
                }
              } catch (searchError) {
                setError('Error al buscar la bobina existente');
              }
            } else {
              setError(errorData.message || 'Error de validación');
            }
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = () => {
    setAutorizacionDialog(true);
  };

  const handleCancelReplace = () => {
    setExistingBobina(null);
    setFormData(prev => ({ ...prev, hu: '' }));
  };

  const handleCredencialesChange = (e) => {
    const { name, value } = e.target;
    setCredencialesLider(prev => ({ ...prev, [name]: value }));
  };

  // Mover esta verificación dentro del return principal
  if (isEdit && user?.role !== ROLES.ADMIN) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
          Volver
        </Button>
        <Alert severity="error">No tienes permisos para editar bobinas</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Volver
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {isEdit ? 'Editar Bobina' : 'Registrar Nueva Bobina'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {existingBobina && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                ¡Esta bobina ya está registrada! ¿Desea reemplazar la información?
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button variant="contained" color="warning" onClick={handleReplace} sx={{ mr: 1 }}>
                  Sí, reemplazar
                </Button>
                <Button variant="outlined" onClick={handleCancelReplace}>
                  Cancelar
                </Button>
              </Box>
            </Alert>
          )}

          <Dialog open={autorizacionDialog} onClose={() => setAutorizacionDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Autorización de Líder Requerida</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 2 }}>Ingrese las credenciales del líder:</Typography>
              <TextField fullWidth label="Usuario" name="username" value={credencialesLider.username}
                onChange={handleCredencialesChange} margin="normal" required />
              <TextField fullWidth label="Contraseña" name="password" type="password"
                value={credencialesLider.password} onChange={handleCredencialesChange} margin="normal" required />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAutorizacionDialog(false)}>Cancelar</Button>
              <Button onClick={verificarLider} variant="contained"
                disabled={autorizando || !credencialesLider.username || !credencialesLider.password}>
                {autorizando ? 'Verificando...' : 'Autorizar'}
              </Button>
            </DialogActions>
          </Dialog>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="HU de la Bobina" name="hu" value={formData.hu}
                  onChange={handleInputChange} required disabled={isEdit || !!existingBobina} />
              </Grid>

              <Grid item xs={12} md={6}>
                {user?.role === ROLES.EMBARCADOR ? (
                  <TextField fullWidth label="Cliente" name="cliente" value={formData.cliente}
                    onChange={handleInputChange} placeholder="Ingrese el nombre del cliente" />
                ) : (
                  <FormControl fullWidth>
                    <InputLabel>Cliente</InputLabel>
                    <Select name="cliente" value={formData.cliente} label="Cliente" onChange={handleInputChange}>
                      <MenuItem value="">Seleccionar cliente</MenuItem>
                      {clientes.map(cliente => (
                        <MenuItem key={cliente} value={cliente}>{cliente}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ height: '56px' }}>
                  Subir Fotografía
                  <input type="file" accept="image/*" hidden onChange={handleFileChange} required={!isEdit} />
                </Button>
                {formData.foto && <Typography variant="caption" sx={{ ml: 1 }}>{formData.foto.name}</Typography>}
              </Grid>

              {preview && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>Vista Previa</Typography>
                    <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button type="submit" variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading || !!existingBobina} fullWidth size="large">
                  {loading ? 'Procesando...' : isEdit ? 'Actualizar Bobina' : 'Registrar Bobina'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BobinaForm;