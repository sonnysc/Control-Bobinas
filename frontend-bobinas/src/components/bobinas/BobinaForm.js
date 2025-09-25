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
  CircularProgress
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { ROLES } from '../../utils/constants';
import { useBobinaForm } from '../hooks/useBobinaForm';
import { useCamera } from '../hooks/useCamera';
import { useScanner } from '../hooks/useScanner';
import CameraModal from '../modals/CameraModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import AuthorizationModal from '../modals/AuthorizationModal';
import ScannerSection from '../modals/ScannerSection';
import PhotoUploadSection from '../modals/PhotoUploadSection';
import FormFields from '../modals/FormFields';
import ScannerModal from '../modals/ScannerModal';

const BobinaForm = () => {
  const [isMobile, setIsMobile] = useState(false);
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
    clientes,
    existingBobina,
    confirmReplacementDialog,
    autorizacionDialog,
    credencialesLider,
    autorizando,
    isEdit,
    user,
    handleInputChange,
    handleFileSelect,
    handleSubmit,
    handleConfirmReplacement,
    handleCancelReplacement,
    handleCredencialesChange,
    verificarLider,
    setError,
    setSuccess,
    setAutorizacionDialog,
    setCredencialesLider,
    resetearEstadoPrimerRegistro,
    isFormValid
  } = bobinaForm;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

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

  return (
    <Box>
      {(user?.role !== ROLES.EMBARCADOR || isEdit) && (
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
          Volver
        </Button>
      )}

      <Card sx={{ maxWidth: '800px', mx: 'auto' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {user?.role === ROLES.EMBARCADOR ? 'Registrar Nueva Bobina' :
              isEdit ? 'Editar Bobina' : 'Registrar Nueva Bobina'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
          {scanner.qrError && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => scanner.setQrError('')}>{scanner.qrError}</Alert>}

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
            onClose={() => {
              setAutorizacionDialog(false);
              setCredencialesLider({ username: '', password: '' });
            }}
            credencialesLider={credencialesLider}
            onCredencialesChange={handleCredencialesChange}
            onAuthorize={verificarLider}
            autorizando={autorizando}
          />

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <ScannerSection
                formData={formData}
                onInputChange={handleInputChange}
                qrError={scanner.qrError}
                onOpenScannerModal={scanner.openScannerModal}
              />

              <FormFields
                formData={formData}
                onInputChange={handleInputChange}
                clientes={clientes}
                userRole={user?.role}
              />

              <PhotoUploadSection
                formData={formData}
                isEdit={isEdit}
                isMobile={isMobile}
                cameraPermission={camera.cameraPermission}
                onFileSelect={handleFileSelect}
                onTakePhoto={camera.startCamera}
                preview={preview}
              />

              <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  disabled={loading || !!existingBobina || !isFormValid}
                  fullWidth
                  size="large"
                  sx={{ py: '12px' }}
                >
                  {loading ? 'Procesando...' : isEdit ? 'Actualizar Bobina' : 'Registrar Bobina'}
                </Button>
                
                {!isEdit && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      resetearEstadoPrimerRegistro();
                      bobinaForm.setFormData({
                        hu: '',
                        cliente: '',
                        material: '',
                        peso: '',
                        espesor: '',
                        ancho: '',
                        od: '',
                        calidad: '',
                        fechaFabricacion: '',
                        observaciones: '',
                        foto: null
                      });
                      bobinaForm.setPreview(null);
                    }}
                    size="large"
                    sx={{ py: '12px', minWidth: '120px' }}
                  >
                    Limpiar
                  </Button>
                )}
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BobinaForm;