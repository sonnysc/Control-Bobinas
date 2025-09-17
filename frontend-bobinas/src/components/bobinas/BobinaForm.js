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
      setPreview(`http://localhost:8000/storage/${bobina.foto_path}`);
    } catch (error) {
      setError('Error al cargar la bobina');
    }
  }, [id]);

  useEffect(() => {
    if (user?.role === ROLES.ADMIN || user?.role === ROLES.INGENIERO) {
      loadClientes();
    }
    if (isEdit && user?.role === ROLES.ADMIN) {
      loadBobina();
    }

    checkCameraPermission();

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
                  setAutorizacionDialog(true);
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

          {existingBobina && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                ¡Esta bobina ya está registrada! ¿Desea reemplazar la información?
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button variant="contained" color="warning" onClick={handleReplace} sx={{ mr: 1 }}>
                  Sí, reemplazar
                </Button>
                <Button variant="outlined" onClick={handleCancelReplace}>
                  Cancelar
                </Button>
              </Box>
            </Alert>
          )}

          {/* Diálogo de cámara para tomar foto */}
          <Dialog
            open={cameraDialogOpen}
            onClose={stopCamera}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                backgroundColor: 'black',
                overflow: 'hidden',
                borderRadius: '16px',
                maxWidth: '400px'
              }
            }}
          >
            <DialogTitle sx={{
              color: 'white',
              textAlign: 'center',
              pb: 1,
              backgroundColor: 'rgba(0,0,0,0.8)',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Typography variant="h6">Tomar Foto de la Bobina</Typography>
            </DialogTitle>
            <DialogContent sx={{
              p: 0,
              position: 'relative',
              minHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {cameraError ? (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '400px',
                  color: 'white',
                  flexDirection: 'column',
                  padding: 2
                }}>
                  <Typography color="error" align="center">{cameraError}</Typography>
                  <Button onClick={stopCamera} sx={{ mt: 2 }} variant="contained">
                    Cerrar
                  </Button>
                </Box>
              ) : (
                <>
                  {/* Marco de guía 1:1 mejorado */}
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '320px',
                    height: '320px',
                    border: '3px solid rgba(255,255,255,0.8)',
                    borderRadius: '12px',
                    zIndex: 10,
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '280px',
                      height: '280px',
                      border: '2px dashed rgba(255,255,255,0.5)',
                      borderRadius: '8px'
                    }
                  }} />

                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      minHeight: '500px'
                    }}
                  />

                  {/* Controles de cámara */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 3,
                    padding: 2,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <IconButton
                      onClick={toggleCamera}
                      sx={{
                        color: 'white',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                      }}
                    >
                      <FlipCameraIcon />
                    </IconButton>

                    <IconButton
                      onClick={takePhoto}
                      sx={{
                        backgroundColor: 'white',
                        width: 64,
                        height: 64,
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                          transform: 'scale(1.1)'
                        },
                        transition: 'transform 0.2s'
                      }}
                    >
                      <CameraIcon sx={{ fontSize: 32, color: 'black' }} />
                    </IconButton>

                    <IconButton
                      onClick={stopCamera}
                      sx={{
                        color: 'white',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  {/* Instrucciones */}
                  <Box sx={{
                    position: 'absolute',
                    top: 70,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: 1,
                    fontSize: '14px'
                  }}>
                    <Typography variant="body2">
                      Encuadra la bobina dentro del marco 1:1
                    </Typography>
                  </Box>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={autorizacionDialog} onClose={() => setAutorizacionDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Autorización de Líder Requerida</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 2 }}>
                Para reemplazar una bobina existente, se requiere la autorización de un líder.
              </Typography>
              <TextField
                fullWidth
                label="Usuario"
                name="username"
                value={credencialesLider.username}
                onChange={handleCredencialesChange}
                margin="normal"
                required
                sx={{ mb: 2 }}
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
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setAutorizacionDialog(false);
                setCredencialesLider({ username: '', password: '' });
              }}>
                Cancelar
              </Button>
              <Button
                onClick={verificarLider}
                variant="contained"
                disabled={autorizando || !credencialesLider.username || !credencialesLider.password}
              >
                {autorizando ? <CircularProgress size={24} /> : 'Autorizar'}
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