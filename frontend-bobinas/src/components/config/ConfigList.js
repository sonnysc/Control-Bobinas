// src/components/config/ConfigList.js
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Chip, Divider, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Settings as SettingsIcon, CalendarToday } from '@mui/icons-material';
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

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await configService.getAll();
      setConfigs(response.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadConfigs(); }, []);

  const handleCreate = () => { setEditingConfig(null); setOpenForm(true); };
  const handleEdit = (config) => { setEditingConfig(config); setOpenForm(true); };
  const handleDelete = (config) => { setConfigToDelete(config); setDeleteDialog(true); };

  const confirmDelete = async () => {
    try {
      await configService.delete(configToDelete.id);
      setSuccess('Eliminado correctamente');
      setDeleteDialog(false);
      loadConfigs();
    } catch (error) { setError('Error al eliminar'); }
  };

  const handleFormSuccess = () => {
    setOpenForm(false);
    setSuccess('Guardado correctamente');
    loadConfigs();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1000px', mx: 'auto', pb: 4 }}>
      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1565c0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon /> Configuración de Retención
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: '600px' }}>
                    Defina cuántos días se conservarán los registros por cliente. Valor por defecto: <strong>{DEFAULT_RETENTION_DAYS} días</strong>.
                </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none' }}>
              Nueva Regla
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{success}</Alert>}

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: '12px' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#555' }}>CLIENTE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#555' }}>DÍAS RETENCIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#555' }}>ÚLTIMA MODIFICACIÓN</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#555' }}>ACCIONES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={40} thickness={4} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Cargando...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay configuraciones personalizadas.
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((config) => (
                    <TableRow key={config.id} hover>
                      <TableCell>
                        <Typography fontWeight={600} color="primary.main">{config.cliente}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${config.dias_retencion} días`} size="small" sx={{ fontWeight: 'bold', bgcolor: '#e3f2fd', color: '#1565c0' }} />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday fontSize="small" />
                            {new Date(config.updated_at).toLocaleDateString()}
                          </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEdit(config)} color="primary"><EditIcon /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(config)} color="error"><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog 
        open={openForm} 
        onClose={() => setOpenForm(false)} 
        maxWidth="sm" 
        fullWidth 
        disableRestoreFocus // ✅ Corrección aplicada aquí
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ bgcolor: '#1565c0', color: 'white' }}>{editingConfig ? 'Editar Regla' : 'Nueva Regla'}</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <ConfigForm config={editingConfig} onSuccess={handleFormSuccess} onCancel={() => setOpenForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog 
        open={deleteDialog} 
        onClose={() => setDeleteDialog(false)} 
        disableRestoreFocus // ✅ Corrección aplicada aquí
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
            <Typography>¿Eliminar la configuración para <strong>{configToDelete?.cliente}</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteDialog(false)} sx={{ borderRadius: '8px' }}>Cancelar</Button>
            <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: '8px' }}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfigList;