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
import {
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const BobinaItem = ({ bobina, onViewDetails, onReplacePhoto }) => {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'bueno': return 'success';
      case 'regular': return 'warning';
      case 'malo': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="200"
        image={`http://localhost:8000/storage/${bobina.foto_path.replace('public/', '')}`}
        alt={bobina.hu}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div">
            {bobina.hu}
          </Typography>
          <Chip 
            label={bobina.estado} 
            size="small" 
            color={getEstadoColor(bobina.estado)}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Cliente:</strong> {bobina.cliente || 'N/A'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Fecha:</strong> {new Date(bobina.fecha_embarque).toLocaleDateString()}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          <strong>Registrado por:</strong> {bobina.usuario?.username}
        </Typography>
      </CardContent>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
        <IconButton 
          size="small" 
          onClick={() => onViewDetails(bobina)}
          color="primary"
        >
          <ViewIcon />
        </IconButton>
        
        <IconButton 
          size="small" 
          onClick={() => onReplacePhoto(bobina)}
          color="secondary"
        >
          <EditIcon />
        </IconButton>
      </Box>
    </Card>
  );
};

export default BobinaItem;