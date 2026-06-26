import { View } from '../types';
import { Zap, Sliders, Camera as CameraIcon } from 'lucide-react';

interface ScannerProps {
  navigate: (view: View) => void;
}

export function Scanner({ navigate }: ScannerProps) {
  return (
    <div className="h-full w-full relative overflow-hidden flex flex-col font-sans bg-black">
      {/* Camera Feed Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDfsQfgnquNKdTljJ9emtvaSODAWSrlcMsPsy_PTWhfMZF3qx46Pb_HooHgbu0XcXZrynlPlce86zF_6UZcK0EP6olKUToTPTHBelTzO8ymEQo9NRK1TUmViAflBVqE-HK43SxWotbtEYVaTWFLHGD-YlV_IahBTf5evoGrlEqI1qML0IY9_R273yc-8rlRrVRLQSFdnXHrn7_-i7KuUST2iHlDRxs7BIHU-n7DUgq3bQh9ygdTgkC8zCG6qJHtOgZAFSOMyAejiLw')" }}
      >
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
      </div>

      {/* Top Navigation Overlay */}
      <header className="relative z-10 flex justify-between items-center px-4 py-4 w-full text-white drop-shadow-md">
        <button 
          onClick={() => navigate('chat')}
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 hover:border-white/60 transition-all active:scale-95"
        >
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqwqGB5DmpaF6AyNLDmewaRbkTsB776lWri3eWRBHVjfZYQhSBy3jxePTMfwfLRvwDjOZjG-3QPVscbbMEQtneJfuwbJDSykE_PVQSTfApfWWnD9MyyWPaD08BuRNXDh7jP9dln1sA_nbt6VCXhaWcOaTBHL6rIHaGl94ujywV1sn9FNiUcaHcDaJ-j27pZ4Z_Ixy10HpmfSdZCezviiZT26fQ3AFw9vfWa5p2rVmQf4AgD7LzIskedLHAQj5EGqvW8c_FpBVpN_A" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </button>
        <div className="font-display text-xl font-bold tracking-tight drop-shadow-md">Scan Worksheet</div>
        <button className="p-3 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors flex items-center justify-center">
          <Zap className="w-6 h-6 text-white fill-current" />
        </button>
      </header>

      {/* Viewfinder Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full">
        {/* Guide Frame */}
        <div className="relative w-full max-w-[340px] aspect-[3/4] flex items-center justify-center transition-all duration-300">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] border-primary/90 rounded-tl-2xl drop-shadow-lg"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] border-primary/90 rounded-tr-2xl drop-shadow-lg"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] border-primary/90 rounded-bl-2xl drop-shadow-lg"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] border-primary/90 rounded-br-2xl drop-shadow-lg"></div>
          
          {/* Scan line */}
          <div className="absolute top-[10%] left-0 w-full h-[2px] bg-primary/60 rounded-full blur-[1px] animate-pulse-soft shadow-[0_0_10px_rgba(224,106,59,0.8)]"></div>

          {/* Text Detected Tag */}
          <div className="absolute bottom-10 bg-surface/95 text-on-surface px-4 py-2 rounded-full font-sans text-sm font-semibold flex items-center gap-2 border border-outline-variant shadow-lg backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary-container animate-pulse"></div>
            Text Detected
          </div>
        </div>

        <p className="mt-10 text-white font-sans text-base bg-black/50 px-6 py-2 rounded-full backdrop-blur-md border border-white/20">
          Align text within the frame
        </p>
      </main>

      {/* Bottom Controls */}
      <footer className="relative z-20 w-full bg-surface pt-8 px-8 pb-10 rounded-t-[2.5rem] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-surface-variant">
        
        <button 
          onClick={() => navigate('library')}
          className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-surface-container-high relative bg-surface-container active:scale-95 transition-transform shadow-sm"
        >
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4jcnjDEpTVll-3bF1K3NYGftXuNmQUwSPJIh8I8SS_qdY_dEsJJBWvZq3MIhWmpvUfHb1XAsTZzROnqacKVdJfkw4mg3hSnIR8H8qPnE1Upek7kW6wLD7RGqHz1BVlquxE8uZFZvqlLe-WCdQoEofPlo8sPN_cOWVl3x599twwVSaIt48fI9I35QtFtn8NeCoC3xscwu2Rch0hbiR9RO9b3EdF8m39Vvb2ZYA4DOVYJmF76FO-El22we_rqiwfHKcRhwfL7Cfm8k" 
            alt="Thumbnail" 
            className="w-full h-full object-cover"
          />
        </button>
        
        <button className="relative w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center border-[6px] border-surface shadow-[inset_0_4px_12px_rgba(0,0,0,0.1),0_4px_16px_rgba(87,66,59,0.15)] focus:outline-none group active:scale-95 transition-all">
          <div className="w-[68px] h-[68px] rounded-full bg-primary group-active:bg-[#c8552b] transition-all duration-200 shadow-md flex items-center justify-center">
            <CameraIcon className="text-on-primary w-8 h-8 opacity-0 group-active:opacity-100 transition-opacity" />
          </div>
        </button>
        
        <button className="w-16 h-16 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95 bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <Sliders className="w-7 h-7" />
        </button>
        
      </footer>
    </div>
  );
}
