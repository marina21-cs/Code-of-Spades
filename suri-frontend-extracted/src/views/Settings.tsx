import { View } from '../types';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { ChevronRight } from 'lucide-react';

interface SettingsProps {
  navigate: (view: View) => void;
}

export function Settings({ navigate }: SettingsProps) {
  return (
    <div className="flex-1 flex flex-col bg-background h-full relative overflow-hidden">
      <TopBar title="Suri" showBack={true} backTo="chat" navigate={navigate} showSettings={true} />
      
      <main className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-32 no-scrollbar">
        {/* Page Header */}
        <div className="flex items-center gap-6 mb-2">
          <div className="w-20 h-20 rounded-full border border-outline-variant overflow-hidden bg-surface-container-low shrink-0 p-1 shadow-sm">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqwqGB5DmpaF6AyNLDmewaRbkTsB776lWri3eWRBHVjfZYQhSBy3jxePTMfwfLRvwDjOZjG-3QPVscbbMEQtneJfuwbJDSykE_PVQSTfApfWWnD9MyyWPaD08BuRNXDh7jP9dln1sA_nbt6VCXhaWcOaTBHL6rIHaGl94ujywV1sn9FNiUcaHcDaJ-j27pZ4Z_Ixy10HpmfSdZCezviiZT26fQ3AFw9vfWa5p2rVmQf4AgD7LzIskedLHAQj5EGqvW8c_FpBVpN_A" 
              alt="Profile Mascot" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h2 className="text-3xl font-display font-extrabold text-on-surface mb-1">Mga Setting</h2>
            <p className="text-sm font-sans font-medium text-on-surface-variant">Mag-aaral: Grade 6 Science</p>
          </div>
        </div>

        {/* Sync Action */}
        <button 
          onClick={() => navigate('sync')}
          className="w-full bg-primary-container/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between hover:bg-primary-container/20 transition-colors"
        >
          <span className="font-sans font-semibold text-primary">I-sync ang Progress</span>
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>

        {/* Group 1: Suri's Style */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-outline-variant bg-surface-container-low/30">
            <h3 className="text-xl font-display font-bold text-on-surface">Paraan ng Pagpapaliwanag</h3>
            <p className="text-xs font-sans text-on-surface-variant mt-1">Paano mo gustong matuto?</p>
          </div>
          <div className="p-5">
            <div className="flex bg-surface-container rounded-xl p-1.5 gap-1">
              {['Visual', 'Teksto', 'Boses', 'Mixed'].map((mode, i) => (
                <button 
                  key={mode}
                  className={`flex-1 py-2.5 px-2 text-sm font-sans font-semibold rounded-lg transition-all text-center min-h-[44px] flex items-center justify-center ${
                    i === 0 ? 'bg-primary-container text-on-primary-container shadow-md' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Group 2: Accessibility */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-outline-variant bg-surface-container-low/30">
            <h3 className="text-xl font-display font-bold text-on-surface">Accessibility</h3>
            <p className="text-xs font-sans text-on-surface-variant mt-1">Ibagay ang Suri sa iyong pangangailangan</p>
          </div>
          
          <div className="flex flex-col divide-y divide-outline-variant">
            
            {/* Row 1: Reader Font */}
            <div className="p-5 flex justify-between items-center min-h-[72px]">
              <div className="pr-4">
                <p className="text-lg font-sans font-medium text-on-surface" style={{ fontFamily: "'Comic Sans MS', sans-serif" }}>Reader Font</p>
                <p className="text-xs font-sans text-on-surface-variant mt-1">Gamitin ang OpenDyslexic font</p>
              </div>
              <div className="w-14 h-8 bg-primary rounded-full relative shrink-0 shadow-inner">
                <div className="absolute right-1 top-1 w-6 h-6 bg-on-primary rounded-full shadow-sm"></div>
              </div>
            </div>
            
            {/* Row 2: Kulay ng Diagram */}
            <button className="p-5 flex justify-between items-center min-h-[72px] hover:bg-surface-container-low transition-colors w-full text-left">
              <div className="flex flex-col pr-4">
                <span className="text-lg font-sans text-on-surface">Kulay ng Diagram</span>
                <p className="text-xs font-sans text-on-surface-variant mt-1">Ibagay ang mga kulay para sa color blindness</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="bg-secondary-container text-on-secondary-container text-sm font-sans font-semibold px-4 py-1.5 rounded-full">Deuteranopia</span>
                <ChevronRight className="w-5 h-5 text-on-surface-variant" />
              </div>
            </button>
            
            {/* Row 3: Focus Mode */}
            <div className="p-5 flex justify-between items-center min-h-[72px]">
              <div className="pr-4">
                <p className="text-lg font-sans text-on-surface">Focus Mode</p>
                <p className="text-xs font-sans text-on-surface-variant mt-1">Bawasan ang mga abala sa screen</p>
              </div>
              <div className="w-14 h-8 bg-primary rounded-full relative shrink-0 shadow-inner">
                <div className="absolute right-1 top-1 w-6 h-6 bg-on-primary rounded-full shadow-sm"></div>
              </div>
            </div>

            {/* Row 4: Low Motion */}
            <div className="p-5 flex justify-between items-center min-h-[72px]">
              <div className="pr-4">
                <p className="text-lg font-sans text-on-surface">Low Motion</p>
                <p className="text-xs font-sans text-on-surface-variant mt-1">Pigilan ang mga animations</p>
              </div>
              <div className="w-14 h-8 bg-surface-variant border border-outline-variant rounded-full relative shrink-0 shadow-inner">
                <div className="absolute left-1 top-1 w-6 h-6 bg-outline rounded-full shadow-sm"></div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <BottomNav currentView="settings" navigate={navigate} />
    </div>
  );
}
