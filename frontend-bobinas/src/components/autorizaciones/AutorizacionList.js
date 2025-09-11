// src/components/autorizaciones/AutorizacionList.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

const AutorizacionList = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Datos de ejemplo (debes conectar con tu backend)
  const solicitudesEjemplo = [
    {
      id: 1,
      hu: 'HU123456',
      solicitante: 'embarcador1',
      fecha: '2024-01-15',
      estado: 'pendiente',
      motivo: 'Reemplazo de bobina dañada'
    },
    {
      id: 2,
      hu: 'HU789012',
      solicitante: 'embarcador2',
      fecha: '2024-01-16',
      estado: 'aprobado',
      motivo: 'Actualización de información'
    }
  ];

  useEffect(() => {
    // Aquí cargarías las solicitudes reales desde tu API
    setSolicitudes(solicitudesEjemplo);
  }, []);

  const handleAprobar = async (id) => {
    try {
      // Lógica para aprobar
      setSuccess('Solicitud aprobada correctamente');
      setSolicitudes(prev => prev.map(s => 
        s.id === id ? {...s, estado: 'aprobado'} : s
      ));
    } catch (error) {
      setError('Error al aprobar la solicitud');
    }
  };

  const handleRechazar = async (id) => {
    try {
      // Lógica para rechazar
      setSuccess('Solicitud rechazada correctamente');
      setSolicitudes(prev => prev.map(s => 
        s.id === id ? {...s, estado: 'rechazado'} : s
      ));
    } catch (error) {
      setError('Error al rechazar la solicitud');
    }
  };

  const handleViewDetails = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setDetailDialog(true);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'aprobado': return 'success';
      case 'rechazado': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Solicitudes de Autorización Pendientes
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
                  <TableCell>HU de Bobina</TableCell>
                  <TableCell>Solicitante</TableCell>
                  <TableCell>Fecha Solicitud</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {solicitudes.map((solicitud) => (
                  <TableRow key={solicitud.id}>
                    <TableCell>{solicitud.hu}</TableCell>
                    <TableCell>{solicitud.solicitante}</TableCell>
                    <TableCell>{solicitud.fecha}</TableCell>
                    <TableCell>
                      <Chip 
                        label={solicitud.estado} 
                        color={getEstadoColor(solicitud.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetails(solicitud)}
                        sx={{ mr: 1 }}
                      >
                        Ver
                      </Button>
                      {solicitud.estado === 'pendiente' && (
                        <>
                          <Button
                            size="small"
                            startIcon={<ApproveIcon />}
                            color="success"
                            onClick={() => handleAprobar(solicitud.id)}
                            sx={{ mr: 1 }}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="small"
                            startIcon={<RejectIcon />}
                            color="error"
                            onClick={() => handleRechazar(solicitud.id)}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalles de Solicitud</DialogTitle>
        <DialogContent>
          {selectedSolicitud && (
            <Box sx={{ mt: 2 }}>
              <Typography><strong>HU:</strong> {selectedSolicitud.hu}</Typography>
              <Typography><strong>Solicitante:</strong> {selectedSolicitud.solicitante}</Typography>
              <Typography><strong>Fecha:</strong> {selectedSolicitud.fecha}</Typography>
              <Typography><strong>Estado:</strong> 
                <Chip 
                  label={selectedSolicitud.estado} 
                  color={getEstadoColor(selectedSolicitud.estado)}
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography><strong>Motivo:</strong> {selectedSolicitud.motivo}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutorizacionList;