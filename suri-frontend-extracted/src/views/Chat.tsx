import { View } from '../types';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { Moon, Flame, Camera, Mic, Volume2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ChatProps {
  navigate: (view: View) => void;
}

export function Chat({ navigate }: ChatProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div className="flex-1 flex flex-col bg-surface h-full relative">
      <TopBar title="Suri" showBack={false} onSettings={() => navigate('settings')} />
      
      {/* Session Status Sub-header */}
      <div className="bg-surface-container-lowest border-b border-surface-variant flex justify-between items-center px-4 py-2 shrink-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/30">
          <Moon className="w-4 h-4 text-on-surface-variant fill-current" />
          <span className="text-xs font-sans font-bold text-on-surface-variant uppercase tracking-widest">Suri Local</span>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded-lg">
          <Flame className="w-5 h-5 text-primary-container fill-current" />
          <span className="text-sm font-sans font-semibold text-primary-container">3 Araw</span>
        </div>
      </div>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 no-scrollbar pb-32">
        {/* System Message */}
        <div className="flex flex-col items-center justify-center mt-4 gap-4 animate-float">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKgbEKOUSaMBEfeROHN8qOMVMW9XkeOX-kLk02M-L0jJOOI2guQ5zkISiAlP17ATHhFFczR5w8opE66UFDqyPnq6rFti0dK5d2rQtf3_dDOLgOEvZTFvpbWSevE0qtUVaebnJCfX2fMVXaENhlJFT6lvxAVzK68m6cevopDwFgndjQ9SkxgGiBsnYw1dTeWcPJFczysv6vylWpam4bC6kSssp8NfWplmvIJHXAd3W_KtRr2VQ3DfZS_HXJy1ZC8rS93RShKblBq0A" 
            alt="Suri System" 
            className="h-[120px] w-auto object-contain drop-shadow-sm"
          />
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-2">
            <p className="text-sm font-sans text-on-surface-variant text-center max-w-[280px]">
              Socratic mode is active. Suri will guide you with questions.
            </p>
          </div>
        </div>

        {/* User Message */}
        <div className="self-end max-w-[85%] flex flex-col items-end gap-1 mt-4">
          <div className="bg-surface-container text-on-surface rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm border border-outline-variant/30">
            <p className="text-base font-sans leading-relaxed">Paano gumagana ang photosynthesis?</p>
          </div>
          <span className="text-[10px] font-sans text-on-surface-variant mr-1">10:42 AM</span>
        </div>

        {/* Suri Message */}
        <div className="self-start max-w-[92%] flex flex-col gap-2">
          <div className="flex gap-2 items-end">
            <div className="w-8 h-8 rounded-full bg-primary-container p-0.5 border border-outline-variant shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1yH_V9Yof7TBAKAMIqT3qIZPNdwb9vCAJJQ5T7GD-A0qoYiuWRc_KiI1Z3rfwxlc7TzjHQvRcX_5hIk5yKlXvvwasCaVqC3KHeUwz7yYSan-N_9MO604AFagqDkLWN3t8_bi0E8kkq50yAJSfysaPiLaMUwzaZgrTQ_xN8lBrDOkdhZHQBKDnpjX3-Mc3JJyvoJslQavQZc7BY_LsXrM4ghAZc69I56cfj2yxz1kmOrOw51MXl53MbcEM8dnWuna384ivo98Pg50" 
                alt="Suri Avatar" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="text-[10px] font-sans text-on-surface-variant">Suri • 10:43 AM</span>
          </div>
          
          <div className="bg-surface-container-lowest text-on-surface rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-outline-variant ml-10 relative">
            <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full"></div>
            
            <p className="text-base font-sans text-on-surface mb-4 pl-2">
              Magandang tanong! Ang photosynthesis ay ang napakahalagang proseso kung paano gumagawa ng pagkain ang mga halaman. Tingnan natin ang malinaw na diagram na ito upang mas maintindihan natin.
            </p>
            
            <div className="rounded-xl overflow-hidden border border-outline-variant mb-4 bg-surface flex flex-col items-center justify-center p-2 relative shadow-inner">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpHc1BriX2z3PgCcD9i3XU6QdgNGOzFE_YIQ-KCsdDAA6XnwaygnhWsa0hd1l568KE348koFdWTtIO9pZOR5IZIbHPeibIcwiZa9m1v4Gaqql1QqCNyOV9u17nZDu_92ba3ZMcRm9YRYbASQi3TGRQUELeiIYVz_-6gEUaAeG9tMUDLZax9-37MnADYzWN4W8FP_nzflHDyi_J7aVdnryD84ZaUyjgReJjc3KwDm8sUzG_s6njH4KMKcBo9Qq-iC9jx9InLols7X8" 
                alt="Diagram" 
                className="w-full h-auto rounded-lg"
              />
            </div>
            
            <p className="text-base font-sans font-medium text-on-surface pl-2">
              Ano sa tingin mo ang unang ginagawa ng halaman kapag nasisikatan ito ng araw?
            </p>
          </div>
          
          <div className="ml-10 mt-1">
            <button className="flex items-center gap-2 bg-secondary-container text-on-secondary-container hover:bg-surface-variant transition-colors px-4 py-1.5 rounded-full text-xs font-sans font-semibold border border-outline-variant/60 shadow-sm active:scale-95 duration-150">
              <Volume2 className="w-4 h-4" />
              Makinig
            </button>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-[72px] sm:bottom-[84px] w-full bg-surface/95 backdrop-blur-md border-t border-outline-variant px-4 py-3 flex items-end gap-3 z-20">
        <button 
          onClick={() => navigate('scanner')}
          className="p-3 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors shrink-0 mb-0.5"
        >
          <Camera className="w-6 h-6" />
        </button>
        
        <div className="flex-1 bg-surface-container rounded-2xl px-4 py-3 min-h-[52px] flex items-center border-b-2 border-transparent focus-within:border-outline transition-colors relative shadow-sm">
          <textarea 
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-base font-sans text-on-surface placeholder:text-on-surface-variant/70 outline-none resize-none overflow-hidden self-center" 
            placeholder="Magtanong kay Suri..." 
            rows={1}
            style={{ minHeight: '24px' }}
          />
        </div>
        
        <button className="w-12 h-12 bg-primary text-on-primary rounded-full hover:bg-surface-tint transition-colors shrink-0 shadow-sm flex items-center justify-center mb-0.5 active:scale-90 duration-150">
          <Mic className="w-6 h-6 fill-current" />
        </button>
      </div>

      <BottomNav currentView="chat" navigate={navigate} />
    </div>
  );
}
