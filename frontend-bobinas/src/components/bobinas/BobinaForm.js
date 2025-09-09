// src/components/bobinas/BobinaForm.js
import React, { useState, useEffect } from 'react';
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
  Grid
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { bobinaService } from '../../services/bobinas';

const BobinaForm = () => {
  const [formData, setFormData] = useState({
    hu: '',
    cliente: '',
    estado: 'bueno',
    foto: null
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clientes, setClientes] = useState([]);
  const [isReplace, setIsReplace] = useState(false);
  const [existingBobina, setExistingBobina] = useState(null);
  
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    loadClientes();
    
    if (isEdit) {
      loadBobina();
    }
  }, [isEdit, id]);

  const loadBobina = async () => {
    try {
      const response = await bobinaService.getById(id);
      const bobina = response.data;
      
      setFormData({
        hu: bobina.hu,
        cliente: bobina.cliente || '',
        estado: bobina.estado,
        foto: null
      });
      
      setPreview(`http://localhost:8000/storage/${bobina.foto_path.replace('public/', '')}`);
    } catch (error) {
      setError('Error al cargar la bobina');
      console.error('Error loading bobina:', error);
    }
  };

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
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEdit) {
        await bobinaService.update(id, formData);
        setSuccess('Bobina actualizada correctamente');
      } else {
        const response = await bobinaService.create(formData);
        
        if (response.status === 409) {
          // HU ya existe, preguntar por reemplazo
          setExistingBobina(response.data);
          setIsReplace(true);
          setLoading(false);
          return;
        }
        
        setSuccess('Bobina registrada correctamente');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar la bobina');
      console.error('Error saving bobina:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = async () => {
    setLoading(true);
    setError('');
    
    try {
      await bobinaService.update(existingBobina.id, formData);
      setSuccess('Fotografía reemplazada correctamente');
      setIsReplace(false);
      setExistingBobina(null);
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      setError('Error al reemplazar la fotografía');
      console.error('Error replacing photo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReplace = () => {
    setIsReplace(false);
    setExistingBobina(null);
    setFormData(prev => ({ ...prev, hu: '' }));
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Volver
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {isEdit ? 'Editar Bobina' : 'Registrar Nueva Bobina'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {isReplace && existingBobina && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                Esta bobina ya tiene una fotografía registrada. ¿Desea reemplazarla?
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleReplace}
                  sx={{ mr: 1 }}
                  disabled={loading}
                >
                  Sí, reemplazar
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancelReplace}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </Box>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="HU de la Bobina"
                  name="hu"
                  value={formData.hu}
                  onChange={handleInputChange}
                  required
                  disabled={isEdit || isReplace}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    name="cliente"
                    value={formData.cliente}
                    label="Cliente"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">Seleccionar cliente</MenuItem>
                    {clientes.map(cliente => (
                      <MenuItem key={cliente} value={cliente}>{cliente}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={formData.estado}
                    label="Estado"
                    onChange={handleInputChange}
                    required
                  >
                    <MenuItem value="bueno">Bueno</MenuItem>
                    <MenuItem value="regular">Regular</MenuItem>
                    <MenuItem value="malo">Malo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ height: '56px' }}
                >
                  Subir Fotografía
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                    required={!isEdit}
                  />
                </Button>
                {formData.foto && (
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {formData.foto.name}
                  </Typography>
                )}
              </Grid>

              {preview && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Vista Previa
                    </Typography>
                    <img
                      src={preview}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                    />
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading || isReplace}
                  fullWidth
                  size="large"
                >
                  {loading ? 'Guardando...' : isEdit ? 'Actualizar Bobina' : 'Registrar Bobina'}
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