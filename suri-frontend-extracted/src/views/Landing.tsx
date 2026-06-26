import { View } from '../types';
import { Leaf, WifiOff, Eye, Ear, Pointer, Accessibility, Download } from 'lucide-react';

interface LandingProps {
  navigate: (view: View) => void;
}

export function Landing({ navigate }: LandingProps) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-8 bg-background">
      <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/50 flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-primary fill-current" />
          <span className="text-2xl font-display font-bold text-primary">Suri</span>
        </div>
        <button className="text-primary font-sans font-medium px-4 py-2 rounded-full hover:bg-surface-container-low transition-colors">
          About
        </button>
      </header>

      <main className="px-6 py-8 space-y-10">
        {/* Hero */}
        <section className="flex flex-col items-center text-center space-y-4 animate-float-slow">
          <div className="w-48 h-48 mb-2">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdeoz2O5C7NLlfLxvIAytBqdJna53EPFn_6EDnhzs8xX_zozIFx-8Sh4WboBK6VnTx6K7uVh8JyPXctBBzhDTopzB0qKPOuSWnd_me55NU4l4WDclRkcWlM9if5kL79ezevMJVGcsf1NrtMbXqhezXxCoC7dcAA7xoehch0O2Ck_cWBTfZMwsMDbXp9repDuHb0qB0dZLADqD--_x8JUJxkOzORzCgWstNIPlLB9AUV8zjN9GH_tKWk-JxFC9Q4Rm57EonGb58t9c" 
              alt="Suri Mascot" 
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-on-surface leading-tight tracking-tight">
            Matalinong kasama sa pag-aaral, kahit walang internet.
          </h1>
          <p className="text-lg font-sans text-on-surface-variant max-w-sm">
            Ang iyong kaibigan sa pagkatuto, handang tumulong anumang oras, saanman.
          </p>
          <button 
            onClick={() => navigate('onboarding')}
            className="w-full max-w-[240px] bg-gradient-to-b from-primary to-[#c8552b] text-on-primary py-4 rounded-full font-sans font-medium text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all mt-4"
          >
            Simulan na
          </button>
        </section>

        {/* Offline Value Prop */}
        <section className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/50 flex flex-col items-start gap-4 glass">
          <div className="bg-surface-container p-4 rounded-2xl">
            <WifiOff className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-on-surface">Zero Signal,<br/>Full Power.</h2>
          <p className="text-base font-sans text-on-surface-variant">
            Gumagana ang AI tutoring ng 100% offline pagkatapos ng unang download. Walang data? Walang kuryente? Patuloy ang pagkatuto kasama si Suri.
          </p>
        </section>

        {/* Adaptive Learning */}
        <section className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/50 flex flex-col gap-6 shadow-sm">
          <h3 className="text-xl font-display font-bold text-on-surface">Umaangkop sa Iyong Estilo</h3>
          
          <div className="flex items-center gap-4">
            <div className="bg-surface-container-high p-3 rounded-xl text-on-surface">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-medium text-on-surface">Visual</h4>
              <p className="text-sm font-sans text-on-surface-variant">Mga malinaw na diagram at layout.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-surface-container-high p-3 rounded-xl text-on-surface">
              <Ear className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-medium text-on-surface">Auditory</h4>
              <p className="text-sm font-sans text-on-surface-variant">Text-to-speech na nagbabasa ng aralin.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-surface-container-high p-3 rounded-xl text-on-surface">
              <Pointer className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-medium text-on-surface">Kinesthetic</h4>
              <p className="text-sm font-sans text-on-surface-variant">Interactive na pagsusulit at gawain.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-8 flex flex-col items-center text-center space-y-6">
          <h2 className="text-2xl font-display font-bold text-on-surface px-4">
            Handa na para sa bagong paraan ng pag-aaral?
          </h2>
          <button 
            onClick={() => navigate('chat')}
            className="w-full bg-primary-container text-on-primary-container py-4 rounded-full font-sans font-semibold text-lg shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Download className="w-6 h-6" />
            I-download ang APK
          </button>
          <span className="text-xs font-sans text-on-surface-variant opacity-75">v1.0 • Android 8.0+ Required</span>
        </section>
      </main>
    </div>
  );
}
