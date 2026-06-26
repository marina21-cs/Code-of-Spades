import { View } from '../types';
import { ArrowLeft, Settings, CheckCircle2, QrCode, School, Mic, BookOpen, Globe, Award } from 'lucide-react';

interface StreakProps {
  navigate: (view: View) => void;
}

export function Streak({ navigate }: StreakProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#FAF8F5] h-full font-sans text-on-background relative overflow-hidden">
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-40 w-full">
        <div className="flex justify-between items-center px-4 py-3 w-full">
          <button 
            onClick={() => navigate('library')}
            className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBL97-ROHkKLMXpo-7GkpHvRX311SnigJa6FqUm2Vt4JNy8tz3DAPRBWAG1oPFlzfnQCSOX-GHJi5CzuyKEOmHNScUU_EotQzomyKqWh6V6bFuzw_etcsWXpEkRScVXmsllqtPSPUa1Hj6Vw4ftJngrgesg6naYg537vRD5UoPfcHsj0ZCMVXbL3PlWpB7BaidP4gRsOgzwezVjE5AEdXAcXxy6B0VsSlS2-7aNjAg1wEVZ_l1xZcYfcY0QszEs36ueknUJw-VEOmY" alt="Suri Avatar" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-display font-bold text-primary tracking-tight">Suri</h1>
          </div>
          <button 
            onClick={() => navigate('settings')}
            className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center active:scale-95"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto px-6 pt-6 pb-20 w-full flex flex-col gap-8 no-scrollbar">
        {/* Streak Hero */}
        <section className="bg-white/70 backdrop-blur-md rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border border-[#E5E0DA] shadow-sm">
          <h2 className="text-2xl font-display font-bold text-on-surface mb-4 z-10">Iyong Streak</h2>
          <div className="flex items-end justify-center gap-2 mb-4 z-10">
            <span className="text-6xl font-display font-extrabold text-primary leading-none">5</span>
            <span className="text-xl font-display font-bold text-on-surface-variant pb-1">Araw</span>
          </div>
          <p className="text-sm font-sans text-on-surface-variant mb-6 z-10 max-w-[240px]">
            Magaling! Ipagpatuloy ang pag-aaral araw-araw para lumaki si Suri.
          </p>
          <div className="relative flex items-center justify-center z-10 w-full h-48 mt-2">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwG1_HhrsyhJV9lsVVFeWfLhbe5WHR4f0gtGV_sQyj9IeT5WHhgXeFfI1OTc4wNztXJvre7JKJesBlJax7NzprYPW94NA_YAEb__YvPj5_SQjXqETIYKoUVxor2uPhV15MxuV4xhfbdmVgdcEG8vAKe0JzkTbHhFn3nEcJxAFvLchrEAe5oZnce_Fgnda-cdItalcZ-VI_TJ93nHiC8SkhUBLlyQ91eHIe0EL83legozaWB70d8Wndu2H6Ze3viRBVaL7iVps3yik" 
              alt="Happy Suri" 
              className="w-40 h-auto object-contain relative z-20 animate-float"
            />
          </div>
        </section>

        {/* Evolution Milestone */}
        <section 
          onClick={() => navigate('evolution')}
          className="bg-surface-container rounded-3xl p-6 border border-outline-variant shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
        >
          <h3 className="text-xl font-display font-bold text-on-surface mb-4">Susunod na Anyo</h3>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-surface border border-outline-variant flex items-center justify-center overflow-hidden grayscale opacity-50 shrink-0">
              <span className="text-2xl">🦊</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-sans font-bold text-on-surface">Tinedyer na Suri</p>
              <p className="text-sm font-sans text-on-surface-variant mt-1">2 araw pa</p>
            </div>
          </div>
          <div className="w-full h-3 bg-[#F1ECE1] rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-[71%] transition-all duration-1000 ease-out"></div>
          </div>
        </section>

        {/* Badges */}
        <section className="flex flex-col gap-6">
          <div className="flex justify-between items-end px-2">
            <h2 className="text-2xl font-display font-bold text-on-surface">Talaan ng mga Badge</h2>
            <span className="text-sm font-sans font-bold text-primary">3/12 Nakuha</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Badge 1 */}
            <div className="bg-white/70 backdrop-blur-md border border-primary/20 rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2 aspect-square relative shadow-sm">
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="w-5 h-5 text-primary fill-current" />
              </div>
              <div className="w-14 h-14 rounded-full bg-tertiary-fixed flex items-center justify-center mb-1">
                <QrCode className="w-7 h-7 text-tertiary" />
              </div>
              <h4 className="text-sm font-sans font-bold text-on-surface leading-tight">First Scan</h4>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight">Nag-scan ng unang bagay</p>
            </div>
            
            {/* Badge 2 */}
            <div className="bg-white/70 backdrop-blur-md border border-primary/20 rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2 aspect-square relative shadow-sm">
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="w-5 h-5 text-primary fill-current" />
              </div>
              <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center mb-1">
                <School className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-sm font-sans font-bold text-on-surface leading-tight">Quiz Master</h4>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight">Tumama ng 5 magkakasunod</p>
            </div>

            {/* Badge 3 */}
            <div className="bg-white/70 backdrop-blur-md border border-primary/20 rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2 aspect-square relative shadow-sm">
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="w-5 h-5 text-primary fill-current" />
              </div>
              <div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center mb-1">
                <Mic className="w-7 h-7 text-secondary" />
              </div>
              <h4 className="text-sm font-sans font-bold text-on-surface leading-tight">Voice Explorer</h4>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight">Gumamit ng voice chat</p>
            </div>

            {/* Badge 4: Locked */}
            <div className="bg-[#F1ECE1] rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2 aspect-square border border-outline-variant/50 opacity-60">
              <div className="w-14 h-14 rounded-full bg-surface border border-outline-variant flex items-center justify-center mb-1 grayscale">
                <BookOpen className="w-7 h-7 text-outline" />
              </div>
              <h4 className="text-sm font-sans font-bold text-on-surface leading-tight">Bookworm</h4>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight">Magbasa ng 10 kwento</p>
            </div>

            {/* Badge 5: Locked */}
            <div className="bg-[#F1ECE1] rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2 aspect-square border border-outline-variant/50 opacity-60">
              <div className="w-14 h-14 rounded-full bg-surface border border-outline-variant flex items-center justify-center mb-1 grayscale">
                <Globe className="w-7 h-7 text-outline" />
              </div>
              <h4 className="text-sm font-sans font-bold text-on-surface leading-tight">World Traveler</h4>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight">Tuklasin ang 5 lugar</p>
            </div>

            {/* Badge 6: Locked */}
            <div className="bg-[#F1ECE1] rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2 aspect-square border border-outline-variant/50 opacity-60">
              <div className="w-14 h-14 rounded-full bg-surface border border-outline-variant flex items-center justify-center mb-1 grayscale">
                <Award className="w-7 h-7 text-outline" />
              </div>
              <h4 className="text-sm font-sans font-bold text-on-surface leading-tight">Perfect Week</h4>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight">7-araw na streak</p>
            </div>
          </div>
          
          <button className="w-full py-4 mt-2 bg-surface border border-outline-variant rounded-full text-on-surface font-sans font-bold text-base hover:bg-surface-container transition-colors text-center shadow-sm">
            Tingnan Lahat
          </button>
        </section>
      </main>
    </div>
  );
}
