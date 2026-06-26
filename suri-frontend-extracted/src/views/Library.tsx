import { View } from '../types';
import { Menu, MessageCircle, Library as LibraryIcon, HelpCircle, BarChart3, CloudOff, ArrowRight, ScanLine, FileText, Image, Zap } from 'lucide-react';

interface LibraryProps {
  navigate: (view: View) => void;
}

export function Library({ navigate }: LibraryProps) {
  return (
    <div className="flex-1 flex flex-col bg-background h-full relative overflow-hidden">
      <header className="bg-surface border-b border-outline-variant z-40 sticky top-0">
        <div className="flex justify-between items-center px-4 py-3 w-full">
          <button className="text-primary hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center">
            <Menu className="w-6 h-6" />
          </button>
          
          <h1 className="text-2xl font-display font-bold text-primary tracking-tight">Suri</h1>
          
          <button 
            onClick={() => navigate('settings')}
            className="rounded-full overflow-hidden border border-outline-variant w-8 h-8 hover:opacity-80 transition-opacity"
          >
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqwqGB5DmpaF6AyNLDmewaRbkTsB776lWri3eWRBHVjfZYQhSBy3jxePTMfwfLRvwDjOZjG-3QPVscbbMEQtneJfuwbJDSykE_PVQSTfApfWWnD9MyyWPaD08BuRNXDh7jP9dln1sA_nbt6VCXhaWcOaTBHL6rIHaGl94ujywV1sn9FNiUcaHcDaJ-j27pZ4Z_Ixy10HpmfSdZCezviiZT26fQ3AFw9vfWa5p2rVmQf4AgD7LzIskedLHAQj5EGqvW8c_FpBVpN_A" alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto px-6 pt-10 pb-32 w-full flex flex-col items-center no-scrollbar">
        <section className="mb-10 w-full text-center flex flex-col items-center">
          <div className="relative w-full flex justify-center mb-6">
            <div className="animate-float relative z-10 w-44 h-44 flex items-center justify-center">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCThRgTmchNhIp9rzYQbYnbVvk_TwFGmNRN2S_S4o6SV2-GMqbgn5Ca9enI_xb9wa9q5d1nF4UxOyfJSRne4P6Q5plMJjtgKhJfPthumEv3jRkoczCJ8dC7fz2EK__JBoTzygCGwbWhIUcvOGtwucbWBfFgo2i2_-ISeFOfmtNyWEIi9FvjC5Rt1mzpg4VLIUx-p3tB_7jkRjUp0sVp6yqxoiwdNMIcXmd3N_CojtZBWGE3PvQAn_86LvwVD-JIN70_dGZ0NtHXvpg" 
                alt="Suri Mascot" 
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-4xl font-display font-extrabold text-on-surface">Aklatan</h2>
            <p className="font-sans text-base text-on-surface-variant mt-2 max-w-xs">
              Your personal library of curriculum materials and uploaded notes, ready for offline review.
            </p>
          </div>
          
          <div className="bg-surface-container-lowest border border-surface-dim rounded-full px-5 py-2.5 flex items-center justify-center gap-3 w-fit mx-auto shadow-sm">
            <CloudOff className="w-5 h-5 text-tertiary" />
            <div className="text-left flex items-center gap-2">
              <span className="text-sm font-sans font-bold text-on-surface">100% Offline Ready</span>
              <span className="text-xs font-sans text-on-surface-variant font-medium">• 142MB</span>
            </div>
          </div>
        </section>

        <section className="mb-10 w-full flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-display font-bold text-on-surface">Curriculum Content</h3>
            <button className="text-sm font-sans font-bold text-primary hover:underline">View All</button>
          </div>
          
          <div className="flex overflow-x-auto no-scrollbar -mx-6 px-6 gap-4 snap-x pb-2">
            {[
              { title: 'Grade 6 Science', desc: 'Matter, Living Things, and Environment.', melcs: 24, route: 'subject' },
              { title: 'Grade 6 Math', desc: 'Fractions, Decimals, and Geometry.', melcs: 18, route: 'subject' },
              { title: 'Grade 6 AP', desc: 'Philippine History and Government.', melcs: 30, route: 'subject' },
            ].map((subject, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(subject.route as View)}
                className="bg-surface-container-lowest border border-surface-dim rounded-3xl p-6 min-w-[280px] snap-start flex flex-col gap-6 relative overflow-hidden group hover:border-primary/30 transition-colors cursor-pointer shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="bg-surface-container-high p-3 rounded-xl inline-flex text-on-surface-variant">
                    <LibraryIcon className="w-6 h-6" />
                  </div>
                  <span className="bg-secondary-container/50 text-on-secondary-container text-xs font-sans font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    Ready
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-display font-bold text-on-surface leading-tight">{subject.title}</h4>
                  <p className="text-base font-sans text-on-surface-variant mt-1">{subject.desc}</p>
                </div>
                <div className="mt-auto pt-4 border-t border-surface-variant flex justify-between items-center text-on-surface-variant">
                  <span className="text-sm font-sans font-semibold">{subject.melcs} MELCs</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-2xl font-display font-bold text-on-surface">Personal Reviewers</h3>
            <div className="bg-surface-container-lowest border border-surface-dim rounded-3xl overflow-hidden shadow-sm flex flex-col">
              {[
                { icon: ScanLine, title: 'Science Worksheet Q1', meta: 'Scanned OCR • Added Today' },
                { icon: FileText, title: 'Math Notes - Fractions', meta: 'Typed Text • 2 days ago' },
                { icon: Image, title: 'History Module Page 42', meta: 'Photo • Last week' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-5 border-b border-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">
                  <div className="bg-surface-container-high text-on-surface-variant p-3 rounded-xl shrink-0">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-display font-bold text-on-surface truncate">{item.title}</h4>
                    <p className="text-sm font-sans text-on-surface-variant mt-0.5">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-2xl font-display font-bold text-on-surface">Recent AI Cache</h3>
            <div className="flex flex-col gap-4">
              {[
                '"Ano ang photosynthesis at paano ito nangyayari sa mga halaman?"',
                '"Explain the steps in dividing fractions with examples."'
              ].map((q, i) => (
                <div key={i} className="bg-surface-container-lowest border border-surface-dim rounded-3xl p-6 hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
                  <h4 className="text-base font-sans font-medium text-on-surface line-clamp-3">{q}</h4>
                  <div className="flex items-center gap-1.5 mt-3 text-tertiary">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-sans font-bold">Available Offline</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <div className="absolute bottom-[88px] right-6 z-40">
        <button className="bg-primary text-on-primary rounded-full p-4 flex items-center justify-center shadow-lg hover:bg-primary-container transition-all active:scale-95">
          <ScanLine className="w-7 h-7" />
        </button>
      </div>

      <div className="fixed sm:absolute bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant flex justify-around items-center pt-2 pb-4 px-2 rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate('chat')} className="flex flex-col items-center justify-center text-on-surface-variant w-16 py-2 transition-colors hover:text-primary">
          <MessageCircle className="w-6 h-6 mb-1" />
          <span className="text-xs font-sans font-semibold">Suri</span>
        </button>
        <button onClick={() => navigate('library')} className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-6 py-2 transition-all scale-100">
          <LibraryIcon className="w-6 h-6 mb-1 fill-current" />
          <span className="text-xs font-sans font-bold">Aklatan</span>
        </button>
        <button onClick={() => navigate('quizHub')} className="flex flex-col items-center justify-center text-on-surface-variant w-16 py-2 transition-colors hover:text-primary">
          <HelpCircle className="w-6 h-6 mb-1" />
          <span className="text-xs font-sans font-semibold">Pagsusulit</span>
        </button>
        <button onClick={() => navigate('evolution')} className="flex flex-col items-center justify-center text-on-surface-variant w-16 py-2 transition-colors hover:text-primary">
          <BarChart3 className="w-6 h-6 mb-1" />
          <span className="text-xs font-sans font-semibold">Gabay</span>
        </button>
      </div>
    </div>
  );
}
