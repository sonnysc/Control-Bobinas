// src/components/modals/ScannerModal.js

import React, { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Button,
    Alert
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { CircularProgress } from '@mui/material'; // 

const ScannerModal = ({
    open,
    onClose,
    scanning,
    qrError,
    videoRef,
    onStartScanner,
    onStopScanner
}) => {
    // 🔥 Añadir estilos CSS globalmente
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
      @keyframes scanLine {
        0% { top: -100%; }
        100% { top: 100%; }
      }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: '#000',
                    overflow: 'hidden',
                    borderRadius: '20px',
                    maxWidth: '500px'
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
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Escanear Código HU
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
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000'
            }}>
                {qrError ? (
                    <Box sx={{ color: 'white', textAlign: 'center', p: 3 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {qrError}
                        </Alert>
                        {/* 🔥 Cambiar el texto del botón para reintentar */}
                        <Button 
                            onClick={onStartScanner} 
                            variant="contained" 
                            sx={{ mt: 2, mr: 1 }}
                        >
                            🔄 Reintentar
                        </Button>
                        <Button 
                            onClick={onClose} 
                            variant="outlined" 
                            sx={{ 
                                mt: 2,
                                color: 'white',
                                borderColor: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)'
                                }
                            }}
                        >
                            Cerrar
                        </Button>
                    </Box>
                ) : (
                    <>
                        {/* Marco de escaneo */}
                        <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '300px',
                            height: '200px',
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
                                {scanning ? 'Escaneando...' : 'Preparando escáner...'}
                            </Typography>

                            {/* Líneas de escaneo animadas - solo mostrar cuando está escaneando */}
                            {scanning && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '2px',
                                    height: '100%',
                                    background: 'linear-gradient(to bottom, transparent, #00bfff, transparent)',
                                    animation: 'scanLine 2s infinite linear'
                                }} />
                            )}

                            {/* Esquinas */}
                            <Box sx={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                width: '20px',
                                height: '20px',
                                borderTop: '3px solid #2196f3',
                                borderLeft: '3px solid #2196f3'
                            }} />
                            <Box sx={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                width: '20px',
                                height: '20px',
                                borderTop: '3px solid #2196f3',
                                borderRight: '3px solid #2196f3'
                            }} />
                            <Box sx={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '10px',
                                width: '20px',
                                height: '20px',
                                borderBottom: '3px solid #2196f3',
                                borderLeft: '3px solid #2196f3'
                            }} />
                            <Box sx={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '10px',
                                width: '20px',
                                height: '20px',
                                borderBottom: '3px solid #2196f3',
                                borderRight: '3px solid #2196f3'
                            }} />
                        </Box>

                        {/* Video del scanner */}
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                minHeight: '400px',
                                opacity: scanning ? 1 : 0.7 // 🔥 Cambiar opacidad cuando no está escaneando
                            }}
                            autoPlay
                            muted
                            playsInline
                        />

                        {/* 🔥 Simplificar controles - solo mostrar botón para detener */}
                        {scanning && (
                            <Box sx={{
                                position: 'absolute',
                                bottom: 20,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                                width: '100%',
                                padding: '20px'
                            }}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={onStopScanner}
                                    sx={{
                                        minWidth: '200px',
                                        height: '50px',
                                        borderRadius: '25px',
                                        backgroundColor: '#ff4444',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            backgroundColor: '#cc0000',
                                            transform: 'scale(1.05)'
                                        },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    ⏹️ Detener Escaneo
                                </Button>
                            </Box>
                        )}

                        {/* 🔥 Mostrar mensaje cuando no está escaneando */}
                        {!scanning && !qrError && (
                            <Box sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                textAlign: 'center',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                padding: '20px',
                                borderRadius: '10px'
                            }}>
                                <CircularProgress sx={{ color: '#2196f3', mb: 2 }} />
                                <Typography>Iniciando cámara...</Typography>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ScannerModal;