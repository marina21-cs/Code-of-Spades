import { useState } from 'react';
import { View } from '../types';
import { ArrowLeft, X, CheckCircle2, Circle, PenTool, Speech, BookOpen, Pointer } from 'lucide-react';

interface OnboardingProps {
  navigate: (view: View) => void;
}

export function Onboarding({ navigate }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else navigate('profileResult');
  };

  const renderStep1 = () => (
    <div className="flex-1 flex flex-col animate-float">
      <div className="flex flex-col items-center gap-6 mb-10 text-center">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKVjEg6BFemxOvIW2TxmLq8Lz7MUiWXgyPvBWMw9ad7xSmf-TBZVOChv9Z6vqb36Oo9Dz48l83duuRkK3gWjRj37BJmFBEvB5lOzkSzk0vjQBqMjaaG0W0u32wrabe8pjHx1h8ng41bpMix0H6x8dZnaPUG3osvnABoAMNb7I3nQiz3OdGnrZ2sw1Q9TIwk_6c8-sKQ-nkffObfHlZQfw_j_t7SXv_qNg3nMqJXk41laab2Qll6LkR2t-9mn-SfOMXfXKAZkewN9U" 
          alt="Suri Question" 
          className="w-40 h-40 object-contain drop-shadow-sm"
        />
        <h1 className="text-2xl font-display font-bold text-on-surface">Anong grade mo na?</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 mb-8">
        {['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map((grade) => (
          <button 
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all duration-200 border-2 ${
              selectedGrade === grade 
                ? 'bg-surface-container-low border-primary shadow-sm' 
                : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="text-sm font-sans font-medium text-on-surface">{grade}</span>
            {selectedGrade === grade ? (
              <CheckCircle2 className="w-5 h-5 text-primary fill-current" />
            ) : (
              <Circle className="w-5 h-5 text-outline-variant opacity-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex-1 flex flex-col animate-float">
      <div className="flex flex-col items-start gap-4 mb-8">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBhJLmxUdYng5Qqx8qv4OSQS0GybbZMFC31UAISjh8NnuiIg3KnxbdVfsi8orAGgPKDlTAzXM5hNEXZnkLbL3_Ot_JWBldHaNNrlbtCkrdik1SoQe3woA--_n6xk2Z4qaA6FhA3ESx3oqmWc99Ix-yPl6rCcPxBOzgAEtnZv4-xD2eeeJPBMOXrvqcQ-M-q6lZ6otpWcc2uj5tk5liNqJWZOUzifIp9BOjLABfp7Wf3NFyvufiHL571UZHH5Lo9TM8umZd2twqP5c" 
          alt="Suri Ask" 
          className="w-24 h-24 object-contain"
        />
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl rounded-tl-none p-4 shadow-sm relative">
          <p className="text-base font-sans text-on-surface">Paano mo gustong matuto tungkol sa Eclipse?</p>
          <div className="absolute -left-2 top-0 w-4 h-4 bg-surface-container-lowest border-l border-t border-outline-variant -skew-x-[30deg]"></div>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1 mb-8">
        {[
          { id: 'visual', icon: PenTool, title: 'Gusto ko ng Larawan at Diagram', desc: 'May kasamang iginuhit na mga hugis' },
          { id: 'audio', icon: Speech, title: 'Makinig sa Paliwanag', desc: 'Pakikinggan ang boses ni Suri' },
          { id: 'text', icon: BookOpen, title: 'Magbasa ng Teksto at Listahan', desc: 'Malilinaw na bullet points at talata' },
          { id: 'interactive', icon: Pointer, title: 'Maglaro at Sumagot ng Quiz', desc: 'May interactive na pagpindot at pagsagot' },
        ].map((option) => {
          const Icon = option.icon;
          const isSelected = selectedStyle === option.id;
          return (
            <button 
              key={option.id}
              onClick={() => setSelectedStyle(option.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 border-2 ${
                isSelected 
                  ? 'bg-surface-container-low border-primary shadow-sm' 
                  : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'
              }`}
            >
              <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${
                isSelected ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-sans font-bold text-on-surface mb-0.5">{option.title}</h3>
                <p className="text-xs font-sans text-on-surface-variant">{option.desc}</p>
              </div>
              {isSelected && <CheckCircle2 className="w-6 h-6 text-primary fill-current ml-auto" />}
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex-1 flex flex-col items-center text-center animate-float-slow py-4">
      <img 
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHyiPjnzKsMxxDer5tBYC_sDcKK4tAiWa7hiUnpRtzQtO-cx6DTs1tQ8AYXeiyXNwtfFH-zc3N-FsWlMHD3SMaFTQJioqAmZ4pM1gDmOGswgh6NHgGAMNoaVe9hEOZB3h8xuVCnXUhvzZOHk7w_qxlEjBWinrxhg7adOcvjVD69kDmgxBYKI800kfduZJpF2268VoeZrZrUhmFe0WbgDXI5Wm1QQ899NpsTLr28m1bzBUNeXXssza14DchV-ZNYXv7burn8rGyuoU" 
        alt="Suri Wave" 
        className="w-32 h-32 object-contain mb-6"
      />
      <h1 className="text-2xl font-display font-bold text-on-background max-w-sm mb-4 leading-tight">
        Let's see how you learn best! Does seeing a picture help you understand this?
      </h1>
      <p className="text-base font-sans text-on-surface-variant mb-6">Concept: How a plant grows</p>

      <div className="bg-[#F1ECE1]/50 w-full rounded-2xl border border-outline-variant p-6 flex flex-col items-center mb-8 relative">
        <div className="w-full aspect-video bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex items-center justify-center mb-4">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuoiTLG2lgOSMTvT7r5JeHY6F_KxxowOn0Xo3SikYkwcq0eSpgt3xblDN-Ao8iFkBMKC0tUGP9p7QOZ1GWbhMDUMH2AY_ncSP0G2KvJ-DSyF8pj3i3jy73WMYYT2Fiv56ooBIpHEnn129yoiD32dCfeJH4qpaTPFMkLClxy6CVU7SKKbIaOzYNe7TOAA_XM1dBKiMQUG9ye79nzfZFKMRCWnpxEJUyL64MIaG6MFEtNzEvYoOzh-ZO0WfFCMJN_urqYu7kX1JLhVc" 
            alt="Plant Growth Diagram"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-sm font-sans text-on-surface-variant">Seed → Sprout → Plant</p>
      </div>
      
      <div className="flex flex-col w-full gap-4 mt-auto pb-4">
         <button 
          onClick={handleNext}
          className="w-full bg-surface-container-low hover:bg-surface-variant text-on-background py-4 rounded-full font-display font-bold text-lg border border-outline-variant transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <X className="w-6 h-6" /> Not really
        </button>
        <button 
          onClick={handleNext}
          className="w-full bg-primary hover:bg-primary-container text-on-primary py-4 rounded-full font-display font-bold text-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-6 h-6" /> Yes, I like this!
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="flex justify-between items-center px-4 py-4 w-full">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate('landing')}
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-sans font-semibold text-on-surface-variant uppercase tracking-wider">
          Hakbang {step} ng 3
        </span>
        <button 
          onClick={() => navigate('chat')}
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-6 pb-8 flex flex-col overflow-y-auto no-scrollbar">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {step < 3 && (
          <div className="mt-auto flex flex-col gap-4 pt-4">
            <button 
              onClick={handleNext}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-sans font-semibold text-lg hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              Susunod
            </button>
            {step === 2 && (
              <button 
                onClick={handleNext}
                className="w-full text-center py-2 text-on-surface-variant text-sm font-sans font-medium hover:text-on-surface transition-colors underline decoration-outline-variant underline-offset-4"
              >
                Laktawan at gamitin ang Mixed mode
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
