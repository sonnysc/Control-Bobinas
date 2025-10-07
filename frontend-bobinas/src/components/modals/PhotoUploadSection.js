// src/components/modals/PhotoUploadSection.js

import React, { useRef, useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Typography,
  Box
} from '@mui/material';
import {
  CloudUpload,
  Camera,
  PhotoLibrary
} from '@mui/icons-material';

const PhotoUploadSection = ({
  formData,
  isEdit,
  isMobile,
  cameraPermission,
  onFileSelect,
  onTakePhoto,
  preview
}) => {
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState(null);
  const fileInputRef = useRef(null);

  const openUploadMenu = (event) => {
    setUploadMenuAnchor(event.currentTarget);
  };

  const closeUploadMenu = () => {
    setUploadMenuAnchor(null);
  };

  const handleChooseFromLibrary = () => {
    closeUploadMenu();
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    closeUploadMenu();
    onTakePhoto();
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0], false);
    }
    e.target.value = '';
  };

  const isCameraAvailable = cameraPermission !== 'denied';

  return (
    <Box sx={{ width: '100%' }}>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<CloudUpload />}
        onClick={isMobile ? openUploadMenu : () => fileInputRef.current?.click()}
        sx={{
          height: '56px',
          py: '12px',
          borderColor: formData.foto ? 'success.main' : 'primary.main',
          color: formData.foto ? 'success.main' : 'primary.main',
          '&:hover': {
            borderColor: formData.foto ? 'success.dark' : 'primary.dark',
            backgroundColor: formData.foto ? 'success.light' : 'primary.light',
          }
        }}
        color={formData.foto ? 'success' : 'primary'}
      >
        {formData.foto ? 'Fotografía Lista' : 'Subir Fotografía'}
      </Button>

      <Menu
        anchorEl={uploadMenuAnchor}
        open={Boolean(uploadMenuAnchor)}
        onClose={closeUploadMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem
          onClick={handleTakePhoto}
          disabled={!isCameraAvailable}
          sx={{
            opacity: isCameraAvailable ? 1 : 0.5
          }}
        >
          <Camera sx={{ mr: 1, color: isCameraAvailable ? 'primary.main' : 'text.disabled' }} />
          Tomar foto
          {!isCameraAvailable && (
            <Typography variant="caption" sx={{ ml: 1, color: 'text.disabled' }}>
              (No disponible)
            </Typography>
          )}
        </MenuItem>

        <MenuItem onClick={handleChooseFromLibrary}>
          <PhotoLibrary sx={{ mr: 1, color: 'primary.main' }} />
          Elegir de galería
        </MenuItem>
      </Menu>

      {/* Input oculto para galería */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        capture="environment"
      />

      {formData.foto && (
        <Typography variant="caption" sx={{ ml: 1, mt: 1, display: 'block', color: 'success.main' }}>
          Archivo: {formData.foto.name} ({(formData.foto.size / 1024 / 1024).toFixed(2)} MB)
        </Typography>
      )}

      {!formData.foto && !isEdit && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'error.main' }}>
          * Se requiere fotografía
        </Typography>
      )}

      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
        Formatos: JPG, PNG, GIF, WEBP. Máx: 5MB
      </Typography>

      {isMobile && !isCameraAvailable && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'warning.main' }}>
          ⚠️ Para usar la cámara, permite el acceso en configuración del navegador
        </Typography>
      )}

      {preview && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" gutterBottom>Vista Previa</Typography>
          <Box sx={{
            width: '100%',
            maxWidth: '300px',
            height: '300px',
            margin: '0 auto',
            border: '2px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PhotoUploadSection;
