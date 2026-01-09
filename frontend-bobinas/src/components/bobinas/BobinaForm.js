// src/components/bobinas/BobinaForm.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Grid,
  CircularProgress,
  TextField,
  Autocomplete,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemText,
  Paper,
  Divider
} from '@mui/material';
import { 
  ArrowBack, 
  Save, 
  DeleteForever, 
  Close, 
  CleaningServices,
  QrCodeScanner,
  Business,
  CameraAlt 
} from '@mui/icons-material';
import { ROLES } from '../../utils/constants';
import { useBobinaForm } from '../hooks/useBobinaForm';
import { useCamera } from '../hooks/useCamera';
import { useScanner } from '../hooks/useScanner';
import CameraModal from '../modals/CameraModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import AuthorizationModal from '../modals/AuthorizationModal';
import ScannerSection from '../modals/ScannerSection';
import PhotoUploadSection from '../modals/PhotoUploadSection';
import ScannerModal from '../modals/ScannerModal';

const BobinaForm = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  
  const navigate = useNavigate();
  const bobinaForm = useBobinaForm();
  const camera = useCamera();

  const handleScanSuccess = (scannedValue) => {
    bobinaForm.handleInputChange({
      target: {
        name: 'hu',
        value: scannedValue
      }
    });
  };

  const scanner = useScanner(handleScanSuccess);

  const {
    formData,
    preview,
    loading,
    error,
    success,
    existingBobina,
    confirmReplacementDialog,
    autorizacionDialog,
    credencialesLider,
    autorizando,
    isEdit,
    user,
    handleFileSelect,
    handleSubmit,
    setHasMadeFirstRegistration,
    setFormData,
    setPreview,
    handleConfirmReplacement,
    handleCancelReplacement,
    handleCancelAuthorization,
    handleCredencialesChange,
    verificarLider,
    setError,
    setSuccess,
    isFormValid,
    modalError,
    clientes, 
    removeClientSuggestion
  } = bobinaForm;

  const onInputChangeWrapper = (e) => {
    const { name, value } = e.target;
    if (name === 'hu' && value.length > 9) {
        const truncatedValue = value.substring(0, 9);
        bobinaForm.handleInputChange({
            target: {
                name: name,
                value: truncatedValue
            }
        });
    } else {
        bobinaForm.handleInputChange(e);
    }
  };

  const onClienteChange = (event, newValue) => {
    bobinaForm.handleInputChange({
        target: {
            name: 'cliente',
            value: newValue || ''
        }
    });
  };

  const handleDeleteClick = (e, clientName) => {
    e.stopPropagation();
    setClientToDelete(clientName);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (clientToDelete) {
        await removeClientSuggestion(clientToDelete);
        setDeleteConfirmOpen(false);
        setClientToDelete(null);
    }
  };

  const handleClearForm = () => {
    setHasMadeFirstRegistration(false);
    setFormData({
      hu: '',
      cliente: '',
      foto: null
    });
    setPreview(null);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  const canDelete = user?.role === ROLES.ADMIN; 

  if (isEdit && user?.role !== ROLES.ADMIN) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
          Volver
        </Button>
        <Alert severity="error">No tienes permisos para editar bobinas</Alert>
      </Box>
    );
  }

  // Componente interno para los encabezados de sección
  const SectionHeader = ({ icon: Icon, title }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 1, borderBottom: '1px solid #f0f0f0' }}>
        <Icon color="primary" sx={{ mr: 1.5 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#444', textTransform: 'uppercase', fontSize: '0.9rem' }}>
            {title}
        </Typography>
    </Box>
  );

  return (
    <Box sx={{ pb: 4, width: '100%' }}>
      {(user?.role !== ROLES.EMBARCADOR || isEdit) && (
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
          Volver
        </Button>
      )}

      {/* ✅ Tarjeta principal ocupando todo el ancho disponible hasta 1200px */}
      <Card sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#1565c0', mb: 3, textAlign: 'center' }}>
            {user?.role === ROLES.EMBARCADOR ? 'Nuevo Registro' : isEdit ? 'Editar Registro' : 'Nuevo Registro'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
          {scanner.qrError && <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }} onClose={() => scanner.setQrError('')}>{scanner.qrError}</Alert>}

          <CameraModal
            open={camera.cameraDialogOpen}
            onClose={camera.stopCamera}
            onTakePhoto={async () => {
              const file = await camera.takePhoto();
              if (file) {
                handleFileSelect(file, true);
                camera.stopCamera();
              }
            }}
            cameraVideoRef={camera.cameraVideoRef}
            cameraError={camera.cameraError}
            isMobile={isMobile}
          />

          <ScannerModal
            open={scanner.scannerModalOpen}
            onClose={scanner.closeScannerModal}
            scanning={scanner.scanning}
            qrError={scanner.qrError}
            videoRef={scanner.videoRef}
            onStartScanner={scanner.startScanner}
            onStopScanner={scanner.stopScanner}
          />

          <ConfirmationModal
            open={confirmReplacementDialog}
            onClose={handleCancelReplacement}
            onConfirm={handleConfirmReplacement}
            existingBobina={existingBobina}
            formData={formData}
          />

          <AuthorizationModal
            open={autorizacionDialog}
            onClose={handleCancelAuthorization}
            credencialesLider={credencialesLider}
            onCredencialesChange={handleCredencialesChange}
            onAuthorize={verificarLider}
            autorizando={autorizando}
            error={modalError}
          />

          <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
                <DeleteForever /> Eliminar sugerencia
            </DialogTitle>
            <DialogContent>
                <Typography>
                    ¿Deseas quitar "<strong>{clientToDelete}</strong>" de la lista?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Esto evitará que aparezca como opción en el futuro.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
                <Button onClick={confirmDeleteClient} color="error" variant="contained">Eliminar</Button>
            </DialogActions>
          </Dialog>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* ✅ Eliminamos spacing={3} y margin para controlar el ancho manualmente */}
            <Grid container sx={{ width: '100%', m: 0 }}>
              
              {/* Sección 1: Identificación HU */}
              {/* ✅ p: '0 !important' elimina el padding interno del grid para evitar desalineación */}
              <Grid item xs={12} sx={{ width: '100%', p: '0 !important', mb: 2 }}>
                <Paper elevation={0} sx={{ width: '100%', p: 2.5, bgcolor: '#f8f9fa', borderRadius: '12px', border: '1px solid #eef0f2', boxSizing: 'border-box' }}>
                    <SectionHeader icon={QrCodeScanner} title="Identificación de Bobina (HU)" />
                    <ScannerSection
                      formData={formData}
                      onInputChange={onInputChangeWrapper}
                      qrError={scanner.qrError}
                      onOpenScannerModal={scanner.openScannerModal}
                    />
                </Paper>
              </Grid>

              {/* Sección 2: Cliente */}
              <Grid item xs={12} sx={{ width: '100%', p: '0 !important', mb: 2 }}>
                <Paper elevation={0} sx={{ width: '100%', p: 2.5, bgcolor: '#f8f9fa', borderRadius: '12px', border: '1px solid #eef0f2', boxSizing: 'border-box' }}>
                    <SectionHeader icon={Business} title="Asignación de Cliente" />
                    
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'row', 
                        gap: 1.5,
                        alignItems: 'flex-start',
                        width: '100%'
                    }}>
                        <Box sx={{ flexGrow: 1, width: '100%' }}>
                            <Autocomplete
                                fullWidth
                                freeSolo
                                options={clientes}
                                value={formData.cliente}
                                onChange={onClienteChange}
                                onInputChange={(event, newInputValue) => {
                                    if (event && event.type === 'change') {
                                        onClienteChange(event, newInputValue);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cliente"
                                        name="cliente"
                                        placeholder="Seleccione o escriba"
                                        required
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                        sx={{ 
                                            bgcolor: 'white',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px'
                                            }
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => {
                                    const { key, ...otherProps } = props;
                                    return (
                                    <li key={key} {...otherProps}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            width: '100%'
                                        }}>
                                            <ListItemText 
                                                primary={option} 
                                                sx={{ 
                                                    mr: 1, 
                                                    flexGrow: 1, 
                                                    whiteSpace: 'normal', 
                                                    wordBreak: 'break-word' 
                                                }} 
                                            />
                                            {canDelete && (
                                                <IconButton 
                                                    onClick={(e) => handleDeleteClick(e, option)}
                                                    size="small"
                                                    sx={{ color: '#ef5350' }}
                                                >
                                                    <Close fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </li>
                                )}}
                            />
                        </Box>
                        
                        {!isEdit && (
                            <Button
                                variant="outlined"
                                onClick={handleClearForm}
                                startIcon={<CleaningServices />} // ✅ Se usa aquí
                                color="secondary"
                                sx={{ 
                                    height: '40px', 
                                    minWidth: 'auto',
                                    whiteSpace: 'nowrap',
                                    bgcolor: 'white',
                                    borderColor: '#e0e0e0',
                                    color: '#666',
                                    borderRadius: '8px',
                                    textTransform: 'none', 
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    px: 2,
                                    '&:hover': {
                                        borderColor: '#bdbdbd',
                                        bgcolor: '#f5f5f5',
                                        color: '#333'
                                    }
                                }}
                            >
                                Limpiar
                            </Button>
                        )}
                    </Box>
                </Paper>
              </Grid>

              {/* Sección 3: Evidencia Fotográfica */}
              <Grid item xs={12} sx={{ width: '100%', p: '0 !important', mb: 2 }}>
                <Paper elevation={0} sx={{ width: '100%', p: 2.5, bgcolor: '#f8f9fa', borderRadius: '12px', border: '1px solid #eef0f2', boxSizing: 'border-box' }}>
                    <SectionHeader icon={CameraAlt} title="Evidencia Fotográfica" />
                    <PhotoUploadSection
                      formData={formData}
                      isEdit={isEdit}
                      isMobile={isMobile}
                      cameraPermission={camera.cameraPermission}
                      onFileSelect={handleFileSelect}
                      onTakePhoto={camera.startCamera}
                      preview={preview}
                    />
                </Paper>
              </Grid>

              {/* Botón de Acción */}
              <Grid item xs={12} sx={{ width: '100%', p: '0 !important', mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  disabled={loading || !!existingBobina || !isFormValid}
                  fullWidth
                  sx={{ 
                      height: '45px', 
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: '8px',
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                      }
                  }}
                >
                  {loading ? 'Procesando...' : isEdit ? 'Guardar Cambios' : 'Registrar Bobina'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BobinaForm;