// src/components/bobinas/BobinaList.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  FormControl, InputLabel, Select, MenuItem, Pagination, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bobinaService } from '../../services/bobinas';
import BobinaItem from './BobinaItem';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const BobinaList = () => {
  const [bobinas, setBobinas] = useState([]);
  const [filters, setFilters] = useState({ search: '', cliente: '', fecha_inicio: '', fecha_fin: '' });
  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, perPage: 15 });
  const [selectedBobina, setSelectedBobina] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const hayFiltros = Object.values(filters).some(value => value !== '');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirigir embarcadores al formulario
  useEffect(() => {
    if (user?.role === ROLES.EMBARCADOR) {
      navigate('/bobinas/nueva', { replace: true });
    }
  }, [user, navigate]);

  // Función para cargar bobinas con useCallback
  const loadBobinas = useCallback(async () => {
    try {
      const params = { page: pagination.page, ...filters };
      const response = await bobinaService.getAll(params);
      setBobinas(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        perPage: response.data.per_page || 15
      }));
    } catch (error) {
      console.error('Error loading bobinas:', error);
      setBobinas([]);
    }
  }, [pagination.page, filters]);

  // Función para cargar clientes con useCallback
  const loadClientes = useCallback(async () => {
    try {
      const response = await bobinaService.getClientes();
      setClientes(response.data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  }, []);

  // Cargar bobinas y clientes
  useEffect(() => {
    loadBobinas();
    if ([ROLES.ADMIN, ROLES.INGENIERO].includes(user?.role)) {
      loadClientes();
    }
  }, [loadBobinas, loadClientes, user?.role]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (e, value) => setPagination(prev => ({ ...prev, page: value }));

  const handleViewDetails = bobina => {
    setSelectedBobina(bobina);
    setDetailDialog(true);
  };

  const handleCloseDetails = () => {
    setSelectedBobina(null);
    setDetailDialog(false);
  };

  const handleEditBobina = bobina => {
    if (user?.role === ROLES.ADMIN) navigate(`/bobinas/editar/${bobina.id}`);
  };

  const getDiasRestantesColor = (dias) => {
    if (dias <= 7) return 'error'; // Rojo - Menos de 7 días
    if (dias <= 30) return 'warning'; // Amarillo - Menos de 30 días
    return 'success'; // Verde - Más de 30 días
  };

  const limpiarFiltros = () => {
    setFilters({
      search: '',   // 👈 en tu estado inicial se llama "search", no "hu"
      cliente: '',
      fecha_inicio: '',
      fecha_fin: '',
    });
    setPagination(prev => ({ ...prev, page: 1 })); // reset a la primera página
    loadBobinas(); // ✅ recarga lista completa
  };

  // Si es embarcador, no renderizar nada (será redirigido)
  if (user?.role === ROLES.EMBARCADOR) {
    return null;
  }



  return (
    <Box>
      <Card sx={{ mb: 3, maxWidth: '1200px', mx: 'auto' }}>
        <CardContent>
          {/* Cambiar título según el rol */}
          <Typography variant="h5" gutterBottom>
            {user?.role === ROLES.INGENIERO ? 'Bobinas' : 'Registros de Bobinas'}
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
            {/* Buscar por HU*/}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Buscar por HU"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                InputProps={{ endAdornment: <SearchIcon /> }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: '56px'
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 14px',
                    fontSize: '14px'
                  }
                }}
              />
            </Grid>

            {/* Select de Cliente - Mismo ancho */}
            {[ROLES.ADMIN, ROLES.INGENIERO].includes(user?.role) && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth sx={{
                  '& .MuiInputBase-root': { height: '56px' }
                }}>
                  <InputLabel
                    id="cliente-label"
                    shrink={true}
                    sx={{ backgroundColor: 'white', paddingX: '4px' }}
                  >
                    Cliente
                  </InputLabel>
                  <Select
                    labelId="cliente-filter-label"
                    id="cliente-filter"
                    value={filters.cliente}
                    label="Cliente"
                    onChange={e => handleFilterChange('cliente', e.target.value)}
                    displayEmpty
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 250,
                          minWidth: 250,
                          maxWidth: 400 // ajustable según el contenido
                        }
                      }
                    }}

                    sx={{
                      '& .MuiSelect-select': {
                        padding: '12px 14px',
                        fontSize: '14px',
                        whiteSpace: 'normal',
                        overflow: 'visible',
                        textOverflow: 'unset',
                        minWidth: '180px'
                      }
                    }}

                    renderValue={(selected) => {
                      if (!selected) {
                        return <span style={{ opacity: 0.7 }}>Todos</span>;
                      }
                      return selected;
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {clientes.map(cliente => (
                      <MenuItem
                        key={cliente}
                        value={cliente}
                        sx={{
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          fontSize: '14px',
                          lineHeight: '1.4',
                          paddingY: '8px'
                        }}
                        title={cliente} // tooltip nativo para mostrar el nombre completo al hacer hover
                      >
                        {cliente}
                      </MenuItem>
                    ))}

                  </Select>
                </FormControl>

              </Grid>
            )}

            {/* Fecha inicio - Mismo ancho */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Fecha inicio"
                type="date"
                value={filters.fecha_inicio}
                onChange={e => handleFilterChange('fecha_inicio', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  max: new Date().toISOString().split("T")[0] // ✅ Limita hasta hoy
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: '56px'
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 14px',
                    fontSize: '14px'
                  }
                }}
              />
            </Grid>

            {/* Fecha fin - Mismo ancho */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Fecha fin"
                type="date"
                value={filters.fecha_fin}
                onChange={e => handleFilterChange('fecha_fin', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  max: new Date().toISOString().split("T")[0] // ✅ Limita hasta hoy
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: '56px'
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 14px',
                    fontSize: '14px'
                  }
                }}
              />
            </Grid>

            {hayFiltros && (
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={limpiarFiltros}
                  sx={{ height: '56px' }}
                >
                  Limpiar
                </Button>
              </Grid>
            )}


            {/* Botón Nueva Bobina - Mismo ancho */}
            {user?.role === ROLES.EMBARCADOR && (
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  fullWidth
                  sx={{
                    height: '56px',
                    py: '12px'
                  }}
                  onClick={() => navigate('/bobinas/nueva')}
                >
                  Nueva Bobina
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} justifyContent="center">
        {bobinas.map(bobina => (
          <Grid item xs={12} sm={6} md={4} key={bobina.id}>
            <BobinaItem bobina={bobina} onViewDetails={handleViewDetails} onEditBobina={handleEditBobina} userRole={user?.role} />
          </Grid>
        ))}
      </Grid>

      {bobinas.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={Math.ceil(pagination.total / pagination.perPage)} page={pagination.page} onChange={handlePageChange} color="primary" />
        </Box>
      )}

      <Dialog open={detailDialog} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Detalles de Bobina</DialogTitle>
        <DialogContent>
          {selectedBobina && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Información</Typography>
                <Typography><strong>HU:</strong> {selectedBobina.hu}</Typography>
                <Typography><strong>Cliente:</strong> {selectedBobina.cliente || 'N/A'}</Typography>
                <Typography><strong>Fecha embarque:</strong> {selectedBobina.fecha_embarque ? new Date(selectedBobina.fecha_embarque).toLocaleString() : 'N/A'}</Typography>
                <Typography><strong>Registrado por:</strong> {selectedBobina.usuario?.username || 'N/A'}</Typography>

                {/* Días restantes con color */}
                <Typography component="div" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <strong>Días restantes:</strong>
                  <Chip
                    label={`${Math.round(selectedBobina.dias_restantes || 0)} días`}
                    size="small"
                    color={getDiasRestantesColor(selectedBobina.dias_restantes)}
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Typography>

                {/* Información de reemplazo */}
                {selectedBobina.fecha_reemplazo && (
                  <>
                    <Typography><strong>Fecha de reemplazo:</strong> {selectedBobina.fecha_reemplazo ? new Date(selectedBobina.fecha_reemplazo).toLocaleString() : 'N/A'}</Typography>
                    <Typography><strong>Reemplazado por:</strong> {selectedBobina.reemplazador?.username || 'N/A'}</Typography>
                    <Typography><strong>Aprobado por:</strong> {selectedBobina.aprobador?.username || 'N/A'}</Typography>
                  </>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6">Fotografía</Typography>
                {selectedBobina.foto_path ? (
                  <Box sx={{
                    width: '100%',
                    maxHeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}/storage/${selectedBobina.foto_path}`}
                      alt={selectedBobina.hu}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain' // Cambiado para mantener relación de aspecto
                      }}
                    />
                  </Box>
                ) : (
                  <Typography>No hay foto disponible</Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions><Button onClick={handleCloseDetails}>Cerrar</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default BobinaList;