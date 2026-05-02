'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, FileUp, UserPlus, CheckCircle2, 
  Loader2, Hash, GraduationCap, Calendar, Building2 
} from 'lucide-react';

export default function InputAlumni() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  // State Form Manual (Mengikuti Format Excel: Nama, NIM, Thn Masuk, Thn Lulus, Fak, Prodi)
  const [form, setForm] = useState({
    nama_asli: '',
    nim: '',
    tahun_masuk: '',
    tahun_lulus: '',
    fakultas: '',
    prodi: ''
  });

  // --- FUNGSI PEMBERSIH TAHUN (Solusi Error Integer Syntax) ---
  const cleanYear = (val: any) => {
    const str = val?.toString() || '';
    const match = str.match(/\d{4}/); // Mengambil 4 digit angka pertama sebagai tahun
    return match ? parseInt(match[0]) : null;
  };

  // --- 1. LOGIKA INPUT MANUAL (DENGAN UPSERT) ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    
    const { error } = await supabase.from('alumni').upsert([{
      ...form,
      tahun_masuk: parseInt(form.tahun_masuk),
      tahun_lulus: parseInt(form.tahun_lulus),
      status_pelacakan: 'Belum Dilacak'
    }], { onConflict: 'nim' });

    if (!error) {
      setSuccess(true);
      setTimeout(() => router.push('/daftar-alumni'), 2000);
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
    setImporting(false);
  };

  // --- 2. LOGIKA IMPORT EXCEL (DENGAN FILTER UNIK & BATCHING) ---
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setProgress(0);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        // Memetakan data awal
        const rawAlumni = data.slice(1).filter(row => row[0]).map(row => ({
          nama_asli: row[0]?.toString() || '',
          nim: row[1]?.toString() || '',
          tahun_masuk: cleanYear(row[2]),
          tahun_lulus: cleanYear(row[3]),
          fakultas: row[4]?.toString() || '',
          prodi: row[5]?.toString() || '',
          status_pelacakan: 'Belum Dilacak'
        }));

        // FILTER UNIK: Mencegah error "ON CONFLICT DO UPDATE cannot affect row a second time"
        // Jika ada NIM ganda di dalam satu file Excel, hanya ambil satu entri terakhir
        const uniqueAlumni = Object.values(
          rawAlumni.reduce((acc: any, current: any) => {
            acc[current.nim] = current;
            return acc;
          }, {})
        );

        // BATCHING: Mengirim data per 100 baris untuk stabilitas
        const batchSize = 100;
        for (let i = 0; i < uniqueAlumni.length; i += batchSize) {
          const batch = uniqueAlumni.slice(i, i + batchSize);
          
          const { error } = await supabase
            .from('alumni')
            .upsert(batch, { onConflict: 'nim' }); 

          if (error) throw error;
          setProgress(Math.round(((i + batch.length) / uniqueAlumni.length) * 100));
        }

        setSuccess(true);
        setTimeout(() => router.push('/daftar-alumni'), 2000);
      } catch (err: any) {
        alert("Gagal mengimpor: " + err.message);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition font-bold text-sm mb-8">
          <ArrowLeft size={18} /> Kembali
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'manual' ? 'bg-white text-blue-600 border-b-4 border-blue-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              Input Manual
            </button>
            <button 
              onClick={() => setActiveTab('excel')}
              className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'excel' ? 'bg-white text-blue-600 border-b-4 border-blue-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              Import Excel
            </button>
          </div>

          <div className="p-10">
            {success ? (
              <div className="py-20 text-center space-y-4">
                <div className="flex justify-center"><CheckCircle2 size={64} className="text-green-500 animate-bounce" /></div>
                <h2 className="text-2xl font-black">Proses Berhasil!</h2>
                <p className="text-gray-400 font-medium">Data alumni telah disinkronkan ke database.</p>
              </div>
            ) : activeTab === 'manual' ? (
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="label-style"><UserPlus size={12}/> Nama Lengkap</label>
                  <input type="text" required className="input-style" value={form.nama_asli} onChange={(e) => setForm({...form, nama_asli: e.target.value})} placeholder="Nama Alumni" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-style"><Hash size={12}/> NIM</label>
                    <input type="text" required className="input-style" value={form.nim} onChange={(e) => setForm({...form, nim: e.target.value})} placeholder="NIM" />
                  </div>
                  <div className="space-y-2">
                    <label className="label-style"><Calendar size={12}/> Tahun Masuk</label>
                    <input type="number" required className="input-style" value={form.tahun_masuk} onChange={(e) => setForm({...form, tahun_masuk: e.target.value})} placeholder="2020" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-style"><Calendar size={12}/> Tahun Lulus</label>
                    <input type="number" required className="input-style" value={form.tahun_lulus} onChange={(e) => setForm({...form, tahun_lulus: e.target.value})} placeholder="2024" />
                  </div>
                  <div className="space-y-2">
                    <label className="label-style"><Building2 size={12}/> Fakultas</label>
                    <input type="text" required className="input-style" value={form.fakultas} onChange={(e) => setForm({...form, fakultas: e.target.value})} placeholder="Fakultas Teknik" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-style"><GraduationCap size={12}/> Program Studi</label>
                  <input type="text" required className="input-style" value={form.prodi} onChange={(e) => setForm({...form, prodi: e.target.value})} placeholder="Informatika" />
                </div>

                <button type="submit" disabled={importing} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all">
                  {importing ? 'Menyimpan...' : 'Simpan / Update Alumni'}
                </button>
              </form>
            ) : (
              <div className="text-center py-10">
                <div className="p-6 bg-blue-50 rounded-3xl text-blue-600 w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2 border-dashed border-blue-200">
                  {importing ? <Loader2 size={32} className="animate-spin" /> : <FileUp size={32} />}
                </div>
                <h2 className="text-xl font-black mb-2 tracking-tight">Sync via Excel</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-10 italic">
                  Data unik dijamin oleh filter NIM otomatis.
                </p>
                
                {importing && (
                  <div className="max-w-xs mx-auto mb-8">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-[10px] font-black text-blue-600 mt-2">{progress}% Mengunggah Data...</p>
                  </div>
                )}

                <input type="file" ref={fileInputRef} onChange={handleExcelImport} accept=".xlsx, .xls" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="px-10 bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {importing ? 'Memproses File...' : 'Pilih File Excel'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .label-style { display: flex; align-items: center; gap: 0.5rem; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 0.25rem; }
        .input-style { width: 100%; padding: 1.25rem; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 1.25rem; outline: none; font-weight: 800; font-size: 0.75rem; transition: all 0.2s; }
        .input-style:focus { border-color: #2563eb; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      `}</style>
    </div>
  );
}