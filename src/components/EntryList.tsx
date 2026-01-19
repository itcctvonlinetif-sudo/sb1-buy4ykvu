import { useState, useEffect } from 'react';
import { supabase, Entry } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Download, RefreshCw } from 'lucide-react';

export default function EntryList() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'entered' | 'exited'>('all');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      let query = supabase.from('entries').select('*').order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filter]);

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Pengunjung</h2>
        <button
          onClick={fetchEntries}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('entered')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'entered'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Masuk
        </button>
        <button
          onClick={() => setFilter('exited')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'exited'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Keluar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Tidak ada data pengunjung.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                  <QRCodeSVG id={`qr-${entry.id}`} value={entry.id} size={150} level="H" />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">No:</span>
                  <span className="text-sm font-bold text-gray-900">{entry.number}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Nama:</p>
                  <p className="text-gray-900 font-medium">{entry.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Alamat:</p>
                  <p className="text-gray-700 text-sm">{entry.address}</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      entry.status === 'entered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {entry.status === 'entered' ? 'Masuk' : 'Keluar'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => downloadQR(entry)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={18} />
                Download QR
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
