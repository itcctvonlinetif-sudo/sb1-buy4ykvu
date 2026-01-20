import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
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
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-orange-600 px-8 py-10 text-white">
              <h1 className="text-3xl font-bold tracking-tight uppercase" data-testid="text-app-title">SISTEM KELUAR MASUK</h1>
              <p className="mt-2 text-orange-100 text-lg">Manajemen Data Pengunjung dengan QR Code</p>
            </div>

            <div className="border-b border-slate-200 bg-slate-50/50">
              <nav className="flex overflow-x-auto no-scrollbar">
                {[
                  { id: 'add', label: 'Tambah Data', icon: UserPlus },
                  { id: 'list', label: 'Daftar Pengunjung', icon: List },
                  { id: 'scan', label: 'Scan Kartu / QR', icon: ScanLine },
                  { id: 'export', label: 'Export & Import', icon: Download },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    data-testid={`tab-${tab.id}`}
                    className={`flex items-center gap-2 px-8 py-5 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-orange-600 text-orange-600 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'add' && <EntryForm />}
                {activeTab === 'list' && <EntryList />}
                {activeTab === 'scan' && <QRScanner />}
                {activeTab === 'export' && <ExportSection />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
