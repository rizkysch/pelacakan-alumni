'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, UserPlus, Save, Hash, GraduationCap, 
  MapPin, Calendar, FileUp, CheckCircle2 
} from 'lucide-react';

export default function InputAlumni() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    nim: '',
    nama_asli: '',
    tahun_lulus: new Date().getFullYear().toString(),
    prodi: 'Informatika', // Default 
    kota_asal: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('alumni').insert([{
      ...form,
      status_pelacakan: 'Belum Dilacak'
    }]);

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/daftar-alumni');
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-2xl mx-auto">
        {/* Header & Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition font-bold text-sm">
            <ArrowLeft size={18} /> Kembali
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden transition-all">
          <div className="p-10 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <UserPlus size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Registrasi Alumni</h1>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">Master Data Entry</p>
              </div>
            </div>
          </div>

          {success ? (
            <div className="p-20 text-center space-y-4">
              <div className="flex justify-center"><CheckCircle2 size={64} className="text-green-500 animate-bounce" /></div>
              <h2 className="text-xl font-black">Data Berhasil Disimpan!</h2>
              <p className="text-gray-400 text-sm font-medium">Mengalihkan ke dashboard pelacakan...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Field NIM */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest flex items-center gap-2">
                    <Hash size={12} /> Nomor Induk Mahasiswa
                  </label>
                  <input 
                    type="text" required placeholder="Contoh: 2023103703..."
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold transition-all"
                    value={form.nim}
                    onChange={(e) => setForm({...form, nim: e.target.value})}
                  />
                </div>

                {/* Field Tahun Lulus */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> Angkatan / Lulus
                  </label>
                  <input 
                    type="number" required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold transition-all"
                    value={form.tahun_lulus}
                    onChange={(e) => setForm({...form, tahun_lulus: e.target.value})}
                  />
                </div>
              </div>

              {/* Field Nama */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest flex items-center gap-2">
                  <UserPlus size={12} /> Nama Lengkap Sesuai Ijazah
                </label>
                <input 
                  type="text" required placeholder="Masukkan nama tanpa gelar..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold transition-all"
                  value={form.nama_asli}
                  onChange={(e) => setForm({...form, nama_asli: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Field Prodi Dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest flex items-center gap-2">
                    <GraduationCap size={12} /> Program Studi
                  </label>
                  <select 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold transition-all appearance-none"
                    value={form.prodi}
                    onChange={(e) => setForm({...form, prodi: e.target.value})}
                  >
                    <option value="Informatika">Informatika</option>
                    <option value="Teknik Sipil">Teknik Sipil</option>
                    <option value="Teknik Elektro">Teknik Elektro</option>
                    <option value="Teknik Industri">Teknik Industri</option>
                    <option value="Teknik Elektro">Teknik Mesin</option>
                  </select>
                </div>

                {/* Field Kota */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest flex items-center gap-2">
                    <MapPin size={12} /> Kota Asal
                  </label>
                  <input 
                    type="text" required placeholder="Contoh: Malang"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold transition-all"
                    value={form.kota_asal}
                    onChange={(e) => setForm({...form, kota_asal: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Data Alumni'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}