'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, BarChart3, PieChart, Users, 
  CheckCircle2, Target, Filter, Download, RotateCcw
} from 'lucide-react';

export default function StatistikAlumni() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alumniData, setAlumniData] = useState<any[]>([]);
  
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedFakultas, setSelectedFakultas] = useState<string>('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('alumni').select('*');
    if (!error && data) setAlumniData(data);
    setLoading(false);
  };

  const handleResetData = async () => {
    if (confirm("PERINGATAN: Ini akan menghapus SELURUH data alumni di database. Lanjutkan?")) {
      setLoading(true);
      await supabase.from('hasil_pelacakan').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      await supabase.from('alumni').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setAlumniData([]);
      setLoading(false);
      alert("Database telah berhasil dikosongkan.");
    }
  };

  // LOGIKA FILTER: Diubah ke Uppercase agar kebal terhadap salah ketik (kapital/kecil) dari Excel
  const filteredData = alumniData.filter(item => {
    const matchYear = selectedYear === '' || item.tahun_masuk?.toString() === selectedYear;
    const itemFakultas = item.fakultas?.toString().trim().toUpperCase() || '';
    const matchFak = selectedFakultas === '' || itemFakultas === selectedFakultas;
    return matchYear && matchFak;
  });

  const totalAlumni = filteredData.length;
  const totalTeridentifikasi = filteredData.filter(a => a.status_pelacakan === 'Teridentifikasi').length;
  const persentase = totalAlumni > 0 ? ((totalTeridentifikasi / totalAlumni) * 100).toFixed(1) : 0;

  // SINKRONISASI PRODI: Paksa menjadi UPPERCASE agar "pendidikan profesi guru" tidak hilang
  const prodiStats = filteredData.reduce((acc: any, curr: any) => {
    const prodi = curr.prodi?.toString().trim().toUpperCase() || 'TIDAK DIKETAHUI';
    if (!acc[prodi]) acc[prodi] = { total: 0, teridentifikasi: 0 };
    acc[prodi].total += 1;
    if (curr.status_pelacakan === 'Teridentifikasi') acc[prodi].teridentifikasi += 1;
    return acc;
  }, {});

  // Opsi Dropdown Dinamis (Dipaksa Uppercase agar rapi)
  const years = Array.from(new Set(alumniData.map(a => a.tahun_masuk?.toString()))).filter(Boolean).sort().reverse();
  const faculties = Array.from(new Set(alumniData.map(a => a.fakultas?.toString().trim().toUpperCase()))).filter(Boolean).sort();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER STATISTIK */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-2 font-bold text-xs uppercase">
              <ArrowLeft size={16}/> Kembali ke Dashboard
            </button>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 italic">
              <BarChart3 className="text-blue-600" /> Analisis Capaian Tracer
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleResetData} className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition shadow-sm">
              <RotateCcw size={16}/> Reset Data
            </button>
            <button className="flex items-center gap-2 bg-white border border-gray-200 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition shadow-sm">
              <Download size={16}/> Export Laporan
            </button>
          </div>
        </div>

        {/* FILTER BAR STATISTIK */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex-1 min-w-[200px]">
            <Filter size={18} className="text-gray-400"/>
            <select className="bg-transparent w-full outline-none font-bold text-sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="">Semua Tahun Angkatan</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex-1 min-w-[200px]">
            <PieChart size={18} className="text-gray-400"/>
            <select className="bg-transparent w-full outline-none font-bold text-sm" value={selectedFakultas} onChange={(e) => setSelectedFakultas(e.target.value)}>
              <option value="">Semua Fakultas ({faculties.length})</option>
              {faculties.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Users className="text-blue-600"/>} label="Total Populasi" value={totalAlumni} desc="Alumni Terdaftar" color="bg-blue-50"/>
          <StatCard icon={<CheckCircle2 className="text-green-600"/>} label="Berhasil Dilacak" value={totalTeridentifikasi} desc="Status Teridentifikasi" color="bg-green-50"/>
          <StatCard icon={<Target className="text-orange-600"/>} label="Rasio Capaian" value={`${persentase}%`} desc="Success Rate Pelacakan" color="bg-orange-50"/>
        </div>

        {/* TABEL PRODI */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 border-b">
            <h2 className="font-black text-lg uppercase tracking-tight">Detail Per Program Studi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-6">Program Studi</th>
                  <th className="p-6">Total Alumni</th>
                  <th className="p-6">Teridentifikasi</th>
                  <th className="p-6">Progress</th>
                  <th className="p-6 text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.keys(prodiStats).length > 0 ? Object.entries(prodiStats).map(([name, stat]: any) => {
                  const itemPerc = ((stat.teridentifikasi / stat.total) * 100).toFixed(1);
                  return (
                    <tr key={name} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-6 font-black text-gray-800 group-hover:text-blue-600 transition-colors">{name}</td>
                      <td className="p-6 font-bold text-gray-500">{stat.total}</td>
                      <td className="p-6 font-bold text-green-600">{stat.teridentifikasi}</td>
                      <td className="p-6">
                        <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${itemPerc}%` }}></div>
                        </div>
                      </td>
                      <td className="p-6 text-right font-black text-blue-600">{itemPerc}%</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-gray-400 font-bold italic">Tidak ada data yang cocok dengan filter saat ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, desc, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
      <div className={`p-4 rounded-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic">{desc}</p>
      </div>
    </div>
  );
}