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
  const [liderAutorizado, setLiderAutorizado] = useState(null);

  const loadBobina = useCallback(async () => {
    try {
      const response = await bobinaService.getById(id);
      const bobina = response.data;
      setFormData({
        hu: bobina.hu,
        cliente: bobina.cliente || '',
        foto: null
      });
      setPreview(bobina.foto_url);
    } catch (error) {
      setError('Error al cargar la bobina: ' + (error.response?.data?.message || error.message));
    }
  }, [id]);

  const loadClientes = useCallback(async () => {
    try {
      const response = await bobinaService.getClientes();
      setClientes(response.data);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  }, []);

  const saveLastUsedCliente = (cliente) => {
    if (cliente && cliente.trim()) {
      localStorage.setItem('lastUsedCliente', cliente.trim());
      setLastUsedCliente(cliente.trim());
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const response = await bobinaService.verificarAutorizacionLider(credencialesLider);
      setLiderAutorizado(response.data.lider);
      await ejecutarReemplazo();
    } catch (error) {
      setError('Error en la autorización: ' + (error.response?.data?.error || 'Credenciales incorrectas'));
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
      setLiderAutorizado(null);

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

    // Validaciones básicas
    if (!formData.hu || !/^[0-9]{9}$/.test(formData.hu)) {
      setError('El HU debe tener exactamente 9 dígitos');
      setLoading(false);
      return;
    }

    if (!formData.cliente.trim()) {
      setError('El campo cliente es requerido');
      setLoading(false);
      return;
    }

    if (!isEdit && !formData.foto) {
      setError('Debe subir una fotografía de la bobina');
      setLoading(false);
      return;
    }

    try {
      if (isEdit) {
        // Para edición
        const updateData = {
          hu: formData.hu,
          cliente: formData.cliente,
          foto: formData.foto
        };

        await bobinaService.update(id, updateData);
        setSuccess('Bobina actualizada correctamente');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        // Para creación
        const formDataToSend = new FormData();
        formDataToSend.append('hu', formData.hu);
        formDataToSend.append('cliente', formData.cliente || '');
        
        if (formData.foto instanceof File) {
          formDataToSend.append('foto', formData.foto);
        }

        try {
          await bobinaService.create(formDataToSend);
          
          saveLastUsedCliente(formData.cliente);
          setHasMadeFirstRegistration(true);
          
          setSuccess('Bobina registrada correctamente');
          
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } catch (error) {
          if (error.response?.status === 409) {
            setExistingBobina(error.response.data.bobina_existente);
            setConfirmReplacementDialog(true);
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
      } else if (error.response?.data?.errors?.hu) {
        setError(`Error en el HU: ${error.response.data.errors.hu[0]}`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Error al procesar la solicitud: ' + (error.message || 'Error desconocido'));
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
        cliente: hasMadeFirstRegistration ? lastUsedCliente : '', // 🔥 Mantener cliente guardado
        foto: null
      });
      setPreview(null);
      setError('');
      setSuccess('');
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
    }
  }, [isEdit, id, user?.role, loadBobina, loadClientes]);

  useEffect(() => {
    if (hasMadeFirstRegistration) {
      localStorage.setItem('hasMadeFirstRegistration', 'true');
    } else {
      localStorage.removeItem('hasMadeFirstRegistration');
      localStorage.removeItem('lastUsedCliente');
    }
  }, [hasMadeFirstRegistration]);

  useEffect(() => {
    if (user && !isEdit) {
      setHasMadeFirstRegistration(false);
      setLastUsedCliente('');
      setFormData(prev => ({
        ...prev,
        cliente: ''
      }));
    }
  }, [user, isEdit]);

  // Limpiar estados al desmontar
  useEffect(() => {
    return () => {
      setError('');
      setSuccess('');
      setExistingBobina(null);
      setConfirmReplacementDialog(false);
      setAutorizacionDialog(false);
      setCredencialesLider({ username: '', password: '' });
      setLiderAutorizado(null);
    };
  }, []);

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
    liderAutorizado,

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
    setPreview,
    setFormData,

    // Utilidades
    isFormValid,
    navigate,
  };
};