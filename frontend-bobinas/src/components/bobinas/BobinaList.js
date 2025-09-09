// src/components/bobinas/BobinaList.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bobinaService } from '../../services/bobinas';
import BobinaItem from './BobinaItem';

const BobinaList = () => {
  const [bobinas, setBobinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    cliente: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    perPage: 15
  });
  const [selectedBobina, setSelectedBobina] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadBobinas();
    loadClientes();
  }, [pagination.page, filters]);

  const loadBobinas = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        ...filters
      };
      
      const response = await bobinaService.getAll(params);
      setBobinas(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        perPage: response.data.per_page
      }));
    } catch (error) {
      console.error('Error loading bobinas:', error);
    } finally {
      setLoading(false);
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

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  const handleViewDetails = (bobina) => {
    setSelectedBobina(bobina);
    setDetailDialog(true);
  };

  const handleCloseDetails = () => {
    setDetailDialog(false);
    setSelectedBobina(null);
  };

  const handleReplacePhoto = (bobina) => {
    navigate(`/bobinas/editar/${bobina.id}`);
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Registros de Bobinas
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Buscar por HU o cliente"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  endAdornment: <SearchIcon />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={filters.cliente}
                  label="Cliente"
                  onChange={(e) => handleFilterChange('cliente', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {clientes.map(cliente => (
                    <MenuItem key={cliente} value={cliente}>{cliente}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Fecha inicio"
                type="date"
                value={filters.fecha_inicio}
                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Fecha fin"
                type="date"
                value={filters.fecha_fin}
                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/bobinas/nueva')}
                fullWidth
                sx={{ height: '100%' }}
              >
                Nueva Bobina
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {bobinas.map(bobina => (
          <Grid item xs={12} sm={6} md={4} key={bobina.id}>
            <BobinaItem 
              bobina={bobina} 
              onViewDetails={handleViewDetails}
              onReplacePhoto={handleReplacePhoto}
            />
          </Grid>
        ))}
      </Grid>

      {bobinas.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(pagination.total / pagination.perPage)}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
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
                <Typography><strong>Estado:</strong> 
                  <Chip 
                    label={selectedBobina.estado} 
                    size="small" 
                    color={selectedBobina.estado === 'bueno' ? 'success' : selectedBobina.estado === 'regular' ? 'warning' : 'error'}
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography><strong>Fecha embarque:</strong> {new Date(selectedBobina.fecha_embarque).toLocaleString()}</Typography>
                {selectedBobina.fecha_reemplazo && (
                  <Typography><strong>Fecha reemplazo:</strong> {new Date(selectedBobina.fecha_reemplazo).toLocaleString()}</Typography>
                )}
                <Typography><strong>Registrado por:</strong> {selectedBobina.usuario?.username}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Fotografía</Typography>
                <img 
                  src={`http://localhost:8000/storage/${selectedBobina.foto_path.replace('public/', '')}`} 
                  alt={selectedBobina.hu}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BobinaList;