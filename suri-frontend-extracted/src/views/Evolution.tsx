import { View } from '../types';
import { ArrowLeft, Settings, CheckCircle } from 'lucide-react';

interface EvolutionProps {
  navigate: (view: View) => void;
}

export function Evolution({ navigate }: EvolutionProps) {
  return (
    <div className="flex-1 flex flex-col bg-background h-full font-sans text-on-background relative overflow-hidden">
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-40 w-full transition-colors duration-200">
        <div className="flex justify-between items-center px-4 py-3 w-full">
          <button 
            onClick={() => navigate('syncDashboard')}
            className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-display font-bold text-primary tracking-tight">Suri</h1>
          <button className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center active:scale-95">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto px-6 pt-8 pb-10 w-full no-scrollbar">
        <div className="text-center flex flex-col items-center gap-2 mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container/20 text-primary mb-2">
            <CheckCircle className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-3xl font-display font-extrabold text-on-surface">Ebolusyon ni Suri</h2>
          <p className="text-base font-sans text-on-surface-variant max-w-[280px]">
            Lumalakas at mas nagiging mausisa. Handang tuklasin ang mundo ng karunungan.
          </p>
        </div>

        {/* Current Active Stage */}
        <section className="bg-surface-container-lowest border border-surface-dim rounded-3xl p-6 flex flex-col gap-6 relative overflow-hidden shadow-sm mb-10 pb-8">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-fixed-dim opacity-30 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10 flex-col">
            <div className="w-full flex justify-center mb-6 relative">
              <div className="absolute top-1/2 left-1/2 bg-primary-fixed rounded-full blur-2xl animate-gentle-glow -z-10 w-[250px] h-[250px]" style={{ transform: 'translate(-50%, -50%)' }}></div>
              <div className="animate-float relative z-10 flex items-center justify-center w-[250px] h-[250px]">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwhEazTtLgD4UQLTGXwuu3TB4h4fN3wtkir6CDR02pRYC5xKKECNPyJs_pHbuFU0-4OGqZBpG4NfN6a2nTuBLM3hWHX1lMzpDs83vEoY01gGd7xo4qdAJ-8ASgAC9DqpW-5VAuUNXqb4tPF5-3hJYjILC-S6Zn1acXwR2HPg4Hi-HCeX2Lpbzo9VT9dFZl4cPYSpsDTyEjETSxwuLHVF6gPn-ehz_vLel4ljEOGEB7WZKLfotWLRNv8LH158aEoxgXMVeNSk5Raqo" 
                  alt="Batang Suri" 
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
            </div>
            <div className="flex flex-col text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <h3 className="text-2xl font-display font-bold text-on-surface">Batang Suri</h3>
                <CheckCircle className="w-6 h-6 text-primary fill-current" />
              </div>
              <p className="text-sm font-sans font-bold text-on-surface-variant uppercase tracking-widest">Kasalukuyang Anyo</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4 relative z-10 bg-surface px-5 py-4 rounded-2xl border border-surface-dim">
            <div className="flex justify-between items-end mb-2 gap-4">
              <span className="text-sm font-sans font-bold text-on-surface-variant flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary inline-block"></span>
                Study Streak
              </span>
              <span className="text-xl font-display font-bold text-primary">14 <span className="text-sm font-sans font-medium text-on-surface-variant">/ 30 araw</span></span>
            </div>
            <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/30">
              <div className="h-full bg-primary rounded-full relative overflow-hidden w-[46%]"></div>
            </div>
            <p className="text-xs font-sans font-medium text-secondary text-right mt-2">16 na araw na lang para sa susunod na anyo!</p>
          </div>
        </section>

        {/* Timeline */}
        <section className="flex flex-col relative mt-6 pl-4">
          <div className="absolute left-[36px] top-6 bottom-12 w-0.5 bg-surface-variant z-0 rounded-full"></div>
          
          <div className="flex items-start gap-5 relative z-10 mb-8">
            <div className="w-14 h-14 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center shrink-0 border-[6px] border-background">
              <CheckCircle className="w-6 h-6 fill-current text-primary" />
            </div>
            <div className="flex-1 bg-surface-container-low border border-surface-dim rounded-2xl p-5">
              <h4 className="text-lg font-display font-bold text-on-surface mb-1">Munting Suri</h4>
              <p className="text-sm font-sans text-on-surface-variant">Nakumpleto na ang unang yugto!</p>
            </div>
          </div>

          <div className="flex items-start gap-5 relative z-10 mb-8">
            <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 border-[6px] border-background shadow-sm ring-2 ring-primary/20">
              <div className="w-4 h-4 bg-primary rounded-full"></div>
            </div>
            <div className="flex-1 bg-surface-container-lowest border-2 border-primary/30 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-2 mb-3">
                <h4 className="text-lg font-display font-bold text-on-surface">Batang Suri</h4>
                <span className="text-[10px] font-sans font-bold bg-primary text-on-primary px-3 py-1 rounded-full w-fit uppercase tracking-wider">Kasalukuyan</span>
              </div>
              <p className="text-sm font-sans text-on-surface-variant leading-relaxed">
                Lumalakas at mas nagiging mausisa. Handang tuklasin ang mundo ng karunungan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-5 relative z-10 opacity-60">
            <div className="w-14 h-14 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center shrink-0 border-[6px] border-background">
              <div className="w-3 h-3 border-2 border-secondary rounded-full"></div>
            </div>
            <div className="flex-1 bg-surface-container-low border border-surface-dim rounded-2xl p-5">
              <div className="flex flex-col gap-2 mb-3">
                <h4 className="text-lg font-display font-bold text-on-surface">Matandang Suri</h4>
                <span className="text-[10px] font-sans font-semibold bg-surface-dim text-on-surface-variant px-3 py-1 rounded-full border border-outline-variant/50 w-fit">30-ARAW STREAK</span>
              </div>
              <p className="text-sm font-sans text-on-surface-variant mb-4 leading-relaxed">
                Puno ng kaalaman at karunungan. Isang tunay na gabay at eksperto sa pag-aaral.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
