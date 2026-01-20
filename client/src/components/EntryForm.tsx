import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function EntryForm() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    purpose: '',
    whom_to_meet: '',
    phone_number: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('POST', '/api/entries', { ...data, status: 'entered' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      setMessage({ type: 'success', text: 'Data berhasil ditambahkan! QR Code telah dibuat.' });
      setFormData({ name: '', address: '', purpose: '', whom_to_meet: '', phone_number: '' });
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Gagal menambahkan data. Silakan coba lagi.' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6" data-testid="text-form-title">Tambah Data Pengunjung</h2>

      {message && (
        <div
          data-testid={`alert-${message.type}`}
          className={`mb-6 p-4 rounded-md flex items-center gap-3 ${
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            data-testid="input-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Masukkan nama lengkap"
          />
        </div>

        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
            Nomor Handphone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            placeholder="Masukkan nomor handphone"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Alamat/ Perusahaan <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            data-testid="input-address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
            placeholder="Masukkan alamat atau nama perusahaan"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="whom_to_meet" className="block text-sm font-medium text-gray-700 mb-2">
              Ketemu Siapa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="whom_to_meet"
              value={formData.whom_to_meet}
              onChange={(e) => setFormData({ ...formData, whom_to_meet: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="Nama orang yang ditemui"
            />
          </div>
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
              Tujuan Berkunjung <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="Tujuan kunjungan"
            />
          </div>
        </div>

        <button
          type="submit"
          data-testid="button-submit"
          disabled={createMutation.isPending}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
        </button>
      </form>
    </div>
  );
}
