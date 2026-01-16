// src/components/modals/ScannerModal.js
import React, { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Button,
    Alert,
    CircularProgress,
    Slide,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { Close, QrCodeScanner, Refresh } from '@mui/icons-material';
import { keyframes } from '@emotion/react';

// Animación de línea de escaneo (Efecto Láser)
const scanAnimation = keyframes`
  0% { top: 10%; opacity: 0; }
  25% { opacity: 1; }
  75% { opacity: 1; }
  100% { top: 90%; opacity: 0; }
`;

// Transición suave al abrir
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ScannerModal = ({
    open,
    onClose,
    scanning,
    qrError,
    videoRef,
    onStartScanner,
    onStopScanner
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleRetry = () => {
        onStopScanner();
        setTimeout(() => {
            onStartScanner();
        }, 500);
    };

    useEffect(() => {
        if (open && !scanning && !qrError) {
            const timer = setTimeout(() => {
                onStartScanner();
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [open, scanning, qrError, onStartScanner]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isMobile}
            maxWidth="md"
            fullWidth={!isMobile}
            TransitionComponent={Transition}
            disableRestoreFocus
            PaperProps={{
                sx: {
                    backgroundColor: '#000',
                    overflow: 'hidden',
                    borderRadius: isMobile ? 0 : '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    height: isMobile ? '100%' : '600px',
                    maxHeight: '85vh'
                }
            }}
        >
            {/* Header Flotante */}
            <Box sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                zIndex: 10,
                p: 2,
                pt: isMobile ? 3 : 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: 'rgba(33, 150, 243, 0.2)', p: 0.8, borderRadius: '50%' }}>
                        <QrCodeScanner sx={{ color: '#64b5f6', fontSize: 20 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, letterSpacing: 0.5, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        Escanear Código
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
                {qrError && (
                    <Box sx={{ 
                        position: 'absolute', inset: 0, zIndex: 20, 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                        bgcolor: 'rgba(0,0,0,0.85)', p: 4, backdropFilter: 'blur(5px)'
                    }}>
                        <Alert 
                            severity="error" 
                            variant="filled" 
                            sx={{ width: '100%', maxWidth: 400, mb: 4, borderRadius: '12px', fontWeight: 500 }}
                        >
                            {qrError}
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button 
                                onClick={onClose} 
                                variant="outlined" 
                                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', px: 3 }}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleRetry} 
                                variant="contained" 
                                startIcon={<Refresh />}
                                sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' }, px: 3 }}
                            >
                                Reintentar
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Video Container */}
                <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
                    <video
                        ref={videoRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: scanning ? 1 : 0.6,
                            transition: 'opacity 0.5s ease'
                        }}
                        autoPlay
                        muted
                        playsInline
                    />

                    {/* Loader Inicial */}
                    {!scanning && !qrError && (
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

                    {/* Overlay de Escaneo (Solo visible cuando escanea) */}
                    {scanning && !qrError && (
                        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                            {/* Marco Central */}
                            <Box sx={{
                                position: 'absolute',
                                top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '70%', maxWidth: 280,
                                aspectRatio: '1/1',
                                borderRadius: '20px',
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)', // Oscurece el resto
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                {/* Esquinas Azules */}
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTop: '4px solid #2196f3', borderLeft: '4px solid #2196f3', borderTopLeftRadius: '20px' }} />
                                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTop: '4px solid #2196f3', borderRight: '4px solid #2196f3', borderTopRightRadius: '20px' }} />
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottom: '4px solid #2196f3', borderLeft: '4px solid #2196f3', borderBottomLeftRadius: '20px' }} />
                                <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottom: '4px solid #2196f3', borderRight: '4px solid #2196f3', borderBottomRightRadius: '20px' }} />

                                {/* Línea de Escaneo Animada */}
                                <Box sx={{
                                    position: 'absolute',
                                    left: '2%', right: '2%',
                                    height: '2px',
                                    background: 'linear-gradient(90deg, transparent, #2196f3, transparent)',
                                    boxShadow: '0 0 10px #2196f3',
                                    animation: `${scanAnimation} 2s linear infinite`
                                }} />
                            </Box>

                            {/* Texto Inferior */}
                            <Box sx={{
                                position: 'absolute',
                                bottom: '15%', left: 0, right: 0,
                                textAlign: 'center'
                            }}>
                                <Box sx={{
                                    display: 'inline-block',
                                    bgcolor: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    px: 2, py: 0.5,
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <Typography variant="caption" sx={{ fontWeight: 500, letterSpacing: 0.5 }}>
                                        Coloca el código QR dentro del marco
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Footer de Controles */}
                <Box sx={{
                    p: 3, pb: 4,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10
                }}>
                    <Button 
                        onClick={onClose}
                        variant="contained"
                        color="error"
                        startIcon={<Close />}
                        sx={{
                            borderRadius: '30px',
                            px: 4, py: 1.2,
                            fontWeight: 'bold',
                            textTransform: 'none',
                            bgcolor: 'rgba(211, 47, 47, 0.9)',
                            backdropFilter: 'blur(4px)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            '&:hover': { bgcolor: '#d32f2f' }
                        }}
                    >
                        Cancelar
                    </Button>
                </Box>

            </DialogContent>
        </Dialog>
    );
};

export default ScannerModal;