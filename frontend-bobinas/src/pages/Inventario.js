// src/pages/Inventario.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Alert, Snackbar, Grid,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Tooltip, Card, CardContent, InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  AddBox,
  Inventory as InventoryIcon,
  QrCode2,
  Description
} from '@mui/icons-material';
import { useScannerInventario } from '../components/hooks/useScannerInventario';
import ScannerModalInventario from '../components/modals/ScannerModalInventario';
import ScannerSectionInventario from '../components/modals/ScannerSectionInventario';
import { inventoryService } from '../services/inventory';

const Inventario = () => {
  const [inventoryData, setInventoryData] = useState({ hu: '', descripcion: '' });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getAll();
      if (response.data.success) setInventoryItems(response.data.data);
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Error al cargar inventario', severity: 'error' });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadInventory(); }, []);

  const handleScanSuccess = async (scannedHU) => {
    try {
      setLoading(true);
      const response = await inventoryService.processScan({ hu: scannedHU });
      const result = response.data;
      if (result.success) {
        if (result.action === 'exists') {
          setSnackbar({ open: true, message: `HU ya existe: ${result.data.descripcion}`, severity: 'warning' });
          setInventoryData({ hu: result.data.hu, descripcion: result.data.descripcion });
        } else {
          setInventoryData(prev => ({ ...prev, hu: scannedHU }));
          setSnackbar({ open: true, message: 'Nuevo HU escaneado.', severity: 'success' });
        }
      }
    } catch (error) {
      setInventoryData(prev => ({ ...prev, hu: scannedHU }));
      setSnackbar({ open: true, message: 'HU escaneado.', severity: 'info' });
    } finally { setLoading(false); }
  };

  const {
    scanning, qrError, scannerModalOpen, videoRef, startScanner, stopScanner, openScannerModal, closeScannerModal
  } = useScannerInventario(handleScanSuccess);

  const handleInputChange = (e) => setInventoryData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await inventoryService.create(inventoryData);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Guardado correctamente', severity: 'success' });
        setInventoryData({ hu: '', descripcion: '' });
        loadInventory();
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar item?')) return;
    try {
      const response = await inventoryService.delete(id);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Eliminado', severity: 'success' });
        loadInventory();
      }
    } catch (error) { setSnackbar({ open: true, message: 'Error al eliminar', severity: 'error' }); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await inventoryService.update(editingItem.id, editingItem);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Actualizado', severity: 'success' });
        setEditDialogOpen(false);
        loadInventory();
      }
    } catch (error) { setSnackbar({ open: true, message: 'Error al actualizar', severity: 'error' }); }
  };

  const filteredItems = inventoryItems.filter(item =>
    item.hu.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', pb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#1565c0', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <InventoryIcon /> Gestión de Inventario
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'sticky', top: 20 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AddBox color="primary" /> Nuevo Registro
              </Typography>

              <form onSubmit={handleSubmit}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: '12px', border: '1px solid #eef0f2', mb: 2 }}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        1. ESCANEO
                    </Typography>
                    {/* El ScannerSection se mantiene igual */}
                    <ScannerSectionInventario
                        formData={inventoryData}
                        onInputChange={handleInputChange}
                        qrError={qrError}
                        onOpenScannerModal={openScannerModal}
                    />
                </Paper>

                <TextField
                  label="Descripción"
                  name="descripcion"
                  value={inventoryData.descripcion}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  multiline
                  rows={3}
                  size="small" // ✅ Input delgado
                  sx={{ mb: 3, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  placeholder="Detalles del item..."
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{ borderRadius: '10px', height: '40px', fontWeight: 'bold' }} // ✅ Botón delgado
                >
                  {loading ? 'Guardando...' : 'Guardar Item'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 3 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: '12px', border: '1px solid #eef0f2', mb: 3 }}>
                <TextField
                    fullWidth
                    size="small" // ✅ Input delgado
                    placeholder="Buscar por número de serie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                        sx: { bgcolor: 'white', borderRadius: '8px' }
                    }}
                />
              </Paper>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>HU / SERIAL</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>DESCRIPCIÓN</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ACCIONES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Chip 
                            icon={<QrCode2 style={{fontSize: 16}} />} 
                            label={item.hu} 
                            color="primary" 
                            variant="outlined" 
                            size="small" 
                            sx={{ fontWeight: 'bold', bgcolor: '#e3f2fd', border: 'none' }}
                          />
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.descripcion}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Editar">
                            <IconButton onClick={() => { setEditingItem(item); setEditDialogOpen(true); }} color="primary" size="small">
                                <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton onClick={() => handleDelete(item.id)} color="error" size="small">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25]}
                component="div"
                count={filteredItems.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, n) => setPage(n)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ScannerModalInventario open={scannerModalOpen} onClose={closeScannerModal} scanning={scanning} qrError={qrError} videoRef={videoRef} onStartScanner={startScanner} onStopScanner={stopScanner} />

      {/* ✅ MODAL DE EDICIÓN MEJORADO */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white' }}>Editar Item</DialogTitle>
        <form onSubmit={handleUpdate}>
          <DialogContent sx={{ p: 3 }}>
            {editingItem && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                <TextField 
                    label="Número de Serie" 
                    value={editingItem.hu} 
                    onChange={(e) => setEditingItem({...editingItem, hu: e.target.value})} 
                    fullWidth 
                    size="small"
                    InputProps={{ sx: { borderRadius: '8px' } }}
                />
                <TextField 
                    label="Descripción" 
                    value={editingItem.descripcion} 
                    onChange={(e) => setEditingItem({...editingItem, descripcion: e.target.value})} 
                    fullWidth 
                    multiline 
                    rows={3} 
                    size="small"
                    InputProps={{ sx: { borderRadius: '8px' } }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ borderRadius: '8px' }}>Cancelar</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: '8px' }}>Guardar</Button>
          </DialogActions>
        </form>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '8px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventario;