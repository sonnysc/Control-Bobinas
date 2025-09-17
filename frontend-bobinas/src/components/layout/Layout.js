// src/components/layout/Layout.js
import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuToggle={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} onMobileToggle={handleDrawerToggle} />
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: '100%', // Ancho completo siempre
          ml: 0, // Sin margen izquierdo
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center' // Centrar contenido horizontalmente
        }}
      >
        {/* Espacio para el header fijo */}
        <Box sx={{ mt: 8, width: '100%', maxWidth: '1200px' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;