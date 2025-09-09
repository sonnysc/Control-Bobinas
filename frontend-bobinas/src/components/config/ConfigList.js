// src/components/config/ConfigList.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { configService } from '../../services/config';
import ConfigForm from './ConfigForm';
import { DEFAULT_RETENTION_DAYS } from '../../utils/constants';

const ConfigList = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await configService.getAll();
      setConfigs(response.data);
    } catch (error) {
      setError('Error al cargar las configuraciones');
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingConfig(null);
    setOpenForm(true);
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setOpenForm(true);
  };

  const handleDelete = (config) => {
    setConfigToDelete(config);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await configService.delete(configToDelete.id);
      setSuccess('Configuración eliminada correctamente');
      setDeleteDialog(false);
      setConfigToDelete(null);
      loadConfigs();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error al eliminar la configuración');
      console.error('Error deleting config:', error);
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setEditingConfig(null);
  };

  const handleFormSuccess = () => {
    setOpenForm(false);
    setEditingConfig(null);
    setSuccess(editingConfig ? 'Configuración actualizada correctamente' : 'Configuración creada correctamente');
    loadConfigs();
    
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Configuración de Días de Retención
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Nueva Configuración
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            Configure los días de retención para cada cliente. Los registros más antiguos se eliminarán automáticamente.
            El valor por defecto para clientes sin configuración específica es {DEFAULT_RETENTION_DAYS} días.
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Días de Retención</TableCell>
                  <TableCell>Fecha Actualización</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No hay configuraciones registradas. Los clientes usarán el valor por defecto de {DEFAULT_RETENTION_DAYS} días.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <Chip 
                          label={config.cliente} 
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" component="span" color="primary">
                          {config.dias_retencion}
                        </Typography>
                        <Typography variant="body2" component="span" color="text.secondary">
                          {' '}días
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(config.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(config)}
                          color="primary"
                          title="Editar configuración"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(config)}
                          color="error"
                          title="Eliminar configuración"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openForm} onClose={handleFormClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingConfig ? 'Editar Configuración' : 'Crear Configuración'}
        </DialogTitle>
        <DialogContent>
          <ConfigForm
            config={editingConfig}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la configuración para el cliente "{configToDelete?.cliente}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Los registros de este cliente usarán el valor por defecto de {DEFAULT_RETENTION_DAYS} días después de la eliminación.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfigList;