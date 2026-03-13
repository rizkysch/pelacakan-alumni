'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search, Users, CheckCircle, Clock, AlertCircle, 
  RefreshCcw, SearchCode, Eye, UserPlus, Pencil, Trash2 
} from 'lucide-react';

export default function DashboardAlumni() {
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const fetchAlumni = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alumni')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setAlumniList(data);
    setLoading(false);
  };

  useEffect(() => { fetchAlumni(); }, []);

  // --- LOGIKA HAPUS DATA ---
  const handleDelete = async (id: string, nama: string) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus data ${nama}? Semua riwayat pelacakan juga akan dihapus.`);
    if (confirmDelete) {
      // Hapus hasil pelacakan terlebih dahulu (Foreign Key)
      await supabase.from('hasil_pelacakan').delete().eq('alumni_id', id);
      // Hapus data alumni
      const { error } = await supabase.from('alumni').delete().eq('id', id);
      
      if (!error) {
        alert("Data berhasil dihapus.");
        fetchAlumni();
      } else {
        alert("Gagal menghapus data.");
      }
    }
  };

  const stats = {
    total: alumniList.length,
    identified: alumniList.filter(a => a.status_pelacakan === 'Teridentifikasi').length,
    pending: alumniList.filter(a => a.status_pelacakan === 'Perlu Verifikasi Manual').length,
    untracked: alumniList.filter(a => a.status_pelacakan === 'Belum Dilacak').length,
  };

  const filteredAlumni = alumniList.filter(alumni => 
    alumni.nama_asli.toLowerCase().includes(searchTerm.toLowerCase()) || 
    alumni.nim.includes(searchTerm)
  );

  const handleTrack = async (alumni: any) => {
    setTrackingId(alumni.id);
    const kw1 = "Universitas Muhammadiyah Malang";
    const kw2 = "University Muhammadiyah of Malang";
    const searchQuery = `"${alumni.nama_asli}" ("${kw1}" OR "${kw2}")`;

    const linkedInLink = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(searchQuery)}&origin=GLOBAL_SEARCH_HEADER`;
    const scholarLink = `https://scholar.google.com/citations?mauthors=${encodeURIComponent(searchQuery)}`;
    const googleLink = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    const temuanSimulasi = {
      nama: alumni.nama_asli,
      afiliasi: "Universitas Muhammadiyah Malang",
    };

    let s_nama = temuanSimulasi.nama.toLowerCase().trim() === alumni.nama_asli.toLowerCase().trim() ? 50 : 0;
    let s_afiliasi = temuanSimulasi.afiliasi.includes("Muhammadiyah Malang") ? 50 : 0;
    const totalSkor = s_nama + s_afiliasi;
    const statusBaru = totalSkor >= 100 ? 'Teridentifikasi' : 'Perlu Verifikasi Manual';

    try {
      await supabase.from('alumni').update({ status_pelacakan: statusBaru }).eq('id', alumni.id);
      await supabase.from('hasil_pelacakan').delete().eq('alumni_id', alumni.id);
      await supabase.from('hasil_pelacakan').insert([
        {
          alumni_id: alumni.id,
          sumber_temuan: "LinkedIn Professional",
          link_profil: linkedInLink,
          confidence_score: totalSkor,
          skor_nama: s_nama,
          skor_afiliasi: s_afiliasi,
          kategori_hasil: totalSkor >= 100 ? 'Kemungkinan Kuat' : 'Perlu Verifikasi'
        },
        {
          alumni_id: alumni.id,
          sumber_temuan: "Google Scholar",
          link_profil: scholarLink,
          confidence_score: s_nama,
          skor_nama: s_nama,
          skor_afiliasi: 0,
          kategori_hasil: 'Akademik'
        },
        {
          alumni_id: alumni.id,
          sumber_temuan: "Google Search Engine",
          link_profil: googleLink,
          confidence_score: totalSkor,
          skor_nama: s_nama,
          skor_afiliasi: s_afiliasi,
          kategori_hasil: 'Web Publik'
        }
      ]);
    } catch (err) {
      console.error("Error database:", err);
    }
    setTrackingId(null);
    fetchAlumni(); 
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Alumni Tracer</h1>
          <p className="text-gray-500 font-medium italic text-sm">Operator: Rizky Maulana Virdaus</p>
        </div>
        <div className="flex gap-3">
          <Link href="/input-alumni" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-100 uppercase text-xs">
            <UserPlus size={18} /> Tambah Alumni
          </Link>
          <button onClick={fetchAlumni} className="p-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition">
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard icon={<Users size={24} className="text-blue-600" />} label="Total Alumni" value={stats.total} color="blue" />
        <StatCard icon={<CheckCircle size={24} className="text-green-600" />} label="Teridentifikasi" value={stats.identified} color="green" />
        <StatCard icon={<AlertCircle size={24} className="text-orange-600" />} label="Perlu Verifikasi" value={stats.pending} color="orange" />
        <StatCard icon={<Clock size={24} className="text-gray-600" />} label="Belum Dilacak" value={stats.untracked} color="gray" />
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b flex items-center gap-4 bg-white">
          <Search className="text-gray-400" size={22} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama atau NIM..." 
            className="flex-1 outline-none text-gray-700 font-semibold placeholder:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Identitas Alumni</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Status Pelacakan</th>
                <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAlumni.map((alumni) => (
                <tr key={alumni.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="p-5">
                    <p className="font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors">{alumni.nama_asli}</p>
                    <p className="text-xs text-gray-400 mt-1 font-bold">{alumni.nim} • {alumni.prodi}</p>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      alumni.status_pelacakan === 'Belum Dilacak' ? 'bg-gray-100 text-gray-500' : 
                      alumni.status_pelacakan === 'Teridentifikasi' ? 'bg-green-100 text-green-700' : 
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {alumni.status_pelacakan === 'Teridentifikasi' ? <CheckCircle size={10} /> : 
                       alumni.status_pelacakan === 'Belum Dilacak' ? <Clock size={10} /> : <AlertCircle size={10} />}
                      {alumni.status_pelacakan}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleTrack(alumni)}
                        disabled={trackingId === alumni.id}
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"
                      >
                        <SearchCode size={14} />
                        {trackingId === alumni.id ? '...' : 'Lacak'}
                      </button>
                      <Link 
                        href={`/verifikasi/${alumni.id}`}
                        className="flex items-center gap-2 bg-gray-50 text-gray-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-gray-200 transition-all border border-transparent"
                      >
                        <Eye size={14} /> Bukti
                      </Link>
                      {/* TOMBOL EDIT */}
                      <Link 
                        href={`/edit-alumni/${alumni.id}`}
                        className="flex items-center gap-2 bg-yellow-50 text-yellow-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-yellow-600 hover:text-white transition-all border border-transparent"
                      >
                        <Pencil size={14} /> Edit
                      </Link>
                      {/*  TOMBOL HAPUS  */}
                      <button 
                        onClick={() => handleDelete(alumni.id, alumni.nama_asli)}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all border border-transparent"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
  };

  return (
    <div className={`bg-white p-7 rounded-3xl border shadow-sm flex items-center gap-6 transition-transform hover:scale-[1.02] ${colorMap[color]}`}>
      <div className="p-4 bg-white rounded-2xl shadow-inner border border-gray-50">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        <p className="text-4xl font-black text-gray-900 tracking-tighter">{value}</p>
      </div>
    </div>
  );
}