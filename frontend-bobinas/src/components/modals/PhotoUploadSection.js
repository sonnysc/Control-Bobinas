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
          height: '40px', // ✅ Mismo alto delgado que los inputs
          borderRadius: '8px', // ✅ Bordes redondeados
          textTransform: 'none', // Texto normal para estilo moderno
          fontWeight: 500,
          borderColor: formData.foto ? 'success.main' : 'primary.main',
          color: formData.foto ? 'success.main' : 'primary.main',
          backgroundColor: formData.foto ? 'rgba(46, 125, 50, 0.04)' : 'white',
          '&:hover': {
            borderColor: formData.foto ? 'success.dark' : 'primary.dark',
            backgroundColor: formData.foto ? 'rgba(46, 125, 50, 0.1)' : 'rgba(25, 118, 210, 0.04)',
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
        PaperProps={{
            sx: { borderRadius: '12px', mt: 1, boxShadow: 3 }
        }}
      >
        <MenuItem
          onClick={handleTakePhoto}
          disabled={!isCameraAvailable}
          sx={{ py: 1.5 }}
        >
          <Camera sx={{ mr: 1.5, color: isCameraAvailable ? 'primary.main' : 'text.disabled' }} />
          <Typography>Tomar foto</Typography>
          {!isCameraAvailable && (
            <Typography variant="caption" sx={{ ml: 1, color: 'text.disabled' }}>
              (No disponible)
            </Typography>
          )}
        </MenuItem>

        <MenuItem onClick={handleChooseFromLibrary} sx={{ py: 1.5 }}>
          <PhotoLibrary sx={{ mr: 1.5, color: 'primary.main' }} />
          <Typography>Elegir de galería</Typography>
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
        <Typography variant="caption" sx={{ ml: 1, mt: 1, display: 'block', color: 'success.main', fontWeight: 600 }}>
          Archivo: {formData.foto.name} ({(formData.foto.size / 1024 / 1024).toFixed(2)} MB)
        </Typography>
      )}

      {!formData.foto && !isEdit && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, ml: 1, color: 'error.main' }}>
          * Se requiere fotografía
        </Typography>
      )}

      {/* Preview container */}
      {preview && (
        <Box sx={{ 
            mt: 2, 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center' 
        }}>
          <Box sx={{
            width: '100%',
            maxWidth: '300px',
            height: '200px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
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