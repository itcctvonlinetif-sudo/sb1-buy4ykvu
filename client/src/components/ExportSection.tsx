import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { Download, Upload, FileText, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import type { Entry } from '../../../shared/schema';

export default function ExportSection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const importMutation = useMutation({
    mutationFn: async (entries: { number: string; name: string; address: string; status: string }[]) => {
      const res = await apiRequest('POST', '/api/entries/bulk', entries);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      setMessage({ type: 'success', text: `Berhasil import ${data.length} data pengunjung!` });
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Gagal memproses file. Pastikan format file benar.' });
    },
  });

  const fetchEntries = async (): Promise<Entry[]> => {
    const res = await fetch('/api/entries');
    if (!res.ok) throw new Error('Failed to fetch entries');
    return res.json();
  };

  const exportListToPDF = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const allEntries = await fetchEntries();
      
      // Sort entries: Exited first, then by entry time descending
      const entries = [...allEntries].sort((a, b) => {
        if (a.status === 'exited' && b.status === 'entered') return -1;
        if (a.status === 'entered' && b.status === 'exited') return 1;
        
        const timeA = new Date(a.entry_time || 0).getTime();
        const timeB = new Date(b.entry_time || 0).getTime();
        return timeB - timeA;
      });

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('Daftar Pengunjung', 14, 20);

      doc.setFontSize(10);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
      doc.text(`Total: ${entries?.length || 0} pengunjung`, 14, 34);

      const tableData = entries?.map((entry, index) => [
        index + 1,
        entry.name,
        entry.phone_number || '-',
        entry.address,
        entry.whom_to_meet || '-',
        entry.purpose || '-',
        entry.status === 'entered' ? 'Masuk' : 'Keluar',
        entry.entry_time ? new Date(entry.entry_time).toLocaleString('id-ID') : '-',
        entry.exit_time ? new Date(entry.exit_time).toLocaleString('id-ID') : '-',
      ]) || [];

      autoTable(doc, {
        startY: 40,
        head: [['No', 'Nama', 'HP', 'Alamat/Perusahaan', 'Ketemu', 'Tujuan', 'Status', 'Waktu Masuk', 'Waktu Keluar']],
        body: tableData,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save(`Daftar_Pengunjung_${new Date().toISOString().split('T')[0]}.pdf`);
      setMessage({ type: 'success', text: 'Daftar pengunjung berhasil di-export ke PDF!' });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setMessage({ type: 'error', text: 'Gagal export ke PDF. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const exportQRCodesToPDF = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const entries = await fetchEntries();

      if (!entries || entries.length === 0) {
        setMessage({ type: 'error', text: 'Tidak ada data untuk di-export.' });
        setLoading(false);
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const qrSize = 50;
      const cols = 3;
      const rows = 4;
      const marginX = (pageWidth - (cols * qrSize)) / (cols + 1);
      const marginY = 20;
      const spacingY = (pageHeight - marginY - (rows * qrSize)) / rows;

      let currentRow = 0;
      let currentCol = 0;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (currentRow >= rows) {
          doc.addPage();
          currentRow = 0;
          currentCol = 0;
        }

        const x = marginX + currentCol * (qrSize + marginX);
        const y = marginY + currentRow * (qrSize + spacingY);

        const canvas = document.createElement('canvas');

        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        const qrContainer = document.createElement('div');
        tempDiv.appendChild(qrContainer);

        const { createRoot } = await import('react-dom/client');
        const root = createRoot(qrContainer);
        root.render(<QRCodeSVG value={entry.id} size={200} level="H" />);

        await new Promise(resolve => setTimeout(resolve, 100));

        const svgElement = qrContainer.querySelector('svg');
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const img = new Image();

          await new Promise<void>((resolve) => {
            img.onload = () => {
              canvas.width = 200;
              canvas.height = 200;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0);
              const imgData = canvas.toDataURL('image/png');

              doc.addImage(imgData, 'PNG', x, y, qrSize, qrSize);

              doc.setFontSize(8);
              doc.text(entry.number, x + qrSize / 2, y + qrSize + 4, { align: 'center' });
              doc.setFontSize(7);
              doc.text(entry.name, x + qrSize / 2, y + qrSize + 8, { align: 'center', maxWidth: qrSize });
              resolve();
            };

            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
          });
        }

        root.unmount();
        document.body.removeChild(tempDiv);

        currentCol++;
        if (currentCol >= cols) {
          currentCol = 0;
          currentRow++;
        }
      }

      doc.save(`QR_Codes_Batch_${new Date().toISOString().split('T')[0]}.pdf`);
      setMessage({ type: 'success', text: 'QR Codes berhasil di-export ke PDF!' });
    } catch (error) {
      console.error('Error exporting QR codes:', error);
      setMessage({ type: 'error', text: 'Gagal export QR codes. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const entries = jsonData.map((row: any) => ({
            name: String(row['Nama'] || row['nama'] || row['Name'] || row['name'] || ''),
            address: String(row['Alamat'] || row['alamat'] || row['Address'] || row['address'] || ''),
            phone_number: String(row['HP'] || row['hp'] || row['Phone'] || row['phone'] || ''),
            whom_to_meet: String(row['Ketemu'] || row['ketemu'] || row['Meet'] || row['meet'] || ''),
            purpose: String(row['Tujuan'] || row['tujuan'] || row['Purpose'] || row['purpose'] || ''),
            status: 'entered',
          })).filter(entry => entry.name && entry.address);

          if (entries.length === 0) {
            setMessage({ type: 'error', text: 'File tidak berisi data yang valid. Pastikan kolom Nomor, Nama, dan Alamat ada.' });
            setLoading(false);
            return;
          }

          importMutation.mutate(entries);
        } catch (error) {
          console.error('Error processing file:', error);
          setMessage({ type: 'error', text: 'Gagal memproses file. Pastikan format file benar.' });
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setMessage({ type: 'error', text: 'Gagal membaca file. Silakan coba lagi.' });
      setLoading(false);
    }

    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6" data-testid="text-export-title">Export & Import Data</h2>

      {message && (
        <div
          data-testid={`alert-export-${message.type}`}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-md">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Export Daftar</h3>
              <p className="text-sm text-gray-600">Export daftar pengunjung ke PDF</p>
            </div>
          </div>
          <button
            onClick={exportListToPDF}
            disabled={loading}
            data-testid="button-export-list"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <Download size={18} />
            Export Daftar PDF
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-md">
              <QrCode className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Export QR Codes</h3>
              <p className="text-sm text-gray-600">Export semua QR codes ke PDF</p>
            </div>
          </div>
          <button
            onClick={exportQRCodesToPDF}
            disabled={loading}
            data-testid="button-export-qr"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            <Download size={18} />
            Export QR Batch PDF
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-md">
              <Upload className="text-orange-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Import Data</h3>
              <p className="text-sm text-gray-600">Import data dari Excel atau CSV</p>
            </div>
          </div>
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 mb-2 font-medium">Format file yang diperlukan:</p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Kolom: <strong>Nama</strong>, <strong>HP</strong>, <strong>Alamat</strong>, <strong>Ketemu</strong>, <strong>Tujuan</strong></li>
              <li>Format: Excel (.xlsx) atau CSV (.csv)</li>
              <li>Baris pertama harus berisi header kolom</li>
            </ul>
          </div>
          <label className="block">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileImport}
              disabled={loading}
              className="hidden"
              id="file-upload"
              data-testid="input-file-upload"
            />
            <label
              htmlFor="file-upload"
              data-testid="button-import"
              className={`flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors cursor-pointer ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload size={18} />
              {loading ? 'Mengimport...' : 'Pilih File untuk Import'}
            </label>
          </label>
        </div>
      </div>
    </div>
  );
}
