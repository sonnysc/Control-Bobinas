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
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: `240px` }
        }}
      >
        {/* Espacio para el header fijo */}
        <Box sx={{ mt: 8 }} />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;