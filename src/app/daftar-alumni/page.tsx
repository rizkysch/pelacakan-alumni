'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
// Menggunakan Context agar scan tetap jalan saat pindah halaman
import { useTracking } from '@/context/TrackingContext'; 
import { 
  Search, RefreshCcw, SearchCode, Eye, UserPlus, 
  BarChart3, Play, Database, Trash2, RotateCcw 
} from 'lucide-react';

export default function DashboardAlumni() {
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingId, setTrackingId] = useState<string | null>(null);

  // Mengambil State Global dari TrackingContext
  const { isBulkScanning, currentName, runBulkScan } = useTracking();

  // State untuk Multi-Filter
  const [selFakultas, setSelFakultas] = useState('');
  const [selProdi, setSelProdi] = useState('');
  const [selTahun, setSelTahun] = useState('');

  // 1. FETCH DATA: Mengambil seluruh data tanpa filter hardcode
  const fetchAlumni = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alumni')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAlumniList(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAlumni(); }, []);

  // 2. FITUR RESET: Hapus Semua Data
  const handleResetAllData = async () => {
    if (confirm("PERINGATAN: Ini akan menghapus SELURUH data alumni dan hasil pelacakan. Lanjutkan?")) {
      setLoading(true);
      // Hapus riwayat pelacakan terlebih dahulu karena relasi Foreign Key
      await supabase.from('hasil_pelacakan').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      await supabase.from('alumni').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      fetchAlumni();
      setLoading(false);
      alert("Database telah dikosongkan.");
    }
  };

  // 3. FITUR HAPUS: Hapus Satu Per Satu
  const handleDeleteItem = async (id: string, nama: string) => {
    if (confirm(`Hapus data alumni: ${nama}?`)) {
      await supabase.from('hasil_pelacakan').delete().eq('alumni_id', id);
      await supabase.from('alumni').delete().eq('id', id);
      fetchAlumni();
    }
  };

  // 4. LOGIKA SCAN SATUAN
  const handleSingleTrack = async (alumni: any) => {
    setTrackingId(alumni.id);
    const query = encodeURIComponent(`"${alumni.nama_asli}" "Universitas Muhammadiyah Malang"`);
    const platforms = [
      { name: "LinkedIn", url: `https://www.linkedin.com/search/results/all/?keywords=${query}` },
      { name: "Instagram", url: `https://www.google.com/search?q=site:instagram.com ${query}` },
      { name: "Facebook", url: `https://www.facebook.com/search/top/?q=${query}` },
      { name: "TikTok", url: `https://www.google.com/search?q=site:tiktok.com ${query}` }
    ];

    try {
      await supabase.from('hasil_pelacakan').delete().eq('alumni_id', alumni.id);
      const insertData = platforms.map(p => ({
        alumni_id: alumni.id,
        sumber_temuan: p.name,
        link_profil: p.url,
        confidence_score: 50,
        kategori_hasil: 'Automated Scan',
        skor_nama: 0,
        skor_afiliasi: 0,
        tanggal_ditemukan: new Date().toISOString()
      }));
      await supabase.from('hasil_pelacakan').insert(insertData);
      await supabase.from('alumni').update({ status_pelacakan: 'Perlu Verifikasi Manual' }).eq('id', alumni.id);
      fetchAlumni();
    } catch (err) {
      console.error(err);
    }
    setTrackingId(null);
  };

  // 5. LOGIKA FILTER (Pencarian Nama & NIM)
  const filteredAlumni = alumniList.filter(alumni => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (alumni.nama_asli?.toLowerCase().includes(term)) || 
                        (alumni.nim?.toString().includes(term));
    const matchFakultas = selFakultas === '' || alumni.fakultas?.trim() === selFakultas;
    const matchProdi = selProdi === '' || alumni.prodi?.trim() === selProdi;
    const matchTahun = selTahun === '' || alumni.tahun_masuk?.toString() === selTahun;
    return matchSearch && matchFakultas && matchProdi && matchTahun;
  });

  // Opsi Dropdown Dinamis (Solusi Fakultas/Angkatan yang Hilang)
  const fakultasOptions = Array.from(new Set(alumniList.map(a => a.fakultas?.trim()))).filter(Boolean).sort();
  const prodiOptions = Array.from(new Set(alumniList.map(a => a.prodi?.trim()))).filter(Boolean).sort();
  const tahunOptions = Array.from(new Set(alumniList.map(a => a.tahun_masuk?.toString()))).filter(Boolean).sort().reverse();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Alumni Engine</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-lg">
                <Database size={14} className="text-blue-600"/>
                <span className="text-[10px] font-black text-blue-600">{alumniList.length} TOTAL DATA</span>
              </div>
              <button onClick={handleResetAllData} className="flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors text-[10px] font-black uppercase tracking-widest">
                <RotateCcw size={12}/> Reset Database
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => runBulkScan(alumniList.filter(a => a.status_pelacakan === 'Belum Dilacak'))}
              disabled={isBulkScanning || loading}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-4 rounded-2xl hover:bg-orange-600 transition-all font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 disabled:opacity-50"
            >
              {isBulkScanning ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} />}
              Auto-Scan All
            </button>
            <Link href="/statistik" className="flex items-center gap-2 bg-white border-2 border-gray-200 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all shadow-sm">
              <BarChart3 size={16} /> Statistik
            </Link>
            <Link href="/input-alumni" className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2">
              <UserPlus size={16} /> Import
            </Link>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" placeholder="Cari Nama/NIM..." 
              className="bg-transparent flex-1 outline-none font-bold text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="filter-style" value={selFakultas} onChange={(e) => setSelFakultas(e.target.value)}>
            <option value="">Semua Fakultas ({fakultasOptions.length})</option>
            {fakultasOptions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select className="filter-style" value={selProdi} onChange={(e) => setSelProdi(e.target.value)}>
            <option value="">Semua Prodi ({prodiOptions.length})</option>
            {prodiOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="filter-style" value={selTahun} onChange={(e) => setSelTahun(e.target.value)}>
            <option value="">Semua Angkatan</option>
            {tahunOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-6">Informasi Alumni</th>
                <th className="p-6">Prodi / Fakultas</th>
                <th className="p-6">Status Pelacakan</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAlumni.map((alumni) => (
                <tr key={alumni.id} className={`transition-all group ${trackingId === alumni.id || currentName === alumni.nama_asli ? 'bg-orange-50/50' : 'hover:bg-blue-50/20'}`}>
                  <td className="p-6">
                    <p className={`font-black ${(trackingId === alumni.id || currentName === alumni.nama_asli) ? 'text-orange-600' : 'text-gray-900'}`}>{alumni.nama_asli}</p>
                    <p className="text-[10px] font-bold text-gray-400">{alumni.nim}</p>
                  </td>
                  <td className="p-6">
                    <p className="text-[10px] font-black text-blue-600 uppercase">{alumni.prodi}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{alumni.fakultas} • {alumni.tahun_masuk}</p>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      alumni.status_pelacakan === 'Teridentifikasi' ? 'bg-green-100 text-green-700' : 
                      alumni.status_pelacakan === 'Perlu Verifikasi Manual' ? 'bg-orange-100 text-orange-700' : 
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {alumni.status_pelacakan}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleSingleTrack(alumni)} 
                        disabled={trackingId === alumni.id || isBulkScanning} 
                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"
                      >
                        <SearchCode size={16}/>
                      </button>
                      <Link href={`/verifikasi/${alumni.id}`} className="p-3 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-all">
                        <Eye size={16}/>
                      </Link>
                      <button 
                        onClick={() => handleDeleteItem(alumni.id, alumni.nama_asli)}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAlumni.length === 0 && (
            <div className="p-20 text-center font-bold text-gray-300 italic">Data tidak ditemukan...</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .filter-style { background: #f9fafb; border: 1px solid #f1f5f9; padding: 0.75rem 1rem; border-radius: 0.75rem; font-size: 11px; font-weight: 800; outline: none; cursor: pointer; }
        .filter-style:focus { border-color: #2563eb; }
      `}</style>
    </div>
  );
}