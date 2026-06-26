import { View } from '../types';
import { X, MoreVertical, Circle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface QuizQuestionProps {
  navigate: (view: View) => void;
}

export function QuizQuestion({ navigate }: QuizQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const options = [
    "A. Nagsimula sa wakas, bumalik sa simula, at nagtapos sa gitna.",
    "B. Ipinakilala ang mga tauhan, nagkaroon ng problema, at humanap ng solusyon.",
    "C. Natagpuan ang solusyon bago pa man malaman ang problema."
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#FAF8F5] text-on-background h-full relative overflow-hidden">
      
      {/* Top Navigation / Progress */}
      <header className="w-full flex flex-col gap-4 px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('quizHub')}
            className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-sm font-sans font-semibold text-on-surface-variant">
            Tanong 3 ng 10
          </div>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-colors">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full px-2">
          <div className="bg-[#F1ECE1] rounded-full height-3 overflow-hidden h-3">
            <div className="bg-primary-container h-full rounded-full transition-all duration-300" style={{ width: '30%' }}></div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 pb-24 flex flex-col gap-8 no-scrollbar">
        {/* Context & Mascot */}
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZFH-9xB75TvyVP-3zc4CxZ4q1DTLwp9FjWTK8ofA0U6-ZqyDppwDdiS9D0axJx4RMVY3bpapZqloC9BLyOFU5LsqkxSahC2XiFfjf7hXWGQSEr-UNZIvD5k8-teDpBcGh_s-3O31M-oGYLurnDEXdbbuphyxKn4PWnR6KeC7MhwIBEk2s4EVVXnR_YHCJd6x3wl2emL08MGMq3uqjwDs1PTa8b86S9O6R5B9ql9Nioq8juYZYqrVutUs69tBqV9AFu6kLBYmE46o" 
              alt="Suri Thinking" 
              className="w-24 h-24 object-contain animate-float"
            />
          </div>
          <div className="bg-[#F1ECE1] p-4 rounded-2xl rounded-tl-none border-l-4 border-primary shadow-sm mt-2">
            <p className="font-sans text-base text-on-surface leading-relaxed">
              "Tingnan natin kung paano mo maiuugnay ang mga ideyang ito. Isipin ang mga pangyayari sa kuwento."
            </p>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-[#E5E0DA] rounded-3xl p-6 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-on-surface mb-4 leading-snug">
            Alin sa mga sumusunod ang nagpapakita ng tamang pagkakasunod-sunod ng mga pangyayari?
          </h1>
          <p className="font-sans text-base text-on-surface-variant mb-8">
            Basahin nang mabuti ang bawat opsyon at piliin ang pinakaangkop na sagot batay sa iyong binasa.
          </p>
          
          {/* Options */}
          <div className="flex flex-col gap-4">
            {options.map((option, index) => {
              const isSelected = selectedOption === index;
              return (
                <button 
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={`w-full text-left font-sans text-base p-4 rounded-2xl border-2 flex items-start gap-4 transition-all duration-200 ${
                    isSelected 
                      ? 'border-primary bg-[#F1ECE1] text-on-surface shadow-sm' 
                      : 'border-[#E5E0DA] bg-white text-on-surface hover:border-primary-container hover:bg-surface-container-low'
                  }`}
                >
                  <span className="flex-1 leading-relaxed">{option}</span>
                  <div className="shrink-0 mt-1">
                    {isSelected ? (
                      <CheckCircle2 className="w-6 h-6 text-primary fill-current" />
                    ) : (
                      <Circle className="w-6 h-6 text-outline-variant" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Action Button (Fixed at bottom) */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#FAF8F5] to-transparent pointer-events-none">
        <div className="flex justify-end pointer-events-auto">
          <button 
            disabled={selectedOption === null}
            className="bg-primary text-on-primary font-sans font-semibold text-lg py-4 px-10 rounded-full hover:bg-primary-container transition-all flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            Isumite
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
