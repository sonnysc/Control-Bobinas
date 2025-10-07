// src/components/hooks/useCamera.js

import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [cameraPermission, setCameraPermission] = useState(null);
  const cameraVideoRef = useRef(null);

  const checkCameraSupport = useCallback(() => {
    const isSecure = window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isSecure) {
      setCameraError('La cámara requiere HTTPS. Protocolo actual: ' + window.location.protocol);
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador no soporta acceso a la cámara');
      return false;
    }

    return true;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError('');

      if (!checkCameraSupport()) {
        return;
      }

      setCameraDialogOpen(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }

      setCameraPermission('granted');

    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      handleCameraError(error);
      setCameraDialogOpen(false);
    }
  }, [checkCameraSupport]);

  const handleCameraError = (error) => {
    let errorMessage = 'Error al acceder a la cámara: ';

    switch (error.name) {
      case 'NotAllowedError':
        errorMessage = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.';
        break;
      case 'NotFoundError':
        errorMessage = 'No se encontró ninguna cámara disponible.';
        break;
      case 'NotSupportedError':
        errorMessage = 'HTTPS requerido para acceso a cámara. Estás usando: ' + window.location.protocol;
        break;
      case 'NotReadableError':
        errorMessage = 'La cámara está siendo usada por otra aplicación.';
        break;
      case 'OverconstrainedError':
        errorMessage = 'Configuración de cámara no soportada.';
        break;
      case 'SecurityError':
        errorMessage = 'Acceso a cámara bloqueado por políticas de seguridad. Usa HTTPS.';
        break;
      default:
        errorMessage += error.message || 'Error desconocido';
    }

    setCameraError(errorMessage);
    setCameraPermission('denied');
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
    }
    setCameraDialogOpen(false);
    setCameraError('');
  }, [cameraStream]);

  const takePhoto = useCallback(() => {
    if (!cameraVideoRef.current || !cameraStream) {
      setCameraError('La cámara no está lista');
      return null;
    }

    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;

    context.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `bobina-foto-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(file);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.8);
    });
  }, [cameraStream]);

  const checkCameraPermission = useCallback(async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(permission.state);

        permission.onchange = () => {
          setCameraPermission(permission.state);
        };
      }
    } catch (error) {
      console.warn('No se pudo verificar el permiso de cámara:', error);
    }
  }, []);

  return {
    cameraDialogOpen,
    cameraStream,
    cameraError,
    cameraPermission,
    cameraVideoRef,
    setCameraDialogOpen,
    setCameraError,
    checkCameraPermission,
    startCamera,
    stopCamera,
    takePhoto
  };
};
