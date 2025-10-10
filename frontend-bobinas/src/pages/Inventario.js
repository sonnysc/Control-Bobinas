// src/pages/Inventario.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useScannerInventario } from '../components/hooks/useScannerInventario';
import ScannerModalInventario from '../components/modals/ScannerModalInventario';
import ScannerSectionInventario from '../components/modals/ScannerSectionInventario';
import { inventoryService } from '../services/inventory';

const Inventario = () => {
  const [inventoryData, setInventoryData] = useState({
    hu: '',
    descripcion: ''
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ✅ Cargar inventario
  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getAll();
      
      if (response.data.success) {
        setInventoryItems(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando inventario:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar el inventario',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // ✅ Manejo de escaneo exitoso
  const handleScanSuccess = async (scannedHU) => {
    try {
      setLoading(true);
      
      const response = await inventoryService.processScan({ hu: scannedHU });
      const result = response.data;

      if (result.success) {
        if (result.action === 'exists') {
          setSnackbar({
            open: true,
            message: `HU ya existe: ${result.data.descripcion}`,
            severity: 'warning'
          });
          setInventoryData({
            hu: result.data.hu,
            descripcion: result.data.descripcion
          });
        } else {
          setInventoryData(prev => ({
            ...prev,
            hu: scannedHU
          }));
          setSnackbar({
            open: true,
            message: 'Nuevo HU escaneado. Complete la descripción.',
            severity: 'success'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error verificando HU:', error);
      setInventoryData(prev => ({
        ...prev,
        hu: scannedHU
      }));
      setSnackbar({
        open: true,
        message: 'HU escaneado. Complete la información.',
        severity: 'info'
      });
    } finally {
      setLoading(false);
    }
  };

  const {
    scanning,
    qrError,
    scannerModalOpen,
    videoRef,
    startScanner,
    stopScanner,
    openScannerModal,
    closeScannerModal,
    setQrError
  } = useScannerInventario(handleScanSuccess);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInventoryData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ Función para guardar en Laravel
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await inventoryService.create(inventoryData);
      const result = response.data;

      if (result.success) {
        setSnackbar({
          open: true,
          message: result.message || 'Item guardado en inventario correctamente',
          severity: 'success'
        });
        
        // Limpiar formulario y recargar lista
        setInventoryData({
          hu: '',
          descripcion: ''
        });
        loadInventory();
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Error al guardar el item',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error guardando item:', error);
      setSnackbar({
        open: true,
        message: 'Error de conexión al servidor',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función para eliminar item
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este item del inventario?')) {
      return;
    }

    try {
      const response = await inventoryService.delete(id);
      const result = response.data;

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Item eliminado correctamente',
          severity: 'success'
        });
        loadInventory();
      } else {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error eliminando item:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar el item',
        severity: 'error'
      });
    }
  };

  // ✅ Función para editar item
  const handleEdit = (item) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await inventoryService.update(editingItem.id, editingItem);
      const result = response.data;

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Item actualizado correctamente',
          severity: 'success'
        });
        setEditDialogOpen(false);
        setEditingItem(null);
        loadInventory();
      } else {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error actualizando item:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar el item',
        severity: 'error'
      });
    }
  };

  // ✅ Filtrar items
  const filteredItems = inventoryItems.filter(item =>
    item.hu.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedItems = filteredItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Gestión de Inventario
      </Typography>

      <Grid container spacing={3}>
        {/* Formulario para nuevo item */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Agregar Nuevo Item
            </Typography>

            <form onSubmit={handleSubmit}>
              <ScannerSectionInventario
                formData={inventoryData}
                onInputChange={handleInputChange}
                qrError={qrError}
                onOpenScannerModal={openScannerModal}
              />

              <TextField
                label="Descripción"
                name="descripcion"
                value={inventoryData.descripcion}
                onChange={handleInputChange}
                fullWidth
                required
                multiline
                rows={3}
                sx={{ mb: 3 }}
                helperText="Descripción detallada del item"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar en Inventario'}
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* Lista de inventario */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <SearchIcon />
              <TextField
                placeholder="Buscar por número de serie o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                size="small"
              />
            </Box>

            <Typography variant="h6" gutterBottom>
              Items en Inventario ({filteredItems.length})
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Número de Serie</strong></TableCell>
                    <TableCell><strong>Descripción</strong></TableCell>
                    <TableCell><strong>Fecha de Registro</strong></TableCell>
                    <TableCell><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Chip 
                          label={item.hu} 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.descripcion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(item.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Editar">
                          <IconButton 
                            onClick={() => handleEdit(item)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton 
                            onClick={() => handleDelete(item.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredItems.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Modal del scanner */}
      <ScannerModalInventario
        open={scannerModalOpen}
        onClose={closeScannerModal}
        scanning={scanning}
        qrError={qrError}
        videoRef={videoRef}
        onStartScanner={startScanner}
        onStopScanner={stopScanner}
      />

      {/* Dialog de Edición */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Item de Inventario</DialogTitle>
        <form onSubmit={handleUpdate}>
          <DialogContent>
            {editingItem && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Número de Serie"
                  value={editingItem.hu}
                  onChange={(e) => setEditingItem({...editingItem, hu: e.target.value})}
                  fullWidth
                  required
                />
                <TextField
                  label="Descripción"
                  value={editingItem.descripcion}
                  onChange={(e) => setEditingItem({...editingItem, descripcion: e.target.value})}
                  fullWidth
                  required
                  multiline
                  rows={3}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Guardar Cambios</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventario;