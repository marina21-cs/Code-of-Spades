import { View } from '../types';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { TreePine, Globe, Calculator, Languages } from 'lucide-react';

interface QuizHubProps {
  navigate: (view: View) => void;
}

export function QuizHub({ navigate }: QuizHubProps) {
  return (
    <div className="flex-1 flex flex-col bg-background h-full relative overflow-hidden">
      <TopBar title="Suri" showBack={false} onSettings={() => navigate('settings')} />
      
      <main className="flex-1 overflow-y-auto px-5 pt-8 pb-32 no-scrollbar space-y-12">
        
        {/* Header Section */}
        <section className="flex flex-col-reverse items-center justify-between gap-6 bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-sm">
          <div className="space-y-2 text-center flex-1">
            <h2 className="text-4xl font-display font-extrabold text-on-surface">Pagsusulit</h2>
            <p className="text-lg font-sans text-on-surface-variant">Subukan ang iyong kaalaman.</p>
          </div>
          <div className="w-32 h-32 flex items-center justify-center shrink-0">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvUr9s21paiOm0hVPaXQ6Z5lG6_M1nMHEslInZbBf9gxEa_8JFCVwEbchpBsWyaHPr6A3kQezA1eKjRW6szgR1PTlu7hyn_yNNduKN_L5XZZqa-21b3htxota003sCdJYeq9E0DaEpnUaseeeF4NfbradwJ7rdo7jJYOgROiWNCG_1TBk-iY42uVWYg8FO-sh7N94kUEHiEnzty7rUjacjLZ62LTEcaPIfvO4SU0OcSEigbA2O-IZXTthVsbHf8wO0lCTkq3yEYnI" 
              alt="Mascot Quiz" 
              className="w-full h-full object-contain animate-float"
            />
          </div>
        </section>

        {/* Active Quiz */}
        <section className="space-y-4">
          <h3 className="text-2xl font-display font-bold text-on-surface px-2">Aktibong Pagsusulit</h3>
          
          <div 
            onClick={() => navigate('quizQuestion')}
            className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 space-y-6 hover:bg-surface-container-low transition-colors cursor-pointer group shadow-sm"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-surface-container rounded-lg text-xs font-sans font-bold text-on-surface-variant uppercase tracking-widest">Agham</span>
                <h4 className="text-xl font-display font-bold text-on-surface leading-tight">Science:<br/>Photosynthesis</h4>
              </div>
              <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                <TreePine className="w-7 h-7" />
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-sm font-sans font-medium text-on-surface-variant">
                <span>2/10 na tanong</span>
                <span className="text-primary font-bold">20%</span>
              </div>
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden relative">
                <div className="h-full bg-primary w-[20%] rounded-full group-hover:bg-surface-tint transition-colors"></div>
              </div>
            </div>
            
            <div className="pt-5 border-t border-outline-variant/50">
              <button className="w-full bg-primary text-on-primary py-4 rounded-full text-base font-sans font-semibold hover:bg-surface-tint transition-colors shadow-md active:scale-95 duration-200">
                Ipagpatuloy
              </button>
            </div>
          </div>
        </section>

        {/* Past Results */}
        <section className="space-y-4">
          <h3 className="text-2xl font-display font-bold text-on-surface px-2">Nakaraang Resulta</h3>
          <div className="flex flex-col gap-4">
            
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer shadow-sm">
              <div className="w-14 h-14 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary shrink-0">
                <Globe className="w-7 h-7" />
              </div>
              <div className="flex-grow">
                <h4 className="text-base font-sans font-semibold text-on-surface">Araling Panlipunan</h4>
                <p className="text-xs font-sans text-on-surface-variant">Kasaysayan ng Pilipinas</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-display font-bold text-tertiary">85%</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer shadow-sm">
              <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                <Calculator className="w-7 h-7" />
              </div>
              <div className="flex-grow">
                <h4 className="text-base font-sans font-semibold text-on-surface">Matematika</h4>
                <p className="text-xs font-sans text-on-surface-variant">Fractions & Decimals</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-display font-bold text-primary">92%</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer shadow-sm">
              <div className="w-14 h-14 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary shrink-0">
                <Languages className="w-7 h-7" />
              </div>
              <div className="flex-grow">
                <h4 className="text-base font-sans font-semibold text-on-surface">Filipino</h4>
                <p className="text-xs font-sans text-on-surface-variant">Pandiwa at Pang-uri</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-display font-bold text-secondary">78%</span>
              </div>
            </div>

          </div>
        </section>
      </main>

      <BottomNav currentView="quizHub" navigate={navigate} />
    </div>
  );
}
