'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Check, X, ExternalLink, 
  Target, User, GraduationCap, RefreshCw 
} from 'lucide-react';

export default function VerifikasiBukti() {
  const { id } = useParams();
  const router = useRouter();
  const [bukti, setBukti] = useState<any[]>([]);
  const [alumni, setAlumni] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // LOGIKA: Mengambil data alumni dan jejak bukti
  const fetchData = async () => {
    setLoading(true);
    const { data: dataAlumni } = await supabase.from('alumni').select('*').eq('id', id).single();
    setAlumni(dataAlumni);
    
    const { data: dataBukti } = await supabase.from('hasil_pelacakan').select('*').eq('alumni_id', id);
    setBukti(dataBukti || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  // LOGIKA 1: Validasi Berhasil (Data Cocok)
  const handleApprove = async () => {
    const { error } = await supabase.from('alumni').update({ status_pelacakan: 'Teridentifikasi' }).eq('id', id);
    if (!error) {
      alert("Status dikonfirmasi: Teridentifikasi.");
      router.push('/daftar-alumni');
    }
  };

  // ---LOGIKA 2: Iterasi Pelacakan (Data Tidak Cocok) ---
  const handleRejectAndRefresh = async () => {
    setIsUpdating(true);
    
    try {
      // Step A: Hapus jejak lama yang dianggap salah oleh Admin
      await supabase.from('hasil_pelacakan').delete().eq('alumni_id', id);

      // Step B: Konstruksi Query Formal
      const kw1 = "Universitas Muhammadiyah Malang";
      const kw2 = "University Muhammadiyah of Malang";
      const queryFormal = `"${alumni?.nama_asli}" ("${kw1}" OR "${kw2}")`;

      // Step C: Menyiapkan Rujukan Baru ke Google Search Engine
      const searchGoogle = `https://www.google.com/search?q=${encodeURIComponent(queryFormal)}`;
      
      const sumberBaru = {
        alumni_id: id,
        sumber_temuan: "Google Search Engine (Iterasi 2)",
        link_profil: searchGoogle,
        confidence_score: 50, // Skor default untuk pencarian manual
        skor_nama: 50,
        skor_afiliasi: 0,
        kategori_hasil: 'Perlu Verifikasi Ulang'
      };

      // Step D: Masukkan sumber pelacakan baru ke database
      await supabase.from('hasil_pelacakan').insert([sumberBaru]);
      
      // Step E: Pastikan status alumni tetap/kembali ke 'Perlu Verifikasi Manual'
      await supabase.from('alumni').update({ status_pelacakan: 'Perlu Verifikasi Manual' }).eq('id', id);

      alert("Jejak lama dihapus. Sistem mengalihkan rujukan ke Google Search Engine dengan keyword formal.");
      
      // Step F: Refresh data lokal untuk memperbarui tampilan kartu bukti
      fetchData(); 
    } catch (err) {
      console.error("Gagal melakukan iterasi pelacakan:", err);
    } finally {
      setIsUpdating(false);
    }
  };
  // --- END LOGIKA ---

  if (loading) return <div className="p-10 text-center text-gray-400">Memuat analisis bukti...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push('/daftar-alumni')} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={18} /> Kembali ke Dashboard
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b bg-gradient-to-br from-blue-50 to-white">
            <h1 className="text-3xl font-black text-gray-900">{alumni?.nama_asli}</h1>
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">NIM: {alumni?.nim} • {alumni?.prodi}</p>
          </div>

          <div className="p-8 space-y-8">
            {bukti.map((item) => (
              <div key={item.id} className="space-y-6">
                <div className="bg-blue-600 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg shadow-blue-200">
                  <div>
                    <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Confidence Score</p>
                    <p className="text-5xl font-black">{item.confidence_score}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Sumber Analisis</p>
                    <p className="text-lg font-bold">{item.sumber_temuan}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-gray-100 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={18}/></div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Skor Nama</p>
                      <p className="text-lg font-black text-gray-800">{item.skor_nama}%</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><GraduationCap size={18}/></div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Skor Afiliasi</p>
                      <p className="text-lg font-black text-gray-800">{item.skor_afiliasi}%</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <h3 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Link Informasi Terdeteksi</h3>
                  <div className="space-y-3">
                    <a href={item.link_profil} target="_blank" className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-500 transition group">
                      <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 tracking-tight">Periksa Bukti Keterkaitan</span>
                      <ExternalLink size={16} className="text-gray-300 group-hover:text-blue-600" />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 pt-6 border-t">
              <button 
                onClick={handleApprove}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition shadow-lg shadow-green-100"
              >
                <Check className="inline mr-2" size={18}/> Konfirmasi Valid
              </button>
              <button 
                onClick={handleRejectAndRefresh}
                disabled={isUpdating}
                className="w-full bg-white border-2 border-red-50 text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-50 transition"
              >
                {isUpdating ? <RefreshCw className="animate-spin inline mr-2" size={18}/> : <X className="inline mr-2" size={18}/>}
                Data Salah (Cari Sumber Baru)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}