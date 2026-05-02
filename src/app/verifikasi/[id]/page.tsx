'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Linkedin, Instagram, Facebook, Globe, 
  Mail, Phone, Briefcase, Save, ExternalLink, RefreshCw, ShieldCheck
} from 'lucide-react';

export default function VerifikasiDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [alumni, setAlumni] = useState<any>(null);
  const [bukti, setBukti] = useState<any[]>([]);

  const [form, setForm] = useState({
    email: '', no_hp: '', link_linkedin: '', link_ig: '', link_fb: '', link_tiktok: '',
    tempat_kerja: '', alamat_kerja: '', posisi: '', status_pegawai: 'Swasta', sosmed_kantor: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: alumniData } = await supabase.from('alumni').select('*').eq('id', id).single();
    if (alumniData) {
      setAlumni(alumniData);
      
      const { data: buktiData } = await supabase.from('hasil_pelacakan').select('*').eq('alumni_id', id);
      setBukti(buktiData || []);

      // PREDICTIVE AUTO-FILL LOGIC
      // Mengisi form secara otomatis sebagai draf untuk di-cross check
      setForm({
        email: alumniData.email || '', 
        no_hp: alumniData.no_hp || '',
        link_linkedin: alumniData.link_linkedin || `https://www.linkedin.com/in/${alumniData.nama_asli.toLowerCase().replace(/\s/g, '')}`,
        link_ig: alumniData.link_ig || `https://www.instagram.com/${alumniData.nama_asli.toLowerCase().replace(/\s/g, '')}`,
        link_fb: alumniData.link_fb || '', 
        link_tiktok: alumniData.link_tiktok || '',
        tempat_kerja: alumniData.tempat_kerja || '', 
        alamat_kerja: alumniData.alamat_kerja || '',
        posisi: alumniData.posisi || `Alumni ${alumniData.prodi} UMM`, // Prediksi Posisi
        status_pegawai: alumniData.status_pegawai || 'Swasta',
        sosmed_kantor: alumniData.sosmed_kantor || ''
      });

      if (!buktiData || buktiData.length === 0) {
        await runMultiPlatformScan(alumniData);
      }
    }
    setLoading(false);
  };

  const runMultiPlatformScan = async (alumniObj: any) => {
    setIsScanning(true);
    const query = encodeURIComponent(`"${alumniObj.nama_asli}" "UMM"`);
    const platforms = [
      { name: "LinkedIn", url: `https://www.linkedin.com/search/results/all/?keywords=${query}` },
      { name: "Instagram", url: `https://www.google.com/search?q=site:instagram.com ${query}` },
      { name: "Facebook", url: `https://www.facebook.com/search/top/?q=${query}` },
      { name: "TikTok", url: `https://www.google.com/search?q=site:tiktok.com ${query}` }
    ];

    const insertData = platforms.map(p => ({
      alumni_id: id, sumber_temuan: p.name, link_profil: p.url, confidence_score: 50, kategori_hasil: 'Automated'
    }));

    await supabase.from('hasil_pelacakan').insert(insertData);
    const { data: newBukti } = await supabase.from('hasil_pelacakan').select('*').eq('alumni_id', id);
    setBukti(newBukti || []);
    setIsScanning(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('alumni').update({ ...form, status_pelacakan: 'Teridentifikasi' }).eq('id', id);
    if (!error) {
      alert("Cross-check Selesai! Data Berhasil Diverifikasi.");
      router.push('/daftar-alumni');
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">PREDICTING IDENTITY...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-8 font-bold text-xs uppercase tracking-widest"><ArrowLeft size={16}/> Back</button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* TRACKING REFERENCE PANEL */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6 text-blue-600">
                <ShieldCheck size={24}/> <h2 className="font-black text-xs uppercase tracking-widest">Tracking Reference</h2>
              </div>
              <div className="space-y-3">
                {bukti.map((b) => (
                  <a key={b.id} href={b.link_profil} target="_blank" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-bold text-xs uppercase group">
                    <span>Cari di {b.sumber_temuan}</span> <ExternalLink size={14}/>
                  </a>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 text-white p-8 rounded-[2rem] shadow-xl">
              <p className="text-2xl font-black">{alumni?.nama_asli}</p>
              <p className="text-blue-400 font-bold text-xs mt-1 uppercase tracking-widest">{alumni?.prodi} • {alumni?.nim}</p>
            </div>
          </div>

          {/* CROSS-CHECK FORM */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="font-black text-lg uppercase tracking-tight">Cross-Check 8 Points</h2>
                {isScanning && <RefreshCw className="animate-spin text-blue-600" size={18}/>}
              </div>
              <div className="p-10 space-y-8">
                <section className="space-y-4">
                  <h4 className="section-title"><Mail size={14}/> 1. Kontak (Email & HP)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="email" placeholder="Email" className="form-input" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                    <input type="text" placeholder="No HP/WhatsApp" className="form-input" value={form.no_hp} onChange={(e) => setForm({...form, no_hp: e.target.value})} />
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="section-title"><Globe size={14}/> 2. Digital Identity (Predictive Fill)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="LinkedIn URL" className="form-input border-blue-100 bg-blue-50/30" value={form.link_linkedin} onChange={(e) => setForm({...form, link_linkedin: e.target.value})} />
                    <input type="text" placeholder="Instagram URL" className="form-input border-blue-100 bg-blue-50/30" value={form.link_ig} onChange={(e) => setForm({...form, link_ig: e.target.value})} />
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="section-title"><Briefcase size={14}/> 3. Professional Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Tempat Kerja" className="form-input" value={form.tempat_kerja} onChange={(e) => setForm({...form, tempat_kerja: e.target.value})} />
                    <input type="text" placeholder="Posisi" className="form-input bg-blue-50/30 border-blue-100" value={form.posisi} onChange={(e) => setForm({...form, posisi: e.target.value})} />
                  </div>
                </section>

                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                  <Save size={18}/> Confirm & Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <style jsx>{`
        .section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #2563eb; }
        .form-input { width: 100%; padding: 1.25rem; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 1.25rem; outline: none; font-weight: 800; font-size: 0.75rem; transition: all 0.2s; }
        .form-input:focus { border-color: #2563eb; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      `}</style>
    </div>
  );
}