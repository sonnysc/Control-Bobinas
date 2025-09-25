// src/components/hooks/useBobinaForm.js

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bobinaService } from '../../services/bobinas';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

export const useBobinaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    hu: '',
    cliente: '',
    foto: null
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clientes, setClientes] = useState([]);
  const [existingBobina, setExistingBobina] = useState(null);
  const [confirmReplacementDialog, setConfirmReplacementDialog] = useState(false);
  const [autorizacionDialog, setAutorizacionDialog] = useState(false);
  const [credencialesLider, setCredencialesLider] = useState({
    username: '',
    password: ''
  });
  const [autorizando, setAutorizando] = useState(false);
  const [lastUsedCliente, setLastUsedCliente] = useState('');
  const [hasMadeFirstRegistration, setHasMadeFirstRegistration] = useState(false);

  const loadBobina = useCallback(async () => {
    try {
      const response = await bobinaService.getById(id);
      const bobina = response.data;
      setFormData({
        hu: bobina.hu,
        cliente: bobina.cliente || '',
        foto: null
      });
      setPreview(`${process.env.REACT_APP_BACKEND_URL}/storage/${bobina.foto_path}`);
    } catch (error) {
      setError('Error al cargar la bobina');
    }
  }, [id]);

  const loadClientes = async () => {
    try {
      const response = await bobinaService.getClientes();
      setClientes(response.data);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  };

  const saveLastUsedCliente = (cliente) => {
    if (cliente && cliente.trim()) {
      localStorage.setItem('lastUsedCliente', cliente.trim());
      setLastUsedCliente(cliente.trim());
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'cliente' && value.trim()) {
      saveLastUsedCliente(value);
    }
  };

  const handleFileSelect = async (file, fromCamera = false) => {
    if (!file) return;
    setError('');

    try {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Por favor, seleccione un archivo de imagen válido (JPG, PNG, GIF, WEBP)');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no debe superar los 5MB');
      }

      setFormData(prev => ({ ...prev, foto: file }));

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);

    } catch (error) {
      setError(error.message);
    }
  };

  const verificarLider = async () => {
    setAutorizando(true);
    setError('');
    try {
      await ejecutarReemplazo();
    } catch (error) {
      setError('Error en la autorización: ' + (error.response?.data?.message || 'Credenciales incorrectas'));
    } finally {
      setAutorizando(false);
    }
  };

  const ejecutarReemplazo = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('hu', formData.hu);
      formDataToSend.append('cliente', formData.cliente || '');
      formDataToSend.append('lider_username', credencialesLider.username);
      formDataToSend.append('lider_password', credencialesLider.password);
      formDataToSend.append('reemplazado_por', user?.id);

      saveLastUsedCliente(formData.cliente);
      setHasMadeFirstRegistration(true);

      if (formData.foto instanceof File) {
        formDataToSend.append('foto', formData.foto);
      }

      await bobinaService.create(formDataToSend);

      setSuccess('Bobina reemplazada correctamente con autorización de líder');
      setAutorizacionDialog(false);
      setExistingBobina(null);
      setCredencialesLider({ username: '', password: '' });

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      setError('Error al reemplazar la bobina: ' + (error.response?.data?.message || 'Error del servidor'));
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!isEdit && !formData.foto) {
      setError('Debe subir una fotografía de la bobina');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('hu', formData.hu);
      formDataToSend.append('cliente', formData.cliente || '');
      saveLastUsedCliente(formData.cliente);

      if (isEdit) {
        formDataToSend.append('_method', 'PUT');
        await bobinaService.update(id, formDataToSend);
        setSuccess('Bobina actualizada correctamente');
      } else {
        if (formData.foto instanceof File) {
          formDataToSend.append('foto', formData.foto);
        }

        try {
          await bobinaService.create(formDataToSend);
          setSuccess('Bobina registrada correctamente');
          setHasMadeFirstRegistration(true);
          setTimeout(() => navigate('/'), 1500);
        } catch (error) {
          if (error.response?.status === 422 || error.response?.status === 409) {
            const response = await bobinaService.getAll({ search: formData.hu });
            if (response.data.data.length > 0) {
              const bobinaExistente = response.data.data[0];
              setExistingBobina(bobinaExistente);
              setConfirmReplacementDialog(true);
            } else {
              setError('Bobina encontrada pero no se pudo obtener información completa');
            }
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Error completo:', error);
      if (error.response?.status === 413) {
        setError('La imagen es demasiado grande. Máximo 5MB permitido');
      } else if (error.response?.data?.errors?.foto) {
        setError(`Error en la fotografía: ${error.response.data.errors.foto[0]}`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Error al procesar la solicitud: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReplacement = () => {
    setConfirmReplacementDialog(false);
    setAutorizacionDialog(true);
  };

  const handleCancelReplacement = () => {
    setConfirmReplacementDialog(false);
    setExistingBobina(null);
    setFormData(prev => ({
      ...prev,
      hu: '',
      cliente: hasMadeFirstRegistration ? lastUsedCliente : ''
    }));
  };

  const handleCredencialesChange = (e) => {
    const { name, value } = e.target;
    setCredencialesLider(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = useCallback(() => {
    if (!isEdit) {
      setFormData({
        hu: '',
        cliente: hasMadeFirstRegistration ? lastUsedCliente : '',
        foto: null
      });
      setPreview(null);
    }
  }, [isEdit, hasMadeFirstRegistration, lastUsedCliente]);

  useEffect(() => {
    if (user?.role === ROLES.ADMIN || user?.role === ROLES.INGENIERO) {
      loadClientes();
    }
    if (isEdit && user?.role === ROLES.ADMIN) {
      loadBobina();
    }

    const savedCliente = localStorage.getItem('lastUsedCliente');
    const hasRegistered = localStorage.getItem('hasMadeFirstRegistration');

    if (savedCliente && hasRegistered === 'true' && !isEdit) {
      setFormData(prev => ({ ...prev, cliente: savedCliente }));
      setLastUsedCliente(savedCliente);
      setHasMadeFirstRegistration(true);
    }
  }, [isEdit, id, user?.role, loadBobina]);

  useEffect(() => {
    if (hasMadeFirstRegistration) {
      localStorage.setItem('hasMadeFirstRegistration', 'true');
    }
  }, [hasMadeFirstRegistration]);

  const isFormValid =
    /^[0-9]{9}$/.test(formData.hu) &&
    formData.cliente.trim() !== '' &&
    (isEdit || formData.foto !== null);

  return {
    // Estado
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
    lastUsedCliente,
    hasMadeFirstRegistration,
    isEdit,
    user,

    // Handlers
    handleInputChange,
    handleFileSelect,
    handleSubmit,
    handleConfirmReplacement,
    handleCancelReplacement,
    handleCredencialesChange,
    verificarLider,
    resetForm,

    // Setters
    setError,
    setSuccess,
    setAutorizacionDialog,
    setCredencialesLider,
    setHasMadeFirstRegistration,

    // Utilidades
    isFormValid,
    navigate
  };
};