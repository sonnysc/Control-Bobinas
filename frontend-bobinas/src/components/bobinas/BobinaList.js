// src/components/bobinas/BobinaList.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  FormControl, InputLabel, Select, MenuItem, Pagination, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip, Paper, InputAdornment,
  Divider, IconButton, Tooltip, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  FilterAlt, 
  Inventory,
  DateRange,
  PersonSearch,
  Close,
  Business,
  AccessTime,
  Person,
  Image as ImageIcon,
  Warning,
  OpenInNew
} from '@mui/icons-material';
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

  const loadClientes = useCallback(async () => {
    try {
      const response = await bobinaService.getClientes();
      setClientes(response.data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  }, []);

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
    const diasRedondeados = Math.round(dias || 0);
    if (diasRedondeados <= 7) return 'error';
    if (diasRedondeados <= 30) return 'warning';
    return 'success';
  };

  const limpiarFiltros = () => {
    setFilters({ search: '', cliente: '', fecha_inicio: '', fecha_fin: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
        <Icon color="primary" sx={{ mr: 1.5 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#444', textTransform: 'uppercase', fontSize: '0.9rem' }}>
            {title}
        </Typography>
    </Box>
  );

  if (user?.role === ROLES.EMBARCADOR) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8, px: 2 }}>
        <Card sx={{ maxWidth: 600, mx: 'auto', borderRadius: '16px', boxShadow: 3, p: 4 }}>
            <Inventory sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold" color="#333">
            Panel de Embarques
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Utilice el botón a continuación o el menú lateral para registrar la entrada de nuevas bobinas al sistema.
            </Typography>
            <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/bobinas/nueva')}
            size="large"
            fullWidth
            sx={{
                py: 1.5,
                borderRadius: '8px',
                fontSize: '1.1rem',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
            >
            Registrar Nueva Bobina
            </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', pb: 4 }}>
      <Card sx={{ mb: 4, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1565c0' }}>
                {user?.role === ROLES.INGENIERO ? 'Panel de Ingeniería' : 'Panel de Administración'}
            </Typography>
            
            {/* ✅ BOTÓN LIMPIAR FILTROS (Sin ícono) */}
            {hayFiltros && (
                <Button 
                    variant="text" 
                    color="secondary" 
                    onClick={limpiarFiltros}
                    size="small"
                >
                    Limpiar Filtros
                </Button>
            )}
          </Box>
          
          <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: '12px', border: '1px solid #eef0f2' }}>
            <SectionHeader icon={FilterAlt} title="Filtros de Búsqueda" />
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Buscar por HU"
                        value={filters.search}
                        onChange={e => handleFilterChange('search', e.target.value)}
                        size="small"
                        placeholder="Ej: 123456789"
                        InputProps={{ 
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                </Grid>

                {[ROLES.ADMIN, ROLES.INGENIERO].includes(user?.role) && (
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                    <InputLabel id="cliente-label" sx={{ bgcolor: 'white', px: 0.5 }}>Cliente</InputLabel>
                    <Select
                        labelId="cliente-label"
                        value={filters.cliente}
                        label="Cliente"
                        onChange={e => handleFilterChange('cliente', e.target.value)}
                        displayEmpty
                        startAdornment={
                            <InputAdornment position="start">
                                <PersonSearch color="action" fontSize="small" sx={{ ml: 1 }} />
                            </InputAdornment>
                        }
                        sx={{ bgcolor: 'white', borderRadius: '8px' }}
                    >
                        <MenuItem value=""><em>Todos los clientes</em></MenuItem>
                        {clientes.map(cliente => (
                        <MenuItem key={cliente} value={cliente}>{cliente}</MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>
                )}

                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        label="Fecha Inicio"
                        type="date"
                        value={filters.fecha_inicio}
                        onChange={e => handleFilterChange('fecha_inicio', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        label="Fecha Fin"
                        type="date"
                        value={filters.fecha_fin}
                        onChange={e => handleFilterChange('fecha_fin', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                </Grid>
            </Grid>
          </Paper>
        </CardContent>
      </Card>

      {/* Grid de Resultados */}
      <Grid container spacing={2}>
        {bobinas.map(bobina => (
          <Grid item xs={12} sm={6} lg={4} key={bobina.id}>
            <BobinaItem 
                bobina={bobina} 
                onViewDetails={handleViewDetails} 
                onEditBobina={handleEditBobina} 
                userRole={user?.role} 
            />
          </Grid>
        ))}
        {bobinas.length === 0 && (
            <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 8, opacity: 0.7 }}>
                    <Inventory sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>
                        No se encontraron registros
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Intente ajustar los filtros de búsqueda
                    </Typography>
                </Box>
            </Grid>
        )}
      </Grid>

      {bobinas.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={Math.ceil(pagination.total / pagination.perPage)} 
            page={pagination.page} 
            onChange={handlePageChange} 
            color="primary" 
            size="large"
            shape="rounded"
            showFirstButton 
            showLastButton
          />
        </Box>
      )}

      {/* Modal de Detalles */}
      <Dialog 
        open={detailDialog} 
        onClose={handleCloseDetails} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ 
            bgcolor: '#1976d2', 
            color: 'white',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2
        }}>
            <Typography variant="h6" fontWeight="bold">Detalles de Bobina</Typography>
            <IconButton onClick={handleCloseDetails} sx={{ color: 'white' }}>
                <Close />
            </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {selectedBobina && (
            <Grid container sx={{ height: '100%' }}>
              
              <Grid item xs={12} md={6} sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="overline" color="text.secondary" fontWeight="bold">
                        HU / SERIAL
                    </Typography>
                    <Typography variant="h4" color="primary.main" fontWeight="800" sx={{ lineHeight: 1 }}>
                        {selectedBobina.hu}
                    </Typography>
                    <Chip 
                        label={`${Math.round(selectedBobina.dias_restantes || 0)} días restantes`} 
                        color={getDiasRestantesColor(selectedBobina.dias_restantes)} 
                        size="small" 
                        sx={{ mt: 1, fontWeight: 'bold' }}
                    />
                </Box>

                <Divider sx={{ mb: 2 }} />

                <List dense disablePadding>
                    <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <Business color="action" />
                        </ListItemIcon>
                        <ListItemText 
                            primary="Cliente" 
                            secondary={selectedBobina.cliente || 'Sin Asignar'} 
                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                            secondaryTypographyProps={{ variant: 'body1', fontWeight: 500, color: 'text.primary' }}
                        />
                    </ListItem>

                    <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <DateRange color="action" />
                        </ListItemIcon>
                        <ListItemText 
                            primary="Fecha de Registro" 
                            secondary={selectedBobina.fecha_embarque ? new Date(selectedBobina.fecha_embarque).toLocaleDateString() : 'N/A'} 
                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                            secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                        />
                    </ListItem>

                    <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <AccessTime color="action" />
                        </ListItemIcon>
                        <ListItemText 
                            primary="Hora" 
                            secondary={selectedBobina.fecha_embarque ? new Date(selectedBobina.fecha_embarque).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} 
                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                            secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                        />
                    </ListItem>

                    <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <Person color="action" />
                        </ListItemIcon>
                        <ListItemText 
                            primary="Registrado por" 
                            secondary={selectedBobina.usuario?.username || 'N/A'} 
                            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                            secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                        />
                    </ListItem>
                </List>

                {selectedBobina.fecha_reemplazo && (
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            mt: 3, 
                            p: 2, 
                            bgcolor: '#fff3e0', 
                            border: '1px solid #ffe0b2', 
                            borderRadius: '8px' 
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: '#ed6c02' }}>
                            <Warning fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="subtitle2" fontWeight="bold">BOBINA REEMPLAZADA</Typography>
                        </Box>
                        <Typography variant="caption" display="block">
                            <strong>Fecha:</strong> {new Date(selectedBobina.fecha_reemplazo).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" display="block">
                            <strong>Autorizó:</strong> {selectedBobina.aprobador?.username}
                        </Typography>
                    </Paper>
                )}
              </Grid>

              <Grid item xs={12} md={6} sx={{ p: 3, bgcolor: '#fafafa', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold', letterSpacing: 1, mb: 2 }}>
                    EVIDENCIA FOTOGRÁFICA
                </Typography>
                
                <Paper 
                  elevation={0}
                  sx={{ 
                      flexGrow: 1,
                      minHeight: 350,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid #e0e0e0',
                      bgcolor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                  }}
                >
                {selectedBobina.foto_url ? (
                  <>
                    {/* ✅ IMAGEN RESTAURADA: Usamos la URL directa de la BD */}
                    <img
                      src={selectedBobina.foto_url}
                      alt={selectedBobina.hu}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '400px', 
                        objectFit: 'contain',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'transform 0.3s ease'
                      }}
                      onClick={() => window.open(selectedBobina.foto_url, '_blank')}
                      title="Clic para ver en tamaño completo"
                    />
                    
                    <Box sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        pointerEvents: 'none'
                    }}>
                        <Chip 
                            icon={<OpenInNew sx={{ fontSize: '1rem !important' }} />} 
                            label="Clic para ampliar" 
                            size="small"
                            sx={{ 
                                bgcolor: 'rgba(0,0,0,0.7)', 
                                color: 'white',
                                backdropFilter: 'blur(4px)',
                                '& .MuiChip-icon': { color: 'white' }
                            }} 
                        />
                    </Box>
                  </>
                ) : (
                    <Box sx={{ textAlign: 'center', color: 'text.disabled', opacity: 0.6 }}>
                        <ImageIcon sx={{ fontSize: 80, mb: 1 }} />
                        <Typography variant="body1" fontWeight={500}>No hay evidencia disponible</Typography>
                    </Box>
                )}
                </Paper>
              </Grid>

            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
            <Button onClick={handleCloseDetails} variant="contained" sx={{ borderRadius: '8px', px: 4 }}>
                Cerrar
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BobinaList;