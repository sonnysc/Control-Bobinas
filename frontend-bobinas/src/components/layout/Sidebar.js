// src/components/layout/Sidebar.js
import React from 'react';
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
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  VerifiedUser as VerifiedIcon 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MENU_ITEMS } from '../../utils/constants';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, onMobileToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'DashboardIcon': return <DashboardIcon />;
      case 'AddIcon': return <AddIcon />;
      case 'PeopleIcon': return <PeopleIcon />;
      case 'SettingsIcon': return <SettingsIcon />;
      case 'VerifiedIcon': return <VerifiedIcon />;
      default: return <DashboardIcon />;
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Control Embarcaciones
        </Typography>
      </Toolbar>
      
      <Divider />
      
      <List>
        {MENU_ITEMS
          .filter(item => item.roles.includes(user?.role))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpen) {
                    onMobileToggle();
                  }
                }}
              >
                <ListItemIcon>
                  {getIconComponent(item.icon)}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Drawer móvil */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Drawer desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;