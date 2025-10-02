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
  TextField
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
    setHasMadeFirstRegistration,
    setFormData,
    setPreview,
    handleConfirmReplacement,
    handleCancelReplacement,
    handleCredencialesChange,
    verificarLider,
    setError,
    setSuccess,
    setAutorizacionDialog,
    setCredencialesLider,
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
              {/* HU */}
              <Grid item xs={12}>
                <ScannerSection
                  formData={formData}
                  onInputChange={handleInputChange}
                  qrError={scanner.qrError}
                  onOpenScannerModal={scanner.openScannerModal}
                />
              </Grid>

              {/* Cliente + Limpiar */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Cliente"
                      name="cliente"
                      value={formData.cliente}
                      onChange={handleInputChange}
                      placeholder="Ingrese el nombre del cliente"
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  {!isEdit && (
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setHasMadeFirstRegistration(false);
                          setFormData({
                            hu: '',
                            cliente: '',
                            foto: null
                          });
                          setPreview(null);
                        }}
                        fullWidth
                        sx={{ height: '56px' }}
                      >
                        Limpiar
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Foto */}
              <Grid item xs={12}>
                <PhotoUploadSection
                  formData={formData}
                  isEdit={isEdit}
                  isMobile={isMobile}
                  cameraPermission={camera.cameraPermission}
                  onFileSelect={handleFileSelect}
                  onTakePhoto={camera.startCamera}
                  preview={preview}
                />
              </Grid>

              {/* Botón Registrar */}
              <Grid item xs={12}>
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
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BobinaForm;
