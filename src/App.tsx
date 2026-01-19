import { useState } from 'react';
import { UserPlus, List, ScanLine, Download } from 'lucide-react';
import EntryForm from './components/EntryForm';
import EntryList from './components/EntryList';
import QRScanner from './components/QRScanner';
import ExportSection from './components/ExportSection';

type Tab = 'add' | 'list' | 'scan' | 'export';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('add');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Sistem Keluar Masuk</h1>
            <p className="text-blue-100">Manajemen Data Pengunjung dengan QR Code</p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('add')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'add'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserPlus size={20} />
                Tambah Data
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <List size={20} />
                Daftar Pengunjung
              </button>
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'scan'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ScanLine size={20} />
                Scan QR Code
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'export'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Download size={20} />
                Export & Import
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'add' && <EntryForm />}
            {activeTab === 'list' && <EntryList />}
            {activeTab === 'scan' && <QRScanner />}
            {activeTab === 'export' && <ExportSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
