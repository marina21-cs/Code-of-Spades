import { View } from '../types';
import { Palette, AlignLeft, Map as MapIcon } from 'lucide-react';

interface ProfileResultProps {
  navigate: (view: View) => void;
}

export function ProfileResult({ navigate }: ProfileResultProps) {
  return (
    <div className="h-full flex flex-col font-sans bg-background text-on-background relative overflow-y-auto no-scrollbar">
      <main className="flex-grow flex flex-col items-center justify-start p-6 pt-12 w-full relative z-10 pb-20">
        <div className="w-full max-w-2xl flex flex-col items-center text-center gap-6 animate-float">
          <div className="w-48 h-48 relative flex items-center justify-center">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyEp9-afX_oLFUZx7AHu3stUxQdRkLRjmmppohU3lzYQ5k9PzgkG-yBDOGLZ2NfNKxRHA734GD2sEq8fpldTGE3JaMLnYcb3jUebZj7FC707VLMXsMiT1tRjBTDCvnnnc7KPPfUp8hrZNCep0Q9FJpCz6NfmVxinoDDsVGrDNPbNT_fcc6swfgXW-dZ0uV5PVMC-sG6JKG3I7-kbeRUNDKnxTQC3u3MCinikon_jZ0NPIdBpWBgWGblDXXExs9hxaqcjMQLrt7b3E" 
              alt="Visual Learner" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-sans font-semibold text-primary tracking-widest uppercase opacity-80">Ang Iyong Estilo</span>
            <h1 className="text-3xl font-display font-extrabold text-on-surface leading-tight">
              Ikaw ay isang <span className="text-primary relative inline-block">Visual Learner!</span>
            </h1>
          </div>
          
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 w-full text-left flex flex-col gap-4 shadow-sm">
            <p className="text-base font-sans text-on-surface-variant leading-relaxed">
              Mas natututo ka kapag nakikita mo ang impormasyon. Madali mong naiintindihan ang mga konsepto kapag ginagamitan ng mga larawan, tsart, at mga kulay.
            </p>
            <div className="h-px w-full bg-outline-variant/30 my-2"></div>
            <h3 className="text-xl font-display font-bold text-on-surface mb-2">Paano ito makakatulong sa app?</h3>
            <ul className="flex flex-col gap-5">
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F1ECE1] flex items-center justify-center text-primary">
                  <Palette className="w-6 h-6 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-sans font-bold text-on-surface">Mas maraming visual aids</span>
                  <span className="text-sm font-sans text-on-surface-variant opacity-80">Gagamit kami ng mas maraming diagrams at kulay sa mga aralin.</span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F1ECE1] flex items-center justify-center text-primary">
                  <AlignLeft className="w-6 h-6 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-sans font-bold text-on-surface">Maikling teksto</span>
                  <span className="text-sm font-sans text-on-surface-variant opacity-80">Ang mga mahahabang paliwanag ay hahatiin sa mas madaling basahin na format.</span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F1ECE1] flex items-center justify-center text-primary">
                  <MapIcon className="w-6 h-6 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-sans font-bold text-on-surface">Mind Maps</span>
                  <span className="text-sm font-sans text-on-surface-variant opacity-80">Magkakaroon ng mga visual na buod para sa mga kumplikadong paksa.</span>
                </div>
              </li>
            </ul>
          </div>
          
          <button 
            onClick={() => navigate('chat')}
            className="w-full mt-4 px-8 py-4 bg-primary text-on-primary rounded-full text-lg font-sans font-bold hover:bg-primary-container transition-all active:scale-95 shadow-md"
          >
            Tuloy sa Pag-aaral
          </button>
        </div>
      </main>
    </div>
  );
}
