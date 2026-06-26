import { View } from '../types';
import { ArrowLeft, Settings } from 'lucide-react';
import { useState } from 'react';

interface ActivityProps {
  navigate: (view: View) => void;
}

export function Activity({ navigate }: ActivityProps) {
  const [dropped, setDropped] = useState<Record<string, string | null>>({
    leaves: null,
    stem: null,
    roots: null
  });

  const handleDrop = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    setDropped(prev => ({ ...prev, [target]: data }));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAF8F5] h-full font-sans text-on-surface relative overflow-hidden">
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-40 w-full transition-colors duration-200">
        <div className="flex justify-between items-center px-4 py-3 w-full">
          <button 
            onClick={() => navigate('quizHub')}
            className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-display font-extrabold text-primary tracking-tight">Suri</h1>
          <button className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center active:scale-95">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto px-5 py-6 flex flex-col gap-6 no-scrollbar pb-24">
        {/* Instruction */}
        <section className="flex items-start gap-4">
          <div className="w-20 h-20 shrink-0 flex items-center justify-center animate-float">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxT_7PguXl3S3Aw7tA85EmIL0XojSp0ZqHmNeZEqfNxgUnua6iLp70u2RISxrryz2R-kjOq41amdviE6UlN3ocoU5qvMXOtvOW8iitasMDMMZ__lC7Zv4XdzmPnjqcO52StuX1XrhBMhBAt8vyedmB0d9lBW0PnvabiIt7OUR5ZR4QBRlwTPqi6daVMkbK0bll60oO5-EAicl5ljFNKbj-7Cb1mdP4QOQRndUUNfraKzFDMGW2O1oNnDgy0LH3rfbd9A54CdYJSLM" 
              alt="Suri Mascot" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="bg-[#F1ECE1] border-l-4 border-primary p-4 rounded-2xl rounded-tl-none shadow-sm mt-2 flex-grow">
            <p className="font-sans text-base text-on-surface leading-relaxed">
              I-drag ang tamang label sa bawat parte ng halaman.
            </p>
          </div>
        </section>

        {/* Interactive Area */}
        <section className="flex flex-col gap-5 bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant shadow-sm">
          {/* Visual Diagram Area */}
          <div className="relative aspect-square flex justify-center items-center rounded-2xl overflow-hidden border border-outline-variant bg-white p-2">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzjg7CJ2aCAADz-_9S-jK0ufetfyUrfI_PNIke-pDPDKBE5O7XGsGShj_KnwNy-0Y-rH34rRDl8JjO3ttMly99zUn6BIr8c1iomyp71qOT1daN2FjyjUjTJOW585XwRFz0vIjJ2HPDqBr1e3tc93IJmb2MRR1Fv_mMoIVb_mxcQOrGUtUyo2w7Jmuv1H3u_54G85nKgkNftYzfKdTOawQQ7w27egcq9ycr8fsLzKZ6k9iD9pGqphENQrPPFICOPQlAMjHwCnI9rZ0" 
              alt="Plant Diagram" 
              className="max-h-full object-contain"
            />
            
            {/* Drop Zones */}
            <div className="absolute top-[20%] right-[10%] w-[110px]">
              <div 
                className={`h-12 border-2 border-dashed rounded-xl flex items-center justify-center transition-colors ${dropped.leaves ? 'border-primary bg-secondary-container' : 'border-outline bg-[#F1ECE1]'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'leaves')}
              >
                {dropped.leaves ? (
                  <span className="font-sans font-bold text-sm text-on-surface capitalize">{dropped.leaves}</span>
                ) : (
                  <span className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-widest opacity-50 pointer-events-none">Dahon</span>
                )}
              </div>
            </div>
            
            <div className="absolute top-[50%] left-[10%] w-[110px]">
              <div 
                className={`h-12 border-2 border-dashed rounded-xl flex items-center justify-center transition-colors ${dropped.stem ? 'border-primary bg-secondary-container' : 'border-outline bg-[#F1ECE1]'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'stem')}
              >
                {dropped.stem ? (
                  <span className="font-sans font-bold text-sm text-on-surface capitalize">{dropped.stem}</span>
                ) : (
                  <span className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-widest opacity-50 pointer-events-none">Tangkay</span>
                )}
              </div>
            </div>
            
            <div className="absolute bottom-[15%] right-[10%] w-[110px]">
              <div 
                className={`h-12 border-2 border-dashed rounded-xl flex items-center justify-center transition-colors ${dropped.roots ? 'border-primary bg-secondary-container' : 'border-outline bg-[#F1ECE1]'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'roots')}
              >
                {dropped.roots ? (
                  <span className="font-sans font-bold text-sm text-on-surface capitalize">{dropped.roots}</span>
                ) : (
                  <span className="font-sans font-bold text-xs text-on-surface-variant uppercase tracking-widest opacity-50 pointer-events-none">Ugat</span>
                )}
              </div>
            </div>
          </div>

          {/* Draggable Items */}
          <div className="w-full flex flex-row flex-wrap gap-3 justify-center items-center bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm mt-2">
            <h3 className="w-full text-center font-display font-bold text-lg text-on-surface mb-2">Mga Label</h3>
            
            {['Tangkay', 'Ugat', 'Dahon'].map((label) => (
              <div 
                key={label}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', label)}
                className="cursor-grab active:cursor-grabbing bg-white border border-[#E5E0DA] rounded-xl px-6 py-3 shadow-sm font-sans font-bold text-sm text-on-surface hover:border-primary/50 transition-colors"
              >
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="flex justify-center mt-4">
          <button className="w-full bg-primary text-on-primary font-sans font-bold text-lg px-8 py-4 rounded-full shadow-md hover:bg-primary-container active:scale-95 transition-all">
            Check Answer
          </button>
        </section>
      </main>
    </div>
  );
}
