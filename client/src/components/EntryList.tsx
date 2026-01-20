import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Download, RefreshCw, Trash2, LogOut, QrCode, X } from 'lucide-react';
import { apiRequest, queryClient } from '../lib/queryClient';
import type { Entry } from '../../../shared/schema';

export default function EntryList() {
  const [filter, setFilter] = useState<'all' | 'entered' | 'exited'>('all');
  const [selectedQR, setSelectedQR] = useState<Entry | null>(null);

  const { data: entries = [], isLoading, refetch } = useQuery<Entry[]>({
    queryKey: ['/api/entries', filter],
    queryFn: async () => {
      const res = await fetch(`/api/entries?filter=${filter}`);
      if (!res.ok) throw new Error('Failed to fetch entries');
      return res.json();
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', `/api/entries/${id}/status`, { status: 'exited' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
    },
  });

  const downloadQR = (entry: Entry) => {
    const svg = document.getElementById(`qr-${entry.id}`) as unknown as SVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${entry.number}_${entry.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-800" data-testid="text-list-title">Daftar Pengunjung</h2>
        <button
          onClick={() => refetch()}
          data-testid="button-refresh"
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('entered')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'entered' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Masuk
        </button>
        <button
          onClick={() => setFilter('exited')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'exited' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Keluar
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Visitor Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entry Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Exit Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Tidak ada data pengunjung.</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{entry.name}</div>
                      <div className="text-xs text-gray-500">{entry.number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{entry.phone_number}</div>
                      <div className="text-xs text-gray-500 italic">Ketemu: {entry.whom_to_meet}</div>
                      <div className="text-xs text-gray-500 italic">Tujuan: {entry.purpose}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs text-gray-500">
                        <RefreshCw size={12} className="mr-1 opacity-50" />
                        {entry.entry_time ? new Date(entry.entry_time).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {entry.exit_time ? new Date(entry.exit_time).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                        entry.status === 'entered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {entry.status === 'entered' ? 'Inside' : 'Outside'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => setSelectedQR(entry)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Show QR Code"
                      >
                        <QrCode size={18} />
                      </button>
                      
                      {entry.status === 'entered' && (
                        <button
                          onClick={() => checkOutMutation.mutate(entry.id)}
                          disabled={checkOutMutation.isPending}
                          className="text-blue-600 hover:text-blue-800 transition-colors font-semibold"
                        >
                          Check Out
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          if (confirm('Hapus data pengunjung ini?')) {
                            deleteMutation.mutate(entry.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full relative">
            <button 
              onClick={() => setSelectedQR(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <h3 className="text-lg font-bold mb-4 text-center">QR Code Pengunjung</h3>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
                <QRCodeSVG id={`qr-${selectedQR.id}`} value={selectedQR.id} size={200} level="H" />
              </div>
            </div>
            <div className="text-center mb-6">
              <div className="font-bold text-gray-900">{selectedQR.name}</div>
              <div className="text-sm text-gray-500">{selectedQR.number}</div>
            </div>
            <button
              onClick={() => downloadQR(selectedQR)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
