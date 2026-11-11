import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { Product } from '../types/pos';
import { formatMoney } from '../utils/formatters';
import {
  Camera,
  X,
  ScanLine,
  Zap,
  ZapOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  Barcode,
  Search,
  Check,
} from 'lucide-react';

interface QrCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product, qty?: number) => void;
  currencySymbol?: string;
}

export const QrCameraScannerModal: React.FC<QrCameraScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductScanned,
  currencySymbol = '৳',
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(true);
  const [lastScannedResult, setLastScannedResult] = useState<{
    code: string;
    product: Product | null;
    timestamp: number;
    count: number;
  } | null>(null);
  const [scanFeedbackMsg, setScanFeedbackMsg] = useState<string | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  // Audio Beep generator using Web Audio API
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz POS scanner beep
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // ignore audio context failures
    }
  }, [soundEnabled]);

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(70);
      } catch {
        // ignore
      }
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
    setTorchAvailable(false);
  }, []);

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        // Prefer back / environment camera if labeled
        const backCam = videoInputs.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );
        setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
      }
    } catch {
      // ignore
    }
  }, [selectedDeviceId]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setHasCameraPermission(false);
      setCameraError('আপনার ব্রাউজার বা ডিভাইসে ক্যামেরা অ্যাক্সেস সমর্থিত নয়।');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() || {}) as any;
        if (capabilities.torch) {
          setTorchAvailable(true);
        }
      }

      await refreshDevices();
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCameraPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('ক্যামেরা ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংসে ক্যামেরার অনুমতি দিন।');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('কোনো ক্যামেরা ডিভাইস পাওয়া যায়নি। নিচে টেস্ট কোড বা ম্যানুয়াল সার্চ ব্যবহার করুন।');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('ক্যামেরাটি অন্য কোনো অ্যাপ্লিকেশনে ব্যবহৃত হচ্ছে। অনুগ্রহ করে সেটি বন্ধ করুন।');
      } else {
        setCameraError(`ক্যামেরা চালু করা যায়নি: ${err.message || 'অজানা সমস্যা'}`);
      }
    }
  }, [selectedDeviceId, stopCamera, refreshDevices]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current || !torchAvailable) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      }
    } catch {
      // ignore
    }
  };

  // Match raw decoded string to Product
  const matchCodeToProduct = useCallback(
    (raw: string): Product | null => {
      if (!raw) return null;
      let text = raw.trim();

      // Handle JSON payload: e.g. {"sku":"BRG-6205"} or {"id":1}
      if (text.startsWith('{') && text.endsWith('}')) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.sku) {
            const bySku = products.find(
              (p) => p.sku.toLowerCase() === String(parsed.sku).toLowerCase().trim()
            );
            if (bySku) return bySku;
          }
          if (parsed.id) {
            const byId = products.find((p) => p.id === Number(parsed.id));
            if (byId) return byId;
          }
        } catch {
          // not valid JSON, proceed with normal string
        }
      }

      // Handle URL payload: e.g. "https://dulalmotors.com/product/BRG-6205" or "?sku=BRG-6205"
      if (text.includes('sku=')) {
        const match = text.match(/sku=([a-zA-Z0-9_-]+)/i);
        if (match && match[1]) {
          text = match[1];
        }
      } else if (text.includes('/')) {
        const parts = text.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart) text = lastPart;
      }

      const cleanLower = text.toLowerCase().trim();

      // 1. Direct SKU exact match
      const exactSku = products.find((p) => p.sku.toLowerCase() === cleanLower);
      if (exactSku) return exactSku;

      // 2. ID match: numeric "1", "id:1", "#1"
      const numMatch = cleanLower.replace(/^#|^id:/, '');
      const num = parseInt(numMatch, 10);
      if (!isNaN(num)) {
        const byId = products.find((p) => p.id === num);
        if (byId) return byId;
      }

      // 3. Name or Bangla Name substring match
      const byName = products.find(
        (p) =>
          p.name.toLowerCase().includes(cleanLower) ||
          (p.banglaName && p.banglaName.toLowerCase().includes(cleanLower))
      );
      if (byName) return byName;

      // 4. SKU prefix/partial
      const partialSku = products.find((p) => p.sku.toLowerCase().includes(cleanLower));
      if (partialSku) return partialSku;

      return null;
    },
    [products]
  );

  // Handle successful detection
  const handleDetectedCode = useCallback(
    (codeText: string) => {
      const now = Date.now();
      const trimmed = codeText.trim();
      if (!trimmed) return;

      // Debounce logic: prevent spamming duplicate scans of same code within 1.5s
      if (
        trimmed === lastScannedCodeRef.current &&
        now - lastScannedTimeRef.current < 1500
      ) {
        return;
      }

      lastScannedCodeRef.current = trimmed;
      lastScannedTimeRef.current = now;

      const product = matchCodeToProduct(trimmed);

      if (product) {
        playBeep();
        triggerHaptic();

        onProductScanned(product, 1);

        setLastScannedResult((prev) => ({
          code: trimmed,
          product,
          timestamp: now,
          count: prev && prev.code === trimmed ? prev.count + 1 : 1,
        }));

        setScanFeedbackMsg(`যোগ হয়েছে: ${product.name}`);

        if (!continuousMode) {
          // Single scan mode: close modal after brief visual confirmation
          setTimeout(() => {
            onClose();
          }, 350);
        }
      } else {
        // Code recognized but no matching product found
        setLastScannedResult({
          code: trimmed,
          product: null,
          timestamp: now,
          count: 1,
        });
        setScanFeedbackMsg(`"${trimmed}" কোডের কোনো পণ্য মেলেনি`);
      }
    },
    [matchCodeToProduct, onProductScanned, playBeep, triggerHaptic, continuousMode, onClose]
  );

  // Main Scanning Loop via BarcodeDetector API + jsQR
  useEffect(() => {
    if (!isOpen || hasCameraPermission !== true) return;

    let isActive = true;
    const hasBarcodeDetector = 'BarcodeDetector' in window;
    let detector: any = null;

    if (hasBarcodeDetector) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: [
            'qr_code',
            'code_128',
            'ean_13',
            'ean_8',
            'code_39',
            'data_matrix',
            'upc_a',
            'upc_e',
          ],
        });
      } catch {
        detector = null;
      }
    }

    const scanFrame = async () => {
      if (!isActive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        // 1. Try native BarcodeDetector first (hardware-accelerated, high frame rate)
        if (detector) {
          try {
            const detected = await detector.detect(video);
            if (detected && detected.length > 0 && detected[0].rawValue) {
              handleDetectedCode(detected[0].rawValue);
            }
          } catch {
            // fall back to canvas jsQR
          }
        }

        // 2. jsQR canvas fallback
        if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const w = video.videoWidth || 640;
            const h = video.videoHeight || 480;

            // Downscale slightly for snappy performance
            const targetWidth = Math.min(640, w);
            const targetHeight = Math.floor((h * targetWidth) / w);

            if (canvas.width !== targetWidth) canvas.width = targetWidth;
            if (canvas.height !== targetHeight) canvas.height = targetHeight;

            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (qrCode && qrCode.data) {
              handleDetectedCode(qrCode.data);
            }
          }
        }
      }

      if (isActive) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isActive = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isOpen, hasCameraPermission, handleDetectedCode]);

  // Handle open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setLastScannedResult(null);
      setScanFeedbackMsg(null);
      setIsSimulateOpen(false);
      setManualCodeInput('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Handle Image File Upload for QR decode
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleDetectedCode(code.data);
        } else {
          setScanFeedbackMsg('ছবিটিতে কোনো পরিষ্কার QR কোড শনাক্ত করা যায়নি');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleDetectedCode(manualCodeInput.trim());
    setManualCodeInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                QR ও বারকোড স্ক্যানার
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ক্যামেরার সামনে পার্টসের QR বা বারকোড ধরুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                soundEnabled
                  ? 'bg-slate-800 text-amber-400 border-amber-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={soundEnabled ? 'সাউন্ড অন' : 'সাউন্ড অফ'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Torch Toggle (if available) */}
            {torchAvailable && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl border text-xs transition-colors ${
                  isTorchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title={isTorchOn ? 'ফ্ল্যাশলাইট বন্ধ' : 'ফ্ল্যাশলাইট চালু'}
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-slate-950 min-h-[300px] sm:min-h-[360px] overflow-hidden flex items-center justify-center">
          {/* Live Video */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              hasCameraPermission ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Camera Permission Loading or Error Overlay */}
          {hasCameraPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-300">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <p className="text-sm font-medium">ক্যামেরা চালু হচ্ছে...</p>
              <p className="text-xs text-slate-500 mt-1">অনুগ্রহ করে ক্যামেরার অনুমতি দিন</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 text-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">ক্যামেরা খোলা যায়নি</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                {cameraError || 'ক্যামেরায় প্রবেশাধিকার পাওয়া যায়নি।'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  পুনরায় চেষ্টা করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsSimulateOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  টেস্ট কোড দিয়ে ট্রাই করুন
                </button>
              </div>
            </div>
          )}

          {/* Scanner Overlay HUD (Reticle & Laser Line) */}
          {hasCameraPermission && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Darkened vignette around target */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                {/* 4 Glowing Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-2xl shadow-lg shadow-amber-500/40"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-2xl shadow-lg shadow-amber-500/40"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-2xl shadow-lg shadow-amber-500/40"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-2xl shadow-lg shadow-amber-500/40"></div>

                {/* Subtle center crosshairs */}
                <div className="absolute inset-0 m-auto w-8 h-8 border border-white/20 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></div>
                </div>

                {/* Animated Sweeping Laser Bar */}
                <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-scan-bounce"></div>
              </div>

              {/* Instructions banner */}
              <div className="absolute bottom-4 inset-x-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] text-slate-300 backdrop-blur-md shadow-lg">
                  <ScanLine className="w-3.5 h-3.5 text-amber-400" />
                  QR কোড বা বারকোড বক্সের মাঝখানে রাখুন
                </span>
              </div>
            </div>
          )}

          {/* Toast / Banner when a product is recognized */}
          {scanFeedbackMsg && (
            <div className="absolute top-3 inset-x-4 z-20 flex justify-center pointer-events-none animate-slide-down">
              <div
                className={`px-4 py-2 rounded-2xl text-xs font-semibold shadow-xl border backdrop-blur-md flex items-center gap-2 ${
                  lastScannedResult?.product
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                    : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                }`}
              >
                {lastScannedResult?.product ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{scanFeedbackMsg}</span>
              </div>
            </div>
          )}
        </div>

        {/* Scanned Item Quick Summary Card (if matched) */}
        {lastScannedResult?.product && (
          <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 animate-fade-in">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {lastScannedResult.product.sku}
                </span>
                <span className="text-xs text-slate-400 truncate">
                  {lastScannedResult.product.category}
                </span>
                {lastScannedResult.product.location && (
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                    {lastScannedResult.product.location}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white truncate mt-0.5">
                {lastScannedResult.product.name}
              </h4>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="text-emerald-400 font-mono font-bold">
                  {formatMoney(lastScannedResult.product.sellingPrice, currencySymbol)}
                </span>
                <span>·</span>
                <span>
                  মজুত: {lastScannedResult.product.stock} {lastScannedResult.product.unit}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">কার্টে যোগ</span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  +{lastScannedResult.count}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onProductScanned(lastScannedResult.product!, 1)}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                title="আরেকটি যোগ করুন"
              >
                +১
              </button>
            </div>
          </div>
        )}

        {/* Controls Toolbar & Mode Switch */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Camera Selector */}
            {videoDevices.length > 1 && (
              <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 truncate"
                >
                  {videoDevices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Continuous vs Single Scan Mode Switch */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setContinuousMode(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  continuousMode
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ধারাবাহিক স্ক্যান (Turbo)
              </button>
              <button
                type="button"
                onClick={() => setContinuousMode(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  !continuousMode
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                একক স্ক্যান
              </button>
            </div>

            {/* Quick Actions: Upload Image or Simulate Test Codes */}
            <div className="flex items-center gap-2 ml-auto">
              <label
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                title="QR কোডের ছবি আপলোড করুন"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>ছবি আপলোড</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setIsSimulateOpen(!isSimulateOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                  isSimulateOpen
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>টেস্ট পার্টস ({products.length})</span>
              </button>
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ম্যানুয়াল কোড / SKU লিখুন (যেমন: BRG-6205, SN-FLT-60)..."
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCodeInput.trim()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-400 border border-slate-700 transition-colors whitespace-nowrap"
            >
              যোগ করুন
            </button>
          </form>

          {/* Test Parts / QR Simulator Drawer */}
          {isSimulateOpen && (
            <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 max-h-52 overflow-y-auto space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800 text-[11px]">
                <span className="font-semibold text-slate-300">
                  ক্লিক করে স্ক্যান সিমুলেট করুন (Instant Test):
                </span>
                <span>{products.length} টি পার্টস প্রস্তুত</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleDetectedCode(p.sku)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-amber-400 group-hover:text-amber-300">
                        {p.sku}
                      </span>
                      <span className="text-[9px] text-slate-500">{p.unit}</span>
                    </div>
                    <div className="text-xs font-medium text-white truncate mt-0.5">
                      {p.banglaName || p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                      <span className="text-emerald-400 font-mono font-semibold">
                        {formatMoney(p.sellingPrice, currencySymbol)}
                      </span>
                      <span className="text-slate-500">মজুত: {p.stock}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
