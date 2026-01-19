import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function EntryForm() {
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('entries').insert([
        {
          number: formData.number,
          name: formData.name,
          address: formData.address,
          status: 'entered',
        },
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Data berhasil ditambahkan! QR Code telah dibuat.' });
      setFormData({ number: '', name: '', address: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menambahkan data. Silakan coba lagi.' });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tambah Data Pengunjung</h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="flex-shrink-0" size={20} />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
            Nomor ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Contoh: 001, A001, dll"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Masukkan nama lengkap"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Alamat <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
            placeholder="Masukkan alamat lengkap"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : 'Simpan Data'}
        </button>
      </form>
    </div>
  );
}
