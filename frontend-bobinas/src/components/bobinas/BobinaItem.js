// src/components/bobinas/BobinaItem.js
import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  Box
} from '@mui/material';
import { Visibility as ViewIcon, Edit as EditIcon } from '@mui/icons-material';
import { ROLES } from '../../utils/constants';

const BobinaItem = ({ bobina, onViewDetails, onEditBobina, userRole }) => {
  const getDiasRestantesColor = (dias) => {
    const diasRedondeados = Math.round(dias || 0);
    if (diasRedondeados <= 7) return 'error';
    if (diasRedondeados <= 30) return 'warning';
    return 'success';
  };

  const getDiasRestantesText = (dias) => {
    const diasRedondeados = Math.round(dias || 0);
    if (diasRedondeados === 0) return 'Hoy se elimina';
    if (diasRedondeados === 1) return '1 día restante';
    return `${diasRedondeados} días restantes`;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {bobina.foto_path ? (
        <CardMedia
          component="img"
          height="200"
          image={`http://localhost:8000/storage/${bobina.foto_path}`}
          alt={bobina.hu || 'Bobina'}
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f0f0' }}>
          <Typography variant="subtitle1" color="text.secondary">No hay foto</Typography>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div">{bobina.hu || 'N/A'}</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Cliente:</strong> {bobina.cliente || 'N/A'}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Fecha:</strong> {bobina.fecha_embarque ? new Date(bobina.fecha_embarque).toLocaleDateString() : 'N/A'}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          <strong>Registrado por:</strong> {bobina.usuario?.username || 'N/A'}
        </Typography>

        {/* Días restantes con color */}
        <Box sx={{ mt: 1 }}>
          <Chip
            label={getDiasRestantesText(bobina.dias_restantes)}
            size="small"
            color={getDiasRestantesColor(bobina.dias_restantes)}
            variant="outlined"
          />
        </Box>

        {/* Información de reemplazo */}
        {bobina.fecha_reemplazo && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Reemplazado por:</strong> {bobina.reemplazador?.username || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Aprobado por:</strong> {bobina.aprobador?.username || 'N/A'}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
        <IconButton size="small" onClick={() => onViewDetails(bobina)} color="primary">
          <ViewIcon />
        </IconButton>

        {userRole === ROLES.ADMIN && (
          <IconButton size="small" onClick={() => onEditBobina(bobina)} color="secondary">
            <EditIcon />
          </IconButton>
        )}
      </Box>
    </Card>
  );
};

export default BobinaItem;