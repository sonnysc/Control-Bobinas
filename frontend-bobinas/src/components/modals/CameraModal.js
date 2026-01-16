// src/components/modals/CameraModal.js

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Alert,
  Slide
} from '@mui/material';
import { 
  Close, 
  CameraAlt
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';

// Animación de flash suave
const flashAnimation = keyframes`
  0% { opacity: 0; }
  10% { opacity: 0.8; }
  100% { opacity: 0; }
`;

// Transición suave al abrir el modal
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CameraModal = ({
  open,
  onClose,
  onTakePhoto,
  cameraVideoRef,
  cameraError,
  isMobile
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setFlash(false);
    }
  }, [open]);

  const handleTakePhoto = () => {
    setFlash(true);
    // Vibración háptica si el dispositivo lo soporta (mejora UX móvil)
    if (navigator.vibrate) navigator.vibrate(50);
    
    setTimeout(() => {
      setFlash(false);
      onTakePhoto();
    }, 300); // Sincronizado con la animación
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile} // Pantalla completa en móviles
      maxWidth="md"
      fullWidth={!isMobile}
      TransitionComponent={Transition}
      disableRestoreFocus
      PaperProps={{
        sx: {
          backgroundColor: '#000',
          overflow: 'hidden',
          borderRadius: isMobile ? 0 : '24px', // Bordes más redondeados en desktop
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          height: isMobile ? '100%' : '600px', // Altura fija en desktop para mejor encuadre
          maxHeight: '85vh'
        }
      }}
    >
      {/* Efecto de Flash */}
      {flash && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'white',
          zIndex: 9999,
          animation: `${flashAnimation} 0.3s ease-out`
        }} />
      )}

      {/* Header Flotante (Transparente) */}
      <Box sx={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 10,
        p: 2,
        pt: isMobile ? 3 : 2, // Más espacio en móviles por la barra de estado
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ bgcolor: 'rgba(33, 150, 243, 0.2)', p: 0.8, borderRadius: '50%' }}>
                <CameraAlt sx={{ color: '#64b5f6', fontSize: 20 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, letterSpacing: 0.5, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Nueva Foto
            </Typography>
        </Box>
        
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: 'white', 
            bgcolor: 'rgba(255,255,255,0.15)', 
            backdropFilter: 'blur(4px)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } 
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', bgcolor: '#000' }}>
        
        {/* Estado de Error */}
        {cameraError && (
          <Box sx={{ 
            position: 'absolute', inset: 0, zIndex: 20, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            bgcolor: '#121212', p: 4 
          }}>
            <Alert severity="error" variant="filled" sx={{ width: '100%', maxWidth: 400, mb: 3, borderRadius: '12px' }}>
              {cameraError}
            </Alert>
            <IconButton onClick={onClose} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)', p: 2 }}>
              <Close />
            </IconButton>
          </Box>
        )}

        {/* Estado de Carga */}
        {isLoading && !cameraError && (
          <Box sx={{ 
            position: 'absolute', inset: 0, zIndex: 5, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
          }}>
            <CircularProgress size={50} thickness={4} sx={{ color: '#2196f3' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 3, fontWeight: 500, letterSpacing: 1 }}>
                INICIANDO CÁMARA...
            </Typography>
          </Box>
        )}

        {/* Contenedor de Video */}
        <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
          <video
            ref={cameraVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={handleVideoLoad}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover', // Llena todo el espacio disponible
              display: isLoading ? 'none' : 'block'
              // ✅ ELIMINADO: transform: 'scaleX(-1)' para que la cámara trasera se vea natural
            }}
          />

          {/* Overlay de Guía (Visor) */}
          {!isLoading && !cameraError && (
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {/* Área Central de Enfoque */}
              <Box sx={{
                position: 'absolute',
                top: '45%', left: '50%', // Ligeramente arriba para dar espacio a controles
                transform: 'translate(-50%, -50%)',
                width: '75%', maxWidth: 320, 
                aspectRatio: '1/1', // Cuadrado perfecto
                borderRadius: '20px',
                // Este box-shadow crea el efecto de oscurecer todo lo que está fuera del cuadro
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)', 
                border: '1.5px solid rgba(255, 255, 255, 0.3)'
              }}>
                {/* Esquinas Marcadas */}
                <Box sx={{ position: 'absolute', top: -1, left: -1, width: 24, height: 24, borderTop: '4px solid #2196f3', borderLeft: '4px solid #2196f3', borderTopLeftRadius: '20px' }} />
                <Box sx={{ position: 'absolute', top: -1, right: -1, width: 24, height: 24, borderTop: '4px solid #2196f3', borderRight: '4px solid #2196f3', borderTopRightRadius: '20px' }} />
                <Box sx={{ position: 'absolute', bottom: -1, left: -1, width: 24, height: 24, borderBottom: '4px solid #2196f3', borderLeft: '4px solid #2196f3', borderBottomLeftRadius: '20px' }} />
                <Box sx={{ position: 'absolute', bottom: -1, right: -1, width: 24, height: 24, borderBottom: '4px solid #2196f3', borderRight: '4px solid #2196f3', borderBottomRightRadius: '20px' }} />
                
                {/* Cruz Central Sutil */}
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', width: 12, height: 2, bgcolor: 'rgba(255,255,255,0.5)', transform: 'translate(-50%, -50%)' }} />
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', width: 2, height: 12, bgcolor: 'rgba(255,255,255,0.5)', transform: 'translate(-50%, -50%)' }} />

                <Typography variant="caption" sx={{ 
                  position: 'absolute', bottom: -30, left: 0, right: 0, 
                  textAlign: 'center', color: 'rgba(255,255,255,0.9)', 
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontWeight: 500, letterSpacing: 0.5
                }}>
                  ENCUADRA LA BOBINA AQUÍ
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Barra de Controles Inferior */}
        <Box sx={{
          pt: 4, pb: 5, px: 3,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10
        }}>
          {/* Botón Obturador Estilo Cámara Nativa */}
          <IconButton
            onClick={handleTakePhoto}
            disabled={isLoading || !!cameraError}
            disableRipple
            sx={{
              width: 84, height: 84, p: 0,
              border: '4px solid rgba(255, 255, 255, 0.4)', // Anillo exterior
              borderRadius: '50%',
              bgcolor: 'transparent',
              position: 'relative',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                borderColor: 'rgba(255, 255, 255, 0.8)',
                transform: 'scale(1.05)'
              },
              '&:active': { 
                transform: 'scale(0.95)',
                borderColor: 'rgba(255, 255, 255, 1)'
              }
            }}
          >
            {/* Círculo Interior */}
            <Box sx={{
              width: 68, height: 68,
              bgcolor: 'white',
              borderRadius: '50%',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.1s',
              // Efecto al presionar
              '.MuiIconButton-root:active &': {
                width: 60, height: 60,
                bgcolor: '#f5f5f5'
              }
            }} />
          </IconButton>
        </Box>

      </DialogContent>
    </Dialog>
  );
};

export default CameraModal;