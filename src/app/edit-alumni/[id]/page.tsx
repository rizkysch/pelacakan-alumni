'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

export default function EditAlumni() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nim: '',
    nama_asli: '',
    tahun_lulus: '',
    prodi: '',
    kota_asal: ''
  });

  // Ambil data lama saat halaman dimuat
  useEffect(() => {
    const fetchExistingData = async () => {
      const { data, error } = await supabase.from('alumni').select('*').eq('id', id).single();
      if (data) setForm(data);
      setLoading(false);
    };
    fetchExistingData();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // LOGIKA KRUSIAL: Update data & Reset Pelacakan
    // 1. Update data di tabel 'alumni'
    const { error: updateError } = await supabase
      .from('alumni')
      .update({
        ...form,
        status_pelacakan: 'Belum Dilacak' // Reset status
      })
      .eq('id', id);

    if (!updateError) {
      // 2. Hapus bukti lama di tabel 'hasil_pelacakan'
      await supabase.from('hasil_pelacakan').delete().eq('alumni_id', id);
      
      alert("Data berhasil diperbarui. Status pelacakan telah di-reset.");
      router.push('/daftar-alumni');
    }
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={18} /> Batal
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b bg-yellow-50/50 flex items-center gap-3">
            <AlertTriangle className="text-yellow-600" size={24} />
            <div>
              <h1 className="text-2xl font-black text-gray-900">Edit Data Alumni</h1>
              <p className="text-xs text-yellow-700 font-bold">Perubahan data akan me-reset hasil pelacakan sebelumnya.</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Nama Lengkap</label>
              <input 
                type="text" 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold"
                value={form.nama_asli}
                onChange={(e) => setForm({...form, nama_asli: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">NIM</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold"
                  value={form.nim}
                  onChange={(e) => setForm({...form, nim: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tahun Lulus</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold"
                  value={form.tahun_lulus}
                  onChange={(e) => setForm({...form, tahun_lulus: e.target.value})}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition shadow-lg shadow-blue-100"
            >
              <Save className="inline mr-2" size={18} /> Simpan Perubahan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}