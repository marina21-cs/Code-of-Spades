import { MessageCircle, Library, Brain, User } from 'lucide-react';
import { View } from '../types';

interface BottomNavProps {
  currentView: View;
  navigate: (view: View) => void;
}

export function BottomNav({ currentView, navigate }: BottomNavProps) {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'library', label: 'Aklatan', icon: Library },
    { id: 'quizHub', label: 'Pagsusulit', icon: Brain },
    { id: 'settings', label: 'Ako', icon: User },
  ] as const;

  return (
    <nav className="bg-surface/95 backdrop-blur-md border-t border-outline-variant/50 fixed sm:absolute bottom-0 left-0 w-full z-50 flex justify-around items-center pt-2 pb-4 px-6 rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id || 
                         (tab.id === 'library' && currentView === 'subject') ||
                         (tab.id === 'quizHub' && currentView === 'quizQuestion');
        
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id as View)}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-all duration-300 rounded-full ${
              isActive 
                ? 'bg-primary-container text-on-primary-container scale-100 opacity-100' 
                : 'text-on-surface-variant hover:text-primary scale-95 opacity-80'
            }`}
          >
            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-xs font-sans font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
