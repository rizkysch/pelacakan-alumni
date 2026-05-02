'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// 1. Definisikan Interface (Agar TypeScript tidak protes 'Property does not exist')
interface TrackingContextType {
  isBulkScanning: boolean;
  progress: number;
  currentName: string;
  runBulkScan: (targetAlumni: any[]) => Promise<void>;
}

// 2. Inisialisasi Context dengan tipe data yang benar
const TrackingContext = createContext<TrackingContextType | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [isBulkScanning, setIsBulkScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentName, setCurrentName] = useState('');

  const runBulkScan = async (targetAlumni: any[]) => {
    setIsBulkScanning(true);
    let count = 0;

    for (const alumni of targetAlumni) {
      setCurrentName(alumni.nama_asli);
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
      } catch (e) {
        console.error(e);
      }

      count++;
      setProgress(Math.round((count / targetAlumni.length) * 100));
      await new Promise(r => setTimeout(r, 800)); 
    }

    setIsBulkScanning(false);
    setProgress(0);
    setCurrentName('');
  };

  // 3. Pastikan value menggunakan double curly braces {{ }}
  return (
    <TrackingContext.Provider value={{ isBulkScanning, progress, currentName, runBulkScan }}>
      {children}
      
      {/* GLOBAL LOADING BAR */}
      {isBulkScanning && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-[9999] shadow-2xl flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 animate-pulse tracking-widest">
                Scanning: {currentName}
              </span>
              <span className="text-[10px] font-black">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </TrackingContext.Provider>
  );
}

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};