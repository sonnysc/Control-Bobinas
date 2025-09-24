// src/components/bobinas/BobinaForm.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  QrCodeScanner as QrCodeScannerIcon,
  CameraAlt as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Close as CloseIcon,
  FlipCameraIos as FlipCameraIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { bobinaService } from '../../services/bobinas';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { BrowserMultiFormatReader } from "@zxing/library";

const BobinaForm = () => {
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
  const [autorizacionDialog, setAutorizacionDialog] = useState(false);
  const [credencialesLider, setCredencialesLider] = useState({
    username: '',
    password: ''
  });
  const [autorizando, setAutorizando] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [qrError, setQrError] = useState('');
  const [cameraPermission, setCameraPermission] = useState(false);
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');

  const videoRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const fileInputRef = useRef(null);
  const codeReaderRef = useRef(null);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    return () => { };
  }, []);

  // Verificar permisos de cámara
  const checkCameraPermission = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setCameraPermission(true);
          return true;
        } catch (error) {
          console.warn('Cámara no accesible:', error);
          setCameraPermission(false);
          return false;
        }
      }
      setCameraPermission(false);
      return false;
    } catch (error) {
      console.warn('Error checking camera permission:', error);
      setCameraPermission(false);
      return false;
    }
  };

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

  const [confirmReplacementDialog, setConfirmReplacementDialog] = useState(false);
  const [lastUsedCliente, setLastUsedCliente] = useState('');

  // Estilos consistentes para modales
  const modalStyles = {
    paper: {
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      overflow: 'hidden'
    },
    header: {
      backgroundColor: '#2196f3',
      color: 'white',
      textAlign: 'center',
      py: 3,
      fontSize: '1.2rem',
      fontWeight: 600,
      position: 'relative'
    },
    closeButton: {
      position: 'absolute',
      right: 8,
      top: 8,
      color: 'white',
      backgroundColor: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.2)',
        transform: 'scale(1.1)'
      },
      transition: 'all 0.2s ease'
    },
    button: {
      borderRadius: '8px',
      px: 3,
      py: 1,
      fontWeight: 600
    }
  };


  useEffect(() => {
    if (user?.role === ROLES.ADMIN || user?.role === ROLES.INGENIERO) {
      loadClientes();
    }
    if (isEdit && user?.role === ROLES.ADMIN) {
      loadBobina();
    }

    checkCameraPermission();

    const savedCliente = localStorage.getItem('lastUsedCliente');
    if (savedCliente && !isEdit) {
      setFormData(prev => ({ ...prev, cliente: savedCliente }));
      setLastUsedCliente(savedCliente);
    }

    return () => {
      stopScanner();
      stopCamera();
    };
  }, [isEdit, id, user?.role, loadBobina]);

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

    // Guardar cliente cuando cambie
    if (name === 'cliente' && value.trim()) {
      saveLastUsedCliente(value);
    }
  };

  // Función para verificar el aspect ratio
  const verifyAspectRatio = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const targetAspect = 1 / 1; // 1:1
        const isCorrectAspect = Math.abs(aspect - targetAspect) < 0.1;
        resolve(isCorrectAspect);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file, fromCamera = false) => {
    if (!file) return;

    setProcessingImage(true);
    setError('');

    try {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Por favor, seleccione un archivo de imagen válido (JPG, PNG, GIF, WEBP)');
      }

      // Validar tamaño de archivo
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no debe superar los 5MB');
      }

      // Para fotos de cámara, verificar aspect ratio
      if (fromCamera) {
        const hasCorrectAspect = await verifyAspectRatio(file);
        if (!hasCorrectAspect) {
          console.warn('La foto no tiene el aspect ratio 1:1 esperado');
        }
      }

      setFormData(prev => ({ ...prev, foto: file }));

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);

    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingImage(false);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0], false);
    }
    e.target.value = '';
  };

  // Función para cambiar entre cámaras frontal y trasera
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    stopCamera();
    setTimeout(startCamera, 100);
  };

  // Función para iniciar la cámara
  const startCamera = async () => {
    try {
      setCameraError('');
      setCameraDialogOpen(true);

      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 960 },
              height: { ideal: 960 }
            },
            audio: false
          });

          setCameraStream(stream);
          if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = stream;
            cameraVideoRef.current.onloadedmetadata = () => {
              cameraVideoRef.current.play().catch(e => {
                console.error('Error al reproducir video:', e);
              });
            };
          }
        } catch (error) {
          console.error('Error al acceder a la cámara:', error);
          setCameraError('No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios.');
          setCameraDialogOpen(false);
        }
      }, 100);

    } catch (error) {
      console.error('Error al iniciar cámara:', error);
      setCameraError('Error al iniciar la cámara');
      setCameraDialogOpen(false);
    }
  };

  // Función para detener la cámara
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
    }
    setCameraDialogOpen(false);
    setCameraError('');
  };

  // Función para tomar foto con aspecto 1:1
  const takePhoto = () => {
    if (!cameraVideoRef.current || !cameraStream) {
      setCameraError('La cámara no está lista');
      return;
    }

    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');

    // Tamaño fijo para la foto final: 600x600 (1:1)
    const targetWidth = 600;
    const targetHeight = 600;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');

    // Calcular el aspect ratio del video
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = 1; // 1:1

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;

    // Ajustar el recorte para mantener el aspect ratio 1:1
    if (videoAspect > targetAspect) {
      // El video es más ancho que 1:1, recortar los lados
      sourceHeight = video.videoHeight;
      sourceWidth = sourceHeight * targetAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
      // El video es más alto que 1:1, recortar arriba y abajo
      sourceWidth = video.videoWidth;
      sourceHeight = sourceWidth / targetAspect;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Dibujar la imagen recortada y redimensionada
    ctx.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, targetWidth, targetHeight
    );

    // Convertir a blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `bobina-${formData.hu || 'foto'}-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        handleFileSelect(file, true);
        stopCamera();
      } else {
        setCameraError('Error al capturar la foto');
      }
    }, 'image/jpeg', 0.85); // Calidad del 85%
  };

  const openUploadMenu = (event) => {
    setUploadMenuAnchor(event.currentTarget);
  };

  const closeUploadMenu = () => {
    setUploadMenuAnchor(null);
  };

  const handleTakePhoto = () => {
    closeUploadMenu();
    startCamera();
  };

  const handleChooseFromLibrary = () => {
    closeUploadMenu();
    fileInputRef.current?.click();
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

      // Guardar cliente usado
      saveLastUsedCliente(formData.cliente);

      if (formData.foto instanceof File) {
        formDataToSend.append('foto', formData.foto);
      }

      await bobinaService.create(formDataToSend);

      setSuccess('Bobina reemplazada correctamente con autorización de líder');
      setAutorizacionDialog(false);
      setExistingBobina(null);
      setCredencialesLider({ username: '', password: '' });

      // Mantener el cliente para la siguiente bobina
      const clienteUsado = formData.cliente;
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

      // Guardar cliente usado
      saveLastUsedCliente(formData.cliente);

      if (isEdit) {
        formDataToSend.append('_method', 'PUT');
      }

      if (formData.foto instanceof File) {
        formDataToSend.append('foto', formData.foto);
      }

      if (isEdit) {
        await bobinaService.update(id, formDataToSend);
        setSuccess('Bobina actualizada correctamente');
      } else {
        try {
          await bobinaService.create(formDataToSend);
          setSuccess('Bobina registrada correctamente');
          setTimeout(() => navigate('/'), 1500);
        } catch (error) {
          if (error.response?.status === 422 || error.response?.status === 409) {
            const errorData = error.response.data;
            if (errorData.errors?.hu || errorData.exists) {
              try {
                const response = await bobinaService.getAll({ search: formData.hu });
                if (response.data.data.length > 0) {
                  const bobinaExistente = response.data.data[0];
                  setExistingBobina(bobinaExistente);
                  // MOSTRAR MODAL DE CONFIRMACIÓN EN LUGAR DE AUTORIZACIÓN DIRECTA
                  setConfirmReplacementDialog(true);
                } else {
                  setError('Bobina encontrada pero no se pudo obtener información completa');
                }
              } catch (searchError) {
                setError('Error al buscar la bobina existente');
              }
            } else {
              setError(errorData.message || 'Error de validación');
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
      } else if (error.message.includes('Network Error')) {
        setError('Error de conexión. Verifique su internet');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Error de conexión. Verifique su conexión a internet');
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
      // Mantener el cliente seleccionado
      cliente: lastUsedCliente || prev.cliente
    }));
  };

  const resetFormKeepingClient = () => {
    const clienteActual = formData.cliente || lastUsedCliente;
    setFormData({
      hu: '',
      cliente: clienteActual,
      foto: null
    });
    setPreview(null);
    setError('');
    setSuccess('');
  };

  const handleReplace = () => {
    setAutorizacionDialog(true);
  };

  const handleCancelReplace = () => {
    setExistingBobina(null);
    setFormData(prev => ({ ...prev, hu: '' }));
  };

  const handleCredencialesChange = (e) => {
    const { name, value } = e.target;
    setCredencialesLider(prev => ({ ...prev, [name]: value }));
  };

  const startScanner = async () => {
    setScanning(true);
    setQrError('');

    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');

      if (videoDevices.length === 0) {
        setQrError('No se encontró ninguna cámara');
        setScanning(false);
        return;
      }

      const backCamera =
        videoDevices.find(d => d.label.toLowerCase().includes('back')) ||
        videoDevices[0];

      codeReader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const scannedValue = result.getText().trim();
            console.log('Código detectado:', scannedValue);

            if (/^[0-9]{9}$/.test(scannedValue)) {
              setFormData(prev => ({ ...prev, hu: scannedValue }));
              stopScanner();
            } else {
              setQrError('El código debe contener exactamente 9 dígitos');
            }
          }
          if (err && !(err.name === 'NotFoundException')) {
            console.warn('Error de escaneo:', err);
          }
        }
      );
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      setQrError('No se pudo acceder a la cámara: ' + error.message);
      setScanning(false);
    }
  };

  const stopScanner = () => {
    setScanning(false);
    setQrError('');

    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (e) {
        console.warn('Error al resetear el lector:', e);
      }
      codeReaderRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const isFormValid =
    /^[0-9]{9}$/.test(formData.hu) &&
    formData.cliente.trim() !== '' &&
    (isEdit || formData.foto !== null);

  if (isEdit && user?.role !== ROLES.ADMIN) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
          Volver
        </Button>
        <Alert severity="error">No tienes permisos para editar bobinas</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {(user?.role !== ROLES.EMBARCADOR || isEdit) && (
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
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
          {qrError && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setQrError('')}>{qrError}</Alert>}

          {/* Diálogo de cámara para tomar foto */}
          <Dialog
            open={cameraDialogOpen}
            onClose={stopCamera}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              sx: {
                backgroundColor: '#000',
                overflow: 'hidden',
                borderRadius: isMobile ? 0 : '20px',
                maxWidth: isMobile ? '100%' : '450px',
                maxHeight: isMobile ? '100%' : '90vh',
                margin: isMobile ? 0 : 'auto'
              }
            }}
          >
            {/* Header mejorado */}
            <DialogTitle sx={{
              color: 'white',
              textAlign: 'center',
              py: 2,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              zIndex: 10
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                📸 Fotografía de Bobina
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                Centra la bobina en el marco cuadrado
              </Typography>

              {/* Botón de cerrar elegante */}
              <IconButton
                onClick={stopCamera}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{
              p: 0,
              position: 'relative',
              minHeight: isMobile ? 'calc(100vh - 140px)' : '500px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#000'
            }}>
              {cameraError ? (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: 'white',
                  flexDirection: 'column',
                  padding: 3,
                  textAlign: 'center'
                }}>
                  <Box sx={{
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    border: '2px solid rgba(244, 67, 54, 0.3)',
                    borderRadius: '16px',
                    padding: 3,
                    maxWidth: '300px'
                  }}>
                    <Typography variant="h6" sx={{ color: '#f44336', mb: 2 }}>
                      ⚠️ Error de Cámara
                    </Typography>
                    <Typography color="rgba(255,255,255,0.8)" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {cameraError}
                    </Typography>
                    <Button
                      onClick={stopCamera}
                      variant="contained"
                      sx={{
                        backgroundColor: '#f44336',
                        '&:hover': { backgroundColor: '#d32f2f' },
                        borderRadius: '12px',
                        px: 3
                      }}
                    >
                      Cerrar
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  {/* Marco de guía 1:1 ultra mejorado */}
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isMobile ? '280px' : '320px',
                    height: isMobile ? '280px' : '320px',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}>
                    {/* Overlay oscuro */}
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '150vw',
                      height: '150vh',
                      background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 41%)',
                      borderRadius: '20px'
                    }} />

                    {/* Marco principal */}
                    <Box sx={{
                      width: '100%',
                      height: '100%',
                      border: '3px solid #fff',
                      borderRadius: '16px',
                      position: 'relative',
                      boxShadow: '0 0 20px rgba(255,255,255,0.3)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 'calc(100% - 40px)',
                        height: 'calc(100% - 40px)',
                        border: '2px dashed rgba(255,255,255,0.6)',
                        borderRadius: '12px'
                      }
                    }}>
                      {/* Esquinas decorativas */}
                      {[
                        { top: -8, left: -8 },
                        { top: -8, right: -8 },
                        { bottom: -8, left: -8 },
                        { bottom: -8, right: -8 }
                      ].map((pos, i) => (
                        <Box key={i} sx={{
                          position: 'absolute',
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          ...pos
                        }} />
                      ))}
                    </Box>

                    {/* Indicador de enfoque animado */}
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '24px',
                      height: '24px',
                      border: '2px solid #4CAF50',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': {
                          opacity: 1,
                          transform: 'translate(-50%, -50%) scale(1)'
                        },
                        '50%': {
                          opacity: 0.5,
                          transform: 'translate(-50%, -50%) scale(1.2)'
                        },
                        '100%': {
                          opacity: 1,
                          transform: 'translate(-50%, -50%) scale(1)'
                        }
                      }
                    }} />
                  </Box>

                  {/* Video de la cámara */}
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      minHeight: isMobile ? 'calc(100vh - 200px)' : '500px'
                    }}
                  />

                  {/* Instrucciones flotantes mejoradas */}
                  <Box sx={{
                    position: 'absolute',
                    top: isMobile ? 80 : 90,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px 20px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    maxWidth: '90%',
                    zIndex: 5
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
                      🎯 Centra la bobina dentro del marco
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: 'rgba(255,255,255,0.8)',
                      display: 'block',
                      mt: 0.5
                    }}>
                      Asegúrate de que esté bien iluminada
                    </Typography>
                  </Box>

                  {/* Panel de controles rediseñado */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.95) 100%)',
                    backdropFilter: 'blur(20px)',
                    padding: isMobile ? '30px 20px 40px' : '30px 20px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 4,
                    minHeight: isMobile ? '140px' : '120px'
                  }}>
                    {/* Botón principal de captura */}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      {/* Anillo exterior animado */}
                      <Box sx={{
                        position: 'absolute',
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.3)',
                        animation: 'rotate 10s linear infinite',
                        '@keyframes rotate': {
                          from: { transform: 'rotate(0deg)' },
                          to: { transform: 'rotate(360deg)' }
                        }
                      }} />

                      {/* Botón de captura */}
                      <IconButton
                        onClick={takePhoto}
                        sx={{
                          width: 72,
                          height: 72,
                          backgroundColor: '#fff',
                          color: '#000',
                          boxShadow: '0 4px 20px rgba(255,255,255,0.3), inset 0 2px 4px rgba(0,0,0,0.1)',
                          border: '4px solid rgba(255,255,255,0.9)',
                          zIndex: 2,
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                            transform: 'scale(1.1)',
                            boxShadow: '0 6px 25px rgba(255,255,255,0.4)'
                          },
                          '&:active': {
                            transform: 'scale(0.95)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <CameraIcon sx={{ fontSize: 32 }} />
                      </IconButton>
                    </Box>

                    {/* Información adicional */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" sx={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '12px'
                      }}>
                        Toca el círculo blanco para capturar
                      </Typography>
                    </Box>
                  </Box>

                  {/* Indicadores de estado */}
                  <Box sx={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    display: 'flex',
                    gap: 1,
                    zIndex: 5
                  }}>
                    {/* Indicador de cámara activa */}
                    <Box sx={{
                      backgroundColor: 'rgba(76, 175, 80, 0.9)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <Box sx={{
                        width: 8,
                        height: 8,
                        backgroundColor: '#4CAF50',
                        borderRadius: '50%',
                        animation: 'blink 1.5s infinite',
                        '@keyframes blink': {
                          '0%, 50%': { opacity: 1 },
                          '51%, 100%': { opacity: 0.3 }
                        }
                      }} />
                      CÁMARA ACTIVA
                    </Box>
                  </Box>

                  {/* Indicador de formato 1:1 */}
                  <Box sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    backgroundColor: 'rgba(33, 150, 243, 0.9)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    zIndex: 5
                  }}>
                  </Box>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal de Confirmación de Reemplazo */}
          <Dialog
            open={confirmReplacementDialog}
            onClose={handleCancelReplacement}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
              }
            }}
          >
            <DialogTitle sx={{
              backgroundColor: '#ff9800',
              color: 'white',
              textAlign: 'center',
              py: 3,
              fontSize: '1.2rem',
              fontWeight: 600
            }}>
              ⚠️ Bobina ya Registrada
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>HU {formData.hu}</strong> ya está registrada en el sistema.
                </Typography>
              </Alert>

              {existingBobina && (
                <Box sx={{
                  backgroundColor: '#f5f5f5',
                  padding: 2,
                  borderRadius: '8px',
                  mb: 3
                }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Información actual:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Cliente:</strong> {existingBobina.cliente || 'No especificado'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Registrada:</strong> {new Date(existingBobina.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Por:</strong> {existingBobina.user?.name || 'Usuario desconocido'}
                  </Typography>
                </Box>
              )}

              <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                ¿Desea <strong>reemplazar</strong> esta bobina con la nueva información?
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Nota:</strong> Para reemplazar una bobina existente se requiere autorización de un líder.
                </Typography>
              </Alert>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button
                onClick={handleCancelReplacement}
                variant="outlined"
                sx={{
                  borderRadius: '8px',
                  px: 3,
                  py: 1
                }}
              >
                ✕ Cancelar
              </Button>

              <Button
                onClick={handleConfirmReplacement}
                variant="contained"
                color="warning"
                sx={{
                  borderRadius: '8px',
                  px: 3,
                  py: 1,
                  fontWeight: 600
                }}
              >
                🔄 Sí, Reemplazar
              </Button>
            </DialogActions>
          </Dialog>


          <Dialog
            open={autorizacionDialog}
            onClose={() => setAutorizacionDialog(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                overflow: 'hidden'
              }
            }}
          >
            {/* Header consistente */}
            <DialogTitle sx={{
              backgroundColor: '#2196f3',
              color: 'white',
              textAlign: 'center',
              py: 3,
              fontSize: '1.2rem',
              fontWeight: 600,
              position: 'relative'
            }}>
              🔐 Autorización Requerida
              <IconButton
                onClick={() => {
                  setAutorizacionDialog(false);
                  setCredencialesLider({ username: '', password: '' });
                }}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: 4 }}>
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  borderRadius: '12px',
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="body1" gutterBottom>
                  Para reemplazar una bobina existente, se requiere la autorización de un líder.
                </Typography>
              </Alert>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Credenciales del Líder:
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Usuario"
                name="username"
                value={credencialesLider.username}
                onChange={handleCredencialesChange}
                margin="normal"
                required
                sx={{ mb: 2 }}
                InputProps={{
                  sx: { borderRadius: '8px' }
                }}
              />
              <TextField
                fullWidth
                label="Contraseña"
                name="password"
                type="password"
                value={credencialesLider.password}
                onChange={handleCredencialesChange}
                margin="normal"
                required
                InputProps={{
                  sx: { borderRadius: '8px' }
                }}
              />
            </DialogContent>

            <DialogActions sx={{
              p: 3,
              gap: 2,
              backgroundColor: '#f8f9fa'
            }}>
              <Button
                onClick={() => {
                  setAutorizacionDialog(false);
                  setCredencialesLider({ username: '', password: '' });
                }}
                variant="outlined"
                sx={{
                  borderRadius: '8px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  borderColor: '#ddd',
                  color: '#666'
                }}
              >
                ✕ Cancelar
              </Button>
              <Button
                onClick={verificarLider}
                variant="contained"
                disabled={autorizando || !credencialesLider.username || !credencialesLider.password}
                sx={{
                  borderRadius: '8px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  backgroundColor: '#2196f3',
                  '&:hover': {
                    backgroundColor: '#1976d2'
                  }
                }}
              >
                {autorizando ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                    Verificando...
                  </Box>
                ) : (
                  '🔓 Autorizar'
                )}
              </Button>
            </DialogActions>
          </Dialog>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Campo HU con escáner QR */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <TextField
                    label="HU"
                    name="hu"
                    value={formData.hu}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    inputProps={{
                      pattern: "^[0-9]{9}$",
                      title: "El HU debe tener exactamente 9 dígitos"
                    }}
                    error={formData.hu && !/^[0-9]{9}$/.test(formData.hu)}
                    helperText={formData.hu && !/^[0-9]{9}$/.test(formData.hu) ? "El HU debe tener exactamente 9 dígitos" : ""}
                  />

                  <IconButton
                    onClick={scanning ? stopScanner : startScanner}
                    color={scanning ? "secondary" : "primary"}
                    disabled={!cameraPermission}
                    title={scanning ? "Detener escáner" : "Iniciar escáner"}
                    sx={{ mt: 1 }}
                  >
                    <QrCodeScannerIcon />
                  </IconButton>
                </Box>

                {!cameraPermission && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                    ⚠️ La cámara no está disponible. Asegúrate de usar HTTPS.
                  </Typography>
                )}

                {scanning && (
                  <Box mt={2}>
                    <video
                      ref={videoRef}
                      style={{
                        width: "100%",
                        maxHeight: "300px",
                        borderRadius: "8px",
                        border: '2px solid #1976d2'
                      }}
                      autoPlay
                      muted
                      playsInline
                    />
                    <Typography variant="body2" color="textSecondary" align="center" mt={1}>
                      Escanea el código QR o de barras. Enfoca el código dentro del marco.
                    </Typography>
                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={stopScanner}
                        size="small"
                      >
                        Cancelar escaneo
                      </Button>
                    </Box>
                  </Box>
                )}
              </Grid>

              {/* Campo Cliente */}
              <Grid item xs={12} md={6}>
                {user?.role === ROLES.EMBARCADOR ? (
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
                ) : (
                  <FormControl fullWidth required>
                    <InputLabel
                      id="cliente-label"
                      shrink={true}
                      sx={{ backgroundColor: 'white', paddingX: '4px' }}
                    >
                      Cliente
                    </InputLabel>
                    <Select
                      labelId="cliente-label"
                      id="cliente"
                      name="cliente"
                      value={formData.cliente}
                      label="Cliente"
                      onChange={handleInputChange}
                      displayEmpty
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 250,
                            minWidth: 250,
                            maxWidth: 400
                          }
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>Seleccionar cliente</em>
                      </MenuItem>
                      {clientes.map(cliente => (
                        <MenuItem
                          key={cliente}
                          value={cliente}
                          sx={{
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            fontSize: '14px',
                            lineHeight: '1.4',
                            paddingY: '8px'
                          }}
                          title={cliente}
                        >
                          {cliente}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>

              {/* Botón de subir foto */}
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  onClick={isMobile ? openUploadMenu : () => fileInputRef.current?.click()}
                  disabled={processingImage}
                  sx={{
                    height: '56px',
                    py: '12px',
                    borderColor: formData.foto ? 'success.main' : 'primary.main',
                    color: formData.foto ? 'success.main' : 'primary.main'
                  }}
                  color={formData.foto ? 'success' : 'primary'}
                >
                  {processingImage ? 'Procesando...' : formData.foto ? '✓ Fotografía Lista' : 'Subir Fotografía'}
                </Button>

                {/* Menú para móviles */}
                <Menu
                  anchorEl={uploadMenuAnchor}
                  open={Boolean(uploadMenuAnchor)}
                  onClose={closeUploadMenu}
                >
                  <MenuItem onClick={handleTakePhoto} disabled={processingImage || !cameraPermission}>
                    <CameraIcon sx={{ mr: 1 }} /> Tomar foto
                  </MenuItem>
                  <MenuItem onClick={handleChooseFromLibrary} disabled={processingImage}>
                    <PhotoLibraryIcon sx={{ mr: 1 }} /> Elegir de galería
                  </MenuItem>
                </Menu>

                {/* Input oculto para galería */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />

                {formData.foto && (
                  <Typography variant="caption" sx={{ ml: 1, mt: 1, display: 'block', color: 'success.main' }}>
                    ✓ Archivo: {formData.foto.name} ({(formData.foto.size / 1024 / 1024).toFixed(2)} MB)
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
              </Grid>

              {preview && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>Vista Previa (1:1)</Typography>
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
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading || !!existingBobina || !isFormValid || processingImage}
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
    </Box >
  );
};

export default BobinaForm;