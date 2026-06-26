import { View } from '../types';
import { ArrowLeft, User, Check, Loader2 } from 'lucide-react';

interface SyncProps {
  navigate: (view: View) => void;
}

export function Sync({ navigate }: SyncProps) {
  return (
    <div className="h-full w-full relative overflow-hidden font-sans bg-surface">
      {/* Blurred Dashboard Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none filter blur-sm">
        <header className="w-full bg-background border-b border-outline-variant flex justify-between items-center px-4 h-16">
          <ArrowLeft className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-display font-bold text-primary">Sync Hub</h1>
          <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center">
            <User className="w-5 h-5 text-on-surface-variant" />
          </div>
        </header>
        <main className="p-6 grid grid-cols-1 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
            <h2 className="text-xl font-display mb-4">Huling Aktibidad</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-surface-variant">
                <span>Aklatan: Mga Alamat</span>
                <span className="text-primary font-medium">Kagabi</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span>Pagsusulit: Wika</span>
                <span className="text-primary font-medium">2 araw</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Active Modal Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-on-background/30 backdrop-blur-md p-4">
        
        <div className="glass-panel rounded-[2.5rem] w-[90%] max-w-[360px] relative flex flex-col items-center p-8 shadow-2xl border border-white/60">
          
          {/* Floating Mascot */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 z-10 flex items-end justify-center animate-float">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5tD85XRB9C6EQOQoq9LR7on_SlJRkkY1M7Co-KQQVaTd_OszIOpY_HZ0GaMm1SPG92P1OR-ibLGG2sY7f8OW5DrNxS9Ia3qqeTbvQjk2r5vX0k-5RcDMdKHO5rDgb32aGkIKiX5AixmCUmUirqdImphsBoKRLGX-5t-RrHVstWkOYvWyIxGVGe-0EZEq_asr1T2ZNqe51ndTPDgH40B6AKkmX_8JJCy-jIqR3Yn--yaML5ttPrA1llNjR6RqbGh7XmH_KBeBDi-s" 
              alt="Mascot Sync" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col items-center text-center w-full mt-10">
            
            {/* Animated Sync Ring */}
            <div className="relative w-20 h-20 mb-8">
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary"></circle>
              </svg>
              <svg className="absolute inset-0 w-full h-full text-primary animate-spin-slow blur-[1px]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="100 200" strokeLinecap="round"></circle>
              </svg>
              <svg className="absolute inset-0 w-full h-full text-primary animate-spin-slow" viewBox="0 0 100 100" style={{ animationDirection: 'reverse', animationDuration: '4s' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="120 180" strokeLinecap="round"></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-display font-extrabold text-on-surface mb-3 tracking-tight leading-snug">
              Sinisync ang iyong<br/>progress...
            </h2>
            <p className="text-sm font-sans text-on-surface-variant mb-8 opacity-90">
              Sandali lamang, inaayos namin<br/>ang iyong mga tala.
            </p>

            {/* Sync Checklist */}
            <div className="w-full space-y-5 bg-white/60 p-5 rounded-3xl border border-outline-variant/40 shadow-inner backdrop-blur-md">
              {/* Done */}
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30">
                  <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-sans font-bold text-on-surface">Checking for updates</span>
                  <span className="text-xs font-sans text-on-surface-variant opacity-80">Curriculum data verified</span>
                </div>
              </div>
              
              {/* In Progress */}
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-sans font-bold text-on-surface">Uploading results</span>
                  <span className="text-xs font-sans font-semibold text-primary">Syncing assessment data...</span>
                </div>
              </div>
              
              {/* Pending */}
              <div className="flex items-center gap-4 opacity-40">
                <div className="shrink-0 w-7 h-7 rounded-full border-2 border-outline-variant flex items-center justify-center">
                  <div className="w-2 h-2 bg-outline-variant rounded-full"></div>
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-sans font-bold text-on-surface">Downloading badges</span>
                  <span className="text-xs font-sans text-on-surface-variant">Waiting to start</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('settings')}
              className="w-full py-4 px-6 rounded-full border-2 border-primary/30 text-primary font-sans font-bold text-lg hover:bg-primary/10 transition-colors bg-white/70 backdrop-blur-md shadow-sm mt-8 active:scale-95"
            >
              Bumalik muna
            </button>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-primary-fixed-dim via-primary to-primary-container opacity-60 rounded-b-[2.5rem]"></div>
        </div>
      </div>
    </div>
  );
}
