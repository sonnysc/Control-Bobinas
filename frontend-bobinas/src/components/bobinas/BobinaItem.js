// src/components/bobinas/BobinaItem.js
import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  Box,
  Divider,
  Tooltip,
  Avatar,
  CircularProgress
} from '@mui/material';
import { 
    Visibility as ViewIcon, 
    Edit as EditIcon, 
    Business, 
    Event,
    Image as ImageIcon,
    BrokenImage
} from '@mui/icons-material';
import { ROLES } from '../../utils/constants';
import { useState } from 'react';

const BobinaItem = ({ bobina, onViewDetails, onEditBobina, userRole }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getDiasRestantesColor = (dias) => {
    const diasRedondeados = Math.round(dias || 0);
    if (diasRedondeados <= 7) return 'error';
    if (diasRedondeados <= 30) return 'warning';
    return 'success';
  };

  const getDiasRestantesText = (dias) => {
    const diasRedondeados = Math.round(dias || 0);
    if (diasRedondeados === 0) return 'Eliminar Hoy';
    if (diasRedondeados < 0) return `Vencido hace ${Math.abs(diasRedondeados)} días`;
    if (diasRedondeados === 1) return '1 día restante';
    return `${diasRedondeados} días restantes`;
  };

  const isValidImageUrl = (url) => {
    return url && url.trim() !== '' && url !== 'null' && url !== 'undefined';
  };

  const getImageUrl = () => {
    if (!isValidImageUrl(bobina.foto_url)) return null;
    
    // Si la URL contiene '/storage/', la convertimos en relativa
    if (bobina.foto_url.includes('/storage/')) {
        const parts = bobina.foto_url.split('/storage/');
        return `/storage/${parts[1]}`;
    }
    
    return bobina.foto_url;
  };

  const imageUrl = getImageUrl();

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
        borderColor: 'primary.main'
      },
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 1. Encabezado de Imagen */}
      <Box sx={{ position: 'relative', height: 180, bgcolor: '#f0f2f5' }}>
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <Box sx={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1
              }}>
                <CircularProgress size={30} />
              </Box>
            )}
            
            <CardMedia
              component="img"
              height="180"
              image={imageUrl}
              alt={bobina.hu}
              sx={{ 
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                opacity: imageLoading ? 0.5 : 1,
                transition: 'opacity 0.3s'
              }}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
            <Box sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: '60px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)',
                pointerEvents: 'none'
            }} />
          </>
        ) : (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'text.disabled', 
            background: 'linear-gradient(45deg, #f0f2f5 25%, #e6e8eb 25%, #e6e8eb 50%, #f0f2f5 50%, #f0f2f5 75%, #e6e8eb 75%, #e6e8eb 100%)',
            backgroundSize: '20px 20px'
          }}>
            {imageError ? (
              <>
                <BrokenImage sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>Error de carga</Typography>
              </>
            ) : (
              <>
                <ImageIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>Sin Imagen</Typography>
              </>
            )}
          </Box>
        )}
        
        <Chip
            label={getDiasRestantesText(bobina.dias_restantes)}
            size="small"
            color={getDiasRestantesColor(bobina.dias_restantes)}
            sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 2,
                border: '1px solid rgba(255,255,255,0.2)'
            }}
        />
        
        {bobina.fecha_reemplazo && (
             <Chip
             label="Reemplazado"
             size="small"
             color="info"
             sx={{
               position: 'absolute',
               bottom: 12,
               left: 12,
               fontWeight: 'bold',
               boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
               border: '1px solid rgba(255,255,255,0.2)',
               zIndex: 2
             }}
           />
        )}
      </Box>

      {/* 2. Contenido de Información */}
      <CardContent sx={{ flexGrow: 1, p: '20px !important' }}>
        {/* Header de la tarjeta */}
        <Box sx={{ mb: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '1px', fontSize: '0.7rem' }}>
                HU / SERIAL
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a237e', lineHeight: 1.2, fontSize: '1.15rem' }}>
                {bobina.hu}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Business sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.primary" fontWeight="500">
                    {bobina.cliente || 'Sin Asignar'}
                </Typography>
            </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* ✅ AJUSTE AQUÍ: Evitar amontonamiento */}
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: 2 // Espacio mínimo entre operador y fecha
        }}>
            {/* Operador: flex-1 para ocupar espacio y noWrap para cortar si es largo */}
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                <Avatar 
                    sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#e0e0e0', color: '#666', mr: 1, flexShrink: 0 }}
                >
                    {bobina.usuario?.username?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="caption" color="text.secondary" noWrap title={bobina.usuario?.username}>
                    {bobina.usuario?.username}
                </Typography>
            </Box>
            
            {/* Fecha: flexShrink-0 para asegurar que la fecha siempre se vea completa */}
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', flexShrink: 0 }}>
                <Event sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                    {bobina.fecha_embarque ? new Date(bobina.fecha_embarque).toLocaleDateString() : '-'}
                </Typography>
            </Box>
        </Box>
      </CardContent>

      {/* 3. Footer de Acciones (Sin ID) */}
      <Box sx={{ 
          p: 1.5, 
          bgcolor: '#fafafa', 
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end', // Alineado a la derecha
          alignItems: 'center'
      }}>
        <Box>
            <Tooltip title="Ver Detalles">
                <IconButton 
                    size="small" 
                    onClick={() => onViewDetails(bobina)}
                    sx={{ 
                        color: 'primary.main', 
                        border: '1px solid rgba(25, 118, 210, 0.3)',
                        borderRadius: '8px',
                        p: 0.8,
                        mr: 1,
                        '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)', borderColor: 'primary.main' }
                    }}
                >
                    <ViewIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            {userRole === ROLES.ADMIN && (
                <Tooltip title="Editar">
                    <IconButton 
                        size="small" 
                        onClick={() => onEditBobina(bobina)}
                        sx={{ 
                            color: 'warning.main',
                            border: '1px solid rgba(237, 108, 2, 0.3)',
                            borderRadius: '8px',
                            p: 0.8,
                            '&:hover': { bgcolor: 'rgba(237, 108, 2, 0.08)', borderColor: 'warning.main' }
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
      </Box>
    </Card>
  );
};

export default BobinaItem;