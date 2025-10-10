// src/components/hooks/useScannerInventario.js

import { useState, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from "@zxing/library";

export const useScannerInventario = (onScanSuccess) => {
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
            const scannedValue = result.getText().trim();
            
            // ✅ Sin validación - acepta cualquier código escaneado
            setScanning(false);
            setScannerModalOpen(false);
            if (onScanSuccess) {
              onScanSuccess(scannedValue);
            }
            stopScanner();
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