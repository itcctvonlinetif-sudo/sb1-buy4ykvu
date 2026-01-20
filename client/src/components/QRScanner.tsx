import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { CheckCircle, XCircle, AlertCircle, Camera } from 'lucide-react';
import type { Entry } from '../../../shared/schema';

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<Entry | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const exitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', `/api/entries/${id}/exit`);
      return res.json();
    },
    onSuccess: (data: Entry) => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      setScanResult(data);
      setMessage({ type: 'success', text: 'Berhasil! Pengunjung telah keluar.' });
    },
    onError: (error: Error) => {
      if (error.message.includes('already exited')) {
        setMessage({ type: 'warning', text: 'QR Code sudah digunakan untuk keluar! Status: INVALID' });
      } else {
        setMessage({ type: 'error', text: 'Terjadi kesalahan saat memproses scan.' });
      }
    },
  });

  const onScanSuccess = async (decodedText: string) => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop().catch(console.error);
    }
    setIsScanning(false);

    try {
      const res = await fetch(`/api/entries/${decodedText}`);
      if (!res.ok) {
        if (res.status === 404) {
          setMessage({ type: 'error', text: 'QR Code tidak valid atau tidak ditemukan!' });
          return;
        }
        throw new Error('Failed to fetch entry');
      }

      const entry: Entry = await res.json();

      if (entry.status === 'exited') {
        setMessage({ type: 'warning', text: 'QR Code sudah digunakan untuk keluar! Status: INVALID' });
        setScanResult(entry);
        return;
      }

      exitMutation.mutate(entry.id);
    } catch (error) {
      console.error('Error processing scan:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memproses scan.' });
    }
  };

  const onScanError = (_error: string | Error) => {
    // Suppress scan errors as they occur frequently during normal operation
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
        setMessage({ type: 'error', text: 'Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.' });
      });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    if (!selectedCameraId) {
      setMessage({ type: 'error', text: 'Kamera tidak ditemukan.' });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setMessage(null);

    const html5QrCode = new Html5Qrcode('qr-reader');
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanError
      );
    } catch (err) {
      console.error('Unable to start scanning', err);
      setMessage({ type: 'error', text: 'Gagal memulai kamera. Pastikan izin kamera diberikan.' });
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6" data-testid="text-scanner-title">Scan QR Code</h2>

      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6 shadow-sm">
        {!isScanning ? (
          <div className="text-center py-8">
            <Camera className="mx-auto mb-4 text-gray-400" size={64} />
            <p className="text-gray-600 mb-6 font-medium">Klik tombol di bawah untuk mulai scanning QR Code</p>
            
            {cameras.length > 0 && (
              <div className="mb-6 flex flex-col items-center gap-2">
                <label className="text-sm text-gray-500 font-medium">Pilih Kamera:</label>
                <select 
                  value={selectedCameraId || ''} 
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none max-w-xs truncate"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Kamera ${camera.id.slice(0, 5)}...`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={startScanner}
              disabled={cameras.length === 0}
              data-testid="button-start-scan"
              className={`px-8 py-3 rounded-md font-semibold text-white transition-all shadow-md ${
                cameras.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {cameras.length === 0 ? 'Mencari Kamera...' : 'Mulai Scan'}
            </button>
            
            {cameras.length === 0 && (
              <p className="mt-4 text-xs text-red-500">
                Kamera tidak terdeteksi. Silakan muat ulang halaman atau periksa izin browser.
              </p>
            )}
          </div>
        ) : (
          <div>
            <div id="qr-reader" className="mb-4 overflow-hidden rounded-lg bg-black min-h-[300px]"></div>
            <button
              onClick={stopScanner}
              data-testid="button-stop-scan"
              className="w-full px-4 py-3 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm active:scale-95"
            >
              Berhenti Scan
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          data-testid={`alert-scan-${message.type}`}
          className={`mb-6 p-4 rounded-md flex items-center gap-3 animate-in fade-in slide-in-from-top-1 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : message.type === 'warning'
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="flex-shrink-0" size={20} />
          ) : message.type === 'warning' ? (
            <AlertCircle className="flex-shrink-0" size={20} />
          ) : (
            <XCircle className="flex-shrink-0" size={20} />
          )}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {scanResult && (
        <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2" data-testid="card-scan-result">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Detail Pengunjung</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-1">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Nomor:</span>
              <span className="text-gray-900 font-medium" data-testid="text-result-number">{scanResult.number}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Nama:</span>
              <span className="text-gray-900 font-medium" data-testid="text-result-name">{scanResult.name}</span>
            </div>
            <div className="pb-1">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Alamat:</span>
              <p className="text-gray-900 mt-1 leading-relaxed" data-testid="text-result-address">{scanResult.address}</p>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Status:</span>
              <span
                data-testid="badge-result-status"
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                  scanResult.status === 'entered'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {scanResult.status === 'entered' ? 'Masuk' : 'Keluar'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
