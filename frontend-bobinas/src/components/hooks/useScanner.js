// src/components/hooks/useScanner.js

import { useState, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from "@zxing/library";

export const useScanner = (onScanSuccess) => {
  const [scanning, setScanning] = useState(false);
  const [qrError, setQrError] = useState('');
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  const stopScanner = useCallback(() => {
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
  }, []);

  const startScanner = useCallback(async () => {
    // Si ya está escaneando, no hacer nada
    if (scanning) return;
    
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
            const rawText = result.getText().trim();
            
            // ✅ MODIFICACIÓN: Extraer solo los primeros 9 caracteres
            const scannedValue = rawText.substring(0, 9);

            // Validar que esos 9 caracteres sean dígitos
            if (/^[0-9]{9}$/.test(scannedValue)) {
              setScanning(false);
              setScannerModalOpen(false);
              if (onScanSuccess) {
                onScanSuccess(scannedValue);
              }
              stopScanner();
            } else {
              // Si los primeros 9 caracteres no son números válidos
              setQrError('El código no inicia con 9 dígitos válidos');
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
  }, [onScanSuccess, stopScanner, scanning]);

  const openScannerModal = useCallback(() => {
    setScannerModalOpen(true);
    setQrError('');
  }, []);

  const closeScannerModal = useCallback(() => {
    setScannerModalOpen(false);
    stopScanner();
    setQrError('');
  }, [stopScanner]);

  return {
    scanning,
    qrError,
    scannerModalOpen,
    videoRef,
    startScanner,
    stopScanner,
    openScannerModal,
    closeScannerModal, 
    setQrError
  };
};