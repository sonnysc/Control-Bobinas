// src/components/modals/CameraModal.js

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Close, Camera } from '@mui/icons-material';

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
    setTimeout(() => {
      setFlash(false);
      onTakePhoto();
    }, 200); // breve efecto de flash
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          backgroundColor: '#000',
          overflow: 'hidden',
          borderRadius: isMobile ? 0 : '20px',
          maxWidth: isMobile ? '100%' : '500px',
          maxHeight: isMobile ? '100vh' : '600px'
        }
      }}
    >
      <DialogTitle sx={{
        color: 'white',
        textAlign: 'center',
        py: 2,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
        position: 'relative',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
          📸 Tomar Fotografía de la Bobina
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
              transform: 'translateY(-50%) scale(1.1)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{
        p: 0,
        position: 'relative',
        minHeight: isMobile ? 'calc(100vh - 140px)' : '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        transition: 'opacity 0.3s ease'
      }}>
        {cameraError ? (
          <Box sx={{ color: 'white', textAlign: 'center', p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {cameraError}
            </Alert>
            <Button onClick={onClose} variant="contained" sx={{ mt: 2 }}>
              Cerrar
            </Button>
          </Box>
        ) : (
          <>
            {isLoading && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                zIndex: 10
              }}>
                <CircularProgress sx={{ color: 'white' }} />
                <Typography variant="body2" sx={{ color: 'white', ml: 2 }}>
                  Cargando cámara...
                </Typography>
              </Box>
            )}

            {/* Flash visual */}
            {flash && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'white',
                opacity: 0.8,
                zIndex: 30,
                animation: 'flashFade 0.3s ease-out'
              }} />
            )}

            {/* Marco de encuadre */}
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '250px',
              height: '250px',
              border: '4px solid #00bfff',
              borderRadius: '8px',
              zIndex: 5,
              pointerEvents: 'none',
              boxShadow: '0 0 20px #00bfff'
            }}>

              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  top: '-50px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  backdropFilter: 'blur(6px)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                📋 Encuadra la bobina dentro del marco
              </Typography>

              {/* Cruz central */}
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '15px',
                height: '2px',
                backgroundColor: '#00bfff'
              }} />
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '15px',
                height: '2px',
                backgroundColor: 'rgba(255,255,255,0.7)'
              }} />
            </Box>

            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              onLoadedData={handleVideoLoad}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                minHeight: isMobile ? 'calc(100vh - 200px)' : '400px'
              }}
            />

            {/* Controles */}
            <Box sx={{
              position: 'absolute',
              bottom: isMobile ? 80 : 40, // más alto en móviles
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              width: '100%',
              padding: '0 20px'
            }}>

              <Button
                variant="contained"
                startIcon={<Camera />}
                onClick={handleTakePhoto}
                disabled={isLoading}
                sx={{
                  minWidth: '200px',
                  height: '60px',
                  borderRadius: '30px',
                  backgroundColor: '#2196f3',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#1976d2',
                    transform: 'scale(1.05)'
                  },
                  '&:disabled': { backgroundColor: '#666' },
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  animation: isLoading ? 'pulse 1.5s infinite' : 'none'
                }}
              >
                Tomar Foto
              </Button>
            </Box>
          </>
        )}
      </DialogContent>

      {/* Animaciones */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes flashFade {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </Dialog>
  );
};

export default CameraModal;