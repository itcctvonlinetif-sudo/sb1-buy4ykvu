import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { CheckCircle, XCircle, AlertCircle, Camera } from 'lucide-react';
import type { Entry } from '../../../shared/schema';

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<Entry | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

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

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }

    setIsScanning(true);
    setScanResult(null);
    setMessage(null);

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;
  };

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
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

  const onScanError = (error: string) => {
    console.warn('QR scan error:', error);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6" data-testid="text-scanner-title">Scan QR Code</h2>

      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
        {!isScanning ? (
          <div className="text-center py-8">
            <Camera className="mx-auto mb-4 text-gray-400" size={64} />
            <p className="text-gray-600 mb-6">Klik tombol di bawah untuk mulai scanning QR Code</p>
            <button
              onClick={startScanner}
              data-testid="button-start-scan"
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Mulai Scan
            </button>
          </div>
        ) : (
          <div>
            <div id="qr-reader" className="mb-4"></div>
            <button
              onClick={stopScanner}
              data-testid="button-stop-scan"
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
            >
              Berhenti Scan
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          data-testid={`alert-scan-${message.type}`}
          className={`mb-6 p-4 rounded-md flex items-center gap-3 ${
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
        <div className="bg-white border border-gray-200 rounded-md p-6" data-testid="card-scan-result">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Detail Pengunjung</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-600">Nomor:</span>
              <span className="text-gray-900" data-testid="text-result-number">{scanResult.number}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-600">Nama:</span>
              <span className="text-gray-900" data-testid="text-result-name">{scanResult.name}</span>
            </div>
            <div className="border-b border-gray-100 pb-2">
              <span className="font-semibold text-gray-600">Alamat:</span>
              <p className="text-gray-900 mt-1" data-testid="text-result-address">{scanResult.address}</p>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-semibold text-gray-600">Status:</span>
              <span
                data-testid="badge-result-status"
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  scanResult.status === 'entered'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
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
