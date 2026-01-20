import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { CheckCircle, XCircle, AlertCircle, Camera, CreditCard, RefreshCw } from 'lucide-react';
import type { Entry } from '../../../shared/schema';

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<Entry | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [rfidInput, setRfidInput] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const rfidInputRef = useRef<HTMLInputElement>(null);

  const exitMutation = useMutation({
    mutationFn: async (idOrRfid: string) => {
      const res = await apiRequest('PATCH', `/api/entries/status-by-any/${idOrRfid}`, { status: 'exited' });
      return res.json();
    },
    onSuccess: (data: Entry) => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      setScanResult(data);
      setMessage({ type: 'success', text: `Berhasil! Pengunjung ${data.name} telah keluar.` });
      setRfidInput('');
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: 'Gagal! Data tidak ditemukan atau sudah keluar.' });
      setRfidInput('');
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const onScanSuccess = async (decodedText: string) => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop().catch(console.error);
    }
    setIsScanning(false);
    exitMutation.mutate(decodedText);
  };

  const onScanError = (_error: string | Error) => {
    // Suppress scan errors
  };

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        } else {
          setMessage({ type: 'warning', text: 'Tidak ada kamera yang terdeteksi.' });
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
      });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Keep focus on RFID input
  useEffect(() => {
    const timer = setInterval(() => {
      rfidInputRef.current?.focus();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRfidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rfidInput.trim()) {
      exitMutation.mutate(rfidInput.trim());
    }
  };

  const startScanner = async () => {
    if (!selectedCameraId) return;
    setIsScanning(true);
    setScanResult(null);
    setMessage(null);
    const html5QrCode = new Html5Qrcode('qr-reader');
    html5QrCodeRef.current = html5QrCode;
    try {
      await html5QrCode.start(selectedCameraId, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, onScanError);
    } catch (err) {
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop().catch(console.error);
    }
    setIsScanning(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Scan QR atau RFID untuk Keluar</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* RFID Section */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 text-center shadow-sm">
          <div className="flex justify-center mb-4 text-orange-600">
            <CreditCard size={40} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">SCAN RFID</h3>
          <p className="text-xs text-gray-600 mb-4">Tempelkan kartu RFID</p>
          <form onSubmit={handleRfidSubmit}>
            <input
              ref={rfidInputRef}
              type="text"
              value={rfidInput}
              onChange={(e) => setRfidInput(e.target.value)}
              className="opacity-0 absolute h-0 w-0"
              autoFocus
            />
            <div className="flex items-center justify-center gap-2 text-orange-600 text-sm font-bold animate-pulse">
              <RefreshCw size={16} className="animate-spin" />
              Menunggu Kartu...
            </div>
          </form>
        </div>

        {/* QR Section Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center shadow-sm">
          <div className="flex justify-center mb-4 text-blue-600">
            <Camera size={40} />
          </div>
          <h3 className="font-bold text-gray-800 mb-1">SCAN QR CODE</h3>
          <p className="text-xs text-gray-600 mb-4">Gunakan kamera untuk scan</p>
          <button 
            onClick={isScanning ? stopScanner : startScanner}
            className={`w-full py-2 rounded-md text-sm font-bold text-white transition-colors ${isScanning ? 'bg-red-600' : 'bg-blue-600'}`}
          >
            {isScanning ? 'Berhenti' : 'Mulai Kamera'}
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="mb-8 overflow-hidden rounded-xl border-4 border-slate-200 shadow-lg">
          <div id="qr-reader" className="bg-black min-h-[300px]"></div>
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-md flex items-center gap-3 animate-in fade-in slide-in-from-top-1 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          message.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : message.type === 'warning' ? <AlertCircle size={20} /> : <XCircle size={20} />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {scanResult && (
        <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Detail Pengunjung</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500 text-sm">Nama:</span><span className="font-bold">{scanResult.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 text-sm">ID:</span><span>{scanResult.number}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 text-sm">Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${scanResult.status === 'entered' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {scanResult.status === 'entered' ? 'Masuk' : 'Keluar'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
