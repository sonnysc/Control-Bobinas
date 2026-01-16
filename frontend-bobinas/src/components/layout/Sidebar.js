// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  VerifiedUser as VerifiedIcon,
  Inventory as InventoryIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MENU_ITEMS } from '../../utils/constants';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, onMobileToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  
  // Estado para controlar la expansión del sidebar en escritorio
  // false = contraído (solo iconos), true = expandido (completo)
  const [open, setOpen] = useState(false);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'DashboardIcon': return <DashboardIcon />;
      case 'AddIcon': return <AddIcon />;
      case 'PeopleIcon': return <PeopleIcon />;
      case 'SettingsIcon': return <SettingsIcon />;
      case 'VerifiedIcon': return <VerifiedIcon />;
      case 'InventoryIcon': return <InventoryIcon />;
      default: return <DashboardIcon />;
    }
  };

  // Mixins para las transiciones suaves de CSS
  const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
  });

  const closedMixin = (theme) => ({
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(8)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
      width: `calc(${theme.spacing(9)} + 1px)`,
    },
  });

  const getDrawerContent = (isMobile) => (
    <>
      {/* Encabezado del Sidebar con Botón de Toggle */}
      <Toolbar sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: (open || isMobile) ? 'space-between' : 'center',
          px: [1],
          minHeight: '64px' // Altura estándar del AppBar
      }}>
        {/* Título (visible solo si está abierto o es móvil) */}
        {(open || isMobile) && (
            <Typography variant="subtitle1" noWrap component="div" sx={{ ml: 2, fontWeight: 'bold', fontSize: '0.95rem', color: '#1565c0' }}>
            Control Embarques
            </Typography>
        )}
        
        {/* BOTÓN PARA EXPANDIR/CONTRAER (Solo Desktop) */}
        {!isMobile && (
            <Tooltip title={open ? "Contraer menú" : "Expandir menú"}>
                <IconButton onClick={handleDrawerToggle}>
                    {open ? <ChevronLeftIcon /> : <MenuIcon />}
                </IconButton>
            </Tooltip>
        )}
        
        {/* Botón de cierre para móvil (Opcional, usualmente se cierra tocando fuera) */}
        {isMobile && (
             <IconButton onClick={onMobileToggle}>
                <ChevronLeftIcon />
             </IconButton>
        )}
      </Toolbar>
      
      <Divider />
      
      <List>
        {MENU_ITEMS
          .filter(item => item.roles.includes(user?.role))
          .map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={(!open && !isMobile) ? item.text : ""} placement="right">
                <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => {
                        navigate(item.path);
                        if (isMobile && mobileOpen) {
                            onMobileToggle();
                        }
                    }}
                    sx={{
                        minHeight: 48,
                        justifyContent: (open || isMobile) ? 'initial' : 'center',
                        px: 2.5,
                        transition: 'all 0.2s',
                        '&.Mui-selected': {
                            backgroundColor: 'rgba(21, 101, 192, 0.08)',
                            borderRight: `4px solid ${theme.palette.primary.main}`,
                            '&:hover': {
                                backgroundColor: 'rgba(21, 101, 192, 0.12)',
                            }
                        }
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: (open || isMobile) ? 3 : 'auto',
                            justifyContent: 'center',
                            color: location.pathname === item.path ? 'primary.main' : 'inherit'
                        }}
                    >
                        {getIconComponent(item.icon)}
                    </ListItemIcon>
                    
                    <ListItemText 
                        primary={item.text} 
                        sx={{ 
                            opacity: (open || isMobile) ? 1 : 0,
                            display: (open || isMobile) ? 'block' : 'none',
                            whiteSpace: 'nowrap'
                        }} 
                        primaryTypographyProps={{
                            fontWeight: location.pathname === item.path ? 600 : 400,
                            color: location.pathname === item.path ? 'primary.main' : 'inherit'
                        }}
                    />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
      </List>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ 
          // El ancho del contenedor se ajusta dinámicamente
          width: { sm: open ? drawerWidth : `calc(${theme.spacing(9)} + 1px)` },
          flexShrink: { sm: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
      aria-label="mailbox folders"
    >
      {/* Drawer Móvil (Temporal) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {getDrawerContent(true)}
      </Drawer>
      
      {/* Drawer Desktop (Permanente con animación) */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
              // Aplicación de estilos condicionales (Mixins)
              ...(open && {
                  ...openedMixin(theme),
                  '& .MuiDrawer-paper': openedMixin(theme),
              }),
              ...(!open && {
                  ...closedMixin(theme),
                  '& .MuiDrawer-paper': closedMixin(theme),
              }),
          },
        }}
      >
        {getDrawerContent(false)}
      </Drawer>
    </Box>
  );
};

export default Sidebar;