// src/components/users/UserList.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  InputAdornment,
  Pagination,
  Divider,
  Snackbar, // ✅ Agregado
  Alert     // ✅ Agregado
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
  AdminPanelSettings,
  Engineering,
  LocalShipping,
  SupervisorAccount,
  Group as GroupIcon,
  Lock as LockIcon,
  PersonAdd,
  Warning as WarningIcon,
  DeleteForever
} from '@mui/icons-material';
import { userService } from '../../services/users';
import { ROLES, ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, perPage: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: '' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // ✅ Nuevo estado para las notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const ROLE_SECTION_TITLES = {
    [ROLES.ADMIN]: 'Administradores',
    [ROLES.INGENIERO]: 'Ingenieros',
    [ROLES.LIDER]: 'Líderes',
    [ROLES.EMBARCADOR]: 'Embarcadores'
  };

  const loadUsers = useCallback(async () => {
    try {
      const params = { page: pagination.page, search: searchTerm };
      const response = await userService.getAll(params);
      setUsers(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        perPage: response.data.per_page
      }));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      // Opcional: mostrar error al cargar
    }
  }, [pagination.page, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpen = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, password: '', role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '', role: '' });
    }
    setOpenForm(true);
  };

  const handleClose = () => setOpenForm(false);

  // ✅ Función para cerrar notificaciones
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const dataToSend = { ...formData };
        if (!dataToSend.password) delete dataToSend.password;
        await userService.update(editingUser.id, dataToSend);
        // ✅ Notificación de éxito al editar
        setSnackbar({ open: true, message: 'Usuario actualizado correctamente', severity: 'success' });
      } else {
        await userService.create(formData);
        // ✅ Notificación de éxito al crear
        setSnackbar({ open: true, message: 'Usuario creado correctamente', severity: 'success' });
      }
      handleClose();
      loadUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      // ✅ Notificación de error
      setSnackbar({ open: true, message: 'Error al guardar usuario. Verifique los datos.', severity: 'error' });
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialog(false);
    setTimeout(() => setUserToDelete(null), 150);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await userService.delete(userToDelete.id);
        // ✅ Notificación de éxito al eliminar
        setSnackbar({ open: true, message: 'Usuario eliminado correctamente', severity: 'success' });
        loadUsers();
        handleDeleteClose();
      } catch (error) {
        console.error('Error al eliminar:', error);
        // ✅ Notificación de error
        setSnackbar({ open: true, message: 'Error al eliminar usuario. Verifique permisos.', severity: 'error' });
      }
    }
  };

  const usersByRole = users.reduce((groups, user) => {
    const role = user.role;
    if (!groups[role]) {
        groups[role] = [];
    }
    groups[role].push(user);
    return groups;
  }, {});

  const getRoleIcon = (role) => {
      switch(role) {
          case ROLES.ADMIN: return <AdminPanelSettings fontSize="small" />;
          case ROLES.INGENIERO: return <Engineering fontSize="small" />;
          case ROLES.EMBARCADOR: return <LocalShipping fontSize="small" />;
          case ROLES.LIDER: return <SupervisorAccount fontSize="small" />;
          default: return <PersonIcon fontSize="small" />;
      }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', pb: 4 }}>
      <Box sx={{ mb: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1565c0', display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon fontSize="large" /> Gestión de Usuarios
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3, height: '40px' }}
            >
              Nuevo Usuario
            </Button>
          </Box>

          {/* Buscador */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: '12px', border: '1px solid #eef0f2', mb: 1 }}>
            <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nombre de usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                    sx: { bgcolor: 'white', borderRadius: '8px' }
                }}
            />
          </Paper>
      </Box>

      {/* Grid de Usuarios Clasificados por Rol */}
      {users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
             <Typography variant="h6">No se encontraron usuarios</Typography>
          </Box>
      ) : (
        [ROLES.ADMIN, ROLES.INGENIERO, ROLES.LIDER, ROLES.EMBARCADOR].map(role => {
            const roleUsers = usersByRole[role];
            if (!roleUsers || roleUsers.length === 0) return null;

            return (
                <Box key={role} sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                        <Avatar sx={{ bgcolor: `${ROLE_COLORS[role]}.light`, color: `${ROLE_COLORS[role]}.contrastText`, width: 32, height: 32 }}>
                            {getRoleIcon(role)}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" color="text.secondary">
                            {ROLE_SECTION_TITLES[role]}
                        </Typography>
                        <Chip 
                            label={roleUsers.length} 
                            size="small" 
                            color={ROLE_COLORS[role]} 
                            sx={{ fontWeight: 'bold', height: 20 }} 
                        />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                        {roleUsers.map((user) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                                <Card sx={{ 
                                    borderRadius: '16px', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    border: '1px solid #f0f0f0',
                                    borderTop: `4px solid`,
                                    borderTopColor: `${ROLE_COLORS[role]}.main`, 
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
                                }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                                            <Box>
                                                <IconButton 
                                                  size="small" 
                                                  onClick={() => handleOpen(user)} 
                                                  sx={{ 
                                                    color: 'primary.main', 
                                                    bgcolor: '#e3f2fd', 
                                                    mr: 0.5, 
                                                    '&:hover': { bgcolor: '#bbdefb' } 
                                                  }}
                                                  aria-label={`Editar usuario ${user.username}`}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                  size="small" 
                                                  onClick={() => handleDeleteClick(user)} 
                                                  sx={{ 
                                                    color: 'error.main', 
                                                    bgcolor: '#ffebee', 
                                                    '&:hover': { bgcolor: '#ffcdd2' } 
                                                  }}
                                                  aria-label={`Eliminar usuario ${user.username}`}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="h6" fontWeight="bold" noWrap title={user.username}>
                                                {user.username}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                                Creado: {new Date(user.created_at).toLocaleDateString()}
                                            </Typography>
                                            
                                            <Chip 
                                                label={ROLE_LABELS[user.role]} 
                                                size="small" 
                                                variant="outlined"
                                                color={ROLE_COLORS[user.role]}
                                                icon={getRoleIcon(user.role)}
                                                sx={{ width: '100%', justifyContent: 'flex-start', px: 1, fontWeight: 600 }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            );
        })
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination 
            count={Math.ceil(pagination.total / pagination.perPage)} 
            page={pagination.page} 
            onChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))} 
            color="primary"
            shape="rounded"
            size="large"
        />
      </Box>

      {/* MODAL AGREGAR/EDITAR USUARIO */}
      <Dialog 
        open={openForm} 
        onClose={handleClose} 
        maxWidth="xs"
        fullWidth 
        disableRestoreFocus
        PaperProps={{ 
            sx: { 
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
            } 
        }}
      >
        <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
            color: 'white', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            py: 2,
            position: 'relative',
            mb: 2,
            pb: 3,
        }}>
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
          }} />
          
          <Avatar sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            width: 56, 
            height: 56, 
            mb: 0.5, 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 2,
          }}>
             {editingUser ? <EditIcon sx={{ color: 'white' }} /> : <PersonAdd sx={{ color: 'white' }} />}
          </Avatar>
          
          <Box sx={{ 
            fontSize: '1.2rem', 
            fontWeight: 'bold', 
            letterSpacing: 0.5, 
            zIndex: 2,
            lineHeight: 1.2,
            textAlign: 'center'
          }}>
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Box>
          
          <IconButton 
            onClick={handleClose} 
            sx={{ 
                position: 'absolute',
                right: 12,
                top: 12,
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                zIndex: 2,
            }}
            size="small"
            aria-label="Cerrar modal"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 3, pt: 5, mt: 1 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2.5,
                '& > *:first-of-type': { mt: 1.5 }
            }}>
                <TextField
                    label="Nombre de Usuario"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    fullWidth
                    required
                    size="small"
                    variant="outlined"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PersonIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '8px', bgcolor: '#f8f9fa' }
                    }}
                    sx={{
                        '& .MuiInputLabel-root': { backgroundColor: 'white', padding: '0 4px', marginLeft: '-4px' }
                    }}
                />
                
                <TextField
                    select
                    label="Rol Asignado"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    fullWidth
                    required
                    size="small"
                    variant="outlined"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <BadgeIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '8px', bgcolor: '#f8f9fa' }
                    }}
                >
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <MenuItem key={key} value={key} sx={{ py: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getRoleIcon(key)} <Typography variant="body2">{label}</Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    label={editingUser ? "Nueva Contraseña" : "Contraseña"}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    fullWidth
                    required={!editingUser}
                    size="small"
                    variant="outlined"
                    InputProps={{ 
                        startAdornment: (
                            <InputAdornment position="start">
                                <LockIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '8px', bgcolor: '#f8f9fa' } 
                    }}
                    helperText={editingUser ? "Dejar vacío para mantener la actual" : ""}
                />
            </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 4, pt: 0, justifyContent: 'space-between', gap: 1.5 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined" 
            sx={{ 
                flex: 1,
                borderRadius: '8px',
                height: '40px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': { borderColor: '#bdbdbd', bgcolor: '#f5f5f5' }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            sx={{ 
                flex: 1,
                borderRadius: '8px', 
                height: '40px',
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                    boxShadow: '0 4px 12px rgba(21, 101, 192, 0.3)'
                }
            }}
          >
            {editingUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog 
        open={deleteDialog} 
        onClose={handleDeleteClose} 
        maxWidth="xs"
        fullWidth 
        disableRestoreFocus
        PaperProps={{ 
            sx: { 
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
            } 
        }}
      >
        <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', 
            color: 'white', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            py: 2,
            position: 'relative',
            mb: 2,
            pb: 3,
        }}>
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
          }} />
          
          <Avatar sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            width: 56, 
            height: 56, 
            mb: 0.5, 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 2,
          }}>
             <DeleteForever sx={{ color: 'white', fontSize: 30 }} />
          </Avatar>
          
          <Box sx={{ 
            fontSize: '1.2rem', 
            fontWeight: 'bold', 
            letterSpacing: 0.5, 
            zIndex: 2,
            lineHeight: 1.2,
            textAlign: 'center'
          }}>
            Confirmar Eliminación
          </Box>
          
          <IconButton 
            onClick={handleDeleteClose} 
            sx={{ 
                position: 'absolute',
                right: 12,
                top: 12,
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                zIndex: 2,
            }}
            size="small"
            aria-label="Cerrar modal de confirmación"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 3, pt: 5, mt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#333' }}>
                ¿Está seguro de eliminar al usuario?
              </Typography>
              
              {userToDelete && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '10px', border: '1px solid #e0e0e0', width: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" color="#333">
                    {userToDelete.username}
                  </Typography>
                  <Chip 
                    label={ROLE_LABELS[userToDelete.role]} 
                    size="small" 
                    color={ROLE_COLORS[userToDelete.role]}
                    variant="outlined"
                    sx={{ mt: 1, fontWeight: 600 }}
                  />
                </Paper>
              )}
              
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: '10px', border: '1px solid #ffe0b2', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <WarningIcon fontSize="small" sx={{ color: '#ed6c02', mt: 0.2 }} />
                  <Typography variant="caption" sx={{ color: '#ed6c02', textAlign: 'left', lineHeight: 1.3 }}>
                    Esta acción no se puede deshacer. El usuario perderá el acceso inmediatamente.
                  </Typography>
                </Box>
              </Paper>
            </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 4, pt: 0, justifyContent: 'space-between', gap: 1.5 }}>
          <Button 
            onClick={handleDeleteClose} 
            variant="outlined" 
            sx={{ 
                flex: 1,
                borderRadius: '8px',
                height: '40px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': { borderColor: '#bdbdbd', bgcolor: '#f5f5f5' }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            sx={{ 
                flex: 1,
                borderRadius: '8px', 
                height: '40px',
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                '&:hover': {
                    background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
                }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* ✅ Componente Snackbar agregado al final */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserList;