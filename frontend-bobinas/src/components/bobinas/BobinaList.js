// src/components/bobinas/BobinaList.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  FormControl, InputLabel, Select, MenuItem, Pagination, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip, Paper, InputAdornment,
  Divider, IconButton, List, ListItem, ListItemIcon, ListItemText,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  FilterAlt,
  Inventory,
  DateRange,
  PersonSearch,
  ClearAll, 
  Close,
  Business,
  AccessTime,
  Person,
  Image as ImageIcon,
  Warning,
  OpenInNew,
  Sort as SortIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bobinaService } from '../../services/bobinas';
import BobinaItem from './BobinaItem';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const BobinaList = () => {
  const [bobinas, setBobinas] = useState([]);
  const [filters, setFilters] = useState({ search: '', cliente: '', fecha_inicio: '', fecha_fin: '', orden_dias: '' });
  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, perPage: 15 });
  const [selectedBobina, setSelectedBobina] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
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
      setBobinas([]);
    }
  }, [pagination.page, filters]);

  const loadClientes = useCallback(async () => {
    if (![ROLES.ADMIN, ROLES.INGENIERO].includes(user?.role)) {
      return;
    }

    setLoadingClientes(true);
    try {
      try {
        const response = await bobinaService.getClientesFiltros({
          limit: 5000
        });
        
        let data = response.data || [];
        
        if (Array.isArray(data)) {
          const clientesProcesados = [...new Set(data
            .map(cliente => String(cliente || '').trim())
            .filter(cliente => cliente && cliente !== '')
          )].sort((a, b) => a.localeCompare(b));
          
          setClientes(clientesProcesados);
          return;
        }
      } catch (endpointError) {
        // Silenciar error
      }
      
      const backupResponse = await bobinaService.getClientes({ 
        include_hidden: true,
        limit: 10000
      });
      
      let backupData = [];
      if (Array.isArray(backupResponse.data)) {
        backupData = backupResponse.data;
      } else if (backupResponse.data?.data) {
        backupData = backupResponse.data.data;
      }
      
      const clientesBackup = [...new Set(backupData
        .map(cliente => String(cliente || '').trim())
        .filter(cliente => cliente && cliente !== '')
      )].sort((a, b) => a.localeCompare(b));
      
      setClientes(clientesBackup);
      
    } catch (error) {
      try {
        const bobinasResponse = await bobinaService.getAll({
          page: 1,
          limit: 1000
        });
        
        if (bobinasResponse.data?.data) {
          const clientesFromBobinas = [...new Set(
            bobinasResponse.data.data
              .map(bobina => bobina.cliente)
              .filter(cliente => cliente && cliente.trim() !== '')
          )].sort((a, b) => a.localeCompare(b));
          
          setClientes(clientesFromBobinas);
        } else {
          setClientes(['Error cargando clientes']);
        }
      } catch (finalError) {
        setClientes([]);
      }
    } finally {
      setLoadingClientes(false);
    }
  }, [user?.role]);

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

  const handleSelectBobina = bobina => {
    setSelectedBobina(bobina);
    setDetailDialog(true);
  };

  const handleCloseDetails = () => {
    setSelectedBobina(null);
    setDetailDialog(false);
  };

  const handleImageClick = (imageUrl) => {
    if(imageUrl) window.open(imageUrl, '_blank');
  };

  const handleCardClick = (bobina, event) => {
    const isButtonClick = event.target.closest('button') || 
                          event.target.closest('.MuiIconButton-root') ||
                          event.target.closest('[role="button"]');
    
    if (!isButtonClick) {
      handleSelectBobina(bobina);
    }
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
    setFilters({ search: '', cliente: '', fecha_inicio: '', fecha_fin: '', orden_dias: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getImageUrl = (url) => {
    if (!url) return '';

    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) {
        return url;
    }

    let relativePath = url;
    if (url.includes('storage/')) {
        const parts = url.split('storage/');
        relativePath = `/storage/${parts[parts.length - 1]}`;
    } else if (!url.startsWith('/')) {
        relativePath = `/${url}`;
    }

    const currentPort = window.location.port;
    const isDevelopment = process.env.NODE_ENV === 'development' || currentPort === '3000' || currentPort === '3001';

    if (isDevelopment) {
        return `${window.location.protocol}//${window.location.hostname}:8001${relativePath}`;
    }

    return relativePath;
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

  const showClientFilter = [ROLES.ADMIN, ROLES.INGENIERO].includes(user?.role);

  const menuPropsConfig = {
    PaperProps: {
        sx: {
            maxHeight: 400,
            minWidth: 300,
            maxWidth: 500,
            '& .MuiMenuItem-root': {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              py: 1.5,
              minHeight: 'auto',
              borderBottom: '1px solid #f5f5f5',
              '&:last-child': {
                borderBottom: 'none'
              },
              '&:hover': {
                backgroundColor: '#f0f7ff'
              }
            }
        },
    },
    disableScrollLock: true,
    variant: "menu"
  };

  const caducidadMenuProps = {
    PaperProps: {
        sx: {
            maxHeight: 400,
            minWidth: 280,
            '& .MuiMenuItem-root': {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              py: 1.5,
              minHeight: 'auto',
              '&:hover': {
                backgroundColor: '#f0f7ff'
              }
            }
        },
    },
    disableScrollLock: true,
    variant: "menu"
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', pb: 4 }}>
      <Card sx={{ mb: 4, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1565c0' }}>
                {user?.role === ROLES.INGENIERO ? 'Panel de Ingeniería' : 'Panel de Administración'}
            </Typography>
          </Box>
          
          <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: '12px', border: '1px solid #eef0f2' }}>
            <SectionHeader icon={FilterAlt} title="Filtros de Búsqueda" />
            
            <Grid container spacing={2}>
                <Grid item xs={12} md={showClientFilter ? 4 : 6}>
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

                {showClientFilter && (
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                    <InputLabel id="cliente-label" sx={{ bgcolor: 'white', px: 0.5 }}>
                      {loadingClientes ? 'Cargando...' : 'Cliente'}
                    </InputLabel>
                    <Select
                        labelId="cliente-label"
                        value={filters.cliente}
                        label={loadingClientes ? 'Cargando...' : 'Cliente'}
                        onChange={e => handleFilterChange('cliente', e.target.value)}
                        displayEmpty
                        MenuProps={menuPropsConfig}
                        disabled={loadingClientes}
                        startAdornment={
                            <InputAdornment position="start">
                                <PersonSearch color="action" fontSize="small" sx={{ ml: 1 }} />
                            </InputAdornment>
                        }
                        sx={{ bgcolor: 'white', borderRadius: '8px' }}
                    >
                        <MenuItem value="">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <em>Todos los clientes</em>
                            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                              ({clientes.length})
                            </Typography>
                          </Box>
                        </MenuItem>
                        
                        {loadingClientes ? (
                          <MenuItem disabled>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <CircularProgress size={20} sx={{ mr: 2 }} />
                              <Typography variant="body2">Cargando clientes...</Typography>
                            </Box>
                          </MenuItem>
                        ) : clientes.length === 0 ? (
                          <MenuItem disabled sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            No hay clientes disponibles
                          </MenuItem>
                        ) : clientes[0] === 'Error cargando clientes' ? (
                          <MenuItem disabled sx={{ color: 'error.main', fontStyle: 'italic' }}>
                            Error cargando clientes
                          </MenuItem>
                        ) : (
                          clientes.map((cliente, index) => (
                            <MenuItem 
                              key={`${cliente}-${index}`} 
                              value={cliente}
                              title={cliente}
                            >
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  width: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {cliente}
                              </Typography>
                            </MenuItem>
                          ))
                        )}
                    </Select>
                    </FormControl>
                </Grid>
                )}

                <Grid item xs={12} md={showClientFilter ? 4 : 6}>
                    <FormControl fullWidth size="small">
                        <InputLabel id="orden-label" sx={{ bgcolor: 'white', px: 0.5 }}>Caducidad</InputLabel>
                        <Select
                            labelId="orden-label"
                            value={filters.orden_dias}
                            label="Caducidad" 
                            onChange={e => handleFilterChange('orden_dias', e.target.value)}
                            MenuProps={caducidadMenuProps}
                            startAdornment={
                                <InputAdornment position="start">
                                    <SortIcon color="action" fontSize="small" sx={{ ml: 1 }} />
                                </InputAdornment>
                            }
                            sx={{ 
                              bgcolor: 'white', 
                              borderRadius: '8px',
                              '& .MuiSelect-select': {
                                minWidth: '200px',
                              }
                            }}
                        >
                            <MenuItem value="">
                              <Typography variant="body2">
                                <em>Sin orden específico</em>
                              </Typography>
                            </MenuItem>
                            <MenuItem value="asc">
                              <Typography variant="body2">
                                Menos días restantes
                              </Typography>
                            </MenuItem>
                            <MenuItem value="desc">
                              <Typography variant="body2">
                                Más días restantes
                              </Typography>
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
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

                <Grid item xs={12} sm={4} md={3}>
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

                <Grid item xs={12} sm={4} md={2} sx={{ display: 'flex' }}>
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        fullWidth 
                        onClick={limpiarFiltros} 
                        disabled={!hayFiltros}
                        startIcon={<ClearAll />}
                        sx={{ 
                            height: '40px', 
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 500,
                            bgcolor: 'white',
                            '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                    >
                        Limpiar
                    </Button>
                </Grid>
            </Grid>
          </Paper>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {bobinas.map(bobina => (
          <Grid item xs={12} sm={6} lg={4} key={bobina.id}>
            <Box 
              onClick={(e) => handleCardClick(bobina, e)}
              sx={{ 
                cursor: 'pointer',
                '& .MuiCard-root': {
                  transition: 'all 0.3s ease',
                },
                '&:hover .MuiCard-root': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 16px 32px rgba(0,0,0,0.15)',
                }
              }}
            >
              <BobinaItem 
                bobina={bobina} 
                onViewDetails={handleSelectBobina}
                onEditBobina={handleEditBobina} 
                userRole={user?.role} 
              />
            </Box>
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

      <Dialog 
        open={detailDialog} 
        onClose={handleCloseDetails} 
        maxWidth="md" 
        fullWidth
        disableRestoreFocus 
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
          <Typography variant="h6" component="div" fontWeight="bold">Detalles de Bobina</Typography>
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

              <Grid item xs={12} md={6} sx={{ 
                p: 3, 
                bgcolor: '#fafafa', 
                display: 'flex', 
                flexDirection: 'column',
                borderLeft: { md: '1px solid #e0e0e0' }
              }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ 
                  fontWeight: 'bold', 
                  letterSpacing: 1, 
                  mb: 2,
                  textAlign: 'center'
                }}>
                  EVIDENCIA FOTOGRÁFICA
                </Typography>
                
                <Paper 
                  elevation={0}
                  sx={{ 
                    flexGrow: 1,
                    minHeight: 350,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                    bgcolor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {selectedBobina.foto_url ? (
                    <>
                      <Box sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa',
                      }}>
                        <img
                          src={getImageUrl(selectedBobina.foto_url)}
                          alt={selectedBobina.hu}
                          style={{ 
                            maxWidth: '90%',
                            maxHeight: '90%',
                            objectFit: 'contain',
                            display: 'block',
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease',
                            backgroundColor: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => handleImageClick(getImageUrl(selectedBobina.foto_url))}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          title="Clic para abrir en nueva ventana"
                        />
                      </Box>
                      
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
                    <Box sx={{ 
                      textAlign: 'center', 
                      color: 'text.disabled',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f5f5f5'
                    }}>
                      <ImageIcon sx={{ fontSize: 80, mb: 2, color: '#e0e0e0' }} />
                      <Typography variant="body1" fontWeight={500} color="#9e9e9e">
                        No hay evidencia disponible
                      </Typography>
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